# Voice Turn Timeouts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure hands-free turns always settle when persistence or conversational response services hang.

**Architecture:** Bound Supabase requests at the project-store boundary so coordinator rollback remains authoritative. Bound only the conversational reply request in ADAM, allowing its existing next-question fallback to continue a durably saved interview.

**Tech Stack:** Browser JavaScript, Node.js test runner, Fetch API, AbortController.

**Spec:** `docs/superpowers/specs/2026-10-27-voice-turn-timeouts-design.md`

## Global Constraints

- Persistence deadline: 15 seconds.
- Conversational reply deadline: 8 seconds.
- Never advance interview state without confirmed persistence.
- Never automatically resubmit a timed-out answer.
- Preserve the existing transcription settling and question progression behavior.

## Review Focus

- A fetch implementation that ignores abort must still reject at the deadline.
- A late request settlement must not change the already recovered UI state.
- Authentication refresh requests must remain bounded.
- Timeout errors must be distinguishable from authentication failures.
- Reply fallback must clear typing/busy state and return the exact next question.

---

### Task 1: Bound Supabase persistence

**Files:**
- Modify: `assets/js/project-store.js`
- Test: `tests/project-store.test.js`

**Interfaces:**
- Consumes: `supabaseStore(options)` with optional injected timing dependencies for deterministic tests.
- Produces: project-store requests that reject with `code: 'request_timeout'` after `requestTimeoutMs` (default `15000`) and abort when supported.

- [ ] Write tests proving a never-settling save rejects at the configured deadline, sets `request_timeout`, aborts its signal, and does not trigger authentication failure handling.
- [ ] Run `node --test tests/project-store.test.js` and confirm the new test fails for the missing timeout.
- [ ] Implement the minimal request deadline in `assets/js/project-store.js`, covering initial and refreshed sends.
- [ ] Run `node --test tests/project-store.test.js` and confirm it passes.

### Task 2: Bound conversational reply generation

**Files:**
- Modify: `assets/js/adam.js`
- Test: `tests/extract-flow.test.js`

**Interfaces:**
- Consumes: `apiFetch(url, init, timeoutMs)`.
- Produces: an abortable 8-second `/api/chat-response` request whose rejection enters the existing exact-next-question fallback.

- [ ] Write static/runtime-facing assertions proving `/api/chat-response` uses an 8-second deadline and the fallback still returns `nextQuestion` while clearing typing state.
- [ ] Run `node --test tests/extract-flow.test.js` and confirm the new assertions fail.
- [ ] Add timeout support to `apiFetch` and apply `8000` only to `requestConversationalReply`.
- [ ] Run `node --test tests/extract-flow.test.js` and confirm it passes.

### Task 3: Verify and publish

**Files:**
- Include: design, plan, tests, and runtime changes.

**Interfaces:**
- Produces: verified commit on `main` and a successful production Vercel deployment.

- [ ] Run `npm test` and confirm zero failures.
- [ ] Review `git diff --check`, `git diff`, and status; preserve unrelated `anchor-window-test.png`.
- [ ] Commit the scoped changes, push `main`, and verify the production deployment reports Ready/Success.

