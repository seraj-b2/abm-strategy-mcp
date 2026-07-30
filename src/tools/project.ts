import { promises as fs } from "node:fs";
import { z } from "zod";
import { STAGE_ORDER, type ProjectState, type Stage } from "../lib/types.js";
import {
  appendLog,
  clientDir,
  listClientSlugs,
  logPath,
  nextGate,
  projectExists,
  readProject,
  slugify,
  subDir,
  timestamp,
  writeProject,
} from "../lib/workspace.js";

const emptyGates = () =>
  Object.fromEntries(STAGE_ORDER.map((s) => [s, "pending"])) as Record<Stage, "pending">;

export const createProjectSchema = z.object({
  client_name: z.string().min(1),
  project_inputs: z
    .object({
      total_quarterly_budget: z.string().optional(),
      quarterly_performance_budget: z.string().optional(),
      website: z.string().optional(),
      target_geography: z.string().optional(),
      constraints: z.string().optional(),
    })
    .optional(),
});

export async function createProject(args: z.infer<typeof createProjectSchema>) {
  const slug = slugify(args.client_name);

  if (await projectExists(slug)) {
    return {
      error: `A project for slug "${slug}" already exists. Use get_project_status to resume it instead of creating a new one.`,
    };
  }

  for (const dir of ["inputs", "staging", "archive", "outputs"] as const) {
    await fs.mkdir(subDir(slug, dir), { recursive: true });
  }

  const state: ProjectState = {
    client_name: args.client_name,
    client_slug: slug,
    created: timestamp().slice(0, 10),
    project_inputs: {
      total_quarterly_budget: args.project_inputs?.total_quarterly_budget ?? "",
      quarterly_performance_budget: args.project_inputs?.quarterly_performance_budget ?? "",
      website: args.project_inputs?.website ?? "",
      target_geography: args.project_inputs?.target_geography ?? "",
      constraints: args.project_inputs?.constraints ?? "",
    },
    input_files: [],
    stage_gates: emptyGates(),
    current_skill: STAGE_ORDER[0],
    draft_versions: {},
  };

  await writeProject(state);

  for (const name of ["input-log.md", "assumptions.md", "project-log.md"] as const) {
    await fs.writeFile(
      logPath(slug, name),
      `# ${name}\n\nProject: ${args.client_name} (${slug})\nCreated: ${state.created}\n\n`,
      "utf-8"
    );
  }
  await appendLog(slug, "project-log.md", `[${timestamp()}] project workspace created`);

  return {
    client_slug: slug,
    client_name: args.client_name,
    workspace: clientDir(slug),
    stage_gates: state.stage_gates,
    current_skill: state.current_skill,
  };
}

export async function listProjects() {
  const slugs = await listClientSlugs();
  const projects = [];
  for (const slug of slugs) {
    if (!(await projectExists(slug))) continue;
    const state = await readProject(slug);
    const completedCount = Object.values(state.stage_gates).filter((g) => g === "completed").length;
    projects.push({
      client_slug: state.client_slug,
      client_name: state.client_name,
      current_skill: state.current_skill,
      completed_stages: completedCount,
      total_stages: STAGE_ORDER.length,
    });
  }
  return { projects };
}

export const getProjectStatusSchema = z.object({
  client_slug: z.string().min(1),
});

export async function getProjectStatus(args: z.infer<typeof getProjectStatusSchema>) {
  if (!(await projectExists(args.client_slug))) {
    return { error: `No project found for client_slug "${args.client_slug}". Call list_projects or create_project.` };
  }
  const state = await readProject(args.client_slug);
  const next = nextGate(state);
  return {
    ...state,
    next_gate: next,
    pipeline_complete: next === null,
  };
}
