(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.anchorArtifactUpgrade=api;}})(typeof window!=='undefined'?window:null,function(){
  'use strict';

  var fieldsByAgent={anchor:['authority','arena','evidence','position','boundaries','activation'],extract:['context','diagnostic','origin','timeline','method','proof','point_of_view','boundaries','synthesis']};
  var requiredFields=fieldsByAgent.anchor.map(function(field){return'anchor.'+field;});

  function answerText(answer){
    if(typeof answer.text==='string')return answer.text;
    if(typeof answer.value==='string')return answer.value;
    return answer.value&&typeof answer.value.text==='string'?answer.value.text:'';
  }

  function collectAnswers(project,agentKey){
    agentKey=agentKey||'anchor';var fields=(fieldsByAgent[agentKey]||[]).map(function(field){return agentKey+'.'+field;});
    var latest={};
    (project&&project.answers||[]).forEach(function(answer){
      var answerAgent=answer.agentKey||answer.agent_key,field=answer.field||answer.field_path,text=answerText(answer).trim(),permissionStatus=answer.permissionStatus||answer.permission_status||'not_required';
      if(agentKey===answerAgent&&fields.indexOf(field)>=0&&text&&!answer.incomplete&&permissionStatus!=='private'&&permissionStatus!=='pending')latest[field]={id:answer.id,field:field,text:text,basis:answer.basis||'user',permissionStatus:permissionStatus};
    });
    if(!fields.every(function(field){return latest[field];}))return null;
    return fields.map(function(field){return latest[field];});
  }

  function needsUpgrade(agentKey,selected,project){
    return Boolean(fieldsByAgent[agentKey])&&Boolean(selected)&&Array.isArray(selected.sections)&&selected.sections.length>0&&!selected.premiumReport&&Boolean(collectAnswers(project,agentKey));
  }

  function requestSynthesis(agentKey,answers,fetchImpl){
    var send=fetchImpl||(typeof fetch!=='undefined'?fetch:null);
    if(!send)return Promise.reject(new Error('Synthesis unavailable'));
    return send('/api/artifact-synthesis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agentKey:agentKey,answers:answers})}).then(function(response){
      if(!response||!response.ok)throw new Error('Synthesis unavailable');
      return response.json();
    });
  }

  async function rebuild(options){
    var agentKey=options.agentKey||'anchor',answers=collectAnswers(options.project,agentKey);if(!answers)throw new Error(agentKey==='anchor'?'Six complete Anchor answers are required.':'Complete EXTRACT answers are required.');
    var artifact=options.artifacts.build(agentKey,Object.assign({},options.project,{answers:answers}));
    try{var payload=await requestSynthesis(agentKey,answers,options.fetchImpl);artifact=options.artifacts.applySynthesis(artifact,payload.sections);}
    catch(error){if(options.strictSynthesis)throw error;}
    return artifact;
  }

  async function upgrade(options){
    var agentKey=options.agentKey,project=options.project,selected=options.selected;
    if(!needsUpgrade(agentKey,selected,project))return{upgraded:false,artifact:selected,reason:'not-eligible'};
    var artifact=await rebuild({agentKey:agentKey,project:project,artifacts:options.artifacts,fetchImpl:options.fetchImpl});
    artifact.id=selected.id||artifact.id;
    artifact.exportTheme=selected.exportTheme;
    await options.saveVersion(selected.artifactId||selected.id,Number(selected.version)||1,artifact);
    return{upgraded:true,artifact:artifact,reason:'saved'};
  }

  function selectLatest(project,agentKey){
    var versions=(project&&project.artifactVersions||[]).filter(function(version){return version.agentKey===agentKey||version.artifactId&&version.artifactId.indexOf(agentKey)>=0;});
    return{project:project,versions:versions,selected:versions[versions.length-1]};
  }

  async function loadReview(options){
    var notify=typeof options.onState==='function'?options.onState:function(){},current=selectLatest(await options.store.loadProject(),options.agentKey);
    if(!current.selected){var empty=Object.assign({status:'empty'},current);notify(empty);return empty;}
    if(options.isReview&&needsUpgrade(options.agentKey,current.selected,current.project)){
      notify(Object.assign({status:'upgrading'},current));
      try{
        await upgrade({agentKey:options.agentKey,project:current.project,selected:current.selected,artifacts:options.artifacts,fetchImpl:options.fetchImpl,saveVersion:function(artifactId,expectedVersion,artifact){return options.store.saveArtifactVersion(artifactId,expectedVersion,artifact);}});
        current=selectLatest(await options.store.loadProject(),options.agentKey);
      }catch(error){
        var failed=Object.assign({status:'error',error:error,retry:function(){return loadReview(options);}},current);notify(failed);return failed;
      }
    }
    var ready=Object.assign({status:'ready'},current);notify(ready);return ready;
  }

  return{requiredFields:requiredFields.slice(),collectAnswers:collectAnswers,needsUpgrade:needsUpgrade,requestSynthesis:requestSynthesis,rebuild:rebuild,upgrade:upgrade,selectLatest:selectLatest,loadReview:loadReview};
});
