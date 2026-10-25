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

