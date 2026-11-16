'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const relevance = require('../assets/js/answer-relevance.js');

function assess(text, field, question) {
  return relevance.assess({ text, agentKey:'anchor', question:{ field, question } });
}

test('classifies repeat and confusion language before relevance scoring', () => {
  assert.equal(assess('What was that again?', 'anchor.authority', 'What do people ask you for?').status, 'repeat');
  assert.equal(assess('What did you ask me?', 'anchor.authority', 'What do people ask you for?').status, 'repeat');
  assert.equal(assess('What was that again? I cannot understand.', 'anchor.authority', 'What do people ask you for?').status, 'repeat');
  assert.equal(assess('I cannot understand', 'anchor.authority', 'What do people ask you for?').status, 'clarify');
  assert.equal(assess("I'm trying to understand you", 'anchor.authority', 'What do people ask you for?').status, 'clarify');
});

test('accepts concise answers whose shape or concepts fit the current field', () => {
  const examples = [
    ['Dentists', 'anchor.arena', 'Who specifically benefits most from your expertise?'],
    ['200 clients', 'anchor.evidence', 'What proof or result supports this?'],
    ['June 15', 'launch.dates', 'Which dates are confirmed?'],
    ['Sarah owns checkout', 'launch.owners', 'Who owns each launch-critical task?'],
    ['First audit, then plan, finally launch', 'extract.method', 'What is your repeatable process?'],
    ['About 40', 'anchor.evidence', 'What is the closest real number?'],
    ['I help clients understand their finances', 'anchor.authority', 'What do people ask you for?']
  ];
  for (const [text, field, question] of examples) assert.equal(assess(text, field, question).status, 'accept', text);
});

test('holds substantive replies with no relationship to the current question for confirmation', () => {
  assert.deepEqual(assess('My favorite color is blue.', 'anchor.arena', 'Who specifically benefits most from your expertise?'), { status:'confirm', reason:'uncertain_relevance' });
  assert.deepEqual(assess('I went to the beach yesterday.', 'anchor.evidence', 'What proof or result supports this?'), { status:'confirm', reason:'uncertain_relevance' });
});

test('normalizes punctuation and treats malformed or empty input as clarification', () => {
  assert.equal(assess('  WHAT was that, again?! ', 'anchor.authority', 'What do people ask you for?').status, 'repeat');
  assert.deepEqual(relevance.assess({ text:'', question:null }), { status:'clarify', reason:'empty' });
});

test('classifies only explicit save or discard replies for relevance confirmation', () => {
  for (const phrase of ['yes', 'save it', 'yes save it']) assert.equal(relevance.classifyDecision(phrase), true, phrase);
  for (const phrase of ['no', "don't save it", 'discard it']) assert.equal(relevance.classifyDecision(phrase), false, phrase);
  for (const phrase of ['restart', 'start over', 'yes retry', 'I have another question']) assert.equal(relevance.classifyDecision(phrase), null, phrase);
});
