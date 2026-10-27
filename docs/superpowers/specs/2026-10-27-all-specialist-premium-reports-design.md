# FAS all-specialist premium report system

## Intent

Bring every FAS specialist report to the visual and strategic standard established by the ANCHOR Trusted Expert Blueprint. The reports must feel like distinct, premium advisory deliverables—not generic section exports—and must remain useful in all three approved PDF design themes.

## Goals

- Provide Editorial Strategy, Luxury Editorial, and Boardroom Consultancy PDF choices for every specialist.
- Give each specialist a dramatic first page built around a realistic three-dimensional symbolic object, matching the visual impact of ANCHOR’s anchor artwork.
- Use specialist-specific charts, diagrams, matrices, timelines, and roadmaps that clarify the report’s actual content.
- Eliminate visible truncation (`...` or `…`) from final reports.
- Improve spacing, density, hierarchy, and page balance so long answers remain readable without colliding, overflowing, or leaving accidental empty areas.
- Preserve source grounding, evidence permissions, claim boundaries, and report metadata.

## Non-goals

- The reports will not reuse ANCHOR charts when those charts do not fit another specialist’s subject.
- The system will not invent facts to fill sparse reports.
- Cover artwork will not contain generated words, logos, or labels; typography remains controlled by the report renderer.
- This work will not change specialist entitlement or interview progression rules.

## Selected approach

Build a shared premium report design system with specialist-owned report schemas and page compositions.

The shared system supplies theme colors, typography, spacing, footers, safe text measurement, cards, labels, tables, chart primitives, cover treatment, overflow rules, and PDF metadata. Each specialist supplies its own page plan, object artwork, chart selection, and content mapping.

This avoids two rejected alternatives:

1. **Copy ANCHOR and replace labels.** Fast, but produces misleading charts and repetitive reports.
2. **Patch the current EXTRACT renderer only.** Fixes the immediate screenshot but leaves the other specialists inconsistent and preserves duplicated layout weaknesses.

## Shared visual standard

### Themes

All specialists support the existing three options:

1. Editorial Strategy
2. Luxury Editorial
3. Boardroom Consultancy

The theme changes palette and font mode without changing information architecture or removing charts.

### Cover standard

Every cover includes:

- FAS and specialist identifier
- Specialist deliverable title
- Short private-brief descriptor
- Executive opportunity or primary decision
- Realistic three-dimensional specialist object
- Controlled material lighting and background treatment matching the selected theme
- Report version and strategic motto

The seven objects are:

- ANCHOR: sculpted anchor
- EXTRACT: faceted diamond
- RADAR: precision radar instrument
- FORGE: forged shield with restrained flame detail
- ARCHITECT: dimensional blueprint structure or architectural model
- VOICE: sculpted soundwave or studio waveform object
- LAUNCH: ascending launch marker or premium trajectory object

Artwork is generated as transparent PNG material and embedded as a controlled visual asset. It must not contain text, trademarks, or unrelated scenery.

### Typography and spacing

- Use a consistent baseline grid and shared margins.
- Reserve heading height before body layout; headings may wrap to two lines without entering chart or body regions.
- Use bounded cards only when content fits; otherwise flow content into an additional region or continuation page.
- Set page-specific density limits using measured PDF text width and line count.
- Never indicate omitted content with `...` or `…`.
- If content exceeds a page’s safe capacity, prioritize strategic summary text and move supporting detail into another page or appendix block.
- Keep decorative artwork behind protected text-safe zones.

### Shared chart rules

- Charts must encode report data or transparent strategic assessments; purely decorative circles do not count as charts.
- Every assessed score is labeled as an assessment, not a measured result.
- Sparse evidence produces an explicit gap state instead of a fabricated value.
- Chart labels must remain readable in all themes and cannot depend on color alone.
- Every chart has a short interpretation adjacent to it.

## Specialist report structures

### ANCHOR — Trusted Expert Blueprint

Retain its existing nine-page premium report and cover artwork. Its current position map, evidence confidence, message architecture, and activation visuals become the quality reference for the shared system. Refactoring must not regress its approved appearance.

