# FAS Authentication and Supabase Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every FAS customer an in-product Supabase account, a private workspace/project with seven agent sessions, and a safe one-time migration of their existing local Anchor work.

**Architecture:** Keep the existing dependency-free vanilla JavaScript/REST architecture. Express exposes public runtime configuration, focused browser modules own authentication and account context, security-definer PostgreSQL RPCs bootstrap and mutate related records atomically, and a protected-page guard supplies the correct project and per-agent session IDs to existing controllers.

**Tech Stack:** Node.js 22, Express 5, vanilla JavaScript UMD modules, Supabase Auth REST API, PostgREST RPC, PostgreSQL/RLS, Node's built-in test runner, static Vercel build.

**Spec:** `docs/superpowers/specs/2026-10-25-fas-authentication-onboarding-design.md`

## Global Constraints

- Only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, with `SUPABASE_ANON_KEY` as a compatibility fallback, may reach browser code; never expose a secret or service-role key.
- Keep local-storage mode only when Supabase is unconfigured; authenticated failures must remain visible and retryable.
- Derive database ownership exclusively from `auth.uid()` in security-definer functions with a fixed `search_path`.
- Create exactly one owner workspace, one active project, and one active interview session for each of `anchor`, `extract`, `radar`, `forge`, `architect`, `voice`, and `launch`.
- Persist sessions under `fas.supabase.session` and non-secret routing context under `fas.supabase.context`.
- Default the project name to the submitted business name or exactly `My Authority Project` when blank.
- Keep `fas.project.local-default` intact; add its migration marker only after durable import status reaches `complete`.
- Preserve the existing vanilla JavaScript and REST architecture; add no Supabase SDK or frontend framework.
- PDF/DOCX binary upload is deferred; answers, checkpoints, artifact JSON, versions, export theme, and approvals are in scope.
- Do not add, delete, or alter the user-owned untracked file `anchor-window-test.png`.

## Review Focus

- Missing, malformed, or secret-bearing environment configuration must return an unconfigured public payload without leaking any secret; Task 1 tests this.
- A malicious or cross-origin `return` parameter must resolve to `index.html`, while allowlisted local FAS routes keep their query string; Task 3 tests this.
- An expired session must attempt exactly one refresh and must clear/redirect if refresh fails, without recursive requests; Tasks 3 and 5 test this.
- Concurrent bootstrap calls must return the same workspace, project, and seven sessions instead of creating duplicates; Task 2 pins advisory locking and uniqueness contracts.
- A reload after a partially successful local import must resume from durable status without duplicating answers, and the local payload must survive every failure; Task 7 tests this.

---

### Task 1: Public Runtime Configuration and Deployment Entry

**Files:**
- Create: `lib/runtime-config.js`
- Create: `assets/js/runtime-config.js`
- Create: `tests/runtime-config.test.js`
- Modify: `server.js`

**Interfaces:**
- Produces: `buildRuntimeConfig(env) -> { supabaseUrl, supabasePublishableKey, configured }`.
- Produces: `FAS.runtimeConfig.load({ fetchImpl?, target? }) -> Promise<RuntimeConfig>`, which requests `/api/runtime-config`, assigns `window.FAS_CONFIG`, and never caches credentials.
- Produces: `GET /api/runtime-config` with `Cache-Control: no-store`.

- [ ] **Step 1: Write failing runtime and deployment tests**

Add assertions that `buildRuntimeConfig` prefers `SUPABASE_PUBLISHABLE_KEY`, falls back to `SUPABASE_ANON_KEY`, becomes unconfigured when URL/key is missing, ignores `SUPABASE_SECRET_KEY`/`SUPABASE_SERVICE_ROLE_KEY`, and that the endpoint returns only the three public keys with `no-store`. Test the browser loader with an injected fetch and target object.

