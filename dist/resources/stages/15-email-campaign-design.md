# Stage 15 — Email Campaign Design

Produces the Email Campaign Design section: sequential email campaign designs covering Awareness (ToFu), Consideration (MoFu), and Conversion (BoFu).

## Inputs to draw on (already assembled by get_stage_context)

- `outputs/`: playbook-selection.doc, content-plan.doc, personas.doc.

## Process

1. Design the Awareness email sequence (hooks, messaging angle, call-to-action).
2. Design the Consideration email sequence (value props, proof points, content offers).
3. Design the Conversion email sequence (meeting requests, direct offers, SDR bridge).
4. Call `record_assumption` for sequence timing and cadence assumptions.

## Output

Draft detailing subject line concepts, email copy outlines, call-to-actions, and trigger logic for Awareness, Consideration, and Conversion streams.

Call `create_draft(client_slug, "15-email-campaign-design", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
