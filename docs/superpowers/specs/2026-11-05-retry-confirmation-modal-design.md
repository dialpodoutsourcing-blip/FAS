# Retry Confirmation Modal Design

Date: 2026-11-05
Status: Awaiting approval

## Intent

Replace the conversational retry warning with a focused confirmation modal so users clearly understand that retrying clears the current specialist's saved interview answers before they make a destructive choice.

## Goals

- Use one accessible retry-confirmation modal in both Type and Talk modes.
- Show explicit **Yes, retry** and **No, keep my work** controls.
- Keep spoken Yes/No confirmation working in Talk mode while the modal is open.
- In Type mode, treat clicking outside the modal or pressing Escape as No.
- In Talk mode, require an explicit spoken or clicked Yes/No choice; outside-click and Escape must not decide for the user.
- Preserve the existing agent-scoped retry/reset behavior and blueprint-history safeguards.

## Non-goals and safeguards

- Do not change which specialist data retry clears.
- Do not erase data when the modal opens or when the user declines.
- Do not interpret unrelated speech as confirmation.
- Do not introduce separate modal implementations that can drift between Type and Talk.

## Approaches

1. **One shared modal with mode-aware dismissal — selected.** Both modes use the same UI and confirmation logic. Type permits safe implicit cancellation through outside-click or Escape; Talk waits for explicit Yes/No speech or button input. This keeps the experience consistent while preventing ambient speech or an accidental dismissal from triggering a destructive action.
2. **Separate Type and Talk confirmations.** This allows independent behavior but duplicates UI and state management, making inconsistencies more likely.

## Interaction and accessibility

Opening retry pauses the current confirmation flow and presents a modal titled for the active specialist. The warning says that saved interview answers for that specialist will be cleared, while the existing blueprint remains in history until a completed retry replaces it. Focus moves to the safe No button. Buttons, spoken decisions, and Type-mode dismissal all route through the same decision handler. Choosing No closes the modal, preserves saved work, and resumes the prior mode. Choosing Yes closes it and runs the existing restart action. The modal exposes dialog semantics, labelled/described content, contained keyboard focus, and restores focus after cancellation.

## Verification

- Retry opens the modal from the completion action and recognized typed/spoken retry requests.
- Yes restarts only the current specialist; No leaves saved work unchanged.
- Type outside-click and Escape cancel.
- Talk outside-click and Escape do not dismiss; spoken Yes/No and buttons work.
- Focus and dialog attributes are accessible.
- Existing retry intent, Type, Talk, and full project tests remain green.
