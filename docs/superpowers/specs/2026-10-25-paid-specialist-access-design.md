# Paid Specialist Access Design

## Intent

Expose only ANCHOR (Step 1) and EXTRACT (Step 2) to current users. RADAR, FORGE, ARCHITECT, VOICE, and LAUNCH (Steps 3–7) are paid products and must remain unavailable until a future payment workflow grants access.

## Goals

- Show only Steps 1 and 2 on the dashboard and every shared sidebar.
- Remove seven-step wording and progress UI from the currently available two-product experience.
- Reject direct navigation to chat or review routes for Steps 3–7.
- Prevent authenticated users from reading paid question catalogs or creating/reading paid specialist sessions, answers, and artifacts through Supabase directly.
- Reject paid-specialist AI, realtime interview, and export requests at the application server.
- Make later payment unlocking a data change by granting an entitlement, not a new frontend deployment.

## Non-goals

- Building checkout, subscriptions, pricing, or a payment-provider webhook now.
- Deleting Steps 3–7, their prompts, definitions, saved records, or implementation.
- Redesigning the dashboard, chat, or report experience.

## Constraints

- Existing Anchor and Extract work must remain unchanged and usable.
- Existing paid-specialist records must remain stored but inaccessible without entitlement.
- The current user-owned untracked screenshot is unrelated and must not be changed.
- The production deployment remains on Vercel and Supabase.

## Approaches considered

### 1. Hide the paid links only

Smallest change, but direct URLs and Supabase/API calls would still expose paid products. Rejected because hidden navigation is not an access control.

### 2. Hard-code two enabled agents throughout the frontend and server

Blocks the visible application, but later payment unlocking would require code changes and would not reliably protect direct Supabase access. Rejected because access would be duplicated and difficult to unlock safely.

### 3. Supabase-backed agent entitlements with defense in depth — selected

Anchor and Extract are always included. Steps 3–7 require a user entitlement stored in Supabase. Browser route guards, Supabase RLS/RPC checks, and server API checks enforce the same access decision. This adds the schema needed for a future payment webhook to grant access without exposing paid products now.

## Selected behavior

- Dashboard cards and shared sidebar links contain only Anchor and Extract.
- Available-product copy uses two-step language where it describes the visible roadmap.
- A user who enters a paid specialist URL is redirected to the dashboard with a concise notice that the product is not available on the current plan.
- The paid specialists remain in the internal registry and database so they can be enabled later.
- Supabase receives an entitlement table and an access-check function. The function returns true for Anchor and Extract and otherwise requires an active entitlement for the authenticated user.
- Question-catalog policies and project-data policies/RPCs enforce specialist access.
- Server endpoints derive the requested specialist from the request and return HTTP 403 when access is absent.
- Until payment is implemented, no normal user receives Steps 3–7 entitlements.

## Verification

- Static tests prove only Anchor and Extract appear on the dashboard and shared sidebars.
- Route-guard tests prove Steps 3–7 redirect while Steps 1–2 proceed.
- Server tests prove paid-agent calls return 403 and free-agent calls remain valid.
- SQL contract tests prove entitlement and policy/RPC enforcement exists.
- The full automated suite and production build pass before deployment.

