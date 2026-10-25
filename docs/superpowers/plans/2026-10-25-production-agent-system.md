# FAS Production Agent System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the static FAS prototype into a persistent, evidence-grounded seven-agent interview system with distinctive icon motion and matching PDF/DOCX exports.

**Architecture:** Repository-versioned agent definitions feed a shared browser-safe interview and artifact domain layer. A dual project-store adapter uses Supabase REST when configured and local storage for demo continuity; Express owns bounded export generation and all secrets. One Supabase migration supplies the normalized production schema and RLS policies.

**Tech Stack:** Node.js 22+, Express 5, plain browser JavaScript, CSS/SVG animation, Supabase PostgreSQL/Auth/REST, `pdf-lib`, `docx`, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-10-25-production-agent-system-design.md`

## Global Constraints

- Preserve all existing icon paths, graphic backgrounds, typography, palette, tutorial behavior, and root-source/`public` build convention.
- Ask one primary question at a time and at most one matching follow-up; never fabricate facts, proof, revenue, results, credentials, testimonials, research, clearance, or medical claims.
- User-approved facts outrank suggestions; approved records are versioned and recoverable.
- PDF and DOCX must render from the same artifact version.
- Browser code never receives OpenAI or Supabase service-role secrets.
- Analytics must not contain conversation, answer, or document free text.
- Parked Website Builder and Video Production Guide remain excluded.
- Local demo mode remains functional without Supabase credentials.

## Review Focus

- Thin or vague answers trigger one focused probe and then a visible gap instead of an invented answer; covered in Task 2 tests.
- Conflicting answers remain unresolved until the user confirms one version; covered in Task 2 tests.
- Sensitive stories, testimonials, and quotable claims cannot be public-use evidence without permission; covered in Tasks 1 and 3 tests.
- Cross-project reads/writes are blocked by RLS and server route checks; covered in Tasks 1 and 5 tests.
- PDF and DOCX contain the same selected artifact/version content and remain valid files after download; covered in Task 4 tests.

---

### Task 1: Canonical Supabase data model and store adapter

**Files:**
- Create: `supabase/migrations/202610250001_fas_production.sql`
- Create: `assets/js/project-store.js`
- Create: `tests/database-contract.test.js`
- Create: `tests/project-store.test.js`
- Modify: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Produces: `FAS.projectStore.create(options)`, returning `{ mode, loadProject(), saveAnswer(), saveCheckpoint(), saveArtifact(), approveArtifact(), listArtifacts() }`.
- Produces: relational tables and RLS for projects, memberships, sessions, answers, facts, evidence, approvals, artifacts, versions, exports, dependencies, gaps, events, launch tasks, and sales records.

- [ ] **Step 1: Write failing database contract and store adapter tests** asserting required tables, status/basis constraints, permission fields, RLS enablement/policies, safe event payload constraints, local persistence, and Supabase request headers.
- [ ] **Step 2: Run `node --test tests/database-contract.test.js tests/project-store.test.js`** and verify failure because migration and adapter do not exist.
- [ ] **Step 3: Add the ordered SQL migration and minimal dual-mode store adapter** with demo-local defaults, bearer-token Supabase REST requests, immutable approved snapshots, and no service-role browser configuration.
- [ ] **Step 4: Run the two Task 1 test files and `npm test`** and verify all pass.
- [ ] **Step 5: Document environment values and commit** with message `feat: add FAS project persistence foundation`.

### Task 2: Agent definitions and adaptive interview engine

**Files:**
- Create: `assets/js/interview-engine.js`
- Create: `tests/interview-engine.test.js`
- Modify: `assets/js/agents.js`
- Modify: `tests/agents.test.js`

**Interfaces:**
- Consumes: `FAS.projectStore` from Task 1.
- Produces: `FAS.interview.create({ agent, state })` with `currentQuestion()`, `acceptAnswer(answer)`, `resolveConflict(choice)`, `checkpoint()`, `completion()`, and `buildGapList()`.
- Produces: every agent's `chapters`, `fields`, `outputs`, `completionChecks`, and recovery prompts in `FAS.agents`.

- [ ] **Step 1: Write failing tests** for all seven chapter maps, EXTRACT coverage, one-question behavior, every boss-brief follow-up class, three-to-five-answer summaries, contradiction resolution, consent gating, one retry for soft quantities, curriculum six-loop completeness, resume state, and no-repeat logic.
- [ ] **Step 2: Run `node --test tests/agents.test.js tests/interview-engine.test.js`** and verify expected missing-interface failures.
- [ ] **Step 3: Extend the agent registry declaratively and implement the minimal deterministic engine** with typed answer records, trigger priority, checkpoints, summaries, gaps, and completion results.
- [ ] **Step 4: Run Task 2 tests and `npm test`** and verify all pass.
- [ ] **Step 5: Commit** with message `feat: add adaptive guided interviews for seven agents`.

### Task 3: EXTRACT vertical slice and evidence-grounded artifact model

**Files:**
- Create: `assets/js/artifacts.js`
- Create: `tests/extract-flow.test.js`
- Create: `tests/artifacts.test.js`
- Modify: `chat.html`
- Modify: `assets/js/adam.js`
- Modify: `assets/css/styles.css`
- Modify: `tests/static-multi-agent.test.js`

**Interfaces:**
- Consumes: project store and interview engine.
- Produces: `FAS.artifacts.build(agentKey, projectSnapshot)` and `FAS.artifacts.validate(artifact)`.
- Produces: chat DOM events `fas:answer-saved`, `fas:checkpoint`, `fas:artifact-ready`, and `fas:interview-gap`.

- [ ] **Step 1: Write failing domain and static integration tests** for the complete EXTRACT flow, evidence citations, exact-language preservation, permission labels, Expertise Map sections, gap list, autosave/resume hooks, and dynamic chat rendering.
- [ ] **Step 2: Run Task 3 tests** and verify they fail for missing artifact and integration behavior.
- [ ] **Step 3: Implement the semantic artifact model and connect EXTRACT to the chat UI** while retaining the existing type/talk preview controls and local-demo experience.
- [ ] **Step 4: Run Task 3 tests and `npm test`** and verify all pass.
- [ ] **Step 5: Commit** with message `feat: deliver database-ready EXTRACT vertical slice`.

### Task 4: Matching designed PDF and DOCX exports

**Files:**
- Create: `lib/export-service.js`
- Create: `tests/export-service.test.js`
- Modify: `server.js`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vault.html`
- Modify: `assets/js/adam.js`
- Modify: `assets/css/styles.css`
- Modify: `tests/static-vault-demo.test.js`

