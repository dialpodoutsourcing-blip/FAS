# Anchor Legacy Blueprint Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Regenerate a premium Anchor blueprint from the user's six already-saved answers when an older saved Anchor artifact lacks `premiumReport`, without asking the user to re-enter anything.

**Architecture:** Add a small UMD upgrade module that owns legacy detection, exact-answer recovery, AI synthesis with deterministic fallback, and the one-version-only upgrade flow. Add an explicit versioning method to both project-store backends so the browser app appends version 2 to the existing artifact rather than creating another artifact row. The review controller runs the upgrade only on the Anchor review page, reloads persisted state, and then renders the upgraded report.

**Tech Stack:** Browser JavaScript (UMD), Node.js built-in test runner, localStorage, Supabase REST, existing Express `/api/artifact-synthesis` endpoint

**Spec:** `docs/superpowers/specs/2026-10-25-anchor-legacy-upgrade-design.md`

## Global Constraints

- Use only the six existing fields: `anchor.authority`, `anchor.arena`, `anchor.evidence`, `anchor.position`, `anchor.boundaries`, and `anchor.activation`.
- Never delete or rewrite answers, and never mutate a previously saved artifact-version snapshot.
- Do not upgrade non-Anchor artifacts, already-premium Anchor artifacts, or projects missing any required non-empty answer.
- AI failure must still produce the complete deterministic `premiumReport` already supplied by `FAS.artifacts.build('anchor', project)`.
- A successful upgrade creates exactly one new draft version under the existing artifact ID; reopening must not create another.
- The same orchestration must work through local and Supabase stores.

## Review Focus

- Duplicate answers for one field: use the latest non-empty saved answer and keep its real source ID for citations.
- Two tabs race to upgrade the same version: reject a stale expected version instead of appending duplicate version numbers.
- AI returns an HTTP error or malformed content: retain and save the deterministic premium fallback.
- Supabase versioning: PATCH the existing project-scoped artifact and POST version 2; never POST a second artifact metadata row.
- Save failure after synthesis: keep the old report visible with a retry action and do not claim the upgrade was persisted.

---

## File Structure

- Create `assets/js/anchor-artifact-upgrade.js`: pure legacy detection, answer selection, synthesis request, and upgrade orchestration shared with tests.
- Create `tests/anchor-artifact-upgrade.test.js`: behavior tests for success, fallback, no-op, provenance, and missing-input paths.
- Modify `assets/js/project-store.js`: add optimistic `saveArtifactVersion(artifactId, expectedVersion, artifact)` to local and Supabase stores.
- Modify `tests/project-store.test.js`: prove immutable local versioning and existing-row Supabase versioning.
- Modify `assets/js/artifact-ui.js`: run the upgrade before rendering and expose loading/retry states.
- Modify `assets/css/styles.css`: style the compact upgrade/loading/error panel.
- Modify `review.html`: load the upgrade module before the review controller.
- Modify `tests/review-fixes.test.js`: pin review-page integration, copy, retry, and one-time reload behavior.
- Modify `docs/superpowers/specs/2026-10-25-anchor-legacy-upgrade-design.md`: record the user's approval.

### Task 1: Pure Anchor Upgrade Orchestration

**Files:**
- Create: `tests/anchor-artifact-upgrade.test.js`
- Create: `assets/js/anchor-artifact-upgrade.js`

**Interfaces:**
- Consumes: `artifacts.build(agentKey, project)`, `artifacts.applySynthesis(artifact, synthesis)`, a `fetchImpl(url, init)` function, and a `saveVersion(artifactId, expectedVersion, artifact)` callback.
- Produces: `requiredFields`, `collectAnswers(project)`, `needsUpgrade(agentKey, selected, project)`, `requestSynthesis(answers, fetchImpl)`, and `upgrade(options) -> Promise<{ upgraded, artifact, reason }>`.

- [ ] **Step 1: Write failing tests for answer recovery and upgrade eligibility**

  Test that `collectAnswers(project)` returns the latest non-empty answer for each exact required field in field order, preserving `{id, field, text}`, and returns `null` if one field is absent. Test that `needsUpgrade` is true only for an Anchor artifact with sections, no `premiumReport`, and all six answers; assert false for another agent, missing answers, and an already-premium latest version.

- [ ] **Step 2: Run the focused tests and verify the module is missing**

  Run: `node --test tests/anchor-artifact-upgrade.test.js`

  Expected: FAIL because `assets/js/anchor-artifact-upgrade.js` does not exist.

