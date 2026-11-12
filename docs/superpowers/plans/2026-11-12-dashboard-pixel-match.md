# Dashboard Pixel-Match Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the FAS dashboard as a faithful, single-screen 1920×1080 match to the supplied reference while preserving live customer, progress, entitlement, and routing behavior.

**Architecture:** Replace dashboard-specific HTML and CSS instead of extending the current approximation. Keep the existing authentication/access/project services and `dashboard.js` state model, add only the DOM hooks needed by the reconstructed sidebar and panels, and use two repository-owned transparent generated artwork assets for the Anchor and Extract roadmap scenes.

**Tech Stack:** Static HTML5, CSS, browser JavaScript, Node test runner, built-in image generation, Chromium/Edge screenshot and geometry verification, Vercel static build.

**Spec:** `docs/superpowers/specs/2026-11-12-dashboard-pixel-match-design.md`

## Global Constraints

- Pixel-match target is a browser content viewport of exactly 1920×1080 at normal zoom.
- The entire target desktop dashboard must fit without vertical or horizontal document scrolling.
- The most recent supplied dashboard screenshot is the visual source of truth.
- Never hard-code the reference customer's name or company.
- Existing progress, access, lock, project, session, review, tutorial, Vault, and ADAM behavior must remain live.
- Generated final artwork must live in `assets/images/` and be copied into `public/assets/images/` by the existing build.
- Changes are dashboard-scoped unless shared behavior is intentionally tested.

## Review Focus

- A 140-character authenticated name must stay inside the header and must not introduce horizontal overflow; Task 4 adds a browser geometry assertion.
- New, partial, Anchor-complete, and all-complete projects must present the correct sidebar/card/current-step states; Task 3 extends state/render tests.
- A locked Extract card in authenticated mode must retain the Anchor guarded route, notice, project, and Anchor session; Task 3 retains and reruns the authenticated route regression.
- Generated art must have real transparency and must not contain baked-in text/card backgrounds; Task 1 validates file alpha and visual content.
- At 1920×1080, browser font loading or fallback must not create page scroll; Task 4 waits for `document.fonts.ready` before geometry and screenshot checks.

---

### Task 1: Generate the reference artwork

**Files:**
- Create: `assets/images/dashboard-anchor-platform.png`
- Create: `assets/images/dashboard-extract-platform.png`
- Modify: `tests/static-branding.test.js`

**Interfaces:**
- Consumes: the supplied reference screenshot as the image-generation style/composition reference.
- Produces: two transparent, wide card-scene raster assets referenced by Task 2 markup and Task 4 CSS.

- [ ] **Step 1: Add failing static asset assertions**

Assert both exact asset paths appear in `index.html`, exist on disk, and are non-empty. Add an alpha-channel validation command to the task notes using an available image inspector.

- [ ] **Step 2: Run the static test and verify failure**

Run: `node --test tests/static-branding.test.js`

Expected: FAIL because the new image paths/files do not exist.

- [ ] **Step 3: Generate the two transparent assets**

Use the built-in image generator twice with the supplied screenshot as a reference. Anchor prompt: centered circular black/gold anchor medallion, warm white/gold aura, thin concentric elliptical gold platform rings, wide transparent canvas, no text/card/border/watermark. Extract prompt: centered angular black/silver diamond medallion, cool white/emerald aura, thin concentric elliptical emerald platform rings, same framing and exclusions. Save the selected outputs at the exact paths above.

- [ ] **Step 4: Inspect and validate both assets**

Open both outputs, confirm composition and actual alpha transparency, and make one targeted correction if framing, glow, or background materially differs from the reference.

- [ ] **Step 5: Add the future markup references so the test passes**

Add the two exact `<img>` references within the existing corresponding roadmap art containers without changing the rest of the shell yet.

- [ ] **Step 6: Run tests and commit**

Run: `node --test tests/static-branding.test.js`

Expected: PASS.

Commit: `feat: add dashboard specialist artwork`

---

### Task 2: Reconstruct the one-screen shell and sidebar

**Files:**
- Modify: `index.html`
- Modify: `tests/static-multi-agent.test.js`
- Modify: `tests/static-branding.test.js`

**Interfaces:**
- Consumes: the two image paths from Task 1 and existing auth/navigation data hooks.
- Produces: the final dashboard DOM contract consumed by `dashboard.js` and dashboard-scoped CSS.

- [ ] **Step 1: Write failing structure tests**