**Interfaces:**
- Consumes: validated semantic artifacts from Task 3.
- Produces: `renderPdf(artifact) -> Promise<Buffer>` and `renderDocx(artifact) -> Promise<Buffer>`.
- Produces: `POST /api/exports` with `{ format: "pdf"|"docx", artifact }` and a binary response plus version/checksum headers.

- [ ] **Step 1: Write failing export tests** for schema rejection, PDF/DOCX magic signatures, shared title/version/section content, branded composition primitives, safe filenames, and bounded request size.
- [ ] **Step 2: Run `node --test tests/export-service.test.js`** and verify missing-module failure.
- [ ] **Step 3: Install `pdf-lib` and `docx`, implement deterministic renderers and the validated route**, then connect Vault/chat download controls to selected artifact versions.
- [ ] **Step 4: Run Task 4 tests, `npm test`, and `npm run build`** and verify all pass.
- [ ] **Step 5: Commit** with message `feat: generate matching branded PDF and DOCX exports`.

### Task 5: Artifact review, approval, dependency staleness, and API validation

**Files:**
- Create: `lib/project-api.js`
- Create: `tests/project-api.test.js`
- Modify: `server.js`
- Modify: `review.html`
- Modify: `vault.html`
- Modify: `assets/js/project-store.js`
- Modify: `assets/css/styles.css`
- Modify: `tests/static-vault-demo.test.js`

**Interfaces:**
- Consumes: project-store records and semantic artifacts.
- Produces: validated project/session/answer/artifact/approval endpoints, stale dependency calculation, and review/vault version controls.

- [ ] **Step 1: Write failing tests** for malformed IDs/bodies, project-membership checks, approval versioning, exact stale-dependent lists, compare/restore behavior, and review/vault controls.
- [ ] **Step 2: Run Task 5 tests** and verify missing API/review behavior.
- [ ] **Step 3: Implement minimal validated routes and browser controls**, using local-demo adapter where no authenticated Supabase session exists.
- [ ] **Step 4: Run Task 5 tests and `npm test`** and verify all pass.
- [ ] **Step 5: Commit** with message `feat: add review approvals and dependency tracking`.

### Task 6: Complete ANCHOR, RADAR, FORGE, and ARCHITECT

