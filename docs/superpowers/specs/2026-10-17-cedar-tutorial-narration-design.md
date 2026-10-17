# Cedar Tutorial Narration Design

## Goal

Replace the FAS tutorial's primary browser-generated voice with high-quality Cedar narration while preserving the current automatic playback, Mute, Replay, cancellation, captions, safe demo behavior, and native speech fallback.

## Confirmed Scope

- `C:\vibec\adam` remains read-only.
- FAS receives its own local Node server and dependency manifest.
- The existing API key may be copied from Adam only into FAS's ignored local `.env`; it must never appear in HTML, browser JavaScript, tests, logs, screenshots, or tracked documentation.
- FAS uses the OpenAI Speech API with `gpt-4o-mini-tts`, voice `cedar`, and a calm premium narration instruction.
- FAS continues to work without the server or network by falling back to browser speech synthesis.
- The tutorial receives a dedicated Talk-mode step that explains voice input and visibly selects the real Talk control without activating the microphone.

## Architecture

### Local server

`server.js` serves the existing static FAS files and exposes `POST /api/narration`. The endpoint accepts JSON containing one `text` string, validates its type and length, and permits only tutorial narration-sized content. It sends the fixed model, voice, format, speed, and style configuration to OpenAI; the browser cannot select a model or voice.

The server returns generated MP3 audio with `Content-Type: audio/mpeg` and `Cache-Control: private, max-age=3600`. Errors return concise JSON without credentials or upstream response bodies. The endpoint is same-origin and intended for local use.

### Browser narrator

The narrator becomes an asynchronous two-tier controller:

1. Request Cedar audio from `/api/narration` after the tutorial reports `target-ready`.
2. Play the returned audio through one managed `Audio` instance.
3. If fetching, decoding, or playback fails, use the existing native speech narrator.

Every request receives an incrementing generation token and an `AbortController`. Next, Back, chapter changes, Mute, Skip, Close, Finish, and page unload abort the request, pause the audio, revoke its object URL, and cancel native speech. A late response may never play after the active step changes.

Replay uses cached audio for the current narration when available. Unmute replays the current step. A session-level Map caches object URLs by exact narration text and avoids repeated API requests during one tutorial opening. Cleanup revokes all cached URLs.

### Talk-mode tutorial step

A new ADAM step targets the existing Type/Talk mode control, tells the user that Talk supports natural spoken answers, and triggers a `selectTalkMode` tutorial action. The protected frame bridge applies only the visual Talk-selected state and returns `interaction-complete`; it must not call `getUserMedia`, start recording, or run the production Talk handler. Next and Back continue to work normally, and the new step receives Cedar narration like every other tutorial step.

### Voice treatment

The server uses:

- model: `gpt-4o-mini-tts`
- voice: `cedar`
- response format: `mp3`
- speed: approximately `0.96`
- instructions: a composed, warm, confident premium product-guide delivery with natural pauses, clear diction, and no theatrical exaggeration

Visible tutorial copy remains the source of truth. The tutorial header will disclose that narration is AI-generated, as required by the official OpenAI text-to-speech guidance.

## Security and Configuration

- Add `.env` to `.gitignore` before creating the local credential file.
- Add `.env.example` containing only `OPENAI_API_KEY=`.
- Read the API key server-side through `dotenv`.
- Do not expose a session token or API credential to the browser.
- Apply a small JSON body limit and reject empty or oversized text.
- Keep the tutorial iframe protections unchanged.

## Files

- Create: `package.json`
- Create: `package-lock.json` through dependency installation
- Create: `server.js`
- Create: `.gitignore`
- Create: `.env.example`
- Create locally, ignored: `.env`
- Modify: `assets/js/tutorial.js`
- Modify: `README.md`
- Modify/Create tests for the server contract and Cedar narrator lifecycle

## Testing

- Server tests verify validation, fixed Cedar/model configuration, response headers, and sanitized failures using an injected upstream fetch implementation.
- Narrator tests verify Cedar-first playback, fallback, caching, Replay, Mute/Unmute, aborts, stale-response suppression, object URL cleanup, and absence of credentials in browser code.
- Tutorial bridge tests verify the Talk step exists, targets the real mode control, visibly selects Talk, and never invokes media APIs.
- Existing tutorial, sidebar, Vault, agent, syntax, and visual regression tests continue to pass.
- A local integration check starts FAS with `npm start`, requests a short narration, and confirms a non-empty audio response when the copied local key is valid. No generated audio or secrets are committed.

## Operational Behavior

Run `npm install` once, then `npm start` and open the printed localhost URL. Opening the HTML files directly remains supported, but Cedar cannot be reached from `file://`; native speech is used automatically in that mode.

## Source Basis

The design follows the official OpenAI Text to Speech guide: the Speech API supports `gpt-4o-mini-tts`, Cedar is a recommended high-quality voice, voice instructions can control delivery, and users must be told the voice is AI-generated.
