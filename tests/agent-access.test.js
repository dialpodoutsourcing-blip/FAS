'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

function fresh(){delete require.cache[require.resolve('../assets/js/agent-access.js')];return require('../assets/js/agent-access.js');}

test('Anchor and Extract are included while paid and unknown specialists default closed',()=>{
  const access=fresh();
  assert.equal(access.isAllowed('anchor'),true);
  assert.equal(access.isAllowed('extract'),true);
  for(const key of ['radar','forge','architect','voice','launch','unknown',''])assert.equal(access.isAllowed(key),false,key);
});

test('chat, review, and launch routes redirect when their specialist is unavailable',()=>{
  const access=fresh(),included=['anchor','extract'];
  assert.deepEqual(access.guardRoute({location:{pathname:'/chat.html',search:'?agent=anchor'},access:included}),{allowed:true});
  assert.deepEqual(access.guardRoute({location:{pathname:'/review.html',search:'?asset=extract'},access:included}),{allowed:true});
  for(const location of [
    {pathname:'/chat.html',search:'?agent=radar'},
    {pathname:'/review.html',search:'?asset=voice'},
    {pathname:'/chat.html',search:'?agent=unknown'},
    {pathname:'/launch.html',search:''}
  ])assert.deepEqual(access.guardRoute({location,access:included}),{allowed:false,destination:'index.html?access=locked'});
});

test('authenticated access loads only valid Supabase entitlements',async()=>{
  const access=fresh(),calls=[];
  const result=await access.load({
    authReady:Promise.resolve({mode:'supabase'}),
    auth:{supabaseUrl:'https://example.supabase.co',publishableKey:'publishable',requireSession:async()=>({accessToken:'token'})},
    fetchImpl:async(url,init)=>{calls.push({url,init});return{ok:true,json:async()=>['anchor','extract','radar','bogus']};}
  });
  assert.deepEqual(result,['anchor','extract','radar']);
  assert.equal(access.isAllowed('radar'),true);
  assert.equal(access.isAllowed('bogus'),false);
  assert.equal(calls[0].url,'https://example.supabase.co/rest/v1/rpc/list_fas_agent_access');
  assert.equal(calls[0].init.headers.Authorization,'Bearer token');
});

test('local, failed, and stale cached contexts never unlock paid specialists',async()=>{
  const access=fresh();
  assert.deepEqual(await access.load({authReady:Promise.resolve({mode:'local'})}),['anchor','extract']);
  const staleContext={sessions:{anchor:'1',extract:'2',radar:'3',forge:'4',architect:'5',voice:'6',launch:'7'}};
  assert.deepEqual(await access.load({authReady:Promise.resolve({mode:'supabase',context:staleContext}),auth:{supabaseUrl:'https://example.supabase.co',publishableKey:'publishable',requireSession:async()=>({accessToken:'token'})},fetchImpl:async()=>{throw new Error('offline');}}),['anchor','extract']);
  assert.equal(access.isAllowed('radar'),false);
});

test('visibility derives specialist requirements from existing navigation and vault markup',()=>{
  const access=fresh(),node=(attributes,id)=>({id:id||'',getAttribute:name=>attributes[name]||null});
  assert.equal(access.requiredAgent(node({'data-agent-link':'radar'})),'radar');
  assert.equal(access.requiredAgent(node({'data-nav':'launch'})),'launch');
  assert.equal(access.requiredAgent(node({},'tab-voice')),'voice');
  assert.equal(access.requiredAgent(node({},'panel-anchor')),'anchor');
});
