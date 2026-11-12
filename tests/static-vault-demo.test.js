const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const vault = fs.readFileSync(path.join(root, 'vault.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'assets/css/styles.css'), 'utf8');

assert.match(vault, /data-vault-root/, 'vault provides one live library root');
assert.match(vault, /YOUR COMPLETED WORK/, 'vault explains that it contains completed work');
assert.match(vault, /View and download your finished or approved documents/, 'vault gives a simple navigation instruction');
assert.match(vault, /Loading your completed work/, 'vault has an accessible loading state');
assert.doesNotMatch(vault, /Trusted Expert Blueprint|Strength and longevity coaching/i, 'vault contains no fictional artifact content');
assert.doesNotMatch(vault, /role="tab"|data-vault-tab|id="panel-/, 'vault contains no static specialist tabs or panels');
assert.doesNotMatch(vault, /Download everything/i, 'vault has no generic portfolio download');
assert.doesNotMatch(vault, /assets\/pdfs\/fas-.*-demo\.pdf/, 'vault has no bundled demo PDF links');

const libraryIndex = vault.indexOf('assets/js/vault-library.js');
const uiIndex = vault.indexOf('assets/js/artifact-ui.js');
assert.ok(libraryIndex >= 0, 'vault loads the library selector');
assert.ok(uiIndex > libraryIndex, 'vault loads the library selector before the controller');

assert.match(styles, /\.vault-library\s*\{/, 'vault has a dynamic library layout');
assert.match(styles, /\.vault-card\s*\{/, 'vault has artifact card styles');
assert.match(styles, /\.vault-card__actions\s*\{/, 'vault has clear action styles');
assert.match(styles, /\.vault-state\s*\{/, 'vault has loading, empty, and error state styles');
assert.match(styles, /\.vault-detail\s*\{/, 'vault has an expanded document view');
assert.match(styles, /@media[^\{]*\(max-width:\s*720px\)[\s\S]*\.vault-card__actions/, 'vault actions stack on narrow screens');
assert.match(styles, /\.vault-library--cards\s*\{/, 'vault has a responsive card grid');
assert.match(styles, /\.vault-library--list\s*\{/, 'vault has a compact list layout');
assert.match(styles, /\.vault-view-toggle\s*\{/, 'vault has a clear view toggle');
assert.match(styles, /\.vault-card__summary\s*\{[^}]*-webkit-line-clamp/s, 'library summaries are clamped');
assert.match(styles, /\.vault-preview-dialog\s*\{/, 'vault has a modal preview surface');
assert.match(styles, /\.vault-preview-dialog::backdrop\s*\{/, 'modal preview has a backdrop');
assert.match(styles, /\.vault-preview-dialog__head\s*\{[^}]*position:\s*sticky/s, 'preview actions stay visible');
assert.match(styles, /@media[^\{]*\(max-width:\s*720px\)[\s\S]*\.vault-preview-dialog/, 'preview adapts on narrow screens');
assert.match(styles, /@media[^\{]*\(max-width:\s*1100px\)[\s\S]*\.vault-library--cards[^}]*repeat\(2/, 'card grid reduces to two columns before it overflows');
assert.match(styles, /@media[^\{]*\(max-width:\s*820px\)[\s\S]*\.vault-library--cards[^}]*1fr/, 'card grid becomes one column at compact widths');
assert.match(styles, /\.vault-preview-dialog__head\s*>\s*div:first-child\s*\{[^}]*min-width:\s*0/s, 'preview title flex child may shrink');
assert.match(styles, /\.vault-preview-dialog__head h2\s*\{[^}]*overflow-wrap:\s*anywhere/s, 'long preview titles wrap without horizontal overflow');

console.log('Dynamic Vault shell and styles checks passed.');
