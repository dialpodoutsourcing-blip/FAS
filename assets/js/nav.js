/* ==========================================================
   FAS ADAM UI · Navigation only
   Handles: active menu link, mobile menu drawer, tabs,
   and on/off view switches. No app logic, no data.
   ========================================================== */
(function () {
  'use strict';

  /* 1. Highlight the current page in the menu.
        Each page sets <body data-page="...">.
        Each menu link sets data-nav="..." with the same word. */
  var page = document.body.getAttribute('data-page');
  document.querySelectorAll('[data-nav]').forEach(function (link) {
    if (link.getAttribute('data-nav') === page) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* The shared chat page highlights the specialist selected in its query string. */
  if (page === 'chat' && window.FAS && window.FAS.agents) {
    var agentKey = window.FAS.agents.resolveKey(new URLSearchParams(window.location.search).get('agent'));
    document.querySelectorAll('[data-agent-link]').forEach(function (link) {
      var active = link.getAttribute('data-agent-link') === agentKey;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
  }
  if (window.FAS && window.FAS.agents) document.querySelectorAll('[data-agent-link]').forEach(function(link){
    var key=link.getAttribute('data-agent-link'),emblem=link.querySelector('.em');
    if (emblem && window.FAS.agents.keys.indexOf(key)>=0) emblem.setAttribute('data-agent-motion',key);
  });

  /* 2. Mobile menu drawer (screens under 900px). */
  var menuBtn = document.querySelector('[data-menu-toggle]');
  var scrim = document.querySelector('.scrim');

  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open));
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      setMenu(!document.body.classList.contains('menu-open'));
    });
  }
  if (scrim) scrim.addEventListener('click', function () { setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* 3. Tabs. Markup: role="tablist" > role="tab" with aria-controls="panel-id".
        Arrow keys move between tabs. */
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));

    function select(index, moveFocus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (moveFocus) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); select((i + 1) % tabs.length, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
      });
    });
  });

  /* 4. View switches. Markup: <button data-switch="tech" aria-pressed="true">.
        When off, <body> gets the class "tech-off" so CSS can hide things. */
  document.querySelectorAll('[data-switch]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      document.body.classList.toggle(btn.getAttribute('data-switch') + '-off', !on);
    });
  });

  /* 5. Premium transition shown whenever a specialist is opened. */
  function stopLoaderNarration(loader) {
    if (!loader || !loader._narrator) return;
    loader._narrator.destroy();
    loader._narrator = null;
  }

  function createAgentLoader() {
    var loader = document.createElement('div');
    loader.className = 'agent-loader';
    loader.hidden = true;
    loader.setAttribute('role', 'dialog');
    loader.setAttribute('aria-modal', 'true');
    loader.setAttribute('aria-labelledby', 'agent-loader-title');
    loader.innerHTML = '<div class="agent-loader__grid" aria-hidden="true"></div>' +
      '<div class="agent-loader__sweep" aria-hidden="true"></div>' +
      '<div class="agent-loader__card agent-loader__layout">' +
        '<section class="agent-loader__identity">' +
          '<div class="agent-loader__brand-row"><img class="agent-loader__brand" src="assets/images/fas-monogram.svg" alt="FAS"><span>ADAM SPECIALIST SYSTEM</span></div>' +
          '<span class="em agent-loader__emblem"><svg viewBox="0 0 64 64" aria-hidden="true"><use data-loader-icon></use></svg></span>' +
          '<div class="agent-loader__identity-copy"><span class="agent-loader__eyebrow">SPECIALIST · STEP <b data-loader-step></b> OF 7</span>' +
          '<h2 id="agent-loader-title" class="agent-loader__title" data-loader-title>LOADING ADAM</h2><p class="agent-loader__role" data-loader-role></p></div>' +
        '</section>' +
        '<section class="agent-loader__hud">' +
          '<span class="agent-loader__hud-scan" aria-hidden="true"></span><div class="agent-loader__hud-head"><span>ADAM // AGENT BRIEF</span><i>LIVE DATA</i></div>' +
          '<div class="agent-loader__briefing"><section><h3>WHAT THIS AGENT DOES</h3><p data-loader-description></p></section>' +
          '<section><h3>WHAT IT CREATES FOR YOU</h3><ul data-loader-outputs></ul></section></div>' +
          '<div class="agent-loader__actions"><button class="btn btn--quiet agent-loader__back" type="button" data-loader-back>Go back</button>' +
          '<button class="btn btn--gold btn--lg agent-loader__start" type="button" data-loader-start disabled>START ADAM</button></div>' +
        '</section>' +
        '<footer class="agent-loader__footer"><div class="agent-loader__progress"><span class="agent-loader__progress-bar" data-loader-progress></span></div>' +
        '<div class="agent-loader__meta" aria-live="polite"><span data-loader-status>INITIALIZING SPECIALIST</span><strong data-loader-percent>0%</strong></div></footer>' +
      '</div>';
    document.body.appendChild(loader);
    var start = loader.querySelector('[data-loader-start]');
    var back = loader.querySelector('[data-loader-back]');
    start.addEventListener('click', function () {
      stopLoaderNarration(loader);
      if (loader._destination) window.location.assign(loader._destination.href);
    });
    back.addEventListener('click', function () {
      stopLoaderNarration(loader);
      loader._runId = (loader._runId || 0) + 1;
      loader.hidden = true;
      loader.classList.remove('is-ready');
      document.body.classList.remove('agent-loading');
      document.body.removeAttribute('aria-busy');
      if (loader._returnFocus) loader._returnFocus.focus();
    });
    loader.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') back.click();
    });
    return loader;
  }

  var agentLoader = null;
  document.querySelectorAll('a[href*="chat.html?agent="]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      if (!window.FAS || !window.FAS.agents) return;
      var destination = new URL(link.href, window.location.href);
      var agent = window.FAS.agents.get(destination.searchParams.get('agent'));
      var linkEmblem = link.querySelector('.em');
      if (linkEmblem) linkEmblem.setAttribute('data-agent-motion', agent.key);
      event.preventDefault();
      if (!agentLoader) agentLoader = createAgentLoader();
      stopLoaderNarration(agentLoader);
      var icon = agentLoader.querySelector('[data-loader-icon]');
      var title = agentLoader.querySelector('[data-loader-title]');
      var role = agentLoader.querySelector('[data-loader-role]');
      var description = agentLoader.querySelector('[data-loader-description]');
      var outputs = agentLoader.querySelector('[data-loader-outputs]');
      var step = agentLoader.querySelector('[data-loader-step]');
      var progress = agentLoader.querySelector('[data-loader-progress]');
      var percent = agentLoader.querySelector('[data-loader-percent]');
      var status = agentLoader.querySelector('[data-loader-status]');
      var start = agentLoader.querySelector('[data-loader-start]');
      icon.setAttribute('href', '#' + agent.symbol);
      var loaderEmblem = icon.closest('.em');
      if (loaderEmblem) loaderEmblem.setAttribute('data-agent-motion', agent.key);
      title.textContent = 'LOADING ' + agent.name;
      role.textContent = agent.title;
      description.textContent = agent.briefing;
      step.textContent = agent.step;
      outputs.innerHTML = '';
      agent.generates.forEach(function (item) {
        var output = document.createElement('li');
        output.textContent = item;
        outputs.appendChild(output);
      });
      progress.style.width = '0%';
      percent.textContent = '0%';
      status.textContent = 'INITIALIZING SPECIALIST';
      start.textContent = 'START ' + agent.name;
      start.disabled = true;
      agentLoader.classList.remove('is-ready');
      agentLoader._destination = destination;
      agentLoader._returnFocus = link;
      agentLoader._runId = (agentLoader._runId || 0) + 1;
      var runId = agentLoader._runId;
      agentLoader.hidden = false;
      document.body.classList.add('agent-loading');
      document.body.setAttribute('aria-busy', 'true');
      if (window.FAS.createRealtimeNarrator && agent.introduction) {
        var narrator = window.FAS.createRealtimeNarrator({
          fetchImpl: window.fetch.bind(window)
        });
        agentLoader._narrator = narrator;
        narrator.connect().catch(function () {});
        narrator.speak(agent.introduction);
      }
      var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var duration = reduced ? 450 : 1200;
      var started = performance.now();
      function advance(now) {
        if (runId !== agentLoader._runId) return;
        var value = Math.min(100, Math.round(((now - started) / duration) * 100));
        progress.style.width = value + '%';
        percent.textContent = value + '%';
        if (value < 100) requestAnimationFrame(advance);
        else {
          title.textContent = agent.name + ' IS READY';
          status.textContent = 'SPECIALIST READY';
          start.disabled = false;
          agentLoader.classList.add('is-ready');
          start.focus();
        }
      }
      requestAnimationFrame(advance);
    });
  });
})();
