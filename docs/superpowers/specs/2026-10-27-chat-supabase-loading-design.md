# Chat Supabase Loading Design

## Intent

Prevent built-in placeholder messages from flashing while ANCHOR or EXTRACT restores the real Supabase conversation.

## Behavior

- Render a loading overlay in the initial chat HTML so it exists before application JavaScript runs.
- Cover only the chat workspace, leaving global navigation visible.
- Show a gold circular progress indicator and `Loading your saved conversation…` status copy.
- Keep the overlay visible through authentication, access resolution, catalog loading, and project hydration.
- Hide it when persistence initialization settles, including recoverable fallback paths.
- Respect reduced-motion preferences.

## Approaches

- Selected: workspace overlay. It prevents the visual flash without blocking the entire application.
- Rejected: full-screen specialist loader, which is too disruptive for routine reloads.
- Rejected: skeleton chat rows, which can still be mistaken for real conversation content.
