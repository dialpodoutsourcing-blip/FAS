# Answer Relevance Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent repeat/confusion language from being saved and require explicit confirmation before saving an answer that appears unrelated to the current interview question.

**Architecture:** Extend the existing deterministic interview controls for natural repeat/confusion phrases, then add a small local relevance classifier with four outcomes: `accept`, `repeat`, `clarify`, and `confirm`. ADAM applies one shared pre-save gate to both Type and Talk and holds a questionable answer only in memory until a dedicated native confirmation dialog resolves it.

**Tech Stack:** Browser JavaScript, native HTML `<dialog>`, existing FAS interview/coordinator modules, Node test runner, existing build preparation script.

**Spec:** `docs/superpowers/specs/2026-11-16-answer-relevance-confirmation-design.md`

## Global Constraints

- Do not add an AI request, dependency, or network round trip to answer validation.
- Never persist or advance the interview for repeat, confusion, or unconfirmed input.
- Confirmation yes saves the held answer exactly once; no discards it and repeats the same question.
- Preserve short valid answers such as names, numbers, dates, audiences, and concise evidence.
- Commands and retry confirmation retain precedence over answer relevance.
- Generate matching deployable assets in `public/` using the existing build.

## Review Focus

- â€œWhat was that again?â€ repeats the current question and is never saved.
- â€œI cannot understandâ€ and â€œIâ€™m trying to understand youâ€ clarify/repeat and are never saved.
- Short field-appropriate answers such as â€œ200 clients,â€ â€œDentists,â€ or â€œJune 15â€ bypass confirmation.
- An ambiguous substantive reply is held, and duplicate voice completion events cannot save it twice.
- Reload, cancel, or â€œnoâ€ loses only the unconfirmed reply and leaves the durable checkpoint unchanged.

---

### Task 1: Natural Repeat and Confusion Classification

**Files:**
- Modify: `assets/js/interview-engine.js`
- Test: `tests/interview-engine.test.js`

**Interfaces:**
- Consumes: current `classifyCommand(input, agentKey)` and `validateSpokenAnswer(input, question)` APIs.
- Produces: natural repeat variants from `classifyCommand`; `validateSpokenAnswer` results with `reason: 'confusion' | 'non_answer' | null` and a user-facing message.

- [ ] **Step 1: Write failing tests for reported phrases and false positives**

Add tests asserting that `What was that again?` and `What did you ask me?` return `{type:'repeat'}`; that `I cannot understand` and `I'm trying to understand you` return invalid with `reason:'confusion'`; and that a real answer containing â€œunderstand,â€ such as `I help clients understand their finances`, remains valid.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/interview-engine.test.js`

Expected: FAIL because the natural repeat phrases return `null` and the confusion phrases are accepted.

- [ ] **Step 3: Implement the minimal anchored phrase rules**

Extend `classifyCommand(input, agentKey)` and `validateSpokenAnswer(input, question)` without loose keyword matching. Confusion copy must say that ADAM will repeat the current question rather than claiming the text was saved.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/interview-engine.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```text
git add assets/js/interview-engine.js tests/interview-engine.test.js
git commit -m "fix: reject conversational voice responses"
```

### Task 2: Deterministic Question-Relevance Assessment

**Files:**
- Create: `assets/js/answer-relevance.js`
- Create: `tests/answer-relevance.test.js`

**Interfaces:**
- Consumes: `{text: string, question: {field?: string, question?: string, chapter?: string}, agentKey?: string}`.
- Produces: `assess(input) -> {status: 'accept'|'repeat'|'clarify'|'confirm', reason: string}`.

- [ ] **Step 1: Write failing behavior tests for all four outcomes**

Cover the three reported phrases, an unrelated substantive reply, Anchor field examples, non-Anchor date/process/owner examples, concise numeric and noun answers, follow-up prompts, punctuation/case normalization, and empty/malformed input. Pin conservative behavior: uncertainty becomes `confirm`, never automatic rejection.

- [ ] **Step 2: Run the new test and verify RED**

Run: `node --test tests/answer-relevance.test.js`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement `assess(input)`**

Use anchored meta/conversation patterns first, then field-suffix concept groups derived from the declarative question contracts. Treat field-appropriate answer shapesâ€”numbers, dates, named audiences, quoted language, ordered stepsâ€”as positive evidence. Return `confirm` when the reply is substantive but has neither field evidence nor question-language overlap; do not return `confirm` solely because a valid reply is concise.

- [ ] **Step 4: Run the new and engine tests and verify GREEN**

Run: `node --test tests/answer-relevance.test.js tests/interview-engine.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```text
git add assets/js/answer-relevance.js tests/answer-relevance.test.js
git commit -m "feat: assess interview answer relevance"
```

### Task 3: Native Answer Confirmation Dialog

**Files:**
- Create: `assets/js/answer-confirmation-modal.js`
- Create: `tests/answer-confirmation-modal.test.js`
- Modify: `chat.html`
- Modify: `assets/css/components.css`
- Modify: `tests/static-multi-agent.test.js`

