'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const retry = require('../assets/js/retry-intent.js');

test('classifies explicit restart requests without treating ordinary retry language as destructive', () => {
  for (const phrase of ['retry', 'start over', "let's start from the start", 'start again', 'restart this step']) {
    assert.equal(retry.classify(phrase), 'request', phrase);
  }
  for (const phrase of ['retry the API call', 'start the next question', 'I tried again yesterday']) {
    assert.equal(retry.classify(phrase), null, phrase);
  }
});

test('classifies clear confirmation and cancellation replies', () => {
  for (const phrase of ['yes', 'yes retry', 'confirm', 'start over']) assert.equal(retry.classifyConfirmation(phrase), true, phrase);
  for (const phrase of ['no', 'cancel', 'keep my work', 'never mind']) assert.equal(retry.classifyConfirmation(phrase), false, phrase);
  assert.equal(retry.classifyConfirmation('I have another question'), null);
});
