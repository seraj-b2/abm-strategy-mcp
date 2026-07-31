# Stage 13 — Content Plan

Produces the Content Plan section: mapping existing repository assets to funnel stages, identifying content gaps, and specifying new assets to build across ToFu, MoFu, and BoFu.

## Inputs to draw on (already assembled by get_stage_context)

- `inputs/` asset-repository.
- `outputs/`: playbook-selection.doc, previous-campaign-analysis.doc, campaign-theme.doc.

## Process

1. Map existing assets from the asset repository against the chosen playbook and campaign themes.
2. Identify content gaps across Top of Funnel (ToFu), Middle of Funnel (MoFu), and Bottom of Funnel (BoFu).
3. Recommend new assets to create (white papers, case studies, videos, landing pages, solution guides, buyer's guides, etc.) with specific target funnel stages and themes.
4. Call `record_assumption` for asset fit assessments.

## Output

Draft detailing asset mapping, content gap analysis, and a recommended content production plan by funnel stage.

Call `create_draft(client_slug, "13-content-plan", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
