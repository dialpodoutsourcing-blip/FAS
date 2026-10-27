"use strict";
const { rgb } = require("pdf-lib");
const PAGE = { width: 612, height: 792, margin: 42 };
function color(hex) {
  const clean = hex.replace("#", "");
  return rgb(
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  );
}
function safe(value, fallback = "—") {
  return String(value == null || value === "" ? fallback : value)
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function wrap(text, font, size, width) {
  const words = safe(text).split(/\s+/),
    lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (line && font.widthOfTextAtSize(next, size) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
function textBox(
  page,
  text,
  { x, y, width, size = 10, lineHeight = 14, font, ink, maxLines = 99 },
) {
  let fitted = size,
    lines = wrap(text, font, fitted, width);
  while (lines.length > maxLines && fitted > 6.4) {
    fitted -= 0.4;
    lines = wrap(text, font, fitted, width);
  }
  const leading = Math.min(lineHeight, fitted * 1.38),
    visible = lines.slice(0, maxLines);
  visible.forEach((line, index) =>
    page.drawText(line, {
      x,
      y: y - index * leading,
      size: fitted,
      font,
      color: ink,
    }),
  );
  return y - visible.length * leading;
}
function label(page, text, x, y, font, theme) {
  page.drawText(safe(text).toUpperCase(), {
    x,
    y,
    size: 7,
    font,
    color: color(theme.colors.accent),
    characterSpacing: 1.1,
  });
}
function rule(page, x, y, width, theme) {
  page.drawLine({
    start: { x, y },
    end: { x: x + width, y },
    thickness: 0.7,
    color: color(theme.colors.line),
  });
}
function base(pdf, index, artifact, fonts, theme, section) {
  const page = pdf.addPage([PAGE.width, PAGE.height]);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE.width,
    height: PAGE.height,
    color: color(theme.colors.background),
  });
  page.drawRectangle({
    x: 22,
    y: 687,
    width: 7,
    height: 32,
    color: color(theme.colors.accentAlt),
    opacity: 0.7,
  });
  page.drawCircle({
    x: 530,
    y: 680,
    size: 58,
    borderColor: color(theme.colors.accent),
    borderWidth: 1,
    opacity: 0.16,
  });
  page.drawCircle({
    x: 530,
    y: 680,
    size: 38,
    borderColor: color(theme.colors.accentAlt),
    borderWidth: 1,
    opacity: 0.14,
  });
  page.drawText(String(index).padStart(2, "0"), {
    x: 493,
    y: 662,
    size: 42,
    font: fonts.bold,
    color: color(theme.colors.accent),
    opacity: 0.12,
  });
  label(page, "EXPERTISE MAP", 42, 758, fonts.bold, theme);
  page.drawText(section, {
    x: 612 - 42 - fonts.bold.widthOfTextAtSize(section, 7),
    y: 758,
    size: 7,
    font: fonts.bold,
    color: color(theme.colors.muted),
  });
  rule(page, 42, 35, 528, theme);
  page.drawText("FAS · EXTRACT · CONFIDENTIAL", {
    x: 42,
    y: 22,
    size: 6.8,
    font: fonts.bold,
    color: color(theme.colors.muted),
  });
  page.drawText(`v${artifact.version} · EXPERTISE SYSTEM · ${index}/9`, {
    x: 420,
    y: 22,
    size: 6.8,
    font: fonts.regular,
    color: color(theme.colors.muted),
  });
  return page;
}
function heading(page, kicker, title, intro, fonts, theme) {
  label(page, kicker, 42, 716, fonts.bold, theme);
  textBox(page, title, {
    x: 42,
    y: 684,
    width: 520,
    size: 27,
    lineHeight: 29,
    font: fonts.display,
    ink: color(theme.colors.text),
    maxLines: 2,
  });
  textBox(page, intro, {
    x: 42,
    y: 618,
    width: 520,
    size: 10.5,
    lineHeight: 15,
    font: fonts.regular,
    ink: color(theme.colors.muted),
    maxLines: 4,
  });
}
function card(page, title, body, x, y, w, h, fonts, theme, index = 0) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: color(index % 2 ? theme.colors.surfaceAlt : theme.colors.surface),
    borderColor: color(theme.colors.line),
    borderWidth: 0.7,
  });
  page.drawRectangle({
    x,
    y,
    width: 3,
    height: h,
    color: color(index === 0 ? theme.colors.accentAlt : theme.colors.accent),
    opacity: 0.72,
  });
  label(page, title, x + 16, y + h - 20, fonts.bold, theme);
  textBox(page, body, {
    x: x + 16,
    y: y + h - 38,
    width: w - 31,
    size: 8.4,
    lineHeight: 10.5,
    font: fonts.regular,
    ink: color(theme.colors.text),
    maxLines: Math.max(2, Math.floor((h - 42) / 10.5)),
  });
}
function visual(page, config, fonts, theme) {
  const items = config.visualItems || [],
    x = 42,
    y = 448,
    w = 520,
    h = 118;
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: color(theme.colors.surface),
    borderColor: color(theme.colors.line),
    borderWidth: 0.7,
  });
  label(
    page,
    config.visualLabel || "STRATEGIC VIEW",
    x + 15,
    y + h - 21,
    fonts.bold,
    theme,
  );
  if (config.visual === "bars") {
    items.slice(0, 4).forEach((item, i) => {
      const row = y + h - 45 - i * 19,
        score = Math.max(8, Math.min(100, Number(item[1]) || 35));
      textBox(page, item[0], {
        x: x + 15,
        y: row,
        width: 150,
        size: 7.3,
        lineHeight: 8,
        font: fonts.bold,
        ink: color(theme.colors.text),
        maxLines: 1,
      });
      page.drawLine({
        start: { x: x + 174, y: row + 2 },
        end: { x: x + w - 42, y: row + 2 },
        thickness: 5,
        color: color(theme.colors.line),
      });
      page.drawLine({
        start: { x: x + 174, y: row + 2 },
        end: { x: x + 174 + ((w - 230) * score) / 100, y: row + 2 },
        thickness: 5,
        color: color(i ? theme.colors.accent : theme.colors.accentAlt),
      });
      page.drawText(String(score), {
        x: x + w - 30,
        y: row - 1,
        size: 7,
        font: fonts.bold,
        color: color(theme.colors.accent),
      });
    });
    return;
  }
  const count = Math.max(1, Math.min(5, items.length)),
    gap = 10,
    node = (w - 30 - gap * (count - 1)) / count;
  items.slice(0, count).forEach((item, i) => {
    const nx = x + 15 + i * (node + gap);
    page.drawRectangle({
      x: nx,
      y: y + 18,
      width: node,
      height: 57,
      color: color(i % 2 ? theme.colors.surfaceAlt : theme.colors.background),
      borderColor: color(theme.colors.line),
      borderWidth: 0.7,
    });
    page.drawText(String(i + 1).padStart(2, "0"), {
      x: nx + 8,
      y: y + 57,
      size: 8,
      font: fonts.bold,
      color: color(theme.colors.accent),
    });
    textBox(page, item[0] || item, {
      x: nx + 8,
      y: y + 42,
      width: node - 16,
      size: 7.1,
      lineHeight: 8.6,
      font: fonts.bold,
      ink: color(theme.colors.text),
      maxLines: 3,
    });
    if (i < count - 1)
      page.drawLine({
        start: { x: nx + node, y: y + 46 },
        end: { x: nx + node + gap, y: y + 46 },
        thickness: 1.5,
        color: color(theme.colors.accentAlt),
      });
  });
}
function contentPage(pdf, index, artifact, fonts, theme, config) {
  const page = base(pdf, index, artifact, fonts, theme, config.section);
  if (!config.visualItems) config.visualItems = config.items;
  heading(page, config.kicker, config.title, config.intro, fonts, theme);
  visual(page, config, fonts, theme);
  config.items
    .slice(0, 4)
    .forEach((item, i) =>
      card(page, item[0], item[1], 42, 350 - i * 82, 520, 70, fonts, theme, i),
    );
}
function cover(pdf, artifact, report, fonts, theme, extractImage) {
  const page = pdf.addPage([612, 792]);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 612,
    height: 792,
    color: color(theme.colors.background),
  });
  if (extractImage)
    page.drawImage(extractImage, {
      x: 250,
      y: 385,
      width: 390,
      height: 390,
      opacity: theme.mode === "dark" ? 0.92 : 0.82,
    });
  page.drawRectangle({
    x: 0,
    y: 365,
    width: 355,
    height: 427,
    color: color(theme.colors.background),
    opacity: theme.mode === "dark" ? 0.58 : 0.72,
  });
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 612,
    height: 385,
    color: color(theme.colors.background),
    opacity: 0.95,
  });
  label(
    page,
    "FITNESS AUTHORITY SYSTEM · EXTRACT / 02",
    42,
    750,
    fonts.bold,
    theme,
  );
  textBox(page, "EXPERTISE\nMAP", {
    x: 42,
    y: 675,
    width: 400,
    size: 38,
    lineHeight: 39,
    font: fonts.display,
    ink: color(theme.colors.text),
    maxLines: 3,
  });
  textBox(page, "A private expertise architecture and activation brief", {
    x: 43,
    y: 575,
    width: 330,
    size: 10.5,
    lineHeight: 14,
    font: fonts.regular,
    ink: color(theme.colors.muted),
    maxLines: 2,
  });
  label(page, "EXECUTIVE OPPORTUNITY", 42, 300, fonts.bold, theme);
  textBox(page, report.executiveBrief.opportunity, {
    x: 42,
    y: 270,
    width: 520,
    size: 20,
    lineHeight: 23,
    font: fonts.display,
    ink: color(theme.colors.text),
    maxLines: 4,
  });
  textBox(page, report.expertiseThesis.internal, {
    x: 42,
    y: 150,
    width: 520,
    size: 10.5,
    lineHeight: 15,
    font: fonts.regular,
    ink: color(theme.colors.text),
    maxLines: 4,
  });
  rule(page, 42, 56, 520, theme);
  page.drawText("EXPERIENCE INTO METHOD · METHOD INTO AUTHORITY", {
    x: 42,
    y: 39,
    size: 7.2,
    font: fonts.bold,
    color: color(theme.colors.accent),
    characterSpacing: 0.7,
  });
}
async function renderExtractReport(pdf, artifact, theme, fonts, assets = {}) {
  const r = artifact.premiumReport;
  if (!r) throw new Error("Premium EXTRACT report is required.");
  const selected = Object.assign({}, fonts, {
    display: theme.fontMode === "serif" ? fonts.serif : fonts.bold,
  });
  pdf.setTitle(artifact.title);
  pdf.setSubject("Premium FAS EXTRACT expertise map");
  pdf.setAuthor("Fitness Authority System");
  pdf.setCreator("Fitness Authority System");
  pdf.setProducer("FAS Premium Report Engine");
  pdf.setKeywords([
    "FAS",
    "EXTRACT",
    "Expertise Map",
    theme.key,
    "Expertise System",
  ]);
  cover(pdf, artifact, r, selected, theme, assets.extractImage);
  contentPage(pdf, 2, artifact, selected, theme, {
    section: "EXECUTIVE BRIEF",
    kicker: "STRATEGIC SUMMARY",
    title: "The expertise opportunity at a glance",
    intro: r.executiveBrief.opportunity,
    visualLabel: "EXPERTISE DECISION PATH",
    items: [
      ["CREDIBILITY", r.executiveBrief.credibility],
      ["DECISION", r.executiveBrief.decision],
      ["EXTERNAL THESIS", r.expertiseThesis.external],
      ["INTERNAL THESIS", r.expertiseThesis.internal],
    ],
  });
  contentPage(pdf, 3, artifact, selected, theme, {
    section: "ORIGIN & EVOLUTION",
    kicker: "EXPERIENCE TIMELINE",
    title: "How the expertise was earned",
    intro: r.originTimeline.origin,
    visualLabel: "EARNED EXPERIENCE TIMELINE",
    visualItems: r.originTimeline.inflectionPoints.map((x, i) => [
      "INFLECTION " + (i + 1),
      x,
    ]),
    items: r.originTimeline.inflectionPoints
      .map((x, i) => ["INFLECTION " + (i + 1), x])
      .concat([
        ["ACCUMULATED ADVANTAGE", r.originTimeline.accumulatedAdvantage],
        ["ORIGIN", r.originTimeline.origin],
      ]),
  });
  contentPage(pdf, 4, artifact, selected, theme, {
    section: "EXPERTISE ARCHITECTURE",
    kicker: "KNOWLEDGE SYSTEM",
    title: "The pillars of credible expertise",
    intro: r.expertiseArchitecture.connections,
    visualLabel: "EXPERTISE PILLAR SYSTEM",
    visualItems: r.expertiseArchitecture.pillars.map((x) => [x.title, x.description]),
    items: r.expertiseArchitecture.pillars
      .map((x) => [x.title, x.description])
      .concat([["CONNECTIONS", r.expertiseArchitecture.connections]]),
  });
  contentPage(pdf, 5, artifact, selected, theme, {
    section: "SIGNATURE METHOD",
    kicker: "REPEATABLE PROCESS",
    title: r.signatureMethod.name,
    intro: r.signatureMethod.promise,
    visualLabel: "SIGNATURE METHOD FLOW",
    visualItems: r.signatureMethod.stages.map((x) => [x.name, x.output]),
    items: r.signatureMethod.stages
      .slice(0, 4)
      .map((x) => [
        String(x.order).padStart(2, "0") + " · " + x.name,
        "Input: " + x.input + ". Output: " + x.output + ".",
      ]),
  });
  contentPage(pdf, 6, artifact, selected, theme, {
    section: "PROOF & STORIES",
    kicker: "EVIDENCE BANK",
    title: "What makes the method believable",
    intro: r.proofBank[0] && r.proofBank[0].proof,
    visual: "bars",
    visualLabel: "EVIDENCE CONFIDENCE",
    visualItems: r.proofBank.map((x, i) => ["CLAIM " + (i + 1), x.confidence]),
    items: r.proofBank.flatMap((x, i) => [
      ["CLAIM " + (i + 1), x.claim + " " + x.proof],
      ["PROOF GAP " + (i + 1), x.gap + " " + x.permissionNote],
    ]),
  });
  contentPage(pdf, 7, artifact, selected, theme, {
    section: "POINT OF VIEW & IP",
    kicker: "DISTINCTIVE JUDGMENT",
    title: "The beliefs behind the method",
    intro: r.pointOfView.signatureBeliefs.join(" "),
    visualLabel: "INTELLECTUAL PROPERTY SYSTEM",
    visualItems: r.pointOfView.frameworks.map((x) => [x.name, x.description]),
    items: r.pointOfView.frameworks
      .map((x) => [x.name, x.description])
      .concat([
        ["LANGUAGE TO USE", r.pointOfView.languageToUse.join(" · ")],
        ["LANGUAGE TO AVOID", r.pointOfView.languageToAvoid.join(" · ")],
      ]),
  });
  contentPage(pdf, 8, artifact, selected, theme, {
    section: "BOUNDARIES & RISKS",
    kicker: "TRUST PROTECTION",
    title: "Where the expertise must stay disciplined",
    intro: r.signatureMethod.conditions,
    visualLabel: "RISK CONTROL PATH",
    visualItems: r.risks.map((x) => [x.risk, x.mitigation]),
    items: r.risks
      .map((x) => [x.risk, x.impact + " Mitigation: " + x.mitigation])
      .concat(r.proofBank.slice(0, 2).map((x) => ["OPEN EVIDENCE GAP", x.gap])),
  });
  contentPage(pdf, 9, artifact, selected, theme, {
    section: "ACTIVATION & DECISION",
    kicker: "RECOMMENDATION",
    title: r.finalDecision.recommendation,
    intro: r.finalDecision.rationale,
    visualLabel: "ACTIVATION PRIORITY",
    visualItems: r.recommendations.map((x) => [x.title, x.nextStep]),
    items: r.recommendations
      .map((x) => [
        String(x.priority).padStart(2, "0") + " · " + x.title,
        x.rationale + " Next: " + x.nextStep,
      ])
      .concat([["READINESS TRIGGER", r.finalDecision.readinessTrigger]]),
  });
}
module.exports = { renderExtractReport };
