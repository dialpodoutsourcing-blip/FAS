# Interactive Product Tutorial Design

Date: 2026-10-17

## Purpose

Add a safe, premium, interactive product tutorial that teaches customers how to use FAS without navigating away from their current page or changing real data. The tutorial should feel like it is moving through Dashboard, ADAM, Vault, and Launch Plan, but every screen and action is a controlled simulation inside one standalone module.

## Success Criteria

- Every desktop sidebar includes a consistent `Help me / Demo` item immediately below Dashboard.
- Activating the item opens a one-screen black-and-gold tutorial above the current page.
- The tutorial simulates navigation among the main FAS product areas without changing the browser URL or loading another page.
- Each step highlights one control or region with a gold focus treatment and a clearly associated animated arrow.
- Each step explains what the highlighted item is, what it does, why it matters, and the safe action the user can try.
- Users can advance with Next, go backward with Back, click the highlighted simulated control, skip, finish, or close the tutorial.
- No tutorial interaction can submit a form, alter saved work, start recording, initiate a download, or leave the current page.
- The tutorial is keyboard accessible, manages focus correctly, and respects reduced-motion preferences.

## User Experience

### Entry Point

The shared sidebar navigation gains a `Help me / Demo` link directly below Dashboard on index, chat, review, vault, and launch pages. It uses the same compact row height, icon language, hover behavior, and active styling as the existing navigation.

The menu item behaves as a button even if it is marked up as a link for styling. Activating it prevents navigation and opens the tutorial at the welcome step.

### Tutorial Shell

The tutorial covers the viewport and prevents the underlying page from scrolling. It has three visual regions:

1. A compact chapter rail showing Dashboard, Talk to ADAM, Vault, and Launch Plan, including current and completed states.
2. A central simulated FAS canvas that changes between product views while retaining the same shell and sidebar.
3. A description panel containing the step label, title, useful explanation, progress count, and controls.

On narrower screens, the chapter rail becomes a horizontal progress strip and the description panel sits below the simulated canvas. Content must remain usable without horizontal scrolling. If the available height is unusually small, only the tutorial description region may scroll; the main product page must remain fixed.

### Visual Language

The module follows the existing FAS system: near-black surfaces, ivory text, restrained gold borders and gradients, Montserrat/Inter body typography, and Bebas Neue display labels. A subtle tiled/grid background can be used behind the demo canvas, but text contrast must remain high.

The active simulated element receives a bright gold outline, soft halo, and increased contrast. An animated gold arrow points toward it without covering its label. The description panel is visually connected to the highlight. Motion is subtle and stops or simplifies when `prefers-reduced-motion: reduce` is active.

### Controls

- `Back`: moves to the previous step and is disabled on the first step.
- `Next`: moves to the next step and changes to `Finish tutorial` on the final step.
- Highlighted simulated element: performs a safe visual interaction and advances when the step supports interaction.
- `Skip tutorial`: closes immediately and returns focus to the sidebar trigger.
- Close button and Escape: close the tutorial and return focus to the trigger.
- Left and Right arrow keys: move backward and forward while focus is not in a native interactive control that consumes those keys.

Progress remains in memory only for the current opening. Reopening starts at the welcome step so the demo remains predictable for presentations.

## Tour Content

The initial tour is divided into four chapters.

### 1. Dashboard

1. Welcome to FAS: explain that the system turns expertise into a complete authority and offer ecosystem.
2. Main navigation: explain Dashboard, ADAM, Vault, and Launch Plan.
3. Seven specialists: explain that each specialist owns one outcome and works in sequence.
4. Progress and resume: explain status signals and continuing from the last saved point.
5. Expert account area: explain the active expert, business identity, saved status, and settings access.

### 2. Talk to ADAM

1. Agent identity: explain the selected specialist, its role, and current step.
2. Stage tracker: explain the internal stages within an agent session.
3. Type and Talk: demonstrate switching input modes without activating a real microphone.
4. Conversation frame: explain the current question and ADAM's guided coaching behavior.
5. Answer composer: demonstrate entering a sample response without submitting it.
6. Prompt chips: explain examples, hints, and the `I am not sure` escape hatch.
7. Saved work and history: explain how approved material is retained and can be reviewed.
8. Why you can trust ADAM: explain proof discipline, visible suggestions, and user approval.

### 3. My Vault

1. Finished assets: explain that every specialist produces a structured deliverable.
2. Asset tabs/cards: demonstrate selecting a different deliverable.
3. Edit action: explain returning to the relevant specialist for revision without navigating.
4. PDF download: explain the export behavior without starting a real download.

