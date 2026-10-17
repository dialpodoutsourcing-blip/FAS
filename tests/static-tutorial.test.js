const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'chat.html', 'review.html', 'vault.html', 'launch.html'];

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const sidebar = html.match(/<nav class="sidebar" id="sidebar"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.equal((sidebar.match(/data-tutorial-trigger/g) || []).length, 1, `${page} has one tutorial trigger`);
  assert.match(sidebar, /data-nav="home"[\s\S]*?<\/a>\s*<button[^>]*class="nav-link tour-trigger"[^>]*data-tutorial-trigger/s, `${page} puts the tutorial directly after Dashboard`);
  assert.match(sidebar, /data-tutorial-trigger[^>]*>[\s\S]*?<svg[^>]*aria-hidden="true"[\s\S]*?Help me \/ Demo[\s\S]*?<\/button>/s, `${page} uses the shared tutorial label and icon`);
  assert.equal((html.match(/assets\/js\/tutorial\.js/g) || []).length, 1, `${page} loads tutorial.js once`);
  assert.equal((html.match(/assets\/js\/realtime-narrator\.js/g) || []).length, 1, `${page} loads realtime narrator once`);
  assert.equal((html.match(/assets\/js\/tutorial-frame\.js/g) || []).length, 1, `${page} loads tutorial-frame.js once`);
  assert.match(html, /assets\/js\/nav\.js[\s\S]*assets\/js\/tutorial\.js/s, `${page} loads tutorial after nav`);
  assert.match(html, /assets\/js\/realtime-narrator\.js[\s\S]*assets\/js\/tutorial\.js/s, `${page} loads narrator before tutorial`);
  assert.match(html, /assets\/js\/nav\.js[\s\S]*assets\/js\/tutorial-frame\.js/s, `${page} loads frame bridge after nav`);
}

const script = fs.readFileSync(path.join(root, 'assets/js/tutorial.js'), 'utf8');
assert.doesNotMatch(script, /function render(?:Dashboard|Adam|Vault|Launch)\(/, 'hand-built product renderers are removed');
assert.match(script, /<iframe[^>]*data-tour-frame[^>]*title="Interactive FAS product demonstration"/, 'tutorial uses the real pages in a titled iframe');
assert.match(script, /sandbox="allow-scripts allow-same-origin"/, 'iframe permits trusted local pages to render and run their protected bridge');
const sandbox = script.match(/sandbox="([^"]+)"/)?.[1] || '';
assert.doesNotMatch(sandbox, /allow-top-navigation|allow-popups|allow-forms|allow-downloads/, 'sandbox grants no unsafe capabilities');
for (const contract of [
  /role="dialog"/, /aria-modal="true"/, /aria-labelledby="tour-title"/, /aria-describedby="tour-description"/,
  /function cleanupAndRestore\(/, /data-tour-dialog/, /data-tour-close/, /data-tour-skip/,
  /lastTrigger\.focus\(\)/, /classList\.add\('tour-open'\)/, /setAttribute\('inert', ''\)/,
  /event\.key === 'Escape'/, /event\.key === 'Tab'/, /window\.FAS\.tutorial/
]) assert.match(script, contract, `tutorial lifecycle includes ${contract}`);

assert.doesNotMatch(script, /location\.(?:href|assign|replace)\s*=/, 'tutorial never changes browser location');
assert.doesNotMatch(script, /getUserMedia|MediaRecorder/, 'tutorial never activates media APIs');
assert.match(script, /data-tour-mute[^>]*aria-pressed="false"/, 'tutorial exposes an accessible mute toggle');
assert.match(script, /data-tour-replay/, 'tutorial exposes narration replay');
assert.match(script, /AI-generated Cedar narration/, 'tutorial discloses that Cedar narration is AI-generated');
assert.match(script, /createRealtimeNarrator\(/, 'tutorial controller uses the Realtime Cedar narrator');
assert.match(script, /function open\([^)]*\)[^{]*\{[^}]*narrator=makeNarrator\(\)/, 'each tutorial opening gets a fresh Cedar narrator');
assert.match(script, /function open\([^)]*\)[\s\S]*?muteButton\.textContent='Mute'[\s\S]*?muteButton\.setAttribute\('aria-pressed','false'\)/, 'reopening resets the visible mute state');
assert.match(script, /data\.type==='target-ready'[\s\S]*?narrator\.speak\(state\.current\(\)\.speech\)/, 'automatic narration waits for the real target');
assert.match(script, /data-tour-voice-status aria-live="polite"/, 'Realtime narration status is announced');
assert.doesNotMatch(script, /speechSynthesis|SpeechSynthesisUtterance|\/api\/narration|createCedarNarrator/, 'robotic fallback and Speech API path are removed');
assert.match(script, /function cleanupAndRestore\([^)]*\)[\s\S]*?narrator\.cancel\(\)/, 'closing the tutorial cancels narration');
assert.match(script, /beforeunload[^\n]*narrator\.cancel\(\)/, 'unloading cancels narration');

const styles = fs.readFileSync(path.join(root, 'assets/css/styles.css'), 'utf8');
for (const selector of ['.tour-frame-wrap', '.tour-spotlight', '.tour-pointer', '.tour-chapter']) {
  assert.ok(styles.includes(selector), `tutorial styles include ${selector}`);
}
assert.match(styles, /\.tour-pointer\s*\{[^}]*pointer-events:\s*none/s, 'pointer cannot intercept target clicks');
assert.match(script, /addEventListener\('resize'/, 'tutorial recalculates pointer position after resize');
assert.match(script, /requestAnimationFrame\(schedulePointer/, 'resize positioning is animation-frame throttled');
assert.match(script, /tourSession/, 'each real-page iframe load is cache-busted from other localhost projects');
assert.match(script, /targetAttempt/, 'target handshake retries before showing the unavailable fallback');
assert.match(script, /frame\.contentDocument/, 'same-origin real page geometry backs up the message bridge');
assert.match(script, /aria-current="step"/, 'active chapter is exposed programmatically');
assert.match(script, /aria-live="polite"/, 'step progress is announced politely');
assert.match(styles, /@media\s*\(max-width:\s*900px\)/, 'tutorial has a narrow-screen layout');
assert.match(styles, /@media\s*\(max-height:\s*680px\)/, 'tutorial has a short-screen layout');
assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/, 'tutorial respects reduced motion');
assert.match(styles, /@media\s*\(prefers-reduced-transparency:\s*reduce\)/, 'tutorial respects reduced transparency');
assert.doesNotMatch(styles, /\.tour-demo/, 'simulated tutorial styles are removed');
assert.match(styles, /@media\s*\(max-width:\s*900px\)[\s\S]*?\.tour-ai-disclosure\s*\{[^}]*display:\s*none/s, 'AI narration disclosure does not crowd narrow tutorial chrome');
assert.match(styles, /@media\s*\(max-height:\s*680px\)[\s\S]*?\.tour-card\s*\{[^}]*overflow-y:\s*auto/s, 'only tutorial card scrolls on short screens');
assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.tour-pointer[^}]*animation:\s*none/s, 'pointer animation stops under reduced motion');

const tokens = fs.readFileSync(path.join(root, 'assets/css/tokens.css'), 'utf8');
assert.match(tokens, /--sidebar-w:\s*252px/, 'tutorial preserves compact sidebar width');
assert.match(styles, /\.step-link\s*\{[^}]*min-height:\s*40px/s, 'tutorial preserves compact specialist rows');

console.log('Static tutorial checks passed.');
