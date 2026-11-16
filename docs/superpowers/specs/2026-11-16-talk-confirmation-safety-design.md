# Talk Confirmation Safety Design

## Intent

Prevent Talk relevance confirmation from saving a questionable answer when the user says a restart command, and keep the Type fallback usable if the user changes modes while an answer is held.

## Goals

- Relevance confirmation accepts only explicit save/discard replies.
- `restart`, `start over`, and other retry commands never mean “save this answer.”
- Talk remains hands-free: ADAM speaks the prompt and listens for a decision.
- Type and Talk resolve the same held-answer gate exactly once.
- Invalid decisions leave the answer unsaved and ask again.

## Non-goals

- Changing the existing restart confirmation flow.
- Reworking speech transcription, interview scoring, or question content.
- Adding another modal to Talk.

## Constraints

- Preserve the native Type confirmation dialog when Type initiates the questionable answer.
- Preserve the current production build process and generated `public/` asset.
- Add regression coverage before changing production behavior.

## Approaches

### Selected: dedicated relevance-decision parser

Add a small parser whose vocabulary is limited to explicit save/discard decisions. Use it in pending relevance-confirmation paths and resolve the submission gate directly from either mode. This keeps relevance and destructive restart semantics separate.

### Rejected: context flag on the shared retry parser

This changes fewer call sites but leaves unrelated meanings coupled in one parser and makes future regressions more likely.

## Expected behavior

- “Yes” or “save it” saves the held answer once.
- “No” or “don’t save it” discards it and ADAM repeats the unchanged question.
- “Restart,” “start over,” an unrelated reply, or an ambiguous phrase does not save the answer; ADAM asks for yes or no again.
- If the user switches to Type while a Talk answer is held, typed yes/no resolves the same held answer without requiring the Talk modal to be open.