### 4. Launch Plan

1. Readiness overview: explain how completed assets feed the rollout.
2. Timeline and phases: explain preparation, warming, opening, and onboarding.
3. Owners and actions: explain responsibility, dates, and next actions.
4. Finish: summarize the workflow and provide a clear `Finish tutorial` action.

## Architecture

### Standalone Module

Create `assets/js/tutorial.js` as an isolated browser module using the project's existing plain JavaScript style. It owns:

- the immutable chapter and step registry;
- current step state;
- tutorial shell creation and teardown;
- simulated view rendering;
- spotlight and arrow positioning;
- control and keyboard events;
- focus trapping and focus restoration;
- safe demo interactions.

The module exposes a small `window.FAS.tutorial` interface with `open()`, `close()`, `next()`, `back()`, and read-only current-step access for testing. It must tolerate missing optional targets and fail closed: if a step cannot render, Next and Back still work and the tutorial remains closable.

### Shared Injection

The module locates `[data-tutorial-trigger]` on page load and binds every matching trigger. The tutorial shell is generated once and appended to `document.body` only when first opened. This avoids copying a large overlay into all HTML pages.

Each page still contains the same sidebar trigger markup so the navigation remains readable and usable without JavaScript. All pages load `tutorial.js` after `nav.js` and before `adam.js` where practical.

### Simulated Interface

The central canvas is not an iframe and does not clone live DOM from the page. It is a purpose-built semantic preview containing only the controls required by the current chapter. View renderers use a stable set of tutorial-only classes and `data-demo-target` identifiers.

Each step declares:

- chapter and title;
- concise label;
- detailed explanation;
- simulated view name;
- target identifier;
- preferred arrow placement;
- optional safe interaction name.

The renderer switches views, marks the current target, updates description and progress, then positions the arrow after layout. Resize events recalculate the arrow location.

### Safety Boundary

The tutorial simulation cannot call production form handlers or dispatch events to the underlying page. Simulated controls use tutorial-only actions such as toggling a visual tab, inserting sample text into a demo field, expanding a demo panel, or marking a demo card selected. Links in the demo canvas use buttons or have navigation suppressed.

The underlying page receives `inert` while the tutorial is open where supported, with an `aria-hidden` fallback where necessary. Body scrolling is restored on every close path.

## Accessibility

- The tutorial shell uses `role="dialog"`, `aria-modal="true"`, and an accessible title and description.
- Opening moves focus to the tutorial heading or Next control; closing restores focus to the activating trigger.
- Tab and Shift+Tab remain within the tutorial.
- All icon-only controls have accessible names.
- Current progress is exposed with text such as `Step 4 of 21` and the active chapter is marked programmatically.
- Visual highlighting is supplemented by the description title and target name; meaning never depends on color alone.
- Animations respect reduced-motion settings.
- Buttons expose disabled state correctly, and status announcements use a restrained live region.

## Styling

Add a dedicated tutorial section to `assets/css/styles.css`. Tutorial selectors use a `tour-` prefix to prevent collisions with the live product. The overlay uses a z-index above drawers and loading screens, while its internal canvas creates its own predictable stacking context.

Desktop layout is a three-region grid. Responsive rules collapse it without changing the logical reading order. The existing shared sidebar dimensions must not change as part of this feature.

## Testing

Add a tutorial static/behavior test that verifies:

- every page contains exactly one tutorial trigger immediately after Dashboard;
- every page loads `tutorial.js`;
- the step registry includes all four chapters and required topics;
- opening creates a modal dialog without changing location;
- Next, Back, simulated-target activation, Skip, Escape, and Finish update or close state correctly;
- Back is unavailable on the first step and Finish appears on the final step;
- no simulated element uses a real navigation, download, form submission, or microphone action;
- focus returns to the trigger after closing;
- reduced-motion and responsive styles exist;
- existing sidebar, agent, Vault, branding, and chat tests continue to pass.

## Files Expected to Change

- `index.html`
- `chat.html`
- `review.html`
- `vault.html`
- `launch.html`
- `assets/css/styles.css`
- `assets/js/tutorial.js` (new)
- `tests/static-tutorial.test.js` (new)
- existing sidebar test expectations where the additional shared menu item changes the navigation count

## Out of Scope

- Persisting tutorial completion between browser sessions.
- Navigating the real product during the tour.
- Mutating customer data or saved work.
- Real voice recording, downloads, or form submission.
- A content-management interface for editing tutorial copy.
- Adding the planned eighth specialist.

