# Truthful Talk Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace decorative Talk HUD values with real interview/session data and animate the waveform and orb only for their corresponding live speaker.

**Architecture:** Extend the Realtime interviewer with an explicit `hearing` state and measured transcript/turn callbacks. Add named HUD fields in `chat.html`, update them from ADAM’s existing persistence, navigation, save, transcript, capture, and voice-state paths, and gate CSS animation by `hearing` or `speaking` state only.

**Tech Stack:** Browser JavaScript, HTML/CSS, Node.js built-in test runner, Playwright geometry/static checks, existing FAS build script

**Spec:** `docs/superpowers/specs/2026-11-16-truthful-talk-console-design.md`

## Global Constraints

- No invented clarity, decibel, noise-gate, buffer, or processing values.
- The waveform animates only while the user is actually speaking.
- The orb animates only while ADAM is actually speaking.
- Raw audio is not stored and no audio analytics dependency is added.
- Existing reduced-motion behavior remains authoritative.

## Review Focus

- A connected but silent microphone must not animate the waveform.
- Speech start/stop must enter and leave `hearing` without being overwritten by generic listening state.
- ADAM playback must animate the orb without animating the waveform.
- Restored answers and newly saved answers must produce accurate progress counts without duplicates.
- Paused, stopped, error, and ended sessions must leave both central animations still and show truthful telemetry.

---

### Task 1: Realtime hearing state and measured session events

**Files:**
- Modify: `assets/js/realtime-interviewer.js`
- Test: `tests/realtime-interviewer.test.js`

**Interfaces:**
- Consumes: Realtime speech-started, speech-stopped, transcription delta, and completed events
- Produces: `onState('hearing')`, existing non-hearing states, and `onMetrics({ transcriptWords, finalizedTurns })`

- [ ] **Step 1: Write failing Realtime tests**

Assert speech start emits `hearing`, speech stop exits it, deltas report real word counts, completed transcripts increment finalized turns once, and duplicate completion does not increment again.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/realtime-interviewer.test.js`
Expected: FAIL because `hearing` and `onMetrics` are absent.

- [ ] **Step 3: Implement minimal state and metric callbacks**

Add optional `onMetrics`, track current transcript words and finalized-turn count from existing normalized transcript data, and emit `hearing` only from detected speech events.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/realtime-interviewer.test.js`
Expected: all tests pass.

### Task 2: Truthful HUD structure and controller wiring

**Files:**
- Modify: `chat.html`
- Modify: `assets/js/adam.js`
- Test: `tests/static-multi-agent.test.js`
- Test: `tests/extract-flow.test.js`

**Interfaces:**
- Consumes: Realtime `hearing`/metrics from Task 1, `voiceInterviewer.captureActive()`, current interview question, and persisted/current agent answers
- Produces: named `[data-talk-progress-*]` and `[data-talk-session-*]` fields containing real values

- [ ] **Step 1: Write failing markup and controller tests**

Assert fake metric copy is absent, named HUD fields exist, progress refreshes after restoration/navigation/save, session telemetry updates from capture/state/transcript/metrics callbacks, and labels expose waiting states before data exists.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/static-multi-agent.test.js tests/extract-flow.test.js tests/realtime-interviewer.test.js`
Expected: FAIL because the markup is static and the controller has no HUD updater.

- [ ] **Step 3: Replace decorative values and wire real data**

Render accepted count, current/total question position, processed count, and latest accepted field on the left. Render session state, microphone state, transcript words, and finalized turns on the right. Update only from observed application state.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/static-multi-agent.test.js tests/extract-flow.test.js tests/realtime-interviewer.test.js`
Expected: all tests pass.

### Task 3: Speaker-specific animation

**Files:**
- Modify: `assets/css/styles.css`
- Test: `tests/static-multi-agent.test.js`
- Test: `tests/chat-geometry.test.js`

**Interfaces:**
- Consumes: `data-orb-state="hearing"` and `data-orb-state="speaking"`
- Produces: still default UI, hearing-only waveform animation, and speaking-only orb animation

- [ ] **Step 1: Write failing CSS behavior tests**

Assert waveform bars have no default animation, `hearing` alone enables `waveTicker`, `speaking` alone enables `orbTalk`, and ambient/HUD decorations do not imply processing while idle or stopped.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/static-multi-agent.test.js tests/chat-geometry.test.js`
Expected: FAIL because the waveform and decorative HUD currently animate continuously.

- [ ] **Step 3: Gate animation by truthful state**

Move animations from base selectors to explicit hearing/speaking selectors, stop decorative HUD motion, retain reduced-motion overrides, and preserve the existing responsive layout.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/static-multi-agent.test.js tests/chat-geometry.test.js`
Expected: all tests pass.

### Task 4: Production build and verification

**Files:**
- Modify (generated): `public/chat.html`
- Modify (generated): `public/assets/js/realtime-interviewer.js`
- Modify (generated): `public/assets/js/adam.js`
- Modify (generated): `public/assets/css/styles.css`

**Interfaces:**
- Consumes: verified source files from Tasks 1–3
- Produces: deployable production assets with identical truthful behavior

- [ ] **Step 1: Run the full suite**

Run: `npm test`
Expected: zero failures.

- [ ] **Step 2: Build production assets**

Run: `npm run build`
Expected: exit code 0 and generated files matching source behavior.

- [ ] **Step 3: Run focused tests and diff validation**

Run: `node --test tests/realtime-interviewer.test.js tests/static-multi-agent.test.js tests/extract-flow.test.js tests/chat-geometry.test.js` followed by `git diff --check`
Expected: all focused tests pass and diff check has no output.

- [ ] **Step 4: Commit the verified implementation**

Stage only this feature’s design, plan, source, tests, and generated assets, then commit with focused messages.
