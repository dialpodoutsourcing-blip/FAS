# Chat Retry Command Design

## Intent

Let a user restart the current specialist at any time using an always-visible chat control or a natural typed/spoken request.

## Behavior

- Add a Retry control to the chat toolbar so it is available before and after completion.
- Recognize explicit phrases including `retry`, `start over`, `start from the start`, and `start again` in Type and Talk.
- ADAM asks for confirmation before deleting current-specialist work.
- A clear yes resets only the current specialist through the existing `restart=1` flow, then reloads its introduction and first question.
- A no cancels without changing saved work.
- Other specialists and project data remain untouched.

## Approaches

- Selected: route button, Type, and Talk through one client-side confirmation state and the existing scoped reset flow. This avoids duplicate deletion logic.
- Rejected: immediate reset on every matching phrase, because transcription mistakes could destroy current-step work.
- Rejected: a server-side reset endpoint, because persistence already exposes a scoped authenticated/local reset operation.
