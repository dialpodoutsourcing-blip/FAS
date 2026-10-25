'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..'),accountPath=path.join(root,'account.html');
const accountCssPath=path.join(root,'assets','css','styles.css');
function optionalRequire(file){try{return require(file);}catch(error){if(error&&error.code==='MODULE_NOT_FOUND')return null;throw error;}}

test('account page is accessible, complete, and contains no credentials',()=>{
  const html=fs.existsSync(accountPath)?fs.readFileSync(accountPath,'utf8'):'';
  for(const id of ['auth-name','auth-business','auth-email','auth-password','auth-confirmation'])assert.match(html,new RegExp(`<label[^>]*for="${id}"`,'i'),id);
  for(const mode of ['signup','signin','confirm','recover','reset','migrating','migration-skip','error'])assert.match(html,new RegExp(`data-auth-view="${mode}"`,'i'),mode);
  assert.match(html,/aria-live="polite"/i);assert.match(html,/data-auth-resend/i);assert.match(html,/data-auth-submit[^>]*type="submit"/i);
  assert.match(html,/assets\/css\/(tokens|styles)\.css/i);
  assert.doesNotMatch(html,/sb_(publishable|secret)|service.role|access_token|refresh_token/i);
});

test('account dependencies load in order before the controller',()=>{
  const html=fs.existsSync(accountPath)?fs.readFileSync(accountPath,'utf8'):'';
  const scripts=['runtime-config.js','auth-client.js','account-context.js','artifacts.js','anchor-artifact-upgrade.js','local-import.js','account.js'].map(name=>html.indexOf(name));
  assert.ok(scripts.every(index=>index>=0),'all account scripts exist');assert.deepEqual(scripts,scripts.slice().sort((a,b)=>a-b));
});

test('account desktop layout fits one viewport inside a premium contained panel',()=>{
  const css=fs.readFileSync(accountCssPath,'utf8');
  assert.match(css,/\.account-page\s*\{[^}]*height:\s*100dvh[^}]*overflow:\s*hidden/s);
  assert.match(css,/\.account-shell\s*\{[^}]*height:\s*100dvh[^}]*grid-template-columns:\s*minmax\([^;]+42%[^;]+58%/s);
  assert.match(css,/\.account-panel__inner\s*\{[^}]*border:\s*1px solid[^}]*border-radius:\s*\d+px[^}]*padding:\s*clamp\(/s);
});

test('account brand hierarchy uses a heavy wordmark and a controlled story headline',()=>{
  const css=fs.readFileSync(accountCssPath,'utf8');
  assert.match(css,/\.account-mark span\s*\{[^}]*font-weight:\s*850/s);
  const heading=css.match(/\.account-story__copy h1\s*\{([^}]*)\}/s);
  assert.ok(heading,'account story heading rule exists');
  assert.match(heading[1],/font-size:\s*clamp\([^,]+,[^,]+,\s*(?:6[0-8])px\)/);
  assert.doesNotMatch(heading[1],/9[0-9]px/);
});

