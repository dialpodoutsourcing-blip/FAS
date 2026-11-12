# Login Propagation Cover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Temporarily block the login page with a branded 75% propagation screen and a very slow capped progress bar.

**Architecture:** Add semantic cover markup to `account.html`, make the existing account shell inert, and style the cover in the shared stylesheet. Generate `public/` through the existing build.

**Tech Stack:** HTML, CSS, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-12-login-propagation-cover-design.md`

## Constraints

- Login controls must not be keyboard- or pointer-accessible.
- Progress begins at 75%, animates for six hours, and never reaches 100%.
- Show an estimate of 5–6 hours.
- Do not change authentication code.

### Task 1: Propagation cover

- [ ] Add failing static account-page assertions for semantic cover markup, inert login shell, progress copy, and capped animation.
- [ ] Run the focused test and confirm the intended failure.
- [ ] Add the minimal HTML and CSS implementation.
- [ ] Build `public/` and run focused and full tests.
- [ ] Commit, review, merge, push, deploy, and verify live markers.
