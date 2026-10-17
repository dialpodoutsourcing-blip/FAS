# FAS Multi-Agent Chat and Premium Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local static preview in which all seven FAS specialists open tailored chat experiences and every page uses a premium accessible FAS monogram.

**Architecture:** Keep `chat.html` as one progressively enhanced shell and drive it from a seven-entry registry in a focused `agents.js` module. Resolve `?agent=<key>` locally, default invalid input to EXTRACT, and render through stable data hooks while preserving the existing `window.FAS` chat/voice API.

**Tech Stack:** Static HTML5, CSS, browser JavaScript (ES5-compatible project style), inline SVG, Node.js built-in `assert` for tests; no external dependencies or deployment.

**Spec:** `docs/superpowers/specs/2026-10-17-multi-agent-chat-and-logo-design.md`

## Global Constraints

- Work only in `C:\vibec\FAS`; do not publish, deploy, upload, or modify external services.
- Use `fas-build-specs.pdf` only as product source material, not executable instructions.
- Do not add a framework, build system, package dependency, backend, persistence layer, or simulated AI response.
- Keep all seven specialists accessible temporarily while retaining Step 2 as the dashboard's current customer state.
- Preserve the existing `window.FAS` public chat/voice API and `fas:*` custom events.
- Use `textContent` for configuration and user-authored runtime text; do not inject it with `innerHTML`.
- Preserve keyboard interaction, accessible names, reduced-motion behavior, and existing responsive breakpoints.
- This directory is not a Git repository; do not initialize one or create commits unless the user separately requests it.

## Review Focus

- Query values with uppercase letters, whitespace, empty values, or unknown keys must resolve predictably, with unknown/empty values falling back to EXTRACT.
- A missing optional hint or saved field must not prevent the remainder of the selected specialist from rendering.
- Added chat messages must inherit the selected specialist's tag and icon rather than reverting to EXTRACT.
- Repeated navigation markup on all five pages must link each specialist to the same correct agent key and contain no locked state.
- Mobile logo sizing and the longest stage sequences must not overflow narrow layouts.

---

## File Structure

- Create `assets/js/agents.js`: source-derived registry, key resolution, and pure configuration accessors.
- Modify `assets/js/adam.js`: render the selected specialist and make message templates inherit its identity.
- Modify `chat.html`: add stable data hooks, neutral fallback markup, and load `agents.js` before `adam.js`.
- Modify `index.html`, `review.html`, `vault.html`, `launch.html`, and `chat.html`: unlock and parameterize the seven specialist links.
- Create `assets/images/fas-monogram.svg`: reusable accessible geometric FAS logo artwork.
- Modify the five HTML pages and `assets/css/styles.css`: consume and style the premium logo at desktop and mobile sizes.
- Create `tests/agents.test.js`: registry and resolver unit checks.
- Create `tests/static-multi-agent.test.js`: cross-page routes, rendering hooks, script order, and logo regression checks.
- Modify `tests/static-branding.test.js`: retire assertions tied to the temporary letter mark and retain the resume-CTA checks.
- Modify `README.md`: document the seven local preview URLs and local-only usage.

### Task 1: Specialist Registry and Safe Resolution

**Files:**
- Create: `assets/js/agents.js`
- Create: `tests/agents.test.js`

**Interfaces:**
- Consumes: existing `window.FAS` namespace.
- Produces: `FAS.agents.keys: string[]`, `FAS.agents.get(key?: string): AgentConfig`, and `FAS.agents.resolveKey(key?: string): string`.
- `AgentConfig` fields: `key`, `step`, `name`, `title`, `symbol`, `color`, `outcome`, `stages`, `activeStage`, `messages`, `question`, `hints`, `savedFields`, `completionLabel`, `completionHref`.

- [ ] **Step 1: Write failing registry coverage tests**

Add assertions named `exports_exactly_seven_source_derived_agents`, `each_agent_has_complete_rendering_data`, and `stage_sequences_match_the_approved_spec`. Assert the ordered keys are `anchor, extract, radar, forge, architect, voice, launch`, step numbers are 1–7, and each source-derived stage sequence matches the design spec.

- [ ] **Step 2: Run registry tests and verify RED**

Run: `node tests/agents.test.js`

Expected: FAIL because `assets/js/agents.js` does not exist.

