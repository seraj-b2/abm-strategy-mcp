# Stage 05 — Competitor Analysis

Produces the Competitor Analysis section: each competitor's positioning, value proposition, strengths, weaknesses, and differentiators, followed by a direct comparison against the client's product/solution/service.

## Inputs to draw on (already assembled by get_stage_context)

- `inputs/` messaging-framework (primary source).
- `outputs/market-analysis.doc` and `outputs/category-maturity.doc` for named competitors.
- External research for competitor details (web search).

## Process

1. Identify the competitor set (from messaging framework, upstream docs, or derived).
2. For each competitor, analyze: market positioning, value proposition, strengths, weaknesses, and differentiators.
3. Compare the client's product/service/solution directly against each competitor.
4. Highlight key differentiators, relative strengths, and weaknesses versus each competitor.
5. Call `record_assumption` for any inferred competitive data.

## Output

Draft structured with individual competitor profiles and a comparative evaluation table/summary.

Call `create_draft(client_slug, "05-competitor-analysis", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
