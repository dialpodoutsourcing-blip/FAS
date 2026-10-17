const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'chat.html', 'review.html', 'vault.html', 'launch.html'];

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const sidebar = html.match(/<nav class="sidebar" id="sidebar"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.ok(sidebar, `${page} has the shared sidebar`);
  assert.equal((sidebar.match(/class="[^"]*\bnav-link\b[^"]*"[^>]*>[\s\S]*?<svg/g) || []).length, 5, `${page} keeps all five navigation icons`);
  assert.equal((sidebar.match(/<use href="#em-(?:anchor|extract|radar|forge|architect|voice|launch)"/g) || []).length, 7, `${page} keeps all seven specialist emblems`);
  assert.match(sidebar, /class="user__name"[^>]*>Alex Morgan</, `${page} shows the expert name`);
  assert.match(sidebar, /class="user__sub">Forty Forward Coaching</, `${page} shows the business name`);
  assert.match(sidebar, /class="user__settings"[^>]*aria-label="Open settings"/, `${page} includes an accessible settings control`);
  assert.match(sidebar, /user__settings[\s\S]*?<svg[^>]*>[\s\S]*?<path[^>]+M12 15\.5/s, `${page} settings control uses the shared gear icon`);
}

const vault = fs.readFileSync(path.join(root, 'vault.html'), 'utf8');
for (const symbol of ['anchor', 'extract', 'radar', 'forge', 'architect', 'voice', 'launch']) {
  assert.match(vault, new RegExp(`<symbol id="em-${symbol}"`), `vault defines ${symbol} icon sprite`);
}

const styles = fs.readFileSync(path.join(root, 'assets/css/styles.css'), 'utf8');
const tokens = fs.readFileSync(path.join(root, 'assets/css/tokens.css'), 'utf8');
assert.match(styles, /\.sidebar__foot\s*\{[^}]*margin-top:\s*auto/s, 'expert account remains pinned to the sidebar bottom');
assert.match(styles, /\.user__settings/, 'settings control has shared styling');
assert.match(tokens, /--sidebar-w:\s*252px/, 'every desktop page uses the same compact sidebar width');
assert.match(styles, /\.sidebar\s*\{[^}]*padding:\s*12px 10px 10px[^}]*gap:\s*10px/s, 'shared sidebar reserves vertical room for an eighth specialist');
assert.match(styles, /\.brand__mark\s*\{[^}]*width:\s*78px[^}]*height:\s*44px/s, 'shared logo uses the approved compact size');
assert.match(styles, /\.nav-link\s*\{[^}]*min-height:\s*36px[^}]*font-size:\s*12px/s, 'main navigation uses one compact global size');
assert.match(styles, /\.step-link\s*\{[^}]*min-height:\s*40px[^}]*gap:\s*7px/s, 'specialist links reserve room for an eighth row');
assert.match(styles, /\.sidebar \.em--xs\s*\{[^}]*width:\s*29px[^}]*height:\s*29px/s, 'specialist emblems use the compact shared size');
assert.match(styles, /\.user\s*\{[^}]*padding:\s*7px/s, 'expert settings card remains compact and visible');
assert.doesNotMatch(styles, /\.chat-page \.sidebar(?:\s|\.|__)/, 'chat does not override shared sidebar sizing or visibility');

console.log('Shared sidebar checks passed.');
