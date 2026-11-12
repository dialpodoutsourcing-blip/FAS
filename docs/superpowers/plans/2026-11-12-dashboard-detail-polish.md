# Dashboard Detail Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the reference dashboard’s small visual and structural details without reintroducing scrolling at the user’s 1508×782 effective viewport.

**Architecture:** Keep all dynamic content and controls in semantic HTML/CSS, extending the existing dashboard shell instead of replacing it. Add narrowly scoped decorative assets only for organic background artwork, then tune the compact and full-desktop CSS together under browser geometry tests.

**Tech Stack:** HTML5, CSS, SVG/raster assets, vanilla JavaScript, Node test runner, Playwright Core, Vercel build pipeline

**Spec:** `docs/superpowers/specs/2026-11-12-dashboard-detail-polish-design.md`

## Global Constraints

- The complete dashboard must fit without scrolling at 1508×782.
- Functional text and controls remain semantic, accessible, data-driven HTML/CSS.
- Do not change Supabase, persistence, entitlements, specialist progression, or routing behavior.
- Preserve the current 1920×1080 layout, safe scrolling below 720px height, and mobile breakpoints.
- Decorative layers must use `pointer-events: none` and remain inside their owning panels.

## Review Focus

- A long customer name must remain contained without covering system controls.
- `01` and `02` progress states must keep the number, denominator, and label visible inside the gauge.
- Signed-in and local-preview account states must show a usable account panel and Sign Out control without breaking auth behavior.
- Completed, current, and locked cards must preserve their correct destinations and state text.
- Browser scaling around the compact breakpoint must neither clip descendants nor hide actions behind `overflow: hidden`.

---

### Task 1: Lock the reference details into browser tests

**Files:**
- Modify: `tests/dashboard-geometry.test.js`
- Modify: `tests/static-branding.test.js`

**Interfaces:**
- Consumes: existing `withPage(viewport, run)` browser fixture and dashboard DOM selectors.
- Produces: regression coverage for all polished details and containment boundaries.

- [ ] **Step 1: Add a failing 1508×782 detail geometry test**

Assert that `.home-focus__gauge` contains its `strong`, denominator, and progress label; `.home-sidebar__account` and `[data-account-signout]` remain visible; both card descriptions and footers are visible; `.home-quick` and `.home-encouragement` remain contained; document height is at most 782.

- [ ] **Step 2: Add failing static structure assertions**

Assert that the sidebar contains a dedicated Sign Out control, encouragement uses a chart-style icon hook, and decorative layers expose stable class hooks without replacing live text.

- [ ] **Step 3: Run the focused tests and confirm failure**

Run: `node --test tests/dashboard-geometry.test.js tests/static-branding.test.js`

Expected: FAIL on missing Sign Out/detail hooks or clipped gauge/card content.

- [ ] **Step 4: Commit the red tests**

```bash
git add tests/dashboard-geometry.test.js tests/static-branding.test.js
git commit -m "test: define dashboard detail fidelity"
```

### Task 2: Restore semantic sidebar, card, and utility details

**Files:**
- Modify: `index.html`
- Modify: `assets/css/styles.css`
- Modify: `assets/js/dashboard.js` only if a stable state hook is required
- Modify: `public/index.html`
- Modify: `public/assets/css/styles.css`
- Test: `tests/dashboard-geometry.test.js`
- Test: `tests/static-branding.test.js`

**Interfaces:**
- Consumes: existing `data-home-sidebar-action`, `data-home-card-status`, `data-home-card-action`, `data-account-*`, and progression rendering hooks.
- Produces: `.home-sidebar__signout`, `.home-encouragement__icon`, `.home-encouragement__flourish`, and stable decorative layer hooks.

- [ ] **Step 1: Add the sidebar Sign Out and decorative semantic hooks**

Extend `index.html` without changing existing data attributes or link destinations. The Sign Out anchor must use `data-account-signout`; the encouragement icon must remain hidden from assistive technology when its adjacent text communicates the message.

