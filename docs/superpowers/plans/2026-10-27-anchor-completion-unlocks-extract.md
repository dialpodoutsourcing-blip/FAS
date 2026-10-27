# ANCHOR Completion Unlocks EXTRACT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unlock EXTRACT immediately when ANCHOR's final answer is durably saved, while retaining artifact-based compatibility.

**Architecture:** Extend the shared browser progression policy to recognize a valid completed ANCHOR checkpoint in addition to saved artifacts. All dashboard, sidebar, and route-gate consumers already call this policy, so one tested change updates every surface consistently.

**Tech Stack:** Browser JavaScript, Node.js `node:test`, existing project-store checkpoint format.

**Spec:** `docs/superpowers/specs/2026-10-27-anchor-completion-unlocks-extract-design.md`

## Global Constraints

- A saved ANCHOR artifact always unlocks EXTRACT.
- A checkpoint unlocks only at six or more completed ANCHOR questions with no insufficient fields or open conflicts.
- Raw answer count alone never unlocks EXTRACT.
- Dashboard, sidebar, and direct-route checks must share the same rule.

## Review Focus

- Legacy `agent_key` artifact records still unlock.
- Missing checkpoint arrays fail closed without throwing.
- Resolved conflicts do not block completion; open conflicts do.
- More than six answers with a partial checkpoint remain locked.
- Completed cloud and local checkpoint shapes behave identically.

---

### Task 1: Progression completion policy

**Files:**
- Modify: `assets/js/progression.js`
- Modify: `tests/progression.test.js`

**Interfaces:**
- Consumes: `project.checkpoints.anchor` and `project.artifacts`.
- Produces: `anchorComplete(project)`, `canEnter()`, `lockReason()`, and `apply()` with checkpoint-aware behavior.

- [ ] Add failing tests for completed, partial, insufficient, conflicting, and artifact-backed projects.
- [ ] Verify the focused test fails because completed checkpoints remain locked.
- [ ] Implement checkpoint completion using `questionIndex >= 6`, empty `insufficientFields`, and no conflict whose status is `open`.
- [ ] Verify `node --test tests/progression.test.js tests/extract-flow.test.js` passes.
- [ ] Commit with `fix: unlock extract after anchor completion`.

### Task 2: Production verification and publication

**Files:**
- Regenerate: `public/assets/js/progression.js`

**Interfaces:**
- Consumes: completed shared policy.
- Produces: verified production deployment.

- [ ] Run `npm test` and require all non-live tests to pass.
- [ ] Run `npm run build` and confirm the built progression asset contains checkpoint-aware completion.
- [ ] Inspect the final diff and run `git diff --check` on source/test files.
- [ ] Merge to `main`, push, verify the exact Vercel deployment reaches `Ready`, and confirm the production site responds.
