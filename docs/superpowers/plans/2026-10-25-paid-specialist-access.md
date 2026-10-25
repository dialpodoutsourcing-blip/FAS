# Paid Specialist Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show and permit only Anchor and Extract while securely reserving Steps 3–7 for future payment-based entitlements.

**Architecture:** Supabase is the source of truth for per-user specialist entitlements, with Anchor and Extract always included. A small browser access module guards chat/review routes and a server authorization helper rejects paid-agent API use; static navigation contains only currently offered products. Existing paid-agent definitions and records remain intact.

**Tech Stack:** Static HTML/CSS, browser JavaScript, Node.js/Express, Node test runner, PostgreSQL/Supabase RLS and RPC, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-25-paid-specialist-access-design.md`

## Global Constraints

- Existing Anchor and Extract work must remain unchanged and usable.
- Steps 3–7 remain stored; do not delete definitions, questions, answers, sessions, artifacts, or implementation.
- Only Supabase service-side/payment workflows may grant paid entitlements.
- Direct URLs and direct API/database calls must fail closed for an unentitled paid specialist.
- Preserve the user-owned untracked `anchor-window-test.png`.

## Review Focus

- Missing or stale entitlement data must default to Anchor and Extract only, never grant paid access.
- An unknown specialist key must be denied, not silently changed to Extract.
- Old cached account contexts containing seven session IDs must not restore paid access.
- Existing paid records must remain present while RLS makes them unreadable to an unentitled user.
- Payment expiration or revocation must remove access without requiring a frontend deployment.

---

### Task 1: Supabase entitlement source of truth

**Files:**
- Create: `supabase/migrations/202610250004_paid_specialist_entitlements.sql`
- Create: `tests/paid-access-sql.test.js`
- Modify: `assets/js/account-context.js`
- Modify: `tests/account-context.test.js`

**Interfaces:**
- Produces: `public.has_fas_agent_access(text, uuid default auth.uid()) -> boolean`
- Produces: `public.list_fas_agent_access() -> text[]`
- Produces: `public.user_agent_entitlements` for future service-role payment grants
- Produces: account contexts whose `sessions` map may contain only accessible agents

- [ ] **Step 1: Write failing SQL contract and account-context tests**

Assert that the migration defines the entitlement table, free-agent rule, expiration/revocation checks, authenticated read-only grants, catalog/session/answer/artifact RLS enforcement, and access checks in write RPCs. Assert account context accepts two accessible sessions and refuses contexts missing Anchor or Extract.

- [ ] **Step 2: Run the targeted tests and verify they fail**

Run: `node --test tests/paid-access-sql.test.js tests/account-context.test.js`

Expected: FAIL because the migration and two-session context behavior do not exist.

- [ ] **Step 3: Add the migration and update account-context validation**

The migration must preserve all seven stored sessions while returning only accessible sessions to the browser. RLS and security-definer RPCs must call `has_fas_agent_access` for the relevant `agent_key`. The entitlement table permits users to read only their own rows and grants no authenticated client mutation rights.

- [ ] **Step 4: Run the targeted tests and verify they pass**

Run: `node --test tests/paid-access-sql.test.js tests/account-context.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the database access layer**

Commit: `feat: add paid specialist entitlements`

### Task 2: Browser visibility and direct-route enforcement

**Files:**
- Create: `assets/js/agent-access.js`
- Create: `tests/agent-access.test.js`
- Modify: `index.html`
- Modify: `chat.html`
- Modify: `review.html`
- Modify: `vault.html`
- Modify: `launch.html`
- Modify: `assets/js/nav.js`
- Modify: `assets/js/adam.js`
- Modify: `assets/js/artifact-ui.js`
- Modify: `assets/js/tutorial.js`
- Modify: `tests/static-multi-agent.test.js`
- Modify: `tests/static-sidebar.test.js`
- Modify: `tests/static-tutorial.test.js`

**Interfaces:**
- Consumes: `list_fas_agent_access()` and `FAS.authReady`
- Produces: `FAS.agentAccess.isAllowed(agentKey) -> boolean`
- Produces: `FAS.agentAccess.guardRoute({ location, access }) -> { allowed, destination? }`
- Produces: `FAS.agentAccess.load() -> Promise<string[]>`

- [ ] **Step 1: Write failing route and static-visibility tests**