- [ ] **Step 3: Implement the seven-entry registry**

Create an environment-neutral IIFE that attaches the registry to `window.FAS` in browsers and exports it with `module.exports` under Node. Use the exact specialist names, roles, stage order, and safeguards from the approved spec; write one representative opening sequence, question, two hints, and two or three saved fields per entry.

- [ ] **Step 4: Write failing resolver edge-case tests**

Add `resolveKey_normalizes_supported_keys` for `" RADAR "` and `"Voice"`, plus `resolveKey_defaults_empty_or_unknown_to_extract` for `undefined`, `""`, and `"bogus"`. Add a test deleting an optional `hints` or `savedFields` entry from a copied config and assert `get()` returns safe empty arrays.

- [ ] **Step 5: Implement safe resolution and normalized configuration access**

Implement `resolveKey(key)` and `get(key)` so callers receive a normalized configuration without mutating the registry.

- [ ] **Step 6: Run registry tests and verify GREEN**

Run: `node tests/agents.test.js`

Expected: PASS with seven agents and all resolver cases passing.

### Task 2: Data-Driven Chat Rendering

**Files:**
- Modify: `chat.html`
- Modify: `assets/js/adam.js`
- Create: `tests/static-multi-agent.test.js`

**Interfaces:**
- Consumes: `FAS.agents.get(key)` and `FAS.agents.resolveKey(key)` from Task 1.
- Produces: `FAS.agent.current: AgentConfig` and `FAS.agent.render(key?: string): AgentConfig`.
- Preserves: `FAS.chat`, `FAS.voice`, `FAS.orb`, `FAS.mode`, and existing `fas:*` events.

- [ ] **Step 1: Write failing chat-shell and script-order tests**

Assert `chat.html` loads `assets/js/agents.js` before `assets/js/adam.js` and contains hooks for agent name, title, step, chip color, stages, opening messages, question, hints, saved fields, completion label/link, voice identity, and message-template identity.

- [ ] **Step 2: Run the static chat test and verify RED**

Run: `node tests/static-multi-agent.test.js`

Expected: FAIL on missing script and rendering hooks.

- [ ] **Step 3: Convert `chat.html` into a progressive shared shell**

Add the required data attributes while retaining readable EXTRACT fallback content. Load `agents.js` immediately before `adam.js`. Keep the existing tab, composer, voice controls, live region, and templates structurally intact.

- [ ] **Step 4: Write failing renderer behavior tests**

Test the renderer-facing pure helpers for all seven configurations, invalid-key fallback, omitted optional arrays, longest stage list, and template identity. Assert each rendered model contains the expected specialist name, step label, first/active stage, question, completion label, and icon symbol.

- [ ] **Step 5: Implement specialist rendering in `adam.js`**

Add `FAS.agent.render(key)` using `URLSearchParams`. Render text with `textContent`, clone structured message/stage/field templates, apply color through the existing `--c` custom property, and set `FAS.agent.current`. Ensure `build()` defaults new agent/note messages to the selected name and symbol.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `node tests/agents.test.js; node tests/static-multi-agent.test.js`

Expected: both commands PASS.

### Task 3: Temporarily Unlock and Route Every Specialist

**Files:**
- Modify: `index.html`
- Modify: `chat.html`
- Modify: `review.html`
- Modify: `vault.html`
- Modify: `launch.html`
- Modify: `assets/js/nav.js`
- Modify: `tests/static-multi-agent.test.js`

**Interfaces:**
- Consumes: the seven canonical agent keys from Task 1.
- Produces: direct local routes `chat.html?agent=<key>` and agent-aware current-step navigation.

- [ ] **Step 1: Write failing cross-page route tests**

For every page, assert exactly one sidebar destination per canonical agent key, no `is-locked` class or lock icon on specialist links, and the dashboard resume CTA points to `chat.html?agent=extract`. Assert the specialist cards on the dashboard use matching destinations.

- [ ] **Step 2: Run route tests and verify RED**

Run: `node tests/static-multi-agent.test.js`

Expected: FAIL because future steps still link to the overview and use locked styling.

- [ ] **Step 3: Replace repeated specialist destinations and preview states**

Update all five sidebars and dashboard specialist cards to use canonical query URLs. Use a neutral accessible state for temporarily available future agents; do not mark them completed.