**Files:**
- Create: `tests/strategy-product-agents.test.js`
- Modify: `assets/js/agents.js`
- Modify: `assets/js/artifacts.js`
- Modify: `chat.html`
- Modify: `review.html`

**Interfaces:**
- Consumes: shared interview/store/artifact interfaces.
- Produces: valid Trusted Expert Statement, Buyer Intelligence Brief, Brand Identity Brief, curriculum map, delivery map, asset inventory, and production backlog artifact types.

- [ ] **Step 1: Write failing acceptance tests** for all four agent schemas, required chapters, buyer scoring transparency, naming stress tests/disclaimers, and six-loop completion for each curriculum phase.
- [ ] **Step 2: Run Task 6 tests** and verify missing output-schema failures.
- [ ] **Step 3: Add only agent-specific definitions, validators, and render mappings** without duplicating shared interview logic.
- [ ] **Step 4: Run Task 6 tests and `npm test`** and verify all pass.
- [ ] **Step 5: Commit** with message `feat: complete strategy and product specialist flows`.

### Task 7: Complete VOICE and LAUNCH

**Files:**
- Create: `tests/sales-agents.test.js`
- Modify: `assets/js/agents.js`
- Modify: `assets/js/artifacts.js`
- Modify: `launch.html`
- Modify: `review.html`

**Interfaces:**
- Consumes: approved expert, buyer, brand, program, proof, boundary, date, and capacity facts.
- Produces: channel-specific copy packs plus launch map, calendar, sales tracker, and readiness dashboard artifacts.

- [ ] **Step 1: Write failing tests** for missing-input gates, per-channel schemas, claim/proof/price/deadline/guarantee warnings, one CTA, launch date dependency recalculation, blackout/completed-task preservation, task ownership, and readiness-source citations.
- [ ] **Step 2: Run Task 7 tests** and verify missing specialized behavior.
- [ ] **Step 3: Implement VOICE and LAUNCH definitions, validators, and artifact mappings** while keeping deadlines recommendations until confirmed.
- [ ] **Step 4: Run Task 7 tests and `npm test`** and verify all pass.
- [ ] **Step 5: Commit** with message `feat: complete copy and rollout specialist flows`.

### Task 8: Specialist motion system and cross-product acceptance

**Files:**
- Create: `tests/specialist-motion.test.js`
- Create: `tests/production-journey.test.js`
- Modify: `index.html`
- Modify: `chat.html`
- Modify: `review.html`
- Modify: `vault.html`
- Modify: `launch.html`
- Modify: `assets/css/styles.css`
- Modify: `assets/js/nav.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: existing `em-*` SVG symbols and selected-agent state.
- Produces: `.em[data-agent-motion]` animation states for seven specialists with hover/focus/active/loader and reduced-motion behavior.

- [ ] **Step 1: Write failing tests** proving each specialist has a unique animation signature, existing symbol paths/background classes remain unchanged, motion is transform/opacity based, reduced motion disables loops, and the end-to-end local journey saves, resumes, approves, hands off, and exports.
- [ ] **Step 2: Run Task 8 tests** and verify missing motion/acceptance behavior.
- [ ] **Step 3: Add additive CSS/SVG motion hooks and finish cross-page integration/documentation** without replacing existing artwork.
- [ ] **Step 4: Run `npm test` and `npm run build`** and verify all tests/build pass.
- [ ] **Step 5: Commit** with message `feat: finish animated production FAS journey`.

### Task 9: Security, accessibility, and final release verification

**Files:**
- Create: `tests/production-security.test.js`
- Modify: files identified by failing release checks only.
- Modify: `README.md`

**Interfaces:**
- Consumes: the complete application.
- Produces: release evidence for RLS contracts, secret isolation, input limits, accessible controls, mobile-safe layouts, reduced motion, build parity, and current regression suite.

- [ ] **Step 1: Write failing release-gate tests** for secret exposure, authorization headers, content disposition, request limits, keyboard labels, live status, mobile overflow protection, and source/public parity.
- [ ] **Step 2: Run Task 9 tests** and verify each new check detects its missing or incomplete behavior.
- [ ] **Step 3: Make the minimum release-hardening changes** required by the failing tests and update setup/SQL/export documentation.
- [ ] **Step 4: Run `npm test`, `npm run build`, then `npm test` again** and verify green source and built-output states.
- [ ] **Step 5: Commit** with message `test: verify FAS production release gates`.
