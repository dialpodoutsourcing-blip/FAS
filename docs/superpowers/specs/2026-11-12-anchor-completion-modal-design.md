# ANCHOR Completion Modal Design

## Intent

Give users an unmistakable, controlled finish after ANCHOR's sixth and final answer. Replace immediate blueprint generation and automatic redirection with a premium completion modal that confirms saved work and lets the user deliberately generate and review the Trusted Expert Statement.

## Goals

- Save the final answer before presenting completion.
- Open a centered black-and-gold accessible modal with positive completion copy.
- Use one primary action: **Generate & Review My Trusted Expert Statement**.
- Generate only after the user clicks the action.
- Prevent duplicate generation, keep the modal open during work, and expose progress.
- On success, navigate to the correct review route.
- On failure, retain all answers and offer **Retry Generation** in the same modal.
- Restore the same pending completion state after reload when answers are complete but no artifact exists.

## Non-goals

- Do not change interview questions, answer persistence, artifact content, authentication, or Supabase schema.
- Do not make the required completion step dismissible with Escape or a backdrop click.
- Do not alter post-completion advisory chat once an artifact exists.

## Selected approach

Reuse and upgrade the existing completion panel into a modal dialog controlled by `assets/js/adam.js`. Separate the final-answer save from `generateBlueprint()`: completion opens the modal, and the primary button starts the existing single-flight generation pipeline. This preserves durable behavior while making the transition explicit.

