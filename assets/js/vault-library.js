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
    var artifacts=Array.isArray(project&&project.artifacts)?project.artifacts:[],versions=Array.isArray(project&&project.artifactVersions)?project.artifactVersions:[],order=Array.isArray(agentOrder)?agentOrder:[],byKey={},byArtifact={};
    versions.forEach(function(version){var artifactId=version&&version.artifactId||version&&version.artifact_id,number=Number(version&&version.version);if(artifactId&&Number.isFinite(number))byKey[artifactId+':'+number]=version;});
    artifacts.forEach(function(artifact){if(artifact&&artifact.id)byArtifact[artifact.id]=artifact;});
    return Object.keys(byArtifact).map(function(id){var artifact=byArtifact[id];
      var id=artifact&&artifact.id,current=Number(artifact&&artifact.currentVersion||artifact&&artifact.current_version),version=id&&Number.isFinite(current)?byKey[id+':'+current]:null,sections=version&&version.sections;
      if(!version||!Array.isArray(sections)||!sections.length)return null;
      var agentKey=version.agentKey||version.agent_key||artifact.agentKey||artifact.agent_key||'',title=text(version.title)||text(artifact.title)||'Completed document';
      return Object.freeze({artifact:artifact,version:version,agentKey:agentKey,title:title,statusLabel:version.status==='user_approved'?'Approved':'Completed',summary:summary(version)});
    }).filter(Boolean).sort(function(a,b){var ai=order.indexOf(a.agentKey),bi=order.indexOf(b.agentKey);ai=ai<0?Number.MAX_SAFE_INTEGER:ai;bi=bi<0?Number.MAX_SAFE_INTEGER:bi;return ai-bi||a.title.localeCompare(b.title);});
  }

  function createExportGate(){
    var pending={};
    return{run:function(key,task){if(pending[key])return pending[key];var started;try{started=Promise.resolve(task());}catch(error){started=Promise.reject(error);}pending[key]=started.finally(function(){delete pending[key];});return pending[key];}};
  }

  function createExportCache(storage){
    var completed={},pending={};
    return{get:function(key,task){
      if(Object.prototype.hasOwnProperty.call(completed,key))return Promise.resolve(completed[key]);
      if(pending[key])return pending[key];
      var stored;
      try{stored=storage&&storage.read?Promise.resolve(storage.read(key)):Promise.resolve(null);}catch(error){stored=Promise.resolve(null);}
      pending[key]=stored.catch(function(){return null;}).then(function(value){
        if(value!==null&&value!==undefined){completed[key]=value;return value;}
        return Promise.resolve().then(task).then(function(generated){completed[key]=generated;if(storage&&storage.write)return Promise.resolve(storage.write(key,generated)).catch(function(){}).then(function(){return generated;});return generated;});
      }).finally(function(){delete pending[key];});
      return pending[key];
    }};
  }

  function normalizeView(value){return value==='list'?'list':'cards';}
  function getStorage(host,key){try{return host&&host[key]||null;}catch(error){return null;}}
  function createViewPreference(storage,key){
    return{
      load:function(){try{return normalizeView(storage&&storage.getItem(key));}catch(error){return'cards';}},
      save:function(view){var normalized=normalizeView(view);try{if(storage)storage.setItem(key,normalized);}catch(error){}return normalized;}
    };
  }

  return{buildItems:buildItems,createExportGate:createExportGate,createExportCache:createExportCache,normalizeView:normalizeView,getStorage:getStorage,createViewPreference:createViewPreference};
});
