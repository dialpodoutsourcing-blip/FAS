'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

function optionalRequire(path){try{return require(path);}catch(error){if(error&&error.code==='MODULE_NOT_FOUND')return null;throw error;}}
function jwt(role){return 'eyJhbGciOiJub25lIn0.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.signature';}

test('runtime config exposes only safe public values and prefers the publishable key',()=>{
  const module=optionalRequire('../lib/runtime-config.js');
  assert.ok(module,'runtime config helper exists');
  const config=module.buildRuntimeConfig({SUPABASE_URL:'https://example.supabase.co/',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_ANON_KEY:'legacy',SUPABASE_SECRET_KEY:'never',SUPABASE_SERVICE_ROLE_KEY:'also-never'});
  assert.deepEqual(config,{supabaseUrl:'https://example.supabase.co',supabasePublishableKey:'sb_publishable_test',configured:true});
  assert.deepEqual(Object.keys(config).sort(),['configured','supabasePublishableKey','supabaseUrl']);
  assert.doesNotMatch(JSON.stringify(config),/never|secret|service.role/i);
});

test('runtime config supports the legacy anon key and requires both public values',()=>{
  const module=optionalRequire('../lib/runtime-config.js');
  assert.ok(module,'runtime config helper exists');
  assert.deepEqual(module.buildRuntimeConfig({SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:jwt('anon')}),{supabaseUrl:'https://example.supabase.co',supabasePublishableKey:jwt('anon'),configured:true});
  assert.deepEqual(module.buildRuntimeConfig({SUPABASE_URL:'https://example.supabase.co'}),{supabaseUrl:'',supabasePublishableKey:'',configured:false});
  assert.deepEqual(module.buildRuntimeConfig({SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'}),{supabaseUrl:'',supabasePublishableKey:'',configured:false});
});

test('runtime config rejects malformed URLs and every elevated or malformed key',()=>{
  const {buildRuntimeConfig}=require('../lib/runtime-config.js'),empty={supabaseUrl:'',supabasePublishableKey:'',configured:false};
  assert.deepEqual(buildRuntimeConfig({SUPABASE_URL:'not-a-url',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'}),empty);
  assert.deepEqual(buildRuntimeConfig({SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_secret_never'}),empty);
  assert.deepEqual(buildRuntimeConfig({SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:jwt('service_role')}),empty);
  assert.deepEqual(buildRuntimeConfig({SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'legacy-public'}),empty);
});

test('runtime config endpoint is public, minimal, and never cached',async()=>{
  const {createApp}=require('../server.js');
  const app=createApp({runtimeEnv:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_SECRET_KEY:'never'}});
  const server=app.listen(0,'127.0.0.1');
  try{
    await new Promise(resolve=>server.once('listening',resolve));
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/runtime-config`);
    assert.equal(response.status,200);
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.deepEqual(await response.json(),{supabaseUrl:'https://example.supabase.co',supabasePublishableKey:'sb_publishable_test',configured:true});
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('browser loader installs FAS_CONFIG from a no-store request',async()=>{
  const loader=optionalRequire('../assets/js/runtime-config.js');
  assert.ok(loader,'browser runtime config loader exists');
  const target={},calls=[];
  const config=await loader.load({target,fetchImpl:async(url,init)=>{calls.push({url,init});return{ok:true,json:async()=>({supabaseUrl:'https://example.supabase.co',supabasePublishableKey:'sb_publishable_test',configured:true})};}});
  assert.deepEqual(config,target.FAS_CONFIG);
  assert.deepEqual(calls,[{url:'/api/runtime-config',init:{cache:'no-store',headers:{Accept:'application/json'}}}]);
});
