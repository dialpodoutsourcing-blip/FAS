'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

test('comparison selects the nearest prior artifact version and reports section-level changes',()=>{
 const compare=require('../assets/js/artifact-compare.js');
 const versions=[
  {artifactId:'anchor-1',version:1,sections:[{title:'Authority arena',blocks:[{text:'Original arena.'}]},{title:'Evidence',blocks:[{text:'Early proof.'}]},{title:'Old section',blocks:[{text:'Retired.'}]}]},
  {artifactId:'anchor-1',version:3,sections:[{title:'Authority arena',blocks:[{text:'Focused arena.'}]},{title:'Evidence',blocks:[{text:'Documented proof.'}]},{title:'New section',blocks:[{text:'Added.'}]}]},
  {artifactId:'anchor-1',version:2,sections:[{title:'Authority arena',blocks:[{text:'Focused arena.'}]},{title:'Evidence',blocks:[{text:'Early proof.'}]},{title:'Old section',blocks:[{text:'Retired.'}]}]},
  {artifactId:'other-artifact',version:9,sections:[{title:'Authority arena',blocks:[{text:'Wrong artifact.'}]}]}
 ];
 const result=compare.buildComparison(versions[1],versions);
 assert.equal(result.previous.version,2);
 assert.equal(result.current.version,3);
 assert.deepEqual(result.rows.map(row=>[row.title,row.status]),[['Authority arena','unchanged'],['Evidence','changed'],['Old section','removed'],['New section','added']]);
 assert.equal(result.changedCount,3);
});

test('comparison returns null when no earlier version exists',()=>{
 const compare=require('../assets/js/artifact-compare.js');
 const current={artifactId:'anchor-1',version:1,sections:[]};
 assert.equal(compare.buildComparison(current,[current]),null);
});
