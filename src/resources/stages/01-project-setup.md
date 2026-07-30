# Stage 01 — Project Setup

This stage has no analytical Process and no draft/Approve-Edit-Redo loop —
it is pure bookkeeping, already fully handled by the `create_project` tool.
Do not call create_draft/approve_draft for this stage.

## What to do

1. If the user hasn't already named a client, ask for the client name and call
   `create_project(client_name, project_inputs?)`. This creates the full
   workspace and seeds project.json with all 21 stage gates `pending`.
2. Collect the six project-level inputs, asking only for what isn't already
   known (check get_stage_context / check_known first, since the user may
   have already mentioned some of these in conversation):
   1. Client name
   2. Total quarterly budget
   3. Quarterly performance-marketing budget
   4. Website / product page
   5. Target geography
   6. Any constraints (e.g. competitor brand bidding allowed? claims needing legal review?)
3. If any of these weren't passed to create_project directly, call
   `record_text_input` for each answer so it's logged and available to later
   stages via get_stage_context.
4. Call `record_assumption` for anything you had to infer (e.g. a slug
   derived from an ambiguous client name, an assumed geography).
5. Confirm the workspace was created (name all four folders — inputs,
   staging, archive, outputs) and echo back the captured inputs.
6. This stage has no output file to approve. Call
   `set_stage_gate(client_slug, "01-project-setup", "completed")` directly,
   then call advance_stage to move on.
