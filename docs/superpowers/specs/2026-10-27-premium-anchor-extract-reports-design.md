# Premium ANCHOR and EXTRACT Reports

## Intent

Make ANCHOR and EXTRACT equally premium, client-facing strategic reports. ANCHOR grows from five pages to nine; EXTRACT moves from the generic variable-length export to a bespoke nine-page report governed by the same evidence, provenance, branding, and decision-quality rules.

## Goals

- Produce exactly nine designed PDF pages for complete ANCHOR artifacts.
- Produce exactly nine designed PDF pages for complete EXTRACT artifacts.
- Preserve all three approved PDF themes and their distinct visual character.
- Keep every factual claim grounded in interview sources, preserve permissions, and expose unresolved gaps rather than inventing content.
- Give EXTRACT a specialist-specific premium synthesis instead of copying ANCHOR headings.
- Bring DOCX exports to the same expanded information architecture.
- Preserve legacy generic export behavior for incomplete or older artifacts without a premium report.

## Non-goals

- Do not redesign RADAR, FORGE, ARCHITECT, VOICE, or LAUNCH exports in this project.
- Do not change either specialist’s interview questions.
- Do not manufacture quantified outcomes, credentials, buyer validation, or proof.
- Do not make ANCHOR and EXTRACT visually identical; they share quality rules, not a literal template.

## Selected Approach

Use one shared premium report standard with separate specialist schemas and renderers. This is preferred over copying ANCHOR’s exact template because EXTRACT needs origin, timeline, method, proof, stories, and intellectual-property architecture—not ANCHOR’s audience and positioning model. It is preferred over extending the generic renderer because a generic stream of sections cannot deliver the visual hierarchy or decision utility of the existing ANCHOR report.

## Shared Premium Rules

Both reports use:

- nine fixed pages at US Letter size;
- a designed cover, executive synthesis, evidence visualization, risk/gap treatment, recommendations, and final decision;
- the current Editorial Strategy, Luxury Editorial, and Boardroom Consultancy themes;
- source IDs on every synthesized factual block;
- permission filtering before synthesis and export;
- confidence language presented as strategic assessment, never measured performance;
- explicit labels for missing evidence and assumptions;
- a confidential footer with specialist name, version, and `page/9`;
- deterministic premium fallback content when AI synthesis is unavailable;
- strict server validation before accepting AI-produced premium content.

## ANCHOR — Nine Pages

1. **Cover:** Trusted Expert Blueprint, executive opportunity, central thesis.
2. **Executive Authority Brief:** credibility, strategic decision, expert statement, top recommendations.
3. **Authority Arena:** expertise domain, priority buyer, costly problem, transformation, boundaries.
4. **Trusted Expert Position:** external statement, internal thesis, distinctive lens, alternatives and positioning map.
5. **Evidence and Credibility:** confidence visualization, proof/limit matrix, commercial relevance, evidence gaps.
6. **Messaging Architecture:** signature belief, value promise, three message pillars, language to use and avoid.
7. **Risks and Boundaries:** claim boundaries, position-drift risks, mitigations, permission and validation gates.
8. **30-Day Activation:** four-week plan, actions, success indicators, owner-ready checkpoints.
9. **Final Decision:** recommendation, rationale, scale trigger, prioritized next actions.

The existing premium schema remains compatible; the renderer redistributes and expands it rather than invalidating saved ANCHOR artifacts.

## EXTRACT — Nine Pages

1. **Cover:** Expertise Map, executive opportunity, expertise thesis.
2. **Executive Expertise Brief:** present business context, core expertise, strategic decision, top recommendations.
3. **Origin and Evolution:** origin story, career/business timeline, inflection points, accumulated advantage.
4. **Expertise Architecture:** expertise pillars, capabilities, recurring problems solved, connections between disciplines.
5. **Signature Method:** named or working method, ordered stages, signature moves, inputs, outputs, and conditions.
6. **Proof and Story Bank:** proof items, stories, claims supported, confidence, permission status, evidence gaps.
7. **Point of View and Intellectual Property:** signature beliefs, contrarian insights, teachable frameworks, language to use and avoid.
8. **Boundaries, Risks, and Gaps:** what the expert does not claim, dependency risks, missing proof, validation priorities.
9. **Activation and Final Decision:** recommended expertise assets, immediate next actions, rationale, readiness trigger.

## EXTRACT Premium Schema

`premiumReport` for EXTRACT contains:

- `executiveBrief`: opportunity, credibility, decision, source IDs;
- `expertiseThesis`: external summary, internal thesis, source IDs;
- `originTimeline`: origin, inflection points, accumulated advantage, source IDs;
- `expertiseArchitecture`: pillars and capability connections;
- `signatureMethod`: name, promise, stages, signature moves, conditions, source IDs;
- `proofBank`: claim, proof, story, confidence, permission note, gap, source IDs;
- `pointOfView`: signature beliefs, teachable frameworks, language to use/avoid;
- `risks`: risk, impact, mitigation, source IDs;
- `recommendations`: priority, title, rationale, next step, source IDs;
- `finalDecision`: recommendation, rationale, readiness trigger, source IDs.

## Synthesis and Validation

The browser builds grounded deterministic premium reports for both specialists. The synthesis endpoint accepts `agentKey: anchor` or `agentKey: extract`, uses a specialist-specific schema and prompt, and rejects incomplete, uncited, structurally invalid, or inflated output. If synthesis fails, the deterministic report remains exportable and visibly marks thin evidence.

`applySynthesis` validates and applies the schema matching the artifact’s `agentKey`. Saved artifacts retain their source list and warnings. Existing ANCHOR artifacts continue to render because their current schema fields remain valid.

## Rendering and Export Routing

- `export-service` routes premium ANCHOR to the expanded ANCHOR PDF/DOCX renderers.
- It routes premium EXTRACT to new EXTRACT PDF/DOCX renderers.
- Generic exports remain the fallback for artifacts lacking the appropriate premium report.
- Theme selection copy becomes specialist-neutral while previews identify the current specialist.
- PDF metadata, filenames, and footers identify the correct specialist and report title.

## Quality and Testing

Automated tests verify:

- exactly nine pages for both specialists in all three themes;
- valid PDF and DOCX signatures;
- long text and Unicode safety;
- specialist-correct metadata and footers;
- no ANCHOR labels in EXTRACT output;
- no unknown source IDs or private/pending evidence in publishable synthesis;
- deterministic fallback on synthesis failure;
- legacy generic artifacts still export;
- existing theme persistence and download flows remain intact.

## Builder Check

Self-review found one deliberate compatibility decision: ANCHOR keeps its current premium schema and expands presentation, while EXTRACT receives a new schema. This limits migration risk and lets already-saved ANCHOR reports gain the additional pages immediately. EXTRACT artifacts created before this change remain generic until rebuilt from their saved answers; the review flow should perform that rebuild automatically, using the same pattern already established for ANCHOR upgrades.

