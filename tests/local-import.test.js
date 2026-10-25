'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

function memoryStorage(project){const values=new Map();if(project)values.set('fas.project.local-default',JSON.stringify(project));return{getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};}
function answers(){return[
  {id:'local-2',agentKey:'extract',field:'extract.context',text:'Extract proof.',basis:'user',createdAt:'2026-01-02T00:00:00.000Z'},
  ...['authority','arena','evidence','position','boundaries','activation'].map((field,index)=>({id:'anchor-'+(index+1),agentKey:'anchor',field:'anchor.'+field,text:'Specific '+field+' answer.',basis:'user',permissionStatus:'not_required',createdAt:'2026-01-01T00:00:0'+index+'.000Z'}))
];}
function context(){return{projectId:'11111111-1111-4111-8111-111111111111',sessions:{anchor:'22222222-2222-4222-8222-222222222222',extract:'33333333-3333-4333-8333-333333333333'}};}
function response(body,ok=true){return{ok,status:ok?200:500,json:async()=>body};}
function options(storage,fetchImpl,extra={}){return Object.assign({storage,context:context(),auth:{requireSession:async()=>({accessToken:'user-token'})},supabaseUrl:'https://example.supabase.co',publishableKey:'anon-public',fetchImpl,anchorUpgrade:{rebuild:async({project})=>({id:'anchor-content',agentKey:'anchor',type:'trusted_expert_statement',title:'Trusted Expert Blueprint',sections:[],sources:project.answers.map(answer=>({id:answer.id,field:answer.field}))})}},extra);}

test('inspect ignores empty or completed local projects and hashes only canonical answer data',async()=>{
  const imports=require('../assets/js/local-import.js');
  assert.equal(await imports.create(options(memoryStorage({id:'local-default',answers:[]}),async()=>response([]))).inspect(),null);
  const project={id:'local-default',answers:answers(),accessToken:'must-not-be-hashed'};
  const first=await imports.create(options(memoryStorage(project),async()=>response([]))).inspect();
  const second=await imports.create(options(memoryStorage({...project,accessToken:'different-secret'}),async()=>response([]))).inspect();
  assert.match(first.checksum,/^[a-f0-9]{64}$/);assert.equal(first.checksum,second.checksum);
  const completed={...project,migration:{supabase:{projectId:context().projectId,checksum:first.checksum,completedAt:'2026-01-03T00:00:00.000Z'}}};
  assert.equal(await imports.create(options(memoryStorage(completed),async()=>response([]))).inspect(),null);
});

test('imports chronological multi-agent answers with stable references and saves one rebuilt Anchor artifact',async()=>{
  const imports=require('../assets/js/local-import.js'),storage=memoryStorage({id:'local-default',answers:answers()}),calls=[];
  let ids={};const fetchImpl=async(url,init={})=>{const body=init.body&&JSON.parse(init.body);calls.push({url,body});if(url.includes('/rpc/begin_fas_local_import'))return response({importId:'import-1',projectId:context().projectId,checksum:body.p_payload_checksum,status:'started',answerMap:{}});if(url.includes('/answers?'))return response([]);if(url.includes('/rpc/import_fas_local_answers')){ids=Object.fromEntries(body.p_answers.map((answer,index)=>[answer.localId,'cloud-'+(index+1)]));return response({importId:'import-1',status:'answers_imported',answerMap:ids});}if(url.includes('/rpc/save_fas_import_artifact'))return response({importId:'import-1',projectId:context().projectId,status:'artifact_saved',answerMap:ids});if(url.includes('/rpc/update_fas_local_import'))return response({importId:'import-1',projectId:context().projectId,checksum:'checksum',status:body.p_status,answerMap:ids,completedAt:body.p_status==='complete'?'2026-01-04T00:00:00.000Z':null});throw new Error('unexpected '+url);};
  const importer=imports.create(options(storage,fetchImpl)),candidate=await importer.inspect(),result=await importer.run(candidate);
  assert.equal(result.status,'complete');
  const batch=calls.find(call=>call.url.includes('import_fas_local_answers')).body.p_answers;
  assert.deepEqual(batch.map(item=>item.localId),answers().slice().sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).map(answer=>answer.agentKey+':'+answer.id));
  assert.equal(batch.find(item=>item.agentKey==='extract').sessionId,context().sessions.extract);
  assert.equal(batch.find(item=>item.agentKey==='anchor').sessionId,context().sessions.anchor);
  assert.ok(batch.every(item=>item.clientRef==='local:'+candidate.checksum+':'+item.localId));
  assert.equal(calls.filter(call=>call.url.includes('save_fas_import_artifact')).length,1);
  const saved=JSON.parse(storage.getItem('fas.project.local-default'));
  assert.equal(saved.answers.length,7);assert.equal(saved.migration.supabase.importId,'import-1');assert.equal(saved.migration.supabase.projectId,context().projectId);
});

test('partial imports resume from durable answers_imported state without duplicate answer inserts',async()=>{
  const imports=require('../assets/js/local-import.js'),storage=memoryStorage({id:'local-default',answers:answers()}),calls=[],ids=Object.fromEntries(answers().map((answer,index)=>[answer.agentKey+':'+answer.id,'cloud-'+index]));
  const fetchImpl=async(url,init={})=>{const body=init.body&&JSON.parse(init.body);calls.push({url,body});if(url.includes('begin_fas_local_import'))return response({importId:'import-1',projectId:context().projectId,status:'answers_imported',answerMap:ids});if(url.includes('save_fas_import_artifact'))return response({importId:'import-1',projectId:context().projectId,status:'artifact_saved',answerMap:ids});if(url.includes('update_fas_local_import'))return response({importId:'import-1',projectId:context().projectId,status:body.p_status,answerMap:ids,completedAt:'2026-01-04T00:00:00.000Z'});throw new Error('unexpected '+url);};
  const importer=imports.create(options(storage,fetchImpl)),result=await importer.run(await importer.inspect());
  assert.equal(result.status,'complete');assert.equal(calls.some(call=>call.url.includes('import_fas_local_answers')),false);assert.equal(calls.filter(call=>call.url.includes('save_fas_import_artifact')).length,1);
});

