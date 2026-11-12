# Premium Talk View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the supplied premium black-and-gold Talk composition while preserving every existing voice behavior.

**Architecture:** Reorganize the existing voice panel into semantic stage, question, utility, and transcript/control regions. Apply native CSS Grid and existing orb/HUD elements; keep all `data-*` behavior hooks unchanged.

**Tech Stack:** HTML, CSS Grid/Flexbox, SVG/CSS animation, Node tests, Playwright

**Spec:** `docs/superpowers/specs/2026-11-12-premium-talk-view-design.md`

## Global Constraints

- Predominantly black and gold; green is a minor status accent.
- Preserve all existing voice data hooks and completion behavior.
- No unsupported Attach, Browse, or Use Tools controls.
- No horizontal overflow; reduced motion remains supported.
- Propagation gate remains unchanged.

## Review Focus

- Desktop composition matches the reference hierarchy without clipping.
- Green does not dominate the stage, borders, or ambient background.
- Microphone, end, Type fallback, transcript, status, and recovery remain present and reachable.
- Tablet/mobile collapse decorative HUDs without losing functional controls.
- Long question/transcript text wraps without overlapping the voice controls.

---

### Task 1: Premium Talk composition

**Files:**
- Modify: `chat.html`
- Modify: `assets/css/styles.css`
- Generated: `public/chat.html`, `public/assets/css/styles.css`
- Test: `tests/chat-geometry.test.js`, `tests/static-multi-agent.test.js`

**Interfaces:**
- Consumes: existing `data-orb`, `data-voice-*`, `data-agent-question`, and Type/Talk hooks.
- Produces: a responsive black-and-gold Talk layout with unchanged behavioral selectors.

- [ ] Add failing structural and browser geometry assertions for the three-column desktop stage, bottom controls, mobile containment, and restrained green treatment.
- [ ] Run focused tests and confirm they fail for the current Talk panel.
- [ ] Reorganize existing voice markup without removing or renaming behavioral hooks.
- [ ] Add scoped Talk styling and responsive fallbacks.
- [ ] Build generated public assets and run focused tests.
- [ ] Run the complete test suite and commit.

