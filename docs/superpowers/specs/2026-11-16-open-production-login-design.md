# Open Production Login Design

## Intent

End the temporary pre-launch hold and restore the normal FAS account experience for the production launch. Authenticated users should reach their workspace without being restricted to a single owner email.

## Scope

- Remove the full-screen propagation/deployment cover from the account page.
- Restore the account shell as interactive, visible content and load `account.js` normally.
- Remove the temporary owner-email launch restriction from the protected-page auth guard.
- Remove obsolete propagation-cover JavaScript and CSS from source and generated public files.
- Update tests to prove the login UI is active and any authenticated user continues through the ordinary account-context flow.
- Rebuild `public/`, run focused and full verification, commit to `main`, and push the verified commit to trigger the live deployment.

## Security Boundary

This does not bypass authentication. Unauthenticated visitors still redirect to the account page; sessions are still validated through Supabase; missing account context is still bootstrapped; specialist entitlement checks remain unchanged.

## Approaches

1. **Remove both temporary launch blocks — selected.** Restore the login controller and remove the owner-only redirect. This creates a coherent production launch while preserving normal security.
2. **Hide only the holding screen — rejected.** The account form would appear, but non-owner users would still be redirected after authentication.
3. **Keep dormant launch code behind a flag — rejected.** There is no established launch-flag system, and retaining an obsolete production lock adds unnecessary risk.

## Non-goals

- No redesign of the account page.
- No changes to Supabase credentials, database policies, onboarding, local import, or paid-specialist entitlement behavior.
- No changes to unrelated untracked workspace files.