- [ ] **Step 3: Implement the UMD module's selection and eligibility functions**

  `collectAnswers(project)` must traverse saved answers in order so later answers supersede earlier ones, accept `agentKey`/`agent_key`, and accept only trimmed non-empty `text` values. `needsUpgrade(agentKey, selected, project)` must require `agentKey === 'anchor'`, an existing legacy artifact with sections, no `premiumReport`, and a complete collected answer set.

- [ ] **Step 4: Write failing tests for synthesis success, fallback, one save, and no-op paths**

  Assert that `upgrade(options)` posts the six `{id,field,text}` answers to `/api/artifact-synthesis`, applies `payload.sections`, preserves the selected export theme, calls `saveVersion(selected.artifactId || selected.id, selected.version, upgradedArtifact)` once, and returns `upgraded: true`. Also assert that a rejected synthesis saves the built fallback containing `premiumReport`, while already-premium, incomplete, and non-Anchor cases do not call fetch, build, or save.

- [ ] **Step 5: Implement request and orchestration functions**

  `requestSynthesis(answers, fetchImpl)` sends JSON `{agentKey:'anchor', answers}` and rejects non-OK responses. `upgrade({agentKey, project, selected, artifacts, fetchImpl, saveVersion})` builds from saved project data, carries forward the selected theme, applies valid synthesis when available, keeps the built fallback on synthesis failure, and lets save failures reject so the UI can show them.

- [ ] **Step 6: Run the focused tests**

  Run: `node --test tests/anchor-artifact-upgrade.test.js`

  Expected: all tests PASS.

- [ ] **Step 7: Commit the pure upgrade unit**

  ```bash
  git add assets/js/anchor-artifact-upgrade.js tests/anchor-artifact-upgrade.test.js
  git commit -m "feat: rebuild legacy anchor reports from saved answers"
  ```

### Task 2: Append a Version to an Existing Artifact

**Files:**
- Modify: `tests/project-store.test.js`
- Modify: `assets/js/project-store.js`

**Interfaces:**
- Consumes: an existing artifact ID, its selected/current version number, and the regenerated artifact content from Task 1.
- Produces: `store.saveArtifactVersion(artifactId, expectedVersion, artifact) -> Promise<savedArtifact>` in both local and Supabase modes.

- [ ] **Step 1: Write failing local-store tests**

  Seed and approve legacy Anchor version 1, call `saveArtifactVersion('anchor-map', 1, premiumArtifact)`, then assert: one artifact metadata record, two version snapshots, version 1 remains approved and lacks the new report, version 2 is draft and contains `premiumReport`, and the artifact's `currentVersion` is 2. Add a stale-call assertion that a second call with expected version 1 rejects and does not create version 3.

- [ ] **Step 2: Run the store tests and verify the new method is missing**

  Run: `node --test tests/project-store.test.js`

  Expected: FAIL with `saveArtifactVersion is not a function`.

- [ ] **Step 3: Implement local optimistic version append**

  Add `saveArtifactVersion(artifactId, expectedVersion, artifact)` to `localStore`. Locate existing metadata by `artifactId`, require its `currentVersion` to equal `expectedVersion`, replace only current metadata with normalized premium content while retaining that persistent ID, append a cloned draft snapshot at `expectedVersion + 1`, persist, and leave earlier snapshots untouched.

- [ ] **Step 4: Write the failing Supabase-store test**

  With `expectedVersion === 1`, assert a project-scoped PATCH to `artifacts?id=eq.<id>&project_id=eq.<project>&current_version=eq.1` sets `current_version:2` and `status:'draft'`, followed by one POST to `artifact_versions` with the same artifact ID, version 2, premium content, and source IDs. Assert there is no POST to `artifacts`; an empty PATCH result must reject as stale/not found.

- [ ] **Step 5: Implement Supabase optimistic version append**

  Add the same method to `supabaseStore`, require authenticated context, PATCH only the matching current version, reject an empty returned row set, then POST the new immutable version with `version: expectedVersion + 1` and return hydrated metadata.

- [ ] **Step 6: Run focused store tests**

  Run: `node --test tests/project-store.test.js`

  Expected: all tests PASS.

- [ ] **Step 7: Commit version-safe persistence**

  ```bash
  git add assets/js/project-store.js tests/project-store.test.js
  git commit -m "feat: append regenerated artifact versions safely"
  ```

