# Hands-Free Guided Interview Design

## Intent

Turn the existing Talk tab into a real, hands-free interview with ADAM. A user taps the microphone once, speaks naturally, hears a specific acknowledgement and the next appropriate prompt, and continues until the current specialist is complete. Voice and Type are two inputs to one durable interview—not separate conversations.

The experience should feel like a skilled interviewer facilitating reflection, not a voice form reading questions aloud. ADAM listens without interrupting thoughtful pauses, recognizes useful details, probes when an answer is thin or ambiguous, periodically reinforces what has been captured, and clearly announces completion before the existing blueprint-generation flow.

## Goals

- Keep one interview state, checkpoint, answer history, and completion flow across Type and Talk.
- Start a hands-free session with one microphone tap and continue until End, pause, mode switch, failure, or interview completion.
- Use semantic turn detection so natural pauses are less likely to be mistaken for the end of an answer.
- Show live/interim transcript text, but submit only a finalized spoken turn.
- Save each spoken answer through the same atomic answer-and-checkpoint operation as typed chat.
- Let the existing interview engine select guided questions, adaptive probes, gaps, summaries, and completion.
- Have ADAM speak a grounded acknowledgement followed by the engine-selected prompt.
- Support natural interruption while ADAM is speaking.
- Preserve all seven specialists and their database-loaded curricula.
- Degrade safely to Type without losing a spoken answer that was already saved.

## Non-goals

- Replacing the existing interview engine with an autonomous voice agent.
- Letting the Realtime model write directly to Supabase or choose which chapter to skip.
- Storing raw microphone audio.
- Adding voice cloning, multiple voices, telephony, multilingual translation, or background recording in this release.
- Treating arbitrary speech as an application command beyond a small explicit set: repeat, pause/resume, switch to typing, and end.

## Anti-goals

- A model-led conversation that sounds fluent but silently loses answers or diverges from the curriculum.
- Duplicate answers caused by repeated transcript-complete events, reconnection, or rapid barge-in.
- ADAM speaking the next question before the preceding answer and checkpoint are durably saved.
- Listening while the user believes the microphone is stopped.
- A failure that strands the user in Talk or forces them to answer again.

## Constraints

- The OpenAI API key remains server-side.
- Paid Realtime requests keep the existing Supabase authentication and request-origin checks.
- The client uses WebRTC for low-latency audio and a data channel for Realtime events.
- Realtime input uses semantic VAD with low eagerness, automatic response creation disabled, and interruption enabled. The application—not the model—decides when and what ADAM says.
- Raw audio is transient and is never written to the FAS database.
- Final transcripts are untrusted user input and pass through the same validation and persistence path as typed answers.
- The current Cedar voice remains the default.
- Type remains fully usable when microphone permission, WebRTC, transcription, playback, or the Realtime service is unavailable.

## Approaches considered

### Realtime-owned interview

The Realtime model would receive the curriculum, conduct the conversation, and call tools to save answers and advance state. This is the most fluid approach, but it gives a probabilistic model authority over ordering, probing, and completion. A tool failure could leave spoken conversation ahead of durable state, and a reconnect would be difficult to reconcile safely.

### Shared-engine hybrid — selected

Realtime handles microphone audio, semantic turn detection, transcription, interruption, and Cedar speech. The browser passes each finalized transcript into the same FAS submission coordinator used by typed chat. The deterministic interview engine decides whether to probe or advance; Supabase saves the answer and checkpoint atomically; the existing conversational endpoint creates a grounded acknowledgement; then Realtime speaks the acknowledgement and exact engine-selected prompt.

This requires more client orchestration but preserves data integrity, makes Type/Talk switching natural, and guarantees that the premium artifact remains grounded in the same saved answers.

### Browser speech recognition plus narration — rejected

This would be simpler, but browser-native speech recognition availability and behavior are inconsistent. It would not provide the same reliable hands-free, interruption, and cross-browser experience.

## Architecture

### Realtime interview session

Add a dedicated interview-session configuration and endpoint rather than changing the existing receive-only tutorial narrator. The session accepts microphone audio, emits transcription and speech-state events, and produces Cedar audio only when the application sends an approved response request.

Session behavior:

- bidirectional audio transceiver;
- input transcription enabled;
- semantic VAD, low eagerness;
- automatic model responses disabled;
- user speech can interrupt current ADAM audio;
- no tools and no direct database access;
- instructions restrict output to speaking application-supplied interview copy without adding questions or facts.

### Browser voice controller

Create a focused `realtime-interviewer` module responsible for:

- requesting and releasing microphone permission;
- establishing and destroying the WebRTC peer, audio element, and data channel;
- mapping Realtime events into `connecting`, `listening`, `thinking`, `speaking`, `paused`, and `error` states;
- rendering interim and final transcripts;
- emitting one idempotent finalized turn at a time;
- speaking application-approved copy;
- cancelling or interrupting current speech on barge-in;
- reconnecting only on an explicit user retry, never silently submitting twice.

The module does not know interview questions, Supabase, or artifacts. It accepts callbacks and copy from the coordinator.

### Shared answer coordinator

Refactor the current typed `send()` pipeline into one `submitAnswer(text, source)` coordinator used by both modes. It performs, in order:

