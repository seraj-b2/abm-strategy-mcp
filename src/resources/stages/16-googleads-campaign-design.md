# Stage 16 — Google Ads Campaign Design

Produces the Google Ads Campaign Design section: BoFu search campaign architecture, high-intent/brand/competitor keyword groups, ad copy, landing page topics, and media budget allocation.

## Inputs to draw on (already assembled by get_stage_context)

- `outputs/`: playbook-selection.doc, content-plan.doc, competitor-analysis.doc.
- `quarterly_performance_budget` from `project_inputs`.

## Process

1. Design BoFu search campaigns focusing on high buying intent keywords.
2. Organize keyword groups into Brand, Competitor, and High-Intent Solution categories.
3. Write ad copy concepts, ad extensions, and landing page recommendations.
4. Build the media budget allocation and performance expectations.
5. Call `record_assumption` for CPC and conversion rate projections.

## Output

Draft with keyword matrices, campaign & ad group structure, ad messaging, landing page topics, and budget distribution.

Call `create_draft(client_slug, "16-googleads-campaign-design", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
