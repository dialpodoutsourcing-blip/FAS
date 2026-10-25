# FAS Production Agent System Design

## Intent

Turn the existing static FAS member-area prototype into a production-oriented, database-backed guided-authority system. Preserve its established visual identity while adding professional specialist motion, adaptive interviews for all seven agents, durable project memory, and approved PDF/DOCX deliverables.

The product serves level 1–2 experts who possess useful experience but may not understand marketing, funnels, program design, or production. The experience must draw out their actual knowledge without fabricating evidence or forcing them to repeat approved information.

## Goals

- Animate each existing specialist emblem and graphic background in a restrained, distinctive way without redrawing them.
- Replace static scripted chat with a shared guided-interview engine configured separately for ANCHOR, EXTRACT, RADAR, FORGE, ARCHITECT, VOICE, and LAUNCH.
- Cover every applicable chapter and acceptance requirement in the 35-page FAS build specification.
- Incorporate the Extractor Agent Build Brief's responsive follow-up rules, curriculum loop, consent rules, and completion audit.
- Store project facts, evidence, interviews, approvals, generated artifacts, revisions, and exports in Supabase.
- Generate the approved artifact version as both a designed PDF and an editable DOCX.
- Ensure each artifact is evidence-grounded, editable, recoverable, and reusable by downstream agents.

## Non-goals

- Replacing the existing icons, graphic backgrounds, typography, or brand palette.
- Claiming trademark clearance, legal advice, medical guidance, revenue guarantees, or unsupported results.
- Implementing Kajabi billing, course progress, or access entitlement; Supabase remains authoritative only for FAS project data.
- Restoring the parked Website Builder or Video Production Guide without an explicit later decision.
- Inventing the missing proprietary content for Dan's Trusted Expert Blueprint. The system may capture and organize user answers while clearly labeling scaffolding.

## Anti-goals

- A question-A/answer-A/question-B chatbot.
- One universal mega-prompt for every specialist or document.
- Static demo PDFs disconnected from approved project data.
- Silent overwrites of approved facts or silent regeneration after shared inputs change.
- Analytics containing conversation text or other unnecessary sensitive information.

## Source hierarchy

1. The user's October 25, 2026 request and approved execution order.
2. `fas-build-specs.pdf`, treated as product requirements reference.
3. “Extractor Agent Build Brief (for Mike D),” treated as domain reference for interview behavior.
4. Existing repository design and test conventions.

Where sources conflict, user instructions win. The September 21 specification's seven active assets remain the build scope; parked assets stay excluded.

## Approaches considered

### Production foundation plus phased agents — selected

Build the canonical data model, interview engine, evidence rules, and export pipeline once. Deliver EXTRACT as the first complete vertical slice, then implement the other six specialists on the same engine. This takes longer before all seven appear complete but prevents duplicated, incompatible behavior.

### All seven agents simultaneously

This gives faster superficial coverage, but multiplies prompt, state, and schema inconsistencies. It was rejected because the user's priority is sophisticated outputs rather than scripted demos.

### Front-end prototype first

This makes the animation work immediately visible but leaves the core request—persistence, adaptive interviews, and dynamic exports—unresolved. It was rejected because the existing repository is already a front-end prototype.

## Existing system and constraints

- The project is plain HTML/CSS/JavaScript served by Express 5.
- `assets/` is source; `npm run build` recreates `public/` from root HTML and `assets/`.
- The seven specialist definitions live in `assets/js/agents.js` and the current chat behavior in `assets/js/adam.js`.
- Existing tests use Node's built-in test runner and static/source assertions.
- Current PDFs are generated demo files and chat data is local-only.
- No production authentication or Supabase dependency exists yet.
- Existing unrelated visual and tutorial behavior must remain intact.

## Architecture

### 1. Supabase canonical project store

An ordered SQL migration will create profiles, workspaces, projects, members, agent definitions, interview sessions, answer records, fact records, evidence sources, approvals, conflicts, gaps, artifacts, artifact versions, exports, dependency links, event logs, launch tasks, and sales records.

Every mutable domain entity uses stable IDs, `created_at`/`updated_at`, and project ownership. Approved facts are versioned rather than overwritten. Row Level Security restricts all project-scoped tables to project members. Public configuration such as agent definitions is readable to authenticated users; writes remain service/admin controlled.

