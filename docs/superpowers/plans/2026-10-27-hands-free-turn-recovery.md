# Hands-Free Turn Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent one failed voice turn from stopping an otherwise healthy hands-free interview.

**Architecture:** Separate recoverable Realtime item/response errors from terminal transport failures inside `realtime-interviewer.js`. Pass stable error codes and any partial draft to `adam.js` for truthful recovery UI.

**Tech Stack:** Browser JavaScript, WebRTC/OpenAI Realtime events, Node test runner

**Spec:** `docs/superpowers/specs/2026-10-27-hands-free-turn-recovery-design.md`

## Global Constraints

- Never tear down a healthy peer/channel for a single failed item.
- Preserve partial user speech without saving it as a finalized answer.
- Keep genuine transport failures terminal.

## Review Focus

- Transcription failure after partial speech keeps capture active and exposes the draft.
- Generic Realtime event error keeps the connection alive and returns to listening.
- Playback failure does not claim microphone failure.
- Data-channel close still cleans up once.
- A recovered turn can be followed by a successful finalized turn.

---

### Task 1: Recover per-turn voice errors

**Files:**
- Modify: `assets/js/realtime-interviewer.js`
- Modify: `assets/js/adam.js`
- Test: `tests/realtime-interviewer.test.js`
- Test: `tests/extract-flow.test.js`
- Generated: corresponding files under `public/`

- [x] Add failing tests for recoverable transcription/event errors, draft preservation, continued capture, and truthful UI branches.
- [x] Run focused tests and confirm the current terminal behavior fails them.
- [x] Implement recoverable error reporting without cleanup.
- [x] Run focused tests, build, full suite, and diff validation.
- [x] Commit, merge, push, and verify Vercel deployment.
