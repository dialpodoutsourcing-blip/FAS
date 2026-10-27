# Chat Retry Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restart the current specialist safely from an always-visible control or a natural Type/Talk command.

**Architecture:** Add one retry intent classifier and confirmation state in `adam.js`. All entry points navigate through the existing `restart=1` route, which performs the current-agent-scoped store reset.

**Tech Stack:** Browser JavaScript, HTML, Node test runner

**Spec:** `docs/superpowers/specs/2026-10-27-chat-retry-command-design.md`

## Global Constraints

- Confirmation is required before reset.
- Reset only the current specialist.
- Preserve project/session routing and unrelated specialist work.

## Review Focus

- A retry phrase is never saved as an interview answer.
- A negative confirmation never changes storage or navigation.
- A positive confirmation preserves project/session query parameters.
- Retry remains available before completion.
- Talk speaks the confirmation and Type renders it visibly.

---

### Task 1: Unified retry intent and confirmation

**Files:**
- Create: `assets/js/retry-intent.js`
- Modify: `chat.html`
- Modify: `assets/js/adam.js`
- Test: `tests/retry-intent.test.js`
- Test: `tests/extract-flow.test.js`
- Test: `tests/static-multi-agent.test.js`
- Generated: `public/chat.html`, `public/assets/js/adam.js`

- [x] Add failing tests for retry phrase classification and confirmation classification, plus static checks for the visible control and scoped restart integration.
- [x] Run focused tests and confirm failure against the old behavior.
- [x] Implement the shared retry confirmation and restart helpers.
- [x] Run focused tests, production build, full suite, and diff validation.
- [x] Commit, merge, push, and verify deployment.
