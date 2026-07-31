# Stage 19 — SDR Play Design

Produces the SDR Play Design section: 3 tailored SDR conversion plays and scripts for BoFu form-fills, highly engaged accounts, and document downloaders.

## Inputs to draw on (already assembled by get_stage_context)

- `outputs/`: playbook-selection.doc, content-plan.doc, personas.doc.

## Process

Develop 3 distinct SDR outreach plays with call/email scripts:
1. **BoFu Form Fills Play** — script & workflow to convert inbound leads into meetings quickly.
2. **Highly Engaged Accounts Play** — script & outreach sequence to nudge warm account signals into sales conversations.
3. **Document Downloaders Play** — script & cadence to gauge interest level and suggest next steps after asset downloads.
Call `record_assumption` for cadence and response timing assumptions.

## Output

Draft covering call scripts, objection handling, follow-up cadence, and meeting booking triggers for all 3 SDR plays.

Call `create_draft(client_slug, "19-sdr-play-design", content)`, present the draft with a short summary, and ask the user: **Approve, Edit, or Redo?** Loop on `edit_draft`/`redo_draft` until approved, then call `approve_draft`.
