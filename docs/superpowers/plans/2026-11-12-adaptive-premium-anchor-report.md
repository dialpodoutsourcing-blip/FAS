# Adaptive Premium ANCHOR Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a grounded, adaptive 12–16-page ANCHOR report with substantive strategic analysis in PDF and DOCX.

**Architecture:** Expand the shared premium-report model first, then make both AI synthesis and deterministic fallback populate it. Convert the ANCHOR PDF renderer to compose a base 12-page page model plus evidence-driven optional pages, while the DOCX renderer consumes the same fields in editable form.

**Tech Stack:** Node.js, browser JavaScript, OpenAI Responses structured output, pdf-lib, docx, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-12-adaptive-premium-anchor-report-design.md`

## Global Constraints

- Use only saved, non-private ANCHOR answers as factual source material.
- Pending and incomplete answers may inform the private draft but uncertainty must remain explicit.
- Do not invent credentials, results, claims, audiences, mechanisms, or certainty.
- Preserve the existing black-and-gold report identity and all three export themes.
- PDF and DOCX must consume the same expanded report model.

## Review Focus

- Sparse interviews must yield explicit gaps and useful validation work, not padded prose; cover in Task 2 fallback tests.
- Long AI paragraphs must paginate without clipping; cover in Task 3 layout tests.
- Private answers must never enter synthesis or fallback output; cover in Task 1 request tests and Task 2 report tests.
- Pending/incomplete draft material must be labeled as uncertain rather than asserted; cover in Task 2 report tests.
- AI failure must still produce a useful 12-page report; cover in Tasks 2 and 3 integration tests.

---

### Task 1: Expanded synthesis contract

**Files:**
- Modify: `server.js`
- Modify: `tests/narration-server.test.js`

**Interfaces:**
- Consumes: `{agentKey:'anchor', answers:Array<Answer>}`.
- Produces: `premiumReport` with expanded executive analysis, expert-statement interpretation, audience/problem analysis, credibility analysis, positioning decision, proof strategy, messaging applications, activation scorecard, and existing compatibility fields.

- [ ] **Step 1: Write failing synthesis-contract tests** asserting the JSON schema requires the new analysis objects, paragraph arrays contain at least two non-empty entries, citations use supplied IDs, and private answers are absent from the request.
- [ ] **Step 2: Run `node --test tests/narration-server.test.js` and verify the new assertions fail.**
- [ ] **Step 3: Expand `buildSynthesisPayload(request, model)` and `validatePremiumSynthesis(report, request)` in `server.js`** with exact structured fields and anti-padding instructions; retain existing fields for renderer compatibility.
- [ ] **Step 4: Run the focused test and verify it passes.**
- [ ] **Step 5: Commit with `feat: expand Anchor synthesis contract`.**

### Task 2: Grounded deterministic report model

**Files:**
- Modify: `assets/js/artifacts.js`
- Modify: `public/assets/js/artifacts.js`
- Modify: `tests/artifacts.test.js`
- Modify: `tests/anchor-artifact-upgrade.test.js`

**Interfaces:**
- Consumes: normalized ANCHOR source answers.
- Produces: `buildAnchorPremiumReport(sources): PremiumAnchorReport` matching Task 1 and `applySynthesis(artifact, synthesis): Artifact` preserving the expanded model.

- [ ] **Step 1: Write failing tests** for multi-paragraph credibility and decision analysis, concise external statement plus expanded interpretation, explicit sparse-evidence gaps, uncertainty labels for pending/incomplete draft sources, and exclusion of private sources.
- [ ] **Step 2: Run `node --test tests/artifacts.test.js tests/anchor-artifact-upgrade.test.js` and verify failure.**
- [ ] **Step 3: Expand `buildAnchorPremiumReport(sources)` and `applySynthesis(artifact, synthesis)`** so deterministic and AI paths share one normalized report model and no fallback section collapses to a sentence.
- [ ] **Step 4: Rebuild `public/` with `npm run build`, then run focused tests and verify they pass.**
- [ ] **Step 5: Commit with `feat: enrich grounded Anchor strategy model`.**

### Task 3: Adaptive 12–16-page PDF

**Files:**
- Modify: `lib/anchor-report-renderer.js`
- Modify: `lib/export-service.js` only if page-model plumbing requires it
- Modify: `tests/export-service.test.js`

**Interfaces:**
- Consumes: `Artifact.premiumReport` from Task 2.
- Produces: `renderAnchorReport(pdf, artifact, theme, fonts, assets)` with 12 base pages and up to four conditional appendix pages.

- [ ] **Step 1: Write failing PDF tests** asserting 12–16 pages, presence of every base section, optional-page conditions, all three themes, and containment of long Unicode/unbroken content.
- [ ] **Step 2: Run the named export tests and verify page-count/content assertions fail.**
- [ ] **Step 3: Introduce a page-model composer inside `lib/anchor-report-renderer.js`** and render editorial paragraph blocks with continuation rules instead of squeezing long analysis into cards.
- [ ] **Step 4: Run focused export tests and inspect one generated 16-page maximum-content fixture for clipping.**
- [ ] **Step 5: Commit with `feat: render adaptive premium Anchor PDF`.**

### Task 4: Matching expanded DOCX and end-to-end verification

**Files:**
- Modify: `lib/anchor-docx-renderer.js`
- Modify: `tests/export-service.test.js`
- Modify: `tests/extract-flow.test.js` if generation compatibility assertions require the expanded model

**Interfaces:**
- Consumes: the same `PremiumAnchorReport` used by PDF.
- Produces: editable DOCX with the same section order, analysis, citations/gaps, recommendations, and final decision.

- [ ] **Step 1: Write failing DOCX tests** asserting all 12 base sections and expanded multi-paragraph analysis are embedded in the document package.
- [ ] **Step 2: Run focused DOCX tests and verify failure.**
- [ ] **Step 3: Expand `renderAnchorDocx(artifact)`** using the shared report fields without PDF-specific truncation.
- [ ] **Step 4: Run focused tests, then `npm test`; expect zero failures and only the existing live Supabase skip.**
- [ ] **Step 5: Run `npm run build`, verify source/public parity, and commit with `feat: complete adaptive Anchor exports`.**

### Task 5: Production integration

**Files:**
- No new product files expected.

**Interfaces:**
- Consumes: verified feature branch.
- Produces: merged `main`, pushed origin, READY Vercel production deployment.

- [ ] **Step 1: Run `npm test` and `npm run build` from the final branch and record totals.**
- [ ] **Step 2: Review the final diff for privacy, compatibility, and accidental unrelated changes.**
- [ ] **Step 3: Merge into `main`, preserving the worktree and user-owned untracked files.**
- [ ] **Step 4: Push `origin main`, deploy with `npx vercel --prod --yes`, and require `readyState: READY`.**
- [ ] **Step 5: Verify the live synthesis/export markers using authenticated `vercel curl`.**
