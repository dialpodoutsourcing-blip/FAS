# FAS · ADAM Member Area (v5.1)

Premium member area for the Fitness Authority System, styled to the
Winfuel Authority Ventures brand board. ADAM supports durable Type and
hands-free Talk interviews plus guided tutorial narration in the Cedar voice.

## Run it with Cedar narration

1. Install dependencies once with `npm install`.
2. Copy `.env.example` to `.env`, provide `OPENAI_API_KEY`, and add the public Supabase values described below. For an intentionally local-only preview without Supabase, set `FAS_ALLOW_LOCAL_PAID_AI=1`; never set that flag in Vercel or another network deployment.
3. Run `npm start`.
4. Open `http://127.0.0.1:4173`.

The API key is loaded only by the local Node server and is never sent to browser JavaScript. `.env` is ignored by source control. Tutorial narration uses an output-only OpenAI Realtime connection with the Cedar voice; it never requests microphone permission. Talk mode sends microphone audio to OpenAI for live transcription and Cedar speech under the account's standard API data controls. FAS persists the finalized transcript—not raw microphone audio—through the same durable answer/checkpoint path as Type. If voice is unavailable, the interview stays usable through Type and exposes explicit retry/fallback controls.

You can still double-click `index.html` for the static visual preview. Because a `file://` page cannot reach the local Realtime endpoint, narration requires `npm start`.

## Local specialist preview

This is a local static preview. All seven specialists are temporarily accessible for design and flow review:

- `chat.html?agent=anchor`
- `chat.html?agent=extract`
- `chat.html?agent=radar`
- `chat.html?agent=forge`
- `chat.html?agent=architect`
- `chat.html?agent=voice`
- `chat.html?agent=launch`

The interface runs the shared guided-interview engine, saves checkpoints through the project-store adapter, and generates matching PDF and DOCX artifacts through the Express server. When Supabase is not configured, the app explicitly uses browser local storage for preview. When Supabase is configured, protected pages require an authenticated account and never fall back to local storage after a cloud error.

## Supabase authentication and project data

Use a Supabase publishable browser key. FAS does not need an elevated database credential.

1. In the Supabase SQL editor, run `supabase/migrations/202610250001_fas_production.sql`, then run `supabase/migrations/202610250002_fas_auth_onboarding.sql`.
2. In Supabase Authentication → URL Configuration, set the Site URL to the deployed FAS origin. Add `http://127.0.0.1:4173/account.html` and the deployed `https://YOUR-DOMAIN/account.html` as redirect URLs.
3. In Project Settings → API Keys, copy the publishable key. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `.env` and in the deployment environment. `SUPABASE_ANON_KEY` remains a compatibility fallback for older Supabase projects.
4. Run `npm start`, open `http://127.0.0.1:4173/account.html`, create an account, and use the confirmation link sent by Supabase. The sign-in screen also offers account recovery; its email link returns to `account.html` so the user can choose a new password.
5. After the first authenticated sign-in, `bootstrap_fas_account` creates or reuses one workspace, one project, and seven active interview sessions—one each for Anchor, Extract, Radar, Forge, Architect, Voice, and Launch.
6. If the same browser has local FAS answers, onboarding imports them once. A recoverable interruption shows **Retry saved-work import**. Existing cloud answers are never overwritten, and the local payload remains in the browser until the import is durably complete.

To inspect onboarding in Supabase, open Table Editor and verify the signed-in user has a membership row plus one project, seven rows in `interview_sessions`, imported rows in `answers`, and the generated Anchor row/version in `artifacts` and `artifact_versions`. Row Level Security limits browser reads and writes to the user’s memberships.

The public runtime endpoint exposes only the Supabase URL, publishable key, and a configured flag. User access tokens stay in the browser session. Never put an elevated database key into `.env` for this application or into client-side code.

Version 1 accepts pasted evidence and source metadata. Binary uploads, OCR, transcription, automated retention jobs, and the two parked bonus assets are intentionally outside this release until their operating rules are approved.

