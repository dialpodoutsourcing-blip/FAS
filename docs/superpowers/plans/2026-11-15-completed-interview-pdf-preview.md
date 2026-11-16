# Completed Interview PDF Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show completed users a View PDF / Retry answering choice and open the matching generated PDF in an embedded Vault viewer.

**Architecture:** Extend the existing completion dialog and chat controller to route completed work into the Vault while retaining the existing confirmed-reset path. Add a focused, testable PDF-viewer controller that owns blob URL lifecycle, then connect it to the Vault's existing export cache and artifact selection flow.

**Tech Stack:** Plain browser JavaScript, HTML/CSS native dialogs, Express export endpoint, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-11-15-completed-interview-pdf-preview-design.md`

## Global Constraints

- Use the existing `/api/exports` PDF renderer, export cache, signature validation, and retry confirmation/reset behavior.
- The feature applies to every specialist and preserves available project/session route context.
- Temporary PDF object URLs must be revoked when closed or replaced.
- Do not add permanent PDF storage, alter PDF contents/themes, reset automatically, or replace the existing artifact preview.
- Loading, invalid PDF, export failure, and embed limitations must leave visible recovery controls.

## Review Focus

- A completed session with no current artifact keeps the Vault usable and shows a retryable preparation error (Task 3).
- Reopening or switching PDFs revokes the previous blob URL without revoking the active one (Task 2).
- Closing via button, Escape, or dialog cancellation revokes the blob URL and restores focus (Task 2).
- Project and session identifiers containing reserved URL characters survive chat-to-Vault navigation (Task 1).
- Browsers that cannot embed PDFs still expose open/download recovery controls (Task 2).

---

### Task 1: Completed-chat action contract

**Files:**
- Create: `assets/js/completed-work-actions.js`
- Modify: `chat.html:352-360`
- Modify: `assets/js/adam.js:292-341`
- Test: `tests/completed-work-actions.test.js`
- Test: `tests/static-multi-agent.test.js`

**Interfaces:**
- Consumes: current `agentKey`, `projectId`, `sessionId`, and the existing retry-confirmation callback in `adam.js`.
- Produces: `FAS.completedWorkActions.buildVaultPdfUrl({agentKey, projectId, sessionId}) -> string` and completion-dialog hooks `data-completion-view-pdf` / `data-completion-retry`.

- [ ] **Step 1: Write the failing URL-contract tests**

Assert that `buildVaultPdfUrl` returns `vault.html?agent=anchor&preview=pdf`, omits `project=local-default`, preserves non-local project/session values through `URLSearchParams`, and safely encodes reserved characters.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/completed-work-actions.test.js`

Expected: FAIL because `assets/js/completed-work-actions.js` does not exist.

- [ ] **Step 3: Implement the route helper and completion markup/controller wiring**

Create the UMD-style helper used elsewhere in `assets/js`; replace the generation-only action with primary **View PDF** and secondary **Retry answering** buttons. On already-completed startup, keep the dialog open; View PDF navigates with the helper, while Retry answering closes the completion dialog and invokes the existing confirmation modal without resetting directly.

- [ ] **Step 4: Add failing-then-passing static assertions for dialog copy, hooks, script order, and removal of the generation-only action**

Run after adding assertions: `node --test tests/static-multi-agent.test.js`

Expected before markup/controller changes: FAIL on the missing hooks; expected after implementation: PASS.

- [ ] **Step 5: Run Task 1 tests**

Run: `node --test tests/completed-work-actions.test.js tests/static-multi-agent.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add assets/js/completed-work-actions.js assets/js/adam.js chat.html tests/completed-work-actions.test.js tests/static-multi-agent.test.js
git commit -m "feat: offer completed interview actions"
```

### Task 2: Accessible PDF viewer controller

**Files:**
- Create: `assets/js/pdf-preview.js`
- Modify: `vault.html:119`
- Modify: `assets/css/styles.css`
- Test: `tests/pdf-preview.test.js`
- Test: `tests/static-vault-demo.test.js`

