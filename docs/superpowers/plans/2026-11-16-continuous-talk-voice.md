# Continuous Talk Voice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Talk continuously active and make the orb smoothly distinguish listening, hearing, and ADAM speaking with compact labels.

**Architecture:** Retain the existing Realtime interviewer and its internal echo protection, but make `voiceIntent='talk'` the persistent logical state while Talk is selected. Remove user pause toggles and map transient internal pauses back to listening; extend the current `data-orb-state` CSS rather than adding dependencies.

**Tech Stack:** Browser JavaScript, CSS animations, Node test runner, Playwright geometry tests.

**Spec:** `docs/superpowers/specs/2026-11-16-continuous-talk-voice-design.md`

## Global Constraints

- Talk remains active until Type, End, navigation, completion, or a genuine error.
- Internal capture suppression is never displayed as paused.
- User waveform animation remains exclusive to user speech.
- Reduced-motion behavior remains static and accessible.
- No new runtime dependency.

## Review Focus

- Clicking the live mic during listening or speaking must not pause Talk.
- A spoken pause command must not leave the session paused.
- Saving and ADAM playback must return to listening automatically.
- Switching to Type and End must still stop capture intentionally.
- Reduced-motion users must still distinguish listening from speaking.

---

### Task 1: Continuous Talk State

**Files:**
- Modify: `assets/js/adam.js`
- Test: `tests/extract-flow.test.js`

**Interfaces:**
- Consumes: existing `voiceIntent`, `voiceInterviewer`, `speakVoicePrompt`, and `syncVoiceCaptureControl`
- Produces: Talk controls that never set `voiceIntent='paused'` and always settle on listening

- [ ] Add failing flow assertions for a non-toggle mic, non-pausing spoken pause handling, and automatic listening recovery.
- [ ] Run `node --test tests/extract-flow.test.js` and confirm the new assertions fail on current pause paths.
- [ ] Update Talk control/state handling minimally so only explicit exits stop the active session.
- [ ] Run `node --test tests/extract-flow.test.js` and confirm it passes.
- [ ] Commit the state change.

### Task 2: Smooth Distinct Orb States and Compact Copy

**Files:**
- Modify: `assets/css/styles.css`
- Modify: `assets/js/adam.js`
- Test: `tests/static-multi-agent.test.js`
- Test: `tests/chat-geometry.test.js`

**Interfaces:**
- Consumes: `data-orb-state` values `listening`, `hearing`, `thinking`, and `speaking`
- Produces: visually distinct CSS state motion and compact labels

- [ ] Add failing static and geometry assertions for compact label sizing, listening motion, stronger speaking motion, hearing-only waveform, and reduced-motion state distinction.
- [ ] Run the focused tests and confirm failures identify missing CSS/copy.
- [ ] Add smooth state-specific keyframes/styles and compact state labels without changing layout containment.
- [ ] Run focused static and geometry tests and confirm they pass.
- [ ] Commit the presentation change.

### Task 3: Build and Regression Verification

**Files:**
- Generated: `public/assets/js/adam.js`
- Generated: `public/assets/css/styles.css`
- Generated: `public/chat.html`

**Interfaces:**
- Consumes: Tasks 1 and 2
- Produces: deployable browser assets matching source

- [ ] Run `npm run build`.
- [ ] Run focused Talk, Realtime, static, and geometry tests.
- [ ] Run `npm test` and require zero failures.
- [ ] Run `git diff --check` and inspect the complete branch diff.
- [ ] Commit generated assets and any verification-only adjustments.
