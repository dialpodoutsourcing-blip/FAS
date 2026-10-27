# Voice Turn Timeout Recovery

## Intent

Prevent hands-free interviews from remaining on “Thinking…” indefinitely when either Supabase or ADAM’s conversational reply service never settles. The spoken answer must never be lost or advanced without confirmed persistence.

## Goals

- Limit Supabase answer/checkpoint persistence to 15 seconds.
- Limit the conversational reply request to 8 seconds.
- If persistence times out, restore the interview checkpoint, preserve the transcript in Type, show the existing recovery controls, and allow a safe retry.
- If persistence succeeds but the reply times out, continue with the exact next interview question and resume hands-free capture.
- Clear busy/thinking state in every success, timeout, and failure path.

## Non-goals

- Do not automatically resubmit timed-out answers; that risks duplicates.
- Do not change question progression, transcription settling, or blueprint generation.
- Do not alter the user’s existing saved answers.

## Approaches

1. **Separate bounded operations (selected):** independently bound persistence and conversational reply calls. This preserves the coordinator’s durable-save boundary and permits a safe reply fallback.
2. **One overall turn timeout:** smaller change, but unsafe because a late save could finish after the UI has recovered.
3. **Reply timeout only:** reduces silence but leaves database stalls capable of freezing the interview.

## Implementation

The Supabase project store will apply a 15-second deadline to each request and abort its fetch when possible. Timeout errors will reject normally so the interview coordinator restores its pre-turn checkpoint. ADAM’s `/api/chat-response` request will use an 8-second deadline; its existing catch path will use the next question as the response. Tests will simulate promises that never settle and verify timeout classification, checkpoint restoration, fallback messaging, and release of busy state.

