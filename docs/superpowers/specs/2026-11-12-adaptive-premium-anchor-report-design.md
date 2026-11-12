# Adaptive Premium ANCHOR Report Design

## Intent

Transform ANCHOR from a visually premium but sometimes text-light report into a genuinely valuable positioning deliverable. The report must interpret the completed interview like a senior positioning strategist, improve the messaging, explain its reasoning, and remain grounded in the customer's saved answers.

## Goals

- Produce an adaptive 12–16-page Trusted Expert Blueprint.
- Give every major strategic decision enough space for two to four useful paragraphs where the evidence supports that depth.
- Preserve a short, usable public Trusted Expert Statement while adding deeper credibility, positioning, and messaging analysis around it.
- Make recommendations traceable to supplied answers.
- Convert weak evidence into explicit gaps and validation work instead of generic padding.
- Keep PDF and DOCX outputs aligned with the same report model.

## Non-goals and anti-goals

- Do not invent credentials, results, audiences, mechanisms, case studies, or certainty.
- Do not make every section long merely to increase page count.
- Do not expose answers marked private.
- Do not replace the user's distinctive language with generic AI copy.
- Do not remove the existing black-and-gold visual quality.

## Selected approach

Use an adaptive report with a 12-page foundation and up to four evidence-driven expansion pages. This was selected over a fixed 14-page report because fixed length encourages repetition when an interview is thin. Adaptive expansion gives richer interviews more room while treating missing evidence honestly.

## Content architecture

The base report contains:

1. Cover and executive opportunity
2. Executive authority assessment
3. Trusted Expert Statement and interpretation
4. Priority audience and costly-problem analysis
5. Credibility analysis
6. Positioning and differentiation decision
7. Evidence and claim-strength assessment
8. Messaging architecture and application examples
9. Boundaries, risks, and trust protection
10. Proof-development strategy
11. Detailed 30-day activation plan
12. Final authority decision and prioritized recommendations

Optional expansion pages are added when supported:

- Evidence appendix
- Language and message examples
- Objection and credibility response guide
- Activation dependencies and measurement scorecard

## Content depth standard

- `executiveBrief.opportunity`, `credibility`, and `decision` become structured analyses rather than card-sized sentences.
- The public `expertStatement.external` remains concise and directly usable.
- A new expanded interpretation explains the audience, costly problem, transformation, differentiating lens, credibility basis, and claim boundary behind the statement.
- Credibility and strategic-decision sections target two to four substantive paragraphs, with each paragraph performing a distinct job rather than repeating the same claim.
- Recommendations include rationale, evidence basis, next action, and an observable completion or validation signal.
- Messaging examples clearly distinguish ready-to-use language from strategic explanation.

## Generation and evidence rules

- AI synthesis uses only saved, non-private ANCHOR answers supplied in the request.
- Answer IDs remain the only valid citations.
- The schema requires explicit evidence basis, inference labels, gaps, and confidence rationale.
- Pending and incomplete saved answers may inform the user's private draft, but the report must label uncertainty and must not upgrade unsupported claims into facts.
- If AI synthesis fails, deterministic generation still produces a complete, grounded report structure with explicit gaps; it must not silently fall back to one-sentence premium sections.
- Validation rejects reports that are structurally complete but materially thin, repetitive, uncited, or padded.

## Rendering

- PDF rendering becomes page-model-driven so content can expand without clipping.
- Core pages keep the established premium black, gold, glass, and editorial visual system.
- Long-form analysis uses readable editorial blocks rather than squeezing paragraphs into small cards.
- Visual matrices and cards remain for comparisons, decisions, evidence strength, and action plans.
- DOCX follows the same section order and substantive content, optimized for editing rather than pixel-matching the PDF.

## User flow

The completion modal and generation action remain unchanged. Generation creates the richer draft, redirects to Review, and exposes the same artifact to Vault export after the existing review/approval flow.

## Verification

- Schema and synthesis tests enforce expanded grounded content.
- Deterministic fallback tests enforce useful multi-paragraph output without fabrication.
- PDF tests verify adaptive page counts, no clipping, readable continuation pages, and all three themes.
- DOCX tests verify all expanded sections are present.
- Existing completion, privacy, persistence, Review, Vault, and export tests remain green.
