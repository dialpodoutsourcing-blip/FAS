# ANCHOR completion unlocks EXTRACT

## Intent

Unlock EXTRACT immediately after the final ANCHOR answer is durably saved, without waiting for blueprint generation. Returning users whose ANCHOR work is already complete must also see EXTRACT unlocked on the dashboard and sidebar.

## Selected approach

Use one shared progression policy. ANCHOR is complete when either:

- the project contains a saved ANCHOR artifact, including legacy `agent_key` records; or
- the persisted ANCHOR checkpoint is at or beyond the six-question ANCHOR interview boundary, has no insufficient fields, and has no open conflicts.

Checking only artifacts was rejected because blueprint generation can lag or fail after the interview is complete. Checking answer count alone was rejected because clarification answers can inflate the count while required questions remain unfinished.

## Behavior

- The dashboard EXTRACT card and every sidebar EXTRACT link use the same completion rule.
- When complete, remove `is-locked` and `aria-disabled`, restore `chat.html?agent=extract`, and show the normal continuation label.
- Direct EXTRACT navigation uses the same policy and no longer redirects a completed ANCHOR user.
- Partial checkpoints, insufficient fields, or open conflicts remain locked.
- Existing saved ANCHOR artifacts continue to unlock EXTRACT.

## Verification

- Tests cover completed checkpoints, partial checkpoints, insufficient fields, open conflicts, saved artifacts, legacy artifacts, dashboard/sidebar link updates, and direct-route access.
- Full tests and production build pass before publication.
