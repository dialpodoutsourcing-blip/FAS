# Completion Acknowledgement and EXTRACT Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Type and Talk an unmistakable, persistent specialist-completion response and keep EXTRACT locked until a saved ANCHOR artifact proves completion.

**Architecture:** Add a small reusable progression policy that determines whether a project has a saved ANCHOR artifact, then consume it in navigation and the EXTRACT route. Extend the existing completed-conversation UI so its specialist-specific Review action renders both immediately after the last answer and after restoring completed Chat.

**Tech Stack:** Browser JavaScript, HTML/CSS, Node test runner, existing local/Supabase project stores.

**Spec:** `docs/superpowers/specs/2026-10-27-completion-and-extract-gate-design.md`

## Global Constraints

- ANCHOR is complete only after its artifact is successfully saved.
- Existing saved work must not be deleted or altered.
- Talk must speak the completion response before automatic review navigation.
- Returning to completed Chat must retain a visible specialist-specific Review button.
- Paid specialist entitlement behavior must remain unchanged.

## Review Focus

- Blueprint save failure must leave EXTRACT locked and expose the existing retry path.
- Existing projects with a saved ANCHOR artifact must unlock EXTRACT without requiring approval.
- Direct `chat.html?agent=extract` navigation must not expose EXTRACT before ANCHOR completion.
- Restored completed ANCHOR and EXTRACT conversations must show the correct Review label and destination.
- Type and Talk completion must not create duplicate completion cards or duplicate blueprint saves.

---

### Task 1: Central progression policy

**Files:**
- Create: `assets/js/progression.js`
- Modify: `chat.html`, `index.html`, `review.html`, `vault.html`, `launch.html`
- Test: `tests/progression.test.js`

**Interfaces:**
- Produces: `FAS.progression.anchorComplete(project) -> boolean`, `FAS.progression.canEnter(agentKey, project) -> boolean`, and `FAS.progression.lockReason(agentKey, project) -> string`.
- Completion is based on `project.artifacts` containing `agentKey === 'anchor'` (or legacy `agent_key`).

- [ ] Write failing tests for empty projects, answer-only projects, saved ANCHOR artifacts, legacy keys, and unaffected ANCHOR access.
- [ ] Run `node --test tests/progression.test.js` and verify the module-missing failure.
- [ ] Implement `assets/js/progression.js` and load it before navigation/controllers on protected pages.
- [ ] Run `node --test tests/progression.test.js` and verify all cases pass.
- [ ] Commit with `feat: add specialist progression policy`.

### Task 2: Enforce the EXTRACT gate in navigation and direct routes

**Files:**
- Modify: `assets/js/nav.js`
- Modify: `assets/js/agent-access.js`
- Modify: `assets/js/adam.js`
- Modify: `index.html`
- Test: `tests/progression.test.js`
- Test: `tests/agent-access.test.js`
- Test: `tests/extract-flow.test.js`

**Interfaces:**
- Consumes: Task 1 `anchorComplete`, `canEnter`, and `lockReason`.
- Produces: locked EXTRACT links with `aria-disabled="true"`, visible “Finish ANCHOR to unlock” copy, and an EXTRACT route redirect to `chat.html?agent=anchor&notice=extract-locked`.

- [ ] Add failing tests for locked dashboard/sidebar links, unlocked saved-artifact links, and direct EXTRACT route rejection.
- [ ] Run the three named test files and verify failures describe missing progression enforcement.
- [ ] Apply lock styling/copy in navigation after the project loads; prevent locked link activation.
- [ ] Gate EXTRACT during Chat persistence initialization before the interview becomes interactive and route to ANCHOR with the notice.
- [ ] Render the lock notice in ANCHOR Chat without treating it as an answer.
- [ ] Run the three named test files and verify all pass.
- [ ] Commit with `feat: lock extract until anchor completion`.

### Task 3: Persistent Type and Talk completion response

**Files:**
- Modify: `assets/js/adam.js`
- Modify: `assets/css/styles.css`
- Test: `tests/extract-flow.test.js`

**Interfaces:**
- Consumes: existing `generateBlueprint`, `enterCompletedConversation`, `voiceCompletionCopy`, and `getCompletionUrl`.
- Produces: one persistent completion card with `[data-view-blueprint]`, specialist-specific button text, immediate Type rendering, spoken Talk acknowledgement, and restored completed-state rendering.

- [ ] Add failing tests asserting the completion card appears after the durable final turn, contains the correct Review action, survives completed-state restoration, and precedes Talk redirect.
- [ ] Run `node --test tests/extract-flow.test.js` and verify the new assertions fail.
- [ ] Extend `announceCompletion` and completed-state restoration to render one idempotent completion card with `Review ANCHOR` or `Review EXTRACT`.
- [ ] Keep automatic navigation only after successful artifact save; in Talk, await accepted completion speech before navigation.
- [ ] Style the completion card and action without hiding it in History or restored Chat.
- [ ] Run `node --test tests/extract-flow.test.js` and verify all pass.
- [ ] Commit with `feat: persist specialist completion actions`.

### Task 4: Release verification

**Files:**
- Generated: `public/**`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: verified browser build ready for deployment.

- [ ] Run `npm test`; expect zero failures.
- [ ] Run `npm run build`; expect exit code 0 and updated protected browser assets.
- [ ] Run `git diff --check`; expect no whitespace errors.
- [ ] Review the whole diff against the spec, then commit generated assets.
- [ ] Push `main` and verify the exact Vercel production deployment reaches `Ready`.

