'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','chat.html'),'utf8');const adam=fs.readFileSync(path.join(__dirname,'..','assets','js','adam.js'),'utf8');
test('chat loads production domain modules before its controller',()=>{
 for(const file of ['project-store.js','interview-engine.js','artifacts.js'])assert.match(html,new RegExp(`<script src="assets/js/${file.replace('.','\\.')}"`));
 assert.ok(html.indexOf('project-store.js')<html.indexOf('adam.js'));
});
test('chat controller saves answers, checkpoints, gaps, and ready artifacts',()=>{
 for(const token of ['FAS.projectStore.create','FAS.interview.create','saveAnswer','saveCheckpoint','fas:answer-saved','fas:checkpoint','fas:artifact-ready','fas:interview-gap'])assert.ok(adam.includes(token),token);
});

