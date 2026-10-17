# Live 1:1 Guided Tutorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simplified tutorial recreation with an automatically narrated walkthrough of the actual FAS pages inside a protected, non-navigating tutorial frame.

**Architecture:** Real FAS pages run in `tour=1` mode inside a sandboxed iframe and report stable target geometry through a narrowly validated message bridge. The parent controller retains modal/state ownership, positions spotlight and description layers over the live frame, and controls browser speech synthesis. No simulated product UI remains.

**Tech Stack:** Static HTML5, shared CSS, vanilla JavaScript, iframe sandbox/postMessage, Web Speech API, Node.js `assert`, Microsoft Edge headless for parity screenshots.

**Spec:** `docs/superpowers/specs/2026-10-17-live-guided-tutorial-design.md`

## Global Constraints

- The tutorial must render actual `index.html`, `chat.html`, `vault.html`, and `launch.html` pages; no fake product views may remain.
- The outer browser URL, history, scroll position, and product state must remain unchanged.
- Tutorial mode must not save, submit, download, record, open popups, or navigate the top window.
- Narration starts automatically only after both frame and target readiness.
- Every step change and close path cancels the prior utterance.
- Captions remain authoritative when speech synthesis is absent or fails.
- Preserve the existing 252px sidebar, menu trigger, 21-step copy, and normal non-tour behavior.
- The workspace has no Git metadata; use named verification checkpoints instead of commits unless Git is initialized before execution.

## Review Focus

- `file://` and local-server framing can differ in origin behavior; Task 2 tests message source validation without depending on a readable frame DOM, and Task 5 verifies both local file and HTTP preview paths where available.
- Browser voices may arrive asynchronously or be unavailable; Task 1 tests empty, delayed, and changing voice lists while preserving visible captions.
- A target can move after fonts or panels load; Task 3 tests repeated geometry updates and pointer recalculation.
- Back across a chapter boundary must restore the correct real page and target rather than using stale geometry; Task 3 tests frame-load tokens and ignores late messages.
- A sandbox can accidentally block required scripts or permit unsafe capabilities; Task 2 asserts the exact allow-list and Task 4 exercises blocked actions.

---

### Task 1: Automatic Narration Controller

**Files:**
- Modify: `assets/js/tutorial.js`
- Modify: `tests/tutorial-state.test.js`

**Interfaces:**
- Consumes: browser-compatible `speechSynthesis` and `SpeechSynthesisUtterance` constructor.
- Produces: `createNarrator(synth, Utterance)` with `speak(text)`, `cancel()`, `mute()`, `unmute()`, `replay()`, and `isMuted()`; retains `createTourState()` and `TOUR_STEPS`.

- [ ] **Step 1: Write failing narrator tests**

Add deterministic fake-synthesis tests asserting: `speak()` cancels first, selects a local English voice when available, sets rate `0.95` and pitch `1`, stores current text, and speaks once; mute cancels and suppresses speech; unmute and replay restart current text; empty voice lists fall back without throwing; absent synthesis is a silent no-op with correct mute state.

- [ ] **Step 2: Run the test and verify RED**

Run: `node tests\tutorial-state.test.js`

Expected: FAIL because `createNarrator` is not exported.

- [ ] **Step 3: Implement `createNarrator(synth, Utterance)`**

Keep narration independent of DOM/controller state. Voice preference order is local English, any English, browser default. Do not persist mute state.

- [ ] **Step 4: Run the state/narrator test and verify GREEN**

Run: `node tests\tutorial-state.test.js`

Expected: `Tutorial state and narration checks passed.`

- [ ] **Step 5: Record Task 1 checkpoint**

Record the passing command in the live tutorial execution ledger.

### Task 2: Protected Real-Page Frame Mode

**Files:**
- Create: `assets/js/tutorial-frame.js`
- Modify: `index.html`
- Modify: `chat.html`
- Modify: `review.html`
- Modify: `vault.html`
- Modify: `launch.html`
- Create: `tests/tutorial-frame.test.js`
- Modify: `tests/static-tutorial.test.js`

**Interfaces:**
- Consumes: `tour=1` URL parameter; parent messages `{ namespace:'fas-tour', type, payload, token }`.
- Produces: frame messages `frame-ready`, `target-ready`, `target-missing`, `interaction-complete`, and `geometry-update`; body class `tour-frame`; stable `[data-tour-id]` production targets.