test('account layout restores safe scrolling for short and narrow screens',()=>{
  const css=fs.readFileSync(accountCssPath,'utf8');
  assert.match(css,/@media\s*\(max-height:\s*760px\)[^{]*\{[\s\S]*?\.account-page\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css,/@media\s*\(max-width:\s*900px\)[^{]*\{[\s\S]*?\.account-page\s*\{[^}]*overflow-y:\s*auto[\s\S]*?\.account-shell\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css,/@media\s*\(max-width:\s*900px\)[^{]*\{[\s\S]*?\.account-panel\s*\{[^}]*min-height:\s*calc\(100dvh - 104px\)/s);
});

test('signup card density keeps its framed edges inside a 768px desktop viewport',()=>{
  const css=fs.readFileSync(accountCssPath,'utf8');
  assert.match(css,/\.account-panel__inner\s*\{[^}]*width:\s*min\(100%,640px\)[^}]*padding:\s*clamp\([^,]+,[^,]+,32px\)/s);
  assert.match(css,/\.account-panel h2\s*\{[^}]*max-width:\s*16ch[^}]*font-size:\s*clamp\([^,]+,[^,]+,46px\)/s);
  assert.match(css,/\.account-form input\s*\{[^}]*min-height:\s*40px/s);
});

test('password mismatch never reaches Supabase',async()=>{
  const api=optionalRequire('../assets/js/account.js');assert.ok(api,'account controller exists');
  let signups=0;const controller=api.create({auth:{signUp:async()=>{signups++;}},context:{},location:{href:'https://app.example/account.html',search:'',assign(){}}});
  const result=await controller.submitSignup({displayName:'Mike',projectName:'FAS',email:'person@example.com',password:'one-password',confirmation:'different-password'});
  assert.deepEqual(result,{ok:false,code:'password_mismatch'});assert.equal(signups,0);assert.equal(controller.getState().mode,'error');
});

test('confirmation-required signup offers resend without retaining passwords',async()=>{
  const api=optionalRequire('../assets/js/account.js');assert.ok(api,'account controller exists');
  const calls=[],auth={signUp:async input=>{calls.push(input);return{confirmationRequired:true,user:{id:'pending'}};},resendConfirmation:async input=>{calls.push(input);return{sent:true};}};
  const controller=api.create({auth,context:{},location:{href:'https://app.example/account.html',search:'',assign(){}}});
  const result=await controller.submitSignup({displayName:'Mike',projectName:'FAS Studio',email:'person@example.com',password:'long-password',confirmation:'long-password'});
  assert.equal(result.confirmationRequired,true);assert.equal(controller.getState().mode,'confirm');assert.equal(JSON.stringify(controller.getState()).includes('long-password'),false);
  await controller.resendConfirmation();assert.equal(calls[1].email,'person@example.com');
});

test('successful sign-in bootstraps context and honors only its safe return path',async()=>{
  const api=optionalRequire('../assets/js/account.js');assert.ok(api,'account controller exists');
  const calls=[],assigned=[],session={user:{user_metadata:{display_name:'Mike',project_name:'FAS Studio'}}};
  const auth={signIn:async()=>{calls.push('signin');return session;}};
  const context={bootstrap:async input=>{calls.push(input);return{projectId:'project-1'};},safeReturnPath:value=>value==='chat.html?agent=anchor'?'chat.html?agent=anchor':'index.html'};
  const controller=api.create({auth,context,location:{href:'https://app.example/account.html?return=chat.html%3Fagent%3Danchor',search:'?return=chat.html%3Fagent%3Danchor',assign:value=>assigned.push(value)}});
  const result=await controller.submitSignin({email:'person@example.com',password:'long-password'});
  assert.equal(result.ok,true);assert.deepEqual(calls,['signin',{displayName:'Mike',projectName:'FAS Studio'}]);assert.deepEqual(assigned,['chat.html?agent=anchor']);
});

test('callback is consumed before confirmation bootstrap and recovery stays on reset mode',async()=>{
  const api=optionalRequire('../assets/js/account.js');assert.ok(api,'account controller exists');
  const order=[],assigned=[];
  const confirmation=api.create({auth:{consumeCallback:async()=>{order.push('callback');return{type:'signup',user:{user_metadata:{display_name:'Mike',project_name:'FAS'}}};},getSession:()=>null},context:{bootstrap:async()=>{order.push('bootstrap');return{};},safeReturnPath:()=> 'index.html'},location:{href:'https://app.example/account.html#access_token=x',search:'',hash:'#access_token=x',assign:value=>assigned.push(value)}});
  await confirmation.start({configured:true});assert.deepEqual(order,['callback','bootstrap']);assert.deepEqual(assigned,['index.html']);
  const recovery=api.create({auth:{consumeCallback:async()=>({type:'recovery',user:{}}),getSession:()=>null},context:{},location:{href:'https://app.example/account.html#type=recovery',search:'',hash:'#type=recovery',assign(){throw new Error('must not navigate');}}});
  const result=await recovery.start({configured:true});assert.equal(result.mode,'reset');assert.equal(recovery.getState().mode,'reset');
});

test('unconfigured deployments expose local preview without claiming authentication',async()=>{
  const api=optionalRequire('../assets/js/account.js');assert.ok(api,'account controller exists');
  let authCalls=0;const controller=api.create({auth:{getSession:()=>{authCalls++;}},context:{},location:{href:'http://127.0.0.1/account.html',search:'',assign(){}}});
  const result=await controller.start({configured:false});assert.deepEqual(result,{mode:'local'});assert.equal(authCalls,0);assert.equal(controller.getState().authenticated,false);
});

test('unavailable runtime configuration shows a retryable error instead of local preview',async()=>{
  const api=optionalRequire('../assets/js/account.js'),controller=api.create({auth:{},context:{},location:{href:'http://127.0.0.1/account.html',search:'',assign(){}}});
  const result=await controller.start({unavailable:true,configured:false});assert.equal(result.mode,'config-error');assert.equal(controller.getState().mode,'error');assert.match(controller.getState().message,/configuration|connection/i);
});

test('invalid credentials render a generic account error',async()=>{
  const api=optionalRequire('../assets/js/account.js');assert.ok(api,'account controller exists');
  const controller=api.create({auth:{signIn:async()=>{const error=new Error('secret upstream detail');error.code='invalid_credentials';throw error;}},context:{},location:{href:'https://app.example/account.html',search:'',assign(){}}});
  const result=await controller.submitSignin({email:'person@example.com',password:'wrong'});
  assert.equal(result.ok,false);assert.equal(controller.getState().message,'Unable to sign in with those credentials.');assert.doesNotMatch(controller.getState().message,/secret|person@example/i);
});

test('successful authentication imports recoverable local work before navigation',async()=>{
  const api=optionalRequire('../assets/js/account.js'),events=[],assigned=[];
  const controller=api.create({auth:{signIn:async()=>({user:{user_metadata:{}}})},context:{bootstrap:async()=>({projectId:'project-1'}),safeReturnPath:()=> 'index.html'},localImport:()=>({inspect:async()=>({checksum:'abc'}),run:async()=>{events.push('import');return{status:'complete'};}}),location:{href:'https://app.example/account.html',search:'',assign:value=>{events.push('navigate');assigned.push(value);}}});
  const result=await controller.submitSignin({email:'person@example.com',password:'long-password'});
  assert.equal(result.ok,true);assert.deepEqual(events,['import','navigate']);assert.deepEqual(assigned,['index.html']);
});

test('existing cloud work is not overwritten and a failed import can be retried',async()=>{
  const api=optionalRequire('../assets/js/account.js');let runs=0,navigations=0;
  const base={auth:{signIn:async()=>({user:{user_metadata:{}}})},context:{bootstrap:async()=>({projectId:'project-1'}),safeReturnPath:()=> 'index.html'},location:{href:'https://app.example/account.html',search:'',assign:()=>{navigations++;}}};
  const skipped=api.create({...base,localImport:()=>({inspect:async()=>({}),run:async()=>({status:'skipped',reason:'cloud_has_answers'})})});
  assert.equal((await skipped.submitSignin({})).skipped,true);assert.equal(skipped.getState().mode,'migration-skip');assert.equal(navigations,0);
  const retry=api.create({...base,localImport:()=>({inspect:async()=>({}),run:async()=>{runs++;if(runs===1)throw new Error('offline');return{status:'complete'};}})});
  assert.equal((await retry.submitSignin({})).code,'import_failed');assert.equal(retry.getState().canRetryImport,true);assert.equal((await retry.retryLocalImport()).ok,true);assert.equal(runs,2);assert.equal(navigations,1);
});
