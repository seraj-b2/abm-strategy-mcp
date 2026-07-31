import { STAGE_ORDER } from "../lib/types.js";
import { createProject, createProjectSchema, getProjectStatus, getProjectStatusSchema, listProjects, } from "./project.js";
import { advanceStage, advanceStageSchema, setStageGate, setStageGateSchema } from "./stage.js";
import { checkKnown, checkKnownSchema, recordFileInput, recordFileInputSchema, recordTextInput, recordTextInputSchema, } from "./input.js";
import { getStageContext, getStageContextSchema } from "./context.js";
import { approveDraft, approveDraftSchema, createDraft, createDraftSchema, editDraft, editDraftSchema, getDraft, getDraftSchema, recordAssumption, recordAssumptionSchema, redoDraft, redoDraftSchema, } from "./draft.js";
const stageEnum = { type: "string", enum: STAGE_ORDER };
export const TOOLS = [
    {
        name: "create_project",
        description: "Create a new client workspace (folder tree + project.json) for a new ABM strategy project. Fails if the client's slug already exists — use get_project_status to resume an existing one instead.",
        inputSchema: {
            type: "object",
            properties: {
                client_name: { type: "string", description: "The client's display name." },
                project_inputs: {
                    type: "object",
                    description: "Optional known project-level inputs to seed immediately.",
                    properties: {
                        total_quarterly_budget: { type: "string" },
                        quarterly_performance_budget: { type: "string" },
                        website: { type: "string" },
                        target_geography: { type: "string" },
                        constraints: { type: "string" },
                    },
                },
            },
            required: ["client_name"],
        },
    },
    {
        name: "list_projects",
        description: "List all client workspaces with their current stage and completed-stage count.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "get_project_status",
        description: "Get the full project state for a client: project_inputs, input_files, all 21 stage gates, current_skill, and the computed next_gate. Always call this rather than relying on conversation memory, especially after any gap in the session.",
        inputSchema: {
            type: "object",
            properties: { client_slug: { type: "string" } },
            required: ["client_slug"],
        },
    },
    {
        name: "advance_stage",
        description: "Compute the next stage to run: the first of the 21 stages whose gate is not 'completed'. Returns is_resume=true if that stage has a partial draft already in staging (do not restart it from scratch). Call this to find what to do next, and again after each stage's approve_draft succeeds.",
        inputSchema: {
            type: "object",
            properties: { client_slug: { type: "string" } },
            required: ["client_slug"],
        },
    },
    {
        name: "set_stage_gate",
        description: "Manually override a stage gate's status. For repair/recovery only — normal flow advances gates via create_draft (-> partial) and approve_draft (-> completed), not this tool.",
        inputSchema: {
            type: "object",
            properties: {
                client_slug: { type: "string" },
                stage: stageEnum,
                status: { type: "string", enum: ["pending", "partial", "completed"] },
            },
            required: ["client_slug", "stage", "status"],
        },
    },
    {
        name: "get_stage_context",
        description: "The single call that replaces a skill's 'Input' step: returns this stage's gate status, all known project_inputs, all previously captured text inputs (so you never re-ask what's known), the list of files in inputs/, and the content of every upstream stage's output this stage depends on (with a warning if any are missing). Also tells you which MCP resource (abm://stages/<stage>) has the analytical Process instructions for this stage.",
        inputSchema: {
            type: "object",
            properties: { client_slug: { type: "string" }, stage: stageEnum },
            required: ["client_slug", "stage"],
        },
    },
    {
        name: "record_text_input",
        description: "Persist a piece of text input the user gave you (an answer to a question, a choice between options, a proprietary data point) so later stages don't re-ask it. Always call check_known or get_stage_context first to avoid re-asking something already recorded.",
        inputSchema: {
            type: "object",
            properties: {
                client_slug: { type: "string" },
                skill: { type: "string", description: "The stage that captured this input, e.g. '03-market-analysis'." },
                question: { type: "string" },
                answer: { type: "string" },
            },
            required: ["client_slug", "skill", "question", "answer"],
        },
    },
    {
        name: "record_file_input",
        description: "Move a file the user provided into the project's inputs/ folder and record it in project.json and input-log.md.",
        inputSchema: {
            type: "object",
            properties: {
                client_slug: { type: "string" },
                source_path: { type: "string", description: "Absolute path to the file as currently provided." },
                note: { type: "string", description: "2-3 lines on what the file contains." },
            },
            required: ["client_slug", "source_path", "note"],
        },
    },
    {
        name: "check_known",
        description: "Check whether one or more pieces of information are already known (in project_inputs, text-input.md, or inputs/ filenames) before asking the user. Prefer get_stage_context for a full stage's inputs; use this for ad hoc checks mid-stage.",
        inputSchema: {
            type: "object",
            properties: {
                client_slug: { type: "string" },
                keys: { type: "array", items: { type: "string" }, description: "Free-text topics to check, e.g. 'target geography'." },
            },
            required: ["client_slug", "keys"],
        },
    },
    {
        name: "create_draft",
        description: "Write a stage's first draft (v1) to staging/, setting its gate to 'partial'. Fails if a staged draft already exists for this stage — use edit_draft or redo_draft instead.",
        inputSchema: {
            type: "object",
            properties: {
                client_slug: { type: "string" },
                stage: stageEnum,
                content: { type: "string", description: "The full drafted content for this stage's canonical output file." },
            },
            required: ["client_slug", "stage", "content"],
        },
    },
    {
        name: "get_draft",
        description: "Read the current staged draft and its version number for a stage, to re-present it or diff before editing.",
        inputSchema: {
            type: "object",
            properties: { client_slug: { type: "string" }, stage: stageEnum },
            required: ["client_slug", "stage"],
        },
    },
    {
        name: "edit_draft",
        description: "Revise the staged draft in place (same version, no archive). Use when the user asks for changes to the current draft rather than a full regeneration.",
        inputSchema: {
            type: "object",
            properties: {
                client_slug: { type: "string" },
                stage: stageEnum,
                new_content: { type: "string" },
            },
            required: ["client_slug", "stage", "new_content"],
        },
    },
    {
        name: "redo_draft",
        description: "Regenerate a stage's draft as a new version: archives the current staged file, then writes the new content as the next version in staging/. Use when the user wants a different direction, not just edits to the current one.",
        inputSchema: {
            type: "object",
            properties: {
                client_slug: { type: "string" },
                stage: stageEnum,
                new_content: { type: "string" },
                reason: { type: "string", description: "Why this stage is being redone, for the log." },
            },
            required: ["client_slug", "stage", "new_content"],
        },
    },
    {
        name: "approve_draft",
        description: "Finalize a stage: move its staged draft to outputs/, verify the move succeeded (staging empty, outputs populated), and only then set the gate to 'completed'. If verification fails, the gate is left as-is and an actionable error is returned — do not treat the stage as done in that case.",
        inputSchema: {
            type: "object",
            properties: { client_slug: { type: "string" }, stage: stageEnum },
            required: ["client_slug", "stage"],
        },
    },
    {
        name: "record_assumption",
        description: "Log an assumption made during a stage's analytical work — including scoping choices, interpretations, defaults, estimates, and inferences, not only missing-data fallbacks. Call this as many times as needed while doing the stage's Process work.",
        inputSchema: {
            type: "object",
            properties: {
                client_slug: { type: "string" },
                stage: stageEnum,
                text: { type: "string" },
            },
            required: ["client_slug", "stage", "text"],
        },
    },
];
export async function callTool(name, args) {
    const wrap = (result) => ({
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    });
    switch (name) {
        case "create_project":
            return wrap(await createProject(createProjectSchema.parse(args)));
        case "list_projects":
            return wrap(await listProjects());
        case "get_project_status":
            return wrap(await getProjectStatus(getProjectStatusSchema.parse(args)));
        case "advance_stage":
            return wrap(await advanceStage(advanceStageSchema.parse(args)));
        case "set_stage_gate":
            return wrap(await setStageGate(setStageGateSchema.parse(args)));
        case "get_stage_context":
            return wrap(await getStageContext(getStageContextSchema.parse(args)));
        case "record_text_input":
            return wrap(await recordTextInput(recordTextInputSchema.parse(args)));
        case "record_file_input":
            return wrap(await recordFileInput(recordFileInputSchema.parse(args)));
        case "check_known":
            return wrap(await checkKnown(checkKnownSchema.parse(args)));
        case "create_draft":
            return wrap(await createDraft(createDraftSchema.parse(args)));
        case "get_draft":
            return wrap(await getDraft(getDraftSchema.parse(args)));
        case "edit_draft":
            return wrap(await editDraft(editDraftSchema.parse(args)));
        case "redo_draft":
            return wrap(await redoDraft(redoDraftSchema.parse(args)));
        case "approve_draft":
            return wrap(await approveDraft(approveDraftSchema.parse(args)));
        case "record_assumption":
            return wrap(await recordAssumption(recordAssumptionSchema.parse(args)));
        default:
            return {
                isError: true,
                content: [{ type: "text", text: `Unknown tool: ${name}` }],
            };
    }
}
