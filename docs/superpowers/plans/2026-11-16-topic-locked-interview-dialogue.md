# Topic-Locked Interview Dialogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users converse indefinitely about the active interview question while saving and advancing only on a substantive accepted answer.

**Architecture:** A protected structured-output endpoint classifies each ordinary turn as discussion or answer candidate within the exact current question. The client maintains rolling question-local dialogue, speaks discussion responses, and preserves the existing validation, relevance, coordinator, and durable-save path for answer candidates.

**Tech Stack:** Browser JavaScript, Express, OpenAI Responses API structured output, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-16-topic-locked-interview-dialogue-design.md`

## Global Constraints

- Controls and confirmations route before semantic dialogue.
- Discussion never invokes durable submission or advances the engine.
- The canonical current question is included in every semantic request.
- Question-local history is rolling and bounded while turn count remains unlimited.
- Talk remains hands-free and returns to listening after ADAM speaks.

## Review Focus

- A second follow-up statement without a question mark must remain discussion.
- A direct substantive answer after several discussion turns must reach the existing save gate.
- A question change must prevent earlier topic dialogue leaking into the next question.
- Endpoint failure must save nothing and keep the canonical question active.
- Prompt injection inside dialogue history must not change routing or scope.

---

### Task 1: Structured Topic-Locked Turn Endpoint

**Files:**
- Modify: `server.js`
- Test: `tests/narration-server.test.js`

**Interfaces:**
- Produces: `POST /api/interview-turn-response` accepting `{agent,message,currentQuestion,history}` and returning `{kind,message}`

- [ ] Add failing endpoint/helper tests for discussion, answer candidate, bounded history, invalid input, upstream failure, and strict prompt scope.
- [ ] Run `node --test tests/narration-server.test.js` and confirm expected failures.
- [ ] Implement normalization, strict JSON schema payload, response validation, authorization, and sanitized errors.
- [ ] Run the endpoint tests and confirm they pass.
- [ ] Commit.

### Task 2: Persistent Question-Local Client Dialogue

**Files:**
- Modify: `assets/js/adam.js`
- Modify: `chat.html`
- Test: `tests/extract-flow.test.js`
- Test: `tests/static-multi-agent.test.js`

**Interfaces:**
- Consumes: `/api/interview-turn-response` from Task 1
- Produces: ordinary turn routing that either continues discussion or invokes the existing answer path

- [ ] Add failing tests for second/later follow-ups, answer-candidate handoff, question identity reset, Talk speech, Type rendering, failure fallback, and no submission during discussion.
- [ ] Run focused tests and confirm expected failures.
- [ ] Add question-local state and a shared Talk/Type semantic routing helper; retain control priority and existing answer gates.
- [ ] Remove the narrow question classifier from primary routing while preserving compatibility only if still referenced elsewhere.
- [ ] Run focused tests and confirm they pass.
- [ ] Commit.

### Task 3: Build and Regression Verification

**Files:**
- Generated: `public/assets/js/adam.js`
- Generated: `public/chat.html`
- Generated: other `public/` assets copied by the existing build

**Interfaces:**
- Consumes: Tasks 1 and 2
- Produces: deployable source/public parity

- [ ] Run `npm run build`.
- [ ] Run endpoint, Talk/Type flow, Realtime, and static focused tests.
- [ ] Run `npm test` and require zero failures.
- [ ] Run `git diff --check` and inspect the complete branch diff.
- [ ] Commit generated assets and verification adjustments.