Assert Anchor/Extract are allowed, paid/unknown chat and review keys redirect to `index.html?access=locked`, the paid `launch.html` route redirects, only two specialist cards/sidebar links and vault products render, the Launch plan navigation item is hidden, roadmap copy and progress use two steps, and old cached session IDs do not grant access.

- [ ] **Step 2: Run the targeted tests and verify they fail**

Run: `node --test tests/agent-access.test.js tests/static-multi-agent.test.js tests/static-sidebar.test.js tests/static-tutorial.test.js`

Expected: FAIL because paid links and seven-step UI remain and no route guard exists.

- [ ] **Step 3: Implement the browser access module and load it before page controllers**

Use the Supabase RPC when authenticated, default to `['anchor','extract']` on local mode or any access-loading failure, and guard `chat.html?agent=`, `review.html?asset=`, and the paid `launch.html` route before their controllers initialize. Render a concise dashboard notice for `access=locked`.

- [ ] **Step 4: Remove Steps 3–7 from visible markup and update available-roadmap wording**

Keep the internal seven-agent registry unchanged. Remove only paid cards/sidebar rows/vault product tabs and adjust labels that describe the currently visible roadmap from seven to two.

- [ ] **Step 5: Run the targeted tests and verify they pass**

Run: `node --test tests/agent-access.test.js tests/static-multi-agent.test.js tests/static-sidebar.test.js tests/static-tutorial.test.js`

Expected: PASS.

- [ ] **Step 6: Commit the browser lock**

Commit: `feat: lock paid specialists in the browser`

### Task 3: Server-side paid-agent enforcement

**Files:**
- Create: `lib/agent-access.js`
- Create: `tests/server-agent-access.test.js`
- Modify: `server.js`
- Modify: `assets/js/realtime-interviewer.js`
- Modify: `assets/js/adam.js`
- Modify: `assets/js/artifact-ui.js`

**Interfaces:**
- Produces: `isFreeAgent(agentKey) -> boolean`
- Produces: `authorizeAgentAccess({ agentKey, token, supabaseUrl, publishableKey, fetchImpl }) -> Promise<boolean>`
- Consumes: specialist key from chat JSON, artifact JSON, synthesis JSON, or `X-FAS-Agent` for interview realtime requests

- [ ] **Step 1: Write failing server authorization tests**

Assert Anchor/Extract requests remain accepted, paid and unknown specialists return HTTP 403 before any OpenAI/export work, missing paid entitlements fail closed, and active/unexpired paid entitlement responses permit the request.

- [ ] **Step 2: Run the targeted tests and verify they fail**

Run: `node --test tests/server-agent-access.test.js`

Expected: FAIL because the server currently authenticates users without authorizing specialist products.

- [ ] **Step 3: Implement central server authorization and pass agent identity from clients**

Free specialists require the existing authenticated/local-preview rules. Paid specialists additionally call the Supabase access RPC with the caller's bearer token. Validate the agent key against the seven-agent allowlist and return `{ error: 'This specialist is not available on your current plan.' }` with status 403 on denial.

- [ ] **Step 4: Run the targeted tests and verify they pass**

Run: `node --test tests/server-agent-access.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the server lock**

Commit: `feat: enforce specialist access on APIs`

### Task 4: Full verification, migration, and production deployment

**Files:**
- Generated: `public/**` through the existing build
- Modify only if verification finds a regression: the owning source/test file from Tasks 1–3

**Interfaces:**
- Consumes: all prior task outputs
- Produces: migrated Supabase schema and deployed Vercel build

- [ ] **Step 1: Run the entire test suite**

Run: `npm test`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Build the production bundle**

Run: `npm run build`

Expected: exit code 0 and generated `public` output contains only Anchor and Extract navigation.

- [ ] **Step 3: Apply the migration to the configured Supabase project**

Use the existing `SUPABASE_ACCESS_TOKEN` with the project reference derived from `SUPABASE_URL`; do not print credentials. Verify the access functions exist and an ordinary authenticated user receives only Anchor and Extract by default.

- [ ] **Step 4: Commit generated production output and push `main`**

Commit: `build: publish paid specialist access controls`

- [ ] **Step 5: Deploy to Vercel and verify production**

Verify the production dashboard/sidebar show only Steps 1–2, paid direct routes return to the dashboard with the access notice, free chat/review routes load, and paid API requests return 403.