Generated artifacts are semantic records first. `POST /api/exports` renders both PDF and DOCX from the same version and content fingerprint, with a 1 MB request ceiling and same-origin enforcement.

Run the complete checks with:

```powershell
npm test
```

For an opt-in live durability check, create a disposable confirmed Supabase user, set `FAS_E2E_EMAIL` and `FAS_E2E_PASSWORD` locally, then run:

```powershell
$env:FAS_RUN_SUPABASE_E2E='1'
node --test tests/auth-onboarding.e2e.test.js
```

The test signs in as that user, verifies idempotent bootstrap, imports six uniquely identified Anchor answers, saves one uniquely typed artifact version, and leaves those rows available for inspection. It does not print credentials or tokens.

## Brand applied (from the brand board)
| Brand item | Where it is used |
|---|---|
| Simple Black #080806 | Page background |
| Crispy Ivory #E5D9CB | Secondary text, "Please check" status |
| Leather #AB7633 | End of the gold gradient, RADAR metal |
| White #FFFFFF | Main text, active mic |
| Gold Gradient | Main buttons, step numbers, progress, active tabs |
| Bebas Neue | All headings |
| Montserrat | Sub-headings, buttons, labels |
| Inter | Body text |
| Gold outlined lines, chevrons, page fold, circular gold light | Hero card and ADAM orb |
| Numbered gold squares | Specialist cards |
| Black-gold streak pattern | Very faint page background |

## The 7 specialists (shape + symbol + jewel color + background pattern + role)
| # | Name | Role | Shape | Symbol | Color | Background pattern |
|---|---|---|---|---|---|---|
| 01 | ANCHOR | Positioning strategist | Circle | Anchor | Gold #D9BC7E | Rings |
| 02 | EXTRACT | Expertise interviewer | Diamond | Cut gem | Platinum #BFD0DF | Facets |
| 03 | RADAR | Buyer research analyst | Hexagon | Target | Emerald #5FB597 | Radar sweep |
| 04 | FORGE | Brand and naming designer | Shield | Flame | Copper #E08A5A | Rising embers |
| 05 | ARCHITECT | Program designer | Notched square | Pillared building | Sapphire #7A9FDB | Blueprint grid |
| 06 | VOICE | Sales copywriter | Rounded square | Sound wave | Amethyst #AE93D6 | Waveform |
| 07 | LAUNCH | Launch planner | Triangle | Rising chevrons | Ruby #D9768A | Stacked chevrons |

Each card sets its color inline: `style="--c:#5FB597; --c-glow:rgba(95,181,151,.28)"`.
Everything else on the page stays in the brand palette (black, ivory, leather, gold gradient).

Use one anywhere:
```html
<span class="em em--md"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#em-radar"></use></svg></span>
```
Sizes: `em--xs` 36, `em--sm` 44, `em--md` 64, `em--lg` 88. States: `is-active`, `is-locked`.

## Pages
`index.html` Dashboard · `chat.html` Talk to ADAM (Type / Talk) · `review.html` Expertise Map ·
`vault.html` My vault · `launch.html` Launch plan

## Chat and voice architecture

`assets/js/interview-coordinator.js` is the single durable submission path for Type and Talk. `assets/js/realtime-interviewer.js` owns microphone/WebRTC lifecycle, transcription events, interruption, and cleanup. `assets/js/adam.js` renders the shared result and controls completion.

Public controller methods:

```js
const coordinator = FAS.createInterviewCoordinator(options);
await coordinator.submit({ text, source: 'type' | 'talk', turnId });

const voice = FAS.createRealtimeInterviewer(options);
await voice.start();
voice.pause();
voice.resume();
await voice.stop({ waitFor: pendingDurableSave });
```

See `docs/voice-interview-acceptance.md` for the browser/device and recovery checklist.

## To finish before launch
- Replace the static FAS wordmark with the final production brand asset if one is supplied.
- `[Bracketed]` text is placeholder data.
- Specialist names are working names until Dan approves them.
