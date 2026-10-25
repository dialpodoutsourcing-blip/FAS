(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.localImport=api;}})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  var storageKey='fas.project.local-default';
  function clean(value){return typeof value==='string'?value.trim():'';}
  function answerText(answer){if(typeof answer.text==='string')return answer.text;if(typeof answer.value==='string')return answer.value;return answer.value&&typeof answer.value.text==='string'?answer.value.text:'';}
  function canonicalAnswers(project){return(project&&project.answers||[]).map(function(answer,index){return{localId:clean(answer.id)||('answer-'+(index+1)),agentKey:clean(answer.agentKey||answer.agent_key),field:clean(answer.field||answer.field_path),text:clean(answerText(answer)),basis:clean(answer.basis)||'import',permissionStatus:clean(answer.permissionStatus||answer.permission_status)||'not_required',supersedesLocalId:clean(answer.supersedesId||answer.supersedes_id),createdAt:clean(answer.createdAt||answer.created_at)};}).filter(function(answer){return answer.agentKey&&answer.field&&answer.text;}).sort(function(a,b){return(a.createdAt||'').localeCompare(b.createdAt||'')||a.localId.localeCompare(b.localId);});}
  async function sha256(value){
    var bytes=new TextEncoder().encode(value),cryptoObject=typeof crypto!=='undefined'?crypto:null;
    if(cryptoObject&&cryptoObject.subtle){var digest=await cryptoObject.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest)).map(function(byte){return byte.toString(16).padStart(2,'0');}).join('');}
    if(typeof require==='function')return require('node:crypto').createHash('sha256').update(value).digest('hex');
    throw new Error('SHA-256 is unavailable.');
  }
  function create(options){
    options=options||{};var storage=options.storage||(typeof localStorage!=='undefined'?localStorage:null),context=options.context||{},auth=options.auth||{},fetchImpl=options.fetchImpl||(typeof fetch!=='undefined'?fetch:null),base=clean(options.supabaseUrl).replace(/\/$/,'')+'/rest/v1/',publishableKey=clean(options.publishableKey),anchorUpgrade=options.anchorUpgrade||null,artifacts=options.artifacts||null,checksumFn=options.checksum||sha256;
    function read(){if(!storage)return null;try{return JSON.parse(storage.getItem(storageKey))||null;}catch(_){return null;}}
    function write(project){if(storage)storage.setItem(storageKey,JSON.stringify(project));}
    async function inspect(){var project=read(),answers=canonicalAnswers(project);if(!project||!answers.length)return null;var checksum=await checksumFn(JSON.stringify(answers)),marker=project.migration&&project.migration.supabase;if(marker&&marker.projectId===context.projectId&&marker.checksum===checksum&&marker.completedAt)return null;return{project:project,answers:answers,checksum:checksum,projectId:context.projectId};}
    async function request(path,body,method){
      if(!fetchImpl||!base||!publishableKey)throw new Error('Cloud import is not configured.');
      var session=auth.requireSession?await auth.requireSession():auth.getSession&&auth.getSession();if(!session||!session.accessToken)throw new Error('Authenticated session is required.');
      var init={method:method||'POST',headers:{apikey:publishableKey,Authorization:'Bearer '+session.accessToken,'Content-Type':'application/json'}};if(body!==undefined)init.body=JSON.stringify(body);
      var response=await fetchImpl(base+path,init);if(!response||!response.ok)throw new Error('Cloud import request failed.');return response.json();
    }
    function rpc(name,body){return request('rpc/'+name,body,'POST');}
    function payload(candidate){return candidate.answers.map(function(answer){return Object.assign({},answer,{sessionId:context.sessions&&context.sessions[answer.agentKey],clientRef:'local:'+candidate.checksum+':'+answer.localId});});}
    function cloudProject(candidate,map){return Object.assign({},candidate.project,{id:context.projectId,answers:candidate.answers.map(function(answer){return{id:map[answer.localId]||answer.localId,agentKey:answer.agentKey,field:answer.field,text:answer.text,basis:answer.basis,permissionStatus:answer.permissionStatus,createdAt:answer.createdAt};})});}
    function hasCompleteAnchor(candidate){var fields={};candidate.answers.forEach(function(answer){if(answer.agentKey==='anchor')fields[answer.field]=answer.text;});return['anchor.authority','anchor.arena','anchor.evidence','anchor.position','anchor.boundaries','anchor.activation'].every(function(field){return Boolean(fields[field]);});}
    function markComplete(candidate,remote){var project=read()||candidate.project;project.migration=Object.assign({},project.migration,{supabase:{importId:remote.importId,projectId:context.projectId,checksum:candidate.checksum,completedAt:remote.completedAt||new Date().toISOString()}});write(project);}
    async function run(candidate){
      if(!candidate)return{status:'empty'};var remote;
      try{
        remote=await rpc('begin_fas_local_import',{p_project_id:context.projectId,p_payload_checksum:candidate.checksum});
        if(remote.status==='complete'){markComplete(candidate,remote);return remote;}
        if(remote.status==='started'&&(!remote.answerMap||!Object.keys(remote.answerMap).length)){
          var existing=await request('answers?project_id=eq.'+encodeURIComponent(context.projectId)+'&select=id&limit=1',undefined,'GET');
          if(existing.length)return{status:'skipped',reason:'cloud_has_answers'};
        }
        if(remote.status!=='answers_imported'&&remote.status!=='artifact_saved')remote=await rpc('import_fas_local_answers',{p_import_id:remote.importId,p_answers:payload(candidate)});
        if(remote.status==='answers_imported'){
          if(hasCompleteAnchor(candidate)){
            if(!anchorUpgrade||typeof anchorUpgrade.rebuild!=='function')throw new Error('Anchor rebuild is unavailable.');
            var artifact=await anchorUpgrade.rebuild({project:cloudProject(candidate,remote.answerMap||{}),artifacts:artifacts,fetchImpl:options.synthesisFetch||fetchImpl,strictSynthesis:true});
            await rpc('save_fas_artifact',{p_project_id:context.projectId,p_agent_key:'anchor',p_content:artifact,p_expected_version:null});
          }
          remote=await rpc('update_fas_local_import',{p_import_id:remote.importId,p_status:'artifact_saved',p_answer_map:remote.answerMap||{},p_error_code:null});
        }
        if(remote.status==='artifact_saved')remote=await rpc('update_fas_local_import',{p_import_id:remote.importId,p_status:'complete',p_answer_map:remote.answerMap||{},p_error_code:null});
        if(remote.status!=='complete')throw new Error('Cloud import did not complete.');markComplete(candidate,remote);return remote;
      }catch(error){if(remote&&remote.importId){try{await rpc('update_fas_local_import',{p_import_id:remote.importId,p_status:'failed',p_answer_map:remote.answerMap||{},p_error_code:'import_failed'});}catch(_){}}throw error;}
    }
    return{inspect:inspect,run:run};
  }
  return{create:create,canonicalAnswers:canonicalAnswers,sha256:sha256};
});
