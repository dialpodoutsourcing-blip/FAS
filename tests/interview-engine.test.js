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

