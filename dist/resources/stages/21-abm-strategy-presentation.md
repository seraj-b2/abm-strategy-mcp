# Stage 21 — ABM Strategy Presentation

Produces the final ABM Strategy Presentation deck structure: transforming the complete strategy into a slide deck presentation following the client's design template.

## Inputs to draw on (already assembled by get_stage_context)

- All approved output section files in `outputs/`.
- `inputs/` presentation-design-template.pptx (for slide structure & formatting rules).

## Process

1. Summarize all strategy sections into executive slide concepts (Market, Competitors, ICP & Personas, Playbook Logic, Campaign Themes, Media Plans, SDR Plays).
2. **Playbook Section Rule:** Do NOT explicitly state the proprietary playbook brand name — describe only the selection logic, strategy structure, and execution framework.
3. Format according to the presentation design template layout.
4. Call `record_assumption` where slide layout formatting requires condensation.

## Output

Draft of the final presentation deck structure covering all slides from Executive Summary to Execution Roadmap.

Call `create_draft(client_slug, "21-abm-strategy-presentation", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`. This final approval completes the entire pipeline!