**Interfaces:**
- Consumes: dialog elements plus `getMode()` and `onDecision(decision, source)` callbacks.
- Produces: `createAnswerConfirmationModal(options) -> {open(details), resolve(decision, source), close(), isOpen()}`; `details` contains `{question, answer, trigger?}`.

- [ ] **Step 1: Write failing modal and shell tests**

Assert the dialog displays the current question and held answer safely with `textContent`, defaults focus to â€œNo, repeat question,â€ traps fallback focus, permits Type dismissal as no, prevents Talk dismissal, and resolves once despite double clicks. Assert accessible label/description hooks and script order before `adam.js`.

- [ ] **Step 2: Run modal and static tests and verify RED**

Run: `node --test tests/answer-confirmation-modal.test.js tests/static-multi-agent.test.js`

Expected: FAIL because the controller and dialog do not exist.

- [ ] **Step 3: Implement the controller and native dialog shell**

Use the established retry-confirmation visual pattern with distinct hooks and exact decision copy: title `Does this answer the current question?`, primary action `Yes, save it`, safe action `No, repeat question`.

- [ ] **Step 4: Run modal and static tests and verify GREEN**

Run: `node --test tests/answer-confirmation-modal.test.js tests/static-multi-agent.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```text
git add assets/js/answer-confirmation-modal.js assets/css/components.css chat.html tests/answer-confirmation-modal.test.js tests/static-multi-agent.test.js
git commit -m "feat: add answer relevance confirmation"
```

### Task 4: Shared Type and Talk Pre-Save Gate

**Files:**
- Modify: `assets/js/adam.js`
- Modify: `tests/extract-flow.test.js`
- Modify: `tests/review-fixes.test.js`
- Modify: `tests/realtime-interviewer.test.js`

**Interfaces:**
- Consumes: `FAS.answerRelevance.assess(input)`, `FAS.createAnswerConfirmationModal(options)`, current question, and existing Type/Talk durable submission functions.
- Produces: one in-memory `pendingAnswerConfirmation` record and shared `routeAnswerForSubmission({text, source, turnId}, submitConfirmed)` behavior.

- [ ] **Step 1: Write failing integration tests for routing and persistence order**

Assert relevance assessment runs before `interviewCoordinator.submit` in both Type and Talk; repeat/clarify never submit; `confirm` holds the original text, source, turn ID, and question; yes submits once; no submits zero times and repeats the unchanged question; typed/spoken yes/no resolve the active relevance confirmation before retry intent or normal answer handling.

- [ ] **Step 2: Run focused integration tests and verify RED**

Run: `node --test tests/extract-flow.test.js tests/review-fixes.test.js tests/realtime-interviewer.test.js`

Expected: FAIL because no shared relevance gate is wired.

- [ ] **Step 3: Implement the pre-save gate in `adam.js`**

Keep held text out of conversation history and durable persistence until yes. Use a stable pending record and clear it before invoking the saved continuation so double decisions or duplicated transcript completion cannot submit twice. For clarify/repeat, render truthful copy and speak the unchanged current question in Talk.

- [ ] **Step 4: Run all affected tests and verify GREEN**

Run: `node --test tests/answer-relevance.test.js tests/answer-confirmation-modal.test.js tests/interview-engine.test.js tests/extract-flow.test.js tests/review-fixes.test.js tests/realtime-interviewer.test.js tests/static-multi-agent.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```text
git add assets/js/adam.js tests/extract-flow.test.js tests/review-fixes.test.js tests/realtime-interviewer.test.js
git commit -m "feat: confirm unrelated interview answers"
```

### Task 5: Build and Whole-System Verification

**Files:**
- Modify: `public/` generated browser assets
- Test: full repository suite

**Interfaces:**
- Consumes: completed source changes from Tasks 1â€“4.
- Produces: deployment-ready source/public parity.

- [ ] **Step 1: Run the complete suite**

Run: `npm test`

Expected: all tests pass; the existing live integration test may remain intentionally skipped.

- [ ] **Step 2: Build production assets**

Run: `npm run build`

Expected: `Prepared FAS browser files in public/.`

- [ ] **Step 3: Verify generated parity and clean diff**

Run: `git diff --check` and rerun the focused relevance/modal/integration tests against the built tree.

Expected: no whitespace errors and all focused tests pass.

- [ ] **Step 4: Commit generated assets and documentation**

```text
git add public docs/superpowers/specs/2026-11-16-answer-relevance-confirmation-design.md docs/superpowers/plans/2026-11-16-answer-relevance-confirmation.md
git commit -m "build: prepare answer relevance confirmation"
```

## Self-Review

- Spec coverage: repeat, confusion, accept, confirm, yes/no, Type/Talk, native dialog, reload behavior, and duplicate protection are assigned to Tasks 1â€“4.
- Interface consistency: `assess` outcomes and modal/controller method names are identical across Tasks 2â€“4.
- Conservative classification: concise valid answers and false-positive conversational words have explicit tests.
- Persistence safety: tests require assessment and confirmation before history mutation or coordinator submission.
- Scope: one cohesive feature; no AI classifier, persistence schema, or unrelated interview refactor is introduced.

