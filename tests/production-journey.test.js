'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const agents=require('../assets/js/agents.js');const interviews=require('../assets/js/interview-engine.js');const stores=require('../assets/js/project-store.js');const artifacts=require('../assets/js/artifacts.js');const exportsService=require('../lib/export-service.js');
function memoryStorage(){const values=new Map();return{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,String(value))};}
test('local EXTRACT journey saves, resumes, approves, hands off, and exports',async()=>{
 const storage=memoryStorage(),store=stores.create({storage,projectId:'journey'}),interview=interviews.create({agent:agents.get('extract')});
 const question=interview.currentQuestion();const result=interview.acceptAnswer({field:question.field,text:'Clients ask me to turn scattered expertise into a clear teaching process for 12 teams.'});await store.saveAnswer(Object.assign({agentKey:'extract'},result.answer));await store.saveCheckpoint(Object.assign({agentKey:'extract'},interview.checkpoint()));
 const resumed=stores.create({storage,projectId:'journey'}),project=await resumed.loadProject();assert.equal(project.answers.length,1);assert.equal(project.checkpoints.extract.answers.length,1);
 const artifact=artifacts.build('extract',project);await resumed.saveArtifact(artifact);const approved=await resumed.approveArtifact(artifact.id);assert.equal(approved.status,'user_approved');assert.ok(agents.get('radar').chapters[0].questions[0]);
 const [pdf,docx]=await Promise.all([exportsService.renderPdf(artifact),exportsService.renderDocx(artifact)]);assert.equal(pdf.subarray(0,5).toString(),'%PDF-');assert.equal(docx.subarray(0,2).toString(),'PK');
});

test('branding controller persists one approved theme and starts only one PDF export',async()=>{
 const branding=require('../assets/js/export-themes.js'),events=[],states=[];
 let release;const waiting=new Promise(resolve=>{release=resolve;});
 const controller=branding.createSelectionController({persist:async theme=>events.push('persist:'+theme),exportPdf:async theme=>{events.push('export:'+theme);await waiting;return 'premium.pdf';},onState:state=>states.push(state)});
 const first=controller.select('luxury-editorial'),second=await controller.select('boardroom-consultancy');
 assert.equal(second,false,'a rapid second click is ignored while rendering');release();assert.equal(await first,'premium.pdf');
 assert.deepEqual(events,['persist:luxury-editorial','export:luxury-editorial']);assert.equal(controller.pending(),false);assert.equal(states.at(-1).status,'success');
});

test('branding controller restores selection after failure and normalizes unknown choices',async()=>{
 const branding=require('../assets/js/export-themes.js'),states=[];
 assert.deepEqual(branding.THEMES.map(theme=>theme.key),['editorial-strategy','luxury-editorial','boardroom-consultancy']);
 assert.ok(branding.THEMES.every(theme=>theme.name&&theme.description&&theme.preview));
 const controller=branding.createSelectionController({persist:async theme=>assert.equal(theme,'editorial-strategy'),exportPdf:async()=>{throw new Error('render failed');},onState:state=>states.push(state)});
 await assert.rejects(controller.select('unknown-theme'),/render failed/);assert.equal(controller.pending(),false);assert.equal(states.at(-1).status,'error');
 assert.equal(branding.isDismissIntent({key:'Escape'}),true);assert.equal(branding.isDismissIntent({backdrop:true}),true);assert.equal(branding.isDismissIntent({key:'Enter'}),false);
});

