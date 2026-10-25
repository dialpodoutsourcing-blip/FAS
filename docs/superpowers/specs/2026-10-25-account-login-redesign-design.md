# FAS Account Login Redesign

## Intent

Turn the current oversized account screen into a premium FAS entry experience that fits inside one standard desktop viewport without scrolling. Preserve the established black, ivory, and gold visual system while making the form and account states feel deliberate and easy to scan.

## Goals

- Fit signup, sign-in, recovery, confirmation, migration, and error states inside `100dvh` on ordinary laptop and desktop screens.
- Keep the split-screen brand composition, with a compact story area and a clearly contained account panel.
- Render the FAS wordmark at an approximately 850 font weight.
- Reduce the oversized headline and improve hierarchy, spacing, borders, contrast, and button treatment.
- Keep every existing authentication control, accessible label, state hook, and JavaScript behavior intact.
- Adapt cleanly across wide desktop, laptop, tablet, and mobile widths.

## Non-goals

- No authentication-flow or Supabase behavior changes.
- No new illustration, external image, or dependency.
- No redesign of the dashboard or specialist screens.

## Constraints and safeguards

- Desktop account views use a locked one-screen composition with no page scroll.
- On unusually short screens and small mobile devices, controls may scroll rather than becoming clipped or unreachable.
- Error and migration states use the same account card and must not introduce large page-breaking typography.
- Existing FAS fonts, colors, and background geometry remain the visual foundation.

## Approaches considered

1. **Refined split-screen — selected.** A compact editorial brand panel beside a premium contained account card. This preserves the distinctive FAS identity while solving the scale and scrolling problems.
2. **Centered account card.** Simpler and compact, but removes too much of the authority-system story.
3. **Single compact column.** Most utilitarian, but too generic for a paid premium product.

## Selected design

Use a roughly 42/58 desktop split. The left side carries the heavier FAS wordmark, a shorter controlled headline, one concise supporting statement, and three compact proof points. The right side centers a bordered, subtly layered account card with the mode tabs, active form or state, status message, and privacy note. Vertical spacing and input heights scale with viewport height so the full signup state remains visible on common laptop screens. Mobile collapses to a compact brand header above the card, with safe scrolling only when the viewport cannot physically contain all controls.

## Verification

- Add static assertions for the viewport-height shell, desktop overflow rule, responsive short-screen escape hatch, contained card, and wordmark weight.
- Run the focused account-page test in RED and GREEN states.
- Run the full test suite and production build.
