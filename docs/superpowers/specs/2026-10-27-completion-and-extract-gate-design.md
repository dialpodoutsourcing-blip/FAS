# Completion acknowledgement and EXTRACT progression gate

## Intent

Make the end of ANCHOR and EXTRACT unmistakable in both Type and Talk, while enforcing the intended sequence: users finish ANCHOR before they can enter EXTRACT.

## Chosen experience

- After the final answer is durably saved, ADAM adds a persistent completion card to the conversation naming the completed specialist.
- In Talk, ADAM speaks the same completion acknowledgement before navigation.
- The card includes a specialist-specific `Review ANCHOR` or `Review EXTRACT` button.
- Blueprint generation continues automatically and the user is redirected to the review page when it is ready.
- Returning from review to Chat restores the completed state and the Review button instead of showing an unanswered-looking conversation.
- EXTRACT is visibly locked in the dashboard/sidebar until a completed ANCHOR artifact has been saved.
- Direct navigation to EXTRACT while locked is rejected and returns the user to ANCHOR with a clear explanation.

## Completion and unlock rule

ANCHOR counts as finished only when its artifact has been successfully saved. Answers alone do not unlock EXTRACT, preventing access during failed or unfinished blueprint generation. Existing users with a saved ANCHOR artifact remain unlocked.

## Approaches considered

1. **Persistent completion card plus automatic review redirect — selected.** Preserves the guided workflow, provides immediate confirmation, and remains useful when the user returns to Chat.
2. **Stay on the completion screen.** Clear, but adds an unnecessary manual step before reviewing the generated work.
3. **Temporary toast only.** Rejected because it can disappear during generation or navigation and recreates the original ambiguity.

## Scope and safeguards

- Use the existing artifact/checkpoint persistence and completion conversation state.
- Apply the progression gate consistently to dashboard links, shared navigation, and the EXTRACT chat route.
- Do not delete or alter saved ANCHOR or EXTRACT work.
- Do not change paid specialist entitlement rules.
- Add regression tests for final-answer completion in Type and Talk, restored completed Chat, dashboard lock state, and direct EXTRACT navigation.

