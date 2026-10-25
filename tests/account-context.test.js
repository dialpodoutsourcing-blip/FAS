'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

function optionalRequire(path){try{return require(path);}catch(error){if(error&&error.code==='MODULE_NOT_FOUND')return null;throw error;}}
function memoryStorage(seed={}){const values=new Map(Object.entries(seed));return{getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};}
const sessions={anchor:'anchor-session',extract:'extract-session',radar:'radar-session',forge:'forge-session',architect:'architect-session',voice:'voice-session',launch:'launch-session'};
const auth={supabaseUrl:'https://example.supabase.co',publishableKey:'sb_publishable_test',requireSession:async()=>({accessToken:'access-1',user:{id:'user-1'}})};

test('bootstrap persists only validated project routing context',async()=>{
  const api=optionalRequire('../assets/js/account-context.js');assert.ok(api,'account context exists');
  const storage=memoryStorage(),calls=[];
  const context=api.create({auth,storage,fetchImpl:async(url,init)=>{calls.push({url,init});return{ok:true,status:200,json:async()=>({workspaceId:'workspace-1',projectId:'project-1',sessions})};}});
  const saved=await context.bootstrap({displayName:'Mike',projectName:''});
  assert.deepEqual(saved,{workspaceId:'workspace-1',projectId:'project-1',sessions});
  assert.deepEqual(JSON.parse(storage.getItem('fas.supabase.context')),saved);
  assert.equal(calls[0].url,'https://example.supabase.co/rest/v1/rpc/bootstrap_fas_account');
  assert.equal(calls[0].init.headers.Authorization,'Bearer access-1');
  assert.deepEqual(JSON.parse(calls[0].init.body),{p_display_name:'Mike',p_project_name:'My Authority Project'});
});

test('bootstrap rejects incomplete session maps without persisting them',async()=>{
  const api=optionalRequire('../assets/js/account-context.js');assert.ok(api,'account context exists');
  const storage=memoryStorage(),context=api.create({auth,storage,fetchImpl:async()=>({ok:true,status:200,json:async()=>({workspaceId:'workspace-1',projectId:'project-1',sessions:{anchor:'only-one'}})})});
  await assert.rejects(()=>context.bootstrap({displayName:'Mike',projectName:'FAS'}),/seven agent sessions/i);
  assert.equal(storage.getItem('fas.supabase.context'),null);
});

test('context routes every agent to its own session',()=>{
  const api=optionalRequire('../assets/js/account-context.js');assert.ok(api,'account context exists');
  const storage=memoryStorage({'fas.supabase.context':JSON.stringify({workspaceId:'workspace-1',projectId:'project-1',sessions})}),context=api.create({auth,storage,fetchImpl:async()=>{throw new Error('unused');}});
  assert.equal(context.sessionFor('anchor'),'anchor-session');
  assert.equal(context.sessionFor('extract'),'extract-session');
  assert.equal(context.agentUrl('chat.html','anchor'),'chat.html?agent=anchor&project=project-1&session=anchor-session');
  assert.equal(context.agentUrl('review.html','extract'),'review.html?asset=extract&project=project-1&session=extract-session');
});

test('safe return paths allow known local pages and reject external or malformed targets',()=>{
  const api=optionalRequire('../assets/js/account-context.js');assert.ok(api,'account context exists');
  const context=api.create({auth,storage:memoryStorage(),fetchImpl:async()=>{throw new Error('unused');}});
  assert.equal(context.safeReturnPath('chat.html?agent=anchor'),'chat.html?agent=anchor');
  assert.equal(context.safeReturnPath('/review.html?asset=anchor'),'review.html?asset=anchor');
  for(const unsafe of ['https://evil.example','//evil.example','unknown.html','javascript:alert(1)','%E0%A4%A','\\evil.example'])assert.equal(context.safeReturnPath(unsafe),'index.html',unsafe);
});

test('invalid stored context is discarded and clear removes valid context',()=>{
  const api=optionalRequire('../assets/js/account-context.js');assert.ok(api,'account context exists');
  const storage=memoryStorage({'fas.supabase.context':'{"projectId":"wrong"}'}),context=api.create({auth,storage,fetchImpl:async()=>{throw new Error('unused');}});
  assert.equal(context.load(),null);assert.equal(storage.getItem('fas.supabase.context'),null);
  storage.setItem('fas.supabase.context',JSON.stringify({workspaceId:'workspace-1',projectId:'project-1',sessions}));
  context.clear();assert.equal(storage.getItem('fas.supabase.context'),null);
});