test('an existing cloud answer causes a non-destructive skip',async()=>{
  const imports=require('../assets/js/local-import.js'),project={id:'local-default',answers:answers()},storage=memoryStorage(project),calls=[];
  const fetchImpl=async(url,init={})=>{calls.push(url);if(url.includes('begin_fas_local_import'))return response({importId:'import-1',status:'started',answerMap:{}});if(url.includes('/answers?'))return response([{id:'existing'}]);throw new Error('must not import');};
  const importer=imports.create(options(storage,fetchImpl)),result=await importer.run(await importer.inspect());
  assert.deepEqual(result,{status:'skipped',reason:'cloud_has_answers'});assert.deepEqual(JSON.parse(storage.getItem('fas.project.local-default')),project);assert.equal(calls.some(url=>url.includes('import_fas_local_answers')),false);
});

test('failed answer, synthesis, artifact, or status work preserves the recoverable local payload',async()=>{
  const imports=require('../assets/js/local-import.js');
  for(const failAt of ['answers','synthesis','artifact','status']){
    const project={id:'local-default',answers:answers()},storage=memoryStorage(project),ids=Object.fromEntries(answers().map(answer=>[answer.agentKey+':'+answer.id,'cloud-'+answer.id]));
    const fetchImpl=async(url,init={})=>{const body=init.body&&JSON.parse(init.body);if(url.includes('begin_fas_local_import'))return response({importId:'import-1',status:'started',answerMap:{}});if(url.includes('/answers?'))return response([]);if(url.includes('import_fas_local_answers')){if(failAt==='answers')throw new Error('answer failure');return response({importId:'import-1',status:'answers_imported',answerMap:ids});}if(url.includes('save_fas_import_artifact')){if(failAt==='artifact')throw new Error('artifact failure');return response({importId:'import-1',status:'artifact_saved',answerMap:ids});}if(url.includes('update_fas_local_import')){if(failAt==='status'&&body.p_status==='complete')throw new Error('status failure');return response({importId:'import-1',status:body.p_status,answerMap:ids});}throw new Error('unexpected '+url);};
    const anchorUpgrade={rebuild:async()=>{if(failAt==='synthesis')throw new Error('synthesis failure');return{id:'anchor',agentKey:'anchor',type:'trusted_expert_statement',title:'Trusted Expert Blueprint',sections:[]};}};
    const importer=imports.create(options(storage,fetchImpl,{anchorUpgrade}));
    const candidate=await importer.inspect();await assert.rejects(()=>importer.run(candidate));
    const saved=JSON.parse(storage.getItem('fas.project.local-default'));assert.equal(saved.answers.length,7,failAt);assert.equal(saved.migration,undefined,failAt);
  }
});

test('agent-scoped identities prevent identical engine answer IDs from colliding',async()=>{
  const imports=require('../assets/js/local-import.js'),storage=memoryStorage({answers:[{id:'answer-1',agentKey:'anchor',field:'anchor.authority',text:'Anchor'},{id:'answer-1',agentKey:'extract',field:'extract.context',text:'Extract'}]}),importer=imports.create(options(storage,async()=>response([]))),candidate=await importer.inspect();
  assert.deepEqual(candidate.answers.map(answer=>answer.localId).sort(),['anchor:answer-1','extract:answer-1']);
});

test('failed preflight rechecks cloud collisions before any retry import',async()=>{
  const imports=require('../assets/js/local-import.js'),storage=memoryStorage({answers:answers()}),calls=[];let begins=0;
  const fetchImpl=async(url)=>{calls.push(url);if(url.includes('begin_fas_local_import'))return response({importId:'import-1',status:begins++?'failed':'started',answerMap:{}});if(url.includes('/answers?')){if(begins===1)throw new Error('temporary preflight failure');return response([{id:'existing'}]);}if(url.includes('update_fas_local_import'))return response({importId:'import-1',status:'failed',answerMap:{}});throw new Error('must not import');};
  const importer=imports.create(options(storage,fetchImpl)),candidate=await importer.inspect();await assert.rejects(()=>importer.run(candidate));const result=await importer.run(candidate);assert.equal(result.status,'skipped');assert.equal(calls.some(url=>url.includes('import_fas_local_answers')),false);
});

test('lost import-artifact response resumes from durable artifact_saved without another version',async()=>{
  const imports=require('../assets/js/local-import.js'),storage=memoryStorage({answers:answers()}),ids=Object.fromEntries(answers().map(answer=>[answer.agentKey+':'+answer.id,'cloud-'+answer.id]));let stage='answers_imported',artifactCalls=0;
  const fetchImpl=async(url,init={})=>{const body=init.body&&JSON.parse(init.body);if(url.includes('begin_fas_local_import'))return response({importId:'import-1',status:stage,answerMap:ids});if(url.includes('save_fas_import_artifact')){artifactCalls++;stage='artifact_saved';throw new Error('response lost');}if(url.includes('update_fas_local_import')){stage=body.p_status;return response({importId:'import-1',status:stage,answerMap:ids,completedAt:'now'});}throw new Error('unexpected '+url);};
  const importer=imports.create(options(storage,fetchImpl)),candidate=await importer.inspect();await assert.rejects(()=>importer.run(candidate));const result=await importer.run(candidate);assert.equal(result.status,'complete');assert.equal(artifactCalls,1);
});
