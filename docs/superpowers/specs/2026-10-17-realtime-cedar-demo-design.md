# Realtime Cedar Guided Demo Design

## Goal

Make the FAS guided demo sound like the natural ADAM experience in `C:\vibec\adam` by replacing request-based TTS and robotic browser fallback with an output-only Realtime Cedar session. Begin the demo with ADAM introducing himself and then introducing FAS.

## Confirmed Experience

- Clicking **Help me / Demo** remains the only start gesture.
- ADAM begins speaking only after the first real tutorial target is ready.
- Step 1, **Meet ADAM**, introduces ADAM as the user's guide for turning experience into an authority system.
- Step 2, **Welcome to FAS**, introduces the Fitness Authority System, seven specialists, connected workflow, Vault, and Launch Plan.
- The remaining existing walkthrough continues in order, including the safe Talk demonstration.
- The tutorial grows from 22 to 23 steps: one new ADAM introduction plus a rewritten FAS welcome step.
- Captions remain visible and authoritative while ADAM delivers a short, natural, speech-first version.
- The header continues to disclose that the voice is AI-generated.

## Why Realtime

The current FAS path uses the Speech API to read fixed UI copy and silently falls back to browser speech synthesis. The Adam project instead uses a persistent WebRTC Realtime session whose model generates spoken delivery directly. Cedar is only the voice identity; the Realtime model and speech-first response generation produce the more human pacing, emphasis, and phrasing.

## Architecture

### Server session endpoint

Replace `POST /api/narration` with `POST /api/realtime-session`. The browser sends a JSON SDP offer. The FAS server validates the same-origin local request and the offer size, then creates an OpenAI WebRTC session using the server-only API key.

The session configuration is output-only and fixed server-side:

- model: `gpt-live-1`, matching the working Adam project
- output voice: `cedar`
- no input transcription
- no VAD or automatic response creation
- no tools
- no microphone requirement
- a voice-system instruction defining ADAM's warm, intelligent, grounded, conversational delivery

The server returns only the session ID and SDP answer or sanitized JSON errors. The API key never reaches the browser. `C:\vibec\adam` remains read-only.

### Output-only browser connection

Create `assets/js/realtime-narrator.js` as a focused module. `createRealtimeNarrator(options)` owns one `RTCPeerConnection`, one receive-only audio transceiver, one `Audio` element, and one `oai-events` data channel.

It must not call `getUserMedia`, add a local media track, or enable microphone permissions. The receive-only transceiver ensures the SDP negotiates remote audio.

Connection lifecycle:

1. The Help/Demo click creates the narrator and begins the WebRTC handshake.
2. The browser creates an SDP offer and sends it to `/api/realtime-session`.
3. After the data channel reports the session ready, queued narration may begin.
4. A step submits speech-first source material and a strict instruction to deliver only that step's short narration.
5. Remote Cedar audio plays through the managed audio element.

If the connection fails, the tutorial remains fully usable and displays **Narration unavailable — captions are still available**. It must not silently switch to native speech synthesis.

### Speech-first narration

Each tutorial step gains a `speech` field separate from its visible `description`. The speech copy uses contractions, short sentences, direct address, and natural transitions. It conveys the same facts but is not a word-for-word reading of the interface card.

The Realtime request instructs ADAM to preserve meaning, speak conversationally, and avoid adding facts, greetings, or closing questions not present in the step. The first two scripts are explicit:

- **Meet ADAM:** “Hi, I'm ADAM. I'll guide you through FAS and help turn what you know into a clear authority position, useful business assets, and a system you can confidently launch.”
- **Welcome to FAS:** “FAS is your Fitness Authority System. Seven specialist agents work together here—from finding your position and story to building your program, messaging, and launch plan. Everything they create stays connected in your Vault.”

### Cancellation and controls

- Next, Back, chapter changes, Skip, Close, Finish, and unload send response cancellation and immediately pause current playback.
- Mute pauses the remote audio track without closing the session; Unmute narrates the current step from the beginning.
- Replay cancels any active response and requests the current step again.
- A monotonically increasing response token prevents late events from changing current UI state.
- Closing the tutorial requests graceful session close, then closes the channel, peer, and audio stream after a short timeout.
- Reopening creates a fresh session and resets Mute, status, and pending narration.

## Tutorial UI

The header adds a compact status beside the disclosure:

- Connecting ADAM…
- ADAM ready
- ADAM speaking
- Muted
- Narration unavailable — captions are still available

The first two steps use the existing live Dashboard page and spotlight rather than a fake intro screen. This preserves the user's requirement that the demo always show the real product.

## Security and Safety

- Standard OpenAI key remains only in ignored `.env`.
- Reject unexpected Origin headers except the local FAS origin.
- Limit SDP request size.
- Use a fixed server-side session configuration; the browser cannot choose model, voice, tools, or instructions.
- Do not request microphone access anywhere in the narrator.
- Keep the protected tutorial iframe and Talk visual-only simulation unchanged.
- Sanitize upstream failures and never return or log credentials or upstream bodies.

## Files

- Create: `assets/js/realtime-narrator.js`
- Modify: `server.js`
- Modify: `assets/js/tutorial.js`
- Modify: `assets/css/styles.css`
- Modify: all HTML pages to load the narrator before `tutorial.js`
- Modify: `README.md`
- Create/modify tests for server session configuration, output-only WebRTC lifecycle, 23-step copy, status UI, safety, and regressions
- Remove the obsolete Speech API route and hybrid TTS narrator after Realtime tests are green

## Testing

- Server tests verify the fixed `gpt-live-1`/Cedar session, SDP validation, origin restrictions, sanitized errors, and no microphone/input configuration.
- Narrator unit tests use injected peer, audio, fetch, and timers to verify receive-only negotiation, queued speech, response events, cancellation, Replay, Mute, close, failure status, and stale-event suppression.
- Static safety tests prohibit `getUserMedia`, `addTrack`, browser speech synthesis, and `/api/narration` in the new Realtime path.
- Tutorial tests verify 23 steps, ADAM first, FAS second, speech-first copy on every step, and the existing Talk step.
- Local integration creates a real session, confirms a valid SDP answer, and verifies remote audio without any microphone permission prompt.
- Full existing static, agent, sidebar, Vault, tutorial geometry, and protected-frame tests remain green.

## Source Basis

Official OpenAI guidance recommends WebRTC for browser voice connections, requires the standard API key and session configuration to stay on the trusted server, carries generated speech on negotiated media tracks, and uses the data channel for session commands. The receive-only design intentionally omits the microphone portion of the general voice-agent example.
