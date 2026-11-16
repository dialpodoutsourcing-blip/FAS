'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const intent = require('../assets/js/interview-question-intent.js');

function classify(text){return intent.classify({text,currentQuestion:{question:'Who specifically benefits most from your expertise?'}});}

test('classifies clarification and contextual basic questions',()=>{
  for(const text of ['What do you mean?','Can you explain that?','Can you clarify the question?','Can you give me an example?','Why does that matter?','What is an ideal customer?'])assert.ok(classify(text),text);
  assert.equal(classify('What do you mean?').type,'clarification');
  assert.equal(classify('Why does that matter?').type,'basic_question');
});

test('does not steal controls confirmations or answer-like statements',()=>{
  for(const text of ['repeat the question','pause','switch to typing','end interview','retry','yes','no','What I do is help dentists grow','I help clients understand what matters most'])assert.equal(classify(text),null,text);
});
