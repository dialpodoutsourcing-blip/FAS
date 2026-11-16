# Open Production Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the temporary launch hold and restore normal authenticated production access.

**Architecture:** Retire the account-page cover and owner-email branch at their existing UI and auth-guard boundaries. Keep the established Supabase session, account-context, and entitlement paths unchanged, then regenerate static production files.

**Tech Stack:** HTML, CSS, browser JavaScript, Node.js test runner, Vercel static build

**Spec:** `docs/superpowers/specs/2026-11-16-open-production-login-design.md`

## Global Constraints

- Authentication remains mandatory on configured deployments.
- Supabase session validation, account bootstrap, local import, and specialist entitlements remain unchanged.
- Preserve unrelated untracked workspace files.
- Push `main` only after the full suite passes.

## Review Focus

- Account HTML must expose an interactive account shell and execute `account.js` normally.
- Authenticated non-owner users must reach the same account-context flow as the former owner account.
- Unauthenticated users must still redirect safely to `account.html`.
- Runtime configuration failures must remain fail-closed.
- Generated `public/` files must exactly reflect source removal.

---

### Task 1: Restore the normal account page

**Files:**
- Modify: `tests/account-page.test.js`
- Modify: `account.html`
- Modify: `assets/css/styles.css`
- Delete: `assets/js/propagation-cover.js`

**Interfaces:**
- Consumes: existing account page and `account.js` browser controller
- Produces: interactive account markup with a normal `assets/js/account.js` script

- [ ] **Step 1: Write a failing account-page test** asserting the propagation cover and hold script type are absent, the account shell is not inert, and `account.js` is a normal script.
- [ ] **Step 2: Run `node --test tests/account-page.test.js`** and confirm it fails on the existing holding markup.
- [ ] **Step 3: Remove the cover markup, inert attributes, cover script, obsolete CSS rules, and obsolete JavaScript file; restore normal controller loading.**
- [ ] **Step 4: Run `node --test tests/account-page.test.js`** and confirm it passes.
- [ ] **Step 5: Commit the account-page restoration.**

### Task 2: Retire the owner-only launch gate

**Files:**
- Modify: `tests/auth-guard.test.js`
- Modify: `assets/js/auth-guard.js`

**Interfaces:**
- Consumes: `protect({config, auth, context, location})`
- Produces: the existing `{mode:'supabase', session, context}` result for every valid authenticated user

- [ ] **Step 1: Replace launch-gate tests with a failing test** proving a valid non-owner session loads its existing account context without clearing auth or redirecting.
- [ ] **Step 2: Run `node --test tests/auth-guard.test.js`** and confirm it fails with the current `launch-hold` redirect.
- [ ] **Step 3: Remove the owner-email verification and launch-hold redirect while leaving session validation and context loading intact.**
- [ ] **Step 4: Run `node --test tests/auth-guard.test.js`** and confirm authenticated and unauthenticated cases pass.
- [ ] **Step 5: Commit the auth-gate removal.**

### Task 3: Package and release

**Files:**
- Regenerate: `public/account.html`
- Regenerate: `public/assets/css/styles.css`
- Regenerate: `public/assets/js/auth-guard.js`
- Delete generated: `public/assets/js/propagation-cover.js`

**Interfaces:**
- Consumes: verified source files
- Produces: deployable `public/` assets

- [ ] **Step 1: Run `npm run build`** and verify the generated hold artifacts are absent.
- [ ] **Step 2: Run focused account/auth tests** and confirm they pass.
- [ ] **Step 3: Run `npm test`** and require zero failures.
- [ ] **Step 4: Run `git diff --check` and self-review the complete diff.**
- [ ] **Step 5: Commit generated production assets, push `main`, and confirm local and remote commit IDs match.**
