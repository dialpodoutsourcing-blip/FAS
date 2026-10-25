'use strict';

function clean(value){return typeof value==='string'?value.trim():'';}
function validUrl(value){try{const url=new URL(value);return (url.protocol==='https:'||url.protocol==='http:')&&Boolean(url.hostname);}catch(_){return false;}}
function jwtRole(value){try{const parts=value.split('.');if(parts.length!==3)return'';return JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8')).role||'';}catch(_){return'';}}
function validPublicKey(value){return /^sb_publishable_[A-Za-z0-9_-]+$/.test(value)||jwtRole(value)==='anon';}

function buildRuntimeConfig(env={}){
  const supabaseUrl=clean(env.SUPABASE_URL).replace(/\/+$/,'');
  const supabasePublishableKey=clean(env.SUPABASE_PUBLISHABLE_KEY)||clean(env.SUPABASE_ANON_KEY);
  if(!validUrl(supabaseUrl)||!validPublicKey(supabasePublishableKey))return{supabaseUrl:'',supabasePublishableKey:'',configured:false};
  return{supabaseUrl,supabasePublishableKey,configured:true};
}

module.exports={buildRuntimeConfig};
