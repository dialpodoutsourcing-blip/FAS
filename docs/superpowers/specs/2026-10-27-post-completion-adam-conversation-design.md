# Post-Completion ADAM Conversation Design

Date: 2026-10-27
Status: Awaiting approval

## Intent

Keep ADAM useful after a specialist interview is complete. Finishing ANCHOR should preserve the finished blueprint while opening a conversational mode where the user can ask normal questions, review or revise prior work, and move naturally to EXTRACT.

## Goals

- Continue typed and spoken conversation after ANCHOR completes.
- Answer both FAS-related and unrelated questions, then briefly reconnect each unrelated exchange to the current FAS decision.
- Keep completed answers and artifact versions unchanged unless the user explicitly chooses an edit or retry action.
- Make the primary chat thread vertically scrollable so earlier messages remain reachable.
- Show a persistent completed-work panel with clear status and actions: View Blueprint, Edit Answers, Retry ANCHOR, and Start EXTRACT.
- Recommend EXTRACT as the default next specialist after ANCHOR.

## Non-goals and safeguards

- Ordinary post-completion conversation never edits saved answers, checkpoints, or artifacts.
- ADAM does not restart ANCHOR merely because a user asks a question or disagrees with a recommendation.
- Unrelated answers remain concise and do not turn the product into an unbounded general chat surface; ADAM answers the question and then offers a short bridge back to ANCHOR, EXTRACT, or the next FAS action.
- Retry is destructive to the selected specialist's active work and therefore requires an explicit confirmation using the existing agent-scoped reset behavior.

## Chosen experience

When ANCHOR reaches completion, ADAM speaks the completion message, saves and generates the blueprint, and remains in a post-completion conversation state instead of destroying the voice session or disabling the composer. ADAM presents the completed-work panel and asks whether the user wants to review, edit, retry, or continue to EXTRACT.

Post-completion messages use a dedicated advisory endpoint/prompt supplied with the completed specialist identity, a bounded conversation history, and a grounded summary of saved work. The response answers the user's message first. If the question is unrelated, it adds one brief transition back to the current workflow. It must not claim that saved work changed unless an explicit action completed successfully.

The main text thread uses vertical scrolling with newest-message auto-scroll. Existing History and Saved Work drawers remain available. The completed-work panel stays visible near the composer and reports the current specialist as complete. Edit Answers opens saved work with editable answer actions; View Blueprint opens Review; Retry invokes the existing confirmed specialist reset; Start EXTRACT opens the EXTRACT specialist.

Talk mode remains active after completion. Final transcripts are routed to post-completion conversation rather than the interview coordinator. ADAM speaks the advisory response, then returns to listening. End, Pause, Type instead, interruption, and failure recovery keep their existing meanings.

## Approaches considered

### FAS-only advisor

Restrict post-completion questions to the blueprint and workflow. This is easiest to ground, but it does not meet the requested ability to answer unrelated questions.

### General conversation with a quick FAS return — selected

Answer normal and unrelated questions concisely, then reconnect to reviewing ANCHOR, editing it, retrying it, or starting EXTRACT. This preserves conversational freedom without losing the product's purpose.

### Fully general assistant

Allow unrestricted ongoing chat without a workflow bridge. This was rejected because it would make the specialist experience lose direction and weaken the value of completion and next-step guidance.

## Verification

- Completing ANCHOR leaves Type and Talk usable without accepting additional interview answers.
- Post-completion messages do not mutate answers, checkpoints, or artifact versions.
- An unrelated question receives an answer plus a concise return to the FAS workflow.
- Talk speaks each post-completion response and resumes listening.
- The main thread scrolls and earlier messages remain accessible.
- Completed-work actions route correctly and Retry requires confirmation.
- Starting EXTRACT preserves ANCHOR's completed artifact.
- Existing incomplete-interview behavior and the full test suite remain green.
