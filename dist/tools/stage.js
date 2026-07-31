import { z } from "zod";
import { STAGE_ORDER } from "../lib/types.js";
import { appendLog, nextGate, projectExists, readProject, timestamp, writeProject } from "../lib/workspace.js";
export const advanceStageSchema = z.object({
    client_slug: z.string().min(1),
});
export async function advanceStage(args) {
    if (!(await projectExists(args.client_slug))) {
        return { error: `No project found for client_slug "${args.client_slug}".` };
    }
    const state = await readProject(args.client_slug);
    const stage = nextGate(state);
    if (stage === null) {
        return {
            pipeline_complete: true,
            message: "All 21 stages are completed. The pipeline is finished — report the final deliverables in outputs/.",
        };
    }
    const status = state.stage_gates[stage];
    const isResume = status === "partial";
    if (state.current_skill !== stage) {
        state.current_skill = stage;
        await writeProject(state);
    }
    return {
        stage,
        stage_number: STAGE_ORDER.indexOf(stage) + 1,
        total_stages: STAGE_ORDER.length,
        status,
        is_resume: isResume,
        message: isResume
            ? `Resuming "${stage}" — a draft is already sitting in staging/ awaiting Approve/Edit/Redo. Do not restart this stage from scratch; call get_draft to see the existing draft first.`
            : `Next stage is "${stage}" (${STAGE_ORDER.indexOf(stage) + 1} of ${STAGE_ORDER.length}). Confirm with the user before proceeding.`,
    };
}
export const setStageGateSchema = z.object({
    client_slug: z.string().min(1),
    stage: z.enum(STAGE_ORDER),
    status: z.enum(["pending", "partial", "completed"]),
});
// Manual override/repair tool - normal flow should never need this directly,
// since create_draft/approve_draft manage gate transitions themselves.
export async function setStageGate(args) {
    if (!(await projectExists(args.client_slug))) {
        return { error: `No project found for client_slug "${args.client_slug}".` };
    }
    const state = await readProject(args.client_slug);
    const previous = state.stage_gates[args.stage];
    state.stage_gates[args.stage] = args.status;
    await writeProject(state);
    await appendLog(args.client_slug, "project-log.md", `[${timestamp()}] MANUAL OVERRIDE: stage gate "${args.stage}" changed ${previous} -> ${args.status}`);
    return { stage: args.stage, previous_status: previous, new_status: args.status };
}
