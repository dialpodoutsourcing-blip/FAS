# Dashboard Micro-Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match the remaining sidebar, gauge, focus-panel, roadmap-card, and utility-rail details from the supplied close-up references without changing dashboard behavior.

**Architecture:** Extend the existing semantic dashboard with narrowly scoped CSS and inline SVG refinements. Reuse all current raster artwork and data hooks; browser geometry tests load real assets and protect every compact-layout boundary.

**Tech Stack:** HTML5, CSS, inline SVG, vanilla JavaScript, Node test runner, Playwright Core

**Spec:** `docs/superpowers/specs/2026-11-12-dashboard-micro-details-design.md`

## Global Constraints

- No new raster assets or changes to Supabase, authentication, routing, progression, persistence, or entitlements.
- Keep the full dashboard within 1508×782 and preserve safe scrolling above the compact breakpoint until the full layout fits.
- Preserve 1920×1080, tablet, and mobile layouts.
- Decorative layers remain non-interactive and hidden from assistive technology.
- Real card PNGs remain contained inside their artwork wrappers.

## Review Focus

- `01` and `02` must retain identical gauge alignment.
- Long account and business names must not cover settings or Sign Out.
- Completed, current, and locked states must retain their correct actions and destinations.
- Sidebar/footer decoration must not intercept account controls.
- Compact artwork, card actions, and utility flourishes must remain contained with real images loaded.

---

### Task 1: Add micro-detail regression coverage

**Files:**
- Modify: `tests/dashboard-geometry.test.js`
- Modify: `tests/static-branding.test.js`

**Interfaces:**
- Consumes: existing real-asset `withPage()` browser fixture and stable dashboard selectors.
- Produces: geometry and structure assertions for the final visual hooks.

- [ ] Add failing assertions at 1508×782 for gauge number/denominator baseline, unified footer containment, specialist action containment, card action clearance, and Keep Going flourish containment.
- [ ] Add failing static assertions for sidebar atmosphere, specialist action sub-elements, focus chevron/CTA arrow hooks, and decorative accessibility.
- [ ] Run `node --test tests/dashboard-geometry.test.js tests/static-branding.test.js` and confirm failures are caused by missing hooks/details.
- [ ] Commit with `test: define dashboard micro details`.

### Task 2: Implement the precision CSS/SVG pass

**Files:**
- Modify: `index.html`
- Modify: `assets/css/styles.css`
- Modify: `assets/js/dashboard.js` only if specialist action text requires separate dynamic nodes
- Modify generated build copies under `public/` via `npm run build`
- Test: `tests/dashboard-geometry.test.js`
- Test: `tests/static-branding.test.js`
- Test: `tests/dashboard-state.test.js`

**Interfaces:**
- Consumes: existing dashboard state/data attributes and Task 1 selectors.
- Produces: semantic sub-elements and CSS treatments for the eight approved micro-detail groups.

- [ ] Add only the minimal semantic SVG/wrapper hooks required by Task 1, preserving all current links and data attributes.
- [ ] Implement sidebar atmosphere, account/Sign Out grouping, secondary-nav surfaces, and two-line specialist actions.
- [ ] Refine gauge, focus CTA/status/chevron/rail, card borders/glows/pills/actions, Quick Access rows, and Keep Going flourish.
- [ ] Run focused geometry, static, and dashboard-state tests until green.
- [ ] Run `npm run build`, then repeat focused tests against synchronized public assets.
- [ ] Capture and inspect 1508×782 with real assets and the completed runtime state.
- [ ] Commit with `feat: polish dashboard micro details`.

### Task 3: Verify, review, and publish

**Files:**
- Verify all changed files.

**Interfaces:**
- Consumes: completed CSS/SVG detail pass.
- Produces: reviewed and deployed production revision.

- [ ] Run `git diff --check && npm run build && npm test`; require zero failures, allowing only the optional live-Supabase skip.
- [ ] Request a fresh whole-branch review against the spec, review-focus list, real-asset geometry, accessibility, and runtime state behavior.
- [ ] Address all Critical/Important findings in one red-to-green fix pass and rerun the full suite.
- [ ] Merge to `main`, verify the merged suite, push, deploy to production, and verify READY plus live CSS.
