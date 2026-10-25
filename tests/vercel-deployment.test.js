'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');

test('build prepares every browser entry and asset for Vercel static hosting',()=>{
  execFileSync(process.execPath,['tools/prepare-vercel.js'],{cwd:root});
  for(const file of ['index.html','account.html','chat.html','review.html','vault.html','launch.html','assets/js/runtime-config.js','assets/js/auth-client.js','assets/js/account-context.js','assets/js/auth-guard.js','assets/js/local-import.js','assets/js/account.js','assets/js/tutorial.js','assets/js/realtime-narrator.js','assets/css/styles.css'])assert.ok(fs.existsSync(path.join(root,'public',file)),`public/${file} exists`);
  assert.match(fs.readFileSync(path.join(root,'public/index.html'),'utf8'),/<title>Dashboard · FAS<\/title>/);
});

test('bare Vercel domain rewrites to the FAS dashboard',()=>{
  const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
  assert.ok(config.rewrites.some(rule=>rule.source==='/'&&rule.destination==='/index.html'));
  assert.ok(config.headers.some(rule=>rule.source==='/(.*).html'&&rule.headers.some(header=>header.key==='Cache-Control'&&/no-store/.test(header.value))));
});

test('every built protected page loads its guard before application controllers',()=>{
 for(const page of ['index.html','chat.html','review.html','vault.html','launch.html']){const html=fs.readFileSync(path.join(root,'public',page),'utf8'),guard=html.indexOf('assets/js/auth-guard.js'),controller=Math.max(html.indexOf('assets/js/adam.js'),html.indexOf('assets/js/artifact-ui.js'),html.indexOf('assets/js/nav.js'));assert.ok(guard>=0,`${page} has guard`);assert.ok(controller<0||guard<controller,`${page} guard precedes controllers`);}
});
