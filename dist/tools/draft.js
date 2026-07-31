import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { STAGE_FILENAMES, STAGE_ORDER } from "../lib/types.js";
import { appendLog, projectExists, readProject, subDir, timestamp, writeProject } from "../lib/workspace.js";
function stagingPath(slug, stage) {
    return path.join(subDir(slug, "staging"), STAGE_FILENAMES[stage]);
}
function outputsPath(slug, stage) {
    return path.join(subDir(slug, "outputs"), STAGE_FILENAMES[stage]);
}
function archivePath(slug, stage, version, ts) {
    const filename = STAGE_FILENAMES[stage];
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    const safeTs = ts.replace(/[:.]/g, "-");
    return path.join(subDir(slug, "archive"), `${base}-v${version}-${safeTs}${ext}`);
}
async function fileExists(p) {
    try {
        await fs.access(p);
        return true;
    }
    catch {
        return false;
    }
}
export const createDraftSchema = z.object({
    client_slug: z.string().min(1),
    stage: z.enum(STAGE_ORDER),
    content: z.string().min(1),
});
export async function createDraft(args) {
    if (!(await projectExists(args.client_slug))) {
        return { error: `No project found for client_slug "${args.client_slug}".` };
    }
    const state = await readProject(args.client_slug);
    const staged = stagingPath(args.client_slug, args.stage);
    if (await fileExists(staged)) {
        return {
            error: `A staged draft already exists for "${args.stage}". Call get_draft to see it, then use edit_draft or redo_draft — not create_draft again.`,
        };
    }
    await fs.writeFile(staged, args.content, "utf-8");
    state.draft_versions[args.stage] = 1;
    state.stage_gates[args.stage] = "partial";
    await writeProject(state);
    const ts = timestamp();
    await appendLog(args.client_slug, "project-log.md", `[${ts}] ${args.stage}: draft v1 created in staging`);
    return { stage: args.stage, version: 1, staged_path: staged, gate_status: "partial" };
}
export const getDraftSchema = z.object({
    client_slug: z.string().min(1),
    stage: z.enum(STAGE_ORDER),
});
export async function getDraft(args) {
    if (!(await projectExists(args.client_slug))) {
        return { error: `No project found for client_slug "${args.client_slug}".` };
    }
    const state = await readProject(args.client_slug);
    const staged = stagingPath(args.client_slug, args.stage);
    if (!(await fileExists(staged))) {
        return { error: `No staged draft exists for "${args.stage}". Call create_draft first.` };
    }
    const content = await fs.readFile(staged, "utf-8");
    return {
        stage: args.stage,
        version: state.draft_versions[args.stage] ?? 1,
        content,
        gate_status: state.stage_gates[args.stage],
    };
}
export const editDraftSchema = z.object({
    client_slug: z.string().min(1),
    stage: z.enum(STAGE_ORDER),
    new_content: z.string().min(1),
});
export async function editDraft(args) {
    if (!(await projectExists(args.client_slug))) {
        return { error: `No project found for client_slug "${args.client_slug}".` };
    }
    const state = await readProject(args.client_slug);
    const staged = stagingPath(args.client_slug, args.stage);
    if (!(await fileExists(staged))) {
        return { error: `No staged draft exists for "${args.stage}". Call create_draft first.` };
    }
    await fs.writeFile(staged, args.new_content, "utf-8");
    const version = state.draft_versions[args.stage] ?? 1;
    const ts = timestamp();
    await appendLog(args.client_slug, "project-log.md", `[${ts}] ${args.stage}: draft v${version} edited in staging`);
    return { stage: args.stage, version, staged_path: staged, gate_status: state.stage_gates[args.stage] };
}
export const redoDraftSchema = z.object({
    client_slug: z.string().min(1),
    stage: z.enum(STAGE_ORDER),
    new_content: z.string().min(1),
    reason: z.string().optional(),
});
export async function redoDraft(args) {
    if (!(await projectExists(args.client_slug))) {
        return { error: `No project found for client_slug "${args.client_slug}".` };
    }
    const state = await readProject(args.client_slug);
    const staged = stagingPath(args.client_slug, args.stage);
    if (!(await fileExists(staged))) {
        return { error: `No staged draft exists for "${args.stage}". Call create_draft first.` };
    }
    const currentVersion = state.draft_versions[args.stage] ?? 1;
    const ts = timestamp();
    const archived = archivePath(args.client_slug, args.stage, currentVersion, ts);
    await fs.rename(staged, archived);
    await appendLog(args.client_slug, "project-log.md", `[${ts}] ${args.stage}: v${currentVersion} moved staging -> archive${args.reason ? ` (reason: ${args.reason})` : ""}`);
    const nextVersion = currentVersion + 1;
    await fs.writeFile(staged, args.new_content, "utf-8");
    state.draft_versions[args.stage] = nextVersion;
    await writeProject(state);
    await appendLog(args.client_slug, "project-log.md", `[${ts}] ${args.stage}: draft v${nextVersion} created in staging`);
    return {
        stage: args.stage,
        previous_version: currentVersion,
        new_version: nextVersion,
        archived_path: archived,
        staged_path: staged,
        gate_status: state.stage_gates[args.stage],
    };
}
export const approveDraftSchema = z.object({
    client_slug: z.string().min(1),
    stage: z.enum(STAGE_ORDER),
});
export async function approveDraft(args) {
    if (!(await projectExists(args.client_slug))) {
        return { error: `No project found for client_slug "${args.client_slug}".` };
    }
    const state = await readProject(args.client_slug);
    const staged = stagingPath(args.client_slug, args.stage);
    const output = outputsPath(args.client_slug, args.stage);
    const version = state.draft_versions[args.stage] ?? 1;
    if (!(await fileExists(staged))) {
        return { error: `No staged draft exists for "${args.stage}" to approve. Call create_draft first.`, verified: false };
    }
    await fs.rename(staged, output);
    const stillInStaging = await fileExists(staged);
    const nowInOutputs = await fileExists(output);
    if (stillInStaging || !nowInOutputs) {
        // Verification failed per workspace-conventions.md §3c: do not advance the
        // gate, surface an actionable error, leave the stage in "partial".
        return {
            verified: false,
            error: `Move verification failed for "${args.stage}": staging_still_has_file=${stillInStaging}, outputs_has_file=${nowInOutputs}. Gate NOT advanced to completed. Retry the move or resolve manually before proceeding.`,
        };
    }
    state.stage_gates[args.stage] = "completed";
    await writeProject(state);
    const ts = timestamp();
    await appendLog(args.client_slug, "project-log.md", `[${ts}] ${args.stage}: v${version} approved, moved staging -> outputs`);
    return {
        verified: true,
        stage: args.stage,
        version,
        output_path: output,
        gate_status: "completed",
    };
}
export const recordAssumptionSchema = z.object({
    client_slug: z.string().min(1),
    stage: z.enum(STAGE_ORDER),
    text: z.string().min(1),
});
export async function recordAssumption(args) {
    if (!(await projectExists(args.client_slug))) {
        return { error: `No project found for client_slug "${args.client_slug}".` };
    }
    const ts = timestamp();
    await appendLog(args.client_slug, "assumptions.md", `[${ts}] (${args.stage}) ${args.text}`);
    return { recorded: true, timestamp: ts };
}