Assert exact dashboard regions for the compact logo lockup, active Dashboard row, four primary navigation actions, two specialist sidebar rows, pinned save/account footer, two-tone header, three-zone focus panel, two roadmap cards with generated images, quick-access panel, and encouragement panel. Assert absence of hard-coded `Michael Diala` and `Innov8 IT`.

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test tests/static-multi-agent.test.js tests/static-branding.test.js`

Expected: FAIL on the new sidebar/shell contract.

- [ ] **Step 3: Replace the dashboard DOM composition**

Rebuild `index.html` dashboard/sidebar markup to match the reference hierarchy and visible copy. Preserve existing scripts, auth hooks, navigation URLs, tutorial trigger, `data-account-name`, account company hook, progress/card hooks, `data-agent-link`, guarded Extract attributes, and accessibility labels.

- [ ] **Step 4: Run tests and commit**

Run: `node --test tests/static-multi-agent.test.js tests/static-branding.test.js`

Expected: PASS.

Commit: `feat: reconstruct dashboard reference shell`

---

### Task 3: Bind real state to the reconstructed sidebar and cards

**Files:**
- Modify: `assets/js/dashboard.js`
- Modify: `tests/dashboard-state.test.js`

**Interfaces:**
- Consumes: `derive(project, access)` and the Task 2 DOM hooks.
- Produces: `render(state, document, context)` updates for the focus panel, sidebar specialist rows, roadmap cards, gauge, and guarded destinations.

- [ ] **Step 1: Add failing render-state tests**

Test new, partial Anchor, Anchor-complete/Extract-current, and all-complete states against minimal DOM fixtures. Assert sidebar status/lock text and classes agree with roadmap cards and focus panel. Retain the authenticated locked-route assertion for `agent=anchor`, `notice=extract-locked`, `project`, and Anchor session.

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test tests/dashboard-state.test.js tests/progression.test.js`

Expected: FAIL because the new sidebar hooks are not rendered.

- [ ] **Step 3: Extend render without changing state semantics**

Update `render`/a focused helper to populate the new sidebar specialist hooks, current/completed/locked classes, gauge progress, CTA copy, artwork state, and routes. Do not duplicate entitlement rules or replace `derive` as the source of card state.

- [ ] **Step 4: Run tests and commit**

Run: `node --test tests/dashboard-state.test.js tests/progression.test.js`

Expected: PASS.

Commit: `feat: bind dashboard sidebar progress`

---

### Task 4: Pixel-match styling, geometry, and production output

**Files:**
- Modify: `assets/css/styles.css`
- Modify: `tests/static-branding.test.js`
- Create: `tests/dashboard-geometry.test.js`
- Modify by build: `public/index.html`
- Modify by build: `public/assets/css/styles.css`
- Modify by build: `public/assets/js/dashboard.js`
- Create by build: `public/assets/images/dashboard-anchor-platform.png`
- Create by build: `public/assets/images/dashboard-extract-platform.png`

**Interfaces:**
- Consumes: final Task 2 markup, Task 3 state hooks, and Task 1 image assets.
- Produces: the reference-matched 1920×1080 screen and responsive behavior.

- [ ] **Step 1: Add failing CSS and browser geometry tests**

Static assertions require dashboard-scoped viewport sizing, reference sidebar width, fixed desktop grid proportions, generated artwork styling, and named responsive breakpoints. Browser geometry at 1920×1080 waits for `document.fonts.ready` and asserts `scrollWidth <= innerWidth`, `scrollHeight <= innerHeight`, account footer visibility, focus panel/card/utility placement, and a 140-character name without overflow. Repeat overflow checks at 1440×900, 1280×800, 1024×768, 768×1024, and 390×844.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test tests/static-branding.test.js tests/dashboard-geometry.test.js`

Expected: FAIL against the current approximate CSS.

- [ ] **Step 3: Replace the dashboard-scoped CSS**

Implement the reference proportions, typography, sidebar, gold/emerald atmosphere, focus panel, roadmap cards, utility rail, pinned account footer, image placement, and viewport-height constraints. At the target viewport use one screen with no document scroll; at smaller viewports compact first, collapse the utility rail before cards become cramped, then switch to mobile stacking/navigation.

- [ ] **Step 4: Capture and compare the target screenshot**

Serve the authenticated/local fixture, capture at exactly 1920×1080 after fonts load, compare with the supplied reference, and tune spacing/sizing until the same major edges align: sidebar divider, header baselines, focus panel bounds, roadmap heading, card/utility tops, and footer position.

- [ ] **Step 5: Run focused and full verification**

Run: `node --test tests/static-branding.test.js tests/static-multi-agent.test.js tests/dashboard-state.test.js tests/progression.test.js tests/dashboard-geometry.test.js`

Expected: PASS.

Run: `npm run build && npm test`

Expected: all non-live tests PASS; only the established optional live Supabase test may skip.

- [ ] **Step 6: Verify public parity and commit**

Confirm both generated assets and final HTML/CSS/JS exist in `public/` and match source output.

Commit: `feat: pixel match dashboard reference`

---

### Task 5: Whole-branch review and release

**Files:**
- Review all changes since the design commit.

**Interfaces:**
- Consumes: the complete implementation and verification evidence.
- Produces: reviewed `main`, pushed remote, and verified production deployment.

- [ ] **Step 1: Request a fresh whole-branch review**

Review for visual/spec compliance, scroll/overflow, authentication data binding, progression/access regressions, generated asset delivery, and accessibility. Fix every Critical or Important finding with a failing regression test first.

- [ ] **Step 2: Re-run final verification**

Run: `npm run build && npm test`

Expected: all non-live tests PASS; only the established optional live Supabase test may skip.

- [ ] **Step 3: Merge, push, and deploy**

Merge the isolated feature branch into `main`, push `origin main`, and run `npx vercel --prod --yes` from the linked repository.

- [ ] **Step 4: Verify production**

Use authenticated `vercel curl` downloads to confirm the rebuilt dashboard markers, both generated artwork URLs/files, and dashboard pixel-match CSS exist at `https://fas-murex.vercel.app`.

