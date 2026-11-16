# Talk Confirmation Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make questionable-answer confirmation safe and recoverable across Talk and Type without allowing restart commands to save answers.

**Architecture:** Add a dedicated pure relevance-decision parser beside the relevance assessor, then route every pending relevance decision through the existing one-shot submission gate. Keep retry/restart parsing independent and retain the native modal only when Type initiated the held answer.

**Tech Stack:** Browser JavaScript, Node.js built-in test runner, existing FAS build script

**Spec:** `docs/superpowers/specs/2026-11-16-talk-confirmation-safety-design.md`

## Global Constraints

- Talk must remain hands-free and must not open a relevance modal.
- Restart confirmation behavior must remain unchanged.
- Invalid decisions must not save or discard the held answer.
- Generated `public/assets/js/` files must match their source assets.

## Review Focus

- `restart`, `start over`, and `yes retry` while relevance confirmation is pending must not save the answer.
- Explicit `yes`/`save it` must save exactly once.
- Explicit `no`/`don't save it` must discard and repeat the unchanged question.
- An ambiguous or unrelated decision must leave the answer pending and trigger ADAM's spoken prompt again.
- A typed decision after manually leaving Talk must resolve the held gate without requiring an open modal.

---

### Task 1: Dedicated relevance-decision parser

**Files:**
- Modify: `assets/js/answer-relevance.js`
- Test: `tests/answer-relevance.test.js`

**Interfaces:**
- Consumes: normalized user decision text
- Produces: `classifyDecision(value) -> true | false | null`

- [ ] **Step 1: Write failing parser tests**

Add a test asserting explicit save phrases return `true`, explicit discard phrases return `false`, and restart/ambiguous phrases return `null`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/answer-relevance.test.js`
Expected: FAIL because `classifyDecision` is absent.

- [ ] **Step 3: Implement the minimal parser**

Export `classifyDecision(value)` from `assets/js/answer-relevance.js` with relevance-only vocabulary.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/answer-relevance.test.js`
Expected: all tests pass.

### Task 2: Route pending decisions safely across modes

**Files:**
- Modify: `assets/js/adam.js`
- Test: `tests/extract-flow.test.js`

**Interfaces:**
- Consumes: `FAS.answerRelevance.classifyDecision(text)` from Task 1
- Produces: pending Talk and Type decisions resolved through `answerSubmissionGate.resolve(decision)`

- [ ] **Step 1: Write failing controller regression tests**

Assert pending Talk and Type paths use the dedicated parser and resolve the gate directly; assert the Talk invalid-decision path speaks the confirmation prompt again.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/answer-relevance.test.js tests/extract-flow.test.js tests/answer-submission-gate.test.js tests/realtime-interviewer.test.js`
Expected: FAIL because pending relevance decisions still use the retry parser and Type depends on modal state.

- [ ] **Step 3: Replace the pending-decision call sites**

Use `FAS.answerRelevance.classifyDecision` for partial Talk, final Talk, and typed pending replies. Resolve valid decisions through `answerSubmissionGate.resolve`; leave invalid decisions pending and preserve the existing spoken/typed guidance.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/answer-relevance.test.js tests/extract-flow.test.js tests/answer-submission-gate.test.js tests/realtime-interviewer.test.js`
Expected: all tests pass.

### Task 3: Build and verify production output

**Files:**
- Modify (generated): `public/assets/js/answer-relevance.js`
- Modify (generated): `public/assets/js/adam.js`

**Interfaces:**
- Consumes: verified source assets from Tasks 1–2
- Produces: deployable browser assets containing the same safety behavior

- [ ] **Step 1: Run the full suite**

Run: `npm test`
Expected: zero failures.

- [ ] **Step 2: Build production assets**

Run: `npm run build`
Expected: exit code 0 and updated matching files under `public/assets/js/`.

- [ ] **Step 3: Verify generated parity and clean diff**

Run: `git diff --check`
Expected: no output; source and generated behavior match under focused tests.

- [ ] **Step 4: Commit the verified change**

Stage only the design, plan, source, tests, and generated assets for this fix and commit with a focused message.
