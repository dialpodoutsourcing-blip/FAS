# Cedar Tutorial Narration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add server-backed Cedar narration to the FAS tutorial and a safe guided Talk-mode step, while preserving native speech fallback and all existing tutorial protections.

**Architecture:** A local Express server owns the OpenAI credential and proxies validated narration text to the Speech API with fixed Cedar settings. A browser-side hybrid narrator manages fetched audio, caching, cancellation, and native fallback; the protected iframe bridge simulates only the visual Talk selection.

**Tech Stack:** Node.js, Express, dotenv, OpenAI Speech API (`gpt-4o-mini-tts`/`cedar`), vanilla JavaScript, HTML5 Audio, Node `assert` tests.

**Spec:** `docs/superpowers/specs/2026-10-17-cedar-tutorial-narration-design.md`

## Global Constraints

- Never modify `C:\vibec\adam`.
- Copy its key only into ignored `C:\vibec\FAS\.env`; never expose or print the value.
- Use model `gpt-4o-mini-tts`, voice `cedar`, MP3, speed `0.96`, and the approved premium-guide delivery instruction.
- Cedar is primary; browser speech synthesis remains the automatic fallback.
- All stop paths abort pending requests and stop both audio implementations.
- Talk simulation changes visual state only and never requests microphone permission.
- Preserve existing iframe safety, captions, Mute, Replay, Back, Next, Skip, Close, and one-screen behavior.
- This workspace has no Git metadata; record named verification checkpoints instead of commits.

## Review Focus

- A stale Cedar response arriving after Next must never play; Task 2 tests generation-token suppression.
- Muting during a pending request must abort without triggering native fallback; Task 2 tests the abort path.
- A server failure or blocked `file://` request must immediately retain usable native narration; Task 2 tests fetch rejection and non-OK responses.
- Repeated Replay must reuse cached audio without leaking object URLs; Task 2 tests fetch count and cleanup revocation.
- Clicking Talk in the demo must not reach media APIs or production voice handlers; Task 3 tests the protected visual-only action.

---

### Task 1: Secure Cedar Narration Server

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `server.js`
- Create: `.gitignore`
- Create: `.env.example`
- Create locally: `.env`
- Create: `tests/narration-server.test.js`

**Interfaces:**
- Consumes: `OPENAI_API_KEY` from server environment and injected `fetchImpl` for tests.
- Produces: `createApp({ fetchImpl, apiKey })`, `buildSpeechRequest(text)`, and `POST /api/narration` returning `audio/mpeg`.

- [ ] **Step 1: Write failing server contract tests**

Test that `buildSpeechRequest('Welcome')` fixes model, voice, format, speed, input, and narration instructions; the route rejects absent, non-string, blank, and over-limit text; success forwards authorization only upstream and returns non-empty MP3 bytes with private cache headers; failures return sanitized JSON that contains neither the key nor upstream body.

- [ ] **Step 2: Run the test and verify RED**

Run: `node tests\narration-server.test.js`
Expected: FAIL because `server.js` and its exports do not exist.

- [ ] **Step 3: Add package/configuration files and install dependencies**

Create scripts `start: node server.js` and `test: node --test tests/*.test.js`; depend on `express` and `dotenv`. Add `.env` and generated audio patterns to `.gitignore`; `.env.example` contains only `OPENAI_API_KEY=`. Install to generate the lockfile.

- [ ] **Step 4: Copy the credential without displaying it**

Read `C:\vibec\adam\.env` and write only its `OPENAI_API_KEY` assignment into ignored FAS `.env`. Verify presence by key name and non-empty length only; never print the value.

- [ ] **Step 5: Implement the server interfaces**

Serve repository static files, use a small JSON body limit, validate narration text, call `https://api.openai.com/v1/audio/speech`, and stream buffered MP3 bytes. Listen only when `server.js` is the entry module so tests can import without binding a port.

- [ ] **Step 6: Run the server tests and verify GREEN**

Run: `node tests\narration-server.test.js`
Expected: Cedar narration server checks pass.

- [ ] **Step 7: Record Task 1 checkpoint**

Record the test output and secret-handling verification without recording the secret.

### Task 2: Hybrid Cedar Browser Narrator

**Files:**
- Modify: `assets/js/tutorial.js`
- Modify: `tests/tutorial-state.test.js`
- Modify: `tests/static-tutorial.test.js`

**Interfaces:**
- Consumes: `POST /api/narration`, browser `fetch`, `Audio`, `AbortController`, `URL.createObjectURL`, and existing native narrator.
- Produces: `createCedarNarrator(options)` with `speak(text)`, `cancel()`, `mute()`, `unmute()`, `replay()`, `isMuted()`, and `destroy()`.

- [ ] **Step 1: Write failing hybrid narrator tests**

