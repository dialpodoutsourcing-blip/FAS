# Hands-Free Guided Interview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Talk a hands-free, cross-browser ADAM interview that uses the same deterministic questions, atomic persistence, acknowledgements, completion, and artifact redirect as Type.

**Architecture:** A dedicated WebRTC Realtime controller owns only microphone, transcription, turn detection, and Cedar playback. A shared interview coordinator owns answer acceptance and durable state for both Type and Talk. The existing ADAM page binds them together; the Realtime model never chooses interview state or writes data.

**Tech Stack:** Browser WebRTC/getUserMedia, OpenAI Realtime API, semantic VAD, vanilla JavaScript UMD modules, Express, Supabase REST/RPC, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-25-hands-free-guided-interview-design.md`

## Global Constraints

- Support current Chrome, Edge, Firefox, and Safari across Windows, macOS, Linux, iOS/iPadOS, and Android where standards-compliant WebRTC and microphone APIs exist.
- Capability failure must preserve the complete Type flow; never display a fake working microphone.
- `OPENAI_API_KEY` remains server-only and every paid session retains origin and authenticated-user checks.
- Realtime uses Cedar, input transcription, semantic VAD with low eagerness, `create_response:false`, and interruption enabled.
- Only finalized transcript text enters persistence; FAS never stores raw audio.
- A spoken answer must be durably saved before ADAM speaks the next prompt.
- Type and Talk must use one coordinator, one interview instance, one checkpoint, and one completion path.
- Pause disables microphone capture; explicit mic interaction resumes it.
- A finalized in-flight turn finishes saving before teardown; a partial turn is never silently saved.

## Review Focus

- Duplicate final-transcript events, reconnection, or rapid barge-in must create exactly one durable answer.
- Pause/End/Type during partial, finalized, and saving phases must not lose or double-save a turn.
- iOS/Safari autoplay, visibility changes, and media interruption must leave controls truthful and require explicit resume.
- A save failure must retain the transcript for retry and must not speak or display the next question.
- Completion during Talk must speak once, generate one artifact, release the microphone, and preserve agent/project/session in the redirect.

---

### Task 1: Extract one durable answer coordinator for Type and Talk

**Files:**
- Create: `assets/js/interview-coordinator.js`
- Create: `tests/interview-coordinator.test.js`
- Modify: `assets/js/adam.js`
- Modify: `chat.html`

**Interfaces:**
- Consumes: existing `FAS.interview` instance, `projectStore.saveAnswerCheckpoint(answer, checkpoint)`, and `requestReply(answer, nextQuestion)`.
- Produces: `FAS.createInterviewCoordinator(options)` with `submit({text, source, turnId}) -> Promise<Result>`, `busy() -> boolean`, and `hasProcessed(turnId) -> boolean`.
- `Result` contains `saved`, `checkpoint`, `message`, `nextQuestion`, `summary`, `completion`, and `source`.

- [ ] **Step 1: Write coordinator tests for one typed submission and one spoken submission**

Assert both sources call `interview.acceptAnswer`, atomically save answer/checkpoint, reconcile the durable ID, request the grounded acknowledgement with the engine-selected prompt, and return the same result shape.

- [ ] **Step 2: Write coordinator tests for the Review Focus persistence failures**

Assert duplicate `turnId` calls share one promise, concurrent different turns are rejected while busy, save failure restores the prior checkpoint, reply failure falls back to the exact next question, and completion returns without accepting an extra answer.

- [ ] **Step 3: Run the new tests and verify RED**

Run: `node --test tests/interview-coordinator.test.js`

Expected: FAIL because `assets/js/interview-coordinator.js` does not exist.

- [ ] **Step 4: Implement the coordinator module**

Keep DOM rendering and artifact generation outside this module. Cache in-flight/completed turn promises by `turnId`; only mark a turn processed after durable save. Restore the exact prior checkpoint on pre-save failure.

- [ ] **Step 5: Replace the typed `send()` persistence chain with coordinator submission**

Keep typed rendering, retry copy, checkpoint note, completion announcement, artifact single-flight, and redirect behavior unchanged. Load `interview-coordinator.js` before `adam.js` in `chat.html`.

- [ ] **Step 6: Run coordinator and existing chat tests**

Run: `node --test tests/interview-coordinator.test.js tests/extract-flow.test.js tests/production-journey.test.js`

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add assets/js/interview-coordinator.js assets/js/adam.js chat.html tests/interview-coordinator.test.js
git commit -m "refactor: share durable interview submission"
```

---

### Task 2: Add a dedicated authenticated Realtime interview session

**Files:**
- Modify: `server.js`
- Modify: `tests/narration-server.test.js`