1. reject empty, duplicate, completed, or already-processing turns;
2. render the user answer in the shared history and transcript view;
3. let the interview engine classify and accept the answer;
4. atomically save the answer plus checkpoint;
5. reconcile the temporary answer identity with the durable UUID;
6. obtain a grounded acknowledgement while preserving the engine-selected follow-up or next question;
7. update both Type and Talk question displays;
8. speak the acknowledgement and next prompt when Talk is active;
9. generate the blueprint and redirect when completion is reached.

Typed submission keeps its current Enter/Send behavior. Spoken submission uses the final transcript event and a per-turn identifier so repeated network or Realtime events cannot create duplicate answers.

### Interviewer behavior

ADAM starts by briefly orienting the user and speaking the current saved question. After every accepted answer, ADAM names one concrete detail it heard, then either:

- asks the engine-selected clarification;
- bridges to the next guided question;
- gives the existing compact checkpoint summary before continuing; or
- announces that the specialist is complete and that the blueprint is being prepared.

The acknowledgement model cannot replace or append its own question; the application supplies the exact next prompt. During an answer, ADAM does not speak. After a long period with no speech, the interface gives one gentle on-screen reminder but does not repeatedly talk over the user.

### Voice commands

Only clear standalone commands are intercepted and not stored as answers:

- “Repeat the question” replays the current approved prompt.
- “Pause” stops listening and speech while preserving the interview state. It fully disables microphone capture; the user resumes explicitly with the mic button so the privacy state is unambiguous.
- “Switch to typing” stops microphone capture and opens Type.
- “End” stops microphone capture and leaves the interview saved at its current checkpoint.

Ambiguous phrases are treated as interview content rather than commands.

## UI behavior

- The mic button starts or pauses the hands-free session and accurately reflects microphone state.
- End releases the microphone, closes Realtime resources, and leaves the user on the same saved interview.
- The orb and status text reflect actual connection/listening/thinking/speaking state rather than preview-only toggles.
- “What ADAM heard” displays interim text, then the finalized saved answer.
- The current guided question stays visible and synchronized with Type.
- While saving or processing a turn, the next transcript cannot be submitted.
- Voice errors explain that saved work is safe and offer Retry voice or Type instead.
- Completion disables the mic, speaks the completion message once, generates the artifact once, and redirects through the existing review URL carrying agent, project, and session.

## Failure handling

- Permission denied: show a clear message and switch focus to Type.
- Realtime connection failure: release microphone resources; do not alter the checkpoint.
- Transcription failure: keep listening available for retry; do not save an empty answer.
- Pause, End, or Type waits for any already-finalized turn to finish its in-flight save. A merely partial transcript is never silently persisted; it remains visible as an unsaved draft, and switching to Type transfers that draft into the composer for review.
- Answer save failure: retain the finalized transcript visibly and make it retryable; do not advance or speak the next question.
- Acknowledgement failure: use the engine-selected prompt as the spoken fallback after the answer is saved.
- Speech playback failure: continue the interview visually and keep Type available.
- Artifact generation failure: retain the existing retry behavior and saved answers.

## Security and privacy

- The browser authenticates the Realtime handshake through the existing FAS server; the OpenAI key is never returned to the client.
- The server validates origin, SDP size/shape, and Supabase identity before starting a paid Realtime session.
- Realtime instructions treat transcripts as untrusted data and do not execute spoken prompt injection.
- Only finalized text answers and normal interview metadata are persisted; raw audio is not stored by FAS.
- This release uses the OpenAI account's standard API data controls; zero-data-retention eligibility or contractual guarantees are outside this implementation.

## Browser support

The first release supports current stable Chrome, Edge, Firefox, and Safari across Windows, macOS, Linux, iOS, and Android wherever the browser exposes the required secure-context WebRTC, microphone, data-channel, and audio-playback capabilities.

- Desktop acceptance covers current Chrome, Edge, Firefox, and Safari on the operating systems where each browser is officially available.
- Mobile acceptance covers Safari on current iOS/iPadOS and Chrome on current Android.
- Mobile lifecycle handling covers permission prompts, autoplay unlock, phone-call/audio interruption, app backgrounding, screen locking, and returning to the foreground without duplicate submission.
- Capability detection runs before starting Talk. When a browser, embedded webview, enterprise policy, or device does not expose a required capability, FAS explains the limitation and preserves the fully functional Type interview instead of presenting a broken voice control.
- Obsolete browser versions and browsers without standards-compliant WebRTC/getUserMedia support receive graceful fallback rather than a false compatibility claim.

## Verification

- Unit tests cover Realtime connection lifecycle, microphone release, semantic-VAD configuration, interim/final transcript events, interruption, and idempotent final turns.
- Coordinator tests prove Type and Talk call one persistence pipeline, cannot double-save, wait for durable save before speaking the next prompt, and share completion behavior.
- Server tests prove the interview endpoint is authenticated, origin-restricted, uses the correct session configuration, retries only transient upstream failures, and never exposes the API key.
- UI tests prove the mic/status/orb reflect actual state and failure recovery always offers Type.
- Cross-browser acceptance covers Chrome, Edge, Firefox, and Safari desktop plus Safari on iOS/iPadOS and Chrome on Android, including permission denial, autoplay restrictions, background/foreground recovery, and audio interruption.
- The full project suite and production build must pass before deployment.
