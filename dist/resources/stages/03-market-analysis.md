# Stage 03 — Market Analysis

Produces the Market Analysis section using a fixed two-part framework —
**A. Market Landscape** (6 subsections) and **B. Industry Trends** (8
subsections). Draw what you can from the messaging framework already in
inputs/, then research the rest from reliable external sources, always
tying each finding back to **impact on demand** for the client's
product/solution/service.

## Inputs to draw on (already assembled by get_stage_context)

- The messaging-framework file in inputs/ — the primary internal source.
  Pull: the market/category the solution serves, the product/solution/
  service definition, target **geography**, ICP and verticals, customer
  pains and buying triggers, and named competitors.
- project_inputs — confirm target geography and website.
- known_text_inputs — check for a previously captured list of industries/
  verticals to focus on before asking again.

**Text input to request (only if missing per get_stage_context):** which
industries/verticals to focus the vertical analysis on. Record the answer
via record_text_input.

**External research:** use web search for market size, growth, trends,
regulation, ecosystem, and analyst views. Use reliable sources only
(analyst firms e.g. Gartner/Forrester/IDC, government/regulator sites,
reputable industry bodies, established trade press, company filings).
Capture the source and its date for each material fact; prefer recent data
and note the "as of" date. Where a figure can't be sourced, call
record_assumption instead of fabricating it.

**Source tagging.** For each subsection, mark whether the content is drawn
from the messaging framework, from external research (with citation), or
from a logged assumption.

## Process

Work through both parts in order. For every item, state not just what is
true but **how it impacts demand** for the client's product/solution/
service in the target geography.

### A. Market Landscape
1. **Market Overview** — define the market/category (from messaging
   framework); size, growth rate and direction (growing/flat/shrinking)
   with sourced figures for the target geography.
2. **Demand Drivers** — forces increasing (or suppressing) demand: business
   pressures, cost/ROI drivers, customer pains from the messaging
   framework, plus researched macro drivers.
3. **Market Conditions** — current conditions shaping adoption: economic
   climate, budget environment, maturity of supply, adoption barriers.
4. **Regulations & Policies** — regulatory requirements, compliance
   mandates, government policies and schemes relevant to the solution, and
   how they compel or slow adoption.
5. **Market Ecosystem** — the players and structure: buyers, suppliers,
   channels/partners, platforms, and where the client sits in it.
6. **Market Opportunities & Risks** — synthesis of A.1-A.5 into key
   opportunities to exploit and risks to manage, each with its demand
   implication.

### B. Industry Trends
1. **Macro Trends** — PESTLE-level shifts (economic, political, social,
   environmental) affecting the market.
2. **Industry Trends** — trends in the industry the solution serves.
3. **Vertical Trends** — trends per focus vertical (from the messaging
   framework / text-input list), analyzed vertical by vertical.
4. **Category Trends** — trends in the specific product/solution category.
5. **Customer Trends** — shifts in target-customer priorities, structure
   and behavior.
6. **Buying Trends** — how buyers buy: buying-committee composition,
   evaluation cycles, procurement shifts.
7. **Technology Trends** — technology shifts enabling, disrupting or
   adjacent to the solution.
8. **Analyst Perspective** — what analyst firms say about the market/
   category (cited), and the outlook.

### Synthesis
Close with **ABM implications**: what the demand outlook across A and B
means for funnel weighting, which verticals look most fertile, and where
channel emphasis should go. This feeds downstream stages (category-
maturity, competitor, campaign-theme, playbook-selection).

## Output

Draft structured exactly as: **A. Market Landscape** (6 subsections) and
**B. Industry Trends** (8 subsections), followed by the ABM implications
synthesis. Every material claim carries a source or is flagged as an
assumption, and each item states its impact on demand.

Call `create_draft(client_slug, "03-market-analysis", content)`, present the
draft with a 2-3 sentence summary of headline findings, and ask the user:
**Approve, Edit, or Redo?** (plain chat text — do not assume a tool-approval
dialog conveys this). Loop on edit_draft/redo_draft until the user approves,
then call approve_draft.
