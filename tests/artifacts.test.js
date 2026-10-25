'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const artifacts=require('../assets/js/artifacts.js');

test('ANCHOR turns all six answers into five complete, grounded blueprint sections',()=>{
 const project={id:'anchor-project',answers:[
  {id:'a1',agentKey:'anchor',field:'anchor.authority',text:'Turn scattered expertise into one focused paid program.'},
  {id:'a2',agentKey:'anchor',field:'anchor.arena',text:'Experienced solo consultants building their first group offer.'},
  {id:'a3',agentKey:'anchor',field:'anchor.evidence',text:'18 completions from 22 enrollments plus three approved testimonials.'},
  {id:'a4',agentKey:'anchor',field:'anchor.position',text:'A narrow promise beats an oversized content library.'},
  {id:'a5',agentKey:'anchor',field:'anchor.boundaries',text:'No revenue guarantees or uncited performance claims.'},
  {id:'a6',agentKey:'anchor',field:'anchor.activation',text:'Publish one case analysis and host a live workshop within 30 days.'}
 ]};
 const artifact=artifacts.build('anchor',project),copy=JSON.stringify(artifact.sections);
 assert.equal(artifact.sections.length,5);
 assert.ok(artifact.sections.every(section=>section.blocks.length&&section.blocks.every(block=>block.kind!=='gap')));
 for(const phrase of ['solo consultants','18 completions','narrow promise','No revenue guarantees','within 30 days'])assert.match(copy,new RegExp(phrase,'i'));
 const statement=artifact.sections.find(section=>section.title==='Trusted Expert Statement');
 assert.match(statement.blocks[0].text,/I help/i);
 assert.ok(statement.blocks[0].sourceIds.length>=4);
});

test('ANCHOR applies a five-part AI synthesis without losing source provenance',()=>{
 const base=artifacts.build('anchor',{id:'p',answers:['authority','arena','evidence','position','boundaries','activation'].map((field,index)=>({id:'s'+index,field:'anchor.'+field,text:'Answer '+field}))});
 const copy={authorityArena:'Focused arena.',trustedExpertStatement:'I help a defined audience achieve a grounded result.',evidence:'Strongest proof.',positionBoundaries:'Distinct position with responsible limits.',activation:'A focused 30-day action.'};
 const result=artifacts.applySynthesis(base,copy);
 assert.deepEqual(result.sections.map(section=>section.blocks[0].text),Object.values(copy));
 assert.ok(result.sections.every(section=>section.blocks[0].sourceIds.length));
 assert.deepEqual(base.sections[0].blocks[0].text.startsWith('Authority focus:'),true,'base artifact remains unchanged');
});

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