- [ ] **Step 1: Write failing shared-page and bridge contract tests**

Assert every page loads `tutorial-frame.js`, normal mode exits without mutation, tour mode adds `tour-frame`, hides `[data-tutorial-trigger]`, and installs capture-phase blockers for submit, anchor/download, voice, Save/Exit, and unsafe keyboard activation. Assert message handling validates namespace, `event.source === window.parent`, type allow-list, token, and payload strings before selecting a target.

- [ ] **Step 2: Run the tests and verify RED**

Run: `node tests\tutorial-frame.test.js; node tests\static-tutorial.test.js`

Expected: FAIL because the bridge and real target attributes are absent.

- [ ] **Step 3: Add stable targets to the real interface**

Add the approved `data-tour-id` values to existing page elements only. Repeated Vault actions use a stable containing asset and first visible Edit/Download controls. Do not change classes or layout.

- [ ] **Step 4: Implement the protected bridge**

Create an IIFE that activates only in tour mode, blocks unsafe events before production handlers, receives `show-target` and `try-action`, scrolls the real target into view, reports its viewport rectangle, and observes size/layout changes. Export pure helpers for Node tests: `isTourMode(search)`, `validateMessage(data)`, and `rectPayload(rect)`.

- [ ] **Step 5: Load the bridge on all pages**

Load it after `nav.js` and before `tutorial.js`/`adam.js`, ensuring it can install capture blockers before user interaction.

- [ ] **Step 6: Run bridge and existing page tests**

Run: `node tests\tutorial-frame.test.js; node tests\static-tutorial.test.js; node tests\static-sidebar.test.js; node tests\static-multi-agent.test.js`

Expected: all pass.

- [ ] **Step 7: Record Task 2 checkpoint**

Record the passing commands and any target-placement rulings.

### Task 3: Live Frame Controller, Geometry, and Adaptive Description

**Files:**
- Modify: `assets/js/tutorial.js`
- Modify: `assets/css/styles.css`
- Modify: `tests/static-tutorial.test.js`
- Create: `tests/tutorial-geometry.test.js`

**Interfaces:**
- Consumes: Task 2 bridge protocol and Task 1 narrator.
- Produces: chapter URL map, sandboxed `[data-tour-frame]`, `translateFrameRect(frameRect, iframeRect, scale)`, `chooseCardPlacement(targetRect, viewportRect, cardSize)`, loading/error state, tokenized frame message handling, and live spotlight/pointer/card layers.

- [ ] **Step 1: Write failing geometry and live-frame tests**

Assert chapter URLs exactly match the spec; iframe title and sandbox exist; sandbox omits top navigation, popups, downloads, forms, microphone, camera, clipboard, and same-origin DOM dependency. Unit-test rectangle translation under scale `1`, `0.8`, and iframe offsets. Unit-test placement priority right → left → bottom → top → docked. Assert stale-token messages cannot update a later step.

- [ ] **Step 2: Run tests and verify RED**

Run: `node tests\tutorial-geometry.test.js; node tests\static-tutorial.test.js`

Expected: FAIL on simulated renderers and missing live-frame interfaces.

- [ ] **Step 3: Replace the tutorial shell canvas with the real iframe**

Remove `renderDashboard`, `renderAdam`, `renderVault`, `renderLaunch`, `safeActions`, and all `.tour-demo*` markup paths. Create one sandboxed iframe and overlay layers for mask, spotlight, arrow, loading, and adaptive card.

- [ ] **Step 4: Implement tokenized page/step coordination**

On chapter change, increment a load token, show `Loading the real {page name}…`, set the approved URL, wait for `frame-ready`, then send `show-target`. Accept only messages from the active frame window with the current token. Add a fixed timeout with Retry, Back, Skip, and Close recovery.

- [ ] **Step 5: Implement geometry and card placement**

Translate frame rectangles, redraw on geometry/resize updates, darken outside the target, point without intercepting input, and place the card in the largest safe approved region. Missing targets use the centered fallback.

- [ ] **Step 6: Wire safe click-to-advance**

Send only whitelisted `try-action` commands and advance once after `interaction-complete`; retain Next as the universal path.

- [ ] **Step 7: Run geometry/live-frame tests and verify GREEN**

Run: `node tests\tutorial-geometry.test.js; node tests\static-tutorial.test.js; node tests\tutorial-frame.test.js`

Expected: all pass and no simulated-renderer assertions remain.

