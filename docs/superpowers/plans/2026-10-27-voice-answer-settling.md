# Voice Answer Settling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep natural pauses from splitting one spoken explanation across two interview questions.

**Architecture:** Add a small settling buffer at the Realtime transcript boundary. Completed segments are merged until 1.5 seconds passes without resumed speech, then the existing `onFinalTranscript` callback runs once.

**Tech Stack:** Browser JavaScript, Node test runner, OpenAI Realtime events

**Spec:** `docs/superpowers/specs/2026-10-27-voice-answer-settling-design.md`

## Global Constraints

- No new dependencies.
- Preserve duplicate suppression and never save incomplete partial transcripts.
- Flush pending completed speech during an explicit stop.

## Review Focus

- Speech resumes inside the window: combine segments and finalize once.
- No continuation arrives: finalize after exactly one settling window.
- Duplicate completion events: do not duplicate text.
- Explicit stop with pending completed text: flush it before cleanup.
- Partial-only speech on stop: preserve as a draft, never finalize it.

---

### Task 1: Settle and merge completed transcript segments

**Files:**
- Modify: `assets/js/realtime-interviewer.js`
- Test: `tests/realtime-interviewer.test.js`
- Generated: `public/assets/js/realtime-interviewer.js`

**Interfaces:**
- Consumes: Realtime speech-started and transcription-completed events.
- Produces: one `onFinalTranscript({turnId, itemId, text})` call per settled spoken answer.

- [x] **Step 1: Write failing timer-controlled tests for delayed finalization, continuation merging, duplicate suppression, and stop flushing.**
- [x] **Step 2: Run `node --test tests/realtime-interviewer.test.js` and confirm the new settling test fails because finalization is immediate.**
- [x] **Step 3: Add the 1.5-second pending-completion buffer and timer injection to `createRealtimeInterviewer(options)`.**
- [x] **Step 4: Run the focused test and confirm it passes.**
- [x] **Step 5: Run `npm run build`, `npm test`, and `git diff --check`.**
- [x] **Step 6: Commit and push the verified change to `main`.**