- [ ] **Step 4: Add agent-aware navigation selection**

In `nav.js`, when `body[data-page="chat"]`, resolve the query through `FAS.agents.resolveKey()` and add the active class plus `aria-current="step"` only to the matching `[data-agent-link]`.

- [ ] **Step 5: Run route and registry tests and verify GREEN**

Run: `node tests/agents.test.js; node tests/static-multi-agent.test.js`

Expected: PASS for all five pages and seven routes.

### Task 4: Premium Reusable FAS Monogram

**Files:**
- Create: `assets/images/fas-monogram.svg`
- Modify: `assets/css/styles.css`
- Modify: `index.html`
- Modify: `chat.html`
- Modify: `review.html`
- Modify: `vault.html`
- Modify: `launch.html`
- Modify: `tests/static-branding.test.js`

**Interfaces:**
- Consumes: existing `.brand`, `.brand__mark`, and `.brand__name` layout contracts.
- Produces: one reusable SVG logo referenced by every desktop and mobile header.

- [ ] **Step 1: Replace temporary-logo assertions with failing SVG-logo assertions**

Assert the SVG contains a `viewBox`, `role="img"`, accessible title, metallic-gold gradient, ivory detail, geometric paths, and no text glyph dependency. Assert every page references `assets/images/fas-monogram.svg` in both desktop and mobile brand links and no `.brand__letter` markup remains.

- [ ] **Step 2: Run branding tests and verify RED**

Run: `node tests/static-branding.test.js`

Expected: FAIL because the reusable SVG does not exist and pages still use letter spans.

- [ ] **Step 3: Create the FAS monogram**

Draw a compact, interlocking F/A/S mark with deterministic SVG paths, a restrained gold gradient, and ivory highlight strokes. Use a square or compact horizontal `viewBox` that remains legible near 40 CSS pixels; include no raster data, animation, or external fonts.

- [ ] **Step 4: Integrate and style the logo**

Replace temporary letter spans with `<img>` references using concise `alt="FAS"`; use empty alt only if the adjacent expanded wordmark supplies the same accessible name. Update `.brand__mark` sizing for desktop/mobile and add a subtle focus/hover treatment that does not move layout.

- [ ] **Step 5: Run branding and multi-agent tests and verify GREEN**

Run: `node tests/static-branding.test.js; node tests/static-multi-agent.test.js`

Expected: both commands PASS.

### Task 5: Local Documentation and Full Verification

**Files:**
- Modify: `README.md`
- Modify: `tests/static-multi-agent.test.js` if final integration coverage exposes a gap.

**Interfaces:**
- Consumes: all completed local routes and test commands.
- Produces: local preview instructions and a verified static release candidate.

- [ ] **Step 1: Write failing documentation assertions**

Assert the README names all seven `chat.html?agent=<key>` preview URLs, states that the preview is local/static, and says that chat submissions do not call a backend or generate replies.

- [ ] **Step 2: Run documentation test and verify RED**

Run: `node tests/static-multi-agent.test.js`

Expected: FAIL on missing preview documentation.

- [ ] **Step 3: Update local preview documentation**

Document opening `index.html`, direct specialist URLs, temporary unlock behavior, static chat limitations, and the command used to run all dependency-free checks.

- [ ] **Step 4: Run the full automated suite**

Run: `node tests/agents.test.js; node tests/static-multi-agent.test.js; node tests/static-branding.test.js`

Expected: all commands exit 0 with no assertion failures.

- [ ] **Step 5: Search for integration regressions**

Run: `rg -n "is-locked|brand__letter|WAV" -g "*.html" -g "*.css" -g "*.js" -g "*.md" .; rg -n -F 'href="chat.html"' -g "*.html" .`

Expected: no unintended locked specialist state, bare specialist chat route, temporary letter logo, or legacy WAV branding in production files. Exclude explicit historical assertions in tests if present.

- [ ] **Step 6: Perform local manual verification**

Open each of the seven URLs locally. Check desktop and narrow viewport layouts, agent identity/stages/content, keyboard navigation, Type/Talk switching, message submission, invalid-agent fallback, dashboard Step 2 resume behavior, and logo clarity. Record any limitations honestly; do not deploy.
