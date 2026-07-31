# Stage 06 — Brand Strength Analysis

Produces the Brand Strength Analysis section: assessing the strength and perception of the client's brand in the market across multiple dimensions.

## Inputs to draw on (already assembled by get_stage_context)

- `inputs/` messaging-framework and `project_inputs`.
- External sources to gauge brand presence (web search, analyst mentions, review sites, search/social presence).

## Process

1. Evaluate brand awareness, presence, and perception in the target market and category.
2. Examine search visibility, industry recognition, customer review presence, and analyst mentions.
3. Conclude an overall brand-strength assessment (High / Medium / Low) with supporting evidence.
4. Call `record_assumption` where data is thin.

## Output

Draft covering brand awareness, category footprint, perception, and final rating with rationale.

Call `create_draft(client_slug, "06-brand-strength-analysis", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
