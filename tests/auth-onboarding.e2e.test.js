'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
require('dotenv').config();

const env={url:process.env.SUPABASE_URL,key:process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY,email:process.env.FAS_E2E_EMAIL,password:process.env.FAS_E2E_PASSWORD};
const enabled=process.env.FAS_RUN_SUPABASE_E2E==='1'&&Object.values(env).every(Boolean);

test('live Supabase onboarding is idempotent and durable',{skip:!enabled},async()=>{
  async function call(url,init={}){const response=await fetch(env.url.replace(/\/$/,'')+url,init);if(!response.ok)throw new Error('Live Supabase request failed with status '+response.status);return response.json();}
  const session=await call('/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:env.key,'Content-Type':'application/json'},body:JSON.stringify({email:env.email,password:env.password})});
  const headers={apikey:env.key,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'};
  const rpc=(name,body)=>call('/rest/v1/rpc/'+name,{method:'POST',headers,body:JSON.stringify(body)});
  const first=await rpc('bootstrap_fas_account',{p_display_name:'FAS E2E',p_project_name:'FAS E2E Project'}),second=await rpc('bootstrap_fas_account',{p_display_name:'FAS E2E',p_project_name:'FAS E2E Project'});assert.deepEqual(second,first);
  const suffix=Date.now()+'-'+crypto.randomBytes(6).toString('hex'),checksum=crypto.createHash('sha256').update('fas-e2e-'+suffix).digest('hex'),fields=['authority','arena','evidence','position','boundaries','activation'];
  const begun=await rpc('begin_fas_local_import',{p_project_id:first.projectId,p_payload_checksum:checksum});
  const imported=await rpc('import_fas_local_answers',{p_import_id:begun.importId,p_answers:fields.map((field,index)=>({localId:'e2e-'+suffix+'-'+field,clientRef:'local:'+checksum+':e2e-'+field,sessionId:first.sessions.anchor,agentKey:'anchor',field:'anchor.'+field,text:'E2E '+field+' evidence '+suffix,basis:'import',permissionStatus:'not_required',createdAt:new Date(Date.now()+index).toISOString()}))});
  const artifactType='e2e_anchor_'+suffix.replace(/-/g,'_'),saved=await rpc('save_fas_artifact',{p_project_id:first.projectId,p_agent_key:'anchor',p_content:{agentKey:'anchor',type:artifactType,title:'FAS E2E Anchor Blueprint',sections:[{title:'Verification',blocks:[{kind:'evidence',text:'Durable E2E artifact.'}]}],sources:Object.values(imported.answerMap).map(id=>({id,field:'anchor.e2e',basis:'user'}))},p_expected_version:null});
  await rpc('update_fas_local_import',{p_import_id:begun.importId,p_status:'artifact_saved',p_answer_map:imported.answerMap,p_error_code:null});await rpc('update_fas_local_import',{p_import_id:begun.importId,p_status:'complete',p_answer_map:imported.answerMap,p_error_code:null});
  const answerRows=await call('/rest/v1/answers?project_id=eq.'+first.projectId+'&client_ref=like.local%3A'+checksum+'%3A%25&select=id',{headers});assert.equal(answerRows.length,6);
  const artifactRows=await call('/rest/v1/artifacts?id=eq.'+saved.id+'&project_id=eq.'+first.projectId+'&select=id,current_version',{headers});assert.equal(artifactRows.length,1);assert.equal(artifactRows[0].current_version,1);
  const versions=await call('/rest/v1/artifact_versions?artifact_id=eq.'+saved.id+'&select=id,version',{headers});assert.equal(versions.length,1);assert.equal(versions[0].version,1);
});
