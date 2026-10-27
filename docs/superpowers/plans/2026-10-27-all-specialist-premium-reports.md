# All-Specialist Premium Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver ANCHOR-quality, nine-page, chart-rich PDF reports with realistic object covers and three themes for all seven FAS specialists.

**Architecture:** Extract shared PDF layout, overflow, cover, and chart primitives from the approved ANCHOR visual language while preserving ANCHOR’s output. Give each specialist a deterministic source-grounded premium model and a specialist-owned nine-page composition; route all premium artifacts through a registry and keep DOCX/theme selection specialist-aware.

**Tech Stack:** JavaScript, pdf-lib, docx, browser artifact models, Node test runner, generated transparent PNG assets.

**Spec:** `docs/superpowers/specs/2026-10-27-all-specialist-premium-reports-design.md`

## Global Constraints

- All seven specialists support Editorial Strategy, Luxury Editorial, and Boardroom Consultancy.
- Every report contains nine pages and specialist-specific data graphics.
- No final report may introduce `...` or `…` as a layout-truncation marker.
- Private and pending evidence is excluded; sparse input becomes an explicit gap.
- ANCHOR’s approved appearance and content must not regress.
- Cover artwork contains no generated text or third-party marks.

## Review Focus

- Extremely long unbroken input must stay within page bounds without ellipsis or renderer failure.
- Sparse projects must still produce nine honest pages with labeled gaps, not invented claims.
- Legacy artifacts without `premiumReport` must upgrade non-destructively or use a specialist premium fallback.
- Theme changes must preserve chart meaning and readable contrast.
- Generated object assets must remain transparent, text-free, and visually recognizable at cover scale.

---

### Task 1: Shared premium PDF primitives and renderer registry

**Files:**
- Create: `lib/premium-report-primitives.js`
- Create: `lib/premium-report-registry.js`
- Modify: `lib/anchor-report-renderer.js`
- Modify: `lib/export-service.js`
- Test: `tests/export-service.test.js`

**Interfaces:**
- Produces measured `flowText`, cards, tables, timelines, matrices, bars, process nodes, shared cover/footer/page functions, and `getPremiumRenderer(agentKey)`.
- `flowText` returns consumed height and overflow text; it never writes ellipsis.

- [ ] Add failing tests for no ellipsis, bounded long content, registry coverage, and unchanged nine-page ANCHOR output.
- [ ] Run the focused export tests and verify failures.
- [ ] Implement shared primitives and registry; migrate ANCHOR without changing its content architecture.
- [ ] Run focused tests and commit `refactor: share premium report primitives`.

### Task 2: Specialist object artwork

**Files:**
- Create: `assets/images/extract-object.png`
- Create: `assets/images/radar-object.png`
- Create: `assets/images/forge-object.png`
- Create: `assets/images/architect-object.png`
- Create: `assets/images/voice-object.png`
- Create: `assets/images/launch-object.png`
- Test: `tests/report-assets.test.js`

**Interfaces:**
- Produces transparent, text-free PNGs keyed by specialist for shared cover rendering.

- [ ] Add failing asset-contract tests for dimensions, alpha channel, file bounds, and all six specialist keys.
- [ ] Generate each realistic premium object using the approved ANCHOR material-art direction.
- [ ] Inspect every asset visually and replace any asset containing text, scenery, or ambiguous symbolism.
- [ ] Run asset tests and commit `feat: add specialist report objects`.

### Task 3: Complete EXTRACT redesign

**Files:**
- Rewrite: `lib/extract-report-renderer.js`
- Modify: `lib/export-service.js`
- Test: `tests/export-service.test.js`

**Interfaces:**
- Consumes: Task 1 primitives/registry and Task 2 `extract-object.png`.
- Produces nine pages: cover, brief, origin timeline, expertise architecture, method flow, proof confidence/story matrix, point-of-view framework, risk/gap matrix, activation/final decision.

- [ ] Add failing assertions that EXTRACT invokes the required visual structures and introduces no truncation markers.
- [ ] Add long and sparse EXTRACT fixtures and verify current failures.
- [ ] Rebuild all nine pages with balanced measured layout and meaningful charts.
- [ ] Render all three themes to review files, inspect each page, and correct collisions or weak spacing.
- [ ] Run focused tests and commit `feat: redesign premium extract report`.

### Task 4: Premium models for RADAR, FORGE, ARCHITECT, VOICE, and LAUNCH

**Files:**
- Modify: `assets/js/artifacts.js`
- Test: `tests/artifacts.test.js`

**Interfaces:**
- Produces `premiumReport` models for the five remaining agents with source IDs, specialist decision data, chart inputs, risks/gaps, recommendations, and final decision.

- [ ] Add failing complete, sparse, private, and pending evidence tests for all five agents.
- [ ] Implement deterministic specialist builders without invented facts.
- [ ] Extend synthesis application only where a validated specialist model is supplied.
- [ ] Run artifact tests and commit `feat: model premium specialist reports`.

### Task 5: Five remaining specialist PDF renderers

**Files:**
- Create: `lib/radar-report-renderer.js`
- Create: `lib/forge-report-renderer.js`
- Create: `lib/architect-report-renderer.js`
- Create: `lib/voice-report-renderer.js`
- Create: `lib/launch-report-renderer.js`
- Modify: `lib/premium-report-registry.js`
- Modify: `lib/export-service.js`
- Test: `tests/export-service.test.js`

**Interfaces:**
- Consumes Tasks 1, 2, and 4.
- Produces a nine-page, three-theme renderer for each specialist with the charts required by the spec.

- [ ] Add failing page-count, metadata, theme, object, chart-instrumentation, sparse-content, and no-ellipsis tests for each specialist.
- [ ] Implement each specialist composition through shared primitives.
- [ ] Render and visually inspect one complete fixture in every specialist and theme.
- [ ] Run focused export tests and commit `feat: render all premium specialist reports`.

### Task 6: Specialist DOCX and export chooser

**Files:**
- Create: `lib/specialist-docx-renderer.js`
- Modify: `lib/export-service.js`
- Modify: `assets/js/artifact-ui.js`
- Modify: `assets/js/anchor-artifact-upgrade.js`
- Test: `tests/export-service.test.js`
- Test: `tests/artifact-ui.test.js`
- Test: `tests/anchor-artifact-upgrade.test.js`

**Interfaces:**
- Consumes specialist premium models and registry metadata.
- Produces specialist-aware DOCX headings/footer and theme previews; upgrades eligible legacy artifacts non-destructively.

- [ ] Add failing tests for specialist chooser identity, DOCX hierarchy, and legacy upgrades.
- [ ] Implement shared specialist DOCX composition and dynamic chooser labels.
- [ ] Generalize deterministic legacy upgrade for all eligible specialists.
- [ ] Run focused tests and commit `feat: finish specialist export experience`.

### Task 7: Visual acceptance and release

**Files:**
- Generated: `public/**`
- Optional review artifacts: ignored `.superpowers/sdd/**`

**Interfaces:**
- Consumes Tasks 1–6.
- Produces a verified production deployment.

- [ ] Generate a 21-file acceptance set: seven specialists across three themes.
- [ ] Inspect covers, charts, spacing, contrast, labels, and overflow; log and fix any Important defects through RED→GREEN tests.
- [ ] Run `npm test`; expect zero failures.
- [ ] Run `npm run build`; expect exit code 0.
- [ ] Run `git diff --check`; expect no whitespace errors.
- [ ] Complete whole-branch review against the spec and commit generated assets.
- [ ] Merge/push `main` and verify the exact Vercel production deployment reaches `Ready`.

