# Voice Resume Recovery

## Intent

Ensure a returning user resumes the real saved interview position and hears an appropriate spoken welcome. A temporary Supabase loading problem must never appear as a brand-new interview.

## Goals

- Distinguish a genuinely new interview from one restored with saved answers or checkpoint progress.
- For restored in-progress work, speak: “Welcome back. Let’s continue where you left off.” followed by the exact current question.
- Keep the existing full hands-free orientation for genuinely new interviews.
- If catalog or project restoration fails, do not construct a fresh interview, enable capture, or display question one.
- Show a visible retry action that reloads persistence from Supabase without changing saved data.
- Mark startup speech delivered only when the Realtime interviewer accepts it for playback.

## Non-goals

- Do not cache authoritative interview state in the browser.
- Do not automatically reset or rewrite checkpoints.
- Do not change answer saving, question order, or completion behavior.

## Approaches

1. **Supabase-only recovery (selected):** fail closed on restoration errors, provide an explicit retry, and resume only from confirmed cloud state. This prevents stale or false progress.
2. **Browser-cache fallback:** faster during outages, but can disagree with Supabase and show the wrong question.
3. **Current fresh-interview fallback:** keeps the screen usable but falsely presents question one and risks duplicate answers.

## Behavior

Persistence initialization records whether the loaded project contains current-agent answers or a meaningful checkpoint. Successful restoration enables Talk and selects either the returning-user greeting or new-user orientation. Failed restoration leaves the interview unavailable, keeps microphone capture from starting, displays a truthful loading error, and exposes “Retry loading.” Retrying performs the same read-only initialization and removes the recovery state only after success.

