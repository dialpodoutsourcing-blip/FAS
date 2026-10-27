"use strict";
const { rgb } = require("pdf-lib");
const PAGE = { width: 612, height: 792, margin: 42 };
const EXTRACT_VISUALS = [
  "decision-path",
  "origin-timeline",
  "expertise-network",
  "method-flow",
  "proof-confidence-matrix",
  "ip-relationship-map",
  "risk-control-matrix",
  "activation-roadmap",
];
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
function gapNode() { return { label: "OPEN GAP", detail: "OPEN GAP — validate this input before publication." }; }
function listOrGap(items, mapper) { return Array.isArray(items) && items.length ? items.map(mapper) : [gapNode()]; }
function buildVisualModels(report) {
  const r = report || {}, executive = r.executiveBrief || {}, thesis = r.expertiseThesis || {}, origin = r.originTimeline || {}, architecture = r.expertiseArchitecture || {}, method = r.signatureMethod || {}, proof = r.proofBank || [], pov = r.pointOfView || {}, risks = r.risks || [], recommendations = r.recommendations || [], decision = r.finalDecision || {};
  return [
    { type: EXTRACT_VISUALS[0], interpretation: safe(executive.decision, "OPEN GAP — define the expertise decision."), nodes: [["CREDIBILITY", executive.credibility], ["OPPORTUNITY", executive.opportunity], ["EXTERNAL THESIS", thesis.external], ["DECISION", executive.decision]].map(x => ({ label: x[0], detail: safe(x[1], "OPEN GAP") })) },
    { type: EXTRACT_VISUALS[1], interpretation: safe(origin.accumulatedAdvantage, "OPEN GAP — identify how experience accumulated into an advantage."), nodes: listOrGap(origin.inflectionPoints, (detail, i) => ({ label: `INFLECTION ${i + 1}`, detail })) },
    { type: EXTRACT_VISUALS[2], interpretation: safe(architecture.connections, "OPEN GAP — validate how the expertise pillars connect."), nodes: listOrGap(architecture.pillars, item => ({ label: safe(item.title, "OPEN GAP"), detail: safe(item.description, "OPEN GAP") })) },
    { type: EXTRACT_VISUALS[3], interpretation: safe(method.conditions, "OPEN GAP — document the conditions required for the method."), nodes: listOrGap(method.stages, item => ({ label: safe(item.name, "OPEN GAP"), detail: `Input: ${safe(item.input, "OPEN GAP")}. Output: ${safe(item.output, "OPEN GAP")}.` })) },
    { type: EXTRACT_VISUALS[4], interpretation: proof.length ? "Confidence is a strategic assessment of specificity and support; the adjacent gap defines the next validation action." : "OPEN GAP — no permission-safe proof is available for assessment.", rows: listOrGap(proof, (item, i) => ({ label: safe(item.claim, `CLAIM ${i + 1}`), score: Math.max(0, Math.min(100, Number(item.confidence) || 0)), detail: safe(item.gap, "OPEN GAP") })) },
    { type: EXTRACT_VISUALS[5], interpretation: safe((pov.signatureBeliefs || []).join(" "), "OPEN GAP — document the beliefs that organize the intellectual property."), nodes: listOrGap(pov.frameworks, item => ({ label: safe(item.name, "OPEN GAP"), detail: safe(item.description, "OPEN GAP") })) },
    { type: EXTRACT_VISUALS[6], interpretation: safe(method.conditions, "OPEN GAP — define the operating boundary for this expertise."), rows: listOrGap(risks, item => ({ label: safe(item.risk, "OPEN GAP"), impact: safe(item.impact, "OPEN GAP"), detail: safe(item.mitigation, "OPEN GAP") })) },
    { type: EXTRACT_VISUALS[7], interpretation: safe(decision.readinessTrigger, "OPEN GAP — define the observable readiness trigger."), nodes: listOrGap(recommendations, item => ({ label: safe(item.title, "OPEN GAP"), detail: safe(item.nextStep, "OPEN GAP"), priority: Number(item.priority) || 0 })) },
  ];
}
function chartFrame(page, title, fonts, theme) {
  const box = { x: 42, y: 382, w: 520, h: 180 };
  page.drawRectangle({
    x: box.x, y: box.y, width: box.w, height: box.h,
    color: color(theme.colors.surface),
    borderColor: color(theme.colors.line),
    borderWidth: 0.7,
  });
  label(page, title, box.x + 15, box.y + box.h - 21, fonts.bold, theme);
  return box;
}
function interpretation(page, model, fonts, theme) {
  label(page, "INTERPRETATION", 57, 404, fonts.bold, theme);
  textBox(page, model.interpretation, { x: 145, y: 405, width: 400, size: 7.2, lineHeight: 8.6, font: fonts.regular, ink: color(theme.colors.muted), maxLines: 2 });
}
function drawDecisionPath(page, config, fonts, theme) {
  const m=config.model,b=chartFrame(page,"EXPERTISE DECISION PATH",fonts,theme),nodes=m.nodes.slice(0,4),points=[[105,472],[230,513],[360,482],[495,526]];
  points.slice(0,-1).forEach((p,i)=>page.drawLine({start:{x:p[0],y:p[1]},end:{x:points[i+1][0],y:points[i+1][1]},thickness:2,color:color(theme.colors.accentAlt)}));
  nodes.forEach((node,i)=>{const p=points[i];page.drawCircle({x:p[0],y:p[1],size:18+i*2,color:color(theme.colors.surfaceAlt),borderColor:color(theme.colors.accent),borderWidth:1.2});textBox(page,node.label,{x:p[0]-42,y:p[1]+3,width:84,size:6.4,lineHeight:7,font:fonts.bold,ink:color(theme.colors.text),maxLines:2});});
  interpretation(page,m,fonts,theme);
}
function drawOriginTimeline(page, config, fonts, theme) {
  const m=config.model,b=chartFrame(page,"EARNED EXPERIENCE TIMELINE",fonts,theme),nodes=m.nodes.slice(0,4),start=78,end=526,y=486,gap=(end-start)/Math.max(1,nodes.length-1);
  page.drawLine({start:{x:start,y},end:{x:end,y},thickness:2,color:color(theme.colors.line)});
  nodes.forEach((node,i)=>{const x=start+i*gap;page.drawCircle({x,y,size:9,color:color(theme.colors.accentAlt),borderColor:color(theme.colors.accent),borderWidth:1.2});page.drawText(String(i+1).padStart(2,"0"),{x:x-5,y:y-2.5,size:6,font:fonts.bold,color:color(theme.colors.background)});textBox(page,node.label,{x:x-48,y:y+35,width:96,size:7,lineHeight:8,font:fonts.bold,ink:color(theme.colors.text),maxLines:2});textBox(page,node.detail,{x:x-48,y:y-20,width:96,size:6.4,lineHeight:7.4,font:fonts.regular,ink:color(theme.colors.muted),maxLines:3});});
  interpretation(page,m,fonts,theme);
}
function drawExpertiseNetwork(page, config, fonts, theme) {
  const m=config.model,b=chartFrame(page,"CONNECTED EXPERTISE ARCHITECTURE",fonts,theme),nodes=m.nodes.slice(0,4),hub={x:302,y:488},spots=[[105,510],[205,455],[400,455],[500,510]];
  page.drawCircle({x:hub.x,y:hub.y,size:34,color:color(theme.colors.surfaceAlt),borderColor:color(theme.colors.accentAlt),borderWidth:1.5});textBox(page,"EXPERTISE\nSYSTEM",{x:hub.x-30,y:hub.y+5,width:60,size:7,lineHeight:8,font:fonts.bold,ink:color(theme.colors.text),maxLines:2});
  nodes.forEach((node,i)=>{const p=spots[i];page.drawLine({start:hub,end:{x:p[0],y:p[1]} ,thickness:1.5,color:color(theme.colors.line)});page.drawCircle({x:p[0],y:p[1],size:24,color:color(theme.colors.background),borderColor:color(i?theme.colors.accent:theme.colors.accentAlt),borderWidth:1.2});textBox(page,node.label,{x:p[0]-35,y:p[1]+3,width:70,size:6.6,lineHeight:7.4,font:fonts.bold,ink:color(theme.colors.text),maxLines:2});});
  interpretation(page,m,fonts,theme);
}
function drawMethodFlow(page, config, fonts, theme) {
  const m=config.model,b=chartFrame(page,"SIGNATURE METHOD FLOW",fonts,theme),nodes=m.nodes.slice(0,5),gap=12,w=(490-gap*(nodes.length-1))/nodes.length;
  nodes.forEach((node,i)=>{const x=57+i*(w+gap),y=450+i%2*30;page.drawRectangle({x,y,width:w,height:70,color:color(i%2?theme.colors.surfaceAlt:theme.colors.background),borderColor:color(theme.colors.line),borderWidth:.7});page.drawCircle({x:x+12,y:y+55,size:8,color:color(theme.colors.accent)});page.drawText(String(i+1),{x:x+9.5,y:y+52,size:6.5,font:fonts.bold,color:color(theme.colors.background)});textBox(page,node.label,{x:x+8,y:y+38,width:w-16,size:6.6,lineHeight:7.4,font:fonts.bold,ink:color(theme.colors.text),maxLines:3});if(i<nodes.length-1)page.drawLine({start:{x:x+w,y:y+35},end:{x:x+w+gap,y:450+(i+1)%2*30+35},thickness:1.8,color:color(theme.colors.accentAlt)});});
  interpretation(page,m,fonts,theme);
}
function drawProofConfidenceMatrix(page, config, fonts, theme) {
  const m=config.model,b=chartFrame(page,"PROOF CONFIDENCE + GAP MATRIX",fonts,theme),rows=m.rows.slice(0,3);
  rows.forEach((row,i)=>{const y=525-i*38,score=Number(row.score)||0;textBox(page,row.label,{x:57,y,width:135,size:6.6,lineHeight:7.2,font:fonts.bold,ink:color(theme.colors.text),maxLines:2});page.drawLine({start:{x:205,y:y+1},end:{x:365,y:y+1},thickness:7,color:color(theme.colors.line)});page.drawLine({start:{x:205,y:y+1},end:{x:205+1.6*score,y:y+1},thickness:7,color:color(i?theme.colors.accent:theme.colors.accentAlt)});page.drawText(String(score),{x:372,y:y-2,size:7,font:fonts.bold,color:color(theme.colors.accent)});textBox(page,row.detail,{x:405,y:y+4,width:140,size:6.2,lineHeight:7,font:fonts.regular,ink:color(theme.colors.muted),maxLines:3});});
  interpretation(page,m,fonts,theme);
}
function drawIpRelationshipMap(page, config, fonts, theme) {
  const m=config.model,b=chartFrame(page,"POINT OF VIEW + IP MAP",fonts,theme),nodes=m.nodes.slice(0,4),cx=302,cy=492,spots=[[125,515],[210,455],[394,455],[480,515]];
  page.drawCircle({x:cx,y:cy,size:40,color:color(theme.colors.surfaceAlt),borderColor:color(theme.colors.accentAlt),borderWidth:1.4});textBox(page,"SIGNATURE\nBELIEFS",{x:cx-32,y:cy+5,width:64,size:7,lineHeight:8,font:fonts.bold,ink:color(theme.colors.text),maxLines:2});nodes.forEach((node,i)=>{const p=spots[i];page.drawLine({start:{x:cx,y:cy},end:{x:p[0],y:p[1]},thickness:1.3,color:color(theme.colors.accent)});page.drawCircle({x:p[0],y:p[1],size:25,color:color(theme.colors.background),borderColor:color(theme.colors.accent),borderWidth:1});textBox(page,node.label,{x:p[0]-37,y:p[1]+4,width:74,size:6.4,lineHeight:7,font:fonts.bold,ink:color(theme.colors.text),maxLines:2});});interpretation(page,m,fonts,theme);
}
function drawRiskControlMatrix(page, config, fonts, theme) {
  const m=config.model,b=chartFrame(page,"RISK · IMPACT · CONTROL",fonts,theme),rows=m.rows.slice(0,3);
  [[57,"RISK"],[225,"IMPACT"],[390,"CONTROL"]].forEach(x=>label(page,x[1],x[0],535,fonts.bold,theme));rows.forEach((row,i)=>{const y=505-i*36;page.drawRectangle({x:57,y:y-18,width:488,height:31,color:color(i%2?theme.colors.surfaceAlt:theme.colors.background),borderColor:color(theme.colors.line),borderWidth:.5});textBox(page,row.label,{x:68,y:y+3,width:140,size:6.5,lineHeight:7,font:fonts.bold,ink:color(theme.colors.text),maxLines:2});textBox(page,row.impact||"OPEN GAP",{x:225,y:y+3,width:145,size:6.2,lineHeight:7,font:fonts.regular,ink:color(theme.colors.muted),maxLines:2});textBox(page,row.detail,{x:390,y:y+3,width:145,size:6.2,lineHeight:7,font:fonts.regular,ink:color(theme.colors.text),maxLines:2});});interpretation(page,m,fonts,theme);
}
function drawActivationRoadmap(page, config, fonts, theme) {
  const m=config.model,b=chartFrame(page,"PRIORITY ROADMAP + READINESS GATE",fonts,theme),nodes=m.nodes.slice(0,4),start=78,end=475,y=493,gap=(end-start)/Math.max(1,nodes.length-1);
  page.drawLine({start:{x:start,y},end:{x:end,y},thickness:3,color:color(theme.colors.line)});nodes.forEach((node,i)=>{const x=start+i*gap;page.drawCircle({x,y,size:13,color:color(theme.colors.accentAlt),borderColor:color(theme.colors.accent),borderWidth:1.2});page.drawText(String(node.priority||i+1),{x:x-3.5,y:y-2.5,size:7,font:fonts.bold,color:color(theme.colors.background)});textBox(page,node.label,{x:x-45,y:y+40,width:90,size:6.6,lineHeight:7.2,font:fonts.bold,ink:color(theme.colors.text),maxLines:3});});page.drawRectangle({x:500,y:450,width:45,height:88,color:color(theme.colors.surfaceAlt),borderColor:color(theme.colors.accentAlt),borderWidth:1.2});label(page,"GATE",507,520,fonts.bold,theme);textBox(page,"READY",{x:507,y:486,width:32,size:7,lineHeight:8,font:fonts.bold,ink:color(theme.colors.text),maxLines:2});interpretation(page,m,fonts,theme);
}
const VISUAL_RENDERERS = {
  "decision-path": drawDecisionPath,
  "origin-timeline": drawOriginTimeline,
  "expertise-network": drawExpertiseNetwork,
  "method-flow": drawMethodFlow,
  "proof-confidence-matrix": drawProofConfidenceMatrix,
  "ip-relationship-map": drawIpRelationshipMap,
  "risk-control-matrix": drawRiskControlMatrix,
  "activation-roadmap": drawActivationRoadmap,
};
function contentPage(pdf, index, artifact, fonts, theme, config) {
  const page = base(pdf, index, artifact, fonts, theme, config.section);
  if (!config.visualItems) config.visualItems = config.items;
  heading(page, config.kicker, config.title, config.intro, fonts, theme);
  VISUAL_RENDERERS[config.visualType](page, config, fonts, theme);
  config.items
    .slice(0, 3)
    .forEach((item, i) =>
      card(page, item[0], item[1], 42, 286 - i * 87, 520, 76, fonts, theme, i),
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
  const models = buildVisualModels(r);
  cover(pdf, artifact, r, selected, theme, assets.extractImage);
  contentPage(pdf, 2, artifact, selected, theme, {
    visualType: "decision-path",
    model: models[0],
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
    visualType: "origin-timeline",
    model: models[1],
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
    visualType: "expertise-network",
    model: models[2],
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
    visualType: "method-flow",
    model: models[3],
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
    visualType: "proof-confidence-matrix",
    model: models[4],
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
    visualType: "ip-relationship-map",
    model: models[5],
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
    visualType: "risk-control-matrix",
    model: models[6],
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
    visualType: "activation-roadmap",
    model: models[7],
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
module.exports = { renderExtractReport, EXTRACT_VISUALS, buildVisualModels };