Field status is `draft`, `user_approved`, or `retired`. Evidence basis is `user`, `import`, or `suggestion`. Sensitive-story and testimonial records carry explicit permission states. Generated versions retain input snapshots so their output is reproducible.

### 2. Repository-owned domain modules

Browser-safe modules will own the stable domain behavior independently of the UI:

- agent chapter and field definitions;
- follow-up trigger classification and selection;
- session progression and checkpoint rules;
- completeness and contradiction checks;
- artifact section assembly;
- export request and file-download behavior;
- a data adapter with Supabase REST mode and local demo fallback.

The Express server will own secrets and privileged operations. The browser will never receive the OpenAI API key or Supabase service-role key.

### 3. Guided interview engine

Each agent uses ordered chapters with required fields, optional probes, completion rules, and an output schema. The engine asks one primary question at a time. Answers are saved before advancing. After three to five accepted answers or the end of a chapter, the user receives a correction-ready summary.

Follow-up triggers include vague quantities, ambiguous numbers, abstract principles, surface answers, tactics where emotion is needed, unguarded admissions, freezes, framing difficulty, hedging, partial answers, loose step lists, new curriculum ideas, tools/templates, quotable language, expert shorthand, sensitive stories, public-use candidates, current-business drift, contradictions, rambling, prior answers, undecided choices, self-doubt, decision confirmation, and section completion.

Only one follow-up is asked at a time. The system does not accept a soft number without one additional attempt, never assumes permission, and never repeats a fully answered question. Contradictions become explicit resolution tasks.

### 4. Agent configurations

- **ANCHOR:** authority, arena, evidence, position, boundaries, activation; creates a Trusted Expert Statement and visibility action.
- **EXTRACT:** context, diagnostic/EMI state, origin, experience timeline, method, proof, point of view, boundaries, synthesis; creates an Expertise Map, story bank, proof bank, and gap list.
- **RADAR:** market, evidence, current state, desired state, triggers, objections, language, priority scoring, approval; creates a Buyer Intelligence Brief and validation plan.
- **FORGE:** strategy, territories, candidates, shortlist, stress test, selection, screening, identity brief; creates transparent naming tables and a Brand Identity Brief without legal-clearance claims.
- **ARCHITECT:** transformation, milestones, phases, modules, lessons, implementation, overload, delivery, approval; applies the six-question curriculum loop to every phase and creates a curriculum map and production backlog.
- **VOICE:** input gate, content job, context, gap check, message brief, sectional draft, checks, approval; creates separate channel-specific copy packs from approved inputs only.
- **LAUNCH:** launch type, dates, prerequisites, backward plan, owners, channels, calendar, sales, readiness, review; creates connected launch map, calendar, sales tracker, and readiness dashboard.

### 5. UI integration

The existing `chat.html` shell remains the primary interview surface. It gains dynamic chapters, progress, follow-up rationale, answer status, conflict/gap states, and autosave feedback. `review.html` becomes the artifact approval surface, and `vault.html` becomes the saved version/export surface.

The app must remain useful in local-demo mode. Without Supabase configuration, it stores the same record shapes in local storage and marks the environment as demo/local. With configuration, it uses the authenticated Supabase REST API.

### 6. Icon motion system

Existing SVG paths and card backgrounds remain intact. Animation is additive and agent-specific:

- ANCHOR: slow settling motion and outward ring response.
- EXTRACT: facet glint, restrained tilt, and refraction pulse.
- RADAR: rotating sweep and target-lock pulse.
- FORGE: layered flame flicker and rising ember accents.
- ARCHITECT: measured blueprint trace and construction pulse.
- VOICE: waveform propagation and speaking cadence.
- LAUNCH: upward chevron ignition and momentum trail.

Motion activates on hover/focus, current-agent state, and loader state. Offscreen motion is limited, layout never changes, and `prefers-reduced-motion: reduce` disables nonessential transforms and loops.

### 7. Artifact and export pipeline

Artifacts are semantic JSON first, not HTML blobs. Each agent maps approved facts, quotations, tables, metrics, warnings, and gap lists into named sections. PDF and DOCX are rendered from that same artifact version so content cannot drift between formats.

The design target is approximately 60% substantive text, 10% purposeful visuals, 10% charts/tables, and 20% visual hierarchy/formatting. These are editorial composition targets, not byte-level calculations. Each output uses the FAS palette and typography, includes version and generation information, and distinguishes confirmed facts, hypotheses, warnings, and unresolved gaps.

