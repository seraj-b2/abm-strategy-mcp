# Stage 02 — Main Inputs

Like stage 01, this stage has no analytical Process and no draft/Approve-Edit-
Redo loop — it collects files, already fully handled by record_file_input /
record_text_input. Do not call create_draft/approve_draft for this stage.

## What to do

1. Ask for the four compulsory inputs **one at a time, in this order** — do
   not batch the questions. Ask for the next only after the previous is
   provided or explicitly deferred:
   1. `messaging-framework` (.pdf or .doc/.docx)
   2. `playbook-selection-framework` (.pdf)
   3. `asset-repository` (.xls/.xlsx, .doc/.docx, or .pdf)
   4. `presentation-design-template` (.pptx)
2. For each file the user provides, call
   `record_file_input(client_slug, source_path, note)` with a 2-3 line note
   on its contents.
3. For a compulsory input the user doesn't have yet, do not fabricate it —
   note via record_text_input that downstream stages needing it will be
   blocked until it's supplied, and proceed with the gate left `partial`.
4. After the four compulsory inputs, offer the optional inputs: target-
   account-list, case studies, brochures, white papers, presentations. Record
   whichever are provided the same way; for ones not provided, that's fine —
   no action needed beyond noting it if the user makes an explicit choice
   (e.g. "the TAL will be built later, not uploaded" — log via
   record_text_input).
5. Summarize which inputs are received / pending / not-provided, flag any
   missing compulsory input clearly.
6. This stage has no output file to approve. If all compulsory inputs are
   received, call `set_stage_gate(client_slug, "02-main-inputs", "completed")`.
   If a compulsory input is still pending and the user wants to proceed
   anyway, leave the gate as `partial` (do not mark it completed) and tell
   the user which downstream stages will be blocked. Then call advance_stage.