```js
test('runtime config exposes only safe public values', async () => {
  const config = buildRuntimeConfig({ SUPABASE_URL:'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test', SUPABASE_SECRET_KEY:'never' });
  assert.deepEqual(Object.keys(config).sort(), ['configured','supabasePublishableKey','supabaseUrl']);
  assert.equal(config.configured, true);
  assert.doesNotMatch(JSON.stringify(config), /never|secret|service.role/i);
});
```

- [ ] **Step 2: Run the focused tests and verify the new contracts fail**

Run: `node --test tests/runtime-config.test.js`

Expected: FAIL because the runtime helper, endpoint, and browser loader do not exist.

- [ ] **Step 3: Implement the runtime configuration boundary**

Implement `buildRuntimeConfig(env)` in `lib/runtime-config.js`, mount the no-store route before static middleware in `server.js`, and implement the UMD browser loader in `assets/js/runtime-config.js`.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/runtime-config.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the runtime boundary**

```bash
git add lib/runtime-config.js assets/js/runtime-config.js server.js tests/runtime-config.test.js
git commit -m "feat: expose safe Supabase runtime config"
```

### Task 2: Secure Account Bootstrap and Atomic Persistence RPCs

**Files:**
- Create: `supabase/migrations/202610250002_fas_auth_onboarding.sql`
- Create: `tests/auth-database-contract.test.js`

**Interfaces:**
- Produces: `public.bootstrap_fas_account(p_display_name text, p_project_name text) -> jsonb` containing `workspaceId`, `projectId`, and a seven-key `sessions` object.
- Produces: `public.begin_fas_local_import(p_project_id uuid, p_payload_checksum text) -> jsonb` and `public.update_fas_local_import(p_import_id uuid, p_status text, p_answer_map jsonb default null, p_error_code text default null) -> jsonb`.
- Produces: `public.import_fas_local_answers(p_import_id uuid, p_answers jsonb) -> jsonb`, which inserts the batch transactionally and returns the merged local-ID-to-UUID map.
- Produces: `public.save_fas_artifact(p_project_id uuid, p_agent_key text, p_content jsonb, p_expected_version integer default null) -> jsonb` and `public.approve_fas_artifact(p_artifact_id uuid) -> jsonb`.
- Produces: `public.local_imports` plus nullable `answers.client_ref`, with project-scoped uniqueness and RLS.

- [ ] **Step 1: Write the failing SQL contract tests**

Assert the new migration contains: an authenticated `security definer` bootstrap with `set search_path = public, pg_temp`; `auth.uid()` rejection; `pg_advisory_xact_lock`; uniqueness for one creator workspace, one active creator project, one active agent session, and `(project_id, client_ref)`; seven-agent session creation; `local_imports` status values `started`, `answers_imported`, `artifact_saved`, `complete`, `failed`; transactional/idempotent answer import; RLS; authenticated-only grants; and revoked public/anon execution. Assert artifact save and approval update related rows transactionally and derive `created_by`/approval identity from `auth.uid()`.

```js
test('onboarding migration is authenticated, idempotent, and atomic', () => {
  assert.match(sql, /bootstrap_fas_account[\s\S]*security definer[\s\S]*set search_path\s*=\s*public,\s*pg_temp/i);
  assert.match(sql, /pg_advisory_xact_lock/i);
  assert.match(sql, /import_fas_local_answers/i);
  assert.match(sql, /grant execute[\s\S]*to authenticated/i);
  assert.match(sql, /revoke execute[\s\S]*(public|anon)/i);
});
```

- [ ] **Step 2: Run the SQL contract test and verify it fails**

Run: `node --test tests/auth-database-contract.test.js`

Expected: FAIL because `202610250002_fas_auth_onboarding.sql` is absent.

- [ ] **Step 3: Implement the idempotent migration**

Use transaction-scoped advisory locking keyed by `auth.uid()`, idempotent inserts/selects, partial unique indexes for active project/session records, and JSON keys exactly matching the browser context contract. Every RPC must reject anonymous calls and verify `public.can_edit_project(...)` for supplied project/artifact IDs. Do not accept a caller-supplied user ID.

