'use strict';

function clean(value){return typeof value==='string'?value.trim():'';}

function buildRuntimeConfig(env={}){
  const supabaseUrl=clean(env.SUPABASE_URL).replace(/\/+$/,'');
  const supabasePublishableKey=clean(env.SUPABASE_PUBLISHABLE_KEY)||clean(env.SUPABASE_ANON_KEY);
  if(!supabaseUrl||!supabasePublishableKey)return{supabaseUrl:'',supabasePublishableKey:'',configured:false};
  return{supabaseUrl,supabasePublishableKey,configured:true};
}

module.exports={buildRuntimeConfig};
