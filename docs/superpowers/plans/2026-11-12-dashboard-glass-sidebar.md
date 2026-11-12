# Dashboard Glass Cards and Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reproduce the supplied smoked-glass roadmap cards and compact atmospheric sidebar with native HTML, CSS, and SVG while preserving dashboard behavior and one-screen geometry.

**Architecture:** Keep the existing dashboard structure and state model, add stable semantic hooks for decorative glass layers and sidebar subtitles, and render all atmosphere with contained CSS/SVG layers. State remains in `assets/js/dashboard.js`; appearance remains in the existing shared stylesheet and generated `public/` output.

**Tech Stack:** HTML5, CSS gradients/pseudo-elements/filter effects, inline SVG, vanilla JavaScript, Node test runner, Playwright geometry checks.

**Spec:** `docs/superpowers/specs/2026-11-12-dashboard-glass-sidebar-design.md`

## Global Constraints

- Native HTML, CSS, and SVG only; no new raster smoke texture, framework, or canvas.
- Preserve specialist state, authentication, navigation destinations, and account data.
- Preserve the 1508×782 one-screen composition and responsive fallbacks.
- Decorative layers remain clipped, inaccessible, and non-interactive.
- Sidebar specialist rows use descriptive subtitles and chevrons rather than `Review` or `Locked` labels.

## Review Focus

- A completed versus locked specialist must keep the correct destination and ARIA state after its visible sidebar action becomes a neutral chevron.
- Long account names and businesses must remain contained inside the unified footer shell at compact desktop height.
- Glass haze and flare layers must not produce document overflow at 1508×782 or narrower responsive sizes.
- Locked card text must retain readable contrast even though its state styling is subdued.
- Reduced-motion users must receive the same static glass composition without dependent animation.

---

### Task 1: Define Glass and Sidebar Contracts

**Files:**
- Modify: `tests/static-branding.test.js`
- Modify: `tests/dashboard-geometry.test.js`
- Modify: `tests/dashboard-state.test.js`

**Interfaces:**
- Consumes: existing dashboard DOM and `Dashboard.render(state, document, context)`.
- Produces: failing contracts for semantic decorative hooks, subtitle/chevron preservation, containment, contrast, and one-screen geometry.

- [ ] **Step 1: Write failing static and state tests**

Require card haze hooks with `aria-hidden="true"`, sidebar specialist subtitle and chevron hooks, and renderer behavior that updates navigation state without replacing subtitle/chevron structure.

- [ ] **Step 2: Extend the 1508×782 geometry test**

Assert all decorative card/sidebar layers are contained by their owners, footer content stays within the viewport with long identity copy, and cards retain readable computed contrast and no overflow.

- [ ] **Step 3: Run focused tests to verify RED**

Run: `node --test tests/static-branding.test.js tests/dashboard-state.test.js tests/dashboard-geometry.test.js`
Expected: FAIL because the new semantic hooks and subtitle-preserving renderer do not exist.

- [ ] **Step 4: Commit the contracts**

```bash
git add tests/static-branding.test.js tests/dashboard-state.test.js tests/dashboard-geometry.test.js
git commit -m "test: define dashboard glass fidelity"
```

### Task 2: Build the Reference Sidebar and Glass Cards

**Files:**
- Modify: `index.html`
- Modify: `assets/js/dashboard.js`
- Modify: `assets/css/styles.css`
- Generated: `public/index.html`
- Generated: `public/assets/js/dashboard.js`
- Generated: `public/assets/css/styles.css`
- Test: `tests/static-branding.test.js`
- Test: `tests/dashboard-state.test.js`
- Test: `tests/dashboard-geometry.test.js`

**Interfaces:**
- Consumes: Task 1 hook names and renderer contracts.
- Produces: stable `.home-roadmap-card__haze`, `.step-link__subtitle`, and `.step-link__chevron` DOM hooks plus contained glass/sidebar styling.

- [ ] **Step 1: Add minimal semantic markup**

Add inaccessible haze elements to each roadmap card. Change the two visible specialist rows to title/subtitle/chevron markup matching the supplied reference while retaining their existing data attributes and destinations.

- [ ] **Step 2: Preserve sidebar structure in `renderSidebarCard`**

Update classes, href, and `aria-disabled` only; keep descriptive subtitle and chevron content stable for all live states, including test-document fallbacks.

- [ ] **Step 3: Implement sidebar reference styling**

Match the narrow dark-glass sidebar, compact brand and navigation spacing, illuminated active row, quiet secondary surfaces, specialist typography/chevrons, lower gold/teal curves, and unified account/sign-out shell. Keep the existing responsive/mobile sidebar behavior.

- [ ] **Step 4: Implement card glass styling**

Use clipped haze, radial light, edge reflections, shared geometry, and gold/emerald custom properties to match the supplied card reference. Preserve card copy, real status pills, and real action destinations.

- [ ] **Step 5: Run focused tests to verify GREEN**

Run: `node --test tests/static-branding.test.js tests/dashboard-state.test.js tests/dashboard-geometry.test.js`
Expected: all focused tests pass.

- [ ] **Step 6: Generate production assets**

Run: `npm run build`
Expected: `public/` mirrors the source dashboard files.

- [ ] **Step 7: Commit the implementation**

```bash
git add index.html assets/js/dashboard.js assets/css/styles.css public/index.html public/assets/js/dashboard.js public/assets/css/styles.css
git commit -m "feat: match dashboard glass reference"
```

### Task 3: Visual and Release Verification

**Files:**
- Verify: `index.html`
- Verify: `assets/css/styles.css`
- Verify: `public/`

**Interfaces:**
- Consumes: Task 2 production-ready source and build output.
- Produces: evidence that the reference styling fits, behaves, and ships safely.

- [ ] **Step 1: Capture and inspect the 1508×782 dashboard**

Render the actual source with scripts disabled only for authentication, inspect the full viewport, and correct any mismatch in glass depth, localized lighting, sidebar hierarchy, or clipping through a new RED/GREEN test cycle.

- [ ] **Step 2: Run the full suite**

Run: `npm test`
Expected: 0 failures; the configured live Supabase test may remain skipped.

- [ ] **Step 3: Verify build and diff hygiene**

Run: `npm run build` and `git diff --check`
Expected: build succeeds, generated assets match source, and no whitespace errors exist.

- [ ] **Step 4: Integrate and publish**

Fast-forward `main`, push `origin main`, deploy with `npx vercel --prod --yes`, and verify the live HTML exposes the new hooks at `https://fas-murex.vercel.app`.
