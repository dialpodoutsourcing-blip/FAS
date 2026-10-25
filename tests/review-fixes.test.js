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

test('live artifact review replaces the static preview and reflects the selected specialist',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'..','assets','js','artifact-ui.js'),'utf8');
 assert.match(ui,/querySelector\('\.main__body'\)/);
 assert.match(ui,/mainBody\.replaceChildren\(shell\)/);
 assert.doesNotMatch(ui,/querySelector\('main'\)\.prepend\(shell\)/);
 assert.match(ui,/getAttribute\('data-agent-link'\)===agentKey/);
 assert.match(ui,/classList\.toggle\('is-active'/);
 assert.match(ui,/chat\.html\?agent=/);
});

test('live artifact review has a dedicated readable document layout',()=>{
 const css=fs.readFileSync(path.join(__dirname,'..','assets','css','styles.css'),'utf8');
 assert.match(css,/\.artifact-live__layout\s*\{[^}]*grid-template-columns/s);
 assert.match(css,/\.artifact-live__section\s*\{[^}]*padding/s);
 assert.match(css,/\.artifact-live__body\s*\{[^}]*line-height:\s*1\.7/s);
});
test('live synthesized sections display every contributing source field',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'..','assets','js','artifact-ui.js'),'utf8');
 assert.match(ui,/block\.sourceIds\|\|\[block\.sourceId\]/);
 assert.match(ui,/Sources · /);
});
test('review controls expose visible status and validate exported file signatures',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'..','assets','js','artifact-ui.js'),'utf8');
 assert.match(ui,/data-live-notice/);
 assert.match(ui,/%PDF-/);
 assert.match(ui,/signature\.slice\(0,2\)!==['"]PK['"]/);
 assert.match(ui,/Approved ✓/);
 assert.match(ui,/setTimeout\(function\(\)\{URL\.revokeObjectURL/);
});

test('draft review suppresses the next-agent arrow until approval',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'..','assets','js','artifact-ui.js'),'utf8');
 assert.match(ui,/link\.classList\.remove\('is-preview'\)/);
 assert.match(ui,/selected\.status==='user_approved'/);
 assert.match(ui,/nextLink\.classList\.add\('is-preview'\)/);
});
test('completed specialists reopen their saved artifact while review offers chat and restart paths',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'..','assets','js','artifact-ui.js'),'utf8'),nav=fs.readFileSync(path.join(__dirname,'..','assets','js','nav.js'),'utf8');
 assert.match(nav,/fas\.project\./);
 assert.match(nav,/review\.html\?asset=/);
 assert.match(ui,/data-live-restart/);
 assert.match(ui,/restart=1/);
 assert.match(ui,/Back to chat/);
});

test('PDF control opens the validated file in the browser viewer',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'..','assets','js','artifact-ui.js'),'utf8');
 assert.match(ui,/window\.open\('about:blank','_blank'\)/);
 assert.match(ui,/previewWindow\.location\.href=url/);
 assert.match(ui,/Open PDF/);
});

test('shared navigation uses the reviewed artifact agent when selecting a specialist',()=>{
 const nav=fs.readFileSync(path.join(__dirname,'..','assets','js','nav.js'),'utf8');
 assert.match(nav,/query\.get\('agent'\)\s*\|\|\s*query\.get\('asset'\)/);
});

test('chat applies the database interview catalog before creating the interview',()=>{
 const chat=fs.readFileSync(path.join(__dirname,'..','assets','js','adam.js'),'utf8');
 assert.match(chat,/loadAgentCatalog\(\)/);
 assert.match(chat,/FAS\.agents\.applyCatalog/);
 assert.ok(chat.indexOf('loadAgentCatalog()') < chat.indexOf('FAS.interview.create'), 'database catalog loads before interview creation');
});

