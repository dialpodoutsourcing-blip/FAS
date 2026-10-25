# Premium Anchor Blueprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a source-grounded, commercially valuable 4–5 page Anchor report and let users select one of three premium PDF brands immediately before download.

**Architecture:** Extend the Anchor artifact with a semantic `premiumReport` object produced by strict server-side structured synthesis and a deterministic browser fallback. Keep content independent from presentation, then pass a validated `theme` key to a modular PDF renderer whose three theme definitions share layout primitives. Persist the preferred theme on the artifact record and expose a keyboard-accessible chooser in the review UI.

**Tech Stack:** Node.js, Express, OpenAI Responses API structured outputs, browser JavaScript, Supabase/Postgres, pdf-lib, docx, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-25-premium-anchor-blueprint-design.md`

## Global Constraints

- Generate the report content once; theme selection changes presentation only.
- Produce a credible 4–5 page Anchor PDF with roughly 60% written strategy, 20% meaningful visuals, 10% charts/tables, and 10% formatting polish.
- Use only captured user answers as evidence; label inference and missing input and never invent credentials, results, buyers, or proof.
- PDF selection is one click: choosing a style starts rendering and download without another confirmation.
- Persist the preferred theme through the existing artifact/data layer; do not keep it only in static front-end markup.
- Preserve current DOCX, approval, review routing, restart, and completed-artifact reopening behavior.
- Header artwork must be local, programmatic, print-safe, and independent of remote assets.

## Review Focus

- Very short but valid answers must yield honest gaps and useful next actions, not fabricated specificity (Task 1 synthesis tests).
- Long words, Unicode, and multi-paragraph content must paginate without clipping or overlap (Task 3 renderer tests).
- Unknown or malicious theme values must fall back to `editorial-strategy` (Tasks 2 and 3 validation tests).
- Double-clicking a theme while export is pending must produce only one request/download and recover after failure (Task 4 UI tests).
- Supabase-loaded artifacts and legacy local artifacts without `exportTheme` must still open and export normally (Task 2 store compatibility tests).

---

### Task 1: Premium Anchor report schema and synthesis

**Files:**
- Modify: `server.js`
- Modify: `assets/js/artifacts.js`
- Test: `tests/artifacts.test.js`
- Test: `tests/narration-server.test.js`

**Interfaces:**
- Consumes: six normalized Anchor answers `{field, text}`.
- Produces: `premiumReport` with `executiveBrief`, `expertStatement`, `authorityFoundation`, `evidenceMatrix`, `positioningMap`, `messagingArchitecture`, `risks`, `activationPlan`, `recommendations`, and source IDs; `applySynthesis(artifact, synthesis)` attaches it while maintaining review-compatible sections.

- [ ] **Step 1: Write failing artifact tests**

Add tests asserting a complete synthesis creates the premium report fields, maps every evidence-bearing item to known source IDs, preserves the five review sections, and leaves the original artifact immutable. Add a thin-answer fallback test asserting gaps are labeled and no unsupported numbers or credentials appear.

- [ ] **Step 2: Run artifact tests to verify failure**

Run: `node --test tests/artifacts.test.js`
Expected: FAIL because the artifact has no `premiumReport` schema or deterministic premium fallback.

- [ ] **Step 3: Implement premium artifact construction**

In `assets/js/artifacts.js`, add `buildAnchorPremiumReport(sources)` and extend `applySynthesis(artifact, synthesis)` to validate and attach the semantic report while deriving the existing review sections from its summary fields. Keep source references explicit and preserve the current fallback when the server is unavailable.

- [ ] **Step 4: Run artifact tests to verify passing behavior**

Run: `node --test tests/artifacts.test.js`
Expected: PASS.

- [ ] **Step 5: Write failing server synthesis tests**

Add tests in `tests/narration-server.test.js` asserting the Responses request uses a strict nested JSON schema, the prompt distinguishes evidence/inference/gaps and rejects generic padding, a complete premium response succeeds, and missing arrays, unknown source references, shallow sections, or invalid score ranges return 502.

- [ ] **Step 6: Run server synthesis tests to verify failure**

Run: `node --test tests/narration-server.test.js`
Expected: FAIL on the old five-string schema.

- [ ] **Step 7: Implement strict premium synthesis and validation**

Replace the five-string schema in `buildSynthesisPayload(request, model)` with the nested premium schema and add `validatePremiumSynthesis(report, request)` in `server.js`. Raise the output budget enough for a 4–5 page artifact while keeping request bounds and `store:false` unchanged.

- [ ] **Step 8: Run synthesis tests**

Run: `node --test tests/narration-server.test.js tests/artifacts.test.js`
Expected: PASS.

- [ ] **Step 9: Commit**

Run: `git add server.js assets/js/artifacts.js tests/artifacts.test.js tests/narration-server.test.js && git commit -m "feat: generate premium anchor report content"`

### Task 2: Persisted export-theme preference

**Files:**
- Modify: `supabase/migrations/202610250001_fas_production.sql`
- Modify: `assets/js/project-store.js`
- Test: `tests/database-contract.test.js`
- Test: `tests/project-store.test.js`

**Interfaces:**
- Consumes: artifact ID and one of `editorial-strategy | luxury-editorial | boardroom-consultancy`.
- Produces: `store.saveExportTheme(artifactId, theme) -> Promise<artifact>` and hydrated `artifact.exportTheme` with `editorial-strategy` fallback.

- [ ] **Step 1: Write failing persistence tests**

Test local persistence across a new store instance, invalid-theme fallback, legacy artifacts without a theme, Supabase hydration from `export_theme`, and a PATCH restricted to the selected project artifact.

- [ ] **Step 2: Run persistence tests to verify failure**

Run: `node --test tests/project-store.test.js tests/database-contract.test.js`
Expected: FAIL because no theme field or save interface exists.

- [ ] **Step 3: Add the database field and store interface**

Add `export_theme text not null default 'editorial-strategy'` with a three-value check constraint to `artifacts`. Implement `normalizeExportTheme(value)` and `saveExportTheme(artifactId, theme)` in both local and Supabase store adapters; hydrate snake_case rows to `exportTheme`.

- [ ] **Step 4: Run persistence tests**

Run: `node --test tests/project-store.test.js tests/database-contract.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add supabase/migrations/202610250001_fas_production.sql assets/js/project-store.js tests/project-store.test.js tests/database-contract.test.js && git commit -m "feat: persist blueprint export branding"`

### Task 3: Modular three-theme 4–5 page PDF renderer

**Files:**
- Create: `lib/pdf-themes.js`
- Create: `lib/anchor-report-renderer.js`
- Modify: `lib/export-service.js`
- Modify: `server.js`
- Test: `tests/export-service.test.js`
- Test: `tests/review-fixes.test.js`

**Interfaces:**
- Consumes: `renderPdf(artifact, {theme})`, where theme is one of the three canonical keys.
- Produces: a valid multi-page PDF buffer; `assertExportRequest(body)` returns `{format, artifact, theme}` and defaults invalid/missing legacy values to `editorial-strategy`.

- [ ] **Step 1: Write failing renderer tests**

Use a complete Anchor fixture and assert all three themes render `%PDF-`, contain 4–5 pages, exceed a meaningful byte-size floor, embed report metadata, and produce distinct bytes. Add tests for long Unicode/unbroken text, unknown-theme fallback, non-Anchor legacy export, and DOCX regression.

- [ ] **Step 2: Run renderer tests to verify failure**

Run: `node --test tests/export-service.test.js tests/review-fixes.test.js`
Expected: FAIL because rendering is single-theme and content-stream based.

- [ ] **Step 3: Define theme tokens**

Create `lib/pdf-themes.js` exporting `DEFAULT_THEME`, `THEMES`, and `normalizeTheme(value)`. Each theme defines palette, typography scale, surfaces, cover/header treatment, chart colors, and footer styling corresponding to the approved previews.

- [ ] **Step 4: Implement shared Anchor report layout primitives**

Create `lib/anchor-report-renderer.js` exporting `renderAnchorReport(pdf, artifact, theme, fonts)`. Implement fixed report roles across 4–5 pages: cover/executive brief; authority foundation/statement; evidence matrix/scorecard; positioning map/messaging; risks/30-day timeline/recommendations. Add measured wrapping, safe page regions, local geometric header artwork, tables, charts, page numbers, version, and evidence fingerprint.

- [ ] **Step 5: Route export requests through the selected theme**

Update `normalizeArtifact()` to retain validated semantic report fields and source metadata. Update `assertExportRequest()` to normalize `body.theme`, `renderPdf(source, options)` to use the Anchor renderer for premium Anchor artifacts, and `/api/exports` to pass `{theme: request.theme}`. Keep the generic renderer for other agents.

- [ ] **Step 6: Run renderer tests**

Run: `node --test tests/export-service.test.js tests/review-fixes.test.js`
Expected: PASS with each premium fixture producing 4–5 pages and all legacy tests green.

- [ ] **Step 7: Commit**

Run: `git add lib/pdf-themes.js lib/anchor-report-renderer.js lib/export-service.js server.js tests/export-service.test.js tests/review-fixes.test.js && git commit -m "feat: render three premium anchor PDF themes"`

### Task 4: One-click branding chooser and full integration

**Files:**
- Modify: `assets/js/artifact-ui.js`
- Modify: `assets/css/styles.css`
- Modify: `review.html`
- Test: `tests/review-fixes.test.js`
- Test: `tests/production-journey.test.js`

**Interfaces:**
- Consumes: selected artifact, saved `exportTheme`, and the three canonical theme keys.
- Produces: accessible chooser modal; `download(artifact, 'pdf', previewWindow, theme)` sends the selected theme; choice persists via `store.saveExportTheme()` and immediately starts one export.

- [ ] **Step 1: Write failing chooser tests**

Assert PDF opens a chooser rather than exporting immediately; all three cards have preview, name, and description; keyboard/escape/backdrop dismissal works; a card click saves its key and sends it to `/api/exports`; pending state prevents duplicate exports; failure restores chooser state; DOCX remains direct.

- [ ] **Step 2: Run chooser tests to verify failure**

Run: `node --test tests/review-fixes.test.js tests/production-journey.test.js`
Expected: FAIL because the current PDF control immediately opens the generic export.

- [ ] **Step 3: Implement the chooser markup and behavior**

In `assets/js/artifact-ui.js`, build the chooser dynamically with dialog semantics, focus management, three theme preview cards, selected-state treatment, and one-click `choose -> persist -> export`. Reuse the existing notice/error system and validate the returned PDF signature.

- [ ] **Step 4: Implement approved visual styling**

In `assets/css/styles.css`, add responsive chooser, preview, progress, focus, and reduced-motion styles matching the three approved mockups. Add only the minimal static dialog host or accessibility hooks to `review.html` if dynamic construction cannot provide them cleanly.

- [ ] **Step 5: Run focused integration tests**

Run: `node --test tests/review-fixes.test.js tests/production-journey.test.js`
Expected: PASS.

- [ ] **Step 6: Run the complete test and build suite**

Run: `npm test && npm run build`
Expected: all tests pass and the static production copy builds without drift.

- [ ] **Step 7: Manually verify all three downloads**

Complete or reopen Anchor, open the PDF chooser, download each theme, and inspect the resulting 4–5 page documents at normal zoom. Verify headers, background artwork, tables, charts, page flow, filenames, MIME type, saved preference, and no duplicate download on rapid click.

- [ ] **Step 8: Commit**

Run: `git add assets/js/artifact-ui.js assets/css/styles.css review.html tests/review-fixes.test.js tests/production-journey.test.js public && git commit -m "feat: choose blueprint branding before PDF export"`

## Self-Review Result

- Spec coverage: all report-content, three-theme, persistence, error, DOCX compatibility, and verification requirements map to Tasks 1–4.
- Step scan: each implementation unit has its own red/green cycle and independently reviewable output.
- Type consistency: theme keys and `saveExportTheme(artifactId, theme)` are identical across store, UI, request, and renderer boundaries.
- Review focus: all five identified failure classes have explicit tests in their owning tasks.
- Proportion: the plan records interfaces and observable tests without transcribing implementation bodies.
