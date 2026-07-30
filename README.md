# abm-strategy-mcp-server

Local MCP server that ports the `abm-strategy-presentation-v5` Claude Code
plugin's bookkeeping (project state, 21-stage gates, the Approve/Edit/Redo
draft versioning state machine, file moves, and logging) to a standalone MCP
server usable from Claude Desktop. It owns all deterministic bookkeeping;
Claude itself still does all analytical reasoning (market analysis, ICP
segments, deck content, etc.) using the tool responses as context.

## Status: MVP (stages 01-03 ported)

Stages `01-project-setup`, `02-main-inputs`, and `03-market-analysis` are
fully implemented, including the framework instructions served as MCP
resources. Stages `04`-`21` are defined in the pipeline/dependency map but
not yet ported — `get_stage_context`/`advance_stage` will walk into them
correctly, but their resource content is currently a placeholder pointing
back at the original plugin's `SKILL.md` files.

## Setup

```
npm install
npm run build
```

This compiles TypeScript to `dist/` and copies the stage resource markdown
alongside it.

### Wire into Claude Desktop

Claude Desktop's config lives at:
`%APPDATA%\Claude\claude_desktop_config.json`

This repo's config has already been written there, pointing at:
`C:\Users\serajkhan_bamboobox\Downloads\abm-strategy-mcp-server\dist\index.js`

Client workspaces (the `abm_strategy/<client-slug>/...` folders — inputs,
staging, archive, outputs, project.json, logs) are created under:
`C:\Users\serajkhan_bamboobox\Downloads\abm_strategy\`

(set via the `ABM_WORKSPACE_ROOT` env var in the config — change it there if
you'd rather the workspaces live somewhere else).

After installing Claude Desktop, fully quit and relaunch it so it picks up
the new MCP server config, then start a conversation and ask it to "start an
ABM strategy project for <client>". Claude will call the server's tools
per the loop described in its `instructions` (see `src/index.ts`).

### Smoke test (no Claude Desktop required)

```
npm run build
node scripts/smoke-test.mjs
```

Drives the server directly over stdio through the full MVP flow: create a
project, run stages 01-03 to `completed` (including a Redo), close the
client connection to simulate quitting Claude Desktop, reconnect, and
confirm `get_project_status`/`advance_stage` correctly resume at stage 04
with no lost state and no re-asked inputs. Cleans up after itself except for
`test-workspace/`, which is deleted at the start of each run.

## Tool surface

See `src/tools/index.ts` for the full list (project lifecycle, stage-gate
control, input capture, stage context, and the create/edit/redo/approve
draft state machine) — each tool's `description` field documents its
contract in the same detail Claude Desktop will see.

## Next steps to finish the full port

1. Port stages `04`-`21`'s Process sections from the original plugin's
   `SKILL.md` files into `src/resources/stages/<stage>.md`, following the
   pattern in `03-market-analysis.md` (trim the Input/Output boilerplate,
   keep the analytical framework).
2. Add each newly-ported stage's slug to `PORTED_STAGES` in
   `src/resources/index.ts`.
3. Re-run the smoke test pattern (extend `scripts/smoke-test.mjs` or test
   manually via Claude Desktop) for each newly ported stage.
