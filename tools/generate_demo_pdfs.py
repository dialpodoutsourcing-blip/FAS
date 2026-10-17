"""Generate the static FAS demo vault PDFs."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, Flowable
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "pdfs"
OUT.mkdir(parents=True, exist_ok=True)

BLACK = colors.HexColor("#090907")
INK = colors.HexColor("#15130F")
GOLD = colors.HexColor("#D3B57C")
GOLD_DARK = colors.HexColor("#8C6A2E")
IVORY = colors.HexColor("#F7F0E4")
MUTED = colors.HexColor("#B6AD9E")
LINE = colors.HexColor("#4A402E")
GREEN = colors.HexColor("#5FB597")

DOCS = [
  dict(key="anchor", agent="ANCHOR", title="Trusted Expert Blueprint", accent="#D9BC7E",
    thesis="Alex Morgan helps ambitious professionals over 40 rebuild durable strength and energy without punishing workouts or all-or-nothing plans.",
    summary="A focused authority position for a strength and longevity coach. The blueprint defines who the business serves, the result it can credibly promise, the proof behind the position, and the claims it deliberately avoids.",
    metrics=[("PRIMARY BUYER", "40-55 leaders"), ("CORE RESULT", "Durable strength"), ("POSITION", "Evidence-led")],
    rows=[("Authority arena", "Strength and longevity coaching for time-poor professionals"), ("Credible promise", "Build strength, energy, and training consistency in 12 weeks"), ("Evidence base", "12 years coaching; 180+ client programs; documented adherence data"), ("Boundary", "No injury treatment, diagnosis, or guaranteed body-composition result")],
    flow=["EXPERIENCE", "EVIDENCE", "POSITION", "TRUST"]),
  dict(key="extract", agent="EXTRACT", title="Expertise Map", accent="#BFD0DF",
    thesis="The Durable Strength Method turns Alex's tacit coaching decisions into a repeatable five-part system.",
    summary="A structured capture of the experience, decisions, proof, and point of view behind the coaching practice. This map makes the expertise teachable without flattening the judgment that makes it valuable.",
    metrics=[("EXPERIENCE", "12 years"), ("CLIENT CASES", "180+"), ("PILLARS", "5 mapped")],
    rows=[("Assess", "Establish readiness, movement confidence, recovery, and constraints"), ("Anchor", "Choose the minimum effective weekly training rhythm"), ("Build", "Progress the six foundational movement patterns"), ("Adapt", "Adjust load and volume from real recovery signals"), ("Own", "Transfer decision-making so the client can self-correct")],
    flow=["ASSESS", "ANCHOR", "BUILD", "ADAPT", "OWN"]),
  dict(key="radar", agent="RADAR", title="Buyer Intelligence Brief", accent="#5FB597",
    thesis="The priority buyer is a successful professional who values health but no longer trusts extreme fitness plans.",
    summary="An evidence-based buyer profile built from discovery calls, intake forms, and client messages. Facts are separated from hypotheses so messaging can be useful without pretending certainty.",
    metrics=[("INTERVIEWS", "24 reviewed"), ("TOP TRIGGER", "Energy decline"), ("READINESS", "High intent")],
    rows=[("Current state", "Inconsistent training, declining energy, and decision fatigue"), ("Desired state", "Feel capable, strong, and in control of a sustainable routine"), ("Buying trigger", "A health marker, milestone birthday, or loss of confidence"), ("Primary objection", "Fear that the plan will demand more time than they can sustain"), ("Language to mirror", "I want something I can keep doing when work gets busy")],
    flow=["TRIGGER", "TENSION", "TRUST", "DECISION"]),
  dict(key="forge", agent="FORGE", title="Brand Identity Brief", accent="#E08A5A",
    thesis="FORTY FORWARD positions strength as a long-term operating advantage, not a short-term fitness challenge.",
    summary="A strategic identity system grounded in the approved authority and buyer insight. It includes the chosen name, promise, language territory, visual direction, and screening notes for independent legal review.",
    metrics=[("SYSTEM NAME", "FORTY FORWARD"), ("ARCHETYPE", "Guide"), ("TONE", "Calm authority")],
    rows=[("Positioning line", "Strength for the decades that matter most"), ("Brand promise", "A durable system for strength, energy, and self-trust"), ("Voice", "Precise, calm, adult, evidence-aware, never performative"), ("Avoid", "Shame, urgency theater, biohacking hype, and guaranteed outcomes"), ("Visual direction", "Carbon black, warm gold, technical diagrams, generous space")],
    flow=["CLARITY", "CREDIBILITY", "DISTINCTION", "RECALL"]),
  dict(key="architect", agent="ARCHITECT", title="Signature Program Blueprint", accent="#7A9FDB",
    thesis="The 12-week Durable Strength Intensive moves clients from inconsistent effort to an autonomous training system.",
    summary="A teachable transformation mapped as milestones rather than a content library. Each phase has an observable outcome, implementation work, coaching touchpoint, and progress signal.",
    metrics=[("DURATION", "12 weeks"), ("PHASES", "4"), ("MILESTONES", "8")],
    rows=[("01 / Foundation", "Weeks 1-2: baseline, constraints, minimum viable routine"), ("02 / Capacity", "Weeks 3-5: technique confidence and progressive loading"), ("03 / Resilience", "Weeks 6-9: recovery-led adaptation under real schedules"), ("04 / Autonomy", "Weeks 10-12: self-coaching rules and 90-day continuation plan")],
    flow=["BASELINE", "CAPACITY", "RESILIENCE", "AUTONOMY"]),
  dict(key="voice", agent="VOICE", title="Launch Copy Pack", accent="#AE93D6",
    thesis="You do not need more motivation. You need a strength system designed to survive your real calendar.",
    summary="A channel-ready messaging pack built only from approved strategy and evidence. The copy leads with the buyer's lived tension, makes a bounded promise, and uses a single clear invitation without manufactured urgency.",
    metrics=[("CORE ASSETS", "7 drafted"), ("CLAIMS CHECK", "Passed"), ("PRIMARY CTA", "Apply")],
    rows=[("Hero message", "Build lasting strength without reorganizing your life around fitness"), ("Problem frame", "The plan failed the calendar; the client did not fail the plan"), ("Mechanism", "Minimum effective training plus recovery-led progression"), ("Proof direction", "Use specific adherence and capability stories with permission"), ("Call to action", "Apply for a Durable Strength Strategy Session")],
    flow=["ATTENTION", "RELEVANCE", "BELIEF", "ACTION"]),
  dict(key="launch", agent="LAUNCH", title="Rollout Plan", accent="#D9768A",
    thesis="A focused 28-day founder-led rollout designed for eight qualified clients, not maximum reach.",
    summary="A dated execution plan matched to a small team's real capacity. It connects prerequisites, owners, channels, conversion checkpoints, and decision rules in one operating view.",
    metrics=[("WINDOW", "28 days"), ("TARGET", "8 clients"), ("READINESS", "92%")],
    rows=[("Week 1 / Prepare", "Finalize page, application, proof permissions, and tracking"), ("Week 2 / Warm", "Publish education sequence and hold partner conversations"), ("Week 3 / Open", "Applications live; daily follow-up and two live sessions"), ("Week 4 / Decide", "Close applications, conduct calls, onboard accepted clients"), ("Decision rule", "Pause paid reach if qualified-call rate falls below 20%")],
    flow=["PREPARE", "WARM", "OPEN", "ONBOARD"]),
]

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="DocTitle", fontName="Helvetica-Bold", fontSize=29, leading=32, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name="Agent", fontName="Helvetica-Bold", fontSize=9, leading=11, tracking=2, textColor=GOLD))
styles.add(ParagraphStyle(name="Deck", fontName="Helvetica", fontSize=12, leading=18, textColor=colors.HexColor("#4F473D")))
styles.add(ParagraphStyle(name="H1x", fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=INK, spaceAfter=12))
styles.add(ParagraphStyle(name="H2x", fontName="Helvetica-Bold", fontSize=10, leading=13, tracking=1.3, textColor=GOLD_DARK, spaceBefore=8, spaceAfter=8))
styles.add(ParagraphStyle(name="Bodyx", fontName="Helvetica", fontSize=9.5, leading=14, textColor=colors.HexColor("#302B24")))
styles.add(ParagraphStyle(name="Smallx", fontName="Helvetica", fontSize=7.5, leading=10, textColor=colors.HexColor("#62594D")))

class FlowDiagram(Flowable):
    def __init__(self, labels, accent):
        super().__init__(); self.labels = labels; self.accent = colors.HexColor(accent); self.width = 170*mm; self.height = 38*mm
    def draw(self):
        c = self.canv; n = len(self.labels); gap = 4*mm; boxw = (self.width-gap*(n-1))/n
        for i, label in enumerate(self.labels):
            x = i*(boxw+gap)
            c.setFillColor(colors.HexColor("#F5F1E9")); c.setStrokeColor(self.accent); c.roundRect(x, 8*mm, boxw, 20*mm, 3*mm, fill=1, stroke=1)
            c.setFillColor(INK); c.setFont("Helvetica-Bold", 7.2); c.drawCentredString(x+boxw/2, 17.5*mm, label)
            c.setFillColor(self.accent); c.circle(x+boxw/2, 31.5*mm, 1.5*mm, fill=1, stroke=0)
            if i < n-1:
                c.setStrokeColor(GOLD_DARK); c.line(x+boxw, 18*mm, x+boxw+gap, 18*mm)

class StrategyMatrix(Flowable):
    def __init__(self, labels, accent):
        super().__init__(); self.labels=labels; self.accent=colors.HexColor(accent); self.width=170*mm; self.height=82*mm
    def draw(self):
        c=self.canv; w=self.width; h=self.height; x0=24*mm; y0=12*mm; pw=w-34*mm; ph=h-23*mm
        c.setStrokeColor(colors.HexColor("#8C8377")); c.setLineWidth(.7); c.line(x0,y0,x0,y0+ph); c.line(x0,y0,x0+pw,y0)
        c.setFillColor(colors.HexColor("#5C544A")); c.setFont("Helvetica",7); c.drawString(0,y0+ph-2,"HIGH VALUE"); c.drawRightString(w,y0-9,"HIGH CONFIDENCE")
        positions=[(.2,.36),(.45,.7),(.7,.52),(.86,.82)]
        for i,label in enumerate(self.labels[:4]):
            px=x0+positions[i][0]*pw; py=y0+positions[i][1]*ph; radius=(7+i)*mm/2
            c.setFillColor(colors.Color(self.accent.red,self.accent.green,self.accent.blue,alpha=.16)); c.setStrokeColor(self.accent); c.circle(px,py,radius,fill=1,stroke=1)
            c.setFillColor(INK); c.setFont("Helvetica-Bold",6.5); c.drawCentredString(px,py-2,label)

class SignalChart(Flowable):
    def __init__(self, labels, accent):
        super().__init__(); self.labels=labels; self.accent=colors.HexColor(accent); self.width=170*mm; self.height=76*mm
    def draw(self):
        c=self.canv; values=[72,88,61,93,79]; names=(self.labels+["PROOF","FIT","CLARITY","READINESS","CONTROL"])[:5]
        for i,(name,value) in enumerate(zip(names,values)):
            y=self.height-(i+1)*13*mm
            c.setFillColor(colors.HexColor("#494238")); c.setFont("Helvetica-Bold",7); c.drawString(0,y+3,name)
            c.setFillColor(colors.HexColor("#E8E1D5")); c.roundRect(36*mm,y,116*mm,6*mm,3*mm,fill=1,stroke=0)
            c.setFillColor(self.accent); c.roundRect(36*mm,y,116*mm*value/100,6*mm,3*mm,fill=1,stroke=0)
            c.setFillColor(INK); c.drawRightString(169*mm,y+3,f"{value}%")

class TimelineDiagram(Flowable):
    def __init__(self, labels, accent):
        super().__init__(); self.labels=labels; self.accent=colors.HexColor(accent); self.width=170*mm; self.height=65*mm
    def draw(self):
        c=self.canv; y=31*mm; c.setStrokeColor(GOLD_DARK); c.setLineWidth(1.5); c.line(8*mm,y,162*mm,y)
        n=len(self.labels)
        for i,label in enumerate(self.labels):
            x=8*mm+i*(154*mm/max(1,n-1)); c.setFillColor(self.accent); c.circle(x,y,3*mm,fill=1,stroke=0)
            c.setFillColor(INK); c.setFont("Helvetica-Bold",7); c.drawCentredString(x,y+9*mm,label)
            c.setFillColor(colors.HexColor("#62594D")); c.setFont("Helvetica",6.5); c.drawCentredString(x,y-10*mm,f"STAGE {i+1}")

def page_bg(canvas, doc):
    canvas.saveState(); w, h = A4
    canvas.setFillColor(colors.HexColor("#FBF8F1")); canvas.rect(0, 0, w, h, fill=1, stroke=0)
    canvas.setFillColor(BLACK); canvas.rect(0, h-17*mm, w, 17*mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD); canvas.setFont("Helvetica-Bold", 17); canvas.drawString(18*mm, h-11.5*mm, "FAS")
    canvas.setFillColor(MUTED); canvas.setFont("Helvetica", 6.5); canvas.drawString(37*mm, h-10.8*mm, "FITNESS AUTHORITY SYSTEM  /  DEMO VAULT")
    canvas.setStrokeColor(GOLD); canvas.line(18*mm, 14*mm, 192*mm, 14*mm)
    canvas.setFillColor(colors.HexColor("#6A6258")); canvas.setFont("Helvetica", 6.5); canvas.drawString(18*mm, 9*mm, "FICTIONAL DEMO CONTENT  /  NOT PROFESSIONAL OR LEGAL ADVICE")
    canvas.drawRightString(192*mm, 9*mm, f"PAGE {doc.page}")
    canvas.restoreState()

def cover(doc):
    accent = colors.HexColor(doc["accent"])
    metrics = [[Paragraph(f'<font color="#8C6A2E">{a}</font><br/><font size="15"><b>{b}</b></font>', styles["Bodyx"]) for a,b in doc["metrics"]]]
    mt = Table(metrics, colWidths=[56*mm]*3, rowHeights=[25*mm])
    mt.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#F2EDE3")),("BOX",(0,0),(-1,-1),.5,accent),("INNERGRID",(0,0),(-1,-1),.4,colors.HexColor("#D4CBBB")),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),10)]))
    return [Spacer(1, 25*mm), Paragraph(doc["agent"], styles["Agent"]), Spacer(1, 4*mm), Paragraph(doc["title"], styles["DocTitle"]), Spacer(1, 5*mm), Paragraph(doc["thesis"], styles["Deck"]), Spacer(1, 18*mm), mt, Spacer(1, 18*mm), Paragraph("PREPARED FOR", styles["H2x"]), Paragraph("Alex Morgan  /  Forty Forward Coaching", styles["Bodyx"]), Spacer(1, 4*mm), Paragraph("Version 1.0  /  Approved demo  /  17 October 2026", styles["Smallx"]), PageBreak()]

def body_pages(doc):
    accent = colors.HexColor(doc["accent"])
    data = [[Paragraph("STRATEGIC FIELD", styles["Smallx"]), Paragraph("APPROVED DEMO CONTENT", styles["Smallx"])]] + [[Paragraph(a, styles["Bodyx"]), Paragraph(b, styles["Bodyx"])] for a,b in doc["rows"]]
    table = Table(data, colWidths=[45*mm, 123*mm], repeatRows=1)
    table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),INK),("TEXTCOLOR",(0,0),(-1,0),GOLD),("BOX",(0,0),(-1,-1),.6,LINE),("INNERGRID",(0,0),(-1,-1),.35,colors.HexColor("#D9D1C5")),("BACKGROUND",(0,1),(0,-1),colors.HexColor("#F1ECE3")),("VALIGN",(0,0),(-1,-1),"TOP"),("TOPPADDING",(0,0),(-1,-1),9),("BOTTOMPADDING",(0,0),(-1,-1),9),("LEFTPADDING",(0,0),(-1,-1),9),("RIGHTPADDING",(0,0),(-1,-1),9)]))
    field_text = "; ".join(f"{a.lower()}: {b}" for a,b in doc["rows"][:3])
    quality = Table([["CHECK", "STATUS", "NOTE"],["Evidence trace", "PASSED", "Claims tied to documented inputs"],["Boundary check", "PASSED", "No guarantee or unsupported credential"],["Downstream ready", "APPROVED", "Available to the next specialist"]], colWidths=[48*mm,35*mm,85*mm], style=[("BACKGROUND",(0,0),(-1,0),INK),("TEXTCOLOR",(0,0),(-1,0),GOLD),("GRID",(0,0),(-1,-1),.45,LINE),("BACKGROUND",(0,1),(-1,-1),colors.HexColor("#F4F0E8")),("TEXTCOLOR",(0,1),(-1,-1),INK),("FONT",(0,0),(-1,0),"Helvetica-Bold",8),("FONT",(0,1),(-1,-1),"Helvetica",8),("TOPPADDING",(0,0),(-1,-1),9),("BOTTOMPADDING",(0,0),(-1,-1),9)])
    risk_rows=[["RISK", "SAFEGUARD"],["Strategy drifts as new ideas appear", "Review changes against the approved thesis before editing downstream work"],["A recommendation is treated as a guarantee", "Keep outcomes bounded and preserve the explicit proof and claim limits"],["The document becomes shelfware", "Assign one decision, owner, and review date to every approved output"],["New evidence contradicts the demo assumptions", "Update the source field first, then deliberately cascade changes"]]
    risks=Table([[Paragraph(x,styles["Smallx"]) for x in row] for row in risk_rows],colWidths=[62*mm,106*mm],style=[("BACKGROUND",(0,0),(-1,0),INK),("TEXTCOLOR",(0,0),(-1,0),GOLD),("GRID",(0,0),(-1,-1),.4,LINE),("VALIGN",(0,0),(-1,-1),"TOP"),("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),("LEFTPADDING",(0,0),(-1,-1),8)])
    return [
      Paragraph("Executive context", styles["H1x"]), Paragraph(doc["summary"], styles["Bodyx"]), Spacer(1,4*mm),
      Paragraph("The strategic job",styles["H2x"]), Paragraph(f"The {doc['title']} exists to turn a broad ambition into a controlled set of decisions. Its working thesis is: {doc['thesis']} This provides a clear standard for deciding what belongs, what needs evidence, and what should be excluded.",styles["Bodyx"]),Spacer(1,4*mm),
      Paragraph("Why this matters",styles["H2x"]),Paragraph("Without an approved source of truth, later work becomes inconsistent: positioning expands, messages overreach, delivery becomes crowded, and launch activity loses focus. This artifact prevents that drift by recording the reasoning behind each decision, not merely the final wording.",styles["Bodyx"]),Spacer(1,7*mm), table, PageBreak(),

      Paragraph("Evidence and assumptions",styles["H1x"]),Paragraph(f"The approved record currently includes {field_text}. These inputs are treated as demo evidence for this fictional business. In a live engagement, ADAM would retain the source, date, and approval state for every material claim.",styles["Bodyx"]),Spacer(1,5*mm),
      Paragraph("What is known",styles["H2x"]),Paragraph("The business has a defined buyer, bounded result, repeatable delivery logic, and a practical route to market. The decisions align with one another and can be explained in plain language without relying on inflated credentials or manufactured certainty.",styles["Bodyx"]),Spacer(1,4*mm),
      Paragraph("What remains an assumption",styles["H2x"]),Paragraph("Conversion rate, willingness to pay, message resonance, and delivery capacity remain hypotheses until observed in market. The demo uses reasonable planning values, but those numbers should guide measurement rather than be presented as predicted results.",styles["Bodyx"]),Spacer(1,7*mm),quality,PageBreak(),

      Paragraph("Decision rationale",styles["H1x"]),Paragraph("The matrix below shows how the core decisions balance customer value with confidence in the supporting evidence. Larger movement toward the upper-right indicates a stronger candidate for emphasis. Lower-confidence elements are not discarded; they become explicit validation priorities.",styles["Bodyx"]),Spacer(1,8*mm),StrategyMatrix(doc["flow"],doc["accent"]),Spacer(1,7*mm),
      Paragraph("Interpretation",styles["H2x"]),Paragraph(f"The strongest strategic center is '{doc['thesis']}' because it connects an observable customer tension to a delivery approach the business can credibly support. The matrix is a decision aid, not a scientific score. Its value is making trade-offs visible and reviewable.",styles["Bodyx"]),PageBreak(),

      Paragraph("The operating framework",styles["H1x"]),Paragraph("This sequence shows how the approved strategy moves from input to usable output. Each stage has a distinct job and should be completed before the next is treated as final. The sequence reduces rework because downstream choices inherit already-approved constraints.",styles["Bodyx"]),Spacer(1,9*mm),FlowDiagram(doc["flow"],doc["accent"]),Spacer(1,9*mm),
      Paragraph("How to apply the framework",styles["H2x"]),Paragraph("Begin with the leftmost stage and record the evidence used to complete it. At each transition, ask whether the next stage can be supported without adding an unapproved claim. If the answer is no, return to the source decision instead of polishing the downstream output.",styles["Bodyx"]),Spacer(1,5*mm),Paragraph("The framework deliberately favors coherence over volume. A smaller system that can be explained, delivered, and measured is more valuable than a visually impressive system filled with assumptions.",styles["Bodyx"]),PageBreak(),

      Paragraph("Strategic signal dashboard",styles["H1x"]),Paragraph("The dashboard is a visual reading of readiness across the most important dimensions. Values are illustrative demo scores, designed to show how FAS can surface strengths and gaps without pretending that a score guarantees market performance.",styles["Bodyx"]),Spacer(1,8*mm),SignalChart(doc["flow"],doc["accent"]),Spacer(1,7*mm),
      Paragraph("What the signals mean",styles["H2x"]),Paragraph("High scores indicate that the decision is clear enough to guide action. Lower scores identify where more interviews, proof, delivery testing, or capacity planning may be useful. The correct response to a weak signal is targeted learning—not invented certainty.",styles["Bodyx"]),PageBreak(),

      Paragraph("Implementation roadmap",styles["H1x"]),Paragraph("The roadmap converts the document into a short operating cycle. It is intentionally sequential so the team knows what to validate first, what can be produced next, and when an output is ready to hand to another specialist.",styles["Bodyx"]),Spacer(1,9*mm),TimelineDiagram(doc["flow"],doc["accent"]),Spacer(1,8*mm),
      Paragraph("Operating guidance",styles["H2x"]),Paragraph("Assign one owner to each stage, define the evidence required to call it complete, and schedule a review before downstream assets are approved. Use the same language across the website, sales conversations, program materials, and launch reporting unless a deliberate channel adaptation is documented.",styles["Bodyx"]),Spacer(1,5*mm),Paragraph("Progress should be measured by decision quality and execution readiness, not by the number of pages produced. The document succeeds when it helps the team say yes or no with confidence.",styles["Bodyx"]),PageBreak(),

      Paragraph("Risks and safeguards",styles["H1x"]),Paragraph("A premium strategy remains useful only when its boundaries are protected. The safeguards below preserve credibility while allowing the business to learn and adapt.",styles["Bodyx"]),Spacer(1,7*mm),risks,Spacer(1,9*mm),
      Paragraph("Recommended next actions",styles["H1x"]),Paragraph("1. Confirm that the approved thesis still matches the offer and buyer evidence. 2. Assign an owner and review date to each strategic field. 3. Use the framework in the next specialist conversation. 4. Track contradictory evidence rather than silently editing it away. 5. Reapprove any change that materially affects claims, audience, delivery, or timing.",styles["Bodyx"]),Spacer(1,7*mm),
      Paragraph("ADAM'S NOTE",styles["H2x"]),Paragraph("This expanded demo illustrates the intended depth and visual hierarchy of a finished FAS artifact. It provides context, reasoning, diagrams, dashboards, and implementation guidance while keeping assumptions and limitations visible. In the live product, the customer remains the final approver.",styles["Bodyx"])
    ]

def build(path, documents):
    story=[]
    for i, doc in enumerate(documents):
        if i: story.append(PageBreak())
        story += cover(doc) + body_pages(doc)
    pdf = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=25*mm, bottomMargin=20*mm, title="FAS Demo Vault", author="Fitness Authority System", pageCompression=0)
    pdf.build(story, onFirstPage=page_bg, onLaterPages=page_bg)

for item in DOCS:
    build(OUT / f"fas-{item['key']}-demo.pdf", [item])
build(OUT / "fas-complete-blueprint-demo.pdf", DOCS)
print(f"Generated {len(DOCS)+1} PDFs in {OUT}")
