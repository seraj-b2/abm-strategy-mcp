# Stage 04 — Category Maturity Analysis

Produces the Category Maturity Analysis section: how mature the category of the solution/service/product is, whether a mature buying committee and purchase framework exist, buyer awareness by industry, and a High/Medium/Low maturity rating.

## Inputs to draw on (already assembled by get_stage_context)

- `inputs/` messaging-framework (primary internal source).
- `outputs/market-analysis.doc` (for the focus industries/verticals identified).
- Analyst reports and external research (web search).

## Process

1. Determine how mature the category of the solution/service/product is.
2. Assess whether a mature buying committee exists for the category.
3. Assess whether a purchase/evaluation framework exists for the category.
4. Assess whether buyers in the focus industries identified in market-analysis are aware of the category.
5. Conclude the level of category maturity: **High / Medium / Low**, with supporting evidence.
6. Call `record_assumption` where data or evidence is thin.

## Output

Draft structured covering category maturity depth, buying committee existence, purchase framework, industry awareness, and overall rating (High/Medium/Low).

Call `create_draft(client_slug, "04-category-maturity-analysis", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
