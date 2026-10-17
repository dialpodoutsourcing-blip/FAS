# Live 1:1 Guided Tutorial Design

Date: 2026-10-17
Status: Approved design revision
Supersedes: `2026-10-17-interactive-product-tutorial-design.md`

## Purpose

Replace the simplified tutorial recreation with a protected, voice-guided walkthrough of the real FAS interface. The customer must see the actual Dashboard, ADAM chat, Vault, and Launch Plan with their production markup, styling, icons, animations, proportions, and agent content. The tutorial may appear to navigate among those areas, but the customer's actual browser page and product state must remain unchanged.

## Success Criteria

- `Help me / Demo` remains immediately below Dashboard on every sidebar.
- Opening the tutorial shows an exact live rendering of the real FAS page rather than a hand-built approximation.
- Dashboard, ADAM, Vault, and Launch Plan load inside one protected tutorial frame without changing the outer page URL.
- A spotlight and arrow identify real interface elements inside the framed page.
- A premium floating description panel explains the active element and automatically narrates the same guidance.
- Back, Next, highlighted-control activation, Replay, Mute/Unmute, Skip, Close, and Finish work consistently.
- The description panel moves to avoid covering the highlighted element.
- Tutorial mode cannot save, submit, download, record, mutate customer state, or escape into normal navigation.
- Closing restores focus and leaves the original page exactly as it was.

## Experience

### Entry and Shell

Activating `Help me / Demo` opens a one-screen modal over the current page. The outer page becomes inert and does not scroll. The modal contains:

1. A narrow premium header with FAS Guided Demo, chapter, step progress, Mute/Unmute, Replay, and Close.
2. A large central viewport containing the real FAS page.
3. A floating description card with step label, title, explanation, Back, Next, and Skip.
4. A gold spotlight and animated directional pointer aligned to the active real control.

The framed page occupies most of the viewport and preserves the real product's aspect and layout. The frame can scale down uniformly when the available screen is smaller, but it must not restyle the product into a different design.

### Real Page Chapters

- Dashboard chapter loads `index.html?tour=1`.
- ADAM chapter loads `chat.html?agent=extract&tour=1`.
- Vault chapter loads `vault.html?tour=1`.
- Launch Plan chapter loads `launch.html?tour=1`.

Changing chapters replaces only the framed page. The outer browser location, history, scroll position, and page state remain unchanged.

### Highlight and Description

Each step targets a real element marked with a stable `data-tour-id`. The bridge reports its bounding rectangle to the parent. The parent draws the spotlight and pointer above the frame and places the description card in the largest available region around the target.

Placement priority is right, left, bottom, then top, subject to a minimum safe margin. If no side has sufficient room, the description docks to the lower-right corner and the pointer continues to identify the target. If the target is unavailable, the description centers and explains the area without blocking Back, Next, Skip, or Close.

The active element remains readable; the tutorial darkens surrounding content without placing an opaque box over the target.

### Guided Interaction

The user may advance with Next or activate the highlighted real control. Highlighted controls run only a tutorial-safe behavior:

- Type/Talk toggles visual state but never requests microphone permission.
- Composer inserts sample text locally but never submits or saves it.
- Saved work and trust controls open their real visual panels in the frame.
- Vault tabs or cards change the visible demo asset.
- Edit and Download explain their normal result but do not navigate or download.
- Launch controls reveal their real visual details without modifying a plan.

Rapid activation advances only once. Back restores the previous chapter, page, visual state, and target deterministically.

## Automatic Voice Guidance

The browser Speech Synthesis API narrates every step automatically after the framed target and description are ready.

- Narration text matches the visible description.
- Starting another step cancels the previous utterance before speaking.
- Mute cancels current speech and suppresses automatic speech until unmuted.
- Unmute immediately narrates the current step.
- Replay cancels and restarts the current step narration.
- Back, Next, chapter changes, Skip, Close, Finish, and page unload cancel speech.
- The controller selects the best available natural English voice, preferring a local voice and falling back to the browser default.
- Speech rate is calm and clear, approximately `0.95`; pitch remains neutral at `1`.
- If speech synthesis or a usable voice is unavailable, captions and all tutorial controls continue to work without an error dialog.
- Voice controls expose clear pressed/muted states and accessible labels.

## Architecture

### Parent Tutorial Controller

`assets/js/tutorial.js` remains the entry point but its simulated HTML renderers are removed. It owns:

- the chapter and step registry;
- modal lifecycle and focus management;
- a sandboxed iframe;
- chapter/page switching;
- bridge message validation;
- target rectangle translation from frame coordinates into modal coordinates;
- spotlight, pointer, and adaptive description positioning;
- Back/Next and click-to-advance state;
- narration and voice controls;
- cleanup and restoration.

The existing pure `createTourState()` interface remains testable. A new `createNarrator(speechSynthesis)` interface owns `speak(text)`, `cancel()`, `mute()`, `unmute()`, `replay()`, and `isMuted()`.

### Framed Page Bridge

Create `assets/js/tutorial-frame.js`, loaded on all real pages after navigation setup. It activates only when the URL contains `tour=1`; normal product behavior is unchanged otherwise.

In tutorial mode it:

- adds `tour-frame` to the body;
- disables persistent and external actions before other handlers can act;
- hides the tutorial trigger to prevent nested tours;
- receives commands from the parent for target selection and safe interactions;
- finds `[data-tour-id="..."]`, scrolls it into view within the frame when necessary, and reports its rectangle;
- watches resize and relevant layout changes and reports updated target geometry;
- reports `frame-ready`, `target-ready`, `target-missing`, and safe interaction completion;
- never reads or sends form contents, saved work, or private customer data.

