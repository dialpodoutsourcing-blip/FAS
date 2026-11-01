const test=require('node:test');
const assert=require('node:assert/strict');

const dashboard=require('../assets/js/dashboard.js');

test('dashboard starts a new customer at ANCHOR',()=>{
  const state=dashboard.derive({answers:[],checkpoints:{},artifacts:[]},['anchor','extract']);
  assert.deepEqual({key:state.key,step:state.step,total:state.total,status:state.status,action:state.action},{key:'anchor',step:1,total:2,status:'Not started',action:'Start step 1'});
});

test('dashboard keeps a partially answered customer on their actual specialist',()=>{
  const project={answers:[{agentKey:'anchor',text:'Useful answer'}],checkpoints:{anchor:{questionIndex:1}},artifacts:[]};
  const state=dashboard.derive(project,['anchor','extract']);
  assert.equal(state.key,'anchor');
  assert.equal(state.status,'In progress');
  assert.equal(state.action,'Continue step 1');
});

test('dashboard advances to EXTRACT only after ANCHOR is complete',()=>{
  const project={answers:[],checkpoints:{anchor:{questionIndex:6,insufficientFields:[],conflicts:[]}},artifacts:[{agentKey:'anchor'}]};
  const state=dashboard.derive(project,['anchor','extract']);
  assert.equal(state.key,'extract');
  assert.equal(state.step,2);
  assert.equal(state.status,'Not started');
  assert.equal(state.href,'chat.html?agent=extract');
});

test('dashboard reviews the final specialist when all available work is complete',()=>{
  const project={answers:[],checkpoints:{},artifacts:[{agentKey:'anchor'},{agentKey:'extract'}]};
  const state=dashboard.derive(project,['anchor','extract']);
  assert.equal(state.key,'extract');
  assert.equal(state.status,'Complete');
  assert.equal(state.action,'Review step 2');
  assert.equal(state.href,'review.html?asset=extract');
});
