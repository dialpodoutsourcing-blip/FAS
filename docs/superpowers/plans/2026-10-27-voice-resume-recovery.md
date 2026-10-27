# Voice Resume Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the confirmed saved interview position before enabling Talk and greet returning users with their actual current question.

**Architecture:** Make persistence initialization retryable and fail closed instead of constructing a fresh interview in its catch path. Record whether current-agent progress was restored, then choose resume or new-session speech only after persistence and Realtime startup succeed.

**Tech Stack:** Browser JavaScript, HTML, Node.js test runner, Supabase project store, OpenAI Realtime interviewer.

**Spec:** `docs/superpowers/specs/2026-10-27-voice-resume-recovery-design.md`

## Global Constraints

- Supabase remains the only authoritative resume source.
- A loading error must not display or capture against question one.
- Retrying persistence is read-only and must not reset saved work.
- Returning speech includes the exact restored current question.
- New interviews retain the full hands-free orientation.

## Review Focus

- Clicking Talk before persistence finishes must not start microphone capture.
- A rejected load must leave `interview` and `interviewCoordinator` unavailable.
- Multiple retry clicks must not create concurrent persistence loads.
- A successful retry must remove recovery state and enable Talk exactly once.
- Completed restored interviews must retain their existing completion conversation behavior.

---

### Task 1: Fail-closed, retryable restoration

**Files:**
- Modify: `assets/js/adam.js`
- Modify: `chat.html`
- Test: `tests/extract-flow.test.js`

**Interfaces:**
- Consumes: `initializePersistence(authState)` and the existing voice recovery controls.
- Produces: `loadPersistence()` single-flight promise, a persistence failure state, and a retry-loading action that never creates a fresh interview on error.

- [ ] Write tests proving persistence failure does not create a fresh interview, Talk waits before starting Realtime, and Retry loading invokes the read-only loader.
- [ ] Run `node --test tests/extract-flow.test.js` and confirm the new tests fail.
- [ ] Implement retryable fail-closed loading and recovery copy/control behavior.
- [ ] Run `node --test tests/extract-flow.test.js` and confirm it passes.
- [ ] Commit the task.

### Task 2: Speak restored-session welcome

**Files:**
- Modify: `assets/js/adam.js`
- Test: `tests/extract-flow.test.js`

**Interfaces:**
- Consumes: successful restoration metadata from Task 1.
- Produces: one accepted startup utterance using either the welcome-back copy plus exact restored question or the existing fresh-session orientation.

- [ ] Write tests proving saved current-agent progress selects the welcome-back phrase, the exact current question is appended, and the spoken flag is set only after `speak()` accepts the request.
- [ ] Run `node --test tests/extract-flow.test.js` and confirm the new tests fail.
- [ ] Implement the restored-session speech branch.
- [ ] Run `node --test tests/extract-flow.test.js tests/realtime-interviewer.test.js` and confirm both pass.
- [ ] Commit the task.

### Task 3: Build, verify, and publish

**Files:**
- Update generated `public/` browser assets through the existing build.

**Interfaces:**
- Produces: verified `main` and a Ready production Vercel deployment.

- [ ] Run `npm test` and confirm zero failures.
- [ ] Run `npm run build`, inspect the scoped diff, and commit generated assets.
- [ ] Merge to `main`, rerun `npm test`, push, and confirm the newest production deployment is Ready.

