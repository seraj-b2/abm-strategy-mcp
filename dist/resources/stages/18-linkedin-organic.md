# Stage 18 — LinkedIn Organic

Produces the LinkedIn Organic section: 8 thought-leadership post topics with detailed content outlines tailored to target buyer personas.

## Inputs to draw on (already assembled by get_stage_context)

- `outputs/`: campaign-theme.doc (messaging pillars/angles), personas.doc (target audience priorities).

## Process

1. Develop 8 distinct thought-leadership post concepts covering different messaging pillars and buyer pains.
2. Write a comprehensive outline for each post (hook, main narrative, key takeaway, engagement question).
3. Ensure alignment with founder/executive thought-leadership positioning.
4. Call `record_assumption` where topic angles are inferred.

## Output

Draft detailing the 8 LinkedIn organic post topics, target persona focus, post outlines, and engagement strategy.

Call `create_draft(client_slug, "18-linkedin-organic", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
