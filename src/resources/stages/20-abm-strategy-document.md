# Stage 20 — ABM Strategy Document

Produces the comprehensive ABM Strategy Document: collating all approved stage outputs (03 through 19) into a unified master strategy document with an Executive Summary.

## Inputs to draw on (already assembled by get_stage_context)

- All approved output section files in `outputs/` (`03-market-analysis.doc` through `19-sdr-play-design.doc`).

## Process

1. Collate all approved stage outputs into a single, cohesive master strategy document.
2. Write an Executive Summary synthesizing strategic goals, target market, selected playbook, campaign themes, and execution plan.
3. Structure sections in pipeline order (03 to 19).
4. Transparently highlight any stage where the gate is not yet `completed`.

## Output

Draft of the complete master ABM strategy document containing Executive Summary and all 17 analytical/execution sections.

Call `create_draft(client_slug, "20-abm-strategy-document", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
