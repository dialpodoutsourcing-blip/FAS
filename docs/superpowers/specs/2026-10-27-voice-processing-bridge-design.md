# Voice Processing Bridge Design

## Intent

Remove the awkward silence between a settled spoken answer and ADAM's full response without weakening answer-boundary protection.

## Behavior

- Keep the existing 1.5-second transcript settling window unchanged.
- After a normal interview answer settles and microphone capture pauses, immediately ask the active Realtime voice session to speak: `Got it—let me capture that.`
- Start durable saving and response generation without waiting for the bridge audio to finish.
- When the grounded response is ready, speak it through the existing path; it may replace the bridge if processing finishes unusually quickly.
- Do not play the bridge for voice commands, retry confirmations, completed-work advisory chat, or failed/duplicate turns.

## Approaches

- Selected: a deterministic spoken bridge concurrent with durable processing. It removes dead air without risking unsaved advancement.
- Rejected: shortening the settling window, which reintroduces split answers.
- Rejected: responding before persistence completes, which weakens correctness and durability.
