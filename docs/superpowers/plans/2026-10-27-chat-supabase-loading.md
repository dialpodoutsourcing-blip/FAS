# Chat Supabase Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide placeholder chat content until the correct persisted specialist conversation is ready.

**Architecture:** Ship an initially visible overlay in `chat.html`, style it within the existing workspace, and dismiss it from the existing `persistenceReady.finally` boundary.

**Tech Stack:** HTML, CSS, browser JavaScript, Node test runner

**Spec:** `docs/superpowers/specs/2026-10-27-chat-supabase-loading-design.md`

## Global Constraints

- The loader must exist before JavaScript executes.
- Global navigation remains available.
- Reduced-motion users see a static indicator.

## Review Focus

- Slow Supabase hydration never reveals placeholder messages.
- Local preview dismisses the loader normally.
- Recoverable initialization failure does not leave an infinite overlay.
- Overlay status is announced accessibly.
- Narrow/mobile chat remains covered without horizontal overflow.

---

### Task 1: Persistence loading overlay

**Files:**
- Modify: `chat.html`
- Modify: `assets/css/styles.css`
- Modify: `assets/js/adam.js`
- Test: `tests/static-multi-agent.test.js`
- Generated: corresponding files under `public/`

- [x] Add failing checks for initial overlay markup, progress styling, reduced motion, and persistence-bound dismissal.
- [x] Run the focused test and confirm failure.
- [x] Implement the overlay and dismissal helper.
- [x] Run the focused tests, production build, full suite, and diff validation.
- [x] Commit, merge, push, and verify Vercel deployment.
