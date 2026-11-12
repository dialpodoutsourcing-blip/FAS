# Dashboard Detail Polish Design

## Intent

Bring the live dashboard’s small visual details up to the supplied reference quality while preserving the existing one-screen desktop layout. The result should feel like the reference at first glance and under close inspection, rather than merely sharing its structure and colors.

## Goals

- Keep the complete dashboard visible without scrolling at the user’s effective 1508×782 CSS viewport.
- Rebuild the progress gauge so `02 / 2` and “Your Progress” remain fully visible and centered.
- Match the sidebar’s spacing, gold active state, specialist icons, two-line labels, review actions, saved indicator, account panel, settings control, and Sign Out button.
- Strengthen the teal/gold header wave, focus-panel mountain, gold CTA, status label, and View Details treatment.
- Restore roadmap-card descriptions, luminous platforms, borders, lower-corner glows, state pills, and right-side actions.
- Match the Quick Access rows and the Keep Going panel’s chart icon, gold glow, and curved bottom flourish.
- Preserve current navigation, authentication, dashboard state, accessibility, and mobile behavior.

## Non-goals

- No changes to Supabase, project data, specialist progression, routing, or entitlement behavior.
- No redesign of Vault, Chat, Review, or other pages.
- No replacement of functional UI text with a single flattened screenshot.

## Constraints

- Functional controls and text remain semantic HTML/CSS so they stay sharp, accessible, and data-driven.
- Decorative imagery may not intercept clicks or create page overflow.
- The 1920×1080 reference layout and mobile breakpoints must remain valid.
- Windows/browser scaling must not reintroduce scrolling or clipped descendants.

## Approaches

### Selected: Hybrid rebuild

Use HTML/CSS/SVG for the gauge, icons, labels, panels, buttons, glows, and card details. Use dedicated raster artwork only where it materially improves fidelity: the header wave, focus landscape, and decorative gold/teal flourishes. This provides the closest reference match without sacrificing responsiveness or accessibility.

### Rejected: CSS-only recreation

This would be lighter, but the organic wave, mountain atmosphere, and luminous decorative effects would continue to look approximate.

### Rejected: Flattened dashboard image

This could visually match one screenshot but would break responsive behavior, accessibility, dynamic customer data, and functional controls.

## Component Treatment

- **Sidebar:** retain the current navigation structure, add the missing Sign Out control, and tune exact dimensions, typography, icon glows, review arrows, footer wave, and account-card hierarchy.
- **Hero:** layer a generated transparent decorative wave behind the live heading and controls; preserve readable contrast and the current dynamic customer name.
- **Focus panel:** repair the semicircle gauge geometry; use a decorative landscape layer; keep status, CTA, progress rail, and links as functional elements.
- **Roadmap cards:** keep the generated Anchor and Extract platform artwork; restore the reference copy density and footer states inside the compact height.
- **Utility rail:** tune the three quick actions and replace the simplified encouragement mark with a code-native chart icon plus a decorative lower gold curve.

## Verification

- Add geometry assertions for the gauge, sidebar footer/Sign Out, card descriptions and actions, utility panel, and all key descendant containment at 1508×782.
- Preserve checks at 1920×1080, short-height fallback, desktop breakpoint boundary, and mobile widths.
- Run the full automated suite, production build, visual capture at the target viewport, code review, then merge and deploy after approval.
