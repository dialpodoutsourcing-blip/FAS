# Continuous Talk Voice Design

## Intent

Talk should feel continuously available and unmistakably alive. Users should never land in a user-visible paused state while Talk is selected, and the orb should communicate listening versus ADAM speaking without relying on oversized text.

## Behavior

- Entering Talk starts voice and keeps the session active until the user explicitly chooses Type, End, navigation, or completion.
- The microphone button is a non-toggle live indicator while Talk is active. It cannot pause listening.
- Internal echo protection during ADAM playback or durable saving may suppress capture, but it must automatically return to listening and must never publish `paused` as the user-facing state.
- Spoken `pause` requests are acknowledged as unsupported in hands-free Talk and return immediately to the unchanged question/listening state.
- Listening uses a slow continuous halo/ripple and restrained core drift. Hearing uses a more responsive ripple/waveform. Speaking uses a stronger, faster core pulse and rotating ring; the user waveform remains reserved for user speech.
- The central state label is compact and short: `Listening`, `Hearing you`, `Thinking`, or `ADAM speaking`.
- Reduced-motion users receive static but visually distinct state styling.

## Constraints

- Preserve interruption/barge-in behavior supported by the Realtime interviewer.
- Preserve Type and End as explicit exits and preserve recovery controls for genuine connection failures.
- Do not change answer saving, question progression, or raw-audio persistence.
- Reuse the existing state attributes and CSS; add no animation library.

## Approaches

1. **Continuous Talk state with internal capture suppression (selected):** keep Talk logically active, remove pause toggles, auto-resume after internal suppression, and style existing states distinctly. This preserves echo handling and hands-free behavior.
2. **Never suppress microphone capture:** simplest state model, but risks ADAM transcribing his own output and creating false turns.
3. **Cosmetic-only relabeling:** low effort but leaves the actual paused-state bug and dead microphone behavior intact.

## Verification

Source/state tests must prove no Talk control path toggles into paused, internal work returns to listening, state copy is compact, and CSS differentiates listening/hearing/speaking including reduced motion. Existing Realtime, Talk flow, geometry, accessibility, and full regression suites must remain green.
