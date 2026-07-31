# Stage 12 — Campaign Theme

Produces the Campaign Theme section: core differentiators, messaging pillars, positioning, and 3 campaign themes (2 ToFu + 1 MoFu) derived from key positioning insights.

## Inputs to draw on (already assembled by get_stage_context)

- `inputs/` messaging-framework.
- `outputs/`: market-analysis.doc, category-maturity.doc, competitor-analysis.doc, brand-strength-analysis.doc, right-to-win-analysis.doc.

## Process

1. Derive key differentiators, messaging pillars, and overarching positioning.
2. Identify 3 core positioning insights: **2 ToFu insights** and **1 MoFu insight**.
3. Develop the 3 insights into **3 unique, actionable campaign themes** to guide campaign creation.
4. Call `record_assumption` for messaging choices.

## Output

Draft covering differentiators, messaging pillars, positioning statement, and detailed 3 campaign themes (2 ToFu, 1 MoFu).

Call `create_draft(client_slug, "12-campaign-theme", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
