# Chat Bottom Composer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Quick Suggestions and the composer at the bottom of the chat workspace regardless of conversation length.

**Architecture:** Correct the top-level chat shell grid so its three in-flow children consume the full viewport. Preserve the existing nested grid that gives the conversation flexible scroll space above the fixed input rows.

**Tech Stack:** HTML, CSS Grid, Node test runner, Playwright geometry checks

**Spec:** `docs/superpowers/specs/2026-11-12-chat-bottom-composer-design.md`

## Global Constraints

- Preserve one-screen desktop and responsive mobile behavior.
- Do not position the composer absolutely or with JavaScript.
- Do not alter the propagation gate.

## Review Focus

- Empty or one-message conversation: composer bottom aligns with the workspace bottom.
- Long conversation: thread scrolls while composer remains visible.
- Desktop short viewport: composer stays within workspace bounds.
- Mobile portrait: composer remains reachable without horizontal overflow.
- Optional review action: it remains below the composer without creating unused workspace space.

---

### Task 1: Correct the chat shell row geometry

**Files:**
- Modify: `assets/css/styles.css`
- Generated: `public/assets/css/styles.css`
- Test: `tests/chat-geometry.test.js`

**Interfaces:**
- Consumes: `.chat-shell`, `.chat-shell__workspace`, `.chat-primary`, and `.thread` layout rules.
- Produces: a three-row shell whose workspace fills the remaining viewport.

- [ ] **Step 1: Add a failing geometry test**

Assert at desktop and mobile sizes that the workspace reaches the shell bottom and that the bottom action row ends within one pixel of the workspace bottom for a one-message conversation.

- [ ] **Step 2: Run the focused test and confirm the bottom-alignment assertion fails**

Run: `node --test tests/chat-geometry.test.js`

- [ ] **Step 3: Change `.chat-shell` to `grid-template-rows: auto auto minmax(0, 1fr)`**

Retain all nested panel grid and overflow rules.

- [ ] **Step 4: Build generated browser assets and rerun focused tests**

Run: `npm run build && node --test tests/chat-geometry.test.js tests/static-multi-agent.test.js`

- [ ] **Step 5: Run the full suite and commit**

Run: `npm test`

Commit: `fix: keep chat composer aligned to bottom`

