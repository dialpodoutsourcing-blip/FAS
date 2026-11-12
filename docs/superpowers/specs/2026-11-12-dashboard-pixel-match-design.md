# Dashboard Pixel-Match Design

## Intent

Replace the current dashboard implementation with a faithful reconstruction of the user-supplied reference. The desktop result must read as the same screen, not as a loose adaptation: one 1920×1080 viewport, the same sidebar, proportions, hierarchy, spacing, colors, artwork, and visible density.

## Goals

- Match the supplied reference at 1920×1080 as closely as practical in browser-rendered HTML/CSS.
- Keep the entire desktop dashboard within one viewport without page scrolling.
- Rebuild the complete left sidebar, including its compact logo lockup, active navigation treatment, specialist rows, save state, and account card.
- Rebuild the dashboard header, current-step panel, roadmap heading, two roadmap cards, quick-access panel, and lower right encouragement panel in the same positions and proportions as the reference.
- Generate project-owned transparent raster artwork for the glowing Anchor and Extract card scenes. Each asset includes the emblem, atmospheric glow, and elliptical platform treatment visible in the reference.
- Preserve authenticated name/company data, project progress, specialist access, lock state, links, and existing navigation behavior.
- Adapt below the desktop target without breaking or clipping content.

## Non-goals

- Redesigning Vault, chat, review, account, or launch pages.
- Reusing the current dashboard composition when it conflicts with the reference.
- Hard-coding the sample customer name or company shown in the screenshot.
- Making 1920×1080 the only usable viewport; smaller screens remain functional but are not the pixel-match target.

## Anti-goals

- A vertically scrolling desktop dashboard.
- Generic CSS circles or existing small SVG badges used in place of the reference card artwork.
- Retaining the old sidebar presentation and merely changing its colors.
- Adding content, cards, controls, or decoration not visible in the reference.
- Sacrificing real progress/access behavior for a static mockup.

## Constraints

- Target viewport: browser content viewport (`window.innerWidth` × `window.innerHeight`) of exactly 1920×1080 at normal browser zoom.
- The most recent dashboard screenshot supplied in this conversation is the visual source. It is available to the image-generation tool as a conversation reference and must also be retained in the implementation brief for visual comparison.
- The dashboard shell must use the current static HTML/CSS/JavaScript architecture and existing authentication/access services.
- Existing user data must remain data-driven.
- Generated art must be saved inside the repository and included in the Vercel build output.
- Desktop sizing should use viewport-aware constraints so the layout fits within the available height; content must not be hidden merely to pass a height check.
- The supplied screenshot is the visual source of truth.

## Approved approach

### Selected: full pixel-matched reconstruction

Replace the dashboard-specific markup and CSS, rebuild the sidebar’s dashboard state, generate transparent card artwork from the supplied reference, and reconnect the new markup to the existing dashboard state controller.

This is the only approach that fits the request. Incrementally restyling the current layout was considered and rejected because it preserves the wrong proportions, sidebar, and visual assets. Using the screenshot as a single background was also rejected because it would hard-code customer content and destroy responsive, accessible, and interactive behavior.

## Desktop composition

- A fixed-width left rail of approximately 310–320 CSS pixels at the 1920 target, with a subtle gold divider.
- The main content occupies the remaining viewport width and uses approximately 52–56 pixels of horizontal inset.
- Header occupies the top band: compact dashboard eyebrow, large two-tone welcome line, supporting sentence, online pill, and circular account/notification control.
- The current-step panel sits below the header with three zones: progress gauge, specialist identity/content, and completion/CTA controls. Its height and radius match the screenshot.
- The lower region uses a wide roadmap column and a narrow utility rail. The roadmap cards are two equal columns; the utility rail aligns to their upper portion.
- Desktop vertical spacing and component heights are calibrated so the visible account card and dashboard content fit within 1080 pixels without document scrolling.

## Sidebar reconstruction

- Use the existing FAS brand asset but reproduce the reference lockup sizing and divider treatment.
- Use compact, reference-matched navigation rows and gold outline icons.
- Dashboard active state is a full-width gold gradient pill.
- Specialist rows show the real Anchor/Extract progress state, numbering, lock icon, and small trailing action glyphs.
- The save indicator and authenticated account card remain pinned near the bottom of the viewport.
- Other pages keep their current shared sidebar unless a dashboard-scoped class is required to prevent this change from altering them.

## Generated artwork

- Generate two separate transparent PNG/WebP assets using the reference image as a style/composition reference:
  - Anchor: circular black-and-gold anchor emblem, warm halo, and thin concentric gold platform rings.
  - Extract: angular black/silver diamond emblem, cool white/emerald halo, and thin concentric emerald platform rings.
- No text, labels, borders, card backgrounds, or watermarks in the assets.
- Artwork is centered in a wide transparent canvas so it can sit in the upper half of each roadmap card without cropping.
- Inspect both outputs against the reference and make one targeted correction if glow, framing, or transparency is materially wrong.

## Live behavior

- Customer name and company continue to come from authenticated profile context.
- Progress gauge, active specialist, status, primary CTA, and roadmap card states continue to derive from `dashboard.js`.
- Locked cards keep their real guarded route, project, notice, and current-specialist session.
- Completed cards link to their review documents.
- Quick access retains tutorial, Vault, and ADAM actions.
- No hard-coded reference identity appears in production markup.

## Responsive behavior

- At 1920×1080: exact single-screen composition with no document overflow.
- At narrower desktop/tablet widths: reduce spacing and typography first, then collapse the utility rail below the roadmap before cards become cramped.
- At mobile width: use the existing mobile navigation pattern and stack content; scrolling is allowed.
- Long customer names wrap or scale within the header without horizontal overflow.
- Responsive geometry checks cover 1440×900, 1280×800, 1024×768, 768×1024, and 390×844 in the installed Chromium/Edge engine.

## Verification

- Static tests assert the required dashboard/sidebar structure and generated asset references.
- State tests protect real progress, lock, and authenticated routing behavior.
- Build output parity verifies generated assets and dashboard files reach `public/`.
- Browser screenshots are captured at 1920×1080 and compared visually with the reference.
- Browser geometry asserts no page scroll at 1920×1080 and no horizontal overflow at supported widths.
- Full test suite, production build, final branch review, merge, push, deployment, and live marker checks are required.
- Integration target is this repository's `main` branch and `origin/main`; production target is the already-linked Vercel project at `https://fas-murex.vercel.app`. Live verification checks the rebuilt dashboard markup, generated artwork URLs, and dashboard CSS markers.

## Builder calls

- Exact pixel values may be tuned during screenshot comparison as long as they preserve the composition above.
- Choose PNG or WebP for generated art based on the cleanest alpha edges and browser output.
- Reuse existing accessible icon primitives where they visually match; otherwise create deterministic CSS/SVG line icons rather than generated icon text.
