# Interactive Product Tutorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone, safe, interactive FAS product tutorial that simulates navigating Dashboard, ADAM, Vault, and Launch Plan without leaving or modifying the current page.

**Architecture:** A new plain-JavaScript tutorial module owns an immutable step registry, a small state engine, and a lazy-created modal UI. The central demo canvas renders purpose-built simulated product views; it never clones the live page or invokes production handlers. Shared trigger markup and one shared stylesheet section make the feature consistent across all five pages.

**Tech Stack:** Static HTML5, shared CSS, vanilla JavaScript IIFE/CommonJS-compatible state exports, Node.js `assert` tests.

**Spec:** `docs/superpowers/specs/2026-10-17-interactive-product-tutorial-design.md`

## Global Constraints

- The browser URL and current page must never change while the tutorial is open.
- The tutorial must not submit forms, modify saved work, record audio, download files, or call production page actions.
- The tutorial must be one-screen and non-scrolling at normal desktop sizes; only its description region may scroll on unusually short viewports.
- Use the existing black, ivory, and gold FAS design language and `tour-` prefixed selectors.
- Preserve the existing 252px shared sidebar dimensions and all current agent behavior.
- Reopening the tutorial starts at the welcome step; progress is not persisted.
- Support Escape, Left/Right arrows, focus trapping/restoration, semantic dialog labeling, and reduced motion.
- This workspace is not currently a Git worktree. Replace each commit step with a named verification checkpoint unless Git is initialized before execution.

## Review Focus

- Multiple rapid Next or target clicks must advance exactly one step per activation; Task 1 tests index clamping and Task 3 tests one bound target handler.
- A missing simulated target must leave the tutorial closable and navigable; Task 3 tests fallback rendering without a target.
- Opening from any of the five pages must preserve that page and restore focus to its trigger; Task 2 tests location stability and focus return.
- Escape or Skip after a simulated interaction must restore body scrolling and underlying-page accessibility state; Task 2 tests every close path through the same cleanup method.
- Short and reduced-motion viewports must remain usable without underlying-page scrolling or mandatory animation; Task 4 tests the required responsive and media-query rules.

---

### Task 1: Tutorial Registry and State Engine

**Files:**
- Create: `assets/js/tutorial.js`
- Create: `tests/tutorial-state.test.js`

**Interfaces:**
- Consumes: No product runtime dependencies; `steps` is an ordered array of frozen step records.
- Produces: `createTourState(steps)` with `current()`, `index()`, `next()`, `back()`, `goTo(index)`, `reset()`, `isFirst()`, and `isLast()`; `TOUR_STEPS`; browser namespace `window.FAS.tutorial` reserved for the controller in Task 2; CommonJS exports `{ createTourState, TOUR_STEPS }` for Node tests.

- [ ] **Step 1: Write the failing state-engine tests**

In `tests/tutorial-state.test.js`, assert that:

- `TOUR_STEPS` contains the four chapters `dashboard`, `adam`, `vault`, and `launch` in that order.
- Required target topics exist: main navigation, specialists, resume, account/settings, agent identity, stages, Type/Talk, conversation, composer, hints, saved work, trust, assets, edit, PDF download, readiness, timeline, owners, and finish.
- Every record has a unique `id`, `chapter`, `title`, `label`, `description`, `view`, `target`, and `arrow`.
- A new state begins at index `0`; `next()` and `back()` move one step; both ends clamp; `goTo()` rejects non-finite values and clamps integers; `reset()` returns to zero.
- Registry arrays and records are frozen.

- [ ] **Step 2: Run the state tests and verify RED**

Run: `node tests\tutorial-state.test.js`

Expected: FAIL because `assets/js/tutorial.js` does not exist.

- [ ] **Step 3: Implement the immutable registry and state engine**

Create `assets/js/tutorial.js` as an IIFE that accepts `window` when present, defines the 21-step registry from the approved spec, deep-freezes each step and the array, and exposes the exact Task 1 interfaces. Keep all state private to each `createTourState()` instance.

- [ ] **Step 4: Run the state tests and verify GREEN**

Run: `node tests\tutorial-state.test.js`

Expected: `Tutorial state checks passed.` and exit code 0.

- [ ] **Step 5: Record verification checkpoint**

Record `Task 1 — tutorial registry/state green` in the execution notes. If Git has been initialized, commit `tutorial.js` and its test as `feat: add tutorial state engine`.

