# Premium Chat Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the FAS interview chat presentation to match the supplied premium black/gold/teal reference while preserving all current interview behavior.

**Architecture:** Retain the existing controller-facing `data-*` hooks and restructure only the chat shell presentation. Add page-scoped CSS for the reference geometry and use real-browser geometry tests to protect the one-screen layout and responsive behavior.

**Tech Stack:** Static HTML, CSS, native SVG, vanilla JavaScript, Node test runner, Playwright/Chromium geometry checks.

**Spec:** `docs/superpowers/specs/2026-11-12-premium-chat-reference-design.md`

## Global Constraints

- Preserve Type, Talk, persistence, authentication, completion, and drawer behavior.
- Preserve all controller-consumed `data-*` hooks.
- Desktop at 1680×945 must not require document scrolling; the thread may scroll internally.
- Unsupported attachment, browsing, and tools actions must not appear functional.
- Leave `anchor-window-test.png` untouched.

## Review Focus

- Long customer and agent text must wrap without pushing controls outside the viewport; covered by Task 2 geometry tests.
- A populated conversation must scroll inside the thread, not the document; covered by Task 2 geometry tests.
- Type/Talk and save/exit controls must remain keyboard accessible; covered by Task 1 structure tests.
- Mobile width must have no horizontal overflow and must expose the existing menu; covered by Task 3 geometry tests.
- Reduced-motion users must not receive decorative animation; covered by Task 3 stylesheet behavior test.

---

### Task 1: Reference shell and semantic hierarchy

**Files:**
- Modify: `chat.html`
- Modify: `tests/static-multi-agent.test.js`

**Interfaces:**
- Consumes: Existing controller selectors in `assets/js/adam.js` and shared navigation hooks.
- Produces: Reference-aligned shell regions with unchanged behavior hooks for styling in Task 2.

- [ ] **Step 1: Write the failing structure test**

Add a test that loads the real `chat.html` DOM and asserts one accessible identity toolbar, Type/Talk tablist, stage navigation, conversation, Quick Suggestions region backed by `data-agent-hints`, composer, save/exit action, and completion action. Assert all existing controller hooks remain unique.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --test-name-pattern="premium chat shell" tests/static-multi-agent.test.js`
Expected: FAIL because the Quick Suggestions hierarchy and reference shell regions do not exist.

- [ ] **Step 3: Implement the reference shell in `chat.html`**

Reorder and label existing regions to match the screenshot. Reuse every live behavior hook; convert existing hints into the Quick Suggestions strip; retain working utility drawer actions in a compact overflow group; do not add fake interactive controls.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/static-multi-agent.test.js tests/extract-flow.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add chat.html tests/static-multi-agent.test.js
git commit -m "feat: restructure premium chat shell"
```

### Task 2: Desktop glass, gold-sharp styling, and one-screen geometry

**Files:**
- Modify: `assets/css/styles.css`
- Create: `tests/chat-geometry.test.js`

**Interfaces:**
- Consumes: Task 1 shell classes and existing sidebar primitives.
- Produces: Page-scoped premium desktop composition at 1680×945 and 1508×782.

- [ ] **Step 1: Write failing browser geometry tests**

Render the real built chat page with authentication/loading visibility neutralized. Assert `scrollHeight <= innerHeight + 1`, no horizontal overflow, sidebar width and fixed height match the reference proportions, toolbar/stages/composer are visible, the thread owns overflow, agent messages align left, and user messages align right. Add a long-name fixture and verify controls remain within viewport bounds.

- [ ] **Step 2: Run the geometry test and verify RED**

Run: `node --test tests/chat-geometry.test.js`
Expected: FAIL on reference dimensions/alignment and glass treatment selectors.

- [ ] **Step 3: Implement page-scoped desktop styling**

Add `.chat-page` rules for the black atmospheric background, sharp gold/teal arcs, glass toolbar/stages/bubbles, reference sidebar spacing, identity medallion, mode switch, stage rail, message widths, suggestion bar, gold composer outline, internal thread scrolling, and restrained glow. Preserve focus-visible states and contrast.

- [ ] **Step 4: Run focused geometry and static tests**

Run: `node --test tests/chat-geometry.test.js tests/static-sidebar.test.js tests/static-branding.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/css/styles.css tests/chat-geometry.test.js
git commit -m "feat: add premium glass chat styling"
```

### Task 3: Responsive adaptation, production build, and regression verification

**Files:**
- Modify: `assets/css/styles.css`
- Modify: `tests/chat-geometry.test.js`
- Modify: `public/chat.html` (generated)
- Modify: `public/assets/css/styles.css` (generated)

**Interfaces:**
- Consumes: Tasks 1–2 complete chat shell.
- Produces: Responsive, built production artifacts ready for deployment.

- [ ] **Step 1: Add failing responsive and reduced-motion tests**

At 1024×768, 768×1024, and 390×844 assert no horizontal overflow, reachable composer, accessible mobile menu, internal conversation scrolling, and no clipped save action. With reduced motion enabled, assert animated decorative elements report no running animation.

- [ ] **Step 2: Run the new test cases and verify RED**

Run: `node --test tests/chat-geometry.test.js`
Expected: FAIL at one or more responsive/reduced-motion assertions before new breakpoint rules.

- [ ] **Step 3: Implement responsive and reduced-motion rules**

Refine existing breakpoints so the sidebar becomes the established drawer, stages simplify without losing progress meaning, message cards and composer remain reachable, and decorative motion is disabled under `prefers-reduced-motion`.

- [ ] **Step 4: Build and run the entire suite**

Run: `npm run build && npm test`
Expected: 0 failures; only the established live Supabase test may skip.

- [ ] **Step 5: Commit generated production assets**

```bash
git add assets/css/styles.css tests/chat-geometry.test.js public/chat.html public/assets/css/styles.css
git commit -m "fix: harden responsive premium chat"
```

