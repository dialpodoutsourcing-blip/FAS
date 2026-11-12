# Chat Bottom Composer Design

## Intent

Keep the Quick Suggestions strip and message composer aligned to the bottom of the available chat workspace at all times, including when the conversation is empty or contains only one prompt.

## Design

Use the existing native CSS grid. The chat shell has three in-flow rows—header, progress, and workspace—because the utility menu is absolutely positioned. Define exactly those three rows so the workspace receives all remaining viewport height. Inside it, retain the existing panel grid: a flexible, scrollable conversation row followed by Quick Suggestions, composer, and the optional review action.

## Constraints

- Preserve the one-screen desktop layout and responsive mobile behavior.
- Keep the conversation scrollable rather than allowing the composer to move off-screen.
- Do not use fixed or absolute positioning for the composer.
- Do not change the visual design or the propagation gate.

## Approaches

- Chosen: correct the shell from four grid rows to three. This fixes the source of the unused space with one structural CSS change.
- Rejected: absolutely position or sticky-position the composer. This would overlap messages and complicate mobile sizing.
- Rejected: add JavaScript height calculations. CSS already has the required layout primitives and is more reliable during resize.

