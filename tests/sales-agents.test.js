'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const artifacts=require('../assets/js/artifacts.js');

test('VOICE blocks unsupported claims and incomplete message briefs',()=>{
 const result=artifacts.validateCopyBrief({reader:'Studio owners',problem:'Lead quality',outcome:'Double revenue guaranteed',cta:'Book a call',proof:[],price:'$997',deadline:'Tomorrow',deadlineConfirmed:false});
 assert.equal(result.valid,false);assert.ok(result.warnings.some(w=>/proof/i.test(w)));assert.ok(result.warnings.some(w=>/guarantee/i.test(w)));assert.ok(result.warnings.some(w=>/deadline/i.test(w)));
});

test('VOICE accepts one grounded CTA and preserves channel-specific jobs',()=>{
 const result=artifacts.validateCopyBrief({reader:'Studio owners',problem:'Lead quality',outcome:'Build a documented follow-up process',cta:'Book a call',proof:['12 reviewed cases'],channel:'email'});
 assert.equal(result.valid,true);assert.equal(result.ctaCount,1);assert.equal(result.channel,'email');
});

test('LAUNCH recalculates dependent dates without moving complete tasks or blackout dates',()=>{
 const tasks=[{id:'launch',dueDate:'2026-12-01',offsetDays:0,status:'not_started'},{id:'page',dueDate:'2026-11-20',offsetDays:-11,status:'not_started'},{id:'done',dueDate:'2026-11-01',offsetDays:-30,status:'complete'},{id:'blackout',dueDate:'2026-11-25',offsetDays:-6,status:'not_started',blackout:true}];
 const result=artifacts.recalculateLaunch(tasks,'2026-12-08');
 assert.equal(result.find(t=>t.id==='launch').dueDate,'2026-12-08');assert.equal(result.find(t=>t.id==='page').dueDate,'2026-11-27');assert.equal(result.find(t=>t.id==='done').dueDate,'2026-11-01');assert.equal(result.find(t=>t.id==='blackout').dueDate,'2026-11-25');
});

test('readiness scores cite underlying owned and dated tasks',()=>{
 const score=artifacts.readiness([{area:'offer',owner:'Mike',dueDate:'2026-11-01',status:'complete'},{area:'tech',owner:'',dueDate:null,status:'blocked'}]);
 assert.equal(score.score,50);assert.equal(score.areas.tech.ready,false);assert.deepEqual(score.areas.offer.sourceIndexes,[0]);
});

