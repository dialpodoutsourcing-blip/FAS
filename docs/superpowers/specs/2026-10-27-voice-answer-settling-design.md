# Voice Answer Settling Design

## Intent

Prevent ADAM from saving and advancing after a natural speaking pause while the user is still explaining the same answer.

## Behavior

- Hold a completed transcript segment for 1.5 seconds before delivering it to the interview coordinator.
- If speech resumes during that window, cancel the pending delivery and combine the next completed segment with the first.
- Deliver the combined text once, using a stable combined turn identity, then allow the existing save-and-advance flow to continue.
- On an explicit stop, flush a pending complete transcript before cleanup; never promote an incomplete partial transcript.
- Voice commands remain immediate and are not changed by this work.

## Approaches

- Selected: client-side transcript settling in `realtime-interviewer.js`. This fixes the boundary where premature segments enter application state and can be tested deterministically.
- Rejected: increasing semantic VAD eagerness alone. The session already uses low eagerness, and natural pauses can still produce separate completed items.
- Rejected: requiring a spoken completion phrase. It is reliable but makes every answer less conversational.

## Constraints

No new dependencies. Existing duplicate suppression, pause/resume behavior, and safe shutdown semantics must remain intact.
