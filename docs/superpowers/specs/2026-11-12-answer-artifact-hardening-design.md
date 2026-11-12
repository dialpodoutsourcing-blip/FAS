# Answer and Artifact Hardening Design

## Intent

Make completed ANCHOR and EXTRACT interviews produce documents grounded in the current run. Reset must stop an older artifact from remaining active, follow-up answers must add context instead of replacing the main answer, and EXTRACT must build a useful partial document when some fields are unavailable.

## Scope

- Retire the active specialist artifact when that specialist is reset while preserving immutable approved history.
- Append a fresh artifact version when a new run completes.
- Aggregate a field's main answer and qualifying follow-ups in chronological order.
- Build EXTRACT from every usable answer and represent unavailable fields as explicit gaps.
- Add regression coverage for local storage, Supabase requests/database contracts, aggregation, and partial EXTRACT generation.

## Deferred

Permission resolution is intentionally excluded from this pass. Replies such as â€œyes, save this,â€ â€œpublic,â€ and â€œkeep privateâ€ will continue to behave as they do now until separately reviewed. Authentication of `/api/artifact-synthesis` and attachment issues 5â€“23 are also outside this pass.

## Constraints

- Approved artifact-version rows remain immutable and auditable.
- Reset must not delete historical approved versions.
- A retired artifact must not appear as the current Vault/review document.
- A new completed run reuses the canonical artifact identity and increments its version.
- Aggregation must not include empty, incomplete, pending, or private answers.
- Missing EXTRACT input must produce visible gaps, not prevent artifact creation.
- No new runtime dependency.

## Approaches

### Reader-only repair

Merge duplicate fields and tolerate missing EXTRACT fields only when building artifacts. This is small, but malformed future records would continue accumulating and stale artifacts would remain a lifecycle problem.

### Persistence-only repair

Improve reset and future answer metadata without making readers resilient. This protects new runs but can still fail on existing accounts containing duplicate or incomplete answer rows.

### Persistence plus resilient readers â€” selected

Add an authenticated reset RPC that retires the canonical artifact while preserving its versions, record follow-up relationships consistently, and make artifact aggregation robust to both existing and future records. This is the safest option because it repairs the lifecycle boundary and still handles already-saved account data.

## Design

### Artifact lifecycle

Add `retired` as an artifact status and a security-definer `reset_fas_agent` RPC. In one transaction the RPC verifies the signed-in editor, deletes the selected specialist's answers, clears its interview checkpoint/state, and marks its current artifact row retired. It does not modify or delete approved artifact-version rows. Browser reset calls this RPC rather than issuing separate REST mutations.

Project loading excludes retired artifacts and their versions from current review/Vault selection. `save_fas_artifact` continues locating the canonical artifact by project, specialist, and type; completing a rerun increments `current_version`, writes a new draft version, and restores the artifact status to `draft`. The local store mirrors these semantics while retaining historical versions.

### Follow-up aggregation

Artifact collection groups usable answers by exact field in creation order. The first usable response remains the main answer. Later clarification/probe responses for that field are appended as clearly separated supporting detail instead of replacing it. True revisions linked as deliberate replacements remain replacements rather than concatenations. The produced source record retains stable IDs so synthesis citations remain valid.

Because permission resolution is deferred, pending and private rows remain excluded exactly as they are today.

### Partial EXTRACT generation

ANCHOR retains its current completeness requirement. EXTRACT collection returns the usable fields it has instead of returning `null` when one field is absent or permission-blocked. The deterministic artifact builder receives those answers and creates explicit gap content/warnings for missing fields. Synthesis requests use only available usable answers; if synthesis cannot produce a valid premium report, the existing grounded deterministic fallback remains the saved artifact.

## Success Criteria

- Resetting ANCHOR or EXTRACT removes its old artifact from current review/Vault views without destroying approved history.
- Completing the rerun creates the next version from only the rerun's usable answers.
- A main answer and its follow-up both appear in synthesis input in the correct order.
- Missing EXTRACT fields no longer prevent saving an Expertise Map.
- The generated partial map visibly identifies missing sections.
- Existing unrelated tests continue to pass.
