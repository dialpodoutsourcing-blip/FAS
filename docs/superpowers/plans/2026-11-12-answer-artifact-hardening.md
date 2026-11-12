# Answer and Artifact Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure specialist reruns retire stale current artifacts, preserve and combine follow-up detail, and generate useful partial EXTRACT documents.

**Architecture:** Introduce one authenticated transactional reset RPC and mirror its lifecycle locally. Harden the shared answer collector to distinguish additive follow-ups from explicit revisions, while letting EXTRACT build from partial usable input and leaving ANCHOR's completeness rule intact.

**Tech Stack:** Vanilla browser JavaScript, Node.js built-in test runner, PostgreSQL/Supabase migrations

**Spec:** `docs/superpowers/specs/2026-11-12-answer-artifact-hardening-design.md`

## Global Constraints

- Permission resolution is deferred; pending and private answers remain excluded.
- Approved artifact-version rows remain immutable and auditable.
- Reset retains historical versions but removes the retired artifact from current views.
- A completed rerun appends a fresh version to the canonical artifact.
- No new runtime dependency.

## Review Focus

- Reset of one specialist must not alter another specialist's answers, session, or artifact.
- Repeated reset must remain safe when no artifact exists or it is already retired.
- Explicit answer revisions must replace the prior value rather than concatenate contradictory text.
- Additive follow-ups must retain chronological order and stable source identity.
- EXTRACT with zero usable answers must still fail safely rather than save a meaningless artifact.

---

### Task 1: Transactional specialist reset and artifact retirement

**Files:**
- Create: `supabase/migrations/202611120001_agent_reset_hardening.sql`
- Modify: `assets/js/project-store.js`
- Modify: `tests/project-store.test.js`
- Modify: `tests/auth-database-contract.test.js`

**Interfaces:**
- Consumes: `resetAgent(agentKey)` and the authenticated project/session context.
- Produces: `public.reset_fas_agent(p_project_id uuid, p_session_id uuid, p_agent_key text) returns jsonb`; artifact status `retired`.

- [ ] **Step 1: Add failing local and Supabase store tests**

Assert local reset keeps version history, marks/removes the current artifact from current selection, and leaves other agents untouched. Assert Supabase reset makes one `rpc/reset_fas_agent` request with project, session, and agent identifiers.

- [ ] **Step 2: Run focused tests and verify the lifecycle assertions fail**

Run: `node --test tests/project-store.test.js tests/auth-database-contract.test.js`

- [ ] **Step 3: Implement local lifecycle behavior and the Supabase RPC call**

Change `resetAgent(agentKey)` without changing its public signature. Retain local artifact versions as historical records and exclude the retired current artifact from `state.artifacts`.

- [ ] **Step 4: Add the reset migration**

Expand the artifact status constraint to include `retired`; create the fixed-search-path security-definer RPC; verify `auth.uid()`, project edit access, matching project/session/agent ownership; delete only matching answers; clear only the selected session; mark only matching current artifacts retired; revoke public/anon execution and grant authenticated execution.

- [ ] **Step 5: Run focused tests and verify they pass**

Run: `node --test tests/project-store.test.js tests/auth-database-contract.test.js`

### Task 2: Additive follow-up aggregation with explicit revision semantics

**Files:**
- Modify: `assets/js/anchor-artifact-upgrade.js`
- Modify: `tests/anchor-artifact-upgrade.test.js`

**Interfaces:**
- Consumes: chronological answer rows with `field`, `text`, `incomplete`, `permissionStatus`, `supersedesId`, and `trigger`.
- Produces: `collectAnswers(project, agentKey)` with one synthesis source per available field whose text contains the main answer plus additive follow-up detail.

- [ ] **Step 1: Add failing aggregation tests**

Cover main-plus-follow-up ordering, multiple additive follow-ups, deliberate revision replacement, exclusion of incomplete/pending/private rows, unrelated specialist isolation, and stable source ID selection.

- [ ] **Step 2: Run focused tests and verify failures show last-value replacement**

Run: `node --test tests/anchor-artifact-upgrade.test.js`

- [ ] **Step 3: Implement grouped answer aggregation**

Keep `collectAnswers(project, agentKey)` public. Treat a row that supersedes an incomplete/probe-triggered row as additive context; treat a deliberate revision of a complete row as replacement; join additive text with a readable separator and retain all usable detail.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `node --test tests/anchor-artifact-upgrade.test.js`

### Task 3: Partial EXTRACT artifact generation

**Files:**
- Modify: `assets/js/anchor-artifact-upgrade.js`
- Modify: `assets/js/artifacts.js` only if existing gap generation does not cover absent EXTRACT fields
- Modify: `tests/anchor-artifact-upgrade.test.js`
- Modify: `tests/artifacts.test.js`

**Interfaces:**
- Consumes: any non-empty set of usable EXTRACT answers from `collectAnswers(project, 'extract')`.
- Produces: a saved deterministic EXTRACT artifact with warnings/gaps for missing fields; ANCHOR continues requiring all six fields.

- [ ] **Step 1: Add failing partial-EXTRACT tests**

Assert collection succeeds with some EXTRACT fields, rebuild produces an Expertise Map with visible missing-input gaps, pending/private rows remain excluded, zero usable fields are rejected, and incomplete ANCHOR remains ineligible.

- [ ] **Step 2: Run focused tests and verify the all-fields gate fails them**

Run: `node --test tests/anchor-artifact-upgrade.test.js tests/artifacts.test.js`

- [ ] **Step 3: Implement agent-specific completeness rules**

Return partial results only for EXTRACT when at least one usable field exists. Keep ANCHOR's six-field requirement. Ensure `rebuild(options)` sends only usable answers to synthesis and preserves the deterministic partial artifact when synthesis fails or is invalid.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `node --test tests/anchor-artifact-upgrade.test.js tests/artifacts.test.js`

### Task 4: Deployable mirrors and regression verification

**Files:**
- Modify: generated files under `public/` through the existing build command
- Test: full suite

**Interfaces:**
- Consumes: completed Tasks 1â€“3.
- Produces: deployable public assets matching source and a green regression suite.

- [ ] **Step 1: Build deployable mirrors**

Run: `npm run build`

- [ ] **Step 2: Run the full suite**

Run: `npm test`

- [ ] **Step 3: Inspect the final diff and verify deferred permission behavior was not changed**

Run: `git diff --check && git diff --stat && git status --short`
