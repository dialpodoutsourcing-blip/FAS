# Dynamic My Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fictional demo Vault with a clear library of the user's latest real completed or approved artifacts and export each exact saved version.

**Architecture:** Extract testable Vault selection logic into a focused browser/CommonJS module, then let `artifact-ui.js` render the library and reuse the existing live artifact and authenticated export paths. Reduce `vault.html` to a loading shell and add responsive library styles; generated public assets follow through the existing build.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, CommonJS-compatible browser modules, Node.js built-in test runner

**Spec:** `docs/superpowers/specs/2026-11-12-dynamic-my-vault-design.md`

## Global Constraints

- Render only active, current artifacts with document sections.
- Show one latest current version per artifact.
- Label exact version status as `Approved` or `Completed`.
- Never display fictional/demo content or link bundled demo PDFs.
- PDF export must receive the exact artifact/version displayed.
- Preserve existing authenticated export, premium renderer, and approval behavior.
- No new runtime dependency.

## Review Focus

- An active artifact whose current version row is missing must not fall back to an older version.
- Duplicate artifact/version rows must not create duplicate cards.
- Artifacts with unknown specialists must sort safely after known specialists.
- Export clicks during an in-flight request must not create duplicate downloads.
- Returning from expanded view must restore focus only when the originating button remains connected.

---

### Task 1: Current Vault artifact selection

**Files:**
- Create: `assets/js/vault-library.js`
- Create: `tests/vault-library.test.js`

**Interfaces:**
- Consumes: `buildItems(project, agentOrder)` where `project` has active `artifacts` and `artifactVersions`.
- Produces: ordered library items `{ artifact, version, agentKey, title, statusLabel, summary }` with one exact current version per active artifact.

- [ ] **Step 1: Write failing selection tests**

Cover active current-version matching, approved/completed labels, retired/missing/sectionless exclusion, duplicate suppression, no fallback to stale versions, specialist ordering, unknown specialists, and summary extraction from the first meaningful block.

- [ ] **Step 2: Run the test and verify it fails because the module is absent**

Run: `node --test tests/vault-library.test.js`

- [ ] **Step 3: Implement `buildItems(project, agentOrder)`**

Use active artifact IDs and exact numeric `currentVersion` matches. Return immutable plain items sorted by agent order then title.

- [ ] **Step 4: Run the test and verify it passes**

Run: `node --test tests/vault-library.test.js`

### Task 2: Dynamic Vault library and exact downloads

**Files:**
- Modify: `vault.html`
- Modify: `assets/js/artifact-ui.js`
- Modify: `assets/css/styles.css`
- Modify: `tests/review-fixes.test.js`
- Replace: `tests/static-vault-demo.test.js` with dynamic Vault assertions

**Interfaces:**
- Consumes: `FAS.vaultLibrary.buildItems(project, FAS.agents.keys)` and existing `download(artifact, format, theme)`.
- Produces: loading, empty, error, library, expanded-document, and per-card export states.

- [ ] **Step 1: Write failing integration/static tests**

Assert Vault loads `vault-library.js` before `artifact-ui.js`; contains only a semantic loading root; contains no demo copy, demo panels, demo PDF links, tabs, or download-everything action; controller loads the project once, renders cards from `buildItems`, passes `item.version` to PDF export, expands the exact version, returns to the list, and restores focus safely.

- [ ] **Step 2: Run focused tests and verify failures**

Run: `node --test tests/vault-library.test.js tests/review-fixes.test.js && node tests/static-vault-demo.test.js`

- [ ] **Step 3: Simplify `vault.html` and add the module script**

Keep the authenticated shell/navigation, replace static Vault content with the approved header and one `[data-vault-root]` loading state, and load `vault-library.js` before `artifact-ui.js`.

- [ ] **Step 4: Implement Vault rendering in `artifact-ui.js`**

Branch Vault initialization away from review loading. Render only `buildItems` results. Add card actions for view, exact PDF export, and specialist edit. Reuse the existing live document construction for expanded view without showing approval controls in Vault. Add back navigation and safe focus restoration.

- [ ] **Step 5: Add responsive library styles and state styles**

Create compact single-column cards with readable summary, visible status, clear actions, neutral loading/empty/error panels, and narrow-screen stacking.

- [ ] **Step 6: Run focused tests and verify they pass**

Run: `node --test tests/vault-library.test.js tests/review-fixes.test.js && node tests/static-vault-demo.test.js`

### Task 3: Build mirrors and complete verification

**Files:**
- Modify: generated `public/vault.html`, `public/assets/js/vault-library.js`, `public/assets/js/artifact-ui.js`, and `public/assets/css/styles.css` through the build command
- Test: full suite

**Interfaces:**
- Consumes: completed dynamic Vault implementation.
- Produces: deployable source/public parity and a green regression suite.

- [ ] **Step 1: Build deployable mirrors**

Run: `npm run build`

- [ ] **Step 2: Run the full suite**

Run: `npm test`

- [ ] **Step 3: Inspect final scope**

Run: `git diff --check && git status --short && git diff --stat`


