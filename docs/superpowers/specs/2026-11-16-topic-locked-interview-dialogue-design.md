# Topic-Locked Interview Dialogue Design

## Intent

Users can discuss one active interview question with ADAM for as many turns as needed. Clarifications, follow-up questions, reactions, uncertainty, and incomplete thoughts remain conversational and are never mistaken for the saved interview answer.

## Behavior

- Controls and pending confirmations retain first priority.
- Every ordinary Talk or Type turn is classified against the exact active question and its question-local dialogue history.
- `discussion` turns receive a concise ADAM response grounded only in the active question, specialist context, and recent question-local conversation.
- ADAM may ask one useful guiding follow-up inside the current topic, but cannot introduce a replacement interview question, answer for the user, save, or advance.
- `answer_candidate` is returned only when the user's latest words independently and substantively answer the canonical question. The existing validation and relevance gate still makes the final save decision.
- The conversation can continue for unlimited turn count. A rolling bounded history is sent to the model so memory use and request size remain safe; the canonical question is always resent.
- When the answer is accepted and the engine advances, the question-local dialogue state resets.
- API failure keeps the same question active, saves nothing, and gives a truthful retry cue.

## Architecture

Replace the narrow client-side question classifier as the primary router with a protected `/api/interview-turn-response` endpoint using strict structured output: `{kind: "discussion", message: string}` or `{kind: "answer_candidate", message: ""}`. The client calls it for each ordinary active-interview turn, tracks a question identity plus rolling history, speaks discussion responses in Talk, and sends only answer candidates through existing validation/relevance/durable-save paths.

## Approaches

1. **Semantic turn router with existing save gate (selected):** understands follow-up statements as well as questions while preserving deterministic controls and the established save safeguards.
2. **Sticky local discussion flag:** routes all weak responses to dialogue after the first question, but local keyword relevance can still save a conversational statement prematurely.
3. **Expand question regexes:** cheap but cannot reliably distinguish a nuanced follow-up from a real answer and repeats the current failure mode.

## Constraints

- Stay strictly within the current question topic and supplied context; no browsing or invented facts.
- Never persist side-dialogue as an answer or raw audio.
- Maintain hands-free Talk playback and continuous listening.
- Bound each request and history item; unlimited means unlimited turns, not unbounded payload size.
- Preserve current answer confirmation semantics for uncertain answer candidates.

## Verification

Tests cover second and later follow-ups, follow-up statements without question marks, genuine answer candidates, unrelated requests, question changes resetting local dialogue, endpoint structured output/validation/authentication, API failure, Talk speech, Type rendering, and no durable submission from discussion turns.
