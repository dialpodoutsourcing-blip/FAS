# Anchor Legacy Blueprint Upgrade — Design

Date: 2026-10-25
Status: Approved

## Intent

Allow a user with a previously completed Anchor interview to receive the new premium report without answering or pasting the six questions again.

## Chosen Approach

Use an automatic, one-time upgrade when the Anchor review page opens. Manual regeneration would add an unnecessary step, while editing a specific browser profile would be brittle and would not work for database-backed projects.

## Behavior

- Detect an Anchor artifact version that has the original sections but no `premiumReport`.
- Confirm all six saved Anchor answer fields still exist in the loaded project.
- Rebuild the grounded Anchor artifact from those saved answers.
- Request premium structured synthesis using the saved answer IDs and text.
- If synthesis succeeds, attach the validated premium report; if it fails, retain the complete deterministic premium fallback.
- Save the upgraded artifact as a new draft version, preserving the previous version unchanged.
- Reload and display the newly saved version automatically on the same review page.
- Show a short “Upgrading your blueprint…” state while work is in progress and an actionable error if saving fails.
- Never repeat the upgrade once the latest saved version contains `premiumReport`.

## Safety and Scope

- No answers are deleted or rewritten.
- No approved artifact version is modified.
- The upgrade uses only the project’s existing Anchor answers.
- Other agents and already-premium Anchor artifacts are unchanged.
- Local storage and Supabase use the same upgrade flow through the existing project store.

## Verification

- A legacy Anchor project with six saved answers creates exactly one new premium version.
- Reopening an already upgraded project creates no additional version.
- AI synthesis success and fallback failure paths both produce a premium report.
- Missing answers do not create a misleading report.
- Review routing, source provenance, theme selection, PDF, and DOCX continue working.
