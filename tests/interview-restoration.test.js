'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const agents=require('../assets/js/agents.js');
const interview=require('../assets/js/interview-engine.js');
const restoration=require('../assets/js/interview-restoration.js');

const anchor=agents.get('anchor');
const fields=['authority','arena','evidence','position','boundaries','activation'];
const answers=fields.map((field,index)=>({id:'saved-'+index,agentKey:'anchor',field:'anchor.'+field,text:'Saved answer '+(index+1),incomplete:false,createdAt:new Date(2026,0,index+1).toISOString()}));

test('durable completed answers override a stale checkpoint and restore completion',()=>{
 const stale={questionIndex:0,answers:[]};
 const state=restoration.reconcile(anchor,stale,answers);
 const restored=interview.create({agent:anchor,state});
 assert.equal(restored.currentQuestion(),null);
 assert.deepEqual(restored.completion(),{complete:true,gaps:[],conflicts:[]});
 assert.equal(state.answers.length,6);
});

test('checkpoint answers fill durable gaps so a completed interview opens completion',()=>{
 const checkpoint={questionIndex:6,answers:answers};
 const state=restoration.reconcile(anchor,checkpoint,answers.slice(0,1));
 const restored=interview.create({agent:anchor,state});
 assert.equal(restored.currentQuestion(),null);
 assert.deepEqual(restored.completion(),{complete:true,gaps:[],conflicts:[]});
 assert.deepEqual(state.answers.map(answer=>answer.field),fields.map(field=>'anchor.'+field));
});

test('durable answers rebuild the visible question and answer conversation in order',()=>{
 const transcript=restoration.transcript(anchor,answers);
 assert.equal(transcript.length,12);
 assert.deepEqual(transcript.slice(0,4),[
  {role:'agent',text:'What do people already trust you to help them do?'},
  {role:'user',text:'Saved answer 1'},
  {role:'agent',text:'Who most needs that result right now?'},
  {role:'user',text:'Saved answer 2'}
 ]);
 assert.equal(transcript.at(-1).text,'Saved answer 6');
});

test('restoration stops at the first missing required answer',()=>{
 const state=restoration.reconcile(anchor,{questionIndex:0,answers:[]},answers.slice(0,5));
 const restored=interview.create({agent:anchor,state});
 assert.equal(restored.currentQuestion().field,'anchor.activation');
 assert.equal(restored.completion().complete,false);
});

test('restoration rebuilds pending clarification state from an incomplete durable answer',()=>{
 const incomplete=[{id:'saved-probe',agentKey:'anchor',field:'anchor.authority',text:'I help many people improve their business.',incomplete:true,trigger:'vague_quantity'}];
 const state=restoration.reconcile(anchor,null,incomplete);
 const restored=interview.create({agent:anchor,state});
 const result=restored.acceptAnswer({text:'I help 12 founders double their sales.'});
 assert.equal(result.answer.relation,'follow_up');
 assert.equal(result.conflict,null);
 assert.equal(restored.checkpoint().conflicts.length,0);
});