### EXTRACT — Expertise Map

Redesign all nine pages:

1. Object-led cover with faceted diamond
2. Executive expertise brief
3. Origin and evolution timeline
4. Expertise architecture with connected pillars
5. Signature method process flow
6. Proof confidence chart and proof/story matrix
7. Point-of-view and intellectual-property framework
8. Boundaries, risks, and evidence gaps matrix
9. Activation roadmap and final decision

The screenshot’s oversized headings, empty regions, decorative-only circles, and truncated cards are removed.

### RADAR — Buyer Intelligence Brief

Nine pages covering buyer priority, current/desired reality, decision journey, trigger/objection map, buyer-language evidence, offer implications, validation plan, confidence panel, and final decision. Core graphics include a priority segment matrix, decision-path diagram, and confidence panel.

### FORGE — Brand Identity Brief

Nine pages covering strategic foundation, naming territories, shortlist, stress test, selection rationale, category/voice architecture, visual direction, screening limits, and activation. Core graphics include a territory map, candidate scorecard, stress-test matrix, and identity architecture.

### ARCHITECT — Program Curriculum Master

Nine pages covering transformation, milestones, phase architecture, module map, lesson loops, delivery model, asset inventory, production backlog, and readiness decision. Core graphics include a transformation staircase, curriculum dependency map, delivery matrix, and production roadmap.

### VOICE — Master Copy Suite

Nine pages covering message brief, audience/problem/outcome, landing-page architecture, email sequence, social system, direct conversation, voice principles, claims review, and release decision. Core graphics include a message hierarchy, channel map, sequence flow, and claims/evidence matrix.

### LAUNCH — Million Dollar Rollout Plan

Nine pages covering launch thesis, dates and prerequisites, backward plan, owner map, channel plan, calendar, sales tracker, readiness dashboard, and review decision. Core graphics include a launch timeline, dependency path, responsibility matrix, channel cadence, and readiness dashboard.

## Content modeling

- ANCHOR and EXTRACT retain their specialist premium report models and are migrated into shared layout primitives.
- RADAR, FORGE, ARCHITECT, VOICE, and LAUNCH receive deterministic, source-grounded premium report models derived from their interview fields.
- Each model records source IDs for factual claims and marks missing or private evidence as a gap.
- Private and pending sources remain excluded from publishable report text.
- AI synthesis may improve organization and wording, but deterministic report generation remains the safe fallback.

## DOCX behavior

DOCX exports follow the same specialist structure and content hierarchy. They do not attempt to reproduce every PDF graphic pixel-for-pixel, but use professional tables, headings, page breaks, and labeled chart interpretations. PDF remains the primary designed artifact.

## Export experience

- The existing three-theme chooser remains the single PDF export entry point.
- Its preview and labels reflect the selected specialist rather than always saying ANCHOR.
- Legacy saved artifacts are upgraded non-destructively when enough saved answers exist; original versions remain intact.
- Reports with insufficient data render explicit evidence gaps rather than falling back to the generic one-page exporter.

## Testing and acceptance

- Every specialist renders nine PDF pages in all three themes.
- Every specialist has correct title, subject, keywords, footer identity, and object artwork.
- PDF text extraction or renderer instrumentation confirms no visible ellipsis tokens are introduced by layout truncation.
- Long-answer fixtures verify no text overlaps or leaves the page bounds.
- Chart tests verify each specialist invokes its required data visualization primitives.
- EXTRACT screenshot review confirms ANCHOR-equivalent hierarchy, balanced spacing, and meaningful graphics.
- Existing ANCHOR visual and structural tests remain green.
- Full application tests and the Vercel production build pass before publication.

## Delivery order

1. Complete the already approved completion acknowledgement and EXTRACT progression gate.
2. Build shared report primitives without changing ANCHOR output.
3. Fully redesign and visually verify EXTRACT.
4. Add the remaining five specialist report models and renderers.
5. Upgrade DOCX exports and theme chooser identity.
6. Run full regression, build, publish, and verify production.

