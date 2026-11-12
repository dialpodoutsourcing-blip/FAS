(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.vaultLibrary=api;}})(typeof window!=='undefined'?window:null,function(){
  'use strict';

  function text(value){return typeof value==='string'?value.trim():'';}
  function summary(version){
    var sections=Array.isArray(version&&version.sections)?version.sections:[];
    for(var i=0;i<sections.length;i++){
      var blocks=Array.isArray(sections[i]&&sections[i].blocks)?sections[i].blocks:[];
      for(var j=0;j<blocks.length;j++){
        var value=text(blocks[j]&&blocks[j].text);
        if(value&&blocks[j].kind!=='gap')return value;
      }
    }
    return 'Open this document to review the completed work.';
  }

  function buildItems(project,agentOrder){
    var artifacts=Array.isArray(project&&project.artifacts)?project.artifacts:[],versions=Array.isArray(project&&project.artifactVersions)?project.artifactVersions:[],order=Array.isArray(agentOrder)?agentOrder:[],byKey={};
    versions.forEach(function(version){var artifactId=version&&version.artifactId||version&&version.artifact_id,number=Number(version&&version.version);if(artifactId&&Number.isFinite(number))byKey[artifactId+':'+number]=version;});
    return artifacts.map(function(artifact){
      var id=artifact&&artifact.id,current=Number(artifact&&artifact.currentVersion||artifact&&artifact.current_version),version=id&&Number.isFinite(current)?byKey[id+':'+current]:null,sections=version&&version.sections;
      if(!version||!Array.isArray(sections)||!sections.length)return null;
      var agentKey=version.agentKey||version.agent_key||artifact.agentKey||artifact.agent_key||'',title=text(version.title)||text(artifact.title)||'Completed document';
      return Object.freeze({artifact:artifact,version:version,agentKey:agentKey,title:title,statusLabel:version.status==='user_approved'?'Approved':'Completed',summary:summary(version)});
    }).filter(Boolean).sort(function(a,b){var ai=order.indexOf(a.agentKey),bi=order.indexOf(b.agentKey);ai=ai<0?Number.MAX_SAFE_INTEGER:ai;bi=bi<0?Number.MAX_SAFE_INTEGER:bi;return ai-bi||a.title.localeCompare(b.title);});
  }

  return{buildItems:buildItems};
});
