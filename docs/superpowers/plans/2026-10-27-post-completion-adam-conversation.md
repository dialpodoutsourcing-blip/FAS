# Post-Completion ADAM Conversation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep ADAM conversational after ANCHOR completion, preserve completed work, expose review/edit/retry/EXTRACT actions, and make chat history scrollable.

**Architecture:** Add a dedicated server-side advisory response mode that is separate from interview submissions. The client enters an explicit `completed` conversation state, routes Type and Talk turns to that advisor without changing saved answers, and renders a persistent completion panel. Existing project-store revision/reset operations remain the only paths that mutate completed work.

**Tech Stack:** Node.js, Express, browser JavaScript, WebRTC Realtime voice, static HTML/CSS, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-27-post-completion-adam-conversation-design.md`

## Global Constraints

- Ordinary post-completion conversation must not mutate answers, checkpoints, artifacts, or artifact versions.
- Unrelated questions are answered concisely and followed by one brief bridge to ANCHOR, EXTRACT, or the next FAS action.
- Completed ANCHOR work remains available while EXTRACT starts.
- Retry requires explicit confirmation and uses the existing agent-scoped reset operation.
- Realtime and API credentials stay server-side; deployed requests retain authentication and origin controls.

## Review Focus

- Repeated post-completion voice transcripts must not create saved interview answers; pin in Task 2 tests.
- Advisory failure must leave completed work intact and provide a useful fallback; pin in Task 1 and Task 2 tests.
- A long conversation must keep earlier messages reachable and the newest reply visible; pin in Task 3 tests.
- Edit and retry must not be confused: edit creates a superseding answer while retry resets only after confirmation; pin in Task 4 tests.
- Starting EXTRACT must preserve ANCHOR answers and artifacts; pin in Task 4 tests.

---

### Task 1: Post-completion advisory endpoint

**Files:**
- Modify: `server.js`
- Test: `tests/narration-server.test.js`

**Interfaces:**
- Consumes: authenticated/local-preview request authorization already used by `/api/chat-response`.
- Produces: `POST /api/advisory-response` accepting `{agent, message, completedSummary, history}` and returning `{message}`.

- [ ] **Step 1: Write failing endpoint tests** for valid grounded advice, concise unrelated-answer bridging, malformed input rejection, authentication, and sanitized upstream failure.
- [ ] **Step 2: Run `node --test tests/narration-server.test.js` and confirm the new tests fail because the route is absent.**
- [ ] **Step 3: Implement request normalization, bounded history/summary limits, a post-completion advisor prompt, and the authenticated route in `server.js`.** The prompt must answer first, avoid claiming saved changes, and close with one short workflow bridge.
- [ ] **Step 4: Run `node --test tests/narration-server.test.js` and confirm all endpoint tests pass.**

### Task 2: Completed conversation state for Type and Talk

**Files:**
- Modify: `assets/js/adam.js`
- Test: `tests/interview-coordinator.test.js`
- Test: `tests/review-fixes.test.js`

**Interfaces:**
- Consumes: `POST /api/advisory-response` from Task 1 and the existing `projectStore.loadProject()` result.
- Produces: internal `completedConversation` state and `submitPostCompletionMessage(text, source, turnId)` used by both Type and Talk.

- [ ] **Step 1: Write failing client tests** proving completed Type/Talk messages call the advisory route, never call the interview coordinator or save methods, speak the returned message in Talk, resume listening, deduplicate repeated turn IDs, and preserve useful fallback copy on failure.
- [ ] **Step 2: Run the focused client tests and verify the expected failures.**
- [ ] **Step 3: Implement completed-state hydration and a bounded completed-summary builder from saved ANCHOR work.**
- [ ] **Step 4: Implement `submitPostCompletionMessage(text, source, turnId)` and route `send()` plus `handleVoiceTurn()` through it when complete.**
- [ ] **Step 5: Change voice completion so it generates the artifact without destroying the Realtime session or redirecting automatically; speak the completion invitation and resume listening.**
- [ ] **Step 6: Run focused tests and confirm Type/Talk completed conversation behavior passes without saved-work mutation.**

### Task 3: Scrollable conversation and completion panel

**Files:**
- Modify: `chat.html`
- Modify: `assets/css/styles.css`
- Modify: `assets/js/adam.js`
- Test: `tests/static-multi-agent.test.js`
- Test: `tests/review-fixes.test.js`

**Interfaces:**
- Consumes: completed state from Task 2.
- Produces: `[data-completion-panel]`, `[data-view-blueprint]`, `[data-edit-answers]`, `[data-retry-agent]`, and `[data-start-extract]` UI hooks.

- [ ] **Step 1: Write failing static/controller tests** for vertical thread scrolling, auto-scroll, completion status copy, and all four action hooks.
- [ ] **Step 2: Run the focused tests and verify the expected failures.**
- [ ] **Step 3: Add the hidden completion panel markup with completed status and View Blueprint, Edit Answers, Retry ANCHOR, and Start EXTRACT actions.**
- [ ] **Step 4: Change the main thread to `overflow-y: auto`, retain constrained layout sizing, and add accessible scrollbar styling.**
- [ ] **Step 5: Render the panel on restored or newly completed work, keep the composer enabled, and keep `FAS.chat.addMessage()` scrolling to the newest message.**
- [ ] **Step 6: Run focused tests and confirm scroll and panel behavior pass.**

### Task 4: Explicit edit, retry, and EXTRACT transitions

**Files:**
- Modify: `assets/js/project-store.js`
- Modify: `assets/js/adam.js`
- Test: `tests/project-store.test.js`
- Test: `tests/review-fixes.test.js`

**Interfaces:**
- Consumes: completion panel hooks from Task 3.
- Produces: `projectStore.reviseAnswer(answerId, text)` for local and Supabase stores; confirmed agent reset; safe EXTRACT route.

- [ ] **Step 1: Write failing store tests** proving answer revision appends a superseding answer without deleting the original, and proving reset remains agent-scoped.
- [ ] **Step 2: Write failing UI tests** proving Edit Answers opens Saved Work with per-answer Edit controls, Retry requires confirmation, View Blueprint routes to the current review URL, and Start EXTRACT preserves ANCHOR state.
- [ ] **Step 3: Run focused tests and verify the expected failures.**
- [ ] **Step 4: Implement `reviseAnswer(answerId, text)` in local and Supabase stores using `supersedesId`; regenerate a new draft artifact after an accepted revision.**
- [ ] **Step 5: Wire completion actions, inline saved-answer editing, confirmation-protected retry, and EXTRACT navigation in `adam.js`.**
- [ ] **Step 6: Run focused tests and confirm revision, retry, and transition behavior passes.**

### Task 5: Browser build and regression verification

**Files:**
- Generate: `public/` browser copies through the existing build.
- Verify: all affected tests and the full suite.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: deployable browser assets.

- [ ] **Step 1: Run `npm run build` and confirm browser files are prepared in `public/`.**
- [ ] **Step 2: Run `npm test` and require zero failures.**
- [ ] **Step 3: Run a local browser acceptance pass covering completed ANCHOR Type chat, Talk reply/resume, thread scrolling, View/Edit/Retry actions, and Start EXTRACT preservation.**
- [ ] **Step 4: Review `git diff` for secrets, unrelated changes, generated diagnostic files, and accidental changes to completed artifacts.**
