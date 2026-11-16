# Answer Relevance Confirmation Design

## Intent

Prevent conversational or unrelated speech from being stored as interview evidence. Phrases such as â€œWhat was that again?â€, â€œI cannot understand,â€ and â€œIâ€™m trying to understand youâ€ must never be accepted as profile answers.

## Selected approach

Use deterministic local classification. This keeps Type and Talk fast, predictable, and available without another AI request. The alternativeâ€”calling an AI relevance classifier before every saveâ€”was rejected because it adds latency, cost, and a new failure path to every answer.

## Behavior

Before durable submission, every Type and Talk response passes through one shared gate:

1. Explicit repeat language, including natural variants such as â€œWhat was that again?â€, repeats the current question and is consumed as a control.
2. Confusion and meta-conversation such as â€œI cannot understandâ€ or â€œIâ€™m trying to understand youâ€ is never saved. ADAM explains briefly and repeats or clarifies the current question.
3. Clearly usable answers continue to the existing save path.
4. A substantive response that appears unrelated or cannot be confidently connected to the current question is held in memory and shown back to the user: â€œThis may not answer the current question. Save it anyway?â€
5. Yes saves the held response exactly once. No discards it and repeats the current question. Until the decision is made, nothing is persisted or used to advance the interview.

## Relevance rules

The gate uses the current question, its field, and the specialistâ€™s declarative question contract. It combines field-specific concepts with answer shape and explicit meta/conversational patterns. It will be conservative: short valid answers such as names, numbers, dates, audiences, and concise evidence remain acceptable; only clearly meta/confused input is rejected outright, while uncertain substantive input is confirmed rather than silently discarded.

## UI and accessibility

Reuse the established native confirmation-dialog pattern, with relevance-specific copy and actions. The same pending decision is answerable by dialog buttons, typed yes/no, or spoken yes/no. Focus remains trapped in the dialog, and Talk pauses normal answer submission while the decision is pending.

## Safety and failure handling

- A held answer exists only in page memory until confirmed.
- Repeated transcript events cannot save it twice.
- Cancel/no returns to the same question.
- Page reload discards an unconfirmed answer.
- Commands and retry confirmation continue to take precedence.

## Verification

Tests will cover the three reported phrases, ordinary short valid answers, clearly unrelated responses, confirmation yes/no for Type and Talk, duplicate voice events, and persistence ordering.

