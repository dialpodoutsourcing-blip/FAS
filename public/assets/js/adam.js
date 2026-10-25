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
  $$('[data-goto-text]').forEach(function (b) { b.addEventListener('click', function () { FAS.mode('text'); }); });
  if (window.location.hash === '#voice') FAS.mode('voice');

  /* ---------------- ORB ---------------- */
  var LABELS = {
    idle: 'Tap the mic and start talking',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'ADAM is talking'
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
      var listening = FAS.orb.state !== 'listening';
      FAS.orb.setState(listening ? 'listening' : 'idle');
      emit('fas:mic', { listening: listening });
    });
  }
  var endBtn = $('[data-voice-end]');
  if (endBtn) {
    endBtn.addEventListener('click', function () {
      FAS.orb.setState('idle');
      emit('fas:voice-end');
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
      setText('[data-agent-step]', 'Step ' + agent.step + ' of 7');
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
  var projectStore = null;
  var restartAgent = query.get('restart') === '1' ? (agentKey || 'anchor') : null;
  var interview = null;
  var artifactRetryPending = false;
  var conversationHistory = [];
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
    projectStore = FAS.projectStore && FAS.projectStore.create({configured:config.configured===true,config:config,authState:authState,auth:FAS.auth,agentKey:agentKey,projectId:projectId,sessionId:account&&account.sessions&&account.sessions[agentKey]||query.get('session'),onAuthFailure:function(){window.location.assign('account.html?return='+encodeURIComponent(window.location.pathname+window.location.search));}});
    var restartReady = restartAgent && projectStore ? projectStore.resetAgent(restartAgent).then(function(){query.delete('restart');var cleanUrl=window.location.pathname+(query.toString()?'?'+query.toString():'')+window.location.hash;window.history.replaceState({},'',cleanUrl);}) : Promise.resolve();
    if (projectStore && FAS.interview) return restartReady.then(function(){return projectStore.loadAgentCatalog();}).then(function(catalog){
      if (catalog.length && FAS.agents && FAS.agents.applyCatalog) {FAS.agents.applyCatalog(catalog);FAS.agent.render(agentKey);}
      return projectStore.loadProject();
    }).then(function(project){
      interview=FAS.interview.create({agent:FAS.agent.current,state:project&&project.checkpoints&&project.checkpoints[FAS.agent.current.key]});
      renderCurrentQuestion(interview.currentQuestion());
      var hasArtifact=(project&&project.artifacts||[]).some(function(artifact){return artifact.agentKey===FAS.agent.current.key||artifact.agent_key===FAS.agent.current.key;});
      if(!interview.currentQuestion()&&!hasArtifact){artifactRetryPending=true;var retryButton=form&&form.querySelector('[type="submit"]');if(retryButton)retryButton.textContent='Retry blueprint';var retryStatus=$('[data-answer-status]');if(retryStatus)retryStatus.textContent='Your answers are saved. Retry blueprint generation.';}
      (project&&project.answers||[]).filter(function(answer){return answer.agentKey===FAS.agent.current.key||answer.agent_key===FAS.agent.current.key;}).forEach(function(answer){var savedText=answer.text||answer.value;FAS.chat.addMessage({role:'user',text:savedText,tag:'SAVED'});conversationHistory.push({role:'user',content:savedText});});
    }).catch(function(){if(FAS.interview){interview=FAS.interview.create({agent:FAS.agent.current});renderCurrentQuestion(interview.currentQuestion());}});
  }
  (FAS.authReady||Promise.resolve({mode:'local'})).then(initializePersistence);

  function apiFetch(url,init){var config=window.FAS_CONFIG||{};if(!config.configured||!FAS.auth||!FAS.auth.requireSession)return fetch(url,init);return FAS.auth.requireSession().then(function(session){var next=Object.assign({},init||{}, {headers:Object.assign({},init&&init.headers||{},{Authorization:'Bearer '+session.accessToken})});return fetch(url,next);});}

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
      agent.name + ' — Step ' + agent.step + ' of 7',
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
    return apiFetch('/api/chat-response', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agent:{key:FAS.agent.current.key,name:FAS.agent.current.name,title:FAS.agent.current.title},answer:answer,nextQuestion:nextQuestion,history:conversationHistory.slice(0,-1).slice(-12)})}).then(function(response){if(!response.ok)throw new Error('Conversation unavailable');return response.json();}).then(function(payload){return payload.message||fallback;}).catch(function(){return fallback;}).then(function(message){FAS.chat.setTyping(false);conversationHistory.push({role:'assistant',content:message});return message;});
  }

  function synthesizeCompletedArtifact(project, artifact) {
    if (FAS.agent.current.key !== 'anchor' || !FAS.artifacts.applySynthesis) return Promise.resolve(artifact);
    var answers=(project.answers||[]).filter(function(answer){var permission=answer.permissionStatus||answer.permission_status||'not_required';return(answer.agentKey==='anchor'||answer.agent_key==='anchor')&&permission!=='private'&&permission!=='pending';}).map(function(answer){return{id:answer.id,field:answer.field||answer.field_path,text:answer.text||(answer.value&&answer.value.text)||answer.value,basis:answer.basis||'user',permissionStatus:answer.permissionStatus||answer.permission_status||'not_required'};});
    return apiFetch('/api/artifact-synthesis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agentKey:'anchor',answers:answers})}).then(function(response){if(!response.ok)throw new Error('Synthesis unavailable');return response.json();}).then(function(payload){return FAS.artifacts.applySynthesis(artifact,payload.sections);}).catch(function(){return artifact;});
  }

  function generateBlueprint(completionUrl,status){return projectStore.loadProject().then(function(project){var artifact=FAS.artifacts.build(FAS.agent.current.key,project);return synthesizeCompletedArtifact(project,artifact);}).then(function(artifact){emit('fas:artifact-ready',{artifact:artifact});return projectStore.saveArtifact(artifact);}).then(function(saved){artifactRetryPending=false;if(status)status.textContent='Blueprint ready.';window.location.assign(completionUrl);return saved;});}

  function send() {
    if (!input) return;
    if(form&&form.getAttribute('aria-busy')==='true')return;
    var completionUrl='review.html?asset='+encodeURIComponent(FAS.agent.current.key)+(projectId!=='local-default'?'&project='+encodeURIComponent(projectId):'');
    if (interview && !interview.currentQuestion()) {if(artifactRetryPending){var retryStatus=$('[data-answer-status]'),retryButton=form&&form.querySelector('[type="submit"]');if(retryStatus)retryStatus.textContent='Building your blueprint…';if(retryButton){retryButton.disabled=true;retryButton.textContent='Building…';}generateBlueprint(completionUrl,retryStatus).catch(function(){if(retryStatus)retryStatus.textContent='Blueprint generation failed. Your answers are saved; try again.';if(retryButton){retryButton.disabled=false;retryButton.textContent='Retry blueprint';}});}else window.location.assign(completionUrl);return; }
    var text = input.value.trim();
    if (!text) { input.focus(); return; }
    FAS.chat.addMessage({ role: 'user', text: text, tag: 'YOU' });
    conversationHistory.push({role:'user',content:text});
    input.value = '';
    input.focus();
    var status = $('[data-answer-status]');
    if (status) status.textContent = 'Saving answer…';
    emit('fas:send', { text: text });
    if (!interview || !projectStore) { if(status)status.textContent='Interview is still loading. Your answer is still in this page history.'; return; }
    var submitButton=form&&form.querySelector('[type="submit"]');
    if(form)form.setAttribute('aria-busy','true');if(submitButton)submitButton.disabled=true;
    var previousCheckpoint=interview.checkpoint();
    var durableSaved=false;
    var result = interview.acceptAnswer({ text: text });
    Promise.resolve().then(function(){return projectStore.saveAnswerCheckpoint(Object.assign({ agentKey: FAS.agent.current.key }, result.answer),Object.assign({ agentKey: FAS.agent.current.key }, interview.checkpoint()));}).then(function (saved) {
      interview.reconcileAnswer(result.answer.id,saved);
      if(status)status.textContent='Answer saved.';
      emit('fas:answer-saved', { answer: saved });
      return interview.checkpoint();
    }).then(function (checkpoint) {
      durableSaved=true;
      emit('fas:checkpoint', { checkpoint: checkpoint });
      var nextQuestion=result.followUps.length?result.followUps[0].question:result.nextQuestion&&result.nextQuestion.question;
      if(nextQuestion){return requestConversationalReply(text,nextQuestion).then(function(message){FAS.chat.addMessage({role:'agent',text:message});renderCurrentQuestion({question:nextQuestion},true);return checkpoint;});}
      return checkpoint;
    }).then(function () {
      if (result.summary) FAS.chat.addMessage({ role: 'note', text: 'Checkpoint saved · Review recent answers anytime in History.', tag: 'CHECKPOINT', variant: 'checkpoint' });
      var completion = interview.completion();
      if (completion.gaps.length) emit('fas:interview-gap', { gaps: completion.gaps });
      if (completion.complete) {if(status)status.textContent='Building your blueprint…';return generateBlueprint(completionUrl,status);}
    }).catch(function () {if(!durableSaved){interview.restore(previousCheckpoint);if (status) status.textContent = 'Save failed. Your answer is ready to retry and has not been stored.';if(input&&!input.value)input.value=text;}else{artifactRetryPending=true;if(status)status.textContent='Your answers are saved, but the blueprint could not be prepared. Retry blueprint.';if(submitButton)submitButton.textContent='Retry blueprint';}}).finally(function(){if(form)form.removeAttribute('aria-busy');if(submitButton)submitButton.disabled=false;});
  }

  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); send(); });
  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
  }

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
