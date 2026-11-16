# Hands-Free Relevance Confirmation Design

## Intent

Keep Talk genuinely hands-free when ADAM hears an answer that may not relate to the current question.

## Selected approach

Reuse the existing relevance assessment and one-shot pending-answer gate, but choose the confirmation presentation by input mode. Talk uses speech only; Type keeps the accessible native dialog. A modal in Talk was rejected because it requires visual attention and manual interaction.

## Talk behavior

When relevance is uncertain, ADAM pauses normal answer submission and says: “That may not answer the current question. Should I save it anyway? Say yes to save it, or no to hear the question again.” The microphone then listens for the decision. Yes saves the held answer exactly once. No discards it, and ADAM speaks the unchanged current question. Any other response prompts ADAM to ask for yes or no again. No relevance modal opens in Talk.

## Type behavior

Type continues to show the native confirmation dialog with the current question, held answer, and explicit save/repeat actions.

## Safety and verification

The answer remains in memory and unsaved until yes. Duplicate transcript events cannot save twice. Tests cover the absence of a Talk modal, spoken prompt delivery, microphone decision handling, yes/no behavior, invalid confirmation replies, and unchanged Type behavior.

