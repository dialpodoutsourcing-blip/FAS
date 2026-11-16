# Context-Locked Talk Questions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let ADAM answer basic/contextual questions and clarifications during Talk without saving them or advancing the interview, while varying repetitive guidance safely.

**Architecture:** Add a pure side-question intent classifier ahead of answer validation, a protected server route with a tightly context-locked model prompt, and a client handler that speaks the answer then returns to the unchanged current question. Use deterministic rotating copy sets for repeated confirmation/fallback language.

**Tech Stack:** Browser JavaScript, Express server, OpenAI Responses API integration already present, Node.js built-in test runner, existing FAS build script

**Spec:** `docs/superpowers/specs/2026-11-16-context-locked-talk-questions-design.md`

## Global Constraints

- Side questions are never saved as interview answers.
- Side questions never advance or mutate the interview checkpoint.
- The canonical current question remains unchanged until a valid answer is accepted and saved.
- The server cannot browse and must not invent user facts or answer the interview on the user’s behalf.
- Controls and pending confirmations retain priority over side-question routing.
- Raw audio is never sent; only finalized transcript text is used.

## Review Focus

- “What do you mean?” and “Can you give me an example?” must route to explanation before short-answer validation.
- An ordinary interrogative that is actually a valid interview answer must not be stolen by the side-question classifier.
- Repeat, pause, retry, navigation, and pending yes/no decisions must still win over side-question intent.
- API failure or off-context questions must return truthful varied guidance and keep the exact current question.
- Duplicate finalized voice turns must not create duplicate model requests or speech responses.

---

### Task 1: Side-question intent classifier

**Files:**
- Create: `assets/js/interview-question-intent.js`
- Modify: `chat.html`
- Test: `tests/interview-question-intent.test.js`
- Test: `tests/static-multi-agent.test.js`

**Interfaces:**
- Consumes: finalized transcript text and current question
- Produces: `classify({ text, currentQuestion }) -> { type:'clarification'|'basic_question' } | null`

- [ ] **Step 1: Write failing classifier tests**

Cover explicit clarification, contextual example/importance questions, ordinary basic interrogatives, declarative answers, interview controls, yes/no, and answer-like sentences containing a question word.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/interview-question-intent.test.js tests/static-multi-agent.test.js`
Expected: FAIL because the module and script entry are absent.

- [ ] **Step 3: Implement and load the pure classifier**

Create `FAS.interviewQuestionIntent.classify(input)` and load it before `adam.js`. Match explicit clarification and bounded interrogative forms while excluding controls, confirmation replies, and declarative answer language.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/interview-question-intent.test.js tests/static-multi-agent.test.js`
Expected: all tests pass.

### Task 2: Protected context-locked response endpoint

**Files:**
- Modify: `lib/openai.js`
- Modify: `server.js`
- Test: `tests/openai.test.js`
- Test: `tests/server.test.js`

**Interfaces:**
- Consumes: `{ agent, message, currentQuestion, history }`
- Produces: `POST /api/interview-question-response -> { message }`

- [ ] **Step 1: Write failing request/prompt tests**

Assert request normalization bounds text/history, rejects malformed agent/question input, authorizes the specialist before upstream access, and builds a prompt that forbids browsing, invention, saving, advancement, answering on the user’s behalf, or asking a replacement interview question.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/openai.test.js tests/server.test.js`
Expected: FAIL because the request normalizer, prompt builder, and route are absent.

- [ ] **Step 3: Implement the minimal protected endpoint**

Add focused normalization/payload helpers in `lib/openai.js` and mirror the existing authorized Responses API route pattern in `server.js`. Return safe concise text or a generic availability error.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/openai.test.js tests/server.test.js`
Expected: all tests pass.

### Task 3: Hands-free routing and unchanged-question return

**Files:**
- Modify: `assets/js/adam.js`
- Test: `tests/extract-flow.test.js`

**Interfaces:**
- Consumes: Task 1 classifier and Task 2 endpoint
- Produces: `answerInterviewSideQuestion(text, source, turnId)` that never invokes the answer submission gate or coordinator

- [ ] **Step 1: Write failing client-flow tests**

Assert controls and pending confirmations precede classification; classified Talk turns call the dedicated endpoint before validation; the request contains the exact current question; the handler speaks the answer plus a return cue and unchanged question; no save/advance functions occur in its slice; Type uses the same route when appropriate.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/extract-flow.test.js tests/interview-question-intent.test.js tests/realtime-interviewer.test.js`
Expected: FAIL because side questions still enter answer validation/relevance handling.

- [ ] **Step 3: Implement context-locked client handling**

Route after controls/confirmations but before answer validation. Bound history, deduplicate voice turn IDs, render the user request and ADAM answer, preserve the current question, and use `speakVoicePrompt` so listening resumes only after ADAM finishes.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/extract-flow.test.js tests/interview-question-intent.test.js tests/realtime-interviewer.test.js`
Expected: all tests pass.

### Task 4: Varied truthful copy

**Files:**
- Modify: `assets/js/adam.js`
- Test: `tests/extract-flow.test.js`

**Interfaces:**
- Consumes: copy category and per-category rotation state
- Produces: `nextVoiceCopy(category, values) -> string`

- [ ] **Step 1: Write failing copy-variation tests**

Assert at least three variants exist for return cues, uncertain-relevance confirmation, invalid decision guidance, and API fallback; consecutive calls rotate; every relevance variant explicitly says the answer is unsaved and gives yes/no instructions.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/extract-flow.test.js`
Expected: FAIL because fixed repeated phrases remain.

- [ ] **Step 3: Implement deterministic rotation**

Add small fixed copy arrays and per-category indexes. Interpolate only escaped/plain text values and preserve safety meaning in every variant.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/extract-flow.test.js`
Expected: all tests pass.

### Task 5: Production verification

**Files:**
- Modify (generated): `public/chat.html`
- Modify (generated): `public/assets/js/interview-question-intent.js`
- Modify (generated): `public/assets/js/adam.js`

**Interfaces:**
- Consumes: verified source files from Tasks 1–4
- Produces: deployable static assets and server code with identical behavior

- [ ] **Step 1: Run the full suite**

Run: `npm test`
Expected: zero failures.

- [ ] **Step 2: Build production assets**

Run: `npm run build`
Expected: exit code 0 and generated browser files include the new classifier and client behavior.

- [ ] **Step 3: Run focused verification and diff validation**

Run: `node --test tests/interview-question-intent.test.js tests/openai.test.js tests/server.test.js tests/extract-flow.test.js tests/realtime-interviewer.test.js tests/static-multi-agent.test.js` followed by `git diff --check`
Expected: all focused tests pass and diff check has no output.

- [ ] **Step 4: Commit the verified implementation**

Stage only this feature’s design, plan, source, server, tests, and generated assets, then commit with focused messages.
