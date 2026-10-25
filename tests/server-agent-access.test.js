'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {once}=require('node:events');
const fs=require('node:fs');
const path=require('node:path');

function loadAccess(){delete require.cache[require.resolve('../lib/agent-access.js')];return require('../lib/agent-access.js');}
async function withServer(options,run){delete require.cache[require.resolve('../server.js')];const {createApp}=require('../server.js'),server=createApp(options).listen(0,'127.0.0.1');await once(server,'listening');try{return await run(`http://127.0.0.1:${server.address().port}`);}finally{server.close();await once(server,'close');}}
function chat(base,key,headers={}){return fetch(base+'/api/chat-response',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({agent:{key,name:key.toUpperCase(),title:'Specialist'},answer:'A grounded answer.',nextQuestion:'What happened next?'})});}

test('server agent access includes only Anchor and Extract without an entitlement lookup',async()=>{
  const access=loadAccess();let calls=0;
  assert.equal(access.isFreeAgent('anchor'),true);assert.equal(access.isFreeAgent('extract'),true);
  for(const key of ['radar','forge','architect','voice','launch','unknown',''])assert.equal(access.isFreeAgent(key),false,key);
  assert.equal(await access.authorizeAgentAccess({agentKey:'extract',fetchImpl:async()=>{calls++;}}),true);
  assert.equal(await access.authorizeAgentAccess({agentKey:'unknown',fetchImpl:async()=>{calls++;}}),false);
  assert.equal(calls,0);
});

test('paid access fails closed and accepts only a positive Supabase RPC result',async()=>{
  const access=loadAccess(),base={agentKey:'radar',token:'user-token',supabaseUrl:'https://example.supabase.co',publishableKey:'publishable'};
  assert.equal(await access.authorizeAgentAccess({...base,token:''}),false);
  assert.equal(await access.authorizeAgentAccess({...base,fetchImpl:async()=>new Response('false',{status:200})}),false);
  assert.equal(await access.authorizeAgentAccess({...base,fetchImpl:async()=>new Response('true',{status:200})}),true);
  assert.equal(await access.authorizeAgentAccess({...base,fetchImpl:async()=>new Response('{}',{status:404})}),false);
  assert.equal(await access.authorizeAgentAccess({...base,fetchImpl:async()=>{throw new Error('offline');}}),false);
});

test('paid and unknown chat agents return 403 before OpenAI while free agents continue',async()=>{
  const runtimeEnv={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'},calls=[];
  const fetchImpl=async(url,init)=>{calls.push(url);if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:'user-1'}),{status:200,headers:{'Content-Type':'application/json'}});if(url.endsWith('/rest/v1/rpc/has_fas_agent_access'))return new Response('false',{status:200});return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:'Grounded acknowledgement.'}]}]}),{status:200,headers:{'Content-Type':'application/json'}});};
  await withServer({runtimeEnv,apiKey:'server-key',fetchImpl},async base=>{
    const headers={Authorization:'Bearer user-token'};
    for(const key of ['radar','unknown']){const response=await chat(base,key,headers);assert.equal(response.status,403);assert.match(await response.text(),/not available on your current plan/i);}
    assert.equal((await chat(base,'extract',headers)).status,200);
  });
  assert.equal(calls.filter(url=>url==='https://api.openai.com/v1/responses').length,1);
});

test('active paid entitlement permits the paid chat agent',async()=>{
  const runtimeEnv={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'},calls=[];
  const fetchImpl=async url=>{calls.push(url);if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:'user-1'}),{status:200,headers:{'Content-Type':'application/json'}});if(url.endsWith('/rest/v1/rpc/has_fas_agent_access'))return new Response('true',{status:200});return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:'Grounded acknowledgement.'}]}]}),{status:200,headers:{'Content-Type':'application/json'}});};
  await withServer({runtimeEnv,apiKey:'server-key',fetchImpl},async base=>assert.equal((await chat(base,'radar',{Authorization:'Bearer user-token'})).status,200));
  assert.equal(calls.filter(url=>url.endsWith('/rest/v1/rpc/has_fas_agent_access')).length,1);
});

test('voice interview client sends the selected specialist identity',()=>{
  const interviewer=fs.readFileSync(path.join(__dirname,'..','assets','js','realtime-interviewer.js'),'utf8'),adam=fs.readFileSync(path.join(__dirname,'..','assets','js','adam.js'),'utf8');
  assert.match(interviewer,/X-FAS-Agent/);
  assert.match(adam,/agentKey\s*:\s*FAS\.agent\.current\.key/);
});
