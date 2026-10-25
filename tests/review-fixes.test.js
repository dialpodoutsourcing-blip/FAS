'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const interviews=require('../assets/js/interview-engine.js');const agents=require('../assets/js/agents.js');const artifacts=require('../assets/js/artifacts.js');

test('RLS separates read access from editor mutations and approved history is immutable',()=>{
 const sql=fs.readFileSync(path.join(__dirname,'..','supabase','migrations','202610250001_fas_production.sql'),'utf8');
 assert.doesNotMatch(sql,/create policy (?:answers|facts|artifacts|versions)_members[\s\S]{0,180}for all[\s\S]{0,180}can_access_project/i);
 for(const table of ['answers','facts','artifacts','artifact_versions'])assert.match(sql,new RegExp(`create policy ${table}_edit[\\s\\S]{0,220}using\\s*\\(public\\.can_edit_project`,'i'));
 assert.match(sql,/prevent_approved_history_mutation/i);
});

test('one thin-answer probe becomes a gap and a concrete clarification supersedes it',()=>{
 const interview=interviews.create({agent:agents.get('extract')});const field=interview.currentQuestion().field;
 const first=interview.acceptAnswer({field,text:'many clients'});assert.equal(first.followUps.length,1);
 const second=interview.acceptAnswer({field,text:'12 clients'});assert.equal(second.conflict,null);assert.equal(second.answer.supersedesId,first.answer.id);assert.equal(interview.checkpoint().questionIndex,1);
 const thin=interviews.create({agent:agents.get('extract')});thin.acceptAnswer({text:'many clients'});const repeated=thin.acceptAnswer({text:'still many'});assert.equal(repeated.followUps.length,0);assert.ok(thin.buildGapList().some(g=>g.field==='extract.context'&&g.reason==='insufficient'));
});

test('private and pending sources are excluded from public copy and missing sections remain gaps',()=>{
 const artifact=artifacts.build('voice',{id:'p',answers:[{field:'voice.message_brief',text:'Approved message',basis:'user',permissionStatus:'public'},{field:'voice.proof',text:'Private testimonial',basis:'user',permissionStatus:'private'}]});
 assert.doesNotMatch(JSON.stringify(artifact.sections),/Private testimonial/);assert.ok(artifact.warnings.some(w=>/private/i.test(w)));assert.ok(artifact.sections.some(s=>s.blocks.some(b=>b.kind==='gap')));
});

test('PDF accepts Unicode and long unbroken content',async()=>{
 const service=require('../lib/export-service.js');const value='Start → finish — café '+('X'.repeat(240));const artifact={type:'expertise_map',title:'Unicode Expertise Map',version:1,sections:[{title:'Origin',blocks:[{kind:'evidence',text:value}]}],sources:[]};const pdf=await service.renderPdf(artifact);assert.equal(pdf.subarray(0,5).toString(),'%PDF-');assert.ok(pdf.length>1000);
});

test('production UI includes connected artifact controller and runtime config bootstrap',()=>{
 const chat=fs.readFileSync(path.join(__dirname,'..','assets','js','adam.js'),'utf8'),review=fs.readFileSync(path.join(__dirname,'..','review.html'),'utf8'),vault=fs.readFileSync(path.join(__dirname,'..','vault.html'),'utf8');
 assert.match(chat,/loadProject\(\)[\s\S]*FAS\.interview\.create/);assert.match(chat,/window\.FAS_CONFIG/);assert.match(review,/assets\/js\/artifact-ui\.js/);assert.match(vault,/assets\/js\/artifact-ui\.js/);
});

test('chat applies the database interview catalog before creating the interview',()=>{
 const chat=fs.readFileSync(path.join(__dirname,'..','assets','js','adam.js'),'utf8');
 assert.match(chat,/loadAgentCatalog\(\)/);
 assert.match(chat,/FAS\.agents\.applyCatalog/);
 assert.ok(chat.indexOf('loadAgentCatalog()') < chat.indexOf('FAS.interview.create'), 'database catalog loads before interview creation');
});

