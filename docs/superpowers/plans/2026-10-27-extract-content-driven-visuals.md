# EXTRACT Content-Driven Visuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace EXTRACT's generic process boxes with varied, content-driven diagrams and matrices matching ANCHOR's strategic and visual richness.

**Architecture:** Keep the existing nine-page EXTRACT report model and theme system. Refactor `extract-report-renderer.js` into page-specific visualization functions that consume the existing premium report properties, then verify semantic chart selection, PDF validity, content grounding, and rendered layout.

**Tech Stack:** Node.js, pdf-lib, node:test, PyMuPDF for inspection, existing FAS PDF themes.

**Spec:** `docs/superpowers/specs/2026-10-27-extract-content-driven-visuals-design.md`

## Global Constraints

- Preserve nine pages, all three themes, the diamond cover, metadata, sources, and final decision.
- Visual labels must come from saved EXTRACT content; missing inputs render as explicit gaps.
- Never invent events, proof, scores, outcomes, or relationships.
- Never introduce visible ellipsis truncation.
- Do not regress the approved ANCHOR report.

## Review Focus

- Very long interview answers must stay inside protected page regions without ellipsis.
- One or two method stages must still produce a readable process diagram.
- Empty proof/framework/risk arrays must render explicit gaps without throwing.
- Confidence values must remain labeled as strategic assessments rather than measured results.
- Every theme must keep sufficient text, line, and chart contrast.

---

### Task 1: Semantic visualization contract

**Files:**
- Modify: `tests/export-service.test.js`
- Modify: `lib/extract-report-renderer.js`

**Interfaces:**
- Consumes: `artifact.premiumReport` from `buildExtractPremiumReport()`.
- Produces: exported `EXTRACT_VISUALS` page-to-visual mapping and internal page-specific drawing functions.

- [ ] Add a failing test asserting EXTRACT declares eight distinct semantic page visuals: decision path, timeline, architecture network, method flow, proof confidence/matrix, IP map, risk matrix, and activation roadmap.
- [ ] Run `node --test tests/export-service.test.js` and verify the new assertion fails.
- [ ] Add the mapping and named drawing-function dispatch in `lib/extract-report-renderer.js`.
- [ ] Re-run the focused test and verify it passes.
- [ ] Commit with `feat: define extract visualization system`.

### Task 2: Content-driven diagrams

**Files:**
- Modify: `lib/extract-report-renderer.js`
- Modify: `tests/export-service.test.js`

**Interfaces:**
- Consumes: `executiveBrief`, `expertiseThesis`, `originTimeline`, `expertiseArchitecture`, `signatureMethod`, `proofBank`, `pointOfView`, `risks`, `recommendations`, and `finalDecision`.
- Produces: page-specific pdf-lib graphics using only those values.

- [ ] Add failing renderer-instrumentation tests confirming each drawing function consumes its matching report property and emits an interpretation region.
- [ ] Verify failure with the focused export test.
- [ ] Implement the chronological timeline, connected expertise network, staged method flow, proof confidence plus proof-gap matrix, framework relationship map, risk/mitigation matrix, and gated activation roadmap.
- [ ] Add safe empty-array fallbacks labeled `OPEN GAP` and adaptive text fitting without ellipsis.
- [ ] Re-run focused tests and verify all three themes remain nine valid pages with embedded artwork and correct metadata.
- [ ] Commit with `feat: render rich extract charts`.

### Task 3: Attached-artifact regression and visual inspection

**Files:**
- Modify: `tests/export-service.test.js`
- Generate temporarily: rendered PNG previews outside the repository.

**Interfaces:**
- Consumes: a fixture matching the attached EXTRACT content and `renderPdf()`.
- Produces: regression coverage for content-derived labels, sparse evidence, long answers, and safe page bounds.

- [ ] Add a fixture using the attached report's method, proof, framework, risk, and recommendation language.
- [ ] Assert the generated PDF contains nine pages, multiple drawing operations per page, no introduced ellipsis, and valid metadata for all themes.
- [ ] Render all nine pages to images and visually inspect page balance, chart variety, contrast, and label legibility.
- [ ] Adjust only layout constants required by inspection and re-run the focused tests.
- [ ] Commit with `test: verify extract visual report`.

### Task 4: Build, regression, and publication

**Files:**
- Regenerate: `public/**` via the existing build.

**Interfaces:**
- Consumes: completed renderer and tests.
- Produces: verified production deployment.

- [ ] Run `npm test`; require all non-live tests to pass.
- [ ] Run `npm run build`; require successful `public/` preparation.
- [ ] Run `git diff --check` on source/test files and inspect the final diff.
- [ ] Commit generated production assets if changed, merge to `main`, and push.
- [ ] Verify the exact Vercel deployment reaches `Ready` and the production export endpoint serves the updated build.