### Task 2: Shared Entry Point and Accessible Modal Lifecycle

**Files:**
- Modify: `index.html` sidebar and scripts
- Modify: `chat.html` sidebar and scripts
- Modify: `review.html` sidebar and scripts
- Modify: `vault.html` sidebar and scripts
- Modify: `launch.html` sidebar and scripts
- Modify: `assets/js/tutorial.js`
- Modify: `assets/css/styles.css`
- Create: `tests/static-tutorial.test.js`
- Modify: `tests/static-sidebar.test.js`

**Interfaces:**
- Consumes: `createTourState(TOUR_STEPS)` from Task 1 and elements matching `[data-tutorial-trigger]`.
- Produces: `window.FAS.tutorial.open(trigger)`, `.close(reason)`, `.next()`, `.back()`, `.current()`; lazy-created `[data-tour-dialog]`; shared trigger immediately following Dashboard.

- [ ] **Step 1: Write failing shared-markup tests**

In `tests/static-tutorial.test.js`, read all five HTML pages and assert each has exactly one `[data-tutorial-trigger]` directly after the Dashboard link, text `Help me / Demo`, a help/compass SVG with `aria-hidden="true"`, and one `assets/js/tutorial.js` script after `nav.js`. Update `tests/static-sidebar.test.js` to expect five main navigation SVG icons rather than four.

- [ ] **Step 2: Run the markup tests and verify RED**

Run: `node tests\static-tutorial.test.js; node tests\static-sidebar.test.js`

Expected: FAIL because the trigger and tutorial script are absent.

- [ ] **Step 3: Add the identical trigger and script to all pages**

Place a button-styled `.nav-link` trigger directly after Dashboard while preserving the compact shared sidebar. Load `tutorial.js` after `nav.js` on every page.

- [ ] **Step 4: Add failing lifecycle/source-contract tests**

Extend `tests/static-tutorial.test.js` to assert source contracts for:

