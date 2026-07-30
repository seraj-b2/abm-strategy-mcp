import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { appendLog, projectExists, readProject, subDir, timestamp, writeProject } from "../lib/workspace.js";
import { appendTextInput, readTextInputs } from "../lib/textinput.js";

export const recordTextInputSchema = z.object({
  client_slug: z.string().min(1),
  skill: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
});

export async function recordTextInput(args: z.infer<typeof recordTextInputSchema>) {
  if (!(await projectExists(args.client_slug))) {
    return { error: `No project found for client_slug "${args.client_slug}".` };
  }
  const ts = timestamp();
  await appendTextInput(args.client_slug, {
    timestamp: ts,
    skill: args.skill,
    question: args.question,
    answer: args.answer,
  });
  await appendLog(args.client_slug, "input-log.md", `[${ts}] (${args.skill}) text input recorded: "${args.question}"`);
  return { recorded: true, timestamp: ts };
}

export const recordFileInputSchema = z.object({
  client_slug: z.string().min(1),
  source_path: z.string().min(1),
  note: z.string().min(1),
});

export async function recordFileInput(args: z.infer<typeof recordFileInputSchema>) {
  if (!(await projectExists(args.client_slug))) {
    return { error: `No project found for client_slug "${args.client_slug}".` };
  }
  const state = await readProject(args.client_slug);
  const filename = path.basename(args.source_path);
  const destPath = path.join(subDir(args.client_slug, "inputs"), filename);

  try {
    await fs.rename(args.source_path, destPath);
  } catch {
    // cross-device or already-in-place: fall back to copy
    await fs.copyFile(args.source_path, destPath);
  }

  state.input_files.push({ name: filename, status: "received", note: args.note });
  await writeProject(state);

  const ts = timestamp();
  await appendLog(args.client_slug, "input-log.md", `[${ts}] file received: ${filename} — ${args.note}`);

  return { recorded: true, filename, path: destPath };
}

export const checkKnownSchema = z.object({
  client_slug: z.string().min(1),
  keys: z.array(z.string().min(1)).min(1),
});

export async function checkKnown(args: z.infer<typeof checkKnownSchema>) {
  if (!(await projectExists(args.client_slug))) {
    return { error: `No project found for client_slug "${args.client_slug}".` };
  }
  const state = await readProject(args.client_slug);
  const textInputs = await readTextInputs(args.client_slug);
  const inputFiles = state.input_files.map((f) => f.name);

  // Normalize separators so free-text keys like "target geography" match
  // project_inputs' snake_case keys like "target_geography".
  const normalize = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, " ").trim();

  const result: Record<string, { known: boolean; source?: string; value?: string }> = {};
  for (const key of args.keys) {
    const lowerKey = normalize(key);

    const projectInputMatch = Object.entries(state.project_inputs).find(
      ([k, v]) => normalize(k).includes(lowerKey) && v
    );
    if (projectInputMatch) {
      result[key] = { known: true, source: "project_inputs", value: projectInputMatch[1] };
      continue;
    }

    const textMatch = textInputs.find(
      (t) => normalize(t.question).includes(lowerKey) || normalize(t.answer).includes(lowerKey)
    );
    if (textMatch) {
      result[key] = { known: true, source: `text-input.md (${textMatch.skill})`, value: textMatch.answer };
      continue;
    }

    const fileMatch = inputFiles.find((f) => normalize(f).includes(lowerKey));
    if (fileMatch) {
      result[key] = { known: true, source: `inputs/${fileMatch}` };
      continue;
    }

    result[key] = { known: false };
  }

  return result;
}
