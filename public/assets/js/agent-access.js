(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.agentAccess=api;api.mount(root);}})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  var ALL=['anchor','extract','radar','forge','architect','voice','launch'],INCLUDED=['anchor','extract'],current=INCLUDED.slice();
  function clean(value){return typeof value==='string'?value.trim().toLowerCase():'';}
  function normalize(value){var source=Array.isArray(value)?value:Array.isArray(value&&value.list_fas_agent_access)?value.list_fas_agent_access:[],seen={};source.forEach(function(item){var key=clean(item);if(ALL.indexOf(key)>=0)seen[key]=true;});INCLUDED.forEach(function(key){seen[key]=true;});return ALL.filter(function(key){return seen[key];});}
  function setAccess(value){current=normalize(value);return current.slice();}
  function getAccess(){return current.slice();}
  function isAllowed(agentKey){return current.indexOf(clean(agentKey))>=0;}
  function pageName(pathname){return String(pathname||'').replace(/\\/g,'/').split('/').pop()||'index.html';}
  function guardRoute(options){options=options||{};var location=options.location||{},allowed=normalize(options.access||current),page=pageName(location.pathname),params=new URLSearchParams(location.search||''),agent='';
    if(page==='launch.html')agent='launch';
    else if(page==='chat.html')agent=clean(params.get('agent')||'extract');
    else if(page==='review.html')agent=clean(params.get('asset')||params.get('agent')||'extract');
    if(agent&&allowed.indexOf(agent)<0)return{allowed:false,destination:'index.html?access=locked'};
    return{allowed:true};
  }
  function requiredAgent(node){if(!node||!node.getAttribute)return'';var explicit=clean(node.getAttribute('data-requires-agent')),link=clean(node.getAttribute('data-agent-link')),nav=clean(node.getAttribute('data-nav')),id=clean(node.id);if(explicit)return explicit;if(link)return link;if(nav==='launch')return'launch';var match=id.match(/^(?:tab|panel)-(anchor|extract|radar|forge|architect|voice|launch)$/);return match?match[1]:'';}
  function load(options){options=options||{};var ready=options.authReady||Promise.resolve({mode:'local'}),auth=options.auth,fetchImpl=options.fetchImpl;
    return Promise.resolve(ready).then(function(state){
      if(!state||state.mode!=='supabase'||!auth||!auth.requireSession||!auth.supabaseUrl||!auth.publishableKey||!fetchImpl)return setAccess(INCLUDED);
      return auth.requireSession().then(function(session){return fetchImpl(auth.supabaseUrl+'/rest/v1/rpc/list_fas_agent_access',{method:'POST',headers:{apikey:auth.publishableKey,Authorization:'Bearer '+session.accessToken,'Content-Type':'application/json',Accept:'application/json'},body:'{}'});}).then(function(response){if(!response.ok)throw new Error('Access unavailable');return response.json();}).then(setAccess).catch(function(){return setAccess(INCLUDED);});
    }).catch(function(){return setAccess(INCLUDED);});
  }
  function applyVisibility(doc,access,location){if(!doc)return;var allowed=normalize(access),count=allowed.length;
    Array.prototype.forEach.call(doc.querySelectorAll('[data-requires-agent], [data-agent-link], [data-nav="launch"], .vault-tab[id^="tab-"], .vault-asset[id^="panel-"]'),function(node){var agent=requiredAgent(node);if(agent)node.hidden=allowed.indexOf(agent)<0;});
    Array.prototype.forEach.call(doc.querySelectorAll('[data-access-count], [data-agent-total]'),function(node){node.textContent=String(count);});
    Array.prototype.forEach.call(doc.querySelectorAll('[data-access-progress]'),function(node){node.setAttribute('aria-label','Step 2 of '+count);node.setAttribute('aria-valuemax',String(count));});
    if(location&&new URLSearchParams(location.search||'').get('access')==='locked'){var notice=doc.querySelector('[data-access-notice]');if(notice)notice.hidden=false;}
    if(doc.documentElement&&doc.documentElement.classList)doc.documentElement.classList.add('fas-access-ready');
  }
  function mount(root){var FAS=root.FAS=root.FAS||{};var ready=Promise.resolve(FAS.authReady||{mode:'local'}).then(function(state){return load({authReady:Promise.resolve(state),auth:FAS.auth,fetchImpl:root.fetch&&root.fetch.bind(root)});});
    FAS.agentAccessReady=ready.then(function(access){applyVisibility(root.document,access,root.location);var decision=guardRoute({location:root.location,access:access});if(!decision.allowed&&root.location&&root.location.assign)root.location.assign(decision.destination);return{access:access,allowed:decision.allowed,destination:decision.destination};});
    return FAS.agentAccessReady;
  }
  return{isAllowed:isAllowed,getAccess:getAccess,guardRoute:guardRoute,load:load,requiredAgent:requiredAgent,applyVisibility:applyVisibility,mount:mount,ALL:ALL.slice(),INCLUDED:INCLUDED.slice()};
});
