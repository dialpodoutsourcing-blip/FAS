# Dashboard Reference Reconstruction Design

## Intent

Rebuild the authenticated Dashboard to closely match the supplied reference image while preserving FAS’s real user, project, specialist-access, and progress behavior. The result should feel like the reference—not merely borrow its colors.

## Goals

- Reproduce the reference hierarchy: illuminated sidebar, welcome header, active-step banner, roadmap cards, quick-access panel, and progress encouragement card.
- Match the premium black, gold, and emerald visual language with glass surfaces, fine borders, curved light trails, controlled glows, and strong typography.
- Keep live account name/business, specialist availability, completion state, active step, progress, and navigation routes.
- Use the two currently included specialists as the primary roadmap, while preserving entitlement-driven behavior for any future available specialists.
- Maintain accessible text contrast, keyboard navigation, visible focus, semantic headings, and reduced-motion support.
- Adapt the desktop composition into a clean tablet/mobile experience without horizontal overflow.

## Non-goals and anti-goals

- Do not turn the screenshot into a background image or ship copied raster text/UI.
- Do not hard-code “Michael Diala,” completion counts, or specialist state.
- Do not change authentication, project persistence, entitlements, interview logic, or API contracts.
- Do not redesign My Vault, chat, review, launch, or account pages in this change.
- Do not add a new UI framework or runtime dependency.

## Chosen approach

Perform a full dashboard reconstruction using the project’s existing vanilla HTML, CSS, and JavaScript. Replace the dashboard’s main content structure with a reference-matched composition and add dashboard-specific styles that do not alter the other protected pages.

The left sidebar keeps the current routes and dynamic specialist links but adopts the reference treatment: prominent FAS identity, large active navigation item, compact specialization rows, and a framed account/sign-out card. The main area uses a welcome header with system status, a wide active-step banner, a roadmap region containing specialist cards, and a right utility column.

The active-step banner derives its title, specialist, description, count, progress, and main action from the existing project state. Roadmap cards derive complete/current/locked state and routes from the current access/progression helpers. Quick-access links route to the existing tutorial, Vault, and ADAM experiences. Decorative light trails, mountain-like silhouette, orbit rings, and icon glows are CSS/SVG presentation only and remain non-interactive.

## Responsive behavior

- Wide desktop: fixed sidebar, main roadmap grid, and right utility column matching the reference proportions.
- Medium desktop/tablet: utility column moves below the roadmap; specialist cards remain two columns when space permits.
- Mobile: sidebar uses the existing drawer behavior, header/actions stack, progress banner becomes vertical, and roadmap cards become one column.
- Long names and labels wrap or clamp safely; no essential action is clipped.

## Alternatives considered

- Visual reskin of the current layout: rejected because it would not reproduce the reference composition.
- Screenshot-as-background reconstruction: rejected because it would be inaccessible, non-responsive, and disconnected from live data.

## Constraints and builder calls

- Reuse existing account context, dashboard progress logic, agent registry/access, navigation, icon symbols, and tutorial trigger.
- Prefer CSS gradients, pseudo-elements, and existing SVG emblems; do not require generated bitmap assets.
- Scope new selectors under the dashboard page to prevent regressions elsewhere.
- Keep source and generated `public/` files synchronized through the existing build.
- Add regression coverage for dynamic state, routes, responsive breakpoints, long account names, and absence of hard-coded reference data.
