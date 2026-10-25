'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

function optionalRequire(path){try{return require(path);}catch(error){if(error&&error.code==='MODULE_NOT_FOUND')return null;throw error;}}
function memoryStorage(seed={}){const values=new Map(Object.entries(seed));return{getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};}
function response(body,status=200){return{ok:status>=200&&status<300,status,json:async()=>body};}
const supabaseUrl='https://example.supabase.co',publishableKey='sb_publishable_test';
const rawSession={access_token:'access-1',refresh_token:'refresh-1',expires_in:3600,user:{id:'user-1',email:'person@example.com',user_metadata:{display_name:'Mike'}}};

test('sign-up preserves profile metadata and reports confirmation without storing a fake session',async()=>{
  const api=optionalRequire('../assets/js/auth-client.js');assert.ok(api,'auth client exists');
  const storage=memoryStorage(),calls=[];
  const auth=api.create({supabaseUrl,publishableKey,storage,fetchImpl:async(url,init)=>{calls.push({url,init});return response({user:{id:'pending-user'}});}});
  const result=await auth.signUp({email:'person@example.com',password:'long-password',data:{display_name:'Mike',project_name:'FAS Studio'},emailRedirectTo:'https://app.example/account.html'});
  assert.deepEqual(result,{confirmationRequired:true,user:{id:'pending-user'}});
  assert.match(calls[0].url,/\/auth\/v1\/signup\?redirect_to=/);
  assert.deepEqual(JSON.parse(calls[0].init.body),{email:'person@example.com',password:'long-password',data:{display_name:'Mike',project_name:'FAS Studio'}});
  assert.equal(storage.getItem('fas.supabase.session'),null);
});

test('sign-in normalizes and persists a Supabase session',async()=>{
  const api=optionalRequire('../assets/js/auth-client.js');assert.ok(api,'auth client exists');
  const storage=memoryStorage(),calls=[];
  const auth=api.create({supabaseUrl,publishableKey,storage,now:()=>100000,fetchImpl:async(url,init)=>{calls.push({url,init});return response(rawSession);}});
  const session=await auth.signIn({email:'person@example.com',password:'long-password'});
  assert.deepEqual(session,{accessToken:'access-1',refreshToken:'refresh-1',expiresAt:3700,user:rawSession.user});
  assert.match(calls[0].url,/\/auth\/v1\/token\?grant_type=password$/);
  assert.equal(calls[0].init.headers.apikey,publishableKey);
  assert.deepEqual(JSON.parse(storage.getItem('fas.supabase.session')),session);
});

test('expired sessions share one refresh request and replace stored credentials',async()=>{
  const api=optionalRequire('../assets/js/auth-client.js');assert.ok(api,'auth client exists');
  const storage=memoryStorage({'fas.supabase.session':JSON.stringify({accessToken:'old',refreshToken:'refresh-1',expiresAt:100,user:{id:'user-1'}})});let refreshCalls=0;
  const auth=api.create({supabaseUrl,publishableKey,storage,now:()=>200000,fetchImpl:async(url)=>{assert.match(url,/grant_type=refresh_token/);refreshCalls++;return response({...rawSession,access_token:'new-access'});}});
  const [first,second]=await Promise.all([auth.requireSession(),auth.requireSession()]);
  assert.equal(refreshCalls,1);
  assert.equal(first.accessToken,'new-access');assert.deepEqual(second,first);
  assert.deepEqual(Object.keys(first).sort(),['accessToken','expiresAt','refreshToken','user']);
});

test('confirmation resend and recovery use their dedicated endpoints without exposing account existence',async()=>{
  const api=optionalRequire('../assets/js/auth-client.js');assert.ok(api,'auth client exists');
  const calls=[],auth=api.create({supabaseUrl,publishableKey,fetchImpl:async(url,init)=>{calls.push({url,init});return response({});}});
  assert.deepEqual(await auth.resendConfirmation({email:'person@example.com',emailRedirectTo:'https://app.example/account.html'}),{sent:true});
  assert.deepEqual(await auth.sendRecovery({email:'person@example.com',redirectTo:'https://app.example/account.html'}),{sent:true});
  assert.match(calls[0].url,/\/auth\/v1\/resend$/);assert.deepEqual(JSON.parse(calls[0].init.body).type,'signup');
  assert.match(calls[1].url,/\/auth\/v1\/recover\?redirect_to=/);
});

test('callback tokens fetch and persist the verified callback user before continuing',async()=>{
  const api=optionalRequire('../assets/js/auth-client.js');assert.ok(api,'auth client exists');
  const storage=memoryStorage(),calls=[],verified={id:'callback-user',email:'callback@example.com',user_metadata:{display_name:'Callback User'}},auth=api.create({supabaseUrl,publishableKey,storage,now:()=>100000,fetchImpl:async(url,init)=>{calls.push({url,init});return response(verified);}});
  const session=await auth.consumeCallback('https://app.example/account.html#access_token=callback-access&refresh_token=callback-refresh&expires_in=120&type=recovery');
  assert.equal(session.accessToken,'callback-access');assert.equal(session.refreshToken,'callback-refresh');assert.equal(session.type,'recovery');assert.deepEqual(session.user,verified);assert.match(calls[0].url,/\/auth\/v1\/user$/);assert.equal(calls[0].init.headers.Authorization,'Bearer callback-access');
  await assert.rejects(()=>auth.consumeCallback('https://app.example/account.html#error=access_denied&error_description=person%40example.com+token-secret'),error=>error.code==='account_request_failed'&&!/person|token-secret/i.test(error.message));
});

test('password updates and user lookup use the authenticated token, while sign-out always clears storage',async()=>{
  const api=optionalRequire('../assets/js/auth-client.js');assert.ok(api,'auth client exists');
  const stored={accessToken:'access-1',refreshToken:'refresh-1',expiresAt:999999,user:{id:'user-1'}},storage=memoryStorage({'fas.supabase.session':JSON.stringify(stored)}),calls=[];
  const auth=api.create({supabaseUrl,publishableKey,storage,now:()=>100000,fetchImpl:async(url,init)=>{calls.push({url,init});return response(url.endsWith('/user')&&(!init.method||init.method==='GET')?{id:'user-1',email:'person@example.com'}:{});}});
  await auth.updatePassword({password:'new-long-password'});
  assert.deepEqual(await auth.getUser(),{id:'user-1',email:'person@example.com'});
  await auth.signOut();
  assert.equal(storage.getItem('fas.supabase.session'),null);
  assert.ok(calls.every(call=>call.init.headers.Authorization==='Bearer access-1'));
});

test('remote authentication failures expose only stable safe error codes',async()=>{
  const api=optionalRequire('../assets/js/auth-client.js');assert.ok(api,'auth client exists');
  const auth=api.create({supabaseUrl,publishableKey,fetchImpl:async()=>response({code:'invalid_credentials',message:'person@example.com token-secret'},400)});
  await assert.rejects(()=>auth.signIn({email:'person@example.com',password:'wrong'}),error=>error.code==='invalid_credentials'&&error.message==='Unable to sign in with those credentials.'&&!/person|token-secret/i.test(error.message));
});
