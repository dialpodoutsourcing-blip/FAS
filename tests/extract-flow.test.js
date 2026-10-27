'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','chat.html'),'utf8');const adam=fs.readFileSync(path.join(__dirname,'..','assets','js','adam.js'),'utf8');const coordinator=fs.readFileSync(path.join(__dirname,'..','assets','js','interview-coordinator.js'),'utf8');const projectStore=fs.readFileSync(path.join(__dirname,'..','assets','js','project-store.js'),'utf8');
test('chat loads production domain modules before its controller',()=>{
 for(const file of ['project-store.js','interview-engine.js','interview-coordinator.js','artifacts.js'])assert.match(html,new RegExp(`<script src="assets/js/${file.replace('.','\\.')}"`));
 assert.ok(html.indexOf('interview-coordinator.js')<html.indexOf('adam.js'));
});
test('chat controller saves answers, checkpoints, gaps, and ready artifacts',()=>{
 for(const token of ['FAS.projectStore.create','FAS.interview.create','FAS.createInterviewCoordinator','fas:answer-saved','fas:checkpoint','fas:artifact-ready','fas:interview-gap'])assert.ok(adam.includes(token),token);
 for(const token of ['acceptAnswer','saveAnswerCheckpoint','reconcileAnswer'])assert.ok(coordinator.includes(token),token);
});
test('chat keeps failed durable answers retryable without advancing the interview',()=>{
 assert.match(coordinator,/var previousCheckpoint = interview\.checkpoint\(\)/);
 assert.match(coordinator,/interview\.restore\(previousCheckpoint\)/);
 assert.match(coordinator,/saveAnswerCheckpoint/);
 assert.match(adam,/submitButton\.disabled=true/);
 assert.match(adam,/input\.value=text/);
});
test('chat saves answer and checkpoint atomically and exposes blueprint retry',()=>{
 assert.match(coordinator,/saveAnswerCheckpoint/);assert.match(coordinator,/reconcileAnswer/);assert.match(adam,/artifactRetryPending/);assert.match(adam,/Retry blueprint/);
});
test('completed Anchor interviews request structured synthesis before saving the artifact',()=>{
 assert.match(adam,/apiFetch\('\/api\/artifact-synthesis'/);
 assert.match(adam,/FAS\.artifacts\.applySynthesis/);
 assert.ok(adam.indexOf("apiFetch('/api/artifact-synthesis'")<adam.indexOf('projectStore.saveArtifact',adam.indexOf("apiFetch('/api/artifact-synthesis'")));
});
test('completed interviews open the saved blueprint and reject extra chat answers',()=>{
 const completionGuard=adam.indexOf('if (interview && !interview.currentQuestion())');
 const addUserMessage=adam.indexOf("FAS.chat.addMessage({ role: 'user'",adam.indexOf('function send()'));
 assert.ok(completionGuard>=0&&completionGuard<addUserMessage,'completion is checked before another user message is saved');
 assert.match(adam,/projectStore\.saveArtifact[\s\S]*window\.location\.assign\(completionUrl/);
});
test('completion is clearly announced before automatic blueprint generation',()=>{
 assert.match(adam,/function announceCompletion/);
 assert.match(adam,/finished[\s\S]*generat[\s\S]*review[\s\S]*PDF/i);
 const announce=adam.indexOf('announceCompletion()');
 const generate=adam.indexOf('generateBlueprint(completionUrl,status)',announce);
 assert.ok(announce>=0&&generate>announce,'completion announcement precedes generation and redirect');
});
test('restored answers render before the completion announcement',()=>{
 const initialize=adam.indexOf('function initializePersistence');
 const savedAnswers=adam.indexOf('(project&&project.answers||[]).filter',initialize);
 const restoredCompletion=adam.indexOf('if(!interview.currentQuestion()&&!hasArtifact)',initialize);
 assert.ok(savedAnswers>initialize&&restoredCompletion>savedAnswers,'completion remains the final visible message after reload');
});
test('blueprint generation is single-flight and reopens the completed composer for advisory chat',()=>{
 assert.match(adam,/var blueprintPromise = null/);
 assert.match(adam,/if\(blueprintPromise\)return blueprintPromise/);
 assert.match(adam,/completedConversation=true/);
 assert.match(adam,/input\.disabled=false/);
 assert.match(adam,/\/api\/advisory-response/);
 assert.match(adam,/finally\(function\(\)\{if\(!blueprintPromise\)/);
});
test('chat controller requests an AI acknowledgement while preserving the engine-selected question',()=>{
 assert.match(adam,/apiFetch\('\/api\/chat-response'/);
 assert.match(adam,/nextQuestion/);
 assert.match(adam,/conversationHistory/);
 assert.match(adam,/renderCurrentQuestion/);
});
test('AI acknowledgements render in the visible thread before advancing the question display',()=>{
 assert.match(adam,/var target = thread;/, 'new messages target the visible conversation');
 assert.match(adam,/history\.appendChild\(node\.cloneNode\(true\)\)/, 'visible messages are also copied to History');
 const requestIndex=adam.indexOf("interviewCoordinator.submit({text:text,source:'type'");
 const visibleReplyIndex=adam.indexOf("FAS.chat.addMessage({role:'agent',text:result.message}",requestIndex);
 const advanceIndex=adam.indexOf('renderCurrentQuestion({question:result.nextQuestion}',requestIndex);
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

test('Type and Talk route retry through confirmation before scoped restart navigation',()=>{
 assert.match(adam,/retryConfirmationPending/);
 assert.match(adam,/FAS\.retry\.classify/);
 assert.match(adam,/FAS\.retry\.classifyConfirmation/);
 assert.match(adam,/params\.set\('restart','1'\)/);
 assert.match(adam,/requestRetryConfirmation/);
});

test('Talk starts one Realtime interviewer only after durable interview context is ready',()=>{
 assert.match(html,/assets\/js\/realtime-interviewer\.js/);
 assert.ok(html.indexOf('realtime-interviewer.js')<html.indexOf('adam.js'));
 assert.match(adam,/FAS\.createRealtimeInterviewer/);
 assert.match(adam,/Promise\.all\(\[voiceStart,persistenceReady\]\)/);
 assert.match(adam,/orientation[\s\S]*currentQuestion\(\)\.question[\s\S]*voiceInterviewer\.speak/s);
});

test('final spoken turns use the shared coordinator and proactively speak the grounded next prompt',()=>{
 assert.match(adam,/function handleVoiceTurn/);
 assert.match(adam,/interviewCoordinator\.submit\(\{text:turn\.text,source:'talk',turnId:turn\.turnId\}\)/);
 assert.match(adam,/FAS\.voice\.setTranscript\(turn\.text\)/);
 assert.match(adam,/FAS\.orb\.setState\('thinking'\)/);
 assert.match(adam,/renderCurrentQuestion\(\{question:result\.nextQuestion\}/);
 assert.match(adam,/voiceInterviewer\.speak\(result\.message\)/);
});

test('normal spoken answers receive an immediate bridge before durable processing',()=>{
 const handler=adam.slice(adam.indexOf('function handleVoiceTurn'),adam.indexOf('function switchToTyping'));
 const bridge=handler.indexOf("voiceInterviewer.speak('Got it");
 const submit=handler.indexOf("interviewCoordinator.submit({text:turn.text");
 assert.ok(bridge>=0&&submit>bridge,'the bridge starts before durable submission');
 assert.doesNotMatch(handler.slice(bridge,submit),/await|\.then\(/,'saving does not wait for bridge playback');
});

test('standalone Talk commands are handled without saving answers',()=>{
 for(const command of ['repeat','pause','switch_to_type','end'])assert.ok(adam.includes(command),command);
 const commandCheck=adam.indexOf('classifyVoiceCommand(turn.text)');
 const durableSubmit=adam.indexOf("interviewCoordinator.submit({text:turn.text,source:'talk'",commandCheck);
 assert.ok(commandCheck>=0&&durableSubmit>commandCheck,'commands are intercepted before durable submission');
 assert.match(adam,/partialTranscript\(\)[\s\S]*input\.value/s,'switching to Type transfers a partial draft');
 assert.match(adam,/stop\(\{waitFor:voiceTurnPromise\}\)/,'ending waits for a finalized in-flight turn');
});

test('Talk can navigate directly to EXTRACT after completion',()=>{
 assert.match(adam,/return'go_to_extract'/);
 assert.match(adam,/command==='go_to_extract'/);
 assert.match(adam,/\[data-start-extract\]/);
 assert.match(adam,/window\.location\.assign\(extract\.href\)/);
});

test('Talk completion announces, stops input, generates once, and keeps recovery truthful',()=>{
 assert.match(adam,/voiceCompletionCopy/);
 assert.match(adam,/voiceInterviewer\.pause\(\)[\s\S]*voiceInterviewer\.speak\(completionMessage\)/s);
 assert.match(adam,/generateBlueprint\(completionUrl,status\)/);
 assert.match(adam,/Retry voice/);
 assert.match(adam,/Type instead/);
 assert.match(adam,/Microphone access|voice connection|spoken answer/i);
});

test('recoverable voice errors keep listening and use truthful guidance',()=>{
 assert.match(adam,/voice_transcription_failed/);
 assert.match(adam,/voice_realtime_turn_failed/);
 assert.match(adam,/voice_playback_failed/);
 assert.match(adam,/preserveVoiceDraft\(error\.draft\)/);
});

