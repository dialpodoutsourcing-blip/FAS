# Login Propagation Cover Design

Temporarily cover `account.html` with a full-viewport FAS launch-status screen so clients cannot use the login controls before launch. The cover starts at 75%, advances extremely slowly, remains below completion, and states an estimated 5–6 hours remaining. The underlying authentication implementation remains intact and inert until this temporary cover is removed.

The implementation uses semantic HTML plus native CSS only: a fixed modal status layer, a six-hour capped progress animation, a reduced-motion fallback, and `inert`/`aria-hidden` on the existing account shell. It does not alter Supabase or protected-page behavior.
