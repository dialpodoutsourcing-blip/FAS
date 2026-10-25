'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const interviews=require('../assets/js/interview-engine.js');const agents=require('../assets/js/agents.js');const artifacts=require('../assets/js/artifacts.js');
const anchorUpgrade=require('../assets/js/anchor-artifact-upgrade.js');

function legacyAnchorProject(premium){
 const fields=['authority','arena','evidence','position','boundaries','activation'];
 const selected={id:'trusted-expert-statement-review-project',artifactId:'saved-anchor-id',agentKey:'anchor',type:'trusted_expert_statement',title:'Trusted Expert Blueprint',version:premium?2:1,status:'draft',exportTheme:'boardroom-consultancy',sections:[{title:'Authority arena',blocks:[{text:'Legacy summary.'}]}]};
 if(premium)selected.premiumReport={executiveBrief:{opportunity:'Premium report.'}};
 return{id:'review-project',answers:fields.map((field,index)=>({id:'answer-'+index,agentKey:'anchor',field:'anchor.'+field,text:'Specific saved '+field+' answer for the premium report.'})),artifactVersions:[selected]};
}

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

test('Anchor review startup upgrades once, reloads persistence, and renders the latest premium version',async()=>{
 const legacy=legacyAnchorProject(false),premium=legacyAnchorProject(true),states=[];let loads=0,saves=0;
 const store={loadProject:async()=>++loads===1?legacy:premium,saveArtifactVersion:async()=>{saves+=1;}};
 const result=await anchorUpgrade.loadReview({agentKey:'anchor',isReview:true,store,artifacts,fetchImpl:async()=>({ok:false}),onState:state=>states.push(state)});
 assert.equal(loads,2);assert.equal(saves,1);assert.deepEqual(states.map(state=>state.status),['upgrading','ready']);
 assert.equal(result.selected.version,2);assert.ok(result.selected.premiumReport);
});

test('Anchor review startup keeps the legacy version visible and exposes a working retry after save failure',async()=>{
 const legacy=legacyAnchorProject(false),premium=legacyAnchorProject(true),states=[];let saved=false,fail=true;
 const store={loadProject:async()=>saved?premium:legacy,saveArtifactVersion:async()=>{if(fail)throw new Error('database unavailable');saved=true;}};
 const first=await anchorUpgrade.loadReview({agentKey:'anchor',isReview:true,store,artifacts,fetchImpl:async()=>({ok:false}),onState:state=>states.push(state)});
 assert.equal(first.status,'error');assert.equal(first.selected.version,1);assert.equal(typeof first.retry,'function');
 fail=false;const retried=await first.retry();
 assert.equal(retried.status,'ready');assert.equal(retried.selected.version,2);assert.deepEqual(states.map(state=>state.status),['upgrading','error','upgrading','ready']);
});

test('review page wires the upgrade module before the controller and includes compact upgrade states',()=>{
 const review=fs.readFileSync(path.join(__dirname,'..','review.html'),'utf8'),ui=fs.readFileSync(path.join(__dirname,'..','assets','js','artifact-ui.js'),'utf8'),css=fs.readFileSync(path.join(__dirname,'..','assets','css','styles.css'),'utf8');
 const upgradeIndex=review.indexOf('assets/js/anchor-artifact-upgrade.js'),controllerIndex=review.indexOf('assets/js/artifact-ui.js');assert.ok(upgradeIndex>=0&&upgradeIndex<controllerIndex);
 assert.match(ui,/Upgrading your blueprint/);assert.match(ui,/We couldn\\'t save your upgraded blueprint/);assert.match(ui,/Try again/);
 assert.match(css,/\.artifact-upgrade-state\s*\{/);assert.match(css,/\.artifact-upgrade-state\.is-error\s*\{/);
});

test('review controller creates an authenticated Supabase store after the protected context resolves',async()=>{
 const source=fs.readFileSync(path.join(__dirname,'..','assets','js','artifact-ui.js'),'utf8');let received;
 const pending=new Promise(()=>{}),body={hasAttribute:name=>name==='data-artifact-review'},authState={mode:'supabase',session:{accessToken:'user-token',user:{id:'user-id'}},context:{projectId:'project-id',sessions:{anchor:'session-id'}}};
 const config={configured:true,supabaseUrl:'https://example.supabase.co',supabasePublishableKey:'anon-public'};
 const context={window:{FAS_CONFIG:config,FAS:{authReady:Promise.resolve(authState),projectStore:{create:options=>{received=options;return{loadProject:()=>pending};}}},fetch:async()=>{}},document:{body,querySelector:()=>null},location:{search:'?asset=anchor'},URLSearchParams,setTimeout,Promise};
 vm.runInNewContext(source,context);
 await Promise.resolve();
 assert.equal(received.configured,true);assert.equal(received.config,config);assert.equal(received.authState,authState);assert.equal(received.agentKey,'anchor');assert.equal(received.projectId,'project-id');assert.equal(received.sessionId,'session-id');
});

test('review back link targets the current agent before an artifact exists and preserves its session',async()=>{
 const source=fs.readFileSync(path.join(__dirname,'..','assets','js','artifact-ui.js'),'utf8'),back={href:'chat.html'},pending=new Promise(()=>{});
 const body={hasAttribute:name=>name==='data-artifact-review'},authState={mode:'supabase',session:{accessToken:'user-token',user:{id:'user-id'}},context:{projectId:'project-id',sessions:{anchor:'anchor-session'}}};
 const document={body,querySelector:selector=>selector==='.toolbar a.btn'?back:null};
 const context={window:{FAS_CONFIG:{configured:true,supabaseUrl:'https://example.supabase.co',supabasePublishableKey:'public-key'},FAS:{authReady:Promise.resolve(authState),projectStore:{create:()=>({loadProject:()=>pending})}}},document,location:{search:'?asset=anchor&project=project-id&session=anchor-session'},URLSearchParams,setTimeout,Promise};
 vm.runInNewContext(source,context);await Promise.resolve();await Promise.resolve();
 assert.equal(back.href,'chat.html?agent=anchor&project=project-id&session=anchor-session');
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
test('approval pins the exact displayed artifact version',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'..','assets','js','artifact-ui.js'),'utf8');assert.match(ui,/approveArtifact\(selected\.artifactId\|\|selected\.id,selected\.version\)/);
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

test('PDF control validates and downloads the selected branded file',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'..','assets','js','artifact-ui.js'),'utf8');
 assert.match(ui,/%PDF-/);
 assert.match(ui,/link\.download=filename/);
 assert.match(ui,/theme:theme/);
});

test('PDF control opens a three-brand chooser while DOCX remains direct',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'..','assets','js','artifact-ui.js'),'utf8'),review=fs.readFileSync(path.join(__dirname,'..','review.html'),'utf8');
 assert.match(review,/assets\/js\/export-themes\.js/);
 assert.match(ui,/Choose your blueprint style/);
 assert.match(ui,/showModal\(\)/);
 assert.match(ui,/saveExportTheme/);
 assert.match(ui,/runExport\([^,]+,'docx'\)/);
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

