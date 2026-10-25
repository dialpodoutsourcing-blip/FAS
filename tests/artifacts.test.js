'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const artifacts=require('../assets/js/artifacts.js');

test('EXTRACT artifact preserves evidence, exact language, permissions, and gaps',()=>{
 const artifact=artifacts.build('extract',{id:'project-1',answers:[
  {field:'extract.origin',text:'I started after my own setback.',basis:'user'},
  {field:'extract.proof',text:'A client said “I finally understand the process.”',basis:'user',permissionStatus:'pending'},
  {field:'extract.method',text:'Audit, map, then teach.',basis:'user'}
 ]});
 assert.equal(artifact.type,'expertise_map');assert.equal(artifact.title,'Expertise Map');
 for(const title of ['Origin story','Expertise pillars','Signature moves','Proof bank','Point of view','Story bank','Boundaries','Open gaps'])assert.ok(artifact.sections.some(section=>section.title===title),title);
 assert.ok(artifact.sources.every(source=>source.field&&source.basis));
 assert.equal(artifact.sources.find(source=>source.field==='extract.proof').permissionStatus,'pending');
 assert.ok(artifact.warnings.some(warning=>/permission/i.test(warning)));
 assert.equal(artifacts.validate(artifact).valid,true);
});

test('artifact validation rejects an unsupported factual claim',()=>{
 const result=artifacts.validate({type:'expertise_map',title:'Map',version:1,sections:[{title:'Proof bank',blocks:[{kind:'claim',text:'Guaranteed revenue'}]}],sources:[]});
 assert.equal(result.valid,false);assert.ok(result.errors.some(error=>/source/i.test(error)));
});

test('all seven agents build a semantic artifact',()=>{
 for(const key of ['anchor','extract','radar','forge','architect','voice','launch']){
  const artifact=artifacts.build(key,{id:'p',answers:[{field:key+'.example',text:'Approved source answer',basis:'user'}]});
  assert.ok(artifact.type);assert.ok(artifact.sections.length,key);assert.ok(artifact.sources.length,key);
 }
});

