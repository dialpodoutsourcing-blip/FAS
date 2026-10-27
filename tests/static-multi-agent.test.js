const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const chat = read('chat.html');

assert.match(chat, /<body[^>]+class="chat-page"/, 'chat uses the one-screen shell');
assert.match(chat, /data-chat-history-toggle/);
assert.match(chat, /data-chat-saved-toggle/);
assert.match(chat, /data-chat-trust-toggle/);
assert.match(chat, /data-chat-history-drawer[^>]+hidden/);
assert.match(chat, /data-chat-saved-drawer[^>]+hidden/);
assert.match(chat, /data-chat-trust-drawer[^>]+hidden/);
assert.match(chat, /data-download-saved[^>]+aria-label="Download saved work"/, 'saved work drawer exposes an accessible download action');
assert.match(chat, /data-agent-stage-summary/);
assert.match(chat, /data-answer-status[^>]+aria-live="polite"/);
assert.match(chat, /data-completion-panel[^>]+hidden/, 'chat includes a hidden completed-work panel');
for(const hook of ['data-view-blueprint','data-edit-answers','data-retry-agent','data-start-extract'])assert.match(chat,new RegExp(hook),`completion panel exposes ${hook}`);
assert.match(chat, /data-voice-ambient[^>]+aria-hidden="true"/, 'voice panel includes decorative ambient wavelengths');
assert.match(chat, /data-voice-hud[^>]+aria-hidden="true"/, 'voice panel includes a decorative processing HUD');
assert.match(chat, /data-voice-hud-secondary[^>]+aria-hidden="true"/, 'voice panel includes a decorative right-side analysis HUD');
assert.match(chat, /VOICE ANALYSIS/, 'right-side HUD identifies its analysis role');
assert.match(chat, /data-voice-status[^>]+aria-live="polite"/, 'voice mode exposes an accessible live status');
const voiceAudio = chat.match(/<audio\b[^>]*data-voice-audio[^>]*>/)?.[0] || '';
assert.ok(voiceAudio, 'voice mode includes ADAM audio playback');
assert.match(voiceAudio, /\sautoplay(?:\s|=|>)/, 'ADAM speaks automatically');
assert.doesNotMatch(voiceAudio, /\scontrols(?:\s|=|>)/, 'ADAM voice does not look like a media player');
assert.match(chat, /data-voice-recovery[^>]+hidden/, 'voice mode includes a hidden recovery panel');
assert.match(chat, /data-voice-retry[^>]*>Retry voice</, 'voice recovery can retry the connection');
assert.match(chat, /data-voice-type-instead[^>]*>Type instead</, 'voice recovery preserves the Type fallback');
[
  'Uses your real experience and evidence',
  'Separates your facts from ADAM’s suggestions',
  'Flags assumptions, missing proof, and uncertainty',
  'Requires your approval before work is final',
  'Keeps saved answers visible and editable',
  'You remain in control'
].forEach(commitment => assert.ok(chat.includes(commitment), `trust drawer includes: ${commitment}`));
assert.match(chat, /cannot guarantee business results/, 'trust drawer includes a credible results disclaimer');

const agentsScript = chat.indexOf('<script src="assets/js/agents.js"></script>');
const accessScript = chat.indexOf('<script src="assets/js/agent-access.js"></script>');
const adamScript = chat.indexOf('<script src="assets/js/adam.js"></script>');
const coordinatorScript = chat.indexOf('<script src="assets/js/interview-coordinator.js"></script>');
const interviewerScript = chat.indexOf('<script src="assets/js/realtime-interviewer.js"></script>');
assert.ok(agentsScript >= 0, 'chat loads the specialist registry');
assert.ok(accessScript >= 0 && accessScript < adamScript, 'chat resolves product access before the chat controller');
assert.ok(adamScript > agentsScript, 'specialist registry loads before the chat controller');
assert.ok(coordinatorScript > agentsScript && coordinatorScript < adamScript, 'durable coordinator loads before the chat controller');
assert.ok(interviewerScript > coordinatorScript && interviewerScript < adamScript, 'Realtime interviewer loads before the chat controller');

[
  'data-agent-name', 'data-agent-title', 'data-agent-step', 'data-agent-chip',
  'data-agent-stages', 'data-agent-messages', 'data-agent-question',
  'data-agent-hints', 'data-agent-saved', 'data-agent-completion',
  'data-agent-voice-icon', 'data-agent-template-icon', 'data-agent-typing-icon'
].forEach(hook => assert.match(chat, new RegExp(hook), `chat exposes ${hook}`));

