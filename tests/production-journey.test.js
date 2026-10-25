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

