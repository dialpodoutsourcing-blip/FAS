# ANCHOR Completion Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present a required completion modal after ANCHOR's final saved answer and generate the Trusted Expert Statement only when the user selects the modal action.

**Architecture:** Preserve the existing interview coordinator and `generateBlueprint()` single-flight pipeline. Introduce explicit ready, generating, and retry modal states in the chat controller, backed by the existing completion markup upgraded to an accessible modal.

**Tech Stack:** Static HTML/CSS, vanilla JavaScript, Node test runner, Playwright browser checks.

**Spec:** `docs/superpowers/specs/2026-11-12-anchor-completion-modal-design.md`

## Global Constraints

- The final answer must be durably saved before the modal appears.
- Generation must not begin until the primary modal action is selected.
- The modal cannot be dismissed before generation succeeds or the user leaves through an explicit navigation action.
- Existing answers, interview questions, artifact contents, authentication, and schema remain unchanged.
- Keep the propagation cover and owner-only launch gate intact.

## Review Focus

- Double clicks or repeated Enter presses must create only one artifact generation request.
- Reload after the last saved answer but before generation must restore the completion modal.
- Generation failure must preserve answers and expose a working retry.
- Keyboard focus must enter the modal and remain within its actions while open.
- EXTRACT and other specialist completion labels must remain correct even though ANCHOR uses Trusted Expert Statement copy.

---

### Task 1: Completion modal contract and visual shell

**Files:**
- Modify: `chat.html`
- Modify: `assets/css/styles.css`
- Modify: `tests/static-multi-agent.test.js`
- Modify: `tests/chat-geometry.test.js`

**Interfaces:**
- Consumes: Existing completion hooks and premium chat design system.
- Produces: Accessible modal markup with `data-completion-panel`, `data-completion-generate`, status output, and non-dismissible dialog semantics.

- [ ] Write static and browser tests asserting dialog semantics, completion copy, one primary generation action, live status, centered contained geometry, focusable action, and no close control.
- [ ] Run focused tests and verify they fail because the current completion panel is an inline action card.
- [ ] Upgrade the completion panel markup and add premium modal/backdrop styling without changing controller behavior hooks used elsewhere.
- [ ] Run focused tests and verify they pass.
- [ ] Commit with `feat: add anchor completion modal shell`.

### Task 2: User-controlled generation and resilient retry

**Files:**
- Modify: `assets/js/adam.js`
- Modify: `tests/extract-flow.test.js`
- Modify: `public/chat.html` (generated)
- Modify: `public/assets/css/styles.css` (generated)
- Modify: `public/assets/js/adam.js` (generated)

**Interfaces:**
- Consumes: Task 1 modal hooks and existing `generateBlueprint(completionUrl,status)` promise.
- Produces: `showCompletionPanel()` ready state, explicit generation click handler, generating/retry states, restored pending completion, and success navigation.

- [ ] Write failing controller contract tests proving final submission opens the modal without generation, the modal action starts one generation, failures expose retry, and restored complete interviews reopen the modal.
- [ ] Run the focused controller tests and verify RED.
- [ ] Refactor completion handling so final save calls the ready modal state; bind the modal action to the existing single-flight generator; update progress, success, and failure states; focus the action when ready.
- [ ] Run focused controller and browser tests and verify GREEN.
- [ ] Build production assets and run the full test suite.
- [ ] Commit with `feat: require completion confirmation before review`.