- lazy dialog creation with `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `aria-describedby`;
- one shared `cleanupAndRestore()` close path used by Skip, Finish, close button, and Escape;
- saved activating trigger and `.focus()` restoration;
- body class `tour-open`, underlying `.app` inert/aria-hidden state, and restoration;
- location is never assigned and no simulated element uses `href`, `download`, `submit`, media APIs, or production data-action attributes;
- focus trap handles Tab and Shift+Tab.

- [ ] **Step 5: Run the lifecycle tests and verify RED**

Run: `node tests\static-tutorial.test.js`

Expected: FAIL on missing dialog/controller contracts.

- [ ] **Step 6: Implement the modal controller and base shell**

Implement `open(trigger)`, `close(reason)`, `next()`, `back()`, `current()`, lazy `createShell()`, keyboard handling, focus trapping, scroll locking, inert/aria-hidden application, and shared cleanup. Add only the structural CSS needed for a hidden/fixed overlay, dialog, chapter rail, canvas slot, description slot, and controls.

- [ ] **Step 7: Run Task 1, tutorial, and sidebar tests**

Run: `node tests\tutorial-state.test.js; node tests\static-tutorial.test.js; node tests\static-sidebar.test.js`

Expected: all three commands exit 0.

- [ ] **Step 8: Record verification checkpoint**

Record `Task 2 — shared trigger and modal lifecycle green`. If Git is available, commit as `feat: add accessible tutorial shell`.

### Task 3: Simulated Views, Spotlight, and Safe Interactions

**Files:**
- Modify: `assets/js/tutorial.js`
- Modify: `assets/css/styles.css`
- Modify: `tests/static-tutorial.test.js`
- Modify: `tests/tutorial-state.test.js`

**Interfaces:**
- Consumes: current step records and controller lifecycle from Tasks 1–2.
- Produces: `renderView(viewName)`, `renderStep(step)`, `positionPointer(target, placement)`, and tutorial-only action handlers `switchInputMode`, `fillSampleAnswer`, `toggleDemoPanel`, and `selectDemoAsset`.

- [ ] **Step 1: Write failing simulation tests**

Extend the tests to assert:

- each registry `view` has one renderer for `dashboard`, `adam`, `vault`, or `launch`;
- each target selector is represented in its simulated view;
- safe actions are restricted to the four tutorial-only action names;
- target activation calls the controller's single advance method and is debounced until the next render;
- `renderStep()` still updates title, description, progress, Back/Next state, and allows closing when a target lookup returns null;
- final-step Next label is `Finish tutorial` and closes through the shared cleanup path.

- [ ] **Step 2: Run simulation tests and verify RED**

Run: `node tests\tutorial-state.test.js; node tests\static-tutorial.test.js`

Expected: FAIL because simulated views and target behavior are missing.

- [ ] **Step 3: Implement the four semantic simulated views**

Build compact, inert demo representations of the sidebar/Dashboard, ADAM header and workspace, Vault assets, and Launch Plan. Use buttons for simulated controls, `data-demo-target` for targets, and `data-demo-action` only for the four whitelisted actions. Never copy IDs or production handler attributes from the live interface.

- [ ] **Step 4: Implement step rendering and safe interactions**

Render the correct view, chapter states, copy, `Step N of 21`, button states, spotlight class, and pointer placement. Simulated actions alter only nodes inside `[data-tour-dialog]`, then advance exactly once. Missing targets suppress the pointer but preserve copy and navigation.

- [ ] **Step 5: Add the premium visual treatment**

Add `tour-` prefixed styles for the black-and-gold tiled backdrop, chapter rail, premium framed canvas, simulated interface, spotlight halo, animated pointer, explanation card, and control hierarchy. Ensure the arrow never intercepts pointer input.

- [ ] **Step 6: Run simulation tests and verify GREEN**

Run: `node tests\tutorial-state.test.js; node tests\static-tutorial.test.js`

Expected: both commands exit 0.

- [ ] **Step 7: Record verification checkpoint**

Record `Task 3 — safe interactive simulation green`. If Git is available, commit as `feat: add interactive tutorial simulation`.

### Task 4: Responsive Accessibility and Full Regression Verification

**Files:**
- Modify: `assets/css/styles.css`
- Modify: `assets/js/tutorial.js`
- Modify: `tests/static-tutorial.test.js`

**Interfaces:**
- Consumes: complete tutorial controller and simulated UI from Tasks 1–3.
- Produces: viewport-aware pointer recalculation, narrow-screen layout, short-screen description scrolling, reduced-motion behavior, and final accessible announcements.

- [ ] **Step 1: Write failing accessibility and responsive tests**

Extend `tests/static-tutorial.test.js` to assert:

- resize schedules `positionPointer()` recalculation;
- progress status includes `aria-live="polite"` and active chapter has `aria-current="step"`;
- icon-only Close has an accessible name;
- CSS includes `@media (max-width: 900px)`, a short-height query, and `@media (prefers-reduced-motion: reduce)`;
- `.tour-open` prevents underlying body scrolling;
- only `.tour-copy` becomes vertically scrollable in the short-height rule;
- pointer/halo animation is disabled under reduced motion;
- the existing 252px sidebar token and compact row sizes remain unchanged.

- [ ] **Step 2: Run the accessibility tests and verify RED**

Run: `node tests\static-tutorial.test.js`

Expected: FAIL on missing responsive/reduced-motion contracts.

- [ ] **Step 3: Implement responsive and accessibility completion**

Add the exact media behavior above, debounced resize repositioning, polite step announcements, current-chapter semantics, and accessible icon labels. Ensure event listeners added on open are removed on close or installed once for the module lifetime.

- [ ] **Step 4: Run focused tutorial tests**

Run: `node tests\tutorial-state.test.js; node tests\static-tutorial.test.js`

Expected: both pass with clean output.

- [ ] **Step 5: Run all JavaScript syntax checks**

Run: `node --check assets\js\nav.js; node --check assets\js\agents.js; node --check assets\js\adam.js; node --check assets\js\tutorial.js`

Expected: exit code 0 and no output.

- [ ] **Step 6: Run the complete static regression suite**

Run: `node tests\static-sidebar.test.js; node tests\static-vault-demo.test.js; node tests\static-multi-agent.test.js; node tests\agents.test.js; node tests\static-branding.test.js; node tests\tutorial-state.test.js; node tests\static-tutorial.test.js`

Expected: every command exits 0 with no assertion failures.

- [ ] **Step 7: Perform the final requirement audit**

Check each success criterion in the design spec against a passing assertion or direct browser observation. Specifically verify that opening and finishing the tutorial on each page leaves its URL and visible product state unchanged.

- [ ] **Step 8: Record final verification checkpoint**

Record `Task 4 — full tutorial and regression suite green`. If Git is available, commit as `feat: complete interactive FAS product tour`.

