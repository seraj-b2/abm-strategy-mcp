# Stage 14 — LinkedIn Ads Campaign Design

Produces the LinkedIn Ads Campaign Design section: quarterly ToFu/MoFu/BoFu LinkedIn campaign calendars, budget share, and media plan.

## Inputs to draw on (already assembled by get_stage_context)

- `outputs/`: playbook-selection.doc, content-plan.doc.
- `quarterly_performance_budget` from `project_inputs`.

## Process

1. Design quarterly LinkedIn campaign calendars across ToFu, MoFu, and BoFu aligned with the playbook and content plan.
2. Determine LinkedIn budget share out of the overall performance marketing budget.
3. Build the media plan detailing ad spend allocation, ad formats, targeting criteria, and projected outcomes.
4. Call `record_assumption` for ROI/CPM benchmarks used.

## Output

Draft containing campaign calendar schedules, budget allocation, targeting strategy, and media plan breakdown.

Call `create_draft(client_slug, "14-linkedinads-campaign-design", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