**Interfaces:**
- Consumes: authenticated SDP POST and the existing `authorizePaidRequest`/same-origin checks.
- Produces: `buildRealtimeInterviewSessionConfig()` and `POST /api/realtime-interview-session` returning SDP.
- Leaves `buildRealtimeSessionConfig()` and `/api/realtime-session` unchanged for tutorial narration.

- [ ] **Step 1: Write failing configuration tests**

Assert the interview config uses `gpt-realtime-2.1`, Cedar, input transcription with `gpt-4o-mini-transcribe`, semantic VAD with `eagerness:'low'`, `create_response:false`, `interrupt_response:true`, no tools, and instructions limiting speech to application-supplied copy.

- [ ] **Step 2: Write failing route tests**

Assert `/api/realtime-interview-session` validates SDP, origin, and Supabase authentication; uses the interview config; retries only transient gateway errors with `gpt-realtime-1.5`; sanitizes upstream failures; and never includes the API key in a response.

- [ ] **Step 3: Run the server tests and verify RED**

Run: `node --test tests/narration-server.test.js`

Expected: FAIL because the interview config and route do not exist.

- [ ] **Step 4: Implement the dedicated config and route**

Share only the existing authentication, origin, SDP validation, and transient-model retry helpers. Keep tutorial narration receive-only and behaviorally unchanged.

- [ ] **Step 5: Run server tests**

Run: `node --test tests/narration-server.test.js tests/runtime-config.test.js`

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add server.js tests/narration-server.test.js
git commit -m "feat: add realtime interview session"
```

---

### Task 3: Build the cross-browser Realtime interviewer controller

**Files:**
- Create: `assets/js/realtime-interviewer.js`
- Create: `tests/realtime-interviewer.test.js`

**Interfaces:**
- Consumes options: `peerFactory`, `audioFactory`, `mediaDevices`, `fetchImpl`, `getAccessToken`, `lifecycleTarget`, `onState`, `onPartialTranscript`, `onFinalTranscript`, and `onError`.
- Produces `FAS.createRealtimeInterviewer(options)` with `start()`, `speak(text)`, `repeat()`, `pause()`, `resume()`, `stop({waitFor})`, `partialTranscript()`, and `state()`.
- Emits finalized turns as `{turnId, itemId, text}` exactly once.

- [ ] **Step 1: Write failing capability and connection tests**

Assert unsupported WebRTC/getUserMedia fails before network traffic; supported start requests echo cancellation/noise suppression/auto gain, attaches local audio to a send-receive WebRTC peer, attaches remote audio, authenticates `/api/realtime-interview-session`, and unlocks playback from the mic-button gesture.

- [ ] **Step 2: Write failing transcript and state tests**

Drive synthetic `speech_started`, transcription delta/completed, output-audio, response-done, and error events. Assert truthful state transitions, interim transcript callbacks, normalized finalized text, and item-ID/turn-ID deduplication.

- [ ] **Step 3: Write failing interruption and lifecycle tests**

Assert user speech cancels/interrupts active playback, Pause disables every microphone track, Resume requires explicit invocation, hidden/pagehide pauses safely, foreground return never auto-enables the mic, and Stop releases tracks/channel/peer/audio idempotently.

- [ ] **Step 4: Write failing partial/in-flight teardown tests**

Assert partial text remains available but is not finalized, while `stop({waitFor})` awaits an already-finalized save promise before releasing resources.

- [ ] **Step 5: Run the controller tests and verify RED**

Run: `node --test tests/realtime-interviewer.test.js`

Expected: FAIL because the controller does not exist.

- [ ] **Step 6: Implement the Realtime interviewer**

Handle both current Realtime audio event aliases already supported by the narrator. Treat all data-channel payloads as untrusted. Do not reconnect automatically or synthesize a final answer from partial text.

- [ ] **Step 7: Run controller and narrator tests**

Run: `node --test tests/realtime-interviewer.test.js tests/realtime-narrator.test.js`

Expected: all pass; narration behavior remains unchanged.

- [ ] **Step 8: Commit**

```bash
git add assets/js/realtime-interviewer.js tests/realtime-interviewer.test.js
git commit -m "feat: add hands-free realtime interviewer"
```

---

### Task 4: Integrate proactive Talk behavior into ADAM

**Files:**
- Modify: `chat.html`
- Modify: `assets/js/adam.js`
- Modify: `assets/css/styles.css`
- Modify: `tests/extract-flow.test.js`
- Modify: `tests/static-multi-agent.test.js`
- Modify: `tests/vercel-deployment.test.js`

**Interfaces:**
- Consumes: `FAS.createRealtimeInterviewer`, the Task 1 coordinator, current `interview.currentQuestion()`, and existing completion/artifact functions.
- Produces: one hands-free Talk binding whose finalized turns call `coordinator.submit({source:'voice', turnId, text})`.

- [ ] **Step 1: Write failing page-wiring and startup tests**

Assert `realtime-interviewer.js` and `interview-coordinator.js` load before `adam.js`; one mic click creates/starts the interviewer; startup speaks a short orientation plus the exact current question only after persistence is initialized.

- [ ] **Step 2: Write failing proactive-turn tests**

Assert a finalized transcript renders once, enters the shared coordinator, shows Thinking while saving, waits for success, renders the grounded acknowledgement, updates both question displays, and speaks the acknowledgement plus exact follow-up/next question.

- [ ] **Step 3: Write failing voice-command tests**

Assert standalone “repeat the question,” “pause,” “switch to typing,” and “end” are not saved as answers. Pause disables the mic; Type receives any partial draft; End waits for a finalized in-flight save and releases resources.

- [ ] **Step 4: Write failing completion and failure tests**

Assert Talk completion stops listening, speaks the existing completion message once, runs the existing blueprint single-flight, and redirects with agent/project/session. Assert permission, connection, transcription, save, reply, and playback failures show truthful recovery copy and preserve Type.

- [ ] **Step 5: Implement the ADAM Talk binding and accessible UI states**

Remove preview-only mic behavior from production controls. Keep orb/status/transcript synchronized to controller callbacks. Add visible `Retry voice` and `Type instead` recovery controls without introducing a second interview state.

- [ ] **Step 6: Run focused UI and flow tests**

Run: `node --test tests/extract-flow.test.js tests/static-multi-agent.test.js tests/vercel-deployment.test.js tests/interview-coordinator.test.js tests/realtime-interviewer.test.js`

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add chat.html assets/js/adam.js assets/css/styles.css tests/extract-flow.test.js tests/static-multi-agent.test.js tests/vercel-deployment.test.js
git commit -m "feat: facilitate guided interviews by voice"
```

