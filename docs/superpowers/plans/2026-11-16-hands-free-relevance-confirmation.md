# Hands-Free Relevance Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make uncertain-answer confirmation fully spoken in Talk while preserving the native confirmation dialog in Type.

**Architecture:** Keep the existing relevance classifier and one-shot submission gate unchanged. Add a mode-aware presentation layer in `adam.js`: Type opens the dialog; Talk speaks a fixed confirmation prompt with `speakVoicePrompt`, then consumes spoken yes/no through the existing pending-answer path.

**Tech Stack:** Browser JavaScript, existing Realtime interviewer, Node test runner, existing Vercel asset build.

**Spec:** `docs/superpowers/specs/2026-11-16-hands-free-relevance-confirmation-design.md`

## Global Constraints

- Talk must not open the relevance confirmation dialog.
- Talk must speak the confirmation request and listen only after speech finishes.
- Yes saves the held answer exactly once; no discards it and speaks the unchanged question.
- Invalid decisions ask for yes or no again without saving or losing the held answer.
- Type keeps the current accessible native dialog.

## Review Focus

- Talk confirmation never calls `answerConfirmationModal.open`.
- The microphone stays paused while ADAM asks for confirmation and resumes afterward.
- A partial “yes” consumed as a control cannot be delivered again as an answer.
- An invalid spoken reply leaves the original answer pending.
- Switching to Type while Talk confirmation is pending does not silently save the answer.

---

### Task 1: Mode-Aware Confirmation Presentation

**Files:**
- Modify: `assets/js/adam.js`
- Modify: `tests/extract-flow.test.js`
- Modify: `tests/review-fixes.test.js`

**Interfaces:**
- Consumes: existing `answerSubmissionGate`, `answerConfirmationModal`, `speakVoicePrompt(message)`, and retry confirmation classifier.
- Produces: `presentAnswerConfirmation(pending)` and `requestSpokenAnswerDecision()` behavior.

- [ ] **Step 1: Write failing integration tests**

Assert Type calls `answerConfirmationModal.open`; Talk calls `speakVoicePrompt` with copy containing “may not answer,” “yes,” and “no”; the Talk branch contains no modal open; invalid spoken decisions repeat the yes/no prompt; and pending confirmation interception remains before retry intent and normal answer handling.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/extract-flow.test.js tests/review-fixes.test.js`

Expected: FAIL because Talk currently opens the modal.

- [ ] **Step 3: Implement the mode-aware presentation**

Create `requestSpokenAnswerDecision()` and `presentAnswerConfirmation(pending)` in `assets/js/adam.js`. The Talk branch sets status and returns `speakVoicePrompt` with the fixed hands-free copy; the Type branch alone opens the dialog. Route invalid final spoken decisions back through `requestSpokenAnswerDecision()`.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/extract-flow.test.js tests/review-fixes.test.js tests/answer-submission-gate.test.js tests/answer-confirmation-modal.test.js tests/realtime-interviewer.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```text
git add assets/js/adam.js tests/extract-flow.test.js tests/review-fixes.test.js
git commit -m "fix: keep Talk relevance confirmation hands-free"
```

### Task 2: Production Build and Verification

**Files:**
- Modify: generated `public/assets/js/adam.js`
- Add: approved design and implementation plan

**Interfaces:**
- Consumes: Task 1 source behavior.
- Produces: deployment-ready public assets.

- [ ] **Step 1: Run the full suite**

Run: `npm test`

Expected: all tests pass with only the existing intentional integration skip.

- [ ] **Step 2: Build and verify generated assets**

Run: `npm run build`, followed by the Task 1 focused tests and `git diff --check`.

Expected: production assets prepared, focused tests pass, and no whitespace errors.

- [ ] **Step 3: Commit**

```text
git add public/assets/js/adam.js docs/superpowers/specs/2026-11-16-hands-free-relevance-confirmation-design.md docs/superpowers/plans/2026-11-16-hands-free-relevance-confirmation.md
git commit -m "build: prepare hands-free relevance confirmation"
```

## Self-Review

- The spoken prompt, listening order, invalid-response loop, and Type/Talk split have explicit tests.
- The pending-answer state and exactly-once persistence logic remain in the already-tested gate.
- No modal, classifier, persistence schema, or unrelated voice behavior is redesigned.

