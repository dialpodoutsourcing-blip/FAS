# Context-Locked Talk Questions Design

## Intent

Let users ask ADAM basic questions, ask what the current interview question means, or request clarification without those requests being mistaken for interview answers. ADAM answers briefly, remains inside the current specialist context, and advances only after a valid interview answer is accepted and saved.

## Goals

- Detect direct questions and clarification requests before spoken-answer validation and relevance scoring.
- Answer basic questions when they can be answered within the current interview/specialist context.
- Explain or rephrase the current interview question in plain language.
- Never save a side question as an interview answer.
- Never advance the interview after answering a side question.
- Resume listening with the exact same current question still active.
- Vary acknowledgement, clarification, and relevance-confirmation wording without changing meaning or safety.

## Non-goals

- General-purpose web search or broad off-topic chat during an active interview.
- Changing the canonical interview questions.
- Treating a question containing useful evidence as an answer without explicit user intent.
- Advancing on acknowledgements, confusion, or ADAM’s own explanation.

## Selected approach

Add a dedicated context-locked interview-question route. The client identifies question/clarification intent before answer handling and sends the user’s request, the exact current question, specialist identity, and bounded recent conversation history to a server endpoint. The server instructs the model to answer only within that context, remain concise, avoid inventing facts, and not ask or select a different interview question.

After ADAM answers, the client speaks a short return cue followed by the unchanged current question and resumes listening. The interview engine, checkpoint, answer store, and question index are not touched.

Alternatives rejected:

- Local templates only: safe but cannot answer varied natural basic questions.
- Reusing accepted-answer acknowledgement: that route assumes an answer was saved and appends the next question, which would falsely advance the interview.

## Intent classification

The route recognizes:

- explicit clarification: “What do you mean?”, “Can you explain that?”, “Can you clarify the question?”;
- basic questions phrased as direct interrogatives relevant to the current prompt or specialist;
- short contextual questions such as “Can you give me an example?” or “Why does that matter?”

Standalone interview controls—repeat, pause, switch to Type, retry, navigation, and end—retain priority. Confirmation replies retain priority while a decision is pending. Ordinary declarative answers continue through validation and relevance handling.

## Context lock

The server receives no external browsing capability. It must:

- answer from the supplied current question, specialist description, and recent interview context;
- state briefly when a request falls outside that context;
- avoid inventing customer facts, results, or definitions specific to the user;
- avoid answering the interview question on the user’s behalf;
- return one concise answer without a new interview question.

The client always returns to the same canonical current question after the answer.

## Varied wording

Fixed repeated phrases are replaced by small, deterministic rotating copy sets. Variants cover:

- returning from a clarification to the current question;
- uncertain-relevance save confirmation;
- invalid yes/no confirmation replies;
- clarification fallback when the server is unavailable.

All variants preserve the same instructions and never imply an answer was saved when it was not.

## Failure behavior

- API unavailable: ADAM uses a varied grounded fallback that rephrases the purpose of the current question without inventing an answer.
- Empty or malformed request: nothing is saved; ADAM asks the user to repeat and keeps the same question.
- Duplicate voice turn: handled once by the existing finalized-turn protections.
- User interrupts ADAM: existing Realtime interruption behavior applies; the current interview question remains unchanged.

## Security and privacy

- Authenticate and authorize the specialist using the existing protected-request pattern.
- Bound request size and recent history.
- Return only safe model text; do not expose upstream errors.
- Do not send raw audio—only finalized transcript text already handled by FAS.

## Testing

Tests prove clarification/basic questions bypass answer submission and question advancement, server prompts are context-locked, fallback/variant copy stays truthful, controls retain priority, and valid answers still save and advance normally.
