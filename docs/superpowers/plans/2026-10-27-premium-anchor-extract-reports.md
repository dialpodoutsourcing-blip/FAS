# Premium ANCHOR and EXTRACT Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship evidence-grounded, theme-aware, nine-page PDF and expanded DOCX reports for both ANCHOR and EXTRACT.

**Architecture:** Keep ANCHOR’s compatible premium schema while expanding its renderers. Add a separate EXTRACT premium schema, deterministic builder, synthesis validation, bespoke PDF/DOCX renderers, and review-time upgrade path; route both through the existing export service and theme system.

**Tech Stack:** Browser JavaScript, Node.js, Express, OpenAI Responses API, pdf-lib, docx, Node test runner, Supabase artifact persistence.

**Spec:** `docs/superpowers/specs/2026-10-27-premium-anchor-extract-reports-design.md`

## Global Constraints

- Both complete reports render exactly nine US Letter PDF pages.
- All three existing themes remain supported.
- Every factual synthesis remains source-grounded and permission-safe.
- Missing evidence appears as an explicit gap; no credentials or outcomes are invented.
- Existing ANCHOR premium artifacts remain compatible.
- Legacy generic exports continue working.
- Only ANCHOR and EXTRACT are changed.

## Review Focus

- Long or unbroken Unicode content must not overflow or crash either renderer.
- Sparse EXTRACT evidence must still produce nine honest pages without fabricated claims.
- Private and pending sources must never enter either premium report’s publishable content.
- Existing five-page ANCHOR artifacts must render as nine pages without migration failure.
- Review-time EXTRACT upgrades must be idempotent and preserve the previously approved version.

---

### Task 1: Build the EXTRACT premium data model

**Files:**
- Modify: `assets/js/artifacts.js`
- Test: `tests/artifacts.test.js`

**Interfaces:**
- Produces: `buildExtractPremiumReport(sources)` and agent-aware `applySynthesis(artifact, synthesis)` using the schema in the spec.
- Consumes later: synthesis route, upgrade controller, and renderers.

- [ ] Write tests for complete, sparse, Unicode, and permission-filtered EXTRACT answers; assert the full schema, valid source IDs, honest gaps, and unchanged base sections.
- [ ] Run `node --test tests/artifacts.test.js` and confirm the new tests fail.
- [ ] Implement deterministic EXTRACT premium construction and agent-aware synthesis application.
- [ ] Run `node --test tests/artifacts.test.js` and confirm it passes.
- [ ] Commit.

### Task 2: Add specialist-aware AI synthesis

**Files:**
- Modify: `server.js`
- Modify: `assets/js/adam.js`
- Test: `tests/narration-server.test.js`
- Test: `tests/extract-flow.test.js`

**Interfaces:**
- Consumes: EXTRACT premium schema from Task 1.
- Produces: `normalizeSynthesisRequest` accepting `anchor|extract`, specialist-specific `buildSynthesisPayload`, and `validatePremiumSynthesis(payload, agentKey)`.

- [ ] Write route and validator tests for a fully cited EXTRACT payload plus incomplete, unknown-source, private-source, inflated, and wrong-schema payloads.
- [ ] Run the two named test files and confirm failures identify ANCHOR-only behavior.
- [ ] Implement specialist-aware prompts, schemas, validation, and completed-artifact synthesis calls.
- [ ] Run the named tests and confirm they pass.
- [ ] Commit.

### Task 3: Expand ANCHOR to nine pages

**Files:**
- Modify: `lib/anchor-report-renderer.js`
- Modify: `lib/anchor-docx-renderer.js`
- Test: `tests/export-service.test.js`

**Interfaces:**
- Consumes: existing compatible ANCHOR premium schema and themes.
- Produces: nine-page `renderAnchorReport` plus expanded `renderAnchorDocx` matching the page architecture in the spec.

- [ ] Update tests to require exactly nine pages in all themes, `page/9` footers, the nine page topics, correct metadata, and expanded DOCX headings.
- [ ] Run `node --test tests/export-service.test.js` and confirm the page-count/content tests fail.
- [ ] Split and expand ANCHOR page drawing into the nine specified pages without changing its schema.
- [ ] Run the export tests and confirm they pass.
- [ ] Commit.

### Task 4: Add bespoke EXTRACT PDF and DOCX renderers

**Files:**
- Create: `lib/extract-report-renderer.js`
- Create: `lib/extract-docx-renderer.js`
- Modify: `lib/export-service.js`
- Test: `tests/export-service.test.js`

**Interfaces:**
- Consumes: EXTRACT `premiumReport` from Task 1 and existing theme objects.
- Produces: `renderExtractReport(pdf, artifact, theme, fonts)` and `renderExtractDocx(artifact)`, routed when `agentKey==='extract' && premiumReport`.

- [ ] Write tests requiring nine distinct themed pages, EXTRACT metadata/footer labels, all page topics, expanded DOCX headings, Unicode safety, and no ANCHOR labels.
- [ ] Run export tests and confirm the premium EXTRACT cases fail through the generic renderer.
- [ ] Implement both renderers and export-service routing, reusing only low-level design primitives where sharing does not couple specialist content.
- [ ] Run export tests and confirm they pass, including legacy generic fixtures.
- [ ] Commit.

### Task 5: Upgrade legacy EXTRACT artifacts and specialist-neutral branding UI

**Files:**
- Create: `assets/js/extract-artifact-upgrade.js`
- Modify: `assets/js/artifact-ui.js`
- Modify: `review.html`
- Test: `tests/extract-artifact-upgrade.test.js`
- Test: `tests/review-fixes.test.js`

**Interfaces:**
- Consumes: saved EXTRACT answers, artifacts builder, synthesis endpoint, and project-store versioning.
- Produces: idempotent `loadReview/rebuild` upgrade API parallel to ANCHOR’s upgrader and specialist-aware theme chooser copy.

- [ ] Write tests for eligible/ineligible artifacts, strict synthesis, deterministic fallback, failed-save recovery, immutable approved history, and one-time review startup.
- [ ] Run the named tests and confirm the module/wiring is absent.
- [ ] Implement the upgrade module, review wiring, retry state, and specialist-neutral chooser with current-agent labels.
- [ ] Run the named tests and confirm they pass.
- [ ] Commit.

### Task 6: Verify, build, and publish

**Files:**
- Update generated `public/` assets with `npm run build`.

**Interfaces:**
- Produces: verified main branch and Ready production Vercel deployment.

- [ ] Run `npm test` and confirm zero failures.
- [ ] Run `npm run build`, rerun `npm test`, and inspect `git diff --check` plus the complete scoped diff.
- [ ] Commit generated assets.
- [ ] Merge to `main`, rerun the complete test suite, push, and wait for the exact production deployment to report Ready.

