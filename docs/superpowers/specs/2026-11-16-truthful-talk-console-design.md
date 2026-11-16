# Truthful Talk Console Design

## Intent

Replace the decorative Talk console readouts with truthful interview and voice-session information, and make the central animations correspond to real speech activity.

## Goals

- The left panel shows real interview progress derived from accepted answers and the current question.
- The right panel shows only measured runtime data from the current voice session.
- The center waveform animates only while the user is actually speaking.
- The orb animates only while ADAM is actually speaking.
- Idle, connecting, thinking, paused, stopped, and error states remain visually still.

## Non-goals

- Estimating audio “clarity,” decibels, noise-gate state, or buffer latency without a trustworthy measurement source.
- Persisting raw audio or adding audio analytics.
- Changing interview questions, answer validation, or persistence behavior.

## Selected approach

Add an explicit `hearing` state for Realtime `speech_started`/`speech_stopped` events, while retaining `speaking` for ADAM playback. Drive CSS animation from those states rather than microphone availability. Populate both HUDs through named DOM fields updated by the existing interview and Realtime event flows.

Alternatives rejected:

- Microphone-on animation: simpler, but it moves during silence and is therefore not truthful.
- Audio analyser metrics: can measure input energy, but adds processing complexity and still cannot honestly infer clarity or noise-gate quality.

## Left panel: interview progress

The panel is no longer decorative. It shows:

- accepted answers count;
- current question position and total question count;
- processed-question count;
- latest accepted question/field label, or a truthful waiting state before the first answer.

Values are refreshed after persistence restoration, after every accepted save, and when navigation changes the current question.

## Right panel: live session data

The panel shows only data observed by the application:

- session state (`CONNECTING`, `READY`, `HEARING`, `ADAM SPEAKING`, `PAUSED`, `ENDED`, or `ERROR`);
- microphone state (`ACTIVE` or `PAUSED`);
- current transcript word count;
- finalized voice-turn count.

The counters reset for a new page/session and update from actual transcript and Realtime lifecycle callbacks.

## Animation behavior

- `hearing`: waveform bars animate; orb remains still.
- `speaking`: orb animates; waveform remains still.
- every other state: both remain still.
- ambient decorative motion inside the side panels is removed or paused so stopped/idle views do not imply live processing.

Reduced-motion preferences continue to disable all animation.

## Accessibility and testing

The HUDs remain visually supplemental but their visible copy must be truthful. Tests cover Realtime state transitions, real HUD field wiring, restoration/save updates, and CSS selectors proving that only `hearing` animates the waveform and only `speaking` animates the orb.
