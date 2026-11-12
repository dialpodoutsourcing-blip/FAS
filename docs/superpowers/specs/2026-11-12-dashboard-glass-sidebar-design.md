# Dashboard Glass Cards and Sidebar — Design

## Intent

Match the supplied card and sidebar references as closely as possible using native HTML, CSS, and SVG. The result should feel like dark smoked glass illuminated from within, while preserving the existing dashboard data, destinations, accessibility, and one-screen desktop layout.

## Goals

- Rebuild both roadmap cards with translucent smoky depth, soft internal haze, restrained gold/emerald edge bloom, luminous platform rings, brighter emblem halos, and illuminated lower corners.
- Match the narrow sidebar hierarchy: compact FAS brand, gold-glass active Dashboard row, quiet secondary rows, divider, specialist icon/title/subtitle/chevron rows, lower atmospheric curves, and one unified account/sign-out glass panel.
- Replace sidebar `Review` and `Locked` copy with the reference-style descriptive subtitles and simple right chevrons. Roadmap cards retain their real completion/lock state and actions.
- Preserve the 1508×782 one-screen composition and responsive fallbacks.

## Non-goals

- No generated raster smoke texture, new framework, or canvas effect.
- No changes to specialist state, authentication, navigation destinations, or account data.
- No redesign of the focus banner, header, Vault, chat, or review pages.

## Constraints and Anti-goals

- Use native layered gradients, pseudo-elements, SVG, blur, opacity, and shadows only.
- Decorative haze must stay clipped inside its card/sidebar and must not intercept input.
- The styling must not become bright, cloudy, flat, or neon-heavy. The reference is mostly black with localized light.
- Text, actions, and footer content must remain readable and reachable at all tested breakpoints.

## Approaches

1. **Native layered glass — selected.** CSS gradients, blur, masks, pseudo-elements, and existing transparent card artwork produce scalable glass and smoke while keeping the build light.
2. **Raster smoke textures.** Potentially richer haze, but less responsive, heavier, and not selected.

## Implementation Shape

- Add semantic decorative layers/hooks only where CSS pseudo-elements are insufficient.
- Refine the sidebar specialist markup so each row exposes a title, descriptive subtitle, and accessible decorative chevron; update the dashboard renderer so state changes do not overwrite that structure.
- Consolidate sidebar footer styling into one glass account shell with the sign-out action visually nested inside it.
- Build each roadmap card from several contained native layers: top haze, central bloom, platform light, edge reflection, and lower-corner flare. Gold and emerald variants share geometry but use their own color variables.
- Add geometry/static contracts before implementation, verify the intended RED failure, then implement and run focused, responsive, full-suite, build, and screenshot checks.

## Acceptance

- At 1508×782, the page remains fully visible without vertical or horizontal scrolling.
- Sidebar specialist rows show reference-style subtitles and chevrons, not `Review`/`Locked` labels.
- Sidebar lower atmosphere and account shell remain contained and visible.
- Both cards visibly expose glass/haze layers and localized colored edge lighting without reducing text contrast.
- Existing dashboard state and navigation tests remain green.
