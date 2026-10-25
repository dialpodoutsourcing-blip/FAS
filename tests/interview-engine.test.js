'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const agents = require('../assets/js/agents.js');
const interviews = require('../assets/js/interview-engine.js');

test('all specialists expose complete declarative interview contracts', () => {
  const expected = {
    anchor:['authority','arena','evidence','position','boundaries','activation'],
    extract:['context','diagnostic','origin','timeline','method','proof','point_of_view','boundaries','synthesis'],
    radar:['market','evidence','current_state','desired_state','triggers','objections','language','priority','approval'],
    forge:['strategy','territories','candidates','shortlist','stress_test','selection','screening','identity'],
    architect:['transformation','milestones','phases','modules','lessons','implementation','overload','delivery','approval'],
    voice:['input_gate','content_job','context','gap_check','message_brief','draft','checks','approval'],
    launch:['launch_type','dates','prerequisites','backward_plan','owners','channels','calendar','sales','readiness','review']
  };
  for (const [key, chapters] of Object.entries(expected)) {
    const agent = agents.get(key);
    assert.deepEqual(agent.chapters.map(chapter => chapter.id), chapters);
    assert.ok(agent.chapters.every(chapter => chapter.questions.length));
    assert.ok(agent.outputs.length);
    assert.ok(agent.completionChecks.length);
  }
});

test('interview asks one question and chooses one matching follow-up', () => {
  const interview = interviews.create({ agent: agents.get('extract') });
  assert.equal(typeof interview.currentQuestion().question, 'string');
  const result = interview.acceptAnswer({ text: 'They want to make a lot more money.' });
  assert.equal(result.followUps.length, 1);
  assert.equal(result.followUps[0].trigger, 'vague_quantity');
  assert.match(result.followUps[0].question, /number|dollars|amount/i);
});

test('interview recognizes core responsive follow-up classes', () => {
  const classify = interviews.classify;
  const cases = [
    ['about $999 or maybe profit', 'ambiguous_number'],
    ['I believe consistency is everything', 'abstract_principle'],
    ['all of the above', 'hedging'],
    ['we use our scorecard template', 'tool_or_template'],
    ['this is sensitive and private', 'sensitive_story'],
    ['I have no idea', 'stuck'],
    ['we always do assessment, planning, delivery', 'loose_steps']
  ];
  for (const [answer, trigger] of cases) assert.equal(classify(answer).trigger, trigger, answer);
});

test('ordinary strategic prose is not mistaken for an unordered step list', () => {
  const answer = 'People already trust me to turn their ideas and business challenges into practical technology solutions.';
  assert.equal(interviews.classify(answer).trigger, null);
  assert.equal(interviews.classify('I serve coaches, consultants, and creators.').trigger, null);
  assert.equal(interviews.classify('We focus on strategy, systems, and support.').trigger, null);
  assert.notEqual(interviews.classify('My approach serves coaches, consultants, and creators.').trigger, 'loose_steps');
  assert.notEqual(interviews.classify('Our method supports strategy, systems, and support.').trigger, 'loose_steps');
  assert.notEqual(interviews.classify('This framework applies to founders, coaches, and consultants.').trigger, 'loose_steps');
});

test('a bare list gets an ordering probe when the current question asks for a process', () => {
  const agent={key:'test',chapters:[{id:'method',questions:[{field:'test.method',question:'What is your process?',required:true}]}]};
  const interview=interviews.create({agent});
  const result=interview.acceptAnswer({text:'Assessment, planning, delivery.'});
  assert.equal(result.followUps[0].trigger,'loose_steps');
});

test('the requested follow-up resolves a probe even when its wording still matches the trigger', () => {
  const interview = interviews.create({ agent: agents.get('anchor') });
  const first = interview.acceptAnswer({ text:'We use assessment, planning, delivery.' });
  assert.equal(first.followUps[0].trigger, 'loose_steps');
  const clarification = interview.acceptAnswer({ text:'The exact order is: 1. assessment, 2. planning, 3. delivery.' });
  assert.equal(clarification.conflict, null);
  assert.equal(clarification.answer.incomplete, false);
  assert.equal(clarification.answer.supersedesId, first.answer.id);
  assert.equal(interview.currentQuestion().field, 'anchor.arena');
  assert.deepEqual(interview.checkpoint().insufficientFields, []);
});

test('natural affirmative ordering structures resolve the step probe', () => {
  const clarifications=[
    'First assess the problem, then plan the route, and finally deliver the work.',
    '1. Assess the problem.\n2. Plan the route.\n3. Deliver the work.',
    'Assessment -> planning -> delivery.',
    'There are 3 steps: assessment, planning, delivery.',
    'First assess what could fail, then plan safeguards, and finally deliver the work.',
    '1. Review what might block progress. 2. Plan the response. 3. Deliver the work.'
  ];
  for(const text of clarifications){
    const interview=interviews.create({agent:agents.get('anchor')});
    interview.acceptAnswer({text:'We always do assessment, planning, delivery.'});
    const result=interview.acceptAnswer({text});
    assert.equal(result.answer.incomplete,false,text);
    assert.equal(interview.buildGapList().some(gap=>gap.field==='anchor.authority'),false,text);
  }
});