### Task 3: Automatic Review-Page Upgrade Experience

**Files:**
- Modify: `tests/review-fixes.test.js`
- Modify: `review.html`
- Modify: `assets/js/artifact-ui.js`
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: `FAS.anchorArtifactUpgrade.needsUpgrade(...)`, `.upgrade(...)`, `store.saveArtifactVersion(...)`, and the existing review renderer.
- Produces: automatic Anchor-only upgrade before render, a compact “Upgrading your blueprint…” state, an actionable retry state, and a single post-save project reload.

- [ ] **Step 1: Write failing review integration tests**

  Assert `review.html` loads `anchor-artifact-upgrade.js` before `artifact-ui.js`. Assert the controller gates auto-upgrade on `data-artifact-review` and `agentKey === 'anchor'`, displays exact copy `Upgrading your blueprint…`, passes `store.saveArtifactVersion` into the module, reloads the project after a successful save, and shows `We couldn't save your upgraded blueprint.` plus a `Try again` button after rejection. Assert the CSS contains compact upgrade-state and error styling.

- [ ] **Step 2: Run review tests and verify failure**

  Run: `node --test tests/review-fixes.test.js`

  Expected: FAIL on the missing module script and upgrade-state contracts.

- [ ] **Step 3: Refactor review startup into load, upgrade, and render phases**

  In `artifact-ui.js`, keep the latest-version selection in one helper. On the Anchor review page, evaluate `needsUpgrade`; if false, render normally. If true, replace `.main__body` with the loading panel, call `upgrade`, reload `store.loadProject()`, select the now-latest version, and render it. The latest version's `premiumReport` makes subsequent opens a no-op.

- [ ] **Step 4: Implement the actionable failure state**

  If upgrade persistence rejects, render the existing legacy artifact plus a visible error panel/button. The retry button reruns the same upgrade flow; it must not redirect, erase answers, or claim success before the reload confirms the new version.

- [ ] **Step 5: Add the script and compact styles**

  Load `assets/js/anchor-artifact-upgrade.js` between `artifacts.js` and `artifact-ui.js` in `review.html`. Add responsive styles for the loading/error panel that match the existing black-and-gold review UI.

- [ ] **Step 6: Run focused UI and journey tests**

  Run: `node --test tests/review-fixes.test.js tests/production-journey.test.js`

  Expected: all tests PASS.

- [ ] **Step 7: Commit the automatic upgrade experience**

  ```bash
  git add review.html assets/js/artifact-ui.js assets/css/styles.css tests/review-fixes.test.js
  git commit -m "feat: upgrade legacy anchor blueprint on review"
  ```

### Task 4: Build and Regression Verification

**Files:**
- Modify: `docs/superpowers/specs/2026-10-25-anchor-legacy-upgrade-design.md`
- Generated by build: `public/`

**Interfaces:**
- Consumes: the completed upgrade, persistence, and review integration from Tasks 1–3.
- Produces: a verified browser bundle with the new module present and no regression to exports, themes, review routing, or the full interview journey.

- [ ] **Step 1: Run the full test suite**

  Run: `npm test`

  Expected: 100% passing, including synthesis, artifact, store, export, review, and journey tests.

- [ ] **Step 2: Build the deployable browser files**

  Run: `npm run build`

  Expected: exit 0 and `public/assets/js/anchor-artifact-upgrade.js` exists.

- [ ] **Step 3: Verify the built asset and local routes**

  Run: `Invoke-WebRequest http://127.0.0.1:4173/assets/js/anchor-artifact-upgrade.js -UseBasicParsing` and `Invoke-WebRequest 'http://127.0.0.1:4173/review.html?asset=anchor' -UseBasicParsing`.

  Expected: both responses return HTTP 200, and the review HTML references the upgrade module before the controller.

- [ ] **Step 4: Inspect the final diff and working tree**

  Run: `git diff --check` and `git status --short`.

  Expected: no whitespace errors; only planned source/test/docs changes, generated `public/` updates if tracked, and the pre-existing user file `anchor-window-test.png` remains untouched.

- [ ] **Step 5: Commit verification/build outputs if tracked**

  ```bash
  git add docs/superpowers/specs/2026-10-25-anchor-legacy-upgrade-design.md public
  git commit -m "docs: finalize anchor legacy upgrade"
  ```
