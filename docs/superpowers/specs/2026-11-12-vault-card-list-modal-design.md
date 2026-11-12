# Vault Card/List and Modal Preview Design

## Intent

Make My Vault feel like a simple document library instead of a long report page. Users should be able to scan finished work quickly, choose a compact card or list layout, and preview the complete saved document without losing their place.

## Goals

- Default to a clean card grid with short, controlled summaries.
- Provide an obvious Cards/List view toggle and remember the choice in the browser.
- Use the same large, scrollable preview modal from either layout.
- Keep status, specialist, title, and version easy to scan.
- Put Preview, Download PDF, and Edit actions in predictable places.
- Preview and download the exact saved artifact version selected by the user.
- Work well on desktop, tablet, and mobile, including keyboard navigation.

## Non-goals and anti-goals

- Do not show full document paragraphs inside library cards or rows.
- Do not restore fictional examples, specialist tabs, or generic PDFs.
- Do not add a second document renderer or change persistence/export APIs.
- Do not hide essential actions behind ambiguous icons.

## Chosen approach

Use a compact toolbar above the library with a two-button Cards/List toggle. Card view is the default and uses a responsive grid; list view uses dense horizontal rows. The selected layout is stored locally and restored on the next visit. Both layouts use the existing current-artifact selection and exact-version export logic.

Selecting Preview opens a wide modal with a clear title, specialist/status/version metadata, the existing saved-document renderer, and a sticky action header containing Close, Download PDF, and Edit. The page behind the modal stays in place. Closing returns focus to the button that opened it. On narrow screens, the modal becomes nearly full-screen and actions stack safely.

## Alternatives considered

- Automatic cards on desktop and list on mobile: simpler, but removes user choice.
- List-first file manager: denser, but visually flatter and less suitable for a premium document library.

## Constraints and builder calls

- Reuse `vault-library.js`, authenticated project loading, and `/api/exports`.
- Summaries are clamped in card view and shortened further in list view.
- Use semantic buttons and an accessible native dialog where supported, following the project’s existing modal patterns.
- Keep duplicate-card and duplicate-export protections intact.
- Update source and generated `public/` assets together, with regression tests for view persistence, modal focus, exact-version preview/export, and responsive structure.
