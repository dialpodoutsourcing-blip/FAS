# Hands-free Talk acceptance

## Release behavior

Talk and Type share one interview state and one durable save path. A spoken answer is not advanced until its answer and checkpoint are stored. ADAM then acknowledges a concrete detail, asks the exact engine-selected next question, and speaks that same visible copy. Microphone audio is sent to OpenAI for live transcription under the account's standard API data controls; FAS stores the finalized transcript, not raw microphone audio. This is not a zero-data-retention guarantee.

The Realtime session uses Cedar output, `gpt-4o-mini-transcribe` input transcription, low-eagerness semantic VAD, server-side response creation disabled, and interruption enabled. ADAM only speaks application-supplied copy. Standalone voice commands—“repeat the question,” “pause,” “switch to typing,” and “end”—are controls and are never saved as answers.

## Compatibility and recovery matrix

| Scenario | Expected behavior | Automated coverage |
|---|---|---|
| Permission allowed | One mic click unlocks playback, requests enhanced audio, and opens an authenticated send/receive session. | Controller + server tests |
| Permission denied or API unavailable | The orb and status report the failure; **Retry voice** and **Type instead** remain available. | Controller + static UI tests |
| First audio playback | Playback is unlocked in the initiating mic gesture; a later playback rejection exposes recovery instead of pretending ADAM spoke. | Controller tests |
| Normal answer | Interim text is visible, the final normalized turn renders once, and the answer/checkpoint save atomically. | Controller + coordinator + flow tests |
| Thoughtful pause | Low-eagerness semantic VAD waits for a semantically complete turn; partial text is never synthesized into a final answer. | Server-config + controller tests |
| Barge-in | New user speech cancels active output and returns the controller to listening. | Controller tests |
| Repeat | A standalone repeat command speaks the current exact question and is not persisted. | Flow tests |
| Pause/resume | Pause disables every local microphone track. Only an explicit resume re-enables it. | Controller + flow tests |
| Switch to Type | Voice pauses and any unfinished partial transcript transfers into the Type composer without being saved. | Controller + flow tests |
| Background/foreground | Hidden or pagehide pauses the mic. Returning to the foreground never auto-enables it. | Controller tests |
| End | Finalized work already in flight is awaited, then tracks, channel, peer, and audio resources close once. | Controller + flow tests |
| Connection/transcription error | No partial answer is persisted; truthful recovery copy keeps Type available. | Controller + flow tests |
| Save failure | The exact prior checkpoint is restored and the spoken text is placed in Type for safe retry. | Coordinator + flow tests |
| Reply failure | The durable answer remains saved and the exact engine-selected question is used as the fallback. | Coordinator tests |
| Completion | Mic input pauses, the existing completion copy is spoken once, artifact generation stays single-flight, and review receives agent/project/session context. | Flow tests |

## Browser/OS target

The implementation targets current Chrome and Edge on Windows/macOS, Firefox on Windows/macOS/Linux, Safari on macOS, Chrome on Android, and Safari on iOS/iPadOS. It uses standards-based `getUserMedia`, WebRTC, media tracks, and page lifecycle events. Browsers without the required APIs degrade to Type without losing interview state.

## Verification record — 2026-10-25

- Automated Node suite: controller, coordinator, authenticated Realtime route, UI wiring, persistence, completion, build, and regression coverage.
- Windows host: Microsoft Edge 156.0.4314.42 was exercised headlessly with Playwright and a browser-provided fake microphone. The real page loaded without runtime errors, one mic click completed the live Realtime SDP handshake with HTTP 200, ADAM delivered the orientation/question cycle, and the controller returned to `listening` with no recovery state. A second no-key run verified truthful connection recovery and a working **Type instead** transition. This environment did not provide a trustworthy physical-microphone or audible-output check.
- Chrome, Firefox, Safari, macOS, Linux, Android, iOS, and iPadOS devices were not available in this execution environment. They are release targets, not falsely recorded as manually exercised.
- Production verification must confirm the deployed assets contain `interview-coordinator.js` and `realtime-interviewer.js`, and that the interview session endpoint rejects unauthenticated configured requests without leaking server credentials.

## Manual device pass

On each available release device, sign in, open one unfinished specialist, choose Talk, and confirm: permission allow/deny; audible orientation; one natural answer with a long pause; barge-in; repeat; pause/resume; partial transfer to Type; background/foreground; network interruption; completion copy; automatic review redirect; and a matching answer/checkpoint row in Supabase. Use a test project and remove its test data through the normal project reset workflow.