Test Cedar-first fetch/play; fixed JSON request; native fallback on fetch rejection, non-OK response, invalid audio, or play rejection; cache reuse; Replay; Mute/Unmute; pending abort; stale response suppression; cancel/pause; and destroy-time object URL revocation.

- [ ] **Step 2: Run the narrator tests and verify RED**

Run: `node tests\tutorial-state.test.js`
Expected: FAIL because `createCedarNarrator` is not exported.

- [ ] **Step 3: Implement `createCedarNarrator(options)`**

Use dependency injection for deterministic tests. Maintain one generation counter, one active controller, one Audio instance, and a text-to-object-URL Map. An `AbortError` caused by cancellation is silent and must not invoke fallback.

- [ ] **Step 4: Wire the controller to Cedar and disclosure copy**

Instantiate the hybrid narrator in `createController`; call `destroy()` in final cleanup and `cancel()` on every existing transition. Add concise visible copy such as `AI-generated Cedar narration` to the tutorial header without changing the one-screen layout.

- [ ] **Step 5: Run narrator and static tutorial tests**

Run: `node tests\tutorial-state.test.js; node tests\static-tutorial.test.js`
Expected: both pass.

- [ ] **Step 6: Record Task 2 checkpoint**

Record Cedar lifecycle, disclosure, and fallback test results.

### Task 3: Safe Guided Talk-Mode Step

**Files:**
- Modify: `assets/js/tutorial.js`
- Modify: `assets/js/tutorial-frame.js`
- Modify: `chat.html`
- Modify: `tests/tutorial-frame.test.js`
- Modify: `tests/static-tutorial.test.js`

**Interfaces:**
- Consumes: `selectTalkMode` action targeting the real `[data-tour-id="input-modes"]` control.
- Produces: one additional ADAM tutorial step and a bridge-only visual selection state followed by `interaction-complete`.

- [ ] **Step 1: Write failing Talk-step tests**

Assert a dedicated step describes spoken answers, targets `input-modes`, and requests `selectTalkMode`; the bridge recognizes the action, activates the real Talk button's visual/ARIA state, does not call `.click()` on the production control, and contains no media API call.

- [ ] **Step 2: Run the tests and verify RED**

Run: `node tests\tutorial-frame.test.js; node tests\static-tutorial.test.js`
Expected: FAIL because `selectTalkMode` and the dedicated step are absent.

- [ ] **Step 3: Add stable attributes to the real mode buttons**

Add unstyled `data-tour-type-mode` and `data-tour-talk-mode` hooks to the existing Type and Talk buttons without changing normal handlers.

- [ ] **Step 4: Add the narrated Talk step**

Insert it beside the existing input-mode tutorial step so the user sees the real Talk control selected before the conversation/composer walkthrough.

- [ ] **Step 5: Implement visual-only selection in the bridge**

For `selectTalkMode`, directly update the Type/Talk selected classes and ARIA state through the stable hooks, then send `interaction-complete`. Do not dispatch click, pointer, keyboard, or media events.

- [ ] **Step 6: Run Talk and regression tests**

Run: `node tests\tutorial-frame.test.js; node tests\static-tutorial.test.js; node tests\tutorial-geometry.test.js`
Expected: all pass.

- [ ] **Step 7: Record Task 3 checkpoint**

Record the safe visual-only Talk behavior and updated step-count verification.

### Task 4: Documentation and End-to-End Verification

**Files:**
- Modify: `README.md`
- Modify if defects are found: files owned by Tasks 1-3
- Test: all `tests/*.test.js`

**Interfaces:**
- Consumes: completed server, narrator, and Talk step.
- Produces: documented local startup and fresh verification evidence.

- [ ] **Step 1: Document local Cedar startup**

Explain `npm install`, `npm start`, localhost URL, ignored `.env`, AI-generated narration, native fallback for direct-file use, and that the API key stays server-side.

- [ ] **Step 2: Run syntax and complete tests**

Run Node syntax checks for all production JavaScript, then every `tests/*.test.js` file.
Expected: zero failures.

- [ ] **Step 3: Run local integration without exposing the key**

Start the server, request one short `/api/narration` sample, and verify HTTP 200, `audio/mpeg`, and a non-zero byte count. Report only status, content type, and byte count.

- [ ] **Step 4: Verify browser behavior**

Open the tutorial through localhost; confirm Cedar starts after target readiness, Next cancels/restarts, Mute and Replay work, the Talk step visibly selects Talk without a permission prompt, and closing stops audio.

- [ ] **Step 5: Run the final full suite**

Repeat the syntax and full-test command after any integration fixes.
Expected: clean exit code 0.

- [ ] **Step 6: Record final checkpoint**

Record test totals, integration metadata, manual browser results, and any environment limitation without secrets.
