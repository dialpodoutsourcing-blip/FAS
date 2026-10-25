# Premium Anchor Blueprint Export — Design Specification

Date: 2026-10-25
Status: Awaiting approval

## Outcome

Turn the completed Anchor interview into a commercially credible 4–5 page report and let the user choose one of three premium visual brands immediately before PDF download.

The three export styles are:

1. **Editorial Strategy** — dark FAS luxury styling with editorial pacing and consulting-grade tools.
2. **Luxury Editorial** — warm, cover-led, spacious, narrative presentation.
3. **Boardroom Consultancy** — light, analytical, decision-oriented presentation.

The report content is generated once. The selected style changes presentation, not substance, so every design contains the same complete strategic value.

## User Experience

1. The user completes the sixth Anchor question.
2. The application synthesizes and saves a structured premium report.
3. The user is automatically taken to the completed blueprint review page.
4. Selecting **PDF** opens a branded style chooser titled **Choose your blueprint style**.
5. Each option includes a miniature preview, a short positioning description, and its style name.
6. Clicking a style immediately renders and downloads a real `.pdf` using that template.
7. The chosen style is remembered for that artifact and preselected on later exports. The user can still choose a different style.
8. DOCX remains content-led and uses a polished, readable report layout rather than attempting to reproduce all PDF artwork.

No additional confirmation button is required after choosing a PDF style.

## Premium Report Content Model

The current five short text blocks will be replaced by a structured report schema. The AI synthesis prompt will instruct the model to act as a senior positioning strategist and evidence analyst, not a generic copywriter.

The report will contain:

- Executive cover: client name, report title, date/version, positioning subtitle, branded header artwork.
- Executive brief: the central authority opportunity, why it is credible, and the most important strategic decision.
- Trusted Expert Statement: a concise external-facing statement plus an expanded internal positioning thesis.
- Authority foundation: expertise domain, distinctive method or lens, buyer, costly problem, desired transformation, and boundaries.
- Evidence and credibility matrix: claims mapped to the user’s supplied proof, confidence level, commercial relevance, and missing evidence.
- Positioning map: a visual two-axis chart locating the expert’s position and explaining nearby generic alternatives.
- Messaging architecture: signature belief, value promise, three proof-backed message pillars, language to use, and language to avoid.
- Strategic gaps and risks: unsupported claims, unclear areas, and what must be validated before stronger public claims are made.
- 30-day activation plan: sequenced actions, deliverables, success indicators, and dependencies.
- Next-step recommendations: prioritized decisions that feed Extract and later agents without pretending those interviews are already complete.

The synthesis must preserve useful phrases from the user, distinguish evidence from inference, and explicitly label missing information. It must never fabricate credentials, results, buyers, or proof.

## Content-to-Design Balance

The target allocation is interpreted as report emphasis rather than exact page-area arithmetic:

- 60% valuable written strategy and synthesis.
- 20% meaningful visuals: cover artwork, callouts, hierarchy, positioning illustration, and branded motifs.
- 10% charts and tables: evidence matrix, positioning map, scorecard, and activation timeline.
- 10% formatting polish: typography, spacing, dividers, pagination, headers, footers, and metadata.

Decorative graphics must never replace useful content. Charts must be based on defensible qualitative scoring derived from captured answers and clearly labeled as strategic assessments.

## Prompt and Validation Strategy

The synthesis endpoint will request a strict structured object rather than free-form prose. Its instructions will require:

- specific conclusions tied to source answer IDs;
- concise but substantial sections;
- differentiation between direct evidence, strategic inference, and missing input;
- commercially useful recommendations tailored to the respondent;
- avoidance of vague advice, invented facts, clichés, and repeated language;
- enough detail for a 4–5 page artifact without padding;
- chart data, table rows, and visual callouts as structured fields.

Server-side validation will reject structurally incomplete or suspiciously shallow output. A deterministic fallback will construct a complete, honest report from saved answers if AI synthesis is unavailable, while identifying gaps rather than inventing material.

## Rendering Architecture

The artifact stored in the database will contain semantic content and source references, not PDF-specific coordinates. The export service will combine that artifact with a selected theme definition.

Shared layout primitives will handle:

- page creation and margins;
- section flow and page breaks;
- typography and text measurement;
- headers, footers, page numbers, and version metadata;
- callout panels, scorecards, matrices, timelines, and positioning plots;
- subtle branded background artwork;
- safe wrapping and overflow prevention.

Each theme will provide its own palette, typography scale, surface treatments, header artwork, chart styling, and cover composition. This keeps all three versions feature-equivalent and maintainable.

## Header Artwork

Each theme will include programmatically rendered, print-safe FAS/Anchor artwork built from gradients, geometry, fine lines, and the existing Anchor visual language. It will be decorative and subtle enough to preserve readability. The graphic will not depend on a remote image at download time.

## Persistence

The structured report, sources, synthesis metadata, version, and preferred export theme will be persisted through the existing artifact/data layer. No report content will exist only in static front-end markup.

The saved theme preference is presentation metadata; switching themes does not create a new strategic-content version.

## Error Handling

- The style chooser disables repeat clicks while rendering.
- A visible progress state explains that the PDF is being prepared.
- A render failure returns the chooser to an actionable state and shows a clear error.
- The downloaded payload is validated as a PDF and receives a `.pdf` filename and `application/pdf` MIME type.
- Long content is paginated safely rather than clipped or overlapped.

## Verification

Automated tests will cover:

- structured synthesis schema and shallow-output rejection;
- deterministic fallback completeness;
- opening and dismissing the theme chooser;
- all three selectable themes;
- remembered theme preference;
- valid PDF signature, MIME type, filename, and multi-page count;
- required sections, charts/tables, headers, footers, and source metadata;
- overflow/page-break behavior with short and long answers;
- no regression to DOCX export, review routing, approval, or completed-artifact reopening.

Manual verification will inspect all three rendered PDFs at normal zoom for legibility, hierarchy, visual polish, and consistency with the previews.
