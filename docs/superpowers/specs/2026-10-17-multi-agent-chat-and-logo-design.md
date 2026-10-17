# FAS Multi-Agent Chat and Premium Logo Design

## Purpose

Extend the existing static FAS member-area prototype so all seven specialists can be opened and previewed through tailored chat experiences. Replace the temporary letter-based FAS wordmark with a more premium, reusable logo treatment.

This design uses `fas-build-specs.pdf` as product source material. The PDF supplies agent outcomes, stages, safeguards, and deliverables; it does not supply complete chat scripts. Static conversations will therefore translate the documented material into concise interface copy without inventing new frameworks or promising real AI behavior.

## Scope

### Included

- Temporarily unlock all seven specialist links throughout the static prototype.
- Route every specialist into one shared chat page using an `agent` query parameter.
- Tailor the chat identity, stages, opening content, prompt chips, saved-output preview, and completion action for each specialist.
- Preserve the existing Type and Talk interface and public FAS JavaScript events.
- Add safe fallback behavior for missing or unknown agent keys.
- Replace the current text-only FAS mark with a premium inline-SVG monogram in desktop and mobile navigation.
- Add automated static regression checks for agent configuration, routing, rendering hooks, fallback behavior, and logo presence.

### Excluded

- Backend or AI responses.
- Persisted chat history or customer progress.
- Authentication, authorization, and production locking rules.
- Full word-for-word interview scripts.
- Voice capture, transcription, or synthesis services.
- Generating production deliverables from user answers.
- Final trademark or brand-clearance work for the logo.

## Source-Derived Specialist Model

| Step | Key | Specialist | Product role | Documented flow |
|---|---|---|---|---|
| 1 | `anchor` | ANCHOR | Trusted Expert Blueprint | Authority, arena, evidence, position, boundaries, activation |
| 2 | `extract` | EXTRACT | Expertise Extraction Coach | Context, origin, timeline, method, proof, point of view, boundaries, synthesis |
| 3 | `radar` | RADAR | Buyer Psychology Tool | Market, evidence, current state, desired state, triggers, objections, language, priority, approval |
| 4 | `forge` | FORGE | Brand Identity Generator | Strategy, naming territories, candidates, shortlist, stress test, selection, screening, identity brief |
| 5 | `architect` | ARCHITECT | Signature System Builder | Transformation, milestones, phases, modules, lessons, implementation, overload check, delivery validation, approval |
| 6 | `voice` | VOICE | Words That Sell Copywriter | Input gate, content job, context, gap check, message brief, sectional draft, checks, approval |
| 7 | `launch` | LAUNCH | Million Dollar Rollout Plan | Launch type, dates, prerequisites, backward plan, owners, channels, calendar, sales, readiness, review |

The configuration may shorten long stage names for responsive display, but it must preserve their meaning and order.

## Architecture

### Shared chat shell

`chat.html` remains the only chat document. Specialist links use these URLs:

- `chat.html?agent=anchor`
- `chat.html?agent=extract`
- `chat.html?agent=radar`
- `chat.html?agent=forge`
- `chat.html?agent=architect`
- `chat.html?agent=voice`
- `chat.html?agent=launch`

The page contains stable rendering targets identified by data attributes. Agent-specific content is not duplicated across separate HTML pages.

### Specialist configuration

A dedicated JavaScript file defines a plain-data registry keyed by the seven agent slugs. Each entry contains:

- `step`, `key`, `name`, and `title`
- the existing SVG symbol ID and jewel color
- outcome and opening conversation content
- ordered stage labels and a static active-stage index
- two contextual hint prompts
- saved-output field labels and placeholder values
- completion-button label and destination

The registry is exposed through the existing `window.FAS` namespace so it can later be replaced or hydrated by application data without redesigning the interface.

### Rendering and fallback

On page load, the chat controller reads `URLSearchParams(location.search).get('agent')`, normalizes it to lowercase, and selects the matching registry entry. Missing, empty, or unknown keys resolve to `extract`.

Rendering updates:

- Toolbar specialist chip, icon, title, and step number
- Stage tracker labels and active/done states
- Initial agent messages and typing indicator identity
- Text-chat hint chips
- Voice-mode icon and current question
- Saved-so-far field labels and placeholders
- Completion button copy and link
- Active specialist state in the sidebar
- Message-template icon and default tag for messages added through `FAS.chat`

