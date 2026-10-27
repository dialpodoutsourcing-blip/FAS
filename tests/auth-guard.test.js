'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

function optionalRequire(path){try{return require(path);}catch(_){return null;}}
const sessions={anchor:'anchor-session',extract:'extract-session',radar:'radar-session',forge:'forge-session',architect:'architect-session',voice:'voice-session',launch:'launch-session'};

test('unconfigured pages continue only in explicit local mode',async()=>{
  const guard=optionalRequire('../assets/js/auth-guard.js');assert.ok(guard,'auth guard exists');
  const result=await guard.protect({config:{configured:false},auth:{requireSession(){throw new Error('must not authenticate');}},context:{},location:{}});
  assert.deepEqual(result,{mode:'local'});
});

test('unavailable runtime configuration blocks work instead of enabling local mode',async()=>{
  const guard=optionalRequire('../assets/js/auth-guard.js');
  assert.deepEqual(await guard.protect({config:{unavailable:true},location:{}}),{mode:'config-error'});
});

test('configured pages redirect unauthenticated visitors with a safe local return',async()=>{
  const guard=optionalRequire('../assets/js/auth-guard.js');assert.ok(guard,'auth guard exists');
  const assigned=[],context={clear(){},safeReturnPath:value=>value==='/chat.html?agent=anchor'?'chat.html?agent=anchor':'index.html'};
  const result=await guard.protect({config:{configured:true},auth:{requireSession:async()=>{throw new Error('expired');},clearSession(){}},context,location:{pathname:'/chat.html',search:'?agent=anchor',assign:value=>assigned.push(value)}});
  assert.equal(result.mode,'redirect');assert.equal(assigned[0],'account.html?return=chat.html%3Fagent%3Danchor');
});

test('configured pages reuse the refreshed session and valid account context',async()=>{
  const guard=optionalRequire('../assets/js/auth-guard.js');assert.ok(guard,'auth guard exists');
  let sessionCalls=0,bootstrapCalls=0;const stored={workspaceId:'workspace-1',projectId:'project-1',sessions};
  const result=await guard.protect({config:{configured:true},auth:{requireSession:async()=>{sessionCalls++;return{accessToken:'fresh',user:{id:'user-1'}};}},context:{load:()=>stored,bootstrap:async()=>{bootstrapCalls++;}},location:{}});
  assert.equal(sessionCalls,1);assert.equal(bootstrapCalls,0);assert.deepEqual(result,{mode:'supabase',session:{accessToken:'fresh',user:{id:'user-1'}},context:stored});
});

test('missing account context is bootstrapped from authenticated metadata',async()=>{
  const guard=optionalRequire('../assets/js/auth-guard.js');assert.ok(guard,'auth guard exists');
  const inputs=[],created={workspaceId:'workspace-1',projectId:'project-1',sessions};
  const result=await guard.protect({config:{configured:true},auth:{requireSession:async()=>({accessToken:'fresh',user:{user_metadata:{display_name:'Mike',project_name:'FAS Studio'}}})},context:{load:()=>null,bootstrap:async input=>{inputs.push(input);return created;}},location:{}});
  assert.deepEqual(inputs,[{displayName:'Mike',projectName:'FAS Studio'}]);assert.equal(result.context.projectId,'project-1');
});

test('sign-out clears both auth and project context before returning to account',async()=>{
  const guard=optionalRequire('../assets/js/auth-guard.js');assert.ok(guard,'auth guard exists');
  const order=[],location={assign:value=>order.push(value)};
  await guard.signOut({auth:{signOut:async()=>order.push('auth')},context:{clear:()=>order.push('context')},location});
  assert.deepEqual(order,['auth','context','account.html']);
});

test('navigation applies the correct project and session while preserving link intent',()=>{
  const nav=optionalRequire('../assets/js/nav.js');assert.ok(nav,'navigation API loads outside a browser');
  function link(key,href){return{href,getAttribute:name=>name==='data-agent-link'?key:null,setAttribute(){},querySelector(){return null;},classList:{toggle(){},add(){},remove(){}}};}
  const anchor=link('anchor','https://app.example/chat.html?agent=anchor&utm_source=sidebar'),extract=link('extract','https://app.example/review.html?asset=extract&restart=1');
  const doc={querySelectorAll:selector=>selector==='[data-agent-link]'?[anchor,extract]:[]};
  nav.applyAccountContext({workspaceId:'workspace-1',projectId:'project-1',sessions},doc,'https://app.example/index.html');
  assert.match(anchor.href,/chat\.html\?agent=anchor&utm_source=sidebar&project=project-1&session=anchor-session$/);
  assert.match(extract.href,/review\.html\?asset=extract&restart=1&project=project-1&session=extract-session$/);
});

test('protected controllers wait for authentication readiness before creating stores',()=>{
  assert.match(fs.readFileSync('assets/js/adam.js','utf8'),/FAS\.authReady/);
  assert.match(fs.readFileSync('assets/js/artifact-ui.js','utf8'),/FAS\.authReady/);
});

test('protected content is revealed only after authentication is approved',()=>{
  const guard=optionalRequire('../assets/js/auth-guard.js'),removed=[];
  const doc={body:{removeAttribute:name=>removed.push(name)}};
  guard.settleVisibility({mode:'redirect'},doc);assert.deepEqual(removed,[]);
  guard.settleVisibility({mode:'config-error'},doc);assert.deepEqual(removed,[]);
  guard.settleVisibility({mode:'supabase'},doc);assert.deepEqual(removed,['data-auth-pending']);
});

test('every protected page conceals its first paint while authentication is pending',()=>{
  for(const file of ['index.html','chat.html','review.html','vault.html','launch.html']){
    const html=fs.readFileSync(file,'utf8');assert.match(html,/<body[^>]*data-auth-pending/,file);
  }
  const css=fs.readFileSync('assets/css/styles.css','utf8');assert.match(css,/body\[data-auth-pending\]\s*\{[^}]*visibility:\s*hidden/s);
});
