/* ==========================================================
   FAS ADAM UI v4 · Chat ready + Voice orb ready
   ----------------------------------------------------------
   This file draws the chat and the orb. It does NOT talk to any
   server. The build team connects ADAM by listening for the
   events below and calling the FAS.chat / FAS.orb methods.

   PUBLIC API (window.FAS)
     FAS.chat.addMessage({ role: 'agent' | 'user' | 'note', text: '...', tag: 'EXTRACT' })
     FAS.chat.setTyping(true | false)
     FAS.orb.setState('idle' | 'listening' | 'thinking' | 'speaking')
     FAS.voice.setTranscript('words so far...')
     FAS.mode('text' | 'voice')

   EVENTS (listen with document.addEventListener)
     'fas:send'      detail: { text }        user pressed Send
     'fas:hint'      detail: { text }        user tapped a hint chip
     'fas:not-sure'  detail: {}              user tapped "I am not sure"
     'fas:mic'       detail: { listening }   mic turned on or off
     'fas:voice-end' detail: {}              user ended voice
     'fas:orb-state' detail: { state }       orb changed state

   EXAMPLE (backend wiring, for the dev)
     document.addEventListener('fas:send', async function (e) {
       FAS.chat.setTyping(true);
       const reply = await yourApi(e.detail.text);   // your code
       FAS.chat.setTyping(false);
       FAS.chat.addMessage({ role: 'agent', text: reply });
     });
   ========================================================== */
