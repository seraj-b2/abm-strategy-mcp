import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { STAGE_ORDER, type Stage } from "../lib/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STAGES_DIR = path.join(__dirname, "stages");

// Stages with a ported .md file under src/resources/stages/. Stages not yet
// listed here are unported (MVP covers 01-03) - reading their resource
// returns a placeholder rather than failing outright, so advance_stage/
// get_stage_context still work end-to-end through the pipeline definition.
const PORTED_STAGES: Stage[] = ["01-project-setup", "02-main-inputs", "03-market-analysis"];

export const RESOURCES = STAGE_ORDER.map((stage) => ({
  uri: `abm://stages/${stage}`,
  name: `Stage: ${stage}`,
  description: PORTED_STAGES.includes(stage)
    ? `Analytical Process instructions for ${stage}.`
    : `${stage} has not been ported to this server yet.`,
  mimeType: "text/markdown",
}));

export async function readResource(uri: string) {
  const match = uri.match(/^abm:\/\/stages\/(.+)$/);
  if (!match) {
    throw new Error(`Unknown resource URI: ${uri}`);
  }
  const stage = match[1] as Stage;

  if (!STAGE_ORDER.includes(stage)) {
    throw new Error(`Unknown stage: ${stage}`);
  }

  if (!PORTED_STAGES.includes(stage)) {
    return {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text: `# Stage: ${stage}\n\nThis stage has not been ported from the original abm-strategy-presentation-v5 plugin yet. Only 01-03 are implemented in this MVP. Use the original plugin's skills/${stage}/SKILL.md Process section as a stand-in, and follow the same create_draft/edit_draft/redo_draft/approve_draft loop as stage 03.`,
        },
      ],
    };
  }

  const filePath = path.join(STAGES_DIR, `${stage}.md`);
  const text = await fs.readFile(filePath, "utf-8");
  return {
    contents: [{ uri, mimeType: "text/markdown", text }],
  };
}
