# Dynamic My Vault Design

## Intent

Replace the fictional demo vault with a simple library of the signed-in user's real finished work. A user must be able to recognize each saved document, inspect its exact content, and download a PDF generated from that same artifact version.

## Goals

- Show only real artifacts belonging to the active project.
- List only the latest version of each completed specialist artifact.
- Include both completed drafts and user-approved artifacts, with approval status clearly labeled.
- Download the exact listed artifact through the existing authenticated export service.
- Make navigation understandable without tabs, locked specialists, or demo content.
- Provide a useful empty state when no finished artifacts exist.

## Non-goals

- Do not display interview progress, unfinished answers, locked specialists, or future deliverables.
- Do not retain fictional Freedom Builderz, strength-coach, or demo PDF content.
- Do not add â€œdownload everythingâ€ in this pass.
- Do not change the premium PDF renderers or artifact approval rules.
- Do not expose retired artifacts as current work.

## Approaches

### Clean artifact library â€” selected

Render one card per latest saved artifact with its specialist, title, version, status, short content summary, and direct actions. This is the clearest model because the number of visible items always matches the user's finished work.

### Compact download list

Show only titles and download buttons. This is simpler but gives users no way to confirm what they are exporting.

### Dynamic tabs

Generate tabs only for saved artifacts. This preserves the old structure but remains harder to scan and navigate, especially on narrow screens.

## Data and Filtering

My Vault loads the authenticated project through `project-store`. Retired parent artifacts are already excluded by the Supabase store. The controller groups `artifactVersions` by active artifact ID and selects the latest version matching each active artifact's `currentVersion`. It renders an item only when the version has document sections and the artifact exists as active current work.

Status is derived from the exact version: `user_approved` displays as **Approved**; a saved current draft displays as **Completed**. Older versions remain in persistence but do not appear as separate Vault items.

The list follows specialist step order so ANCHOR appears before EXTRACT. If no eligible items exist, Vault shows one empty state with a **Start ANCHOR** action.

## Interaction

The default view is the artifact library. Each card includes:

- specialist name and document title;
- **Approved** or **Completed** status;
- version number;
- a short summary derived from the first meaningful saved section, never placeholder/demo copy;
- **View document**;
- **Download PDF**;
- **Edit with [specialist]**.

**View document** expands that artifact inside My Vault using the existing live artifact renderer. A clear **Back to My Vault** control returns to the library without a page reload. This keeps the user oriented while reusing the real document presentation.

**Download PDF** passes the card's exact selected version to `/api/exports`, including its premium report and export theme. The action shows preparing, success, and failure states. It must never point to a bundled PDF file. Premium ANCHOR and EXTRACT artifacts therefore use their existing specialist-specific PDF renderers.

**Edit with [specialist]** opens the correct chat route with the active project/session context.

## Page Structure and Copy

The header becomes:

- Eyebrow: `YOUR COMPLETED WORK`
- Heading: `My Vault`
- Supporting copy: `View and download the documents you have completed in FAS.`

Remove the seven demo tabs, fictional completion banner, static specialist panels, demo disclaimer, and â€œDownload everything.â€ The library uses a responsive single-column stack with compact cards, clear status badges, and one primary action per task.

## Error and Loading States

- While loading: show one neutral `Loading your completed workâ€¦` state.
- No artifacts: explain that completed documents will appear here and link to ANCHOR.
- Load failure: show a retry action without revealing stale demo content.
- Export failure: keep the card usable and display a concise inline error.

## Accessibility

- Cards are semantic articles with labeled headings.
- Expanded document focus moves to its heading; returning restores focus to the originating View button.
- Status is visible text, not color alone.
- Buttons expose busy/disabled state while exporting.
- The library and expanded document remain keyboard navigable at narrow and desktop widths.

## Success Criteria

- A user with only one completed ANCHOR artifact sees exactly one ANCHOR card.
- A user with completed ANCHOR and approved EXTRACT sees exactly two correctly labeled cards.
- No fictional/demo business content or static demo PDF URL is present in My Vault.
- Each PDF request contains the exact artifact/version displayed on its card.
- Premium ANCHOR downloads render the generated ANCHOR report, not the generic fallback.
- Retired, missing, locked, and unfinished specialist work is absent.
- Empty, loading, error, desktop, narrow, and keyboard behavior are covered.

