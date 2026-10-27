# EXTRACT content-driven visual report redesign

## Intent

Bring the generated EXTRACT Expertise Map to the visual and strategic quality of the approved ANCHOR report. The report must feel rich because it explains the respondent's actual expertise—not because it adds decorative graphics.

## Goals

- Give each major EXTRACT section a different, meaningful visualization derived from the saved EXTRACT artifact.
- Preserve the existing nine-page structure, three themes, diamond cover, metadata, sources, evidence boundaries, and final decision.
- Improve hierarchy, density, spacing, labels, interpretations, and the relationship between visuals and supporting detail.
- Render missing or weak inputs as explicit gaps; never invent events, proof, scores, outcomes, or relationships.
- Ensure long answers remain readable without visible ellipsis truncation.

## Selected approach

Use ANCHOR's premium visual language with EXTRACT-specific information graphics. Reusing ANCHOR's exact charts was rejected because those charts encode authority-positioning concepts that do not fit every EXTRACT section. Repeating a single circle graph was rejected because it would be visually monotonous and semantically weak.

## Page system

1. **Cover:** faceted diamond, executive opportunity, expertise thesis.
2. **Executive brief:** decision pathway connecting credibility, opportunity, thesis, and recommendation, with a short interpretation.
3. **Origin and evolution:** chronological milestone timeline built from origin, timeline, diagnostic turning point, and accumulated advantage.
4. **Expertise architecture:** connected pillar/network diagram showing context intelligence, diagnostic judgment, applied method, and their synthesized connection.
5. **Signature method:** staged process flow built from the respondent's method stages, including inputs, outputs, and stated operating conditions.
6. **Proof and stories:** labeled confidence bars plus a proof/story/gap matrix using the report's evidence assessments; confidence is clearly marked as strategic assessment, not measured performance.
7. **Point of view and IP:** framework relationship map connecting signature beliefs, named frameworks, preferred language, and language to avoid.
8. **Boundaries and risks:** impact/control matrix connecting each stated risk to its mitigation and open evidence gaps.
9. **Activation and decision:** prioritized roadmap with recommendations, next steps, readiness gate, and definitive decision.

## Layout and content rules

- Each page reserves a protected title and introduction area, a primary visualization region, a concise interpretation, and supporting detail.
- Visual labels come from the report data. Generic labels appear only for explicitly missing inputs.
- Supporting cards are limited to the most decision-relevant material; overflow is fitted or moved into a continuation region without ellipsis.
- Decorative numbered circles are reduced so they do not compete with the actual charts.
- All three themes retain the same information architecture while changing palette and display font.

## Verification

- Automated tests confirm each EXTRACT page invokes its intended visualization type and the diamond artwork remains embedded.
- All three themes produce nine valid pages with correct metadata.
- A fixture based on the user's attached report confirms the charts use its actual method, proof, framework, risk, and recommendation content.
- Rendered-page inspection verifies spacing, legibility, and visual variety.
- Full tests and production build must pass before publication.
