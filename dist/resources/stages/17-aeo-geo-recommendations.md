# Stage 17 — AEO / GEO Recommendations

Produces the AEO / GEO Recommendations section: 3 long-form, authoritative article concepts designed for Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO).

## Inputs to draw on (already assembled by get_stage_context)

- `outputs/`: campaign-theme.doc, content-plan.doc, playbook-selection.doc.

## Process

1. Identify key industry questions, technical topics, and search queries relevant to AI answer engines (ChatGPT, Perplexity, Google AI Overviews).
2. Design 3 detailed long-form article recommendations structured for maximum LLM indexability and authority.
3. Align articles with the campaign themes and content gap analysis.
4. Call `record_assumption` for search/AEO trend assumptions.

## Output

Draft with 3 long-form article outlines including title, target queries/topics, structural headings, core data points, and AEO optimization guidance.

Call `create_draft(client_slug, "17-aeo-geo-recommendations", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
