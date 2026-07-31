# Stage 10 — Playbook Selection

Produces the Playbook Selection section: selecting the optimal ABM playbook based on upstream strategic analyses, with full selection logic and framed playbook structure.

## Inputs to draw on (already assembled by get_stage_context)

- `inputs/` playbook-selection-framework.
- `outputs/`: market-analysis.doc, category-maturity.doc, competitor-analysis.doc, brand-strength-analysis.doc, right-to-win-analysis.doc, icp-segments.doc.

## Process

1. Analyze signals across market landscape, category maturity, competitive position, brand strength, and right to win.
2. Evaluate against the playbook-selection-framework rules to choose the best-fit playbook.
3. Explain the selection logic clearly, referencing upstream findings.
4. Frame the selected playbook structure for the client's product/solution/service.
5. Call `record_assumption` for any edge-case logic calls.

## Output

Draft detailing the chosen playbook, analytical selection rationale, and structural execution framework.

Call `create_draft(client_slug, "10-playbook-selection", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