- [ ] **Step 4: Run database contract tests**

Run: `node --test tests/database-contract.test.js tests/auth-database-contract.test.js tests/production-security.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the database onboarding contract**

```bash
git add supabase/migrations/202610250002_fas_auth_onboarding.sql tests/auth-database-contract.test.js
git commit -m "feat: add secure Supabase account bootstrap"
```

### Task 3: Browser Authentication and Account Context

**Files:**
- Create: `assets/js/auth-client.js`
- Create: `assets/js/account-context.js`
- Create: `tests/auth-client.test.js`
- Create: `tests/account-context.test.js`

**Interfaces:**
- Produces: `FAS.authClient.create({ supabaseUrl, publishableKey, fetchImpl?, storage?, now? })` with `signUp`, `resendConfirmation`, `signIn`, `refresh`, `signOut`, `sendRecovery`, `updatePassword`, `consumeCallback`, `getSession`, and `requireSession`.
- Produces: `FAS.accountContext.create({ auth, storage?, fetchImpl? })` with `bootstrap({ displayName, projectName })`, `load`, `clear`, `sessionFor(agentKey)`, `agentUrl(page, agentKey)`, and `safeReturnPath(value)`.
- Consumes: `RuntimeConfig` from Task 1 and `bootstrap_fas_account` from Task 2.

- [ ] **Step 1: Write failing auth-client tests**

Cover Supabase REST paths and payloads for sign-up, confirmation resend, password sign-in, refresh-token exchange, logout, recovery, password update, and hash/query callback parsing. Assert stored sessions use `fas.supabase.session`, a token refresh happens once before expiry, sign-out clears tokens, and remote errors become generic UI-safe messages that contain neither email nor token.

```js
test('expired sessions refresh once and persist normalized tokens', async () => {
  const auth = authApi.create({ supabaseUrl, publishableKey, fetchImpl, storage, now:() => expiry });
  const session = await auth.requireSession();
  assert.equal(refreshCalls, 1);
  assert.deepEqual(Object.keys(session).sort(), ['accessToken','expiresAt','refreshToken','user']);
  assert.ok(storage.getItem('fas.supabase.session'));
});
```

- [ ] **Step 2: Run auth-client tests and verify failure**

Run: `node --test tests/auth-client.test.js`

Expected: FAIL because `assets/js/auth-client.js` is absent.

- [ ] **Step 3: Implement `FAS.authClient`**

Send `apikey` with the public key and user bearer tokens only where required. Normalize Supabase session responses to `{ accessToken, refreshToken, expiresAt, user }`; never render or log raw upstream bodies.

- [ ] **Step 4: Write failing context tests**

Assert `bootstrap` calls `/rest/v1/rpc/bootstrap_fas_account`, persists only `{workspaceId, projectId, sessions}`, requires all seven session keys, uses the correct per-agent UUID in generated chat/review URLs, defaults a blank project name to `My Authority Project`, and maps `https://evil.example`, `//evil.example`, unknown pages, and malformed encodings to `index.html`.

```js
test('context routes every agent to its own session and rejects unsafe returns', async () => {
  const saved = await context.bootstrap({ displayName:'Mike', projectName:'' });
  assert.deepEqual(Object.keys(saved.sessions).sort(), ['anchor','architect','extract','forge','launch','radar','voice']);
  assert.match(context.agentUrl('chat.html','anchor'), /project=project-1.*session=anchor-session/);
  assert.equal(context.safeReturnPath('https://evil.example'), 'index.html');
});
```

- [ ] **Step 5: Implement account context**

Implement `assets/js/account-context.js` with the exact `fas.supabase.context` storage key, the seven-key validation, and allowlisted pages `index.html`, `chat.html`, `review.html`, `vault.html`, and `launch.html`.

- [ ] **Step 6: Run auth and context tests**

Run: `node --test tests/auth-client.test.js tests/account-context.test.js`

