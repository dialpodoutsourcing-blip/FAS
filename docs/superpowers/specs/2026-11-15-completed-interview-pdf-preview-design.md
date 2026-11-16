# Completed Interview PDF Preview

## Intent

When a specialist chat finishes loading and discovers that the user has already completed its interview, it should present an immediate choice instead of returning them to an inactive completed conversation. The user can view the finished PDF in the Vault or deliberately retry the interview.

## Goals

- Detect an already-completed specialist after its saved project state loads.
- Show a completion modal with **View PDF** and **Retry answering** actions.
- Route **View PDF** to the Vault with enough URL context to select the same specialist and request its PDF preview.
- Generate the current artifact PDF through the existing `/api/exports` pipeline, reuse the existing browser export cache, and display the returned PDF blob inside an accessible Vault viewer.
- Keep download available from the viewer and revoke temporary object URLs when the viewer closes or is replaced.
- Send **Retry answering** through the existing destructive-retry confirmation and reset behavior.
- Preserve project and session URL context where it is already available.

## Non-goals

- Persisting PDFs in cloud object storage or adding permanent public PDF URLs.
- Changing PDF content, themes, artifact synthesis, or versioning rules.
- Automatically resetting completed answers.
- Replacing the Vault's existing artifact/document preview.

## Constraints and failure behavior

- The modal must be keyboard accessible, labelled, and usable with the existing native-dialog fallback.
- A completed interview without a saved artifact must not open a broken viewer; the Vault should show a retryable PDF preparation error while leaving the artifact page usable.
- PDF responses must retain the existing `%PDF-` signature validation.
- Loading, generation failure, and browser PDF-embedding limitations must have visible status or fallback download/open controls.
- The implementation must work for every specialist, not only ANCHOR.

## Approaches considered

1. **Generate and preview the existing export blob â€” selected.** The Vault requests the current artifact PDF from `/api/exports`, caches the result with the existing export cache, creates a temporary object URL, and embeds it in the preview. This keeps preview and download identical without schema changes.
2. **Persist permanent PDF files and URLs.** This would improve cross-device direct linking but requires storage lifecycle, permissions, schema, and cleanup work outside this feature.

## Selected interaction

After chat state loads and is already complete, the completion dialog identifies the specialist and says the answers are already finished and saved. **View PDF** is the primary action and navigates to `vault.html?agent=<key>&preview=pdf`, including project/session identifiers when applicable. **Retry answering** opens the current retry confirmation; only an explicit confirmation clears the specialist interview.

The Vault uses the route to select the specialist's latest artifact, retains its normal library/detail UI, and opens a PDF viewer over that context. The viewer contains a title, preparation status, embedded PDF surface, download action, and close action. Closing it returns the user to the selected Vault artifact without regenerating or downloading anything.