- [ ] **Step 8: Record Task 3 checkpoint**

Record passing tests and any placement fallback ruling.

### Task 4: Voice UI, Safety, and Responsive Styling

**Files:**
- Modify: `assets/js/tutorial.js`
- Modify: `assets/js/tutorial-frame.js`
- Modify: `assets/css/styles.css`
- Modify: `tests/static-tutorial.test.js`
- Modify: `tests/tutorial-frame.test.js`

**Interfaces:**
- Consumes: live controller readiness and narrator from Tasks 1–3.
- Produces: automatic narration timing, `[data-tour-mute]`, `[data-tour-replay]`, safe action completion, reduced-motion/transparency styling, and one-screen responsive behavior.

- [ ] **Step 1: Write failing voice/UI/safety tests**

Assert narration starts only after `target-ready`; Back, Next, chapter switch, timeout, Skip, Close, Finish, and unload call cancel; Mute exposes pressed state and Unmute narrates current text; Replay restarts; no-synthesis mode leaves all controls usable. Assert frame blockers prevent real href navigation, submit, download, microphone, and Save/Exit actions while tutorial-safe controls can report completion.

- [ ] **Step 2: Run tests and verify RED**

Run: `node tests\tutorial-state.test.js; node tests\tutorial-frame.test.js; node tests\static-tutorial.test.js`

Expected: FAIL on unwired narration and controls.

- [ ] **Step 3: Wire narration and controls**

Create one narrator per tutorial opening, narrate visible description after target readiness, and cancel through the shared cleanup/page-change paths. Add accessible Mute/Unmute and Replay controls to the header.

- [ ] **Step 4: Replace simulated-view CSS**

Delete every `.tour-demo*` rule. Style the real frame as the dominant surface, the high-contrast adaptive card, mask cutout, spotlight, pointer, header controls, loading/error states, and reduced motion/transparency. Preserve a one-screen layout; only card copy may scroll on short screens.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `node tests\tutorial-state.test.js; node tests\tutorial-frame.test.js; node tests\tutorial-geometry.test.js; node tests\static-tutorial.test.js`

Expected: all pass.

- [ ] **Step 6: Record Task 4 checkpoint**

Record the passing commands.

### Task 5: Visual Parity and Full Regression Verification

**Files:**
- Modify if a defect is found: files owned by Tasks 1–4
- Test: all existing and new tests
- Artifact: `.superpowers/sdd/2026-10-17-live-guided-tutorial/parity-*.png`

**Interfaces:**
- Consumes: completed live tutorial.
- Produces: visual evidence that framed Chat matches standalone Chat at equal content viewport dimensions and a clean full suite.

- [ ] **Step 1: Run JavaScript syntax checks**

Run: `node --check assets\js\nav.js; node --check assets\js\agents.js; node --check assets\js\adam.js; node --check assets\js\tutorial-frame.js; node --check assets\js\tutorial.js`

Expected: exit code 0.

- [ ] **Step 2: Run the complete test suite**

Run all existing static tests plus `tutorial-state.test.js`, `tutorial-frame.test.js`, and `tutorial-geometry.test.js`.

Expected: every command exits 0.

- [ ] **Step 3: Capture equal-viewport standalone and framed Chat screenshots**

Use installed Edge headless at a 1600×730 outer viewport. Capture standalone `chat.html?agent=extract` and the live tutorial at the ADAM chapter after target readiness. Compare sidebar, toolbar, stage row, chat question, composer, fonts, spacing, colors, and icons; only overlay spotlight/card/chrome may differ.

- [ ] **Step 4: Verify the automatic voice lifecycle manually**

Open the live tutorial, confirm automatic speech on the first ready step, Next cancellation/restart, Mute silence, Unmute current-step speech, Replay restart, and Close cancellation. If the environment has no voice output, verify via synthesis-call instrumentation and visible captions.

- [ ] **Step 5: Verify safety manually**

In the framed ADAM and Vault chapters, activate Talk, Send, Save/Exit, Edit, and Download and confirm no microphone prompt, submission, outer navigation, state change, popup, or downloaded file occurs.

- [ ] **Step 6: Run the final full suite after visual/safety fixes**

Repeat Steps 1–2. Expected: clean output and exit code 0.

- [ ] **Step 7: Record final checkpoint**

Record parity evidence, voice/safety results, complete test output, and any explicit limitations from the local browser environment.

