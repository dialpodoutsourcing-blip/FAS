# Realtime Cedar Guided Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the robotic tutorial narration with an output-only Realtime Cedar connection and begin the live product walkthrough with separate ADAM and FAS introductions.

**Architecture:** The local Express server will validate a browser SDP offer and exchange it for a fixed, server-controlled OpenAI Realtime session. A focused browser narrator will own the receive-only WebRTC connection and expose narration lifecycle methods to the existing real-page tutorial controller; the controller will supply speech-first copy and accessible connection status without ever requesting microphone access.

**Tech Stack:** Node.js, Express 5, browser WebRTC (`RTCPeerConnection` and data channels), OpenAI Realtime API, native Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-17-realtime-cedar-demo-design.md`

## Global Constraints

- Use `gpt-live-1` with the `cedar` voice and a fixed server-side ADAM delivery instruction.
- Keep `OPENAI_API_KEY` server-only and keep `C:\vibec\adam` read-only.
- Do not call `getUserMedia`, `addTrack`, `speechSynthesis`, or `SpeechSynthesisUtterance` in the new narration path.
- Keep the tutorial on the current page and continue using the sandboxed real-product iframe.
- Preserve the existing visual-only Talk demonstration and all protected-frame restrictions.
- Narration failure must leave captions and tutorial navigation usable; never silently fall back to a native robotic voice.
- The current workspace is not a Git repository, so commit steps are intentionally omitted.

## Review Focus

- An oversized, malformed, or non-SDP request receives `400` without contacting OpenAI; Task 1 tests each case.
- An unexpected `Origin` receives `403`, while absent Origin and the configured local FAS origin remain usable; Task 1 tests all three paths.
- A step change during speech cancels the active response and stale events cannot update the new step's status; Task 2 tests token and cancellation behavior.
- A failed handshake or rejected audio play leaves the tutorial navigable and visibly reports that captions remain available; Tasks 2 and 4 test the failure state.
- Reopening after close creates a fresh peer session with unmuted state and no leaked tracks, channels, or audio source; Tasks 2 and 4 test teardown and reopening.

---

### Task 1: Secure Realtime Session Exchange

**Files:**
- Modify: `server.js`
- Replace: `tests/narration-server.test.js`

**Interfaces:**
- Consumes: `OPENAI_API_KEY`, an SDP offer body, and the request `Origin` header.
- Produces: `buildRealtimeSessionConfig() -> object` and `POST /api/realtime-session`, returning the upstream SDP answer as `application/sdp`.

- [ ] **Step 1: Write failing server tests**

Replace the Speech API assertions with tests named for: fixed `gpt-live-1`/`cedar` configuration; valid SDP forwarding; missing key; empty, malformed, non-string, and oversized SDP; allowed/absent/disallowed Origin; upstream rejection; and thrown network errors. Assert that errors contain neither the API key nor upstream response bodies.

- [ ] **Step 2: Run the server test and confirm the old route fails the new contract**

Run: `node --test tests/narration-server.test.js`

Expected: FAIL because `buildRealtimeSessionConfig` and `/api/realtime-session` do not exist.

- [ ] **Step 3: Implement the fixed session exchange in `server.js`**

Add `buildRealtimeSessionConfig()` and `POST /api/realtime-session`. Accept `application/sdp` with a bounded body, require SDP markers including `v=0` and `m=audio`, enforce the local-origin policy, and forward the offer to the OpenAI Realtime WebRTC endpoint using the server key and fixed session configuration. Remove `buildSpeechRequest`, `SPEECH_URL`, and `/api/narration` only after the new tests pass.

- [ ] **Step 4: Run the server test**

Run: `node --test tests/narration-server.test.js`

Expected: PASS with the Realtime session configuration, validation, and sanitized errors verified.

### Task 2: Output-Only Realtime Narrator

**Files:**
- Create: `assets/js/realtime-narrator.js`
- Create: `tests/realtime-narrator.test.js`

**Interfaces:**
- Consumes: injected `RTCPeerConnection`, `Audio`, `fetch`, and timer factories plus callbacks `onStatus(status)` and `onError(error)`.
- Produces: `createRealtimeNarrator(options)` with `connect()`, `speak(text)`, `cancel()`, `mute()`, `unmute()`, `replay()`, `isMuted()`, and `destroy()`.

- [ ] **Step 1: Write failing narrator lifecycle tests**

Use fakes to assert one `recvonly` audio transceiver, no local tracks, SDP POSTing, queued speech until the data channel is ready, `response.create` speech requests, remote stream attachment, speaking/completed status, cancellation before replay or step replacement, mute/unmute replay, stale-event suppression, handshake failure, rejected playback, and idempotent teardown.

- [ ] **Step 2: Run the narrator test and verify it fails**

Run: `node --test tests/realtime-narrator.test.js`

Expected: FAIL because `assets/js/realtime-narrator.js` does not exist.

- [ ] **Step 3: Implement `createRealtimeNarrator(options)`**

Use one peer connection, `addTransceiver('audio', { direction:'recvonly' })`, one managed audio element, and an `oai-events` data channel. Maintain a monotonically increasing request token, request speech with strict meaning-preservation instructions, map Realtime lifecycle events to status callbacks, and close every owned resource in `destroy()`.

- [ ] **Step 4: Run the narrator test**

Run: `node --test tests/realtime-narrator.test.js`

Expected: PASS for connection, speech, cancellation, controls, failure handling, and cleanup.

### Task 3: Speech-First Tutorial Content and ADAM/FAS Introduction

**Files:**
- Modify: `assets/js/tutorial.js`
- Modify: `tests/tutorial-state.test.js`
- Modify: `tests/static-tutorial.test.js`

**Interfaces:**
- Consumes: `createRealtimeNarrator(options)` from Task 2.
- Produces: 23 immutable `TOUR_STEPS`, each with a non-empty `speech` field; Step 1 is `meet-adam`, Step 2 is `welcome`, and the existing Talk step remains present.

- [ ] **Step 1: Write failing content-contract tests**

Assert exactly 23 steps; all IDs are unique; every step has non-empty `description` and `speech`; Step 1 contains the approved ADAM introduction; Step 2 contains the approved FAS/seven-specialist/Vault introduction; and the Talk step still uses `selectTalkMode`.

- [ ] **Step 2: Run the focused tutorial tests**

Run: `node --test tests/tutorial-state.test.js tests/static-tutorial.test.js`

Expected: FAIL because there are 22 steps, no `speech` field, and the old narrators remain embedded.

- [ ] **Step 3: Update the step model and all narration copy**

Change `S(...)` to accept `speech`, add `meet-adam` before `welcome`, use the two scripts verbatim from the approved spec, and add concise conversational speech copy to every remaining step without changing their visible product explanations or protected actions.

- [ ] **Step 4: Remove the embedded Speech API and native narrator implementations**

Delete `createNarrator` and `createCedarNarrator` from `tutorial.js`; construct `root.FAS.createRealtimeNarrator` instead. Narrate `step.speech` only after `target-ready`, cancel on navigation and unload, and retain the existing real-page geometry and action flow.

- [ ] **Step 5: Run the focused tutorial tests**

Run: `node --test tests/tutorial-state.test.js tests/static-tutorial.test.js`

Expected: PASS for 23-step order, approved introductions, Talk coverage, and removal of old narration paths.

### Task 4: Accessible Realtime Status and Controls

**Files:**
- Modify: `assets/js/tutorial.js`
- Modify: `assets/css/styles.css`
- Modify: `tests/static-tutorial.test.js`

**Interfaces:**
- Consumes: narrator status callbacks from Task 2.
- Produces: `[data-tour-voice-status]` with `aria-live="polite"` and the exact states `Connecting ADAM…`, `ADAM ready`, `ADAM speaking`, `Muted`, and `Narration unavailable — captions are still available`.

- [ ] **Step 1: Write failing status and interaction tests**

Assert the live status exists, all exact state strings are represented, Replay cancels then requests the current speech, Mute pauses audio, Unmute restarts the current step, navigation cancels speech, close destroys the narrator, and reopening resets the visible state to unmuted/connecting.

- [ ] **Step 2: Run the focused UI tests**

Run: `node --test tests/static-tutorial.test.js tests/realtime-narrator.test.js`

Expected: FAIL because the header has no Realtime connection status contract.

- [ ] **Step 3: Wire status and controls into the live tutorial shell**

Add the compact status beside the AI disclosure, map narrator callbacks to its text, disable Replay until ready, keep navigation enabled on failure, and reset control labels and ARIA state every time `open()` creates a fresh narrator.

- [ ] **Step 4: Style the status for full, narrow, and short screens**

Use existing black/gold tokens, preserve the one-screen layout, and ensure the failure message remains readable without obscuring chapter progress or controls.

- [ ] **Step 5: Run the focused UI tests**

Run: `node --test tests/static-tutorial.test.js tests/realtime-narrator.test.js`

Expected: PASS for status, controls, accessibility, and failure usability.

### Task 5: Load the Narrator on Every Product Page and Enforce Safety

**Files:**
- Modify: `index.html`
- Modify: `chat.html`
- Modify: `review.html`
- Modify: `vault.html`
- Modify: `launch.html`
- Modify: `tests/static-tutorial.test.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: `assets/js/realtime-narrator.js` global export.
- Produces: identical script order on all five pages: navigation/frame dependencies, Realtime narrator, then tutorial controller.