**Interfaces:**
- Consumes: `prepare() -> Promise<{blob: Blob, disposition: string}>`, optional origin element, and browser `URL.createObjectURL` / `URL.revokeObjectURL`.
- Produces: `FAS.pdfPreview.create(options)` with `open({artifact, title, prepare, origin}) -> Promise<void>`, `close()`, and `isOpen()`.

- [ ] **Step 1: Write failing controller tests**

Test loading-to-ready state, embedded object URL, filename/open/download recovery controls, export rejection with a retry action, replacement URL revocation, and close/cancel/Escape cleanup with focus restoration.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/pdf-preview.test.js`

Expected: FAIL because `assets/js/pdf-preview.js` does not exist.

- [ ] **Step 3: Implement the minimal viewer controller**

Use a labelled native dialog with the repository's fallback conventions, an `<object type="application/pdf">` surface, an external-open link, download link, retry button, close button, and live preparation/error status. Own exactly one active object URL and revoke it only on replacement or close.

- [ ] **Step 4: Add failing-then-passing static shell/style assertions**

Assert `pdf-preview.js` loads before `artifact-ui.js`, and CSS includes the PDF dialog, responsive viewer height, sticky header, loading/error state, and reduced-width actions.

Run: `node --test tests/static-vault-demo.test.js`

Expected before HTML/CSS changes: FAIL; expected after implementation: PASS.

- [ ] **Step 5: Run Task 2 tests**

Run: `node --test tests/pdf-preview.test.js tests/static-vault-demo.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add assets/js/pdf-preview.js assets/css/styles.css vault.html tests/pdf-preview.test.js tests/static-vault-demo.test.js
git commit -m "feat: add vault PDF viewer"
```

### Task 3: Vault export and deep-link integration

**Files:**
- Modify: `assets/js/artifact-ui.js:19-24,64-68`
- Modify: `assets/js/vault-library.js`
- Test: `tests/vault-library.test.js`
- Test: `tests/artifact-ui-pdf-preview.test.js`

**Interfaces:**
- Consumes: Task 2's `FAS.pdfPreview.create(options)` and existing cached `prepareDownload(artifact, 'pdf', theme)` result.
- Produces: selection of the latest artifact for `?agent=<key>&preview=pdf`, one automatic preview attempt after Vault loading, and a reusable **View PDF** action in each artifact preview.

- [ ] **Step 1: Write failing library selection tests**

Add a pure `selectRouteItem(items, {agentKey})` contract that returns the matching specialist's latest visible artifact and returns `null` when none exists.

- [ ] **Step 2: Run the library test and verify RED**

Run: `node --test tests/vault-library.test.js`

Expected: FAIL because `selectRouteItem` is missing.

- [ ] **Step 3: Implement the minimal route selector**

Export `selectRouteItem(items, route)` from `vault-library.js` without changing existing filtering or sort semantics.

- [ ] **Step 4: Write failing artifact UI integration tests**

Exercise `?agent=<key>&preview=pdf`, verify exactly one cached PDF preparation call for the selected artifact, verify normal preview buttons call the same viewer path, and verify a missing artifact/export failure renders a retryable notice without removing the Vault library.

- [ ] **Step 5: Run the integration test and verify RED**

Run: `node --test tests/artifact-ui-pdf-preview.test.js`

Expected: FAIL because `artifact-ui.js` only downloads PDFs and does not consume the preview route.

- [ ] **Step 6: Integrate cached preparation with the viewer**

Split cached export preparation from `startDownload`, pass the cached `{blob, disposition}` into Task 2's controller, change Vault wording from **Download PDF** to **View PDF**, and auto-open once only after the matching artifact is rendered. Keep explicit download behavior inside the PDF viewer.

- [ ] **Step 7: Run Task 3 tests**

Run: `node --test tests/vault-library.test.js tests/artifact-ui-pdf-preview.test.js`

Expected: PASS.

- [ ] **Step 8: Run the complete suite and build**

Run: `npm test`

Expected: all tests PASS with no unexpected warnings.

Run: `npm run build`

Expected: build completes and copies all new browser assets into `public/`.

- [ ] **Step 9: Commit**

```bash
git add assets/js/artifact-ui.js assets/js/vault-library.js tests/vault-library.test.js tests/artifact-ui-pdf-preview.test.js public
git commit -m "feat: preview completed PDFs from the vault"
```


