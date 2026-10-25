(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.anchorArtifactUpgrade=api;}})(typeof window!=='undefined'?window:null,function(){
  'use strict';

  var requiredFields=['anchor.authority','anchor.arena','anchor.evidence','anchor.position','anchor.boundaries','anchor.activation'];

  function answerText(answer){
    if(typeof answer.text==='string')return answer.text;
    if(typeof answer.value==='string')return answer.value;
    return answer.value&&typeof answer.value.text==='string'?answer.value.text:'';
  }

  function collectAnswers(project){
    var latest={};
    (project&&project.answers||[]).forEach(function(answer){
      var agentKey=answer.agentKey||answer.agent_key,field=answer.field||answer.field_path,text=answerText(answer).trim();
      if(agentKey==='anchor'&&requiredFields.indexOf(field)>=0&&text&&!answer.incomplete)latest[field]={id:answer.id,field:field,text:text};
    });
    if(!requiredFields.every(function(field){return latest[field];}))return null;
    return requiredFields.map(function(field){return latest[field];});
  }

  function needsUpgrade(agentKey,selected,project){
    return agentKey==='anchor'&&Boolean(selected)&&Array.isArray(selected.sections)&&selected.sections.length>0&&!selected.premiumReport&&Boolean(collectAnswers(project));
  }

  function requestSynthesis(answers,fetchImpl){
    var send=fetchImpl||(typeof fetch!=='undefined'?fetch:null);
    if(!send)return Promise.reject(new Error('Synthesis unavailable'));
    return send('/api/artifact-synthesis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agentKey:'anchor',answers:answers})}).then(function(response){
      if(!response||!response.ok)throw new Error('Synthesis unavailable');
      return response.json();
    });
  }

  async function upgrade(options){
    var agentKey=options.agentKey,project=options.project,selected=options.selected;
    if(!needsUpgrade(agentKey,selected,project))return{upgraded:false,artifact:selected,reason:'not-eligible'};
    var answers=collectAnswers(project),buildProject=Object.assign({},project,{answers:answers}),artifact=options.artifacts.build('anchor',buildProject);
    artifact.id=selected.id||artifact.id;
    artifact.exportTheme=selected.exportTheme;
    try{
      var payload=await requestSynthesis(answers,options.fetchImpl);
      artifact=options.artifacts.applySynthesis(artifact,payload.sections);
    }catch(_){
      // The grounded deterministic report produced by artifacts.build is the safe fallback.
    }
    await options.saveVersion(selected.artifactId||selected.id,Number(selected.version)||1,artifact);
    return{upgraded:true,artifact:artifact,reason:'saved'};
  }

  return{requiredFields:requiredFields.slice(),collectAnswers:collectAnswers,needsUpgrade:needsUpgrade,requestSynthesis:requestSynthesis,upgrade:upgrade};
});
