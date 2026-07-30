import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { STAGE_DEPENDENCIES, STAGE_FILENAMES, STAGE_ORDER } from "../lib/types.js";
import { projectExists, readProject, subDir } from "../lib/workspace.js";
import { listInputFiles, readTextInputs } from "../lib/textinput.js";

export const getStageContextSchema = z.object({
  client_slug: z.string().min(1),
  stage: z.enum(STAGE_ORDER),
});

export async function getStageContext(args: z.infer<typeof getStageContextSchema>) {
  if (!(await projectExists(args.client_slug))) {
    return { error: `No project found for client_slug "${args.client_slug}".` };
  }
  const state = await readProject(args.client_slug);
  const { stage } = args;

  const upstreamStages = STAGE_DEPENDENCIES[stage];
  const upstreamOutputs: Record<string, { path: string; content: string } | { missing: true }> = {};

  for (const upstream of upstreamStages) {
    const filename = STAGE_FILENAMES[upstream];
    const outputPath = path.join(subDir(args.client_slug, "outputs"), filename);
    try {
      const content = await fs.readFile(outputPath, "utf-8");
      upstreamOutputs[upstream] = { path: outputPath, content };
    } catch {
      upstreamOutputs[upstream] = { missing: true };
    }
  }

  const missingUpstream = Object.entries(upstreamOutputs)
    .filter(([, v]) => "missing" in v)
    .map(([k]) => k);

  const textInputs = await readTextInputs(args.client_slug);
  const inputFiles = await listInputFiles(args.client_slug);

  return {
    stage,
    stage_number: STAGE_ORDER.indexOf(stage) + 1,
    total_stages: STAGE_ORDER.length,
    gate_status: state.stage_gates[stage],
    resource_uri: `abm://stages/${stage}`,
    resource_note: "Read this resource for the analytical framework/Process instructions for this stage.",
    project_inputs: state.project_inputs,
    known_text_inputs: textInputs,
    input_files: inputFiles,
    upstream_outputs: upstreamOutputs,
    warnings:
      missingUpstream.length > 0
        ? [
            `Upstream stage output(s) not found in outputs/: ${missingUpstream.join(", ")}. ` +
              `Warn the user before proceeding — this stage's inputs per its dependency list are incomplete.`,
          ]
        : [],
  };
}
