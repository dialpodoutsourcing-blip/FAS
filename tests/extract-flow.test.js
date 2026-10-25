'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','chat.html'),'utf8');const adam=fs.readFileSync(path.join(__dirname,'..','assets','js','adam.js'),'utf8');const projectStore=fs.readFileSync(path.join(__dirname,'..','assets','js','project-store.js'),'utf8');
test('chat loads production domain modules before its controller',()=>{
 for(const file of ['project-store.js','interview-engine.js','artifacts.js'])assert.match(html,new RegExp(`<script src="assets/js/${file.replace('.','\\.')}"`));
 assert.ok(html.indexOf('project-store.js')<html.indexOf('adam.js'));
});
test('chat controller saves answers, checkpoints, gaps, and ready artifacts',()=>{
 for(const token of ['FAS.projectStore.create','FAS.interview.create','saveAnswer','saveCheckpoint','fas:answer-saved','fas:checkpoint','fas:artifact-ready','fas:interview-gap'])assert.ok(adam.includes(token),token);
});
test('chat keeps failed durable answers retryable without advancing the interview',()=>{
 assert.match(adam,/var previousCheckpoint=interview\.checkpoint\(\)/);
 assert.match(adam,/interview\.restore\(previousCheckpoint\)/);
 assert.ok(adam.indexOf('saveAnswer')<adam.indexOf('saveCheckpoint'));
 assert.match(adam,/submitButton\.disabled=true/);
 assert.match(adam,/input\.value=text/);
});
test('completed Anchor interviews request structured synthesis before saving the artifact',()=>{
 assert.match(adam,/fetch\('\/api\/artifact-synthesis'/);
 assert.match(adam,/FAS\.artifacts\.applySynthesis/);
 assert.ok(adam.indexOf("fetch('/api/artifact-synthesis'")<adam.indexOf('projectStore.saveArtifact',adam.indexOf("fetch('/api/artifact-synthesis'")));
});
test('completed interviews open the saved blueprint and reject extra chat answers',()=>{
 const completionGuard=adam.indexOf('if (interview && !interview.currentQuestion())');
 const addUserMessage=adam.indexOf("FAS.chat.addMessage({ role: 'user'",adam.indexOf('function send()'));
 assert.ok(completionGuard>=0&&completionGuard<addUserMessage,'completion is checked before another user message is saved');
 assert.match(adam,/projectStore\.saveArtifact[\s\S]*window\.location\.assign\(completionUrl/);
});
test('chat controller requests an AI acknowledgement while preserving the engine-selected question',()=>{
 assert.match(adam,/fetch\('\/api\/chat-response'/);
 assert.match(adam,/nextQuestion/);
 assert.match(adam,/conversationHistory/);
 assert.match(adam,/renderCurrentQuestion/);
});
test('AI acknowledgements render in the visible thread before advancing the question display',()=>{
 assert.match(adam,/var target = thread;/, 'new messages target the visible conversation');
 assert.match(adam,/history\.appendChild\(node\.cloneNode\(true\)\)/, 'visible messages are also copied to History');
 const requestIndex=adam.indexOf('requestConversationalReply(text,nextQuestion)');
 const visibleReplyIndex=adam.indexOf("FAS.chat.addMessage({role:'agent',text:message}",requestIndex);
 const advanceIndex=adam.indexOf('renderCurrentQuestion({question:nextQuestion}',requestIndex);
 assert.ok(requestIndex>=0&&visibleReplyIndex>requestIndex&&advanceIndex>visibleReplyIndex, 'acknowledgement appears before the question display advances');
});
test('checkpoint confirmations use a dedicated compact text treatment',()=>{
 const css=fs.readFileSync(path.join(__dirname,'..','assets','css','styles.css'),'utf8');
 assert.match(adam,/variant:\s*'checkpoint'/);
 assert.match(adam,/classList\.add\('msg--' \+ o\.variant\)/);
 assert.match(css,/\.msg--checkpoint\s*\{[^}]*font-size:\s*11px/s);
 assert.match(css,/\.msg--checkpoint \.bubble\s*\{[^}]*background:\s*transparent/s);
});
test('a one-time restart clears only the selected agent from local project memory',()=>{
 assert.match(adam,/query\.get\('restart'\) === '1'/);
 assert.match(projectStore,/answer\.agentKey!==agentKey&&answer\.agent_key!==agentKey/);
 assert.match(projectStore,/delete state\.checkpoints\[agentKey\]/);
 assert.match(adam,/query\.delete\('restart'\)/);
});

