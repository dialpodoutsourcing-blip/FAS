'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const progression=require('../assets/js/progression.js');

test('EXTRACT unlocks from a completed ANCHOR checkpoint or saved artifact',()=>{
 assert.equal(progression.anchorComplete({answers:[{agentKey:'anchor',text:'all answers'}],artifacts:[]}),false);
 assert.equal(progression.canEnter('extract',{artifacts:[]}),false);
 assert.match(progression.lockReason('extract',{artifacts:[]}),/finish anchor/i);
 assert.equal(progression.anchorComplete({checkpoints:{anchor:{questionIndex:6,insufficientFields:[],conflicts:[]}},artifacts:[]}),true);
 assert.equal(progression.anchorComplete({artifacts:[{agentKey:'anchor',id:'blueprint'}]}),true);
 assert.equal(progression.anchorComplete({artifacts:[{agent_key:'anchor',id:'legacy'}]}),true);
 assert.equal(progression.canEnter('extract',{artifacts:[{agentKey:'anchor'}]}),true);
});

test('partial or unresolved ANCHOR checkpoints keep EXTRACT locked',()=>{
 assert.equal(progression.anchorComplete({checkpoints:{anchor:{questionIndex:5,insufficientFields:[],conflicts:[]}}}),false);
 assert.equal(progression.anchorComplete({checkpoints:{anchor:{questionIndex:6,insufficientFields:['anchor.evidence'],conflicts:[]}}}),false);
 assert.equal(progression.anchorComplete({checkpoints:{anchor:{questionIndex:6,insufficientFields:[],conflicts:[{status:'open'}]}}}),false);
 assert.equal(progression.anchorComplete({checkpoints:{anchor:{questionIndex:6,conflicts:[{status:'resolved'}]}}}),true);
 assert.equal(progression.anchorComplete({answers:new Array(12).fill({agentKey:'anchor'}),checkpoints:{anchor:{questionIndex:4}}}),false);
});

test('ANCHOR and later entitlement-controlled agents are unaffected by the sequence gate',()=>{
 assert.equal(progression.canEnter('anchor',{artifacts:[]}),true);
 assert.equal(progression.canEnter('radar',{artifacts:[]}),true);
 assert.equal(progression.lockReason('anchor',{artifacts:[]}),'');
});

test('progression applies and removes the visible EXTRACT lock',()=>{
 const attrs={},classes=new Set(['is-locked']),label={textContent:''},link={href:'chat.html?agent=anchor&notice=extract-locked',getAttribute:name=>name==='data-unlocked-href'?'chat.html?agent=extract':attrs[name],setAttribute:(name,value)=>{attrs[name]=value;},removeAttribute:name=>{delete attrs[name];},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},querySelector:selector=>selector==='[data-progression-label]'?label:null};
 const doc={querySelectorAll:()=>[link]};
 progression.apply({artifacts:[]},doc);assert.equal(attrs['aria-disabled'],'true');assert.match(label.textContent,/finish anchor/i);
 progression.apply({checkpoints:{anchor:{questionIndex:6,insufficientFields:[],conflicts:[]}},artifacts:[]},doc);assert.equal(attrs['aria-disabled'],undefined);assert.equal(link.href,'chat.html?agent=extract');assert.equal(classes.has('is-locked'),false);
});