(function () {
  'use strict';

  var FAS = window.FAS = window.FAS || {};
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function emit(name, detail) { document.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- MODE (Type / Talk) ---------------- */
  FAS.mode = function (mode) {
    var tab = document.getElementById(mode === 'voice' ? 'tab-voice' : 'tab-text');
    if (tab) tab.click();
  };
  $$('[data-goto-voice]').forEach(function (b) { b.addEventListener('click', function () { FAS.mode('voice'); }); });
  $$('[data-goto-text]').forEach(function (b) { b.addEventListener('click', function () { switchToTyping(); }); });
  if (window.location.hash === '#voice') FAS.mode('voice');

  /* ---------------- ORB ---------------- */
  var LABELS = {
    idle: 'Tap the mic and start talking',
    connecting: 'Connecting securely…',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'ADAM is talking',
    paused: 'Voice paused',
    stopped: 'Voice session ended',
    error: 'Voice needs attention',
    unsupported: 'Use Type on this browser'
  };

  $$('.wave span').forEach(function (bar) {
    var height = 4 + Math.floor(Math.random() * 25);
    var speed = 480 + Math.floor(Math.random() * 1120);
    var delay = -Math.floor(Math.random() * 1600);
    var floor = .16 + (Math.random() * .5);
    bar.style.setProperty('--wave-height', height + 'px');
    bar.style.setProperty('--wave-speed', speed + 'ms');
    bar.style.setProperty('--wave-delay', delay + 'ms');
    bar.style.setProperty('--wave-floor', floor.toFixed(2));
    bar.style.animationDirection = Math.random() > .5 ? 'alternate' : 'alternate-reverse';
  });

  FAS.orb = {
    states: Object.keys(LABELS),
    state: 'idle',
    setState: function (state) {
      if (!LABELS[state]) return;
      this.state = state;
      $$('[data-orb]').forEach(function (el) { el.setAttribute('data-orb-state', state); });
      $$('[data-orb-label]').forEach(function (el) { el.textContent = LABELS[state]; });
      var mic = $('[data-voice-mic]');
      if (mic) mic.setAttribute('aria-pressed', String(state === 'listening'));
      $$('[data-orb-preview]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-orb-preview') === state));
      });
      emit('fas:orb-state', { state: state });
    }
  };

  var micBtn = $('[data-voice-mic]');
  if (micBtn) {
    micBtn.addEventListener('click', function () {
      handleVoiceMicClick();
    });
  }
  var endBtn = $('[data-voice-end]');
  if (endBtn) {
    endBtn.addEventListener('click', function () {
      endVoiceInterview();
    });
  }
  $$('[data-orb-preview]').forEach(function (b) {
    b.addEventListener('click', function () { FAS.orb.setState(b.getAttribute('data-orb-preview')); });
  });

  /* ---------------- VOICE TRANSCRIPT ---------------- */
  FAS.voice = {
    setTranscript: function (text) {
      var el = $('[data-voice-transcript]');
      if (el) el.textContent = text;
    }
  };

  /* ---------------- CHAT ---------------- */
  var thread = $('[data-chat-thread]');
  var form = $('[data-chat-form]');
  var input = $('[data-chat-input]');

  function build(role, text, tag) {
    var tpl = document.getElementById('tpl-msg-' + role);
    if (!tpl) return null;
    var node = tpl.content.firstElementChild.cloneNode(true);
    var t = $('[data-msg-text]', node);
    if (t) t.textContent = text;            /* textContent: safe for user text */
    var current = FAS.agent && FAS.agent.current;
    var resolvedTag = tag || (role === 'user' ? 'YOU' : current && current.name);
    if (resolvedTag) { var g = $('[data-msg-tag]', node); if (g) g.textContent = resolvedTag; }
    var icon = $('[data-agent-template-icon]', node);
    if (icon && current) icon.setAttribute('href', '#' + current.symbol);
    return node;
  }

  function setText(selector, value) {
    var el = $(selector);
    if (el) el.textContent = value;
  }

  function setAgentIcon(selector, symbol) {
    $$(selector).forEach(function (icon) { icon.setAttribute('href', '#' + symbol); });
  }

  function renderStages(agent) {
    var list = $('[data-agent-stages]');
    if (!list) return;
    list.textContent = '';
    agent.stages.forEach(function (label, index) {
      var item = document.createElement('li');
      item.className = 'stage' + (index < agent.activeStage ? ' is-done' : index === agent.activeStage ? ' is-active' : '');
      if (index === agent.activeStage) item.setAttribute('aria-current', 'step');
      var bar = document.createElement('span');
      bar.className = 'stage__bar';
      var text = document.createElement('span');
      text.className = 'stage__label';
      text.textContent = label;
      item.appendChild(bar);
      item.appendChild(text);
      list.appendChild(item);
    });
  }

  function renderMessages(agent) {
    if (!thread) return;
    var typing = $('[data-chat-typing]', thread);
    var history = $('[data-chat-history]');
    thread.textContent = '';
    if (history) history.textContent = '';
    agent.messages.forEach(function (message) {
      var node = build('agent', message, agent.name);
      if (node && history) history.appendChild(node);
    });
    var question = build('agent', agent.question, agent.name);
    if (question) {
      var paragraph = $('[data-msg-text]', question);
      if (paragraph) paragraph.classList.add('bubble__text--q');
      thread.appendChild(question);
    }
    if (typing) {
      var typingIcon = $('[data-agent-typing-icon]', typing);
      if (typingIcon) typingIcon.setAttribute('href', '#' + agent.symbol);
      var typingLabel = typing.querySelector('[aria-label]');
      if (typingLabel) typingLabel.setAttribute('aria-label', agent.name + ' is typing');
      thread.appendChild(typing);
    }
  }

  function renderHints(agent) {
    var holder = $('[data-agent-hints]');
    if (!holder) return;
    holder.textContent = '';
    agent.hints.forEach(function (hint) {
      var button = document.createElement('button');
      button.className = 'pill';
      button.type = 'button';
      button.setAttribute('data-chat-hint', '');
      button.textContent = hint;
      holder.appendChild(button);
    });
    var unsure = document.createElement('button');
    unsure.className = 'pill pill--dashed';
    unsure.type = 'button';
    unsure.setAttribute('data-chat-unsure', '');
    unsure.textContent = 'I am not sure';
    holder.appendChild(unsure);
  }

  function renderSaved(agent) {
    var feed = $('[data-agent-saved]');
    if (!feed) return;
    feed.textContent = '';
    agent.savedFields.forEach(function (field) {
      var item = document.createElement('div');
      item.className = 'feed__item';
      var top = document.createElement('div');
      top.className = 'feed__top';
      var name = document.createElement('span');
      name.className = 'feed__name';
      name.textContent = field.name;
      var status = document.createElement('span');
      status.className = 'status status--draft';
      status.textContent = 'Preview';
      var value = document.createElement('span');
      value.className = 'feed__value';
      value.textContent = field.value;
      top.appendChild(name);
      top.appendChild(status);
      item.appendChild(top);
      item.appendChild(value);
      feed.appendChild(item);
    });
  }

  FAS.agent = {
    current: null,
    render: function (key) {
      if (!FAS.agents) {
        if (window.console) console.error('FAS agent registry is unavailable.');
        return null;
      }
      var agent = FAS.agents.get(key);
      this.current = agent;
      $$('.em').forEach(function (emblem) { if (emblem.querySelector('[data-agent-symbol], [data-agent-voice-icon], [data-agent-template-icon]')) emblem.setAttribute('data-agent-motion', agent.key); });
      setText('[data-agent-name]', agent.name);
      setText('[data-agent-title]', agent.title);
      setText('[data-agent-step]', 'Step ' + agent.step + ' of ' + (FAS.agentAccess&&FAS.agentAccess.getAccess?FAS.agentAccess.getAccess().length:2));
      setText('[data-agent-stage-summary]', 'Stage ' + (agent.activeStage + 1) + ' of ' + agent.stages.length + ' · ' + agent.stages[agent.activeStage]);
      setText('[data-agent-voice-name]', agent.name);
      setText('[data-agent-question]', agent.question);
      setText('[data-agent-completion-label]', agent.completionLabel);
      var chip = $('[data-agent-chip]');
      if (chip) chip.style.setProperty('--c', agent.color);
      var completion = $('[data-agent-completion]');
      if (completion) completion.setAttribute('href', agent.completionHref);
      setAgentIcon('[data-agent-symbol], [data-agent-voice-icon], [data-agent-template-icon]', agent.symbol);
      renderStages(agent);
      renderMessages(agent);
      renderHints(agent);
      renderSaved(agent);
      return agent;
    }
  };

  var query = new URLSearchParams(window.location.search);
  var agentKey = query.get('agent');
  FAS.agent.render(agentKey);
  var projectId = 'local-default';
  var sessionId = query.get('session');
  var projectStore = null;
  var restartAgent = query.get('restart') === '1' ? (agentKey || 'anchor') : null;
  var interview = null;
  var interviewCoordinator = null;
  var artifactRetryPending = false;
  var completionAnnounced = false;
  var blueprintPromise = null;
  var conversationHistory = [];
  var voiceInterviewer = null;
  var voiceStart = null;
  var voiceTurnPromise = null;
  var voiceOrientationSpoken = false;
  var voiceIntent = 'idle';
  var voiceGeneration = 0;
  var voiceSaving = false;
  var voiceCompletionPromise = null;
  var persistenceReady = null;
  var persistenceLoadError = null;
  var persistenceLoading = false;
  var restoredInterview = false;
  var completedConversation = false;
  var completedSummary = '';
  var completedTurnIds = new Set();
  var retryConfirmationPending = false;
  var lastCaptureActive = false;
  var turnSequence = 0;
  function setChatLoading(active){var loading=$('[data-chat-loading]'),workspace=$('.chat-shell__workspace');if(loading)loading.hidden=!active;if(workspace)workspace.setAttribute('aria-busy',String(Boolean(active)));}
  function createTurnId(source){turnSequence+=1;return(source||'type')+'-'+Date.now()+'-'+turnSequence;}
  function initializeInterviewCoordinator(){
    if(!interview||!projectStore||!FAS.createInterviewCoordinator)return null;
    interviewCoordinator=FAS.createInterviewCoordinator({interview:interview,projectStore:projectStore,agentKey:FAS.agent.current.key,requestReply:requestConversationalReply});
    return interviewCoordinator;
  }
  function getCompletionUrl(){var params=new URLSearchParams();params.set('asset',FAS.agent.current.key);if(projectId!=='local-default')params.set('project',projectId);if(sessionId)params.set('session',sessionId);return'review.html?'+params.toString();}
  function restartCurrentAgent(){var params=new URLSearchParams(window.location.search);params.set('agent',FAS.agent.current.key);params.set('restart','1');window.location.assign('chat.html?'+params.toString());}
  function retryReply(message,source){FAS.chat.addMessage({role:'agent',tag:'ADAM',text:message});if(source==='talk'&&voiceInterviewer){voiceInterviewer.resume();syncVoiceCaptureControl();return voiceInterviewer.speak(message);}return Promise.resolve(message);}
  function requestRetryConfirmation(text,source){retryConfirmationPending=true;if(text)FAS.chat.addMessage({role:'user',tag:'YOU',text:text});var message='Retry '+FAS.agent.current.name+' from the beginning? This will replace this specialist\'s saved answers and blueprint. Say yes to retry or no to keep your work.';setVoiceStatus('Waiting for retry confirmation.',false);return retryReply(message,source);}
  function handleRetryConfirmation(text,source){var decision=FAS.retry&&FAS.retry.classifyConfirmation(text);FAS.chat.addMessage({role:'user',tag:'YOU',text:text});if(decision===true){retryConfirmationPending=false;if(voiceInterviewer)voiceInterviewer.pause();setVoiceStatus('Restarting '+FAS.agent.current.name+'...',false);restartCurrentAgent();return Promise.resolve();}if(decision===false){retryConfirmationPending=false;setVoiceStatus('Retry cancelled. Your saved work is unchanged.',false);return retryReply('Okay. I kept your '+FAS.agent.current.name+' work and we can continue where we left off.',source);}return retryReply('Please say yes to restart '+FAS.agent.current.name+' or no to keep your current work.',source);}
  function buildCompletedSummary(project){var answers=(project&&project.answers||[]).filter(function(answer){return(answer.agentKey||answer.agent_key)===FAS.agent.current.key;}),latest={};answers.forEach(function(answer){latest[answer.field||answer.field_path]=answer.text||(answer.value&&answer.value.text)||answer.value||'';});return Object.keys(latest).map(function(field){return field+': '+latest[field];}).join('\n').slice(0,6000)||FAS.agent.current.name+' is complete.';}
  function latestAgentAnswers(project){var latest={};(project&&project.answers||[]).filter(function(answer){return(answer.agentKey||answer.agent_key)===FAS.agent.current.key;}).forEach(function(answer){latest[answer.field||answer.field_path]=answer;});return Object.keys(latest).map(function(field){return latest[field];});}
  function renderEditableSavedAnswers(project){var feed=$('[data-agent-saved]');if(!feed)return;var answers=latestAgentAnswers(project);if(!answers.length)return;feed.textContent='';answers.forEach(function(answer){var item=document.createElement('div'),top=document.createElement('div'),name=document.createElement('span'),status=document.createElement('span'),value=document.createElement('span'),edit=document.createElement('button');item.className='feed__item';top.className='feed__top';name.className='feed__name';name.textContent=(answer.field||answer.field_path||'Saved answer').replace(/[._-]+/g,' ');status.className='status status--draft';status.textContent='Saved';value.className='feed__value';value.textContent=answer.text||(answer.value&&answer.value.text)||answer.value||'';edit.className='btn btn--text';edit.type='button';edit.setAttribute('data-edit-answer',answer.id);edit.textContent='Edit';top.appendChild(name);top.appendChild(status);top.appendChild(edit);item.appendChild(top);item.appendChild(value);feed.appendChild(item);});}
  function showCompletionPanel(){var panel=$('[data-completion-panel]'),title=$('[data-completion-title]');if(panel)panel.hidden=false;if(title)title.textContent=FAS.agent.current.name+' is complete';var view=$('[data-view-blueprint]');if(view)view.setAttribute('data-href',getCompletionUrl());var retry=$('[data-retry-agent]');if(retry)retry.textContent='Retry '+FAS.agent.current.name;var legacy=$('[data-agent-completion]');if(legacy)legacy.hidden=true;var extract=$('[data-start-extract]');if(extract){var params=new URLSearchParams();params.set('agent','extract');if(projectId!=='local-default')params.set('project',projectId);extract.href='chat.html?'+params.toString();}if(input){input.disabled=false;input.placeholder='Ask ADAM anything or choose your next step…';}var button=form&&form.querySelector('[type="submit"]');if(button){button.disabled=false;button.textContent='Send';}}
  function enterCompletedConversation(project){completedConversation=true;completedSummary=buildCompletedSummary(project);announceCompletion();showCompletionPanel();renderCurrentQuestion({question:'Your '+FAS.agent.current.name+' work is complete. Ask ADAM a question, edit an answer, view your blueprint, or continue to EXTRACT.'},false);setVoiceStatus('ADAM is ready to discuss your completed work or help with your next step.',false);}
  function renderCurrentQuestion(question, preserveThread) {
    if (!question) return;
    $$('[data-agent-question]').forEach(function(node){node.textContent=question.question;});
    if (!preserveThread) {
      var visible = $('.bubble__text--q', thread);
      if (visible) visible.textContent = question.question;
    }
  }
  function initializePersistence(authState) {
    if (authState && authState.mode === 'redirect') return;
    var config = window.FAS_CONFIG || {}, account = authState && authState.context;
    projectId = account && account.projectId || query.get('project') || 'local-default';
    sessionId = account&&account.sessions&&account.sessions[agentKey]||query.get('session');
    projectStore = FAS.projectStore && FAS.projectStore.create({configured:config.configured===true,config:config,authState:authState,auth:FAS.auth,agentKey:agentKey,projectId:projectId,sessionId:sessionId,onAuthFailure:function(){window.location.assign('account.html?return='+encodeURIComponent(window.location.pathname+window.location.search));}});
    var restartReady = restartAgent && projectStore ? projectStore.resetAgent(restartAgent).then(function(){query.delete('restart');var cleanUrl=window.location.pathname+(query.toString()?'?'+query.toString():'')+window.location.hash;window.history.replaceState({},'',cleanUrl);}) : Promise.resolve();
    if (projectStore && FAS.interview) return restartReady.then(function(){return projectStore.loadAgentCatalog();}).then(function(catalog){
      if (catalog.length && FAS.agents && FAS.agents.applyCatalog) {FAS.agents.applyCatalog(catalog);FAS.agent.render(agentKey);}
      return projectStore.loadProject();
    }).then(function(project){
      interview=FAS.interview.create({agent:FAS.agent.current,state:project&&project.checkpoints&&project.checkpoints[FAS.agent.current.key]});
      initializeInterviewCoordinator();
      renderCurrentQuestion(interview.currentQuestion());
      renderEditableSavedAnswers(project);
      var restoredAnswers=(project&&project.answers||[]).filter(function(answer){return answer.agentKey===FAS.agent.current.key||answer.agent_key===FAS.agent.current.key;});
      restoredInterview=restoredAnswers.length>0;
      restoredAnswers.forEach(function(answer){var savedText=answer.text||answer.value;FAS.chat.addMessage({role:'user',text:savedText,tag:'SAVED'});conversationHistory.push({role:'user',content:savedText});});
      var hasArtifact=(project&&project.artifacts||[]).some(function(artifact){return artifact.agentKey===FAS.agent.current.key||artifact.agent_key===FAS.agent.current.key;});
      if(!interview.currentQuestion()&&hasArtifact){enterCompletedConversation(project);return;}
      if(!interview.currentQuestion()&&!hasArtifact){var restoredStatus=$('[data-answer-status]'),restoredButton=form&&form.querySelector('[type="submit"]');if(interview.completion().complete){announceCompletion();if(restoredStatus)restoredStatus.textContent='Generating your blueprint…';generateBlueprint(getCompletionUrl(),restoredStatus).catch(function(){artifactRetryPending=true;if(form)form.removeAttribute('aria-busy');if(restoredStatus)restoredStatus.textContent='Your answers are saved, but the blueprint could not be prepared. Retry blueprint.';if(restoredButton){restoredButton.disabled=false;restoredButton.textContent='Retry blueprint';}});}else{artifactRetryPending=true;if(restoredButton)restoredButton.textContent='Retry blueprint';if(restoredStatus)restoredStatus.textContent='Your answers are saved. Retry blueprint generation.';}}
      return project;
    });
  }
  function loadPersistence(){
    if(persistenceLoading&&persistenceReady)return persistenceReady;
    persistenceLoading=true;persistenceLoadError=null;restoredInterview=false;interview=null;interviewCoordinator=null;
    setChatLoading(true);if(micBtn)micBtn.disabled=true;
    persistenceReady=Promise.all([FAS.authReady||Promise.resolve({mode:'local'}),FAS.agentAccessReady||Promise.resolve({allowed:true})]).then(function(results){if(results[1]&&results[1].allowed===false)throw new Error('Agent access unavailable');return initializePersistence(results[0]);}).then(function(result){var recovery=$('[data-voice-recovery]'),retry=$('[data-voice-retry]');if(recovery)recovery.hidden=true;if(retry)retry.textContent='Retry voice';if(micBtn)micBtn.disabled=false;setVoiceStatus('Voice is ready when you are.',false);return result;}).catch(function(error){persistenceLoadError=error;interview=null;interviewCoordinator=null;var recovery=$('[data-voice-recovery]'),retry=$('[data-voice-retry]');if(recovery)recovery.hidden=false;if(retry)retry.textContent='Retry loading';setVoiceStatus('Your saved interview could not be loaded. Retry loading before continuing.',true);throw error;}).finally(function(){persistenceLoading=false;setChatLoading(false);});
    persistenceReady.catch(function(){});
    return persistenceReady;
  }
  persistenceReady=loadPersistence();

  function apiFetch(url,init,timeoutMs){var config=window.FAS_CONFIG||{},controller=timeoutMs&&typeof AbortController!=='undefined'?new AbortController():null;function send(session){var next=Object.assign({},init||{});if(session)next.headers=Object.assign({},init&&init.headers||{},{Authorization:'Bearer '+session.accessToken});if(controller)next.signal=controller.signal;return fetch(url,next);}var work=!config.configured||!FAS.auth||!FAS.auth.requireSession?send(null):FAS.auth.requireSession().then(send);if(!timeoutMs)return work;return new Promise(function(resolve,reject){var settled=false,timer=setTimeout(function(){if(settled)return;settled=true;if(controller)controller.abort();var error=new Error('Request timed out');error.code='request_timeout';reject(error);},timeoutMs);work.then(function(response){if(settled)return;settled=true;clearTimeout(timer);resolve(response);},function(error){if(settled)return;settled=true;clearTimeout(timer);reject(error);});});}

  function setVoiceStatus(message,showRecovery){
    var status=$('[data-voice-status]'),recovery=$('[data-voice-recovery]');
    if(status)status.textContent=message||'';
    if(recovery)recovery.hidden=!showRecovery;
  }

  function syncVoiceCaptureControl(){
    var active=Boolean(voiceInterviewer&&voiceInterviewer.captureActive&&voiceInterviewer.captureActive());
    if(micBtn){micBtn.setAttribute('aria-pressed',String(active));micBtn.setAttribute('aria-label',active?'Pause microphone':'Start or resume microphone');}
    if(active!==lastCaptureActive){lastCaptureActive=active;emit('fas:mic',{listening:active});}
  }

  function preserveVoiceDraft(text){
    var draft=String(text||'').trim();if(!draft||!input)return;
    input.value=input.value?input.value.trim()+'\n\n'+draft:draft;
  }

  function getVoiceAccessToken(){
    var config=window.FAS_CONFIG||{};
    if(!config.configured||!FAS.auth||!FAS.auth.requireSession)return Promise.resolve('');
    return FAS.auth.requireSession().then(function(session){return session.accessToken;});
  }

  function voiceStateChanged(state){
    if(LABELS[state])FAS.orb.setState(state);
    if(state==='paused'&&!voiceSaving&&voiceIntent!=='type'&&voiceIntent!=='ended'&&voiceIntent!=='completing')voiceIntent='paused';
    var copy={connecting:'Connecting your voice session…',listening:'Listening. Answer naturally when you are ready.',thinking:'Saving your answer and preparing the next question…',speaking:'ADAM is responding. You can interrupt at any time.',paused:'Voice is paused. Press the mic to resume.',stopped:'Voice session ended. Continue with Type whenever you like.',error:'The voice connection needs attention.',unsupported:'Voice is unavailable in this browser. Type mode is still ready.'};
    if(copy[state])setVoiceStatus(copy[state],state==='error'||state==='unsupported');
    syncVoiceCaptureControl();
  }

  function voiceFailed(error){
    if(error&&(error.code==='voice_transcription_failed'||error.code==='voice_transcript_identity_missing')){if(error.draft)preserveVoiceDraft(error.draft);FAS.orb.setState('listening');setVoiceStatus('I could not finalize that answer. Your words are waiting in Type; please repeat or continue speaking.',false);syncVoiceCaptureControl();return;}
    if(error&&error.code==='voice_realtime_turn_failed'){FAS.orb.setState('listening');setVoiceStatus('That voice turn had a temporary problem. ADAM is still listening; please continue.',false);syncVoiceCaptureControl();return;}
    if(error&&error.code==='voice_playback_failed'){setVoiceStatus('ADAM audio could not play, but your microphone is still active. Continue speaking or use Type.',true);syncVoiceCaptureControl();return;}
    var message=error&&error.code==='voice_unsupported'?'Voice is not supported by this browser. Continue with Type.':'Microphone access or the voice connection failed. Check browser permission, then Retry voice or use Type instead.';
    setVoiceStatus(message,true);
    syncVoiceCaptureControl();
  }

  function buildVoiceInterviewer(){
    if(!FAS.createRealtimeInterviewer)return null;
    var voiceAudio=$('[data-voice-audio]');
    return FAS.createRealtimeInterviewer({
      agentKey:FAS.agent.current.key,
      audioFactory:voiceAudio?function(){return voiceAudio;}:undefined,
      getAccessToken:getVoiceAccessToken,
      onState:voiceStateChanged,
      onCaptureChange:syncVoiceCaptureControl,
      onPartialTranscript:function(partial){FAS.voice.setTranscript(partial.text);},
      onFinalTranscript:handleVoiceTurn,
      onError:voiceFailed
    });
  }

  function startVoiceInterview(){
    voiceIntent='talk';voiceGeneration+=1;var generation=voiceGeneration;
    return persistenceReady.then(function(){
    if(persistenceLoadError||!interview)throw persistenceLoadError||new Error('Interview is not ready');
    var recovery=$('[data-voice-recovery]');if(recovery)recovery.hidden=true;
    if(!voiceInterviewer)voiceInterviewer=buildVoiceInterviewer();
    if(!voiceInterviewer){voiceFailed({code:'voice_unsupported'});return Promise.reject(new Error('Voice unsupported'));}
    if(voiceInterviewer.state()==='paused'){voiceInterviewer.resume();syncVoiceCaptureControl();return Promise.resolve(true);}
    if(voiceStart)return voiceStart;
    voiceStart=voiceInterviewer.start();
    Promise.all([voiceStart,persistenceReady]).then(function(){
      if(generation!==voiceGeneration||voiceIntent!=='talk')return;
      if(completedConversation){if(!voiceOrientationSpoken){var completionAccepted=voiceInterviewer.speak('Your '+FAS.agent.current.name+' work is complete. You can ask me anything. I can also help you review or edit it, or start EXTRACT next.');if(completionAccepted===false)throw new Error('Voice opening was not accepted');voiceOrientationSpoken=true;}setVoiceStatus('ADAM is listening for your question.',false);return;}
      if(!interview||!interview.currentQuestion())throw new Error('Interview is not ready');
      if(voiceOrientationSpoken)return;
      var orientation='You are in hands-free interview mode. Take your time. You can say repeat the question, pause, switch to typing, or end. ';
      var exactQuestion=interview.currentQuestion().question;
      var opening=restoredInterview?'Welcome back. Let’s continue where you left off. ':orientation;
      var accepted=voiceInterviewer.speak(opening+exactQuestion);
      if(accepted===false)throw new Error('Voice opening was not accepted');
      voiceOrientationSpoken=true;
      setVoiceStatus(restoredInterview?'Saved interview restored. ADAM will listen after the question.':'Hands-free interview started. ADAM will listen after the question.',false);
    }).catch(function(){if(generation===voiceGeneration&&voiceIntent==='talk')voiceFailed({code:'voice_connection_failed'});});
    return voiceStart;
    });
  }

  function classifyVoiceCommand(text){
    var value=String(text||'').toLowerCase().replace(/[^a-z\s]/g,' ').replace(/\s+/g,' ').trim();
    if(/^(repeat|repeat the question|say that again|repeat that)$/.test(value))return'repeat';
    if(/^(pause|pause interview|pause the interview|stop listening)$/.test(value))return'pause';
    if(/^(switch to typing|switch to type|type instead|use typing)$/.test(value))return'switch_to_type';
    if(/^(let s )?(move|go|continue|proceed) (on )?to extract$/.test(value)||/^(start|open) extract$/.test(value)||/^take me to extract$/.test(value))return'go_to_extract';
    if(/^(end|end interview|end the interview|stop interview|finish voice)$/.test(value))return'end';
    return null;
  }

  function handleVoiceCommand(command){
    if(!voiceInterviewer)return Promise.resolve();
    if(command==='repeat'){
      var question=interview&&interview.currentQuestion();
      if(question&&voiceIntent==='talk')voiceInterviewer.speak(question.question);
      setVoiceStatus('Repeating the current question.',false);
    }else if(command==='pause'){
      voiceIntent='paused';voiceInterviewer.pause();setVoiceStatus('Voice is paused. Press the mic to resume.',false);
    }else if(command==='switch_to_type'){
      switchToTyping();
    }else if(command==='go_to_extract'){
      var extract=$('[data-start-extract]');
      if(extract){voiceIntent='stopped';voiceInterviewer.pause();setVoiceStatus('Opening EXTRACT...',false);window.location.assign(extract.href);}
    }else if(command==='end'){
      return endVoiceInterview();
    }
    return Promise.resolve();
  }

  function restoreBlueprintRetry(status){
    artifactRetryPending=true;
    if(form)form.removeAttribute('aria-busy');
    var button=form&&form.querySelector('[type="submit"]');
    if(button){button.disabled=false;button.textContent='Retry blueprint';}
    if(status)status.textContent='Your answers are saved, but the blueprint could not be prepared. Retry blueprint.';
  }

  function runVoiceCompletion(completionUrl,status){
    if(voiceCompletionPromise)return voiceCompletionPromise;
    var shouldSpeak=voiceIntent==='talk';
    voiceIntent='completing';voiceGeneration+=1;voiceSaving=false;
    var completionMessage=voiceCompletionCopy();
    announceCompletion();
    if(status)status.textContent='Finishing the interview…';
    setVoiceStatus('Interview complete. ADAM is closing the conversation before preparing your blueprint…',false);
    var playback=Promise.resolve();
    if(voiceInterviewer){voiceInterviewer.pause();syncVoiceCaptureControl();if(shouldSpeak)playback=Promise.resolve(voiceInterviewer.speak(completionMessage));}
    var boundedPlayback=Promise.race([playback,new Promise(function(resolve){setTimeout(resolve,5000);})]);
    voiceCompletionPromise=boundedPlayback.then(function(){
      if(status)status.textContent='Generating your blueprint…';
      setVoiceStatus('Your answers are saved. Your blueprint is being prepared…',false);
      return generateBlueprint(completionUrl,status);
    }).then(function(result){voiceIntent='talk';if(voiceInterviewer){voiceInterviewer.resume();syncVoiceCaptureControl();voiceInterviewer.speak('Your blueprint is ready. Ask me anything about it, edit an answer, or start EXTRACT next.');}return result;}).catch(function(error){voiceCompletionPromise=null;restoreBlueprintRetry(status);throw error;});
    return voiceCompletionPromise;
  }

  function handleVoiceTurn(turn){
    if(retryConfirmationPending)return handleRetryConfirmation(turn.text,'talk');
    if(FAS.retry&&FAS.retry.classify(turn.text)==='request')return requestRetryConfirmation(turn.text,'talk');
    var command=classifyVoiceCommand(turn.text);
    if(command)return handleVoiceCommand(command);
    FAS.voice.setTranscript(turn.text);
    if(completedConversation)return submitPostCompletionMessage(turn.text,'talk',turn.turnId);
    if(voiceIntent!=='talk'){preserveVoiceDraft(turn.text);return Promise.resolve();}
    if(voiceTurnPromise){
      if(voiceInterviewer)voiceInterviewer.pause();
      preserveVoiceDraft(turn.text);
      setVoiceStatus('I caught additional words while the prior answer was saving. They are waiting in Type for review.',true);
      return voiceTurnPromise;
    }
    if(!interviewCoordinator){preserveVoiceDraft(turn.text);voiceFailed({code:'voice_not_ready'});return Promise.resolve();}
    var generation=voiceGeneration;
    voiceSaving=true;if(voiceInterviewer)voiceInterviewer.pause();syncVoiceCaptureControl();
    conversationHistory.push({role:'user',content:turn.text,voiceTurnId:turn.turnId});
    FAS.orb.setState('thinking');
    setVoiceStatus('Saving your spoken answer…',false);
    if(voiceInterviewer)voiceInterviewer.speak('Got it—let me capture that.');
    var answerSaved=false,status=$('[data-answer-status]'),completionUrl=getCompletionUrl();
    var work=interviewCoordinator.submit({text:turn.text,source:'talk',turnId:turn.turnId}).then(function(result){
      answerSaved=true;
      if(status)status.textContent='Answer saved.';
      emit('fas:answer-saved',{answer:result.saved});emit('fas:checkpoint',{checkpoint:result.checkpoint});
      if(result.saved)FAS.chat.addMessage({role:'user',text:turn.text,tag:'YOU'});
      if(result.nextQuestion){
        FAS.chat.addMessage({role:'agent',text:result.message});
        renderCurrentQuestion({question:result.nextQuestion},true);
        setVoiceStatus('Answer saved. ADAM is continuing the interview.',false);
        voiceSaving=false;
        if(generation===voiceGeneration&&voiceIntent==='talk'&&voiceInterviewer){voiceInterviewer.resume();syncVoiceCaptureControl();voiceInterviewer.speak(result.message);}
      }
      if(result.summary)FAS.chat.addMessage({role:'note',text:'Checkpoint saved · Review recent answers anytime in History.',tag:'CHECKPOINT',variant:'checkpoint'});
      if(result.completion.gaps.length)emit('fas:interview-gap',{gaps:result.completion.gaps});
      if(result.completion.complete)return runVoiceCompletion(completionUrl,status);
      return result;
    }).catch(function(){
      if(!answerSaved){
        var latest=conversationHistory[conversationHistory.length-1];if(latest&&latest.voiceTurnId===turn.turnId)conversationHistory.pop();
        if(status)status.textContent='Save failed. Your spoken answer has not been stored.';
        preserveVoiceDraft(turn.text);
        setVoiceStatus('Your spoken answer could not be saved. It is waiting in Type so you can retry safely.',true);
      }else{
        restoreBlueprintRetry(status);
        setVoiceStatus('Your interview is safely saved. Blueprint generation needs another try.',true);
      }
    });
    var tracked=work.finally(function(){voiceSaving=false;syncVoiceCaptureControl();if(voiceTurnPromise===tracked)voiceTurnPromise=null;});
    voiceTurnPromise=tracked;
    return tracked;
  }

  function switchToTyping(){
    voiceIntent='type';voiceGeneration+=1;
    if(voiceInterviewer){
      var draft=voiceInterviewer.partialTranscript();
      voiceInterviewer.pause();
      preserveVoiceDraft(draft);
    }
    FAS.mode('text');
    if(input)input.focus();
    setVoiceStatus('Voice paused. Your unfinished words are available in Type.',false);
  }

  function endVoiceInterview(){
    voiceIntent='ended';voiceGeneration+=1;
    emit('fas:voice-end');
    if(!voiceInterviewer){FAS.orb.setState('stopped');return Promise.resolve();}
    setVoiceStatus('Ending voice safely after any answer finishes saving…',false);
    return voiceInterviewer.stop({waitFor:voiceTurnPromise}).then(function(){FAS.orb.setState('stopped');});
  }

  function handleVoiceMicClick(){
    if(!voiceInterviewer)return startVoiceInterview();
    var state=voiceInterviewer.state();
    if(state==='paused'){voiceIntent='talk';voiceGeneration+=1;var resumed=voiceInterviewer.resume();syncVoiceCaptureControl();return resumed;}
    if(state==='error'||state==='unsupported'||state==='stopped')return retryVoiceInterview();
    if(state==='listening'||state==='thinking'||state==='speaking'){voiceIntent='paused';voiceGeneration+=1;voiceInterviewer.pause();syncVoiceCaptureControl();return;}
    if(state==='idle')return startVoiceInterview();
  }

  function retryVoiceInterview(){
    voiceIntent='ended';voiceGeneration+=1;
    var previous=voiceInterviewer;
    voiceInterviewer=null;voiceStart=null;voiceOrientationSpoken=false;
    var stopped=previous?previous.stop({waitFor:voiceTurnPromise}):Promise.resolve();
    return stopped.then(startVoiceInterview);
  }

  function activateVoiceMode(){
    if(!voiceInterviewer)return startVoiceInterview();
    var state=voiceInterviewer.state();
    if(state==='error'||state==='unsupported'||state==='stopped')return retryVoiceInterview();
    if(state==='paused'||state==='idle')return startVoiceInterview();
    return Promise.resolve(true);
  }

  var voiceTab=document.getElementById('tab-voice');if(voiceTab)voiceTab.addEventListener('click',function(){activateVoiceMode().catch(function(){});});

  var voiceRetry=$('[data-voice-retry]');if(voiceRetry)voiceRetry.addEventListener('click',function(){if(persistenceLoadError)loadPersistence().catch(function(){});else retryVoiceInterview();});
  var voiceTypeInstead=$('[data-voice-type-instead]');if(voiceTypeInstead)voiceTypeInstead.addEventListener('click',switchToTyping);

  function closeDrawers() {
    $$('[data-chat-history-drawer], [data-chat-saved-drawer], [data-chat-trust-drawer]').forEach(function (drawer) { drawer.hidden = true; });
    var drawerScrim = $('.chat-drawer-scrim');
    if (drawerScrim) drawerScrim.hidden = true;
    document.body.classList.remove('drawer-open');
  }

  $$('[data-drawer-target]').forEach(function (button) {
    button.addEventListener('click', function () {
      closeDrawers();
      var drawer = document.getElementById(button.getAttribute('data-drawer-target'));
      if (!drawer) return;
      drawer.hidden = false;
      var drawerScrim = $('.chat-drawer-scrim');
      if (drawerScrim) drawerScrim.hidden = false;
      document.body.classList.add('drawer-open');
      var close = $('[data-drawer-close]', drawer);
      if (close) close.focus();
    });
  });
  $$('[data-drawer-close]').forEach(function (button) { button.addEventListener('click', closeDrawers); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeDrawers(); });

  function downloadSavedWork() {
    var agent = FAS.agent.current;
    var feed = $('[data-agent-saved]');
    if (!agent || !feed) return;
    var lines = [
      'FAS Saved Work',
      agent.name + ' — Step ' + agent.step + ' of ' + (FAS.agentAccess&&FAS.agentAccess.getAccess?FAS.agentAccess.getAccess().length:2),
      'Downloaded: ' + new Date().toLocaleDateString(),
      ''
    ];
    $$('.feed__item', feed).forEach(function (item) {
      var name = $('.feed__name', item);
      var value = $('.feed__value', item);
      lines.push((name ? name.textContent.trim() : 'Saved field') + ':');
      lines.push(value ? value.textContent.trim() : '');
      lines.push('');
    });
    var content = lines.join('\n');
    var file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(file);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'FAS-' + agent.name + '-saved-work.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  var downloadSavedButton = $('[data-download-saved]');
  if (downloadSavedButton) downloadSavedButton.addEventListener('click', downloadSavedWork);

  function exportArtifact(format) {
    if (!projectStore || !FAS.artifacts) return;
    projectStore.loadProject().then(function (project) {
      var versions=(project.artifactVersions||[]).filter(function(version){return version.agentKey===FAS.agent.current.key||version.artifactId&&version.artifactId.indexOf(FAS.agent.current.key)>=0;}),artifact=versions.filter(function(version){return version.status==='user_approved';}).pop()||versions.pop()||FAS.artifacts.build(FAS.agent.current.key, project);
      return apiFetch('/api/exports', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({format:format,artifact:artifact}) });
    }).then(function (response) {
      if (!response.ok) throw new Error('Export failed');
      var disposition=response.headers.get('Content-Disposition')||'',match=disposition.match(/filename="([^"]+)"/);
      return Promise.all([response.blob(),match&&match[1]||('FAS-export.'+format)]);
    }).then(function (result) {
      var url=URL.createObjectURL(result[0]),link=document.createElement('a');link.href=url;link.download=result[1];document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
    }).catch(function () { var status=$('[data-answer-status]');if(status)status.textContent='Export could not be generated. Your answers remain saved.'; });
  }
  $$('[data-export-format]').forEach(function(button){button.addEventListener('click',function(){exportArtifact(button.getAttribute('data-export-format'));});});

  FAS.chat = {
    addMessage: function (opts) {
      var target = thread;
      if (!target) return null;
      var o = opts || {};
      var node = build(o.role || 'agent', o.text || '', o.tag);
      if (!node) return null;
      if (o.variant) node.classList.add('msg--' + o.variant);
      target.appendChild(node);
      var history = $('[data-chat-history]');
      if (history) history.appendChild(node.cloneNode(true));
      target.scrollTop = target.scrollHeight;
      return node;
    },
    setTyping: function (on) {
      var t = $('[data-chat-typing]');
      if (t) t.hidden = !on;
    }
  };

  function requestConversationalReply(answer, nextQuestion) {
    var fallback = nextQuestion;
    FAS.chat.setTyping(true);
    return apiFetch('/api/chat-response', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agent:{key:FAS.agent.current.key,name:FAS.agent.current.name,title:FAS.agent.current.title},answer:answer,nextQuestion:nextQuestion,history:conversationHistory.slice(0,-1).slice(-12)})}, 8000).then(function(response){if(!response.ok)throw new Error('Conversation unavailable');return response.json();}).then(function(payload){return payload.message||fallback;}).catch(function(){return fallback;}).then(function(message){FAS.chat.setTyping(false);conversationHistory.push({role:'assistant',content:message});return message;});
  }

  function submitPostCompletionMessage(text,source,turnId){
    var value=String(text||'').trim();if(!value)return Promise.resolve();
    if(turnId&&completedTurnIds.has(turnId))return Promise.resolve();if(turnId)completedTurnIds.add(turnId);
    FAS.chat.addMessage({role:'user',text:value,tag:'YOU'});conversationHistory.push({role:'user',content:value});FAS.chat.setTyping(true);
    var status=$('[data-answer-status]');if(status)status.textContent='ADAM is thinking…';
    return apiFetch('/api/advisory-response',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agent:{key:FAS.agent.current.key,name:FAS.agent.current.name,title:FAS.agent.current.title},message:value,completedSummary:completedSummary,history:conversationHistory.slice(0,-1).slice(-12)})}).then(function(response){if(!response.ok)throw new Error('Advisory response unavailable');return response.json();}).then(function(payload){var message=payload.message||'Your completed work is safe. We can review it, edit an answer, or continue to EXTRACT.';conversationHistory.push({role:'assistant',content:message});FAS.chat.addMessage({role:'agent',tag:'ADAM',text:message});if(status)status.textContent='';if(source==='talk'&&voiceInterviewer&&voiceIntent==='talk'){voiceInterviewer.resume();syncVoiceCaptureControl();return voiceInterviewer.speak(message);}return message;}).catch(function(){var fallback='I could not answer that just now, but your completed work is safe. You can view the blueprint, edit an answer, retry '+FAS.agent.current.name+', or start EXTRACT.';conversationHistory.push({role:'assistant',content:fallback});FAS.chat.addMessage({role:'agent',tag:'ADAM',text:fallback});if(status)status.textContent='Conversation unavailable. Your saved work is unchanged.';if(source==='talk'&&voiceInterviewer&&voiceIntent==='talk'){voiceInterviewer.resume();syncVoiceCaptureControl();return voiceInterviewer.speak(fallback);}return fallback;}).finally(function(){FAS.chat.setTyping(false);});
  }

  function synthesizeCompletedArtifact(project, artifact) {
    if (FAS.agent.current.key !== 'anchor' || !FAS.artifacts.applySynthesis) return Promise.resolve(artifact);
    var answers=(project.answers||[]).filter(function(answer){var permission=answer.permissionStatus||answer.permission_status||'not_required';return(answer.agentKey==='anchor'||answer.agent_key==='anchor')&&permission!=='private'&&permission!=='pending';}).map(function(answer){return{id:answer.id,field:answer.field||answer.field_path,text:answer.text||(answer.value&&answer.value.text)||answer.value,basis:answer.basis||'user',permissionStatus:answer.permissionStatus||answer.permission_status||'not_required'};});
    return apiFetch('/api/artifact-synthesis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agentKey:'anchor',answers:answers})}).then(function(response){if(!response.ok)throw new Error('Synthesis unavailable');return response.json();}).then(function(payload){return FAS.artifacts.applySynthesis(artifact,payload.sections);}).catch(function(){return artifact;});
  }

  function voiceCompletionCopy(){var label=FAS.agent.current.key==='anchor'?'Trusted Expert Blueprint':FAS.agent.current.title;return'Great—you’ve finished '+FAS.agent.current.name+'. Your answers are saved. I’m generating your '+label+' now. Next, you’ll review it and choose your PDF design.';}
  function announceCompletion(){if(completionAnnounced)return;completionAnnounced=true;FAS.chat.addMessage({role:'agent',tag:'ADAM',variant:'completion',text:voiceCompletionCopy()});if(input)input.disabled=true;var button=form&&form.querySelector('[type="submit"]');if(button)button.disabled=true;$$('[data-agent-stages] .stage').forEach(function(stage){stage.classList.remove('is-active');stage.classList.add('is-done');stage.removeAttribute('aria-current');});}

  function generateBlueprint(completionUrl,status){if(blueprintPromise)return blueprintPromise;if(form)form.setAttribute('aria-busy','true');var button=form&&form.querySelector('[type="submit"]');if(button)button.disabled=true;blueprintPromise=projectStore.loadProject().then(function(project){var artifact=FAS.artifacts.build(FAS.agent.current.key,project);return synthesizeCompletedArtifact(project,artifact);}).then(function(artifact){emit('fas:artifact-ready',{artifact:artifact});return projectStore.saveArtifact(artifact);}).then(function(saved){artifactRetryPending=false;if(status)status.textContent='Blueprint ready. ADAM is available for questions.';return projectStore.loadProject().then(function(project){enterCompletedConversation(project);if(form)form.removeAttribute('aria-busy');return saved;});}).catch(function(error){blueprintPromise=null;throw error;});return blueprintPromise;}

  function send() {
    if (!input) return;
    if(form&&form.getAttribute('aria-busy')==='true')return;
    var retryText=input.value.trim();
    if(retryConfirmationPending){if(!retryText){input.focus();return;}input.value='';input.focus();handleRetryConfirmation(retryText,'type');return;}
    if(FAS.retry&&FAS.retry.classify(retryText)==='request'){input.value='';input.focus();requestRetryConfirmation(retryText,'type');return;}
    if(completedConversation){var postText=retryText;if(!postText){input.focus();return;}input.value='';input.focus();submitPostCompletionMessage(postText,'type',createTurnId('type'));return;}
    var completionUrl=getCompletionUrl();
    if (interview && !interview.currentQuestion()) {if(artifactRetryPending){var retryStatus=$('[data-answer-status]'),retryButton=form&&form.querySelector('[type="submit"]');announceCompletion();if(retryStatus)retryStatus.textContent='Generating your blueprint…';if(retryButton)retryButton.textContent='Building…';generateBlueprint(completionUrl,retryStatus).catch(function(){if(form)form.removeAttribute('aria-busy');if(retryStatus)retryStatus.textContent='Blueprint generation failed. Your answers are saved; try again.';if(retryButton){retryButton.disabled=false;retryButton.textContent='Retry blueprint';}});}else window.location.assign(completionUrl);return; }
    var text = input.value.trim();
    if (!text) { input.focus(); return; }
    FAS.chat.addMessage({ role: 'user', text: text, tag: 'YOU' });
    conversationHistory.push({role:'user',content:text});
    input.value = '';
    input.focus();
    var status = $('[data-answer-status]');
    if (status) status.textContent = 'Saving answer…';
    emit('fas:send', { text: text });
    if (!interview || !projectStore || !interviewCoordinator) { if(status)status.textContent='Interview is still loading. Your answer is still in this page history.'; return; }
    var submitButton=form&&form.querySelector('[type="submit"]');
    if(form)form.setAttribute('aria-busy','true');if(submitButton)submitButton.disabled=true;
    var durableSaved=false;
    interviewCoordinator.submit({text:text,source:'type',turnId:createTurnId('type')}).then(function (result) {
      durableSaved=true;
      if(status)status.textContent='Answer saved.';
      emit('fas:answer-saved', { answer: result.saved });
      emit('fas:checkpoint', { checkpoint: result.checkpoint });
      if(result.nextQuestion){FAS.chat.addMessage({role:'agent',text:result.message});renderCurrentQuestion({question:result.nextQuestion},true);}
      if (result.summary) FAS.chat.addMessage({ role: 'note', text: 'Checkpoint saved · Review recent answers anytime in History.', tag: 'CHECKPOINT', variant: 'checkpoint' });
      var completion = result.completion;
      if (completion.gaps.length) emit('fas:interview-gap', { gaps: completion.gaps });
      if (completion.complete) {announceCompletion();if(status)status.textContent='Generating your blueprint…';return generateBlueprint(completionUrl,status);}
    }).catch(function () {if(!durableSaved){if (status) status.textContent = 'Save failed. Your answer is ready to retry and has not been stored.';if(input&&!input.value)input.value=text;}else{artifactRetryPending=true;if(status)status.textContent='Your answers are saved, but the blueprint could not be prepared. Retry blueprint.';if(submitButton)submitButton.textContent='Retry blueprint';}}).finally(function(){if(!blueprintPromise){if(form)form.removeAttribute('aria-busy');if(submitButton)submitButton.disabled=false;}});
  }

  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); send(); });
  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
  }

  document.addEventListener('click', function (event) {
    var view=event.target.closest('[data-view-blueprint]');
    if(view){window.location.assign(view.getAttribute('data-href')||getCompletionUrl());return;}
    var editAnswers=event.target.closest('[data-edit-answers]');
    if(editAnswers){var savedToggle=$('[data-chat-saved-toggle]');if(savedToggle)savedToggle.click();return;}
    var retry=event.target.closest('[data-retry-agent], [data-chat-retry]');
    if(retry){requestRetryConfirmation('',voiceIntent==='talk'?'talk':'type');return;}
    var edit=event.target.closest('[data-edit-answer]');
    if(!edit||!projectStore)return;
    var item=edit.closest('.feed__item'),valueNode=item&&$('.feed__value',item),current=valueNode?valueNode.textContent.trim():'',revised=window.prompt('Edit this saved answer:',current);
    if(revised===null||!revised.trim()||revised.trim()===current)return;
    edit.disabled=true;
    var status=$('[data-answer-status]');if(status)status.textContent='Saving your revision...';
    projectStore.reviseAnswer(edit.getAttribute('data-edit-answer'),revised).then(function(){blueprintPromise=null;return projectStore.loadProject();}).then(function(project){renderEditableSavedAnswers(project);completedSummary=buildCompletedSummary(project);return generateBlueprint(getCompletionUrl(),status);}).then(function(){if(status)status.textContent='Revision saved and blueprint updated.';}).catch(function(){edit.disabled=false;if(status)status.textContent='That revision could not be saved. Your previous answer is unchanged.';});
  });

  $$('[data-chat-hint]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.textContent.trim();
      FAS.chat.addMessage({ role: 'note', text: 'Try answering this: ' + text, tag: 'HINT' });
      emit('fas:hint', { text: text });
    });
  });
  $$('[data-chat-unsure]').forEach(function (b) {
    b.addEventListener('click', function () {
      FAS.chat.addMessage({ role: 'note', text: 'No problem. I marked this as a gap and will come back to it. I will not fill it in for you.', tag: 'NOTE' });
      emit('fas:not-sure');
    });
  });
})();
