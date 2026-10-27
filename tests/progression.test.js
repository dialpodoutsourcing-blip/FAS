'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const progression=require('../assets/js/progression.js');

test('EXTRACT stays locked until a saved ANCHOR artifact exists',()=>{
 assert.equal(progression.anchorComplete({answers:[{agentKey:'anchor',text:'all answers'}],artifacts:[]}),false);
 assert.equal(progression.canEnter('extract',{artifacts:[]}),false);
 assert.match(progression.lockReason('extract',{artifacts:[]}),/finish anchor/i);
 assert.equal(progression.anchorComplete({artifacts:[{agentKey:'anchor',id:'blueprint'}]}),true);
 assert.equal(progression.anchorComplete({artifacts:[{agent_key:'anchor',id:'legacy'}]}),true);
 assert.equal(progression.canEnter('extract',{artifacts:[{agentKey:'anchor'}]}),true);
});

test('ANCHOR and later entitlement-controlled agents are unaffected by the sequence gate',()=>{
 assert.equal(progression.canEnter('anchor',{artifacts:[]}),true);
 assert.equal(progression.canEnter('radar',{artifacts:[]}),true);
 assert.equal(progression.lockReason('anchor',{artifacts:[]}),'');
});