The controller must use `textContent` for configuration text and user-provided message text. Configuration-generated elements may be assembled with DOM methods or cloned templates; arbitrary runtime text must not be inserted with `innerHTML`.

## Navigation and Temporary Access

All seven specialist links are temporarily enabled across every page. Their URLs point to the shared chat page with the correct agent key. Locked styling, lock icons, and links back to the specialist overview are removed for this preview.

On the chat page, the selected specialist is marked active using the resolved agent key. Previously completed and future production progression states are not simulated. This avoids implying that preview access equals actual customer completion.

The dashboard resume CTA remains tied to Step 2 and routes to `chat.html?agent=extract`. The specialist cards provide direct access to the other six previews.

## Static Conversation Content

Each specialist receives a short, representative starting state:

1. A welcome or context message explaining the immediate outcome.
2. One focused primary question derived from the first meaningful decision in the documented flow.
3. Two contextual hint chips.
4. Two or three representative saved-output fields.

Content rules inherited from the source specification:

- Ask one primary question at a time.
- Do not invent credentials, evidence, research, guarantees, deadlines, or legal clearance.
- Label assumptions and hypotheses clearly where relevant.
- Preserve customer language separately from system labels.
- Do not imply that the static prototype actually generated or saved a production artifact.

The existing send interaction continues to append customer messages and emit `fas:send`. It does not fabricate an automated reply.

## Premium FAS Logo

The logo becomes a reusable inline-SVG monogram rather than generated raster artwork. It uses:

- A compact geometric `FAS` construction suitable for the narrow sidebar
- Interlocking or shared strokes to make it feel designed rather than typeset
- A restrained metallic-gold gradient as the focal material
- Fine ivory highlights for contrast on the black interface
- A clean `FITNESS AUTHORITY SYSTEM` wordmark beneath it on desktop
- A simplified monogram-only presentation in the mobile bar

The SVG includes `role="img"` and an accessible name. Decorative internal paths are hidden from assistive technology. CSS controls size and subtle hover/focus treatment without reducing legibility or relying on animation.

## Error Handling

- Missing or invalid `agent` query value: render EXTRACT.
- Incomplete optional configuration field: omit that optional UI item without breaking the page.
- Missing required registry entry or rendering target during development: emit a concise console error and preserve usable base markup.
- Unsupported URL casing: normalize and resolve it.
- JavaScript disabled: base EXTRACT content remains readable and navigable.

## Accessibility and Responsive Behavior

- Specialist links remain keyboard accessible and expose meaningful names.
- The current specialist link uses `aria-current="step"` on the chat page.
- Stage progress remains an ordered list with one `aria-current="step"` item.
- Type/Talk tabs retain existing keyboard behavior.
- The logo has one accessible name and no repeated letter announcements.
- The layout remains usable at existing desktop and mobile breakpoints.
- Motion stays disabled when `prefers-reduced-motion` is enabled.

## Testing

Dependency-free Node regression tests will verify:

- Exactly seven specialist configuration entries exist.
- Each entry contains required identity, stage, prompt, saved-field, and completion data.
- All specialist links use the correct `chat.html?agent=<key>` URL.
- No specialist link retains locked styling in preview mode.
- Chat rendering targets and script ordering are present.
- Missing and invalid keys resolve to EXTRACT.
- Each specialist produces its expected name, step, stages, and source-derived prompt when rendered.
- Dashboard resume continues to target EXTRACT.
- Desktop and mobile headers use the new accessible SVG logo.
- Legacy temporary letter-mark markup does not remain.

Manual verification will cover desktop and narrow layouts, mouse and keyboard navigation, all seven agent URLs, Type/Talk switching, message submission, and visible logo quality.

## Implementation Boundaries

The work will modify the existing static HTML, CSS, and JavaScript files and add focused configuration/tests. It will not introduce a framework, build system, package dependency, or backend. Existing FAS custom events remain compatible.

## Acceptance Criteria

- A tester can open every specialist from the sidebar or dashboard without encountering a lock.
- Every specialist chat visibly differs in identity, stage sequence, opening question, hints, saved fields, and completion action.
- The content matches the intent and safeguards of the supplied build specification.
- Unknown chat-agent URLs degrade safely to EXTRACT.
- The dashboard still communicates that the customer is currently at Step 2.
- The FAS logo reads clearly at desktop and mobile sizes and appears intentionally designed within the existing premium visual system.
- Automated checks pass without adding external dependencies.