Expected: PASS.

- [ ] **Step 7: Commit auth and context modules**

```bash
git add assets/js/auth-client.js assets/js/account-context.js tests/auth-client.test.js tests/account-context.test.js
git commit -m "feat: add browser Supabase authentication"
```

### Task 4: Dedicated FAS Account Experience

**Files:**
- Create: `account.html`
- Create: `assets/js/account.js`
- Create: `tests/account-page.test.js`
- Modify: `assets/css/styles.css`
- Modify: `tools/prepare-vercel.js`
- Modify: `tests/vercel-deployment.test.js`

**Interfaces:**
- Consumes: `FAS.runtimeConfig`, `FAS.authClient`, and `FAS.accountContext` from Tasks 1 and 3.
- Produces: account modes `signup`, `signin`, `confirm`, `recover`, `reset`, `migrating`, and `error`, selected through semantic forms and `data-auth-*` attributes.
- Produces: `FAS.accountController.create({ auth, context, localImport?, document?, location? })` with `start`, `submitSignup`, `submitSignin`, `submitRecovery`, `submitPasswordReset`, and `resendConfirmation` methods.

- [ ] **Step 1: Write failing static and controller tests**

Assert the account page has a single labeled field per required value, password confirmation, an `aria-live` status, disabled/pending submit state, confirmation/resend path, recovery/reset forms, no embedded Supabase URL/key/password/token, and the FAS black/ivory/gold shell. Controller tests must assert password mismatch is stopped locally, invalid credentials show a generic message, confirmation/recovery callbacks are consumed before routing, successful sign-in calls bootstrap then honors a safe return path, and unconfigured deployments may enter local mode without pretending to be signed in. Extend the build test so `public/account.html` and all account dependencies must exist.

```js
test('account page is accessible and contains no credentials', () => {
  assert.match(html, /<label[^>]*for="auth-email"/i);
  assert.match(html, /aria-live="polite"/i);
  assert.doesNotMatch(html, /sb_(publishable|secret)|service.role|access_token/i);
});
test('password mismatch never reaches Supabase', async () => {
  await controller.submitSignup({ password:'one', confirmation:'two' });
  assert.equal(auth.signUp.mock.calls.length, 0);
});
```

- [ ] **Step 2: Run account-page tests and verify failure**

Run: `node --test tests/account-page.test.js`

Expected: FAIL because the page and controller do not exist.

- [ ] **Step 3: Build the responsive account screen and controller**

Load scripts in dependency order: `runtime-config.js`, `auth-client.js`, `account-context.js`, then `account.js`. Add `account.html` to the static build manifest. Use text-only status rendering, keep submitted email/password out of URLs, and retain form values needed for a retry without retaining passwords after success.

- [ ] **Step 4: Run account and deployment tests**

