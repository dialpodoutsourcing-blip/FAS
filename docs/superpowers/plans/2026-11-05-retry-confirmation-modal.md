# Retry Confirmation Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the retry chat prompt with a shared, accessible Yes/No modal whose dismissal behavior is safe and mode-aware.

**Architecture:** Add a small reusable retry-modal controller that owns dialog state, focus, buttons, keyboard handling, and backdrop behavior. `adam.js` supplies the current Type/Talk mode and routes the controller's decision into the existing retry/reset flow; spoken Talk confirmations continue through the existing retry intent classifier.

**Tech Stack:** Static HTML/CSS, browser JavaScript, Node.js built-in test runner

**Spec:** `docs/superpowers/specs/2026-11-05-retry-confirmation-modal-design.md`

## Global Constraints

- One modal implementation serves both Type and Talk.
- Type outside-click and Escape resolve No; Talk outside-click and Escape do nothing.
- Talk supports spoken and clicked Yes/No; unrelated speech does not resolve the modal.
- Opening the modal never mutates saved data; only Yes invokes the existing agent-scoped restart.
- No new runtime dependency.

## Review Focus

- Repeated retry requests while the modal is already open must not stack dialogs or duplicate decision callbacks; Task 1 tests idempotent opening.
- A late spoken result after a button choice must not produce a second decision; Task 2 tests that pending state clears before routing either choice.
- Switching input modes while confirmation is open must use the mode captured when opened; Task 1 tests dismissal against the controller's active mode.
- Missing native `showModal()` support must still expose and close the dialog safely; Task 1 tests the open-attribute fallback.
- Cancellation must restore focus only when the original element is still focusable; Task 1 tests safe focus restoration.

---

### Task 1: Accessible retry modal controller

**Files:**
- Create: `assets/js/retry-confirmation-modal.js`
- Create: `tests/retry-confirmation-modal.test.js`
- Modify: `chat.html`
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: modal DOM hooks in `chat.html` and options `{ dialog, title, description, confirmButton, cancelButton, getMode, onDecision }`.
- Produces: `FAS.createRetryConfirmationModal(options)` returning `{ open(details), close(), isOpen() }`; `open({ agentName, trigger })`; `onDecision(true|false, source)` fires at most once per opening.

- [ ] **Step 1: Write the failing controller and static markup tests**

Test that opening populates the active specialist, focuses No, and is idempotent; Yes/No buttons resolve once; Type backdrop/Escape resolve false; Talk backdrop/Escape remain open; the fallback toggles `open`; closing restores a still-connected trigger; and `chat.html` contains an labelled/described `<dialog>` with both action hooks.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `node --test tests/retry-confirmation-modal.test.js && node tests/static-multi-agent.test.js`
Expected: FAIL because the controller, hooks, and styles do not exist.

- [ ] **Step 3: Implement the controller, modal markup, and responsive styles**

Use native `<dialog>` where available, fall back to its `open` attribute, focus `[data-retry-cancel]`, handle `cancel` and backdrop clicks according to the mode captured by `open()`, and guard each opening with a single-settlement flag. Match the existing dark/gold dialog visual language and include a visible destructive Yes action plus safe No action.

- [ ] **Step 4: Run the focused tests and verify success**

Run: `node --test tests/retry-confirmation-modal.test.js && node tests/static-multi-agent.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add chat.html assets/css/styles.css assets/js/retry-confirmation-modal.js tests/retry-confirmation-modal.test.js tests/static-multi-agent.test.js
git commit -m "feat: add accessible retry confirmation modal"
```

### Task 2: Integrate typed, clicked, and spoken retry decisions

**Files:**
- Modify: `assets/js/adam.js`
- Modify: `chat.html`
- Modify: `tests/static-multi-agent.test.js`
- Modify: `tests/retry-confirmation-modal.test.js`

**Interfaces:**
- Consumes: `FAS.createRetryConfirmationModal(options)` from Task 1 and existing `FAS.retry.classifyConfirmation(text)`.
- Produces: one shared retry decision path: true pauses Talk and calls `restartCurrentAgent()`; false preserves work, closes the modal, reports cancellation, and resumes Talk when applicable.

- [ ] **Step 1: Write failing integration assertions**

Assert the modal controller script loads before `adam.js`; `requestRetryConfirmation(text, source, trigger)` opens the modal instead of posting/speaking the long warning; button decisions and recognized spoken decisions use the same handler; ambiguous Talk speech keeps the modal open and asks for Yes/No; and pending state clears before either resolved action.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test tests/retry-confirmation-modal.test.js && node tests/static-multi-agent.test.js tests/retry-intent.test.js`
Expected: FAIL against the existing conversational confirmation flow.

- [ ] **Step 3: Wire the modal into `adam.js` and script order**

Initialize the controller once. Pass `source === 'talk' ? 'talk' : 'type'` into `open()`. Keep `retryConfirmationPending` for routing speech and typed confirmation, but settle it before restart/cancel. On ambiguous Talk speech, keep the dialog visible and speak only the short Yes/No clarification. Pass the clicked retry button as the focus-restoration trigger.

- [ ] **Step 4: Run focused tests and verify success**

Run: `node --test tests/retry-confirmation-modal.test.js && node tests/static-multi-agent.test.js tests/retry-intent.test.js`
Expected: PASS.

- [ ] **Step 5: Build deployable mirrors and run the full suite**

Run: `npm run build && npm test`
Expected: build exits 0, public copies include the modal changes, and all tests pass.

- [ ] **Step 6: Commit**

```bash
git add assets/js/adam.js assets/js/retry-confirmation-modal.js assets/css/styles.css chat.html public tests
git commit -m "feat: confirm specialist retry with modal"
```

### Task 3: Browser-level interaction check

**Files:**
- Modify only if the interaction check exposes a defect in Task 1 or Task 2 files.

**Interfaces:**
- Consumes: completed modal integration from Tasks 1–2.
- Produces: verified Type/Talk behavior at desktop and narrow viewport sizes.

- [ ] **Step 1: Start the local app and open a completed specialist chat**

Run: `npm start`
Expected: app starts without console errors.

- [ ] **Step 2: Verify Type behavior**

Confirm Retry opens the modal with focus on No; No, Escape, and backdrop preserve work; Yes navigates with the existing `restart=1` reset route.

- [ ] **Step 3: Verify Talk behavior**

Confirm backdrop and Escape do nothing; spoken No cancels and resumes; spoken Yes restarts; ambiguous speech keeps the modal open; both buttons remain usable.

- [ ] **Step 4: Verify narrow viewport and keyboard focus**

Confirm the dialog remains fully visible, keyboard focus stays within native modal behavior, and cancellation restores focus to the retry control.

- [ ] **Step 5: Run final verification**

Run: `npm test`
Expected: PASS with zero failures.