- [ ] **Step 2: Restore compact sidebar hierarchy**

Tune active navigation, specialist rows, icon glows, two-line labels, Review arrows, saved status, account card, settings, and Sign Out to fit inside 782px height.

- [ ] **Step 3: Repair the progress gauge**

Give the gauge an explicit positioned wrapper and reserve label space below the arc so the number, denominator, and “Your Progress” never overlap or clip in `01` or `02` state.

- [ ] **Step 4: Restore roadmap and utility content density**

Show card descriptions at the compact breakpoint, preserve state pills and right actions, and recreate Quick Access plus Keep Going hierarchy within their existing heights.

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/dashboard-geometry.test.js tests/static-branding.test.js`

Expected: PASS.

- [ ] **Step 6: Build public assets and rerun focused tests**

Run: `npm run build && node --test tests/dashboard-geometry.test.js tests/static-branding.test.js`

Expected: build exits 0 and tests pass.

- [ ] **Step 7: Commit semantic detail restoration**

```bash
git add index.html assets/css/styles.css public/index.html public/assets/css/styles.css tests
git commit -m "feat: restore dashboard reference details"
```

### Task 3: Add and integrate organic reference artwork

**Files:**
- Create: `assets/images/dashboard-hero-waves.png`
- Create: `assets/images/dashboard-focus-landscape.png`
- Modify: `assets/css/styles.css`
- Create: `public/assets/images/dashboard-hero-waves.png`
- Create: `public/assets/images/dashboard-focus-landscape.png`
- Modify: `public/assets/css/styles.css`
- Test: `tests/dashboard-geometry.test.js`

**Interfaces:**
- Consumes: transparent raster assets generated from the approved reference’s teal/gold wave and mountain atmosphere, without text or controls.
- Produces: non-interactive decorative backgrounds for `.home-main` and `.home-focus__landscape`.

- [ ] **Step 1: Generate transparent decorative assets**

Use the image generation skill with the supplied reference as visual direction. Generate only the organic wave and landscape layers—no words, logos, buttons, or UI chrome.

- [ ] **Step 2: Integrate artwork with responsive cropping**

Use `background-image`, `background-size`, and breakpoint-specific positioning. Keep opacity low enough for AA-readable foreground text and ensure all layers remain clipped to their owning panels.

- [ ] **Step 3: Capture the target viewport for visual comparison**

Capture 1508×782 and verify the full sidebar footer, gauge label, both card descriptions/actions, Quick Access, and Keep Going flourish are visible without scrolling.

- [ ] **Step 4: Run all geometry and responsive tests**

Run: `node --test tests/dashboard-geometry.test.js`

Expected: 0 failures at 1920×1080, 1508×782, the short-height fallback, desktop boundary, and mobile widths.

- [ ] **Step 5: Commit artwork integration**

```bash
git add assets/images public/assets/images assets/css/styles.css public/assets/css/styles.css
git commit -m "feat: add dashboard atmospheric artwork"
```

### Task 4: Verify, review, integrate, and publish

**Files:**
- Verify: all changed files

**Interfaces:**
- Consumes: completed semantic details and artwork.
- Produces: reviewed, merged, deployed dashboard revision.

- [ ] **Step 1: Run whitespace and build verification**

Run: `git diff --check && npm run build`

Expected: both exit 0.

- [ ] **Step 2: Run the complete test suite**

Run: `npm test`

Expected: 0 failures; the optional live Supabase test may remain skipped.

- [ ] **Step 3: Request a whole-branch review**

Review against the approved spec, with special attention to clipping, click targets, auth behavior, generated asset cropping, and fidelity at 1508×782.

- [ ] **Step 4: Address all critical and important findings and rerun verification**

Run: `npm test && npm run build`

Expected: 0 failures and build exit 0.

- [ ] **Step 5: Merge to `main`, push, and deploy production**

Use a fast-forward or reviewed merge, push `main`, deploy with the repository’s Vercel production command, and verify the live CSS/assets and deployment READY state.
