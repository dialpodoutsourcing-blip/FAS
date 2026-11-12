# Dashboard Micro-Details Design

## Intent

Complete the final visual-polish pass by matching the supplied dashboard close-ups at the component-detail level. Preserve the current one-screen structure, generated artwork, dynamic data, navigation, and responsive behavior.

## Selected Approach

Use a native CSS/SVG precision pass. Existing raster artwork remains unchanged. HTML may gain small semantic wrappers or SVG paths where necessary, but no control or text will be flattened into imagery.

## Scope

- Add the sidebar’s lower gold/teal atmospheric curve without obscuring the saved/account controls.
- Visually unify the account identity and Sign Out treatment while retaining separate functional controls.
- Add the reference’s restrained dark hover/current surfaces to secondary navigation.
- Refine specialist action typography into a clean two-line `Review` plus diagonal-arrow treatment.
- Tune progress-gauge arc thickness, inner cutout, number/denominator baseline, and label spacing for both `01` and `02`.
- Refine focus status lettering, gold CTA gradient and arrow, View Details underline/chevron, landscape blending, and rail glow.
- Tune roadmap-card artwork clearance, corner glows, border highlights, state pills, underlined actions, and text rhythm.
- Refine Quick Access icon halos, row surfaces, arrows, and vertical spacing.
- Match the Keep Going chart glow and lower gold curve without clipping.

## Constraints

- No Supabase, authentication, routing, progression, persistence, or entitlement changes.
- No new generated raster assets.
- Keep the full dashboard within 1508×782 with no scroll.
- Continue safe scrolling between 901px and the full-layout fit threshold.
- Preserve 1920×1080 and mobile layouts.
- Decorative layers remain `pointer-events: none` and hidden from assistive technology.
- Real card PNGs must remain inside their artwork wrappers.

## Verification

- Extend browser geometry checks for account/sign-out containment, gauge baselines, artwork clearance, action containment, and utility-rail flourishes.
- Check completed, current, and locked runtime states.
- Capture and inspect 1508×782 using real assets.
- Run the full test suite and production build, then obtain an independent whole-branch review before merge and deployment.
