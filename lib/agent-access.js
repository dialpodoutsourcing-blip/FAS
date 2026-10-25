'use strict';

const KNOWN_AGENTS=new Set(['anchor','extract','radar','forge','architect','voice','launch']);
const FREE_AGENTS=new Set(['anchor','extract']);

function normalizeAgentKey(value){return String(value||'').trim().toLowerCase();}
function isFreeAgent(agentKey){return FREE_AGENTS.has(normalizeAgentKey(agentKey));}

async function authorizeAgentAccess({agentKey,token,supabaseUrl,publishableKey,fetchImpl=globalThis.fetch}={}){
 const key=normalizeAgentKey(agentKey);
 if(!KNOWN_AGENTS.has(key))return false;
 if(FREE_AGENTS.has(key))return true;
 if(!token||!supabaseUrl||!publishableKey||typeof fetchImpl!=='function')return false;
 try{
  const response=await fetchImpl(String(supabaseUrl).replace(/\/$/,'')+'/rest/v1/rpc/has_fas_agent_access',{
   method:'POST',
   headers:{apikey:publishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},
   body:JSON.stringify({p_agent_key:key})
  });
  if(!response.ok)return false;
  const payload=await response.json();
  return payload===true||(payload&&payload.has_fas_agent_access===true);
 }catch(_){return false;}
}

module.exports={authorizeAgentAccess,isFreeAgent,normalizeAgentKey};