---

### Task 5: Verify browser lifecycle, production build, and live deployment

**Files:**
- Create: `docs/voice-interview-acceptance.md`
- Modify: `README.md`
- Generated by build: `public/`

**Interfaces:**
- Consumes: the completed Talk implementation.
- Produces: an explicit compatibility/recovery checklist and deployed browser assets.

- [ ] **Step 1: Write the acceptance matrix**

Cover desktop Chrome/Edge/Firefox/Safari and mobile Safari/Chrome: permission allow/deny, first audio playback, normal answer, thoughtful pause, barge-in, repeat, pause/resume, Type switch with partial draft, background/foreground, connection loss, save failure, completion, and review redirect.

- [ ] **Step 2: Run automated verification**

Run: `npm run build && npm test && git diff --check`

Expected: build exit 0, zero failing tests, and clean diff check.

- [ ] **Step 3: Run available real-browser smoke checks**

Verify microphone capture, semantic turn completion, transcript submission, spoken acknowledgement, Supabase answer/checkpoint, Type/Talk continuity, mic release, and blueprint redirect. Record tested browser/OS versions and any unavailable device matrix honestly in `docs/voice-interview-acceptance.md`.

- [ ] **Step 4: Review the complete change**

Request an independent review of the full implementation for duplicate persistence, privacy-state truthfulness, prompt/state authority, cross-browser lifecycle, authentication, and resource cleanup. Fix every Critical or Important finding and rerun Step 2.

- [ ] **Step 5: Commit documentation and generated browser assets**

```bash
git add README.md docs/voice-interview-acceptance.md public
git commit -m "docs: verify realtime interview compatibility"
```

- [ ] **Step 6: Push and deploy production**

Push `main`, deploy with the existing Vercel project, verify the live JS contains the new coordinator/controller and the live interview-session route returns authenticated behavior, then report the exact browsers actually exercised.

## Self-review

- Spec coverage: every goal, non-goal, failure boundary, privacy rule, command, completion behavior, and browser requirement maps to Tasks 1–5.
- Step scan: each step creates one test group, implementation unit, verification run, review, or commit.
- Type consistency: Task 1 returns a coordinator result consumed by Task 4; Task 3 emits finalized `{turnId,itemId,text}` values consumed by Task 4; Task 2 provides the endpoint Task 3 calls.
- Review Focus: duplicate turns are covered in Tasks 1 and 3; teardown boundaries in Tasks 3 and 4; mobile lifecycle in Tasks 3 and 5; save failure in Tasks 1 and 4; completion single-flight in Task 4.
- Proportion: five tasks isolate persistence, server configuration, WebRTC, UI orchestration, and release verification without changing unrelated systems.
