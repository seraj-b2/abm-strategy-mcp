# Stage 07 — Right to Win Analysis

Produces the Right to Win Analysis section: assessing the client's defensible advantage and right to win classified as High / Medium / Low, based on key solution features and competitor comparisons.

## Inputs to draw on (already assembled by get_stage_context)

- `inputs/` messaging-framework (key features & solution offerings).
- `outputs/competitor-analysis.doc`.

## Process

1. Evaluate key features and value propositions of the client's solution.
2. Using `outputs/competitor-analysis.doc`, assess how defensible the client's advantage is against competitors.
3. Classify Right to Win as **High / Medium / Low** with detailed reasoning.
4. Call `record_assumption` for any gaps in competitive evidence.

## Output

Draft analyzing core competitive moat, defensibility, and final Right to Win rating (High/Medium/Low).

Call `create_draft(client_slug, "07-right-to-win-analysis", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
