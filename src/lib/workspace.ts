import { promises as fs } from "node:fs";
import path from "node:path";
import { STAGE_ORDER, type ProjectState, type Stage } from "./types.js";

// Root of all client workspaces. Mirrors the plugin's abm_strategy/ convention,
// created under the user's home directory so Claude Desktop always finds the
// same place regardless of its own working directory.
export const WORKSPACE_ROOT = path.join(
  process.env.ABM_WORKSPACE_ROOT ?? path.join(process.cwd(), "abm_strategy")
);

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function clientDir(slug: string): string {
  return path.join(WORKSPACE_ROOT, slug);
}

export function projectJsonPath(slug: string): string {
  return path.join(clientDir(slug), "project.json");
}

export function subDir(slug: string, sub: "inputs" | "staging" | "archive" | "outputs"): string {
  return path.join(clientDir(slug), sub);
}

export function logPath(slug: string, name: "input-log.md" | "assumptions.md" | "project-log.md"): string {
  return path.join(clientDir(slug), name);
}

export async function projectExists(slug: string): Promise<boolean> {
  try {
    await fs.access(projectJsonPath(slug));
    return true;
  } catch {
    return false;
  }
}

export async function readProject(slug: string): Promise<ProjectState> {
  const raw = await fs.readFile(projectJsonPath(slug), "utf-8");
  return JSON.parse(raw) as ProjectState;
}

// Atomic write: write to a temp file in the same directory, then rename.
// Rename is atomic on the same filesystem, which protects project.json
// against corruption if the process is killed mid-write (e.g. Desktop
// force-quit between sessions).
export async function writeProject(state: ProjectState): Promise<void> {
  const finalPath = projectJsonPath(state.client_slug);
  const tmpPath = `${finalPath}.tmp-${process.pid}`;
  await fs.writeFile(tmpPath, JSON.stringify(state, null, 2), "utf-8");
  await fs.rename(tmpPath, finalPath);
}

export async function appendLog(
  slug: string,
  name: "input-log.md" | "assumptions.md" | "project-log.md",
  line: string
): Promise<void> {
  await fs.appendFile(logPath(slug, name), line.endsWith("\n") ? line : `${line}\n`, "utf-8");
}

export function timestamp(): string {
  return new Date().toISOString();
}

export function nextGate(state: ProjectState): Stage | null {
  for (const stage of STAGE_ORDER) {
    if (state.stage_gates[stage] !== "completed") return stage;
  }
  return null;
}

export async function listClientSlugs(): Promise<string[]> {
  try {
    const entries = await fs.readdir(WORKSPACE_ROOT, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}
