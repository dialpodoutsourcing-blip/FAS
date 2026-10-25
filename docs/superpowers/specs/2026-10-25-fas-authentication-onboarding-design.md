# FAS Authentication and Supabase Onboarding Design

## Intent

Give every FAS user a first-party account experience inside the product. A user can create an account, confirm their email, sign in, recover access, and immediately receive a private FAS workspace and project. From that point forward, answers, checkpoints, artifact versions, approvals, and exported documents belong to that authenticated project in Supabase.

The first authenticated session must also detect the current browser's `fas.project.local-default` data and migrate its saved answers so the user's existing Anchor work is not lost.

## Goals

- Add a dedicated FAS welcome, sign-up, and sign-in page matching the existing black, ivory, and gold product system.
- Use the configured Supabase project URL and publishable key; never expose a secret or service-role key.
- Support email/password sign-up, email confirmation, sign-in, sign-out, session refresh, and password recovery.
- Bootstrap one profile, owner workspace, active project, and one active interview session for each of the seven agents after first authentication.
- Route every agent page with the authenticated `project` and correct agent `session` IDs.
- Migrate browser-local answers into the authenticated Supabase project once, remapping source IDs safely.
- Rebuild completed Anchor content from the migrated answers and store it as a versioned Supabase artifact.
- Preserve local data until the Supabase migration has completed successfully.
- Keep the existing local-storage mode available only when Supabase is not configured, not as a silent fallback after an authenticated Supabase request fails.

## Non-goals

- Social login, organization invitations, billing, roles management, and multi-workspace switching are not part of this first implementation.
- The frontend will not receive a Supabase secret key or directly administer other users.
- Authentication will not redesign the dashboard, chat, review, Vault, or launch interfaces beyond account state and project-aware navigation.
- The first version will not merge two independently edited cloud and local projects; it imports local data only when the new cloud project has no answers.

## Anti-goals

- Do not allow a user to appear signed in while writes are still going to local storage.
- Do not delete local answers before all required Supabase inserts succeed.
- Do not create one shared interview session for all agents.
- Do not trust project or session UUIDs from the URL without RLS authorization.
- Do not store passwords, access tokens, or secret keys in tracked files, logs, analytics, or error messages.

## Approved approach

### Dedicated authentication gate

The approved approach is a dedicated `account.html` experience shown before the dashboard. It contains sign-in and create-account modes, an email-confirmation state, password recovery, accessible validation, and a restrained FAS visual treatment. Successful authentication runs onboarding and then opens the dashboard.

This is preferred over a dashboard modal because it establishes ownership before the user can create data and avoids ambiguous local-versus-cloud state.

### Alternatives considered

1. **Dashboard modal.** Smaller visual change, but permits the user to start work before identity and project ownership are established. Rejected because it increases migration and recovery ambiguity.
2. **Manual Supabase user creation.** Requires an administrator for every account and does not solve project/session onboarding. Rejected because it is not a customer-ready product flow.
3. **Server administration with a secret key.** Technically simple but unnecessary. Rejected because an authenticated database bootstrap function can honor `auth.uid()` without introducing an elevated application credential.

## User experience

### First visit

1. A configured FAS deployment redirects an unauthenticated visitor from protected product pages to `account.html`.
2. The page defaults to **Create your account**, with name, business/project name, email, password, and confirmation fields.
3. After submission, Supabase sends its configured confirmation email. FAS shows a durable check-your-email state and a route back to sign-in.
4. When the confirmation link returns to FAS, the page accepts the Supabase session, completes onboarding, and continues to the dashboard.

### Returning user

1. The user signs in with email and password.
2. FAS stores the Supabase session in the existing `fas.supabase.session` key, refreshes it before expiry, and restores the account context.
3. The dashboard opens with the project and per-agent sessions attached to navigation.

### Password recovery

1. The user requests a recovery email from the account page.
2. The recovery link returns to the account page in reset mode.
3. The user sets a new password and signs in without exposing recovery tokens in logs or page content.

### Local-data migration

1. After onboarding, FAS checks `fas.project.local-default`.
2. If local answers exist and no completed import exists for the payload checksum, the account page explains that saved work was found and imports it automatically.
3. A durable import record stores an import UUID, project ID, payload checksum, status, and local-to-Supabase answer-ID mapping. This record makes reload and retry safe after partial progress.
4. Answers are inserted in chronological order into the correct agent session with an idempotent client reference. Returned Supabase UUIDs are recorded in the import mapping so the same local answer cannot be inserted twice.
5. If Anchor has all six required fields, FAS rebuilds and synthesizes the Anchor artifact from the migrated answers, then saves its artifact and first version. Artifact creation can resume independently when answers have already imported.
6. The import record moves through `started`, `answers_imported`, `artifact_saved`, and `complete`. The browser-local record receives a migration marker only after the durable import reaches `complete`; the original local payload remains recoverable.
7. If migration fails, the user remains on a retryable recovery state and resumes from the durable status; FAS never silently continues with partial cloud state.

## Architecture

### Runtime configuration

Add a public, no-store `/api/runtime-config` endpoint returning only:

```json
{
  "supabaseUrl": "https://project.supabase.co",
  "supabasePublishableKey": "sb_publishable_...",
  "configured": true
}
```