The initial implementation will use server-side deterministic generation. PDF rendering will use a programmatic PDF library; DOCX rendering will use a standards-based Word library. Export records store status, version, MIME type, file path/object key, checksum, and failure detail. Downloads always refer to a completed export of an approved or explicitly selected draft version.

### 8. API and security

Server routes will cover project bootstrap, interview state, answer submission, artifact generation, approval, and export. Request bodies are schema-validated. IDs are checked against the authenticated project membership. The local demo adapter is intentionally separated from production authorization.

OpenAI prompt execution is server-side and uses structured response contracts. If an AI provider is unavailable, deterministic interview progression and saved answers continue; generation presents a recoverable error without losing work.

Event logging records event type, tool, project, timestamps, and bounded metadata—not messages, answers, document text, or other private free-form content.

## Data and dependency behavior

Approved facts outrank suggestions. A downstream artifact records every fact version it consumed. When an approved shared fact changes, dependency records mark affected artifact versions stale and the UI names exactly which outputs need review. Existing approved versions remain downloadable and recoverable.

The complete project summary can be generated at any time from current approved records. Agent handoffs use only the relevant approved facts and unresolved gaps.

## Error and recovery behavior

- Save after each accepted answer and approved summary.
- Resume at the latest completed checkpoint.
- Retry only a failed generation or export step.
- Preserve answers when the model or export service fails.
- Surface unsupported file types and offer paste as fallback.
- Permit a clean agent restart without deleting project facts.
- Route repeated schema-validation failures to a clearly represented human-review state.

## Testing and quality gates

Tests will cover domain modules, SQL/RLS contract assertions, API validation, the EXTRACT branch rules, all agent configurations, evidence/permission behavior, stale dependencies, PDF/DOCX signatures and content, static UI integration, keyboard/reduced-motion behavior, and the existing regression suite.

The end-to-end acceptance path is: create a project, complete EXTRACT, approve the Expertise Map, reload, resume with the approved artifact intact, open RADAR with approved relevant context, and export the same selected version as PDF and DOCX.

Test personas include novice, experienced, thin-answer, contradictory, unsupported-claim, interrupted, mobile, and expired/unauthorized users.

## Delivery order

1. Foundation and Supabase migration.
2. Shared domain model and guided-interview engine.
3. Complete EXTRACT vertical slice.
4. PDF/DOCX artifact generation and Vault integration.
5. ANCHOR and RADAR.
6. FORGE and ARCHITECT.
7. VOICE and LAUNCH.
8. Specialist animation system across all surfaces.
9. End-to-end quality, security, accessibility, and regression verification.

## Builder calls

- Use local storage as an explicit demo fallback so the current static preview remains testable without cloud credentials.
- Use normalized relational tables plus JSONB snapshots for reproducibility; do not store the whole product as one project JSON blob.
- Keep agent content declarative and repository-versioned so questions can be tested and reviewed.
- Treat the requested content/visual/table/formatting percentages as document design guidance.
- Preserve source assets in `assets/`; regenerate `public/` only through the existing build script.
- The supplied PDF and linked Extractor brief were reviewed before this design was written; their planning-relevant requirements are incorporated above. The original files remain external source references rather than copied repository assets.
- Version 1 uses Supabase Auth's existing authenticated user identity and project membership roles (`owner`, `editor`, `viewer`). It ships the data/RLS contract and session-aware adapter, not a new signup, invitation, or password-recovery user interface.
- Version 1 evidence intake supports pasted text, quotations, and source metadata. The schema can represent stored-file evidence, but binary upload, OCR, transcription, and URL scraping are deferred until supported file types and retention rules are approved.
- The deployment target remains the repository's Express/Vercel shape. Generation and exports are bounded synchronous requests; no worker or queue is assumed. Export bytes may be returned directly, while storage metadata is ready for a later Supabase Storage adapter.
- Local-demo mode must complete interviews and generate/download deterministic PDF and DOCX files through the local Express server without Supabase. AI-enhanced prose remains optional and must fail recoverably when no provider key is present.
- Project deletion is soft by default. A future privileged purge may cascade project-scoped content. Event logs contain no answer/document text. No unapproved retention duration is invented; operational retention automation is deferred and called out in deployment documentation.