const adam = read('assets/js/adam.js');
assert.match(adam, /FAS\.agent\s*=/, 'chat controller exposes selected agent state');
assert.match(adam, /URLSearchParams/, 'chat controller reads the agent query');
assert.match(adam, /FAS\.agents\.get/, 'chat controller resolves registry content');
assert.match(adam, /typingIcon\.setAttribute\('href', '#' \+ agent\.symbol\)/, 'typing state inherits the selected specialist icon');
assert.match(adam, /data-drawer-target/);
assert.match(adam, /data-drawer-close/);
assert.match(adam, /Answer saved\./);
assert.match(adam, /Save failed\./);
assert.match(adam, /new Blob\(\[content\],\s*\{\s*type:\s*'text\/plain;charset=utf-8'\s*\}\)/, 'saved work export creates a plain-text file');
assert.match(adam, /FAS-.*-saved-work\.txt/, 'saved work export uses an agent-specific filename');
assert.match(adam, /URL\.createObjectURL/, 'saved work export creates a local download URL');
assert.match(adam, /\.wave span[\s\S]*Math\.random\(\)[\s\S]*--wave-height/s, 'voice ticker receives varied bar heights');
assert.match(adam, /--wave-speed/, 'voice ticker receives varied animation speeds');
assert.match(adam, /--wave-floor/, 'voice ticker receives varied minimum pulse sizes');
assert.match(adam, /tab-voice[\s\S]*activateVoiceMode/, 'selecting Talk starts or resumes the hands-free interview');
assert.match(adam, /submitPostCompletionMessage/, 'completed Type and Talk messages use the advisory conversation path');
assert.match(adam, /\/api\/advisory-response/, 'completed conversation calls the advisory endpoint');

const pages = ['chat.html', 'review.html', 'vault.html', 'launch.html'];
const keys = ['anchor', 'extract'];
const paidKeys = ['radar', 'forge', 'architect', 'voice', 'launch'];
for (const page of pages) {
  const html = read(page);
  const registryPosition = html.indexOf('<script src="assets/js/agents.js"></script>');
  const navigationPosition = html.indexOf('<script src="assets/js/nav.js"></script>');
  assert.ok(registryPosition >= 0 && navigationPosition > registryPosition, `${page} loads agent data before shared navigation`);
  for (const key of keys) {
    const route = `href="chat.html?agent=${key}"`;
    assert.ok(html.includes(route), `${page} routes ${key} to its chat`);
    assert.match(html, new RegExp(`data-agent-link="${key}"`), `${page} identifies the ${key} specialist link`);
  }
  for (const key of paidKeys) assert.match(html,new RegExp(`data-agent-link="${key}"`),`${page} keeps unlockable ${key} markup`);
  assert.doesNotMatch(html, /step-link is-locked/, `${page} has no locked specialist links`);
}

