# FAS · ADAM Member Area (v5.1)

Premium member area for the Fitness Authority System, styled to the
Winfuel Authority Ventures brand board. Chat ready, voice orb ready, and
guided tutorial narration available through the Cedar voice.

## Run it with Cedar narration

1. Install dependencies once with `npm install`.
2. Copy `.env.example` to `.env` and provide `OPENAI_API_KEY` if the local file has not already been configured.
3. Run `npm start`.
4. Open `http://127.0.0.1:4173`.

The API key is loaded only by the local Node server and is never sent to browser JavaScript. `.env` is ignored by source control. Tutorial narration uses an output-only OpenAI Realtime connection with the Cedar voice; it never requests microphone permission. The visible captions remain authoritative. If Cedar is unavailable, the tutorial stays usable and clearly reports that captions are still available instead of switching to a robotic browser voice.

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

The interface appends submitted messages locally and emits the documented FAS browser events. It does not call a backend or generate automatic replies. Customer progress, saved conversations, and production access locks are not implemented in this preview.

## Supabase project data

The production schema is in `supabase/migrations/202610250001_fas_production.sql`. Run it in the Supabase SQL editor, then configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the deployment environment. The browser adapter requires the signed-in user's access token and never accepts a service-role key. Without Supabase configuration, the same project shapes use local storage for demo continuity.

Run the complete checks with:

```powershell
npm test
```

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

## Chat and voice hooks (for the developer)
Full API is at the top of `assets/js/adam.js`.
```js
document.addEventListener('fas:send', async (e) => {
  FAS.chat.setTyping(true);
  const reply = await yourApi(e.detail.text);
  FAS.chat.setTyping(false);
  FAS.chat.addMessage({ role: 'agent', text: reply });
});
document.addEventListener('fas:mic', (e) => { /* start or stop recording */ });
FAS.orb.setState('idle' | 'listening' | 'thinking' | 'speaking');
FAS.voice.setTranscript('words so far');
```
Delete the "Preview states (build team only)" row before launch.

## To finish before launch
- Replace the static FAS wordmark with the final production brand asset if one is supplied.
- `[Bracketed]` text is placeholder data.
- Specialist names are working names until Dan approves them.
