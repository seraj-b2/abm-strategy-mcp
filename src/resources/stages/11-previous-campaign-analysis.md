# Stage 11 — Previous Campaign Analysis

Produces the Previous Campaign Analysis section: reviewing past campaign performance across email, LinkedIn, and Google Ads to extract key learnings and funnel implications.

## Inputs to draw on (already assembled by get_stage_context)

- `inputs/` previous-campaign files (or captured text inputs for email, LinkedIn, and Google Ads performance).

## Process

1. Review historical campaign data across email, LinkedIn, and Google Ads.
2. Analyze what worked and what didn't (CTR, open rates, conversion rates, cost per lead/meeting, audience response).
3. Synthesize key learnings and strategic implications for the new ABM campaign design.
4. Call `record_assumption` where previous metrics are partial or missing.

## Output

Draft structured into performance breakdown by channel, key takeaways, and campaign design implications.

Call `create_draft(client_slug, "11-previous-campaign-analysis", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