Run: `node --test tests/account-page.test.js tests/runtime-config.test.js tests/vercel-deployment.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the account frontend**

```bash
git add account.html assets/js/account.js assets/css/styles.css tools/prepare-vercel.js tests/account-page.test.js tests/vercel-deployment.test.js
git commit -m "feat: add FAS account onboarding screen"
```

### Task 5: Protected Pages and Project-Aware Agent Navigation

**Files:**
- Create: `assets/js/auth-guard.js`
- Create: `tests/auth-guard.test.js`
- Modify: `assets/js/nav.js`
- Modify: `index.html`
- Modify: `chat.html`
- Modify: `review.html`
- Modify: `vault.html`
- Modify: `launch.html`
- Modify: `tests/static-sidebar.test.js`

**Interfaces:**
- Produces: `FAS.authGuard.protect({ config, auth, context, location }) -> Promise<{ mode, session?, context? }>` and a `fas:auth-ready` document event.
- Produces: `FAS.nav.applyAccountContext(context)` to rewrite every `[data-agent-link]` and completion/review URL with the authenticated `project` and matching agent `session`.
- Consumes: `accountContext.agentUrl(page, agentKey)` for trusted URL construction.

- [ ] **Step 1: Write failing guard and navigation tests**

Test four states: unconfigured continues in local mode; configured with no session redirects to `account.html?return=...`; configured with an expiring session refreshes once; configured with missing/invalid context re-runs bootstrap. Assert each of the seven sidebar/card links receives its own session UUID, account footer shows the authenticated profile, and sign-out clears session/context before returning to the account page.

```js
test('configured pages redirect unauthenticated visitors safely', async () => {
  const result = await guard.protect({ config:{configured:true}, auth:noSessionAuth, context, location });
  assert.equal(result.mode, 'redirect');
  assert.match(location.assigned, /^account\.html\?return=/);
});
test('navigation applies the correct session to every agent', () => {
  nav.applyAccountContext(accountContext.load());
  assert.match(anchorLink.href, /session=anchor-session/);
  assert.match(extractLink.href, /session=extract-session/);
});
```

- [ ] **Step 2: Run guard/navigation tests and verify failure**

Run: `node --test tests/auth-guard.test.js tests/account-context.test.js tests/static-sidebar.test.js`

Expected: FAIL because the guard and project-aware rewrites are absent.

- [ ] **Step 3: Implement the guard and wire protected entry points**

Load runtime/auth/context/guard scripts before page controllers. Controllers must wait for `fas:auth-ready`; no configured page may construct a `local-default` store while auth resolution is pending or failed. Update `nav.js` to preserve unrelated safe query parameters while replacing `project` and `session` from trusted context.

- [ ] **Step 4: Run protected-page tests**

Run: `node --test tests/auth-guard.test.js tests/account-context.test.js tests/static-sidebar.test.js tests/static-branding.test.js`

Expected: PASS.

- [ ] **Step 5: Commit protected routing**

```bash
git add assets/js/auth-guard.js assets/js/nav.js index.html chat.html review.html vault.html launch.html tests/auth-guard.test.js tests/static-sidebar.test.js
git commit -m "feat: protect FAS project routes"
```

### Task 6: Durable Interview, Artifact, and Approval Writes

**Files:**
- Modify: `assets/js/project-store.js`
- Modify: `assets/js/adam.js`
- Modify: `assets/js/interview-engine.js`
- Modify: `assets/js/artifact-ui.js`
- Modify: `tests/project-store.test.js`
- Modify: `tests/interview-engine.test.js`
- Modify: `tests/production-journey.test.js`
- Modify: `tests/review-fixes.test.js`

**Interfaces:**
- Consumes: authenticated `{ supabaseUrl, publishableKey, accessToken, userId, projectId, sessionId }` and atomic RPCs from Task 2.
- Produces: `projectStore.create(...)` that chooses local mode only when `configured === false`; configured mode rejects missing/invalid auth context.
- Produces: Supabase `saveArtifact`/`saveArtifactVersion`/`approveArtifact` backed by the atomic RPCs rather than multi-request partial writes.
- Produces: `interview.restore(checkpoint)` so a rejected durable write restores the exact pre-submit engine state.

- [ ] **Step 1: Write failing persistence tests**

Assert a configured store without credentials rejects instead of returning `mode: 'local'`; each agent store uses `context.sessions[agentKey]`; answer text stays retryable and the current question/checkpoint does not advance when `saveAnswer` rejects; `saveCheckpoint` follows a successful answer only; artifact creation/versioning and approval each issue one RPC; and authenticated write errors never create or mutate `fas.project.local-default`.

```js
test('configured persistence never falls back to local storage', () => {
  assert.throws(() => stores.create({ configured:true, projectId:'project-1' }), /authenticated context/i);
  assert.equal(storage.getItem('fas.project.local-default'), null);
});
test('failed answer saves restore the exact question and checkpoint', async () => {
  await submitWithStore({ saveAnswer:async () => { throw new Error('offline'); } });
  assert.deepEqual(interview.checkpoint(), before);
  assert.equal(composer.value, submittedText);
});
```

- [ ] **Step 2: Run persistence tests and verify failure**

Run: `node --test tests/project-store.test.js tests/production-journey.test.js tests/review-fixes.test.js`

Expected: FAIL on strict configured-mode, per-agent session, and atomic RPC assertions.

- [ ] **Step 3: Implement strict authenticated persistence**

Add an explicit `configured` option to `projectStore.create`, resolve credentials/context from the guard result rather than ad-hoc localStorage reads, and preserve the existing local store behavior only for `configured === false`. Before `interview.acceptAnswer(...)`, capture `interview.checkpoint()`; in `adam.js`, disable duplicate submission while pending, persist the accepted answer before saving its advanced checkpoint, and call `interview.restore(previousCheckpoint)` on either write failure before showing the retryable text again.

- [ ] **Step 4: Run persistence and interview tests**

Run: `node --test tests/project-store.test.js tests/interview-engine.test.js tests/production-journey.test.js tests/review-fixes.test.js`

Expected: PASS.

- [ ] **Step 5: Commit durable application writes**

```bash
git add assets/js/project-store.js assets/js/adam.js assets/js/interview-engine.js assets/js/artifact-ui.js tests/project-store.test.js tests/interview-engine.test.js tests/production-journey.test.js tests/review-fixes.test.js
git commit -m "feat: persist authenticated FAS work atomically"
```

### Task 7: Resumable Local Answer and Anchor Artifact Migration

**Files:**
- Create: `assets/js/local-import.js`
- Create: `tests/local-import.test.js`
- Modify: `account.html`
- Modify: `assets/js/account.js`
- Modify: `assets/js/anchor-artifact-upgrade.js`
- Modify: `tests/anchor-artifact-upgrade.test.js`

**Interfaces:**
- Produces: `FAS.localImport.create({ storage, auth, context, fetchImpl?, checksum? }).inspect() -> ImportCandidate|null` and `.run(candidate) -> Promise<ImportResult>`.
- Consumes: `begin_fas_local_import`/`update_fas_local_import`, `context.sessions[agentKey]`, `/api/artifact-synthesis`, `FAS.artifacts.build`, and atomic artifact persistence.
- Produces: stable client references `local:<checksum>:<localAnswerId>` and local marker `migration.supabase = { importId, projectId, checksum, completedAt }`.

- [ ] **Step 1: Write failing import tests**

Cover no local answers, cloud project already containing answers, chronological multi-agent import, field/source preservation, correct per-agent session mapping, stable client references, returned local-to-cloud UUID mapping, and the four durable statuses. Assert a reload from `answers_imported` skips answer inserts and resumes Anchor artifact creation; any answer/synthesis/artifact/status failure keeps the original payload and omits the completion marker; six required Anchor fields trigger exactly one rebuild and artifact version.

```js
test('partial imports resume without duplicate answers', async () => {
  const result = await importer.run(candidateWithStatus('answers_imported'));
  assert.equal(importAnswerCalls, 0);
  assert.equal(saveArtifactCalls, 1);
  assert.equal(result.status, 'complete');
});
test('failed imports preserve the recoverable local payload', async () => {
  await assert.rejects(() => failingImporter.run(candidate));
  assert.ok(storage.getItem('fas.project.local-default'));
  assert.equal(readLocalProject().migration, undefined);
});
```

- [ ] **Step 2: Run import tests and verify failure**

Run: `node --test tests/local-import.test.js tests/anchor-artifact-upgrade.test.js`

Expected: FAIL because the resumable importer does not exist.

- [ ] **Step 3: Implement checksum, import, and resume behavior**

Canonicalize only migration-relevant answer fields before SHA-256 hashing; never hash tokens or passwords. Use the durable import row as the source of truth after reload. Batch answer insertion through authenticated RPC/PostgREST with conflict handling on `client_ref`, persist the UUID map before synthesis, and call the existing premium Anchor synthesis only when `authority`, `arena`, `evidence`, `position`, `boundaries`, and `activation` are present.

- [ ] **Step 4: Integrate migration states into account onboarding**

Load `local-import.js` before `account.js`. After successful bootstrap, `account.js` must inspect and automatically import recoverable local work, show `migrating`/retry UI, and navigate only after status `complete`. A project with existing cloud answers must display a non-destructive skip message and leave local data untouched.

- [ ] **Step 5: Run migration and journey tests**

Run: `node --test tests/local-import.test.js tests/anchor-artifact-upgrade.test.js tests/production-journey.test.js`

Expected: PASS.

- [ ] **Step 6: Commit resumable migration**

```bash
git add account.html assets/js/local-import.js assets/js/account.js assets/js/anchor-artifact-upgrade.js tests/local-import.test.js tests/anchor-artifact-upgrade.test.js tests/production-journey.test.js
git commit -m "feat: migrate local FAS answers to Supabase"
```

### Task 8: Production Build and Live Supabase Verification

**Files:**
- Create: `tests/auth-onboarding.e2e.test.js`
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `tests/production-security.test.js`
- Modify: `tests/vercel-deployment.test.js`

**Interfaces:**
- Consumes: `FAS_E2E_EMAIL` and `FAS_E2E_PASSWORD` only for an opt-in live test; never prints or commits them.
- Produces: documented deployment variables `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` with `SUPABASE_ANON_KEY` compatibility.

- [ ] **Step 1: Add failing release/security assertions**

Assert the built `public/` tree contains account/auth/context/guard/import modules, no `.env` or secret/service-role value, all protected pages load the guard before controllers, HTML remains `no-store`, and runtime config is reachable through the production Express route. Add an opt-in live test that signs in an existing test account, bootstraps twice and compares IDs, imports a uniquely checksummed Anchor fixture, reloads context, reads the six answers and artifact version through the user token, then leaves the project data available for inspection.

```js
test('live Supabase onboarding is idempotent and durable', { skip:process.env.FAS_RUN_SUPABASE_E2E !== '1' }, async () => {
  const first = await bootstrap();
  const second = await bootstrap();
  assert.deepEqual(second, first);
  await importAnchorFixture(first);
  assert.equal((await readAnswers(first.projectId)).length, 6);
  assert.equal((await readArtifactVersions(first.projectId)).length, 1);
});
```

- [ ] **Step 2: Run release tests and verify new assertions fail**

Run: `node --test tests/production-security.test.js tests/vercel-deployment.test.js tests/auth-onboarding.e2e.test.js`

Expected: local release assertions FAIL until documentation/build wiring is complete; the live test SKIPs unless both opt-in credentials are supplied.

- [ ] **Step 3: Complete build, environment, and operator documentation**

Document how to run migration `202610250002_fas_auth_onboarding.sql`, configure Supabase Site URL/redirect URLs for local and deployed `account.html`, set the publishable key, start FAS, confirm email, recover a password, inspect the created workspace/project/seven sessions, and retry a local import. Never document or request a secret/service-role key for the browser app.

- [ ] **Step 4: Run the full local release gate**

Run: `npm test && npm run build && npm test`

Expected: all tests PASS, live Supabase test SKIPS without opt-in credentials, and the rebuilt `public/` tree passes the second test run.

- [ ] **Step 5: Run the opt-in live Supabase journey**

Run: `$env:FAS_RUN_SUPABASE_E2E='1'; node --test tests/auth-onboarding.e2e.test.js`

Expected: PASS using a confirmed disposable account supplied through `FAS_E2E_EMAIL`/`FAS_E2E_PASSWORD`; output contains no credential or token values.

- [ ] **Step 6: Commit release verification**

```bash
git add README.md .env.example tests/auth-onboarding.e2e.test.js tests/production-security.test.js tests/vercel-deployment.test.js public
git commit -m "test: verify authenticated FAS onboarding"
```
