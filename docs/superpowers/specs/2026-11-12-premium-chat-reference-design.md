# Premium Chat Reference Design

## Intent

Restyle the existing FAS interview chat to match the supplied black, gold, and teal reference as closely as possible so the chat feels like the same premium product as the dashboard. Preserve the interview engine and all existing Type, Talk, persistence, authentication, and completion behavior.

## Goals

- Reproduce the reference's sharp gold geometry, glass surfaces, glow, sidebar, identity header, segmented mode switch, progress rail, alternating messages, quick suggestions, composer, and one-screen desktop density.
- Keep the current dynamic agent names, stages, messages, hints, answer submission, voice handoff, drawers, and completion actions wired to their existing selectors.
- Adapt faithfully below desktop without horizontal clipping or inaccessible controls.

## Non-goals and anti-goals

- Do not change interview sequencing, AI calls, persistence, authentication, or database behavior.
- Do not pretend that decorative reference controls provide unsupported attachment, browsing, or tools features.
- Do not make desktop content require page scrolling at the 1680×945 reference viewport; the conversation thread may scroll internally.

## Constraints

- Use the existing HTML/CSS/JavaScript stack and native SVG/CSS assets.
- Preserve existing `data-*` hooks used by controllers and tests.
- Treat the supplied screenshot as the desktop source of truth.
- Leave the unrelated `anchor-window-test.png` untouched.

## Approaches

1. **Selected: rebuild the chat presentation layer around the existing behavior hooks.** Adjust `chat.html` semantics and add page-scoped CSS while retaining controller selectors. This best matches the reference without risking interview behavior.
2. Apply CSS only to the current markup. Lower risk, but the current utility bar and composer hierarchy cannot reproduce the reference closely enough.
3. Replace the chat page and controller together. Maximum freedom, but it needlessly risks working interview, persistence, and voice behavior.

## Design decisions

- Desktop uses a fixed premium sidebar and a four-row chat shell: identity toolbar, progress stages, conversation, composer/completion area.
- Utility actions that already work remain available but visually subordinate; reference-only unsupported actions are not presented as functional.
- Existing hint buttons become the Quick Suggestions strip.
- Messages use gold left-aligned agent glass cards and teal right-aligned user cards, with compact identity medallions and timestamps only where real timestamps exist.
- Gold sharp accents use clipped corners, thin borders, focused highlights, and controlled bloom rather than broad gradients.