const dashboard = read('index.html');
assert.match(dashboard, /class="[^"]*resume-cta[^"]*" href="chat\.html\?agent=extract"/);
for (const key of keys) {
  assert.match(dashboard, new RegExp(`class="spec[^"]*" href="chat\\.html\\?agent=${key}"`), `dashboard card opens ${key}`);
}
for (const key of paidKeys) assert.match(dashboard,new RegExp(`class="spec[^"]*" href="chat\\.html\\?agent=${key}"`),`dashboard keeps unlockable ${key} markup`);
assert.match(dashboard,/Your <span data-access-count>2<\/span>-step roadmap/,'dashboard starts with the two included products');
assert.match(dashboard,/aria-label="Step 2 of 2"[^>]+aria-valuemax="2"/,'dashboard progress starts with two available steps');
assert.doesNotMatch(dashboard, /class="spec is-locked"/, 'dashboard cards are not visually locked');
assert.doesNotMatch(dashboard, />Locked<\//, 'dashboard cards do not announce a locked state');

const nav = read('assets/js/nav.js');
assert.match(nav, /data-agent-link/);
assert.match(nav, /aria-current.*step/);
assert.match(nav, /a\[href\*="chat\.html\?agent="\]/, 'loader intercepts every agent route');
assert.match(nav, /LOADING /, 'loader announces the selected agent');
assert.match(nav, /requestAnimationFrame/, 'loader animates progress');
assert.match(nav, /event\.metaKey[\s\S]*event\.ctrlKey[\s\S]*event\.shiftKey[\s\S]*event\.altKey/, 'loader preserves modified clicks');
assert.match(nav, /WHAT THIS AGENT DOES/, 'loader explains the specialist role');
assert.match(nav, /WHAT IT CREATES FOR YOU/, 'loader previews concrete deliverables');
assert.match(nav, /agent\.briefing/, 'loader uses the detailed specialist briefing');
assert.match(nav, /agent\.generates/, 'loader lists agent-specific deliverables');
assert.match(nav, /FAS\.createRealtimeNarrator/, 'loader uses the Cedar narrator');
assert.match(nav, /narrator\.speak\(agent\.introduction\)/, 'loader narrates the selected specialist introduction');
const loaderAudio = nav.match(/<audio\b[^>]*data-loader-audio[^>]*>/)?.[0] || '';
assert.ok(loaderAudio, 'loader includes ADAM introduction audio');
assert.match(loaderAudio, /\shidden(?:\s|=|>)/, 'loader keeps narration playback controls out of sight');
assert.match(loaderAudio, /\sautoplay(?:\s|=|>)/, 'loader introduction audio starts automatically');
assert.doesNotMatch(loaderAudio, /\scontrols(?:\s|=|>)/, 'loader introduction does not look like a media player');
assert.match(nav, /audioFactory/, 'loader gives its hidden audio element to the Realtime narrator');
assert.match(nav, /narrator\.unlockPlayback\(\)[\s\S]*narrator\.connect\(\)/, 'loader unlocks audio during the opening click before connecting Realtime');
assert.match(nav, /whenPlaybackAvailable/, 'loader waits for remote narration media before enabling entry');
assert.match(nav, /stopLoaderNarration\(loader\)[\s\S]*window\.location\.assign/s, 'starting the specialist stops its loader narration');
assert.match(nav, /back\.addEventListener\('click'[\s\S]*stopLoaderNarration\(loader\)/s, 'closing the loader stops its narration');
assert.match(nav, /START ['"]?\s*\+\s*agent\.name/, 'loader labels its start action for the selected agent');
assert.match(nav, /SPECIALIST READY/, 'loader has a persistent ready state');
assert.match(nav, /start\.addEventListener\('click'[\s\S]*window\.location\.assign\(loader\._destination\.href\)/s, 'navigation only occurs from the Start action');
assert.match(nav, /back\.addEventListener\('click'/, 'loader offers a way back without entering the agent');
assert.match(nav, /agent-loader__layout/, 'loader uses a two-column presentation shell');
assert.match(nav, /agent-loader__identity/, 'loader keeps specialist identity in the left column');
assert.match(nav, /agent-loader__hud/, 'loader presents its briefing in a HUD panel');
assert.match(nav, /agent-loader__footer/, 'loader keeps the progress rail beneath both columns');

const styles = read('assets/css/styles.css');
assert.match(styles, /\.step-link\.is-preview \.step-link__state svg\s*\{\s*display:\s*none/);
assert.match(styles, /\.is-preview \.em\.is-locked svg\s*\{[^}]*filter:\s*none/);
assert.match(styles, /\.chat-page\s*\{[^}]*height:\s*100dvh[^}]*overflow:\s*hidden/s);
assert.match(styles, /\.chat-page \.app\s*\{[^}]*height:\s*100dvh/s);
assert.match(styles, /\.chat-shell__workspace\s*\{[^}]*min-height:\s*0/s);
assert.match(styles, /\.chat-drawer\s*\{[^}]*position:\s*fixed/s);
assert.match(styles, /\.chat-primary\s*\{[^}]*max-width:\s*1100px/s, 'the shared chat column matches the approved wide layout');
assert.match(styles, /\.chat-page \.thread > \.msg\s*\{[^}]*width:\s*100%[^}]*max-width:\s*none/s, 'the prompt row spans the shared chat column');
assert.match(styles, /\.chat-page \.thread\s*\{[^}]*overflow-y:\s*auto/s, 'the main conversation is vertically scrollable');
assert.match(styles, /\.chat-page \.thread > \.msg \.bubble\s*\{[^}]*width:\s*100%[^}]*max-width:\s*none/s, 'the prompt card aligns with the composer edges');
assert.match(styles, /\.chat-page \.bubble__text--q\s*\{[^}]*font-size:\s*clamp\(16px,\s*1\.1vw,\s*18px\)[^}]*font-weight:\s*600/s, 'the prompt uses compact semibold typography');
assert.match(styles, /@keyframes voiceWaveDrift/, 'ambient voice wavelengths are animated');
assert.match(styles, /@keyframes hudScan/, 'voice HUD has a processing scan animation');
assert.match(styles, /\.voice-hud--signal\s*\{[^}]*right:\s*28px[^}]*left:\s*auto/s, 'analysis HUD is positioned on the right');
assert.match(styles, /@keyframes hudRadar/, 'analysis HUD includes an animated signal radar');
assert.match(styles, /@keyframes orbIdle/, 'voice orb has an ambient idle animation');
assert.match(styles, /prefers-reduced-motion[\s\S]*\.voice__ambient[\s\S]*\.voice-hud/s, 'voice effects respect reduced-motion preferences');
assert.match(styles, /\.chat-page #panel-voice\s*\{[^}]*height:\s*100%[^}]*min-height:\s*0[^}]*display:\s*grid[^}]*overflow:\s*hidden/s, 'voice mode is constrained to the one-screen workspace');
assert.match(styles, /\.chat-page #panel-voice \.vorb\s*\{[^}]*width:\s*190px[^}]*height:\s*190px/s, 'one-screen voice mode uses the compact orb');
assert.match(styles, /\.chat-page #panel-voice \.devbar\s*\{[^}]*display:\s*none/s, 'developer controls do not consume voice viewport space');
assert.match(styles, /@media \(max-height:\s*760px\)[\s\S]*#panel-voice \.vorb/s, 'short screens receive an additional compact voice layout');
assert.match(styles, /\.wave span\s*\{[^}]*background:\s*var\(--gold\)[^}]*animation:\s*waveTicker/s, 'voice ticker is always gold and animated');
assert.match(styles, /@keyframes waveTicker/, 'voice ticker has an organic bar animation');
assert.match(styles, /\.chat-page #panel-voice \.voice__controls\s*\{[^}]*gap:\s*10px/s, 'voice controls stay in a compact centered group');
assert.match(styles, /\.voice__recovery\s*\{[^}]*display:\s*flex/s, 'voice recovery actions are visibly grouped');
assert.match(styles, /\.voice__recovery\[hidden\]\s*\{[^}]*display:\s*none/s, 'voice recovery remains hidden until needed');
assert.match(styles, /\.wave span\s*\{[^}]*width:\s*6px/s, 'voice ticker bars are twice as thick');
assert.match(styles, /\.chat-page #panel-voice\s*\{[^}]*gap:\s*10px/s, 'voice question, controls, and transcript share a consistent rhythm');
assert.match(styles, /\.agent-loader\s*\{[^}]*position:\s*fixed[^}]*z-index:\s*1000/s, 'agent loader covers the interface');
assert.match(styles, /\.agent-loader__progress-bar/, 'agent loader includes premium progress styling');
assert.match(styles, /\.agent-loader__actions/, 'agent loader includes a deliberate start area');
assert.match(styles, /\.agent-loader\.is-ready[\s\S]*\.agent-loader__start/s, 'Start is revealed only when the specialist is ready');
assert.match(styles, /\.agent-loader\s*\{[^}]*height:\s*100dvh[^}]*overflow:\s*hidden/s, 'agent loader is a fixed non-scrollable viewport');
assert.match(styles, /\.agent-loader__layout\s*\{[^}]*grid-template-columns:\s*minmax\(220px,\s*\.72fr\)\s+minmax\(0,\s*1\.28fr\)/s, 'agent identity and HUD use the approved left-right composition');
assert.match(styles, /\.agent-loader__footer\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s, 'progress rail spans beneath both columns');
assert.match(styles, /@keyframes loaderHudScan/, 'briefing HUD includes an animated scan');
assert.match(styles, /\.agent-loader__grid\s*\{[^}]*opacity:\s*\.2[5-9]/s, 'background tile grid is clearer');
assert.match(styles, /@keyframes loaderSweep/, 'agent loader includes a gold sweep animation');
assert.match(styles, /prefers-reduced-motion[\s\S]*\.agent-loader__grid[\s\S]*\.agent-loader__sweep[\s\S]*\.agent-loader__emblem/s, 'agent loader respects reduced-motion preferences');
assert.match(styles,/html:not\(\.fas-access-ready\)[\s\S]*data-agent-link="radar"[\s\S]*data-nav="launch"/s,'paid products are hidden before access resolves');

const readme = read('README.md');
for (const key of keys) assert.ok(readme.includes(`chat.html?agent=${key}`), `README documents ${key} preview`);
assert.match(readme, /local static preview/i);
assert.match(readme, /shared guided-interview engine/i);
assert.match(readme, /matching PDF and DOCX/i);

console.log('Static multi-agent shell checks passed.');
