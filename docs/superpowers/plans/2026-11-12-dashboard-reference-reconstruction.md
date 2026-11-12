# Dashboard Reference Reconstruction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruct the authenticated Dashboard to closely match the supplied black/gold/emerald reference while preserving live FAS account, progress, access, and routing behavior.

**Architecture:** Replace only the `index.html` dashboard/sidebar composition with a reference-matched semantic shell and scope the new visual system under `body[data-page="home"]`. Extend the existing `dashboard.js` render boundary to populate the new active-step banner and roadmap state from the current project/access data; keep auth, progression, navigation, and APIs unchanged.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, existing SVG emblem system, CSS gradients/pseudo-elements, CommonJS-compatible dashboard state module, Node.js test runner

**Spec:** `docs/superpowers/specs/2026-11-12-dashboard-reference-reconstruction-design.md`

## Global Constraints

- Match the reference hierarchy and premium black/gold/emerald visual system without shipping the screenshot as a background.
- Keep account name/business, specialist availability, completion state, active step, progress, and routes dynamic.
- Do not hard-code reference identity, counts, or specialist state.
- Do not change authentication, project persistence, entitlements, interview logic, or API contracts.
- Scope the reconstruction to the Dashboard; other pages must retain their current UI.
- Preserve keyboard access, visible focus, contrast, reduced motion, and mobile drawer behavior.
- No new runtime dependency.

## Review Focus

- Very long display names/business names must wrap or clamp without covering system controls.
- New, partial, Anchor-complete, and all-complete projects must show truthful banner/card states and routes.
- Entitlement changes beyond two specialists must not create hard-coded progress or broken navigation.
- Widths around the sidebar/tablet breakpoints must not produce horizontal overflow or clipped actions.
- Decorative glows and motion must remain non-interactive and honor reduced-motion preferences.

---

### Task 1: Reference-matched semantic dashboard shell

**Files:**
- Modify: `index.html`
- Modify: `tests/static-multi-agent.test.js`
- Modify: `tests/static-branding.test.js`

**Interfaces:**
- Produces: semantic regions/classes for `.home-hero`, `.home-focus`, `.home-roadmap`, `.home-utility`, `.home-quick`, and two live roadmap cards retaining existing `data-agent-link` hooks.
- Consumes: existing auth/account hooks, navigation hooks, tutorial trigger, SVG emblems, and progression attributes.

- [ ] **Step 1: Write failing structural tests**

Assert the reference hierarchy, live account hooks, quick-access routes, active-step data hooks, two included specialist cards, entitlement-preserving hidden specialist links, no hard-coded reference identity, and unchanged script order.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/static-multi-agent.test.js tests/static-branding.test.js`
Expected: FAIL because the new dashboard regions do not exist.

- [ ] **Step 3: Rebuild the `index.html` dashboard composition**

Keep the shared SVG definitions and protected script dependencies. Replace the sidebar/home main markup with the approved reference hierarchy and semantic live-data hooks.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test tests/static-multi-agent.test.js tests/static-branding.test.js`
Expected: both static suites pass.

- [ ] **Step 5: Commit**

Commit: `feat: reconstruct dashboard shell`

### Task 2: Live banner and roadmap state

**Files:**
- Modify: `assets/js/dashboard.js`
- Modify: `tests/dashboard-state.test.js`
- Modify: `tests/review-fixes.test.js`

**Interfaces:**
- Consumes: existing `derive(project, access)` state plus new dashboard hooks from Task 1.
- Produces: truthful active-step banner, progress percentage/count, main action, and per-card `complete|current|locked` state/labels/routes for every allowed specialist.

- [ ] **Step 1: Write failing state/render tests**

Cover new, partial, Anchor-complete, all-complete, future multi-entitlement, missing-context, and long-label cases. Assert exact routes and status classes/labels for banner and cards.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/dashboard-state.test.js tests/review-fixes.test.js`
Expected: FAIL because the card-state/render interface is absent.

- [ ] **Step 3: Extend dashboard state/rendering**

Add a focused per-agent card-state projection and populate the new hooks without duplicating progression/auth logic. Keep existing exported `derive` behavior backward compatible.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test tests/dashboard-state.test.js tests/review-fixes.test.js`
Expected: all dashboard/controller tests pass.

- [ ] **Step 5: Commit**

Commit: `feat: bind live dashboard progress`

### Task 3: Reference visual system, responsive behavior, and deployment mirrors

**Files:**
- Modify: `assets/css/styles.css`
- Modify: `tests/static-branding.test.js`
- Modify: `tests/static-multi-agent.test.js`
- Modify through build: `public/index.html`, `public/assets/js/dashboard.js`, `public/assets/css/styles.css`

**Interfaces:**
- Consumes: Task 1 regions and Task 2 state classes/data hooks.
- Produces: scoped wide/medium/mobile dashboard layouts with glass panels, gold/emerald lighting, roadmap art, overflow protection, focus/reduced-motion behavior, and source/public parity.

- [ ] **Step 1: Write failing visual/responsive tests**

Assert dashboard-scoped glass/lighting selectors, active navigation treatment, banner/roadmap/utility grids, gold and emerald specialist variants, long-name wrapping, 1280px and 900px transitions, mobile stacking/drawer compatibility, overflow protection, and reduced-motion overrides.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/static-branding.test.js tests/static-multi-agent.test.js`
Expected: FAIL because the reconstructed visual system is absent.

- [ ] **Step 3: Implement the scoped dashboard visual system**

Use CSS/SVG gradients, pseudo-elements, and existing emblems to reproduce the reference. Keep decorative layers pointer-free and constrain all long text/flex children.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/static-branding.test.js tests/static-multi-agent.test.js`
Expected: both suites pass.

- [ ] **Step 5: Build deployable mirrors**

Run: `npm run build`
Expected: `Prepared FAS browser files in public/.`

- [ ] **Step 6: Run full verification and inspect scope**

Run: `npm test && git diff --check && git status --short && git diff --stat`
Expected: zero failures; optional live Supabase test may remain skipped; only approved dashboard/spec/plan/test/public files changed.

- [ ] **Step 7: Commit**

Commit: `build: publish reconstructed dashboard assets`
