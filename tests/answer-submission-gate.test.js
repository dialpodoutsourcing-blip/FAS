'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const createGate = require('../assets/js/answer-submission-gate.js');

function setup(status) {
  const calls={repeat:[],clarify:[],confirm:[],submit:[]};
  const gate=createGate({
    assess:()=>({status,reason:status+'_reason'}),
    getQuestion:()=>({field:'anchor.arena',question:'Who do you help?'}),
    onRepeat:(input,assessment)=>calls.repeat.push([input,assessment]),
    onClarify:(input,assessment)=>calls.clarify.push([input,assessment]),
    onConfirm:pending=>calls.confirm.push(pending)
  });
  const submit=input=>{calls.submit.push(input);return Promise.resolve({saved:true});};
  return{gate,calls,submit};
}

test('accepted input submits immediately while repeat and clarify never submit',async()=>{
  const accepted=setup('accept');await accepted.gate.route({text:'Dentists',source:'type',turnId:'t1'},accepted.submit);assert.equal(accepted.calls.submit.length,1);
  const repeated=setup('repeat');await repeated.gate.route({text:'What was that again?',source:'talk',turnId:'t2'},repeated.submit);assert.equal(repeated.calls.submit.length,0);assert.equal(repeated.calls.repeat.length,1);
  const clarified=setup('clarify');await clarified.gate.route({text:'I cannot understand',source:'talk',turnId:'t3'},clarified.submit);assert.equal(clarified.calls.submit.length,0);assert.equal(clarified.calls.clarify.length,1);
});

test('questionable input stays pending until yes and submits exactly once',async()=>{
  const h=setup('confirm'),input={text:'My favorite color is blue.',source:'talk',turnId:'voice-1'};
  const result=await h.gate.route(input,h.submit);
  assert.deepEqual(result,{status:'confirm'});assert.equal(h.gate.hasPending(),true);assert.equal(h.calls.submit.length,0);
  assert.equal(h.calls.confirm[0].input,input);assert.deepEqual(h.calls.confirm[0].question,{field:'anchor.arena',question:'Who do you help?'});
  await h.gate.resolve(true);await h.gate.resolve(true);
  assert.equal(h.gate.hasPending(),false);assert.deepEqual(h.calls.submit,[input]);
});

test('no discards the held input and repeats its unchanged question',async()=>{
  const h=setup('confirm'),input={text:'I went to the beach.',source:'type',turnId:'type-1'};
  await h.gate.route(input,h.submit);await h.gate.resolve(false);
  assert.equal(h.calls.submit.length,0);assert.equal(h.calls.repeat.length,1);assert.equal(h.calls.repeat[0][0],input);assert.equal(h.calls.repeat[0][1].reason,'declined_confirmation');
});

test('a second answer cannot replace an answer already awaiting confirmation',async()=>{
  const h=setup('confirm');await h.gate.route({text:'First held',source:'type',turnId:'one'},h.submit);
  assert.deepEqual(await h.gate.route({text:'Second held',source:'type',turnId:'two'},h.submit),{status:'pending'});
  await h.gate.resolve(true);assert.equal(h.calls.submit[0].text,'First held');
});
