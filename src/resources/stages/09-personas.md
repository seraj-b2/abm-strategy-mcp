# Stage 09 — Personas

Produces the Personas section: detailed buyer personas for each key title/role in the buying committee, tailored to the client's solution.

## Inputs to draw on (already assembled by get_stage_context)

- `inputs/` messaging-framework.
- Known text inputs for target titles and roles.

## Process

1. Establish the set of titles/roles involved in the buying committee.
2. For each title/role, build a detailed persona covering: job responsibilities, core goals, main pain points, buying triggers, common objections, and key decision criteria.
3. Call `record_assumption` where persona nuances are inferred.

## Output

Draft detailing individual buyer personas with responsibilities, pains, triggers, and decision factors.

Call `create_draft(client_slug, "09-personas", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