test('uncertain or negative ordering follow-ups remain visible gaps', () => {
  for (const clarification of [
    'Not sure of the exact order; maybe assessment, planning, delivery.',
    'There is no exact order: assessment, planning, delivery.',
    'Unsure.',
    'I am unsure.',
    'I am not certain.',
    'Probably assessment, planning, delivery.',
    'I might start with assessment, then planning, then delivery.',
    'First assess the problem, then maybe plan the route, and finally deliver the work.',
    'Assessment -> maybe planning -> delivery.',
    '1. Assess the problem.\n2. Maybe plan the route.\n3. Deliver the work.',
    'There are 3 steps: assessment, planning, maybe delivery.',
    'There are 3 steps, in this exact order.',
    'I cannot give an exact order.',
    'It could be assessment, planning, delivery.',
    'Assessment, planning, delivery.',
    'Assessment, planning, delivery, but I am unsure.'
  ]) {
    const interview=interviews.create({agent:agents.get('anchor')});
    interview.acceptAnswer({text:'We always do assessment, planning, delivery.'});
    const repeated=interview.acceptAnswer({text:clarification});
    assert.equal(repeated.answer.incomplete,true,clarification);
    assert.ok(interview.buildGapList().some(gap=>gap.field==='anchor.authority'&&gap.reason==='insufficient'),clarification);
  }
});

test('legacy same-trigger probe checkpoints reopen as complete instead of getting stuck', () => {
  const agent={key:'test',chapters:[{id:'sequence',questions:[{field:'test.sequence',question:'What is the sequence?',required:true}]}]};
  const interview=interviews.create({agent,state:{
    questionIndex:1,
    answers:[
      {id:'answer-1',field:'test.sequence',text:'Assessment, planning, delivery.',incomplete:true,trigger:'loose_steps'},
      {id:'answer-2',field:'test.sequence',text:'I organize it into 3 steps, in this exact order:\nAssess – Find the problem.\nPlan – Choose the route.\nDeliver – Complete the work.\nWe avoid claims we cannot prove.',incomplete:true,trigger:'loose_steps'}
    ],
    conflicts:[{field:'test.sequence',values:['Assessment, planning, delivery.','I organize it into 3 steps, in this exact order:\nAssess – Find the problem.\nPlan – Choose the route.\nDeliver – Complete the work.\nWe avoid claims we cannot prove.'],status:'open'}],
    probeAttempts:{'test.sequence':1},
    insufficientFields:['test.sequence']
  }});
  assert.equal(interview.completion().complete, true);
  assert.deepEqual(interview.checkpoint().conflicts, []);
  assert.equal(interview.checkpoint().answers[1].incomplete, false);
});

test('summaries occur after accepted answer intervals and checkpoint resumes', () => {
  let interview = interviews.create({ agent: agents.get('extract') });
  for (let index=0; index<3; index++) {
    const result = interview.acceptAnswer({ text: `Concrete answer ${index} with 12 clients and a clear example.` });
    if (index<2) assert.equal(result.summary, null);
    else assert.ok(result.summary);
  }
  const checkpoint = interview.checkpoint();
  interview = interviews.create({ agent: agents.get('extract'), state: checkpoint });
  assert.equal(interview.checkpoint().answers.length, 3);
});

test('restore returns an interview to the exact checkpoint before a rejected durable write', () => {
  const interview=interviews.create({agent:agents.get('anchor')});
  const before=interview.checkpoint();
  interview.acceptAnswer({text:'Independent consultants already ask for my help.'});
  assert.notDeepEqual(interview.checkpoint(),before);
  interview.restore(before);
  assert.deepEqual(interview.checkpoint(),before);
  assert.equal(interview.currentQuestion().field,'anchor.authority');
});

test('reconcileAnswer replaces local identities with durable UUIDs for later clarifications',()=>{
  const interview=interviews.create({agent:agents.get('anchor')}),first=interview.acceptAnswer({text:'Many clients ask for help.'});
  interview.reconcileAnswer(first.answer.id,{id:'55555555-5555-4555-8555-555555555555'});
  const clarification=interview.acceptAnswer({text:'Twelve clients asked last quarter.'});
  assert.equal(clarification.answer.supersedesId,'55555555-5555-4555-8555-555555555555');
});

test('contradictions and public-use permission stay unresolved until confirmed', () => {
  const interview = interviews.create({ agent: agents.get('extract') });
  interview.acceptAnswer({ field:'offer.price', text:'The price is $997.' });
  const conflict = interview.acceptAnswer({ field:'offer.price', text:'The price is $1,497.' });
  assert.equal(conflict.conflict.status, 'open');
  assert.equal(interview.completion().complete, false);
  interview.resolveConflict({ field:'offer.price', value:'The price is $1,497.' });
  const sensitive = interview.acceptAnswer({ field:'proof.story', text:'This private client story proves it.', sensitive:true });
  assert.equal(sensitive.answer.permissionStatus, 'pending');
});

test('architect requires the six-question curriculum loop for every phase', () => {
  const interview = interviews.create({ agent: agents.get('architect'), state:{ phases:[{ name:'Foundation', firstAction:'Audit' }] } });
  const gaps = interview.buildGapList();
  for (const field of ['benchmark','mistakeCost','proofStory','resource','doneDefinition']) assert.ok(gaps.some(gap => gap.field.includes(field)), field);
});

