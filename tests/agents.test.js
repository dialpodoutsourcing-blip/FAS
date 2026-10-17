const assert = require('node:assert/strict');
const agents = require('../assets/js/agents.js');

const expected = {
  anchor: ['Authority', 'Arena', 'Evidence', 'Position', 'Boundaries', 'Activation'],
  extract: ['Context', 'Origin', 'Timeline', 'Method', 'Proof', 'Point of view', 'Boundaries', 'Synthesis'],
  radar: ['Market', 'Evidence', 'Current state', 'Desired state', 'Triggers', 'Objections', 'Language', 'Priority', 'Approval'],
  forge: ['Strategy', 'Territories', 'Candidates', 'Shortlist', 'Stress test', 'Selection', 'Screening', 'Identity brief'],
  architect: ['Transformation', 'Milestones', 'Phases', 'Modules', 'Lessons', 'Implementation', 'Overload check', 'Delivery check', 'Approval'],
  voice: ['Input gate', 'Content job', 'Context', 'Gap check', 'Message brief', 'Sectional draft', 'Checks', 'Approval'],
  launch: ['Launch type', 'Dates', 'Prerequisites', 'Backward plan', 'Owners', 'Channels', 'Calendar', 'Sales', 'Readiness', 'Review']
};

assert.deepEqual(agents.keys, Object.keys(expected), 'exports exactly seven source-derived agents');

agents.keys.forEach((key, index) => {
  const agent = agents.get(key);
  assert.equal(agent.key, key);
  assert.equal(agent.step, index + 1);
  ['name', 'title', 'symbol', 'color', 'outcome', 'briefing', 'introduction', 'question', 'completionLabel', 'completionHref'].forEach(field => {
    assert.equal(typeof agent[field], 'string', `${key}.${field} should be text`);
    assert.ok(agent[field].length > 0, `${key}.${field} should not be empty`);
  });
  assert.deepEqual(agent.stages, expected[key], `${key} stages should match the approved flow`);
  assert.ok(Number.isInteger(agent.activeStage) && agent.activeStage >= 0 && agent.activeStage < agent.stages.length);
  assert.ok(Array.isArray(agent.messages) && agent.messages.length >= 1);
  assert.equal(agent.hints.length, 2);
  assert.ok(agent.savedFields.length >= 2 && agent.savedFields.length <= 3);
  assert.ok(agent.briefing.length >= 140, `${key}.briefing should explain the specialist in useful detail`);
  assert.ok(agent.introduction.length >= 180, `${key}.introduction should give a useful spoken overview`);
  assert.ok(agent.introduction.includes(agent.name), `${key}.introduction should identify the specialist by name`);
  assert.ok(agent.introduction.includes(agent.title), `${key}.introduction should identify the specialist role`);
  assert.ok(Array.isArray(agent.generates) && agent.generates.length === 3, `${key}.generates should name three concrete deliverables`);
  agent.generates.forEach(item => assert.ok(typeof item === 'string' && item.length >= 12, `${key} deliverables should be specific`));
});

assert.equal(new Set(agents.keys.map(key => agents.get(key).introduction)).size, 7, 'every specialist has a unique spoken introduction');

assert.equal(agents.resolveKey(' RADAR '), 'radar');
assert.equal(agents.resolveKey('Voice'), 'voice');
assert.equal(agents.resolveKey(), 'extract');
assert.equal(agents.resolveKey(''), 'extract');
assert.equal(agents.resolveKey('bogus'), 'extract');

const first = agents.get('anchor');
first.hints.pop();
assert.equal(agents.get('anchor').hints.length, 2, 'get returns a defensive copy');
assert.deepEqual(agents.normalize({ key: 'demo' }).hints, []);
assert.deepEqual(agents.normalize({ key: 'demo' }).savedFields, []);
assert.deepEqual(agents.normalize({ key: 'demo' }).generates, []);
assert.equal(agents.normalize({ key: 'demo' }).introduction, '');

console.log('Agent registry checks passed.');
