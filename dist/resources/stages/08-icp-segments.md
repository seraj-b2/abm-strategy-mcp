# Stage 08 — ICP Segments

Produces the ICP Segments section: defining target segments for the ABM program by industry, company size, revenue, and geography, along with key characteristics of each.

## Inputs to draw on (already assembled by get_stage_context)

- `inputs/` target-account-list (if provided) and messaging-framework.
- `outputs/market-analysis.doc` for industry context.

## Process

1. Identify primary and secondary ICP segments (by industry/vertical, employee headcount, revenue tier, and geography).
2. Define key firmographic and technographic characteristics for each segment.
3. Call `record_assumption` where segment parameters rely on estimates or incomplete TAL data.

## Output

Draft defining each ICP segment with firmographic metrics, technographic criteria, and key segment attributes.

Call `create_draft(client_slug, "08-icp-segments", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
