(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.projectStore=api;}})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function blank(id){return{id:id,answers:[],checkpoints:{},artifacts:[],artifactVersions:[],facts:[],gaps:[],conflicts:[]};}
  function localStore(options){
    var storage=options.storage||(typeof localStorage!=='undefined'?localStorage:null),key='fas.project.'+options.projectId,state=blank(options.projectId);
    if(storage){try{state=JSON.parse(storage.getItem(key))||state;}catch(_){state=blank(options.projectId);}}
    function persist(){if(storage)storage.setItem(key,JSON.stringify(state));return clone(state);}
    return{mode:'local',loadAgentCatalog:function(){return Promise.resolve([]);},loadProject:function(){return Promise.resolve(clone(state));},resetAgent:function(agentKey){var removedIds=state.artifacts.filter(function(artifact){return artifact.agentKey===agentKey||artifact.agent_key===agentKey;}).map(function(artifact){return artifact.id;});state.answers=state.answers.filter(function(answer){return answer.agentKey!==agentKey&&answer.agent_key!==agentKey;});delete state.checkpoints[agentKey];state.artifacts=state.artifacts.filter(function(artifact){return artifact.agentKey!==agentKey&&artifact.agent_key!==agentKey;});state.artifactVersions=state.artifactVersions.filter(function(version){return version.agentKey!==agentKey&&version.agent_key!==agentKey&&removedIds.indexOf(version.artifactId)<0;});persist();return Promise.resolve();},saveAnswer:function(answer){state.answers.push(Object.assign({id:'answer-'+Date.now(),createdAt:new Date().toISOString(),status:'draft'},clone(answer)));persist();return Promise.resolve(clone(state.answers[state.answers.length-1]));},saveCheckpoint:function(checkpoint){state.checkpoints[checkpoint.agentKey]=clone(checkpoint);persist();return Promise.resolve(clone(checkpoint));},saveArtifact:function(artifact){var existing=state.artifacts.find(function(a){return a.id===artifact.id;}),version=(existing&&existing.currentVersion||0)+1;if(existing)Object.assign(existing,clone(artifact),{currentVersion:version,status:'draft'});else state.artifacts.push(Object.assign({},clone(artifact),{currentVersion:version,status:'draft'}));var snapshot=Object.assign({},clone(artifact),{artifactId:artifact.id,version:version,status:'draft'});state.artifactVersions.push(snapshot);persist();return Promise.resolve(clone(state.artifacts.find(function(a){return a.id===artifact.id;})));},approveArtifact:function(id){var artifact=state.artifacts.find(function(a){return a.id===id;});if(!artifact)return Promise.reject(new Error('Artifact not found'));artifact.status='user_approved';var version=state.artifactVersions.filter(function(v){return v.artifactId===id;}).pop();if(version)version.status='user_approved';persist();return Promise.resolve(clone(artifact));},listArtifacts:function(){return Promise.resolve(clone(state.artifacts));}};
  }
  function supabaseStore(options){
    var base=options.supabaseUrl.replace(/\/$/,'')+'/rest/v1/',headers={apikey:options.anonKey,Authorization:'Bearer '+options.accessToken,'Content-Type':'application/json',Prefer:'return=representation'},fetchImpl=options.fetchImpl||fetch;
    function request(path,init){return fetchImpl(base+path,Object.assign({headers:headers},init||{})).then(function(response){if(!response.ok)throw new Error('Supabase request failed');return response.json();});}
    function requireContext(){if(!options.userId||!options.sessionId)throw new Error('Authenticated user and interview session are required.');}
    function hydrateAnswer(row){return{id:row.id,agentKey:row.agent_key,field:row.field_path,text:typeof row.value==='string'?row.value:(row.value&&row.value.text)||'',basis:row.basis,permissionStatus:row.permission_status,supersedesId:row.supersedes_id};}
    return{
      mode:'supabase',
      loadAgentCatalog:function(){return Promise.all([
        request('agent_definitions?active=eq.true&select=key,name,version,definition'),
        request('agent_chapters?active=eq.true&select=id,agent_key,key,label,position,config&order=agent_key.asc,position.asc'),
        request('agent_questions?active=eq.true&select=id,chapter_id,field_path,prompt,position,required,config&order=chapter_id.asc,position.asc')
      ]).then(function(parts){
        var definitions=parts[0],chapterRows=parts[1],questionRows=parts[2],chapterById={},chaptersByAgent={};
        chapterRows.forEach(function(row){
          var chapter={id:row.key,label:row.label,position:row.position,config:row.config||{},questions:[]};
          chapterById[row.id]=chapter;
          chaptersByAgent[row.agent_key]=chaptersByAgent[row.agent_key]||[];
          chaptersByAgent[row.agent_key].push(chapter);
        });
        questionRows.forEach(function(row){
          var chapter=chapterById[row.chapter_id];
          if(chapter)chapter.questions.push(Object.assign({id:row.id,field:row.field_path,question:row.prompt,position:row.position,required:row.required},row.config||{}));
        });
        return definitions.map(function(row){return Object.assign({key:row.key,name:row.name,version:row.version,chapters:chaptersByAgent[row.key]||[]},row.definition||{});}).sort(function(a,b){return(a.step||0)-(b.step||0);});
      });},
      loadProject:function(){return request('projects?id=eq.'+encodeURIComponent(options.projectId)+'&select=*').then(function(rows){var project=rows[0];if(!project)return null;return Promise.all([request('answers?project_id=eq.'+encodeURIComponent(options.projectId)+'&select=*'),request('interview_sessions?project_id=eq.'+encodeURIComponent(options.projectId)+'&select=*'),request('artifacts?project_id=eq.'+encodeURIComponent(options.projectId)+'&select=*')]).then(function(parts){project.answers=parts[0].map(hydrateAnswer);project.checkpoints={};parts[1].forEach(function(session){project.checkpoints[session.agent_key]=session.checkpoint||session.state||{};});project.artifacts=parts[2];project.artifactVersions=[];return project;});});},
      resetAgent:function(agentKey){requireContext();return Promise.all([request('answers?project_id=eq.'+encodeURIComponent(options.projectId)+'&agent_key=eq.'+encodeURIComponent(agentKey),{method:'DELETE'}),request('artifacts?project_id=eq.'+encodeURIComponent(options.projectId)+'&agent_key=eq.'+encodeURIComponent(agentKey),{method:'DELETE'}),request('interview_sessions?id=eq.'+encodeURIComponent(options.sessionId),{method:'PATCH',body:JSON.stringify({checkpoint:{},state:{}})})]).then(function(){});},
      saveAnswer:function(answer){requireContext();var row={session_id:options.sessionId,project_id:options.projectId,agent_key:answer.agentKey,field_path:answer.field,value:{text:answer.text},basis:answer.basis||'user',permission_status:answer.permissionStatus||'not_required',supersedes_id:answer.supersedesId||null,created_by:options.userId};return request('answers',{method:'POST',body:JSON.stringify(row)}).then(function(rows){return hydrateAnswer(rows[0]);});},
      saveCheckpoint:function(checkpoint){requireContext();return request('interview_sessions?id=eq.'+encodeURIComponent(options.sessionId),{method:'PATCH',body:JSON.stringify({checkpoint:checkpoint,state:checkpoint})}).then(function(){return checkpoint;});},
      saveArtifact:function(artifact){requireContext();var row={project_id:options.projectId,agent_key:artifact.agentKey,artifact_type:artifact.type,title:artifact.title,current_version:artifact.version||1,status:'draft',created_by:options.userId};return request('artifacts',{method:'POST',body:JSON.stringify(row)}).then(function(rows){var saved=rows[0];return request('artifact_versions',{method:'POST',body:JSON.stringify({artifact_id:saved.id,version:saved.current_version,content:artifact,input_snapshot:{source_ids:(artifact.sources||[]).map(function(source){return source.id;})},status:'draft',created_by:options.userId})}).then(function(){return saved;});});},
      approveArtifact:function(id){return request('artifacts?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:'user_approved'})}).then(function(rows){return rows[0];});},
      listArtifacts:function(){return request('artifacts?project_id=eq.'+encodeURIComponent(options.projectId)+'&select=*');}
    };
  }
  function create(options){options=options||{};if(!options.projectId)throw new Error('projectId is required');return options.supabaseUrl&&options.anonKey&&options.accessToken?supabaseStore(options):localStore(options);}
  return{create:create};
});