- [ ] **Step 1: Write failing page-order and static-safety tests**

Assert every HTML page loads `realtime-narrator.js` exactly once before `tutorial.js`. Scan the narration path and server for prohibited `getUserMedia`, `addTrack`, `speechSynthesis`, `SpeechSynthesisUtterance`, `/api/narration`, and `gpt-4o-mini-tts` references.

- [ ] **Step 2: Run the static tutorial test**

Run: `node --test tests/static-tutorial.test.js`

Expected: FAIL because the new narrator is not loaded and obsolete narration references remain.

- [ ] **Step 3: Update all shared page script blocks and local documentation**

Load the narrator consistently before `tutorial.js`. Document `npm install`, `.env` with `OPENAI_API_KEY`, `npm start`, the localhost URL, the output-only/no-microphone behavior, and the caption-only failure mode without exposing a real key.

- [ ] **Step 4: Run all automated tests**

Run: `npm test`

Expected: every test file passes with no prohibited narration API reference.

### Task 6: Local Realtime Smoke Test and Final Regression

**Files:**
- Modify if needed: `README.md`

**Interfaces:**
- Consumes: the completed local server, browser tutorial, and configured ignored `.env` key.
- Produces: verified output-only Cedar narration across the real tutorial pages.

- [ ] **Step 1: Start the local server and verify the session endpoint**

Run: `npm start`

Expected: FAS listens on `http://127.0.0.1:4173`; a browser-created receive-only offer receives a valid SDP answer without exposing the key.

- [ ] **Step 2: Exercise the tutorial manually in a browser**

Open Help me / Demo and verify: ADAM speaks his introduction first; FAS is introduced second; Cedar sounds natural; the tutorial never prompts for microphone permission; Talk is selected visually at its step; Next, Back, Replay, Mute, Unmute, Close, and reopen behave correctly; failure leaves captions and navigation usable.

- [ ] **Step 3: Run the final automated regression**

Run: `npm test`

Expected: all server, narrator, tutorial, agent, sidebar, Vault, geometry, and protected-frame tests pass.

- [ ] **Step 4: Inspect the source for secrets and obsolete narration paths**

Run: `rg -n "OPENAI_API_KEY=|sk-[A-Za-z0-9_-]+|/api/narration|gpt-4o-mini-tts|speechSynthesis|SpeechSynthesisUtterance|getUserMedia|addTrack" -g '!node_modules/**' -g '!.env' .`

Expected: no source secrets and no obsolete/prohibited narration implementation references; documentation-only mentions may be reviewed explicitly.