The endpoint reads `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, with `SUPABASE_ANON_KEY` as a backwards-compatible fallback. A small bootstrap script loads this object into `window.FAS_CONFIG` before auth or project modules run. No secret or service-role variable is accepted.

### Browser authentication module

Create a dependency-free Supabase Auth REST adapter for:

- sign up;
- password sign-in;
- refresh-token exchange;
- sign out;
- recovery email;
- password update;
- confirmation/recovery callback parsing;
- current authenticated user lookup.

The module owns session validation and persistence. Other modules receive a verified session rather than reading arbitrary tokens independently.

### Secure database bootstrap

Add an idempotent SQL migration containing an authenticated `security definer` function with a fixed `search_path`. It:

- rejects calls without `auth.uid()`;
- upserts the caller's profile;
- reuses or creates the caller's owner workspace;
- reuses or creates an active project;
- creates or reuses one active interview session for every active agent;
- returns the workspace ID, project ID, and `{agent_key: session_id}` mapping;
- grants execute only to `authenticated`.

The function never accepts a user ID from the caller. All ownership derives from `auth.uid()`.

Bootstrap calls are serialized per authenticated user with a transaction-scoped advisory lock. Database uniqueness protects the one active project/session result so simultaneous tabs cannot create duplicate workspaces, projects, or active sessions.

### Durable local import

Add a project-scoped `local_imports` table and idempotent authenticated RPCs. The table records payload checksum, import status, answer-ID mapping, last error code, and timestamps. Imported answers receive a stable client reference unique within the project. RPCs derive the user from `auth.uid()`, verify edit access, and never accept ownership fields from the browser.

Answer import is transactional. Artifact rebuilding remains an application operation because it may call the synthesis endpoint; its completion is then recorded durably so a reload resumes artifact creation without repeating answer inserts.

### Account context

Persist non-secret account routing state under `fas.supabase.context`:

```json
{
  "workspaceId": "uuid",
  "projectId": "uuid",
  "sessions": {
    "anchor": "uuid",
    "extract": "uuid"
  }
}
```

Navigation resolves the session for the target agent and adds `project` and `session` to chat and review links. A missing or unauthorized context sends the user back through bootstrap rather than falling back to `local-default`.

### Protected-page guard

Configured deployments load a small guard before page controllers. It refreshes the session if necessary and redirects to `account.html?return=<safe-local-path>` when authentication is absent. The return path is limited to known local FAS pages to prevent open redirects.

### Persistence behavior

After authentication:

- every accepted answer writes to `public.answers` with its agent-specific `session_id`;
- every checkpoint updates that same `public.interview_sessions` row;
- every completed agent writes one `public.artifacts` row and immutable `public.artifact_versions` rows;
- approval updates the artifact and corresponding version status;
- PDF/DOCX export storage remains the next persistence layer and uses the already designed private `fas-exports` bucket.

The interview controller must not advance the durable checkpoint until the answer insert succeeds. While a save is pending, the submitted text remains visible and retryable. A failed write restores the same current question and never claims that work was saved locally. Artifact creation/version insertion and approval transitions use database RPCs where more than one row must change atomically.

## Error handling

- Invalid credentials produce a generic account error without revealing whether an email exists.
- Unconfirmed accounts receive a resend-confirmation path.
- Expired access tokens attempt one refresh before redirecting to sign-in.
- Bootstrap is idempotent so retries cannot create duplicate workspaces, projects, or active agent sessions.
- Local migration records per-record progress in memory but commits the migration marker only after the whole import succeeds.
- Supabase write failure is visible and retryable; authenticated mode never writes a second, divergent local copy.

## Security

- Only the publishable key reaches the browser.
- RLS remains enabled on every project table.
- Bootstrap derives identity exclusively from `auth.uid()`.
- Passwords are sent directly to Supabase Auth and never stored by FAS.
- Tokens stay in browser storage only for this initial vanilla-JS architecture and are excluded from logs and rendered HTML.
- Redirect targets are allowlisted local paths.
- Existing CSP/security headers remain in force; account responses use `Cache-Control: no-store`.

## Testing

- Runtime config exposes only URL and publishable key and returns an unconfigured state when either is missing.
- Auth adapter covers sign-up, confirmation-required response, sign-in, refresh, sign-out, recovery, callback parsing, and sanitized failures.
- SQL contract tests verify authentication checks, fixed search path, ownership derived from `auth.uid()`, idempotent workspace/project/session creation, and execute grants.
- Account UI tests verify accessible labels, password confirmation, pending/success/error states, safe return paths, and no credentials in shipped assets.
- Context/navigation tests verify the correct session UUID follows each agent link.
- Migration tests prove answers are imported once, UUIDs are remapped, complete Anchor answers rebuild an artifact, and local data survives any failed import.
- End-to-end verification creates a real test account, signs in, migrates Anchor answers, reloads the app, and confirms answers and artifact versions through authenticated Supabase reads.

## Delivery sequence

1. Runtime configuration endpoint and browser loader.
2. Secure bootstrap SQL migration.
3. Auth REST adapter and account-context module.
4. Dedicated account page and protected-page guard.
5. Project-aware navigation and per-agent sessions.
6. Local answer migration and Anchor artifact rebuild.
7. Real Supabase end-to-end verification.

The production build adds `account.html` to the static page manifest. Vercel/Express routing must expose `/api/runtime-config` with `Cache-Control: no-store`, and deployment tests must load both the account page and runtime configuration through their final public routes.

## Product decisions made by the builder

- Use the existing vanilla JavaScript and REST architecture instead of introducing a frontend framework or Supabase SDK.
- Default project name to the business name supplied during sign-up, falling back to `My Authority Project`.
- Keep the local payload after migration with a timestamped migration marker so recovery remains possible.
- Use durable import-state records plus idempotent client references rather than an in-memory-only migration.
- Serialize bootstrap per user and enforce active-session uniqueness at the database boundary.
- Advance interview state only after the corresponding Supabase answer write succeeds.
- Treat export-file upload as a subsequent implementation slice; artifact JSON persistence is included here.
