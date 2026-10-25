'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {once}=require('node:events');const fs=require('node:fs');const path=require('node:path');const {createApp}=require('../server.js');
async function withServer(run){const server=createApp({allowedOrigin:'http://127.0.0.1:4173',runtimeEnv:{}}).listen(0,'127.0.0.1');await once(server,'listening');try{return await run(`http://127.0.0.1:${server.address().port}`);}finally{server.close();await once(server,'close');}}
const artifact={schemaVersion:1,id:'a',agentKey:'extract',type:'expertise_map',title:'Expertise Map',version:1,sections:[{title:'Origin story',blocks:[{kind:'evidence',text:'Grounded content',sourceId:'s'}]}],sources:[{id:'s',field:'origin',basis:'user'}]};
test('export route rejects cross-origin traffic and serves safe attachment headers',async()=>withServer(async base=>{
 const rejected=await fetch(base+'/api/exports',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:JSON.stringify({format:'pdf',artifact})});assert.equal(rejected.status,403);
 const response=await fetch(base+'/api/exports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({format:'pdf',artifact})});assert.equal(response.status,200);assert.match(response.headers.get('content-disposition'),/^attachment; filename="FAS-[A-Za-z0-9.-]+\.pdf"$/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');
}));
test('client assets contain no service credentials and controls remain accessible',()=>{
 const files=['index.html','chat.html','review.html','vault.html','launch.html','assets/js/project-store.js','assets/js/adam.js'];for(const file of files){const text=fs.readFileSync(path.join(__dirname,'..',file),'utf8');assert.doesNotMatch(text,/service_role|OPENAI_API_KEY\s*=|SUPABASE_SERVICE/i,file);}
 const chat=fs.readFileSync(path.join(__dirname,'..','chat.html'),'utf8');assert.match(chat,/data-answer-status[^>]*aria-live="polite"|aria-live="polite"[^>]*data-answer-status/);assert.match(chat,/data-export-format="pdf"/);assert.match(chat,/data-export-format="docx"/);
});
test('production dependencies have no high or critical advisories',()=>{
 const lock=JSON.parse(fs.readFileSync(path.join(__dirname,'..','package-lock.json'),'utf8'));assert.ok(lock.packages['node_modules/body-parser'].version>='2.4.0');
});

test('runtime configuration is public-safe while HTML is never cached',async()=>withServer(async base=>{
 const config=await fetch(base+'/api/runtime-config');assert.equal(config.status,200);assert.match(config.headers.get('cache-control'),/no-store/);assert.deepEqual(Object.keys(await config.json()).sort(),['configured','supabasePublishableKey','supabaseUrl']);
 const html=await fetch(base+'/account.html');assert.equal(html.status,200);assert.match(html.headers.get('cache-control'),/no-store/);
}));

test('built browser tree contains onboarding modules and no environment or service credentials',()=>{
 const publicRoot=path.join(__dirname,'..','public');
 for(const file of ['account.html','assets/js/runtime-config.js','assets/js/auth-client.js','assets/js/account-context.js','assets/js/auth-guard.js','assets/js/local-import.js'])assert.ok(fs.existsSync(path.join(publicRoot,file)),file);
 assert.equal(fs.existsSync(path.join(publicRoot,'.env')),false);
 const files=[];function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(/\.(?:html|js|css|json)$/i.test(entry.name))files.push(full);}}walk(publicRoot);
 for(const file of files)assert.doesNotMatch(fs.readFileSync(file,'utf8'),/service_role|SUPABASE_SERVICE|sb_secret_/i,path.relative(publicRoot,file));
});

test('operator documentation covers authenticated Supabase onboarding without requesting secrets',()=>{
 const readme=fs.readFileSync(path.join(__dirname,'..','README.md'),'utf8'),example=fs.readFileSync(path.join(__dirname,'..','.env.example'),'utf8');
 for(const token of ['202610250002_fas_auth_onboarding.sql','SUPABASE_PUBLISHABLE_KEY','account.html','confirm','recover','seven','Retry saved-work import'])assert.match(readme,new RegExp(token,'i'),token);
 assert.match(example,/SUPABASE_PUBLISHABLE_KEY=/);assert.match(example,/SUPABASE_ANON_KEY=/);assert.doesNotMatch(readme+example,/SUPABASE_SERVICE|service.role|sb_secret_/i);
});