Messages use a fixed namespace such as `fas-tour` and are accepted only when `event.source` is the expected parent/frame window. The payload schema is validated before use.

### Real Target Attributes

Stable `data-tour-id` attributes are added to the existing production elements needed by the 21-step registry. They do not change styling or normal behavior.

Examples include:

- Dashboard: `welcome`, `main-navigation`, `specialists`, `resume`, `account`.
- ADAM: `agent-identity`, `stages`, `input-modes`, `conversation`, `composer`, `hints`, `saved-work`, `trust`.
- Vault: `assets`, `edit`, `download`.
- Launch Plan: `readiness`, `timeline`, `owners`, `finish`.

If multiple repeated controls exist, the target is placed on the nearest stable containing region or on the first visible relevant control.

### Iframe Safety

The tutorial frame uses a sandbox that permits the minimum needed for same-site scripts and rendering while preventing top-level navigation, popups, downloads, forms, and unsanctioned capabilities. It does not include permissions for microphone, camera, geolocation, clipboard, or payment APIs.

The frame bridge also blocks click, submit, and keyboard activation for anchors, forms, download controls, microphone controls, and Save/Exit actions unless the element has an explicit tutorial-safe action. Defense is applied both by the iframe sandbox and by the bridge.

The outer controller never trusts arbitrary messages and never injects message text as HTML.

## Visual Design

The tutorial uses the real page without visual substitutions. Overlay chrome follows the existing black, ivory, and gold design system.

- Surrounding frame content is darkened with a translucent mask.
- The target receives a crisp gold outline and subtle animated glow.
- The arrow is gold, directional, and does not intercept clicks.
- The description card uses high-contrast ivory text, restrained gold details, and a clear step count.
- The description stays compact enough that the real interface remains dominant.
- The frame has no fake sidebar, fake agent cards, placeholder charts, or simplified replicas.

Reduced motion removes pulsing and sliding while retaining the static outline and arrow. Reduced transparency replaces translucent surfaces with solid high-contrast surfaces.

## Accessibility

- The outer shell remains an accessible modal dialog with focus trapped inside its own controls.
- The iframe has a descriptive title such as `Interactive FAS product demonstration`.
- The active target name, title, explanation, and progress are available to assistive technology in the parent dialog.
- Speech is supplemental; every narrated word remains visible.
- Mute state is announced and preserved for the current tutorial session.
- Escape closes the tutorial and cancels speech.
- Closing restores focus to the exact trigger used to open the tutorial.
- Keyboard users can advance and go back without entering the iframe; an explicit `Try this control` action can focus the highlighted framed element when needed.

## Loading and Failure States

When switching chapters, the description card shows `Loading the real {page name}…` and the frame displays the premium black-and-gold loading treatment already used elsewhere in FAS. Narration starts only after `frame-ready` and `target-ready`.

If loading exceeds a fixed timeout, the card explains that the preview could not load and offers Retry, Back, Skip, and Close. It never leaves an empty blocking overlay.

If narration fails, the tutorial continues silently and keeps Replay available for another attempt.

## Testing

Tests must verify:

- all five pages retain exactly one shared tutorial trigger and load the frame bridge;
- every required real control has the correct `data-tour-id`;
- the parent loads the approved real page URLs rather than simulated renderers;
- the iframe sandbox excludes top navigation, popups, downloads, forms, and device permissions;
- tutorial mode activates only for `tour=1`;
- bridge messages validate namespace, source, type, and payload shape;
- unsafe actions are blocked in the frame;
- frame-ready, target-ready, target-missing, and geometry update flows work;
- target coordinates translate correctly into parent overlay coordinates;
- automatic narration begins only after target readiness;
- step changes and close paths cancel prior speech;
- Mute, Unmute, and Replay state transitions work without speech synthesis support;
- missing targets and frame timeouts remain recoverable;
- reduced-motion and reduced-transparency styles exist;
- existing sidebar, chat, Vault, agent, branding, PDF, and syntax suites remain green.

Manual viewport verification must confirm the framed Chat screen visually matches the standalone `chat.html?agent=extract` page at the same viewport dimensions.

## Files Expected to Change

- `assets/js/tutorial.js` — replace simulations with real-frame controller and narration.
- `assets/js/tutorial-frame.js` — new protected-frame bridge.
- `assets/css/styles.css` — replace simulated-view styles with live-frame overlay, spotlight, and adaptive description styles.
- `index.html`, `chat.html`, `review.html`, `vault.html`, `launch.html` — load frame bridge and add stable real target attributes.
- `tests/tutorial-state.test.js` — retain and extend controller/narrator tests.
- `tests/static-tutorial.test.js` — replace simulated-view assertions with live-page, sandbox, target, bridge, narration, and safety assertions.

## Migration

Remove the existing `renderDashboard`, `renderAdam`, `renderVault`, `renderLaunch`, tutorial-only safe action renderers, and all `.tour-demo*` CSS. Preserve the existing menu trigger, modal lifecycle fundamentals, step copy, Back/Next behavior, and accessibility controls where they remain applicable.

## Out of Scope

- Recorded or cloud-generated voice audio.
- Persisting completion or mute state across sessions.
- Editing tutorial copy through an admin interface.
- Allowing real product mutations from inside the tutorial.
- Redesigning the production FAS pages.

