# FAS Account Login Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a premium split-screen FAS account page that fits in one standard desktop viewport, uses an approximately 850-weight wordmark, and preserves every authentication state and behavior.

**Architecture:** Keep the existing `account.html` state structure and controller hooks unchanged. Replace only the account-page presentation rules in the shared stylesheet, then regenerate the tracked static build so source and deployment assets match.

**Tech Stack:** Semantic HTML, responsive CSS, Node.js static contract tests, existing npm build pipeline

**Spec:** `docs/superpowers/specs/2026-10-25-account-login-redesign-design.md`

## Global Constraints

- Do not change authentication, Supabase, migration, or account-controller behavior.
- Preserve all existing `data-auth-*` hooks, labels, accessible status regions, and form controls.
- Desktop account views fit inside `100dvh` without page scrolling.
- Short-height and mobile escape hatches must keep every form control reachable.
- Use existing FAS colors, fonts, and geometric background language; add no external dependency or image.

## Review Focus

- Full five-field signup at 1366×768: all controls and privacy copy remain visible without page scrolling; pin with viewport and compact-height CSS assertions.
- Error, migration, sign-in, recovery, and confirmation states: headings remain constrained by the same card; pin by retaining the shared account-panel selectors and all state hooks.
- Very short desktop viewport: safe vertical scrolling activates instead of clipping; pin with a `max-height` media-query assertion.
- Tablet and mobile widths: split layout collapses and controls remain reachable; pin with responsive overflow and single-column assertions.
- Brand hierarchy: FAS remains legible and premium without overpowering the form; pin the wordmark weight at `850` and constrain headline sizing.

---

### Task 1: Compact premium account viewport

**Files:**
- Modify: `tests/account-page.test.js`
- Modify: `assets/css/styles.css`
- Modify: `account.html` only if a semantic wrapper or concise copy adjustment is required
- Generated: `public/assets/css/styles.css`
- Generated: `public/account.html`

**Interfaces:**
- Consumes: the existing `.account-page`, `.account-shell`, `.account-story`, `.account-panel`, `.account-panel__inner`, `.account-mark`, `.account-form`, and `data-auth-*` contracts
- Produces: a responsive presentation contract with a no-scroll standard desktop shell, a contained account card, compact height scaling, and safe small-screen overflow

- [ ] **Step 1: Write the failing account-layout contract tests**

Add separate tests asserting that the stylesheet contains:

- `.account-page` with `height:100dvh` and desktop `overflow:hidden`
- `.account-shell` constrained to the viewport
- `.account-mark span` with `font-weight:850`
- `.account-panel__inner` with a visible border, border radius, and responsive padding
- a short-height media query that enables `overflow:auto`
- a narrow-width media query that collapses the shell and keeps vertical overflow available
- a constrained account headline that cannot return to the current 98px scale

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/account-page.test.js`

Expected: FAIL because the current account stylesheet has no 850-weight wordmark, contained panel card, or complete viewport/overflow contract.

- [ ] **Step 3: Implement the refined split-screen presentation**

Update the account-page block in `assets/css/styles.css` to use a roughly 42/58 split, `100dvh` shell, controlled story typography, compact proof points, and a bordered layered card. Use viewport-height-aware spacing/input sizes so the signup view fits at common laptop heights. Keep desktop overflow hidden, and explicitly restore vertical scrolling for short heights and widths below the desktop breakpoint.

If `account.html` changes, limit it to semantic decoration or shorter presentation copy; do not alter IDs, names, validation attributes, state sections, or controller hooks.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/account-page.test.js`

Expected: all account-page tests pass.

- [ ] **Step 5: Run the full suite and build**

Run: `npm test && npm run build && npm test`

Expected: both suites pass, the build succeeds, and tracked `public` account assets match source.

- [ ] **Step 6: Inspect the rendered page at desktop and mobile dimensions**

Start the existing local server and verify the signup, sign-in, and error states at 1366×768 and a narrow mobile viewport. Confirm no desktop page scroll, no clipped controls, readable contrast, correct active-tab styling, and safe mobile scrolling.

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/specs/2026-10-25-account-login-redesign-design.md docs/superpowers/plans/2026-10-25-account-login-redesign.md tests/account-page.test.js assets/css/styles.css account.html public/assets/css/styles.css public/account.html
git commit -m "feat: refine FAS account experience"
```
