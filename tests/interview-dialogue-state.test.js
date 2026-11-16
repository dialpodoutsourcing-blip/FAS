'use strict';
const test=require('node:test');const assert=require('node:assert/strict');

test('keeps unlimited dialogue turns while bounding the request history',()=>{
 const create=require('../assets/js/interview-dialogue-state.js'),state=create({historyLimit:24}),question={field:'anchor.arena',question:'Who benefits most?'};
 for(let index=0;index<40;index++)state.record(question,index%2?'assistant':'user','turn '+index);
 assert.equal(state.turnCount(),40);
 assert.equal(state.history(question).length,24);
 assert.equal(state.history(question)[0].content,'turn 16');
});

test('resets dialogue when the canonical interview question changes',()=>{
 const create=require('../assets/js/interview-dialogue-state.js'),state=create({historyLimit:24}),first={field:'anchor.arena',question:'Who benefits most?'},second={field:'anchor.evidence',question:'What result proves this?'};
 state.record(first,'user','Can you explain?');state.record(first,'assistant','Think about the clearest beneficiary.');
 assert.equal(state.history(first).length,2);
 assert.deepEqual(state.history(second),[]);
 assert.equal(state.turnCount(),0);
});
