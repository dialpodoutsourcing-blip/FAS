(function (root) {
  'use strict';
  var ALLOWED = ['show-target', 'try-action'];
  function isTourMode(search) { return new URLSearchParams(search || '').get('tour') === '1'; }
  function validateMessage(data) {
    if (!data || data.namespace !== 'fas-tour' || ALLOWED.indexOf(data.type) < 0 || !Number.isFinite(data.token) || !data.payload) return false;
    if (data.type === 'show-target') return typeof data.payload.target === 'string' && !!data.payload.target;
    return typeof data.payload.action === 'string' && typeof data.payload.target === 'string';
  }
  function rectPayload(rect) { return { left:rect.left, top:rect.top, width:rect.width, height:rect.height }; }
  function selectTalkMode(documentRef) {
    var typeTab=documentRef.querySelector('[data-tour-type-mode]'),talkTab=documentRef.querySelector('[data-tour-talk-mode]'),textPanel=documentRef.querySelector('#panel-text'),voicePanel=documentRef.querySelector('#panel-voice');
    if(!typeTab||!talkTab)return false;
    typeTab.setAttribute('aria-selected','false');typeTab.tabIndex=-1;talkTab.setAttribute('aria-selected','true');talkTab.tabIndex=0;
    if(textPanel)textPanel.hidden=true;if(voicePanel)voicePanel.hidden=false;return true;
  }

  var api = { isTourMode:isTourMode, validateMessage:validateMessage, rectPayload:rectPayload, selectTalkMode:selectTalkMode };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root || !root.document || !isTourMode(root.location.search)) return;

  var doc = root.document;
  var activeTarget = null;
  var activeToken = 0;
  doc.body.classList.add('tour-frame');
  doc.querySelectorAll('[data-tutorial-trigger]').forEach(function (node) { node.hidden = true; });

  function send(type, payload) {
    root.parent.postMessage({ namespace:'fas-tour', type:type, token:activeToken, payload:payload || {} }, '*');
  }
  function report(type) {
    if (!activeTarget) return;
    send(type, { target:activeTarget.getAttribute('data-tour-id'), rect:rectPayload(activeTarget.getBoundingClientRect()) });
  }
  function unsafeElement(target) {
    return target.closest('a, form, [download], [data-voice-start], [data-voice-end], [data-chat-form], [data-save-exit]');
  }
  doc.addEventListener('submit', function (event) { event.preventDefault(); event.stopImmediatePropagation(); }, true);
  doc.addEventListener('click', function (event) {
    var unsafe = unsafeElement(event.target);
    if (unsafe && !unsafe.hasAttribute('data-tour-safe')) { event.preventDefault(); event.stopImmediatePropagation(); }
    if (activeTarget && activeTarget.contains(event.target)) {
      send('interaction-complete', { target:activeTarget.getAttribute('data-tour-id') });
    }
  }, true);
  doc.addEventListener('keydown', function (event) {
    if ((event.key === 'Enter' || event.key === ' ') && unsafeElement(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);

  root.addEventListener('message', function (event) {
    if (event.source !== window.parent || !validateMessage(event.data)) return;
    activeToken = event.data.token;
    var payload = event.data.payload;
    activeTarget = doc.querySelector('[data-tour-id="' + CSS.escape(payload.target) + '"]');
    if (!activeTarget) { send('target-missing', { target:payload.target }); return; }
    activeTarget.scrollIntoView({ block:'center', inline:'center', behavior:'auto' });
    report('target-ready');
    if (event.data.type === 'show-target' && payload.action === 'selectTalkMode') {
      selectTalkMode(doc);
      send('interaction-complete', { target:payload.target, preview:true });
    }
    if (event.data.type === 'try-action') {
      if (payload.action === 'fillSampleAnswer') {
        var input = activeTarget.matches('textarea,input') ? activeTarget : activeTarget.querySelector('textarea,input');
        if (input) input.value = 'I helped a client turn scattered knowledge into a clear signature method.';
      } else if (payload.action === 'switchInputMode' || payload.action === 'toggleDemoPanel' || payload.action === 'selectDemoAsset') {
        var safeButton = activeTarget.matches('button') ? activeTarget : activeTarget.querySelector('button');
        if (safeButton) { safeButton.setAttribute('data-tour-safe', ''); safeButton.click(); safeButton.removeAttribute('data-tour-safe'); }
      }
      send('interaction-complete', { target:payload.target });
    }
  });
  root.addEventListener('resize', function () { report('geometry-update'); });
  if (root.ResizeObserver) new root.ResizeObserver(function () { report('geometry-update'); }).observe(doc.documentElement);
  root.addEventListener('load', function () { send('frame-ready', {}); });
  send('frame-ready', {});
})(typeof window !== 'undefined' ? window : null);
