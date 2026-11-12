'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','chat.html'),'utf8');const adam=fs.readFileSync(path.join(__dirname,'..','assets','js','adam.js'),'utf8');const coordinator=fs.readFileSync(path.join(__dirname,'..','assets','js','interview-coordinator.js'),'utf8');const projectStore=fs.readFileSync(path.join(__dirname,'..','assets','js','project-store.js'),'utf8');
const completionModal=fs.readFileSync(path.join(__dirname,'..','assets','js','completion-modal.js'),'utf8');
const agents=require('../assets/js/agents.js');
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
test('completion is clearly announced before user-confirmed blueprint generation',()=>{
 assert.match(adam,/function announceCompletion/);
 assert.match(adam,/finished[\s\S]*saved[\s\S]*select Generate[\s\S]*review/i);
 assert.doesNotMatch(adam,/I.m generating your[\s\S]*now/i);
 const choice=adam.indexOf('function presentCompletionChoice');
 const generate=adam.indexOf('function generateFromCompletionModal',choice);
 assert.ok(choice>=0&&generate>choice,'completion choice is defined before the explicit generation action');
});
test('successful completion redirects to review and leaves a specialist review action for restored chat',()=>{
 assert.match(adam,/Generate '\+deliverable/);
 assert.match(adam,/generateBlueprint\(completionUrl,status\)[\s\S]*window\.location\.assign\(completionUrl\)/);
 assert.match(adam,/enterCompletedConversation\(project\)/);
 assert.match(adam,/hideCompletionChoice\(\)/);
});

test('direct EXTRACT access is blocked until a saved ANCHOR artifact exists',()=>{
 assert.match(adam,/FAS\.progression\.canEnter\(FAS\.agent\.current\.key,project\)/);
 assert.match(adam,/notice','extract-locked'/);
});
test('restored answers render before the completion announcement',()=>{
 const initialize=adam.indexOf('function initializePersistence');
 const savedAnswers=adam.indexOf('(project&&project.answers||[]).filter',initialize);
 const restoredCompletion=adam.indexOf('if(!interview.currentQuestion()&&!hasArtifact)',initialize);
 assert.ok(savedAnswers>initialize&&restoredCompletion>savedAnswers,'completion remains the final visible message after reload');
});

test('restored conversation uses the reconciled checkpoint and durable answer set',()=>{
 assert.match(adam,/renderRestoredConversation\(restoredState\.answers,interview\.currentQuestion\(\)\)/);
});
test('persistence restoration fails closed and retries without creating question one',()=>{
 const initialize=adam.slice(adam.indexOf('function initializePersistence'),adam.indexOf('function apiFetch'));
 assert.doesNotMatch(initialize,/catch\(function\(\)\{if\(FAS\.interview\)\{interview=FAS\.interview\.create/);
 assert.match(initialize,/function loadPersistence/);
 assert.match(initialize,/persistenceLoadError=error/);
 assert.match(initialize,/Retry loading/);
 assert.match(adam,/if\(persistenceLoadError\)loadPersistence\(\)/);
 const start=adam.slice(adam.indexOf('function startVoiceInterview'),adam.indexOf('function classifyVoiceCommand'));
 assert.ok(start.indexOf('persistenceReady.then')<start.indexOf('recovery.hidden=true'),'Talk cannot hide Retry loading before restoration succeeds');
});
test('blueprint generation is single-flight and reopens the completed composer for advisory chat',()=>{
 assert.match(adam,/var blueprintPromise = null/);
 assert.match(adam,/if\(blueprintPromise\)return blueprintPromise/);
 assert.match(adam,/completedConversation=true/);
 assert.match(adam,/input\.disabled=false/);
 assert.match(adam,/\/api\/advisory-response/);
 assert.match(adam,/finally\(function\(\)\{if\(!blueprintPromise&&!completionModalOpen\(\)\)/);
});
test('final saved answer opens the completion modal without generating automatically',()=>{
 const submit=adam.slice(adam.indexOf("interviewCoordinator.submit({text:text,source:'type'"),adam.indexOf("if (form) form.addEventListener"));
 const complete=submit.slice(submit.indexOf('if(!interview.currentQuestion())'),submit.indexOf('}).catch'));
 assert.match(complete,/presentCompletionChoice\(/);
 assert.doesNotMatch(complete,/generateBlueprint\(/);
 assert.ok(complete.indexOf('presentCompletionChoice')>complete.indexOf('!interview.currentQuestion()'));
});
test('end of required questions opens completion even when older gap metadata remains',()=>{
 const initialize=adam.slice(adam.indexOf('function initializePersistence'),adam.indexOf('function loadPersistence'));
 assert.match(initialize,/if\(!interview\.currentQuestion\(\)&&!hasArtifact\)\{presentCompletionChoice\('',false\);return project;\}/);
 const voice=adam.slice(adam.indexOf('function handleVoiceTurn'),adam.indexOf('function switchToTyping'));
 assert.match(voice,/if\(!interview\.currentQuestion\(\)\)return runVoiceCompletion\(completionUrl,status\)/);
});
test('restored complete answers reopen the completion modal without background generation',()=>{
 const initialize=adam.slice(adam.indexOf('function initializePersistence'),adam.indexOf('function loadPersistence'));
 assert.match(initialize,/FAS\.interviewRestoration\.reconcile/);
 assert.match(adam,/function renderRestoredConversation[\s\S]*FAS\.interviewRestoration\.transcript/);
 assert.match(adam,/function renderRestoredConversation[\s\S]*renderCurrentQuestion\(currentQuestion,true\)/);
 const pending=initialize.slice(initialize.indexOf('if(!interview.currentQuestion()&&!hasArtifact)'));
 assert.match(pending,/presentCompletionChoice\(/);
 assert.doesNotMatch(pending,/generateBlueprint\(/);
});
test('completion action is single-flight and exposes retry without losing the modal',()=>{
 assert.match(adam,/function generateFromCompletionModal/);
 assert.match(adam,/if\(blueprintPromise\)return blueprintPromise/);
 assert.match(adam,/\[data-completion-generate\]/);
 assert.match(adam,/Generating your '\+completionDeliverable\(\)/);
 assert.match(adam,/Retry Generation/);
 assert.match(adam,/completionModalControl\.open\(\)/);
});
test('completion modal opens across cached native and legacy page shells',()=>{
 assert.match(completionModal,/typeof panel\.showModal==='function'/);
 assert.match(completionModal,/panel\.setAttribute\('open',''\)/);
 assert.match(completionModal,/document\.body\.appendChild\(panel\)/);
 assert.match(html,/data-completion-generate[^>]*>\s*Generate Trusted Expert Statement\s*</);
});
test('completion modal traps focus and cannot be dismissed with Escape',()=>{
 assert.match(adam,/completionModalKeydown/);
 assert.match(adam,/event\.key==='Escape'[\s\S]*preventDefault\(\)/);
 assert.match(adam,/event\.key==='Tab'[\s\S]*completionButton\.focus\(\)/);
});
test('every specialist exposes the correct completion deliverable',()=>{
 const expected={anchor:'Trusted Expert Statement',extract:'Expertise Map',radar:'Buyer Intelligence Brief',forge:'Brand Identity Brief',architect:'Curriculum Map',voice:'Copy Pack',launch:'Rollout Plan'};
 for(const [key,deliverable] of Object.entries(expected))assert.equal(agents.get(key).deliverable,deliverable,key);
 assert.match(adam,/FAS\.agent\.current\.deliverable/);
 assert.match(adam,/FAS\.agent\.current\.name\+' COMPLETE'/);
});
test('chat controller requests an AI acknowledgement while preserving the engine-selected question',()=>{
 assert.match(adam,/apiFetch\('\/api\/chat-response'/);
 assert.match(adam,/nextQuestion/);
 assert.match(adam,/conversationHistory/);
 assert.match(adam,/renderCurrentQuestion/);
});
test('AI acknowledgement has a bounded deadline and preserves the exact next-question fallback',()=>{
 const reply=adam.slice(adam.indexOf('function requestConversationalReply'),adam.indexOf('function submitPostCompletionMessage'));
 assert.match(reply,/apiFetch\('\/api\/chat-response'[\s\S]*?,\s*8000\)/);
 assert.match(reply,/catch\(function\(\)\{return fallback;\}\)/);
 assert.ok(reply.indexOf('FAS.chat.setTyping(false)')>reply.indexOf('catch(function(){return fallback;})'));
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
 const start=adam.slice(adam.indexOf('function startVoiceInterview'),adam.indexOf('function classifyVoiceCommand'));
 assert.ok(start.indexOf('persistenceReady.then')<start.indexOf('voiceInterviewer.start()'),'microphone startup waits for restored persistence');
});
test('restored Talk welcomes the user back and marks orientation only after speech is accepted',()=>{
 const start=adam.slice(adam.indexOf('function startVoiceInterview'),adam.indexOf('function classifyVoiceCommand'));
 assert.match(start,/restoredInterview[\s\S]*Welcome back\. Let[’']s continue where you left off\./);
 assert.match(start,/currentQuestion\(\)\.question/);
 const accepted=start.indexOf('var accepted=speakVoicePrompt');
 const marked=start.indexOf('voiceOrientationSpoken=true',accepted);
 assert.ok(accepted>=0&&marked>accepted,'orientation is marked only after speak accepts it');
});

test('final spoken turns use the shared coordinator and proactively speak the grounded next prompt',()=>{
 assert.match(adam,/function handleVoiceTurn/);
 assert.match(adam,/interviewCoordinator\.submit\(\{text:turn\.text,source:'talk',turnId:turn\.turnId\}\)/);
 assert.match(adam,/FAS\.voice\.setTranscript\(turn\.text\)/);
 assert.match(adam,/FAS\.orb\.setState\('thinking'\)/);
 assert.match(adam,/renderCurrentQuestion\(\{question:result\.nextQuestion\}/);
 assert.match(adam,/speakVoicePrompt\(result\.message\)/);
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
 assert.match(adam,/return\{type:'go_to_extract'\}/);
 assert.match(adam,/command\.type==='go_to_extract'/);
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

