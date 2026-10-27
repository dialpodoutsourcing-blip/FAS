# Voice Processing Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give immediate spoken feedback while a settled voice answer is saved and processed.

**Architecture:** Trigger one short application-supplied phrase in `handleVoiceTurn` after capture pauses and before `interviewCoordinator.submit`. Keep it fire-and-forget so persistence and AI work continue concurrently.

**Tech Stack:** Browser JavaScript, OpenAI Realtime speech, Node test runner

**Spec:** `docs/superpowers/specs/2026-10-27-voice-processing-bridge-design.md`

## Global Constraints

- Preserve the 1.5-second answer settling window.
- Never delay durable saving to finish bridge playback.
- Only normal active interview answers receive the bridge.

## Review Focus

- Bridge is requested before durable submission starts.
- Bridge is not awaited before saving.
- Commands and post-completion advisory turns do not trigger it.
- Playback failure remains recoverable.
- Full grounded response still replaces/follows the bridge.

---

### Task 1: Speak during durable processing

**Files:**
- Modify: `assets/js/adam.js`
- Test: `tests/extract-flow.test.js`
- Generated: `public/assets/js/adam.js`

- [x] Add a failing ordering check for bridge speech before coordinator submission.
- [x] Run the focused test and confirm failure.
- [x] Implement the fire-and-forget bridge.
- [x] Run focused tests, build, full suite, and diff validation.
- [x] Commit, merge, push, and verify Vercel deployment.
