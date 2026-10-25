(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.accountContext=api;}})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  var CONTEXT_KEY='fas.supabase.context',AGENTS=['anchor','extract','radar','forge','architect','voice','launch'],PAGES=['index.html','chat.html','review.html','vault.html','launch.html'];
  function text(value){return typeof value==='string'?value.trim():'';}
  function validContext(value){return Boolean(value&&text(value.workspaceId)&&text(value.projectId)&&value.sessions&&AGENTS.every(function(key){return text(value.sessions[key]);}));}
  function normalize(value){var sessions={};AGENTS.forEach(function(key){sessions[key]=text(value.sessions[key]);});return{workspaceId:text(value.workspaceId),projectId:text(value.projectId),sessions:sessions};}
  function create(options){
    options=options||{};var auth=options.auth,storage=options.storage||(typeof localStorage!=='undefined'?localStorage:null),fetchImpl=options.fetchImpl||(typeof fetch!=='undefined'?fetch:null);
    if(!auth||!auth.supabaseUrl||!auth.publishableKey||!auth.requireSession||!fetchImpl)throw new Error('Account context is not configured.');
    function clear(){if(storage)storage.removeItem(CONTEXT_KEY);}
    function load(){try{var value=storage&&JSON.parse(storage.getItem(CONTEXT_KEY)||'null');if(!validContext(value)){clear();return null;}return normalize(value);}catch(_){clear();return null;}}
    function save(value){if(!validContext(value))throw new Error('FAS requires seven agent sessions.');var result=normalize(value);if(storage)storage.setItem(CONTEXT_KEY,JSON.stringify(result));return result;}
    function bootstrap(input){
      input=input||{};var displayName=text(input.displayName),projectName=text(input.projectName)||'My Authority Project';
      return auth.requireSession().then(function(session){return fetchImpl(auth.supabaseUrl+'/rest/v1/rpc/bootstrap_fas_account',{method:'POST',headers:{apikey:auth.publishableKey,Authorization:'Bearer '+session.accessToken,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({p_display_name:displayName,p_project_name:projectName})});}).then(function(response){return Promise.resolve(response.json()).catch(function(){return{};}).then(function(payload){if(!response.ok)throw new Error('Your FAS workspace could not be prepared.');return Array.isArray(payload)?payload[0]:payload;});}).then(save);
    }
    function sessionFor(agentKey){var current=load();return current&&current.sessions[text(agentKey)]||null;}
    function safeReturnPath(value){
      var raw=text(value);if(!raw)return'index.html';
      try{decodeURIComponent(raw);}catch(_){return'index.html';}
      if(raw.indexOf('\\')>=0||/^\/\//.test(raw)||/^[a-z][a-z0-9+.-]*:/i.test(raw))return'index.html';
      try{var url=new URL(raw,'https://fas.local/'),page=url.pathname.replace(/^\/+/, '');if(url.origin!=='https://fas.local'||PAGES.indexOf(page)<0)return'index.html';return page+url.search+url.hash;}catch(_){return'index.html';}
    }
    function agentUrl(page,agentKey){var current=load(),safePage=PAGES.indexOf(page)>=0?page:'index.html',key=text(agentKey);if(!current||!current.sessions[key])return safePage;var params=new URLSearchParams();params.set(safePage==='review.html'?'asset':'agent',key);params.set('project',current.projectId);params.set('session',current.sessions[key]);return safePage+'?'+params.toString();}
    return{bootstrap:bootstrap,load:load,clear:clear,sessionFor:sessionFor,agentUrl:agentUrl,safeReturnPath:safeReturnPath};
  }
  return{create:create,CONTEXT_KEY:CONTEXT_KEY,AGENTS:AGENTS.slice()};
});
