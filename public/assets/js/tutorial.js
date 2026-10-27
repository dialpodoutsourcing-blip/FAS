(function (root) {
  'use strict';

  function S(id, chapter, label, title, description, target, arrow, action, speech) {
    return Object.freeze({ id:id, chapter:chapter, label:label, title:title, description:description, speech:speech || description, view:chapter, target:target, arrow:arrow, action:action || '' });
  }
  var TOUR_STEPS = Object.freeze([
    S('meet-adam','dashboard','Meet ADAM','Your authority-building guide','ADAM guides you through FAS and helps turn your experience into a clear, usable authority system.','welcome','center','',"Hi, I'm ADAM. I'll guide you through FAS and help turn what you know into a clear authority position, useful business assets, and a system you can confidently launch."),
    S('welcome','dashboard','Welcome','Your Fitness Authority System','FAS connects your available specialists and finished assets in one guided workflow.','welcome','center','',"FAS is your Fitness Authority System. Your available specialists work together here, beginning with your position and story. Everything they create stays connected in your Vault."),
    S('main-nav','dashboard','Navigate','Everything important stays within reach','Use the main navigation to return home, work with ADAM, review finished assets, or prepare your launch.','main-navigation','right'),
    S('specialist-team','dashboard','Your team','Your specialists, one connected workflow','Each available specialist owns a specific outcome and contributes to one connected authority system.','specialists','right'),
    S('continue-work','dashboard','Resume','Continue exactly where you left off','FAS shows the current step and saved progress so you always know where to restart.','resume','bottom'),
    S('expert-account','dashboard','Your account','Your expert identity and settings','This area confirms whose system is active, shows save status, and opens account settings.','account','right'),
    S('agent-identity','adam','The specialist','Know who is guiding you','The agent badge names the current specialist, its responsibility, and your place in the seven-part system.','agent-identity','bottom'),
    S('agent-stages','adam','Session map','A clear path through every conversation','The stage tracker breaks a complex result into small questions and shows what is complete and ahead.','stages','bottom'),
    S('type-or-talk','adam','Choose your mode','Type or speak—use what feels natural','Switch between written and voice input. The guided demo changes only the visual state.','input-modes','bottom','switchInputMode'),
    S('talk-mode','adam','Talk naturally','Answer ADAM with your voice','Choose Talk when speaking feels easier than typing. In the real experience, ADAM listens to your spoken answer; this guided preview selects Talk without turning on your microphone.','input-modes','bottom','selectTalkMode'),
    S('guided-conversation','adam','Guidance','One useful question at a time','ADAM keeps the conversation focused and asks the next question needed to build your deliverable.','conversation','left'),
    S('answer-composer','adam','Your answer','Give a real answer, not a perfect one','Write as much or as little as you know. The demo can insert sample text without saving it.','composer','top','fillSampleAnswer'),
    S('answer-hints','adam','Helpful prompts','Use a prompt when you get stuck','Prompt chips offer concrete ways into the question, including a safe “I am not sure” option.','hints','top'),
    S('saved-history','adam','Saved work','Your strongest material stays visible','Saved work lets you review approved answers, suggestions, and the fields being built.','saved-work','left','toggleDemoPanel'),
    S('trust-adam','adam','Trust','You remain the final authority','ADAM separates evidence from suggestions and never uses important claims without your approval.','trust','left','toggleDemoPanel'),
    S('vault-assets','vault','Your vault','Every conversation produces a useful asset','The Vault organizes every specialist output into clear, reviewable business documents.','assets','bottom','selectDemoAsset'),
    S('vault-edit','vault','Revise','Return to the right specialist to improve it','Edit normally reopens the responsible specialist while preserving your completed work.','edit','top'),
    S('vault-download','vault','Export','Take a polished PDF with you','Download normally creates a presentation-ready document; the guided demo never starts a file.','download','top'),
    S('launch-readiness','launch','Readiness','See what is ready before you launch','The readiness overview connects completed authority assets to the work required for rollout.','readiness','bottom'),
    S('launch-timeline','launch','Timeline','Move from preparation to onboarding','Launch views organize preparation, audience warming, opening, and onboarding.','timeline','top'),
    S('launch-owners','launch','Ownership','Every important action has an owner','Dates, responsibilities, and next actions make the plan executable.','owners','left'),
    S('launch-review','launch','Review','Your system is connected','FAS connects positioning, story, buyer, method, program, messaging, and rollout.','readiness','bottom'),
    S('finish','launch','You are ready','Build with confidence','You now know where to work, how ADAM guides you, where assets live, and how launch becomes action.','finish','center')
  ]);

  var CHAPTER_URLS = Object.freeze({ dashboard:'index.html?tour=1', adam:'chat.html?agent=extract&tour=1', vault:'vault.html?tour=1', launch:'launch.html?tour=1' });

  function createTourState(steps) {
    var list = steps || TOUR_STEPS, position = 0;
    function clamp(value) { return Math.max(0, Math.min(list.length - 1, value)); }
    return Object.freeze({ current:function(){return list[position];}, index:function(){return position;}, next:function(){position=clamp(position+1);return list[position];}, back:function(){position=clamp(position-1);return list[position];}, goTo:function(value){if(Number.isFinite(value))position=clamp(Math.trunc(value));return list[position];}, reset:function(){position=0;return list[position];}, isFirst:function(){return position===0;}, isLast:function(){return position===list.length-1;} });
  }

  function translateFrameRect(rect, iframeRect, scale) { return { left:iframeRect.left+rect.left*scale, top:iframeRect.top+rect.top*scale, width:rect.width*scale, height:rect.height*scale }; }
  function chooseCardPlacement(target, viewport, card) {
    var gap=28, room={right:viewport.width-(target.left+target.width),left:target.left,bottom:viewport.height-(target.top+target.height),top:target.top};
    if(room.right>=card.width+gap)return 'right'; if(room.left>=card.width+gap)return 'left'; if(room.bottom>=card.height+gap)return 'bottom'; if(room.top>=card.height+gap)return 'top'; return 'docked';
  }

  function createController(win) {
    var doc=win.document,state=createTourState(),narrator=null;
    function setVoiceStatus(value){if(shell){var node=shell.querySelector('[data-tour-voice-status]');if(node)node.textContent=value;}}
    function makeNarrator(){return win.FAS.createRealtimeNarrator({fetchImpl:win.fetch.bind(win),getAccessToken:function(){return win.FAS.auth&&win.FAS.auth.requireSession?win.FAS.auth.requireSession().then(function(session){return session.accessToken;}):Promise.resolve('');},onStatus:setVoiceStatus});}
    var shell=null,frame=null,lastTrigger=null,app=null,appWasHidden=null,token=0,currentChapter='',ready=false,targetRect=null,loadTimer=null,targetAttempt=0;
    function createShell(){
      if(shell)return shell; shell=doc.createElement('div');shell.className='tour-overlay';shell.hidden=true;
      shell.innerHTML='<section class="tour-dialog" data-tour-dialog role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-description"><header class="tour-live-head"><strong>FAS // GUIDED DEMO</strong><span class="tour-ai-disclosure">AI-generated Cedar narration</span><span data-tour-voice-status aria-live="polite">Connecting ADAM…</span><span data-tour-chapter></span><span data-tour-progress aria-live="polite"></span><button type="button" data-tour-mute aria-pressed="false">Mute</button><button type="button" data-tour-replay>Replay</button><button type="button" data-tour-close aria-label="Close tutorial">×</button></header><div class="tour-frame-wrap"><iframe data-tour-frame title="Interactive FAS product demonstration" sandbox="allow-scripts allow-same-origin"></iframe><div class="tour-loading" data-tour-loading>Loading the real FAS page…</div><div class="tour-dim" data-tour-dim></div><div class="tour-spotlight" data-tour-spotlight hidden></div><span class="tour-pointer" data-tour-pointer aria-hidden="true" hidden>➜</span><ol class="tour-chapters" data-tour-chapters></ol><aside class="tour-card" data-tour-card><p class="tour-kicker" data-tour-label></p><h2 id="tour-title" data-tour-title></h2><p id="tour-description" data-tour-description></p><div class="tour-controls"><button type="button" data-tour-skip>Skip tutorial</button><button type="button" data-tour-back>Back</button><button type="button" data-tour-next>Next</button></div></aside></div></section>';
      doc.body.appendChild(shell);frame=shell.querySelector('[data-tour-frame]');frame.addEventListener('load',onFrameLoad);shell.addEventListener('keydown',handleKeys);
      shell.querySelector('[data-tour-close]').addEventListener('click',function(){cleanupAndRestore('close');});shell.querySelector('[data-tour-skip]').addEventListener('click',function(){cleanupAndRestore('skip');});shell.querySelector('[data-tour-back]').addEventListener('click',back);shell.querySelector('[data-tour-next]').addEventListener('click',next);
      shell.querySelector('[data-tour-mute]').addEventListener('click',toggleMute);shell.querySelector('[data-tour-replay]').addEventListener('click',function(){narrator.replay();});return shell;
    }
    function onFrameLoad(){if(!shell||shell.hidden)return;win.clearTimeout(loadTimer);targetAttempt=0;sendTarget();}
    function send(type,payload){if(frame&&frame.contentWindow)frame.contentWindow.postMessage({namespace:'fas-tour',type:type,token:token,payload:payload},'*');}
    function directTargetRect(target){try{var nodes=frame.contentDocument&&frame.contentDocument.querySelectorAll('[data-tour-id]');for(var i=0;nodes&&i<nodes.length;i+=1)if(nodes[i].getAttribute('data-tour-id')===target)return nodes[i].getBoundingClientRect();}catch(_){}return null;}
    function acceptTarget(rect,narrate){win.clearTimeout(loadTimer);ready=true;targetRect={left:rect.left,top:rect.top,width:rect.width,height:rect.height};shell.querySelector('[data-tour-loading]').hidden=true;schedulePointer();if(narrate)narrator.speak(state.current().speech);}
    function sendTarget(){var step=state.current();send('show-target',{target:step.target,action:step.action,preview:true});targetAttempt+=1;win.clearTimeout(loadTimer);loadTimer=win.setTimeout(function(){var rect=directTargetRect(step.target);if(rect){acceptTarget(rect,true);return;}if(targetAttempt<4)sendTarget();else showFallback('Preview target unavailable. You can continue, go back, or close the tour.');},500);}
    function renderStep(){
      var step=state.current(), chapterChanged=currentChapter!==step.chapter;ready=false;targetRect=null;targetAttempt=0;win.clearTimeout(loadTimer);narrator.cancel();token+=1;
      shell.querySelector('[data-tour-label]').textContent=step.label;shell.querySelector('[data-tour-title]').textContent=step.title;shell.querySelector('[data-tour-description]').textContent=step.description;shell.querySelector('[data-tour-progress]').textContent='Step '+(state.index()+1)+' of '+TOUR_STEPS.length;shell.querySelector('[data-tour-chapter]').textContent=step.chapter.toUpperCase();shell.querySelector('[data-tour-back]').disabled=state.isFirst();shell.querySelector('[data-tour-next]').textContent=state.isLast()?'Finish tutorial':'Next';
      shell.querySelector('[data-tour-chapters]').innerHTML=['dashboard','adam','vault','launch'].map(function(c,i){return '<li class="tour-chapter'+(c===step.chapter?' is-active':'')+'"'+(c===step.chapter?' aria-current="step"':'')+'><span>0'+(i+1)+'</span>'+c+'</li>';}).join('');
      hideTarget();shell.querySelector('[data-tour-loading]').hidden=false;
      if(chapterChanged){currentChapter=step.chapter;frame.src=CHAPTER_URLS[step.chapter]+'&tourSession='+Date.now();}else sendTarget();
    }
    function handleFrameMessage(event){
      if(!frame||event.source!==frame.contentWindow||!event.data||event.data.namespace!=='fas-tour'||event.data.token!==token)return;var data=event.data;
      if(data.type==='frame-ready'){sendTarget();return;} if(data.type==='target-missing'){showFallback('This area is not available in the current preview. Continue to the next guide step.');return;}
      if((data.type==='target-ready'||data.type==='geometry-update')&&data.payload&&data.payload.rect)acceptTarget(data.payload.rect,data.type==='target-ready'&&!ready);
      if(data.type==='interaction-complete'&&!(data.payload&&data.payload.preview))next();
    }
    function schedulePointer(){if(!ready||!targetRect)return;win.requestAnimationFrame(positionLayers);}
    function positionLayers(){
      var iframeBox=frame.getBoundingClientRect(), rect=translateFrameRect(targetRect,iframeBox,iframeBox.width/frame.clientWidth),spot=shell.querySelector('[data-tour-spotlight]'),pointer=shell.querySelector('[data-tour-pointer]'),card=shell.querySelector('[data-tour-card]');
      spot.hidden=false;spot.style.left=rect.left+'px';spot.style.top=rect.top+'px';spot.style.width=rect.width+'px';spot.style.height=rect.height+'px';pointer.hidden=false;pointer.style.left=(rect.left+rect.width/2)+'px';pointer.style.top=(rect.top+rect.height/2)+'px';pointer.dataset.placement=state.current().arrow;
      var place=chooseCardPlacement(rect,{width:win.innerWidth,height:win.innerHeight},{width:card.offsetWidth||340,height:card.offsetHeight||260});card.dataset.placement=place;card.style.setProperty('--target-left',rect.left+'px');card.style.setProperty('--target-top',rect.top+'px');card.style.setProperty('--target-right',(rect.left+rect.width)+'px');card.style.setProperty('--target-bottom',(rect.top+rect.height)+'px');
    }
    function hideTarget(){var s=shell.querySelector('[data-tour-spotlight]'),p=shell.querySelector('[data-tour-pointer]');s.hidden=true;p.hidden=true;}
    function showFallback(message){win.clearTimeout(loadTimer);shell.querySelector('[data-tour-loading]').textContent=message;shell.querySelector('[data-tour-loading]').hidden=false;hideTarget();narrator.speak(state.current().speech);}
    function toggleMute(){var button=shell.querySelector('[data-tour-mute]');if(narrator.isMuted()){narrator.unmute();button.textContent='Mute';button.setAttribute('aria-pressed','false');}else{narrator.mute();button.textContent='Unmute';button.setAttribute('aria-pressed','true');}}
    function open(trigger){createShell();narrator=makeNarrator();narrator.unlockPlayback();narrator.connect().catch(function(){});var muteButton=shell.querySelector('[data-tour-mute]');muteButton.textContent='Mute';muteButton.setAttribute('aria-pressed','false');lastTrigger=trigger||doc.activeElement;state.reset();currentChapter='';app=doc.querySelector('.app');if(app){appWasHidden=app.getAttribute('aria-hidden');app.setAttribute('inert', '');app.setAttribute('aria-hidden','true');}doc.body.classList.add('tour-open');shell.hidden=false;renderStep();shell.querySelector('[data-tour-next]').focus();}
    function cleanupAndRestore(reason){if(!shell||shell.hidden)return;win.clearTimeout(loadTimer);narrator.destroy();shell.hidden=true;doc.body.classList.remove('tour-open');if(app){app.removeAttribute('inert');if(appWasHidden===null)app.removeAttribute('aria-hidden');else app.setAttribute('aria-hidden',appWasHidden);}if(frame)frame.src='about:blank';state.reset();if(lastTrigger&&lastTrigger.focus)lastTrigger.focus();}
    function next(){narrator.cancel();if(state.isLast()){cleanupAndRestore('finish');return;}state.next();renderStep();}
    function back(){narrator.cancel();state.back();renderStep();}
    function focusable(){return shell?Array.prototype.slice.call(shell.querySelectorAll('button:not([disabled])')):[];}
    function handleKeys(event){if(event.key === 'Escape'){event.preventDefault();cleanupAndRestore('escape');return;}if(event.key === 'ArrowRight'){event.preventDefault();next();return;}if(event.key === 'ArrowLeft'){event.preventDefault();back();return;}if(event.key === 'Tab'){var a=focusable(),first=a[0],last=a[a.length-1];if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus();}}}
    win.addEventListener('message',handleFrameMessage);win.addEventListener('resize',function(){win.requestAnimationFrame(schedulePointer);});win.addEventListener('beforeunload',function(){if(narrator)narrator.cancel();});doc.querySelectorAll('[data-tutorial-trigger]').forEach(function(t){t.addEventListener('click',function(){open(t);});});
    return Object.freeze({open:open,close:cleanupAndRestore,next:next,back:back,current:state.current});
  }

  var api={createTourState:createTourState,translateFrameRect:translateFrameRect,chooseCardPlacement:chooseCardPlacement,CHAPTER_URLS:CHAPTER_URLS,TOUR_STEPS:TOUR_STEPS};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root){root.FAS=root.FAS||{};root.FAS.tutorialData=api;if(root.document){var controller=createController(root);root.FAS.tutorial=controller;window.FAS.tutorial=controller;}}
})(typeof window!=='undefined'?window:null);
