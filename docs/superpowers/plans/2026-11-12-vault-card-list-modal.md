# Vault Card/List and Modal Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn My Vault into a compact card/list document library with a remembered layout choice and an accessible modal preview.

**Architecture:** Extend the focused Vault helper with view-preference normalization, then update the existing Vault controller to render one semantic toolbar and two CSS-driven library layouts. Reuse the exact saved-version document renderer and export gate inside one native dialog so preview does not navigate away or duplicate exports.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, browser localStorage, native dialog, CommonJS-compatible helper module, Node.js test runner

**Spec:** `docs/superpowers/specs/2026-11-12-vault-card-list-modal-design.md`

## Global Constraints

- Card view is the default; users can switch between Cards and List.
- Remember the selected view locally and fail safely when storage is unavailable.
- Library cards/rows show only specialist, status, title, version, and a short clamped summary.
- Preview uses the exact selected saved version and opens without navigating away.
- Preview, Download PDF, Edit, and Close remain explicit text actions.
- Preserve duplicate-card, stale-version, and duplicate-export protections.
- Preserve authenticated loading/export behavior and source/public parity.
- No new runtime dependency.

## Review Focus

- Invalid or unavailable stored view preference must fall back to Cards without breaking Vault.
- Repeated view changes must keep one library and one active selection rather than duplicating controls.
- Opening and closing previews repeatedly must remove old dialogs and restore focus only to a connected trigger.
- A preview opened while a card PDF export is pending must share the existing export gate.
- Long titles and summaries must clamp without horizontal overflow in both layouts and narrow screens.

---

### Task 1: Safe remembered view preference

**Files:**
- Modify: `assets/js/vault-library.js`
- Modify: `tests/vault-library.test.js`

**Interfaces:**
- Produces: `normalizeView(value) -> 'cards' | 'list'` and `createViewPreference(storage, key)` with `load()` and `save(view)`.
- Consumes: optional Storage-compatible object whose reads or writes may throw.

- [ ] **Step 1: Write failing preference tests**

Cover Cards default, valid List restoration, invalid values, unavailable storage, thrown reads/writes, and normalized saves.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/vault-library.test.js`
Expected: FAIL because the preference API is absent.

- [ ] **Step 3: Implement the preference API**

Keep it side-effect free except for the injected storage calls and never allow storage failure to escape.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test tests/vault-library.test.js`
Expected: all Vault helper tests pass.

- [ ] **Step 5: Commit**

Commit: `feat: remember vault layout preference`

### Task 2: Compact card/list library and modal preview

**Files:**
- Modify: `assets/js/artifact-ui.js`
- Modify: `assets/css/styles.css`
- Modify: `tests/review-fixes.test.js`
- Modify: `tests/static-vault-demo.test.js`

**Interfaces:**
- Consumes: Task 1 `createViewPreference(window.localStorage, 'fas.vault.view')` and existing `buildReview(item.version, versions)` / `runVaultExport(...)`.
- Produces: one `[data-vault-toolbar]`, toggle buttons with pressed state, `.vault-library--cards|--list`, and one `.vault-preview-dialog` per selected item.

- [ ] **Step 1: Write failing controller and style tests**

Assert the controller restores Cards/List, updates and saves the toggle state, keeps summaries concise, opens the exact version in a dialog, exposes Preview/Download/Edit/Close, closes on native cancel/backdrop, removes the dialog, restores connected-trigger focus, and retains the shared export gate. Assert responsive grid/list styling, line clamping, modal sizing, sticky header, and narrow-screen behavior.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/vault-library.test.js tests/review-fixes.test.js && node tests/static-vault-demo.test.js`
Expected: FAIL because toggle/modal behavior and styles do not exist.

- [ ] **Step 3: Replace expanded inline preview with one dialog preview**

Render a compact toolbar and library. Toggle only the library modifier class and pressed state; do not reload project data. Build preview from the exact item version, remove review-only approval/restart controls, and share the existing export gate.

- [ ] **Step 4: Add compact card, list, and modal styles**

Use a responsive card grid, dense list rows, two/three-line clamps, a wide scrollable dialog, sticky preview header/actions, backdrop treatment, and full-width narrow-screen actions.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `node --test tests/vault-library.test.js tests/review-fixes.test.js && node tests/static-vault-demo.test.js`
Expected: all focused tests pass.

- [ ] **Step 6: Commit**

Commit: `feat: add vault views and modal preview`

### Task 3: Deployable mirrors and verification

**Files:**
- Modify through build: `public/assets/js/vault-library.js`, `public/assets/js/artifact-ui.js`, `public/assets/css/styles.css`
- Test: full suite

**Interfaces:**
- Consumes: completed source implementation.
- Produces: byte-matching deployable public assets.

- [ ] **Step 1: Build public mirrors**

Run: `npm run build`
Expected: `Prepared FAS browser files in public/.`

- [ ] **Step 2: Run full verification**

Run: `npm test`
Expected: zero failures; the optional live Supabase test may remain skipped.

- [ ] **Step 3: Inspect scope and parity**

Run: `git diff --check && git status --short && git diff --stat`
Expected: only the spec, plan, source, tests, and generated mirrors for this feature.

- [ ] **Step 4: Commit**

Commit: `build: update vault view assets`
