// Drives the server over stdio through the MVP flow, simulating what
// Claude Desktop's tool calls would do, to validate logic before wiring
// into Desktop itself. Not part of the shipped server.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rm } from "node:fs/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const workspaceRoot = path.join(root, "test-workspace");

await rm(workspaceRoot, { recursive: true, force: true });

async function newClient() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(root, "dist", "index.js")],
    env: { ...process.env, ABM_WORKSPACE_ROOT: workspaceRoot },
  });
  const client = new Client({ name: "smoke-test", version: "0.0.1" }, { capabilities: {} });
  await client.connect(transport);
  return client;
}

async function callTool(client, name, args) {
  const result = await client.callTool({ name, arguments: args });
  const text = result.content?.[0]?.text ?? "";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  console.log(`\n--- ${name}(${JSON.stringify(args)}) ---`);
  console.log(JSON.stringify(parsed, null, 2));
  return parsed;
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`\nASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
}

// --- Session 1: create project, run stages 01-03 to completed ---
let client = await newClient();

const created = await callTool(client, "create_project", {
  client_name: "Acme Robotics",
  project_inputs: {
    total_quarterly_budget: "$200k",
    quarterly_performance_budget: "$80k",
    website: "acmerobotics.example.com",
    target_geography: "North America",
    constraints: "No competitor brand bidding",
  },
});
assert(created.client_slug === "acme-robotics", "slug should be acme-robotics");

let adv = await callTool(client, "advance_stage", { client_slug: "acme-robotics" });
assert(adv.stage === "01-project-setup", "first stage should be 01-project-setup");

await callTool(client, "record_text_input", {
  client_slug: "acme-robotics",
  skill: "01-project-setup",
  question: "Any constraints?",
  answer: "No competitor brand bidding; legal review required for ROI claims.",
});
await callTool(client, "set_stage_gate", {
  client_slug: "acme-robotics",
  stage: "01-project-setup",
  status: "completed",
});

adv = await callTool(client, "advance_stage", { client_slug: "acme-robotics" });
assert(adv.stage === "02-main-inputs", "second stage should be 02-main-inputs");

const known = await callTool(client, "check_known", {
  client_slug: "acme-robotics",
  keys: ["target geography", "messaging-framework"],
});
assert(known["target geography"].known === true, "target geography should already be known from project_inputs");
assert(known["messaging-framework"].known === false, "messaging-framework should not be known yet");

await callTool(client, "record_text_input", {
  client_slug: "acme-robotics",
  skill: "02-main-inputs",
  question: "messaging-framework provided?",
  answer: "Not yet available; proceeding without it for now, will supply later.",
});
await callTool(client, "set_stage_gate", {
  client_slug: "acme-robotics",
  stage: "02-main-inputs",
  status: "completed",
});

adv = await callTool(client, "advance_stage", { client_slug: "acme-robotics" });
assert(adv.stage === "03-market-analysis", "third stage should be 03-market-analysis");

const ctx = await callTool(client, "get_stage_context", {
  client_slug: "acme-robotics",
  stage: "03-market-analysis",
});
assert(ctx.resource_uri === "abm://stages/03-market-analysis", "resource_uri should point at stage 03");

const resource = await client.readResource({ uri: "abm://stages/03-market-analysis" });
assert(resource.contents[0].text.includes("Market Landscape"), "stage 03 resource should contain framework text");

const draft1 = await callTool(client, "create_draft", {
  client_slug: "acme-robotics",
  stage: "03-market-analysis",
  content: "# Market Analysis v1\n\nA. Market Landscape...\nB. Industry Trends...",
});
assert(draft1.version === 1, "first draft should be version 1");

// Exercise redo (new direction) then approve
const draft2 = await callTool(client, "redo_draft", {
  client_slug: "acme-robotics",
  stage: "03-market-analysis",
  new_content: "# Market Analysis v2\n\nRevised with deeper vertical trends section.",
  reason: "user wanted more vertical-specific detail",
});
assert(draft2.new_version === 2, "redo should bump to version 2");

const approved = await callTool(client, "approve_draft", {
  client_slug: "acme-robotics",
  stage: "03-market-analysis",
});
assert(approved.verified === true, "approve should verify successfully");
assert(approved.gate_status === "completed", "gate should be completed after approve");

await client.close();

// --- Session 2: simulate Claude Desktop restart, confirm resume ---
client = await newClient();

const status = await callTool(client, "get_project_status", { client_slug: "acme-robotics" });
assert(status.next_gate === "04-category-maturity-analysis", "resume should land on stage 04");
assert(status.stage_gates["03-market-analysis"] === "completed", "stage 03 gate should be completed");

const adv2 = await callTool(client, "advance_stage", { client_slug: "acme-robotics" });
assert(adv2.stage === "04-category-maturity-analysis", "advance_stage after restart should also report stage 04");

const known2 = await callTool(client, "check_known", {
  client_slug: "acme-robotics",
  keys: ["target geography"],
});
assert(known2["target geography"].known === true, "known inputs should survive restart without re-asking");

await client.close();

console.log("\n\nALL ASSERTIONS PASSED");
