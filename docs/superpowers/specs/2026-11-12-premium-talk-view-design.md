# Premium Talk View Design

## Intent

Rebuild the FAS Talk panel to match the supplied voice-interview reference while using a predominantly black and sharp-gold visual system with only restrained green status accents.

## Layout

- Keep the existing shared sidebar, ADAM header, Type/Talk switch, progress stages, and authentication behavior.
- Use a wide glass voice stage with three columns: live-process/transcript HUD, central microphone orb and waveform, and compact voice-analysis HUD.
- Place the current ADAM question in a full-width glass card beneath the stage.
- Place voice status, privacy, and recovery controls in a compact utility band.
- Anchor the existing live transcript and real microphone/end/type controls at the bottom.
- Omit Attach, Browse, and Use Tools because they are not supported.

## Visual System

- Background: near-black layered glass and smoke-like gold illumination.
- Primary accent: crisp warm gold borders, rings, waveform, and active controls.
- Green: limited to small live dots, a few waveform bars, and subtle analysis status text.
- Preserve reduced-motion behavior and legible contrast.

## Behavior

All existing voice state, transcript, microphone, stop, Type fallback, retry, saving, question progression, and completion-modal hooks remain unchanged.

## Responsive Rules

- Desktop: three-column voice stage and one-screen composition.
- Tablet/mobile: HUDs collapse out, central voice stage remains prominent, question/transcript/controls remain reachable without horizontal overflow.

## Approach

Chosen: reuse and restyle the existing semantic HTML and voice hooks with native CSS, adding only layout wrappers/classes where necessary. This preserves tested behavior and avoids nonfunctional decorative controls.

