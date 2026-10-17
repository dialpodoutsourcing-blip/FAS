const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bridgePath = path.resolve(__dirname, '../assets/js/tutorial-frame.js');
assert.ok(fs.existsSync(bridgePath), 'tutorial frame bridge exists');
const bridge = require(bridgePath);

assert.equal(bridge.isTourMode('?tour=1'), true);
assert.equal(bridge.isTourMode('?agent=extract&tour=1'), true);
assert.equal(bridge.isTourMode('?tour=0'), false);
assert.equal(bridge.isTourMode(''), false);
assert.equal(bridge.validateMessage({ namespace:'fas-tour', type:'show-target', token:1, payload:{ target:'composer' } }), true);
assert.equal(bridge.validateMessage({ namespace:'wrong', type:'show-target', token:1, payload:{ target:'composer' } }), false);
assert.equal(bridge.validateMessage({ namespace:'fas-tour', type:'unknown', token:1, payload:{} }), false);
assert.equal(bridge.validateMessage({ namespace:'fas-tour', type:'show-target', token:'1', payload:{ target:'composer' } }), false);
assert.equal(bridge.validateMessage({ namespace:'fas-tour', type:'show-target', token:1, payload:{ target:7 } }), false);
assert.deepEqual(bridge.rectPayload({ left:1, top:2, width:3, height:4 }), { left:1, top:2, width:3, height:4 });

const typeTab = { attrs:{}, setAttribute(name, value) { this.attrs[name] = String(value); }, tabIndex:0 };
const talkTab = { attrs:{}, setAttribute(name, value) { this.attrs[name] = String(value); }, tabIndex:-1 };
const textPanel = { hidden:false };
const voicePanel = { hidden:true };
const fakeDocument = { querySelector(selector) { return ({
  '[data-tour-type-mode]':typeTab,
  '[data-tour-talk-mode]':talkTab,
  '#panel-text':textPanel,
  '#panel-voice':voicePanel
})[selector] || null; } };
assert.equal(bridge.selectTalkMode(fakeDocument), true);
assert.equal(typeTab.attrs['aria-selected'], 'false');
assert.equal(talkTab.attrs['aria-selected'], 'true');
assert.equal(textPanel.hidden, true);
assert.equal(voicePanel.hidden, false);

const source = fs.readFileSync(bridgePath, 'utf8');
assert.match(source, /event\.source !== window\.parent/, 'bridge validates parent source');
assert.match(source, /addEventListener\('submit',[^\n]*true/, 'bridge blocks submit in capture phase');
assert.match(source, /addEventListener\('click',[\s\S]*?\}, true\)/, 'bridge blocks unsafe clicks in capture phase');
assert.match(source, /getUserMedia|data-voice-start/, 'bridge explicitly recognizes voice controls');
assert.match(source, /frame-ready/);
assert.match(source, /target-ready/);
assert.match(source, /target-missing/);
assert.match(source, /interaction-complete/);
assert.match(source, /activeTarget\.contains\(event\.target\)[\s\S]*?send\('interaction-complete'/, 'clicking the highlighted real control completes the guided interaction');
assert.match(source, /geometry-update/);
assert.match(source, /payload\.action === 'selectTalkMode'[\s\S]*?selectTalkMode\(doc\)/, 'Talk tutorial action applies visual state directly');
assert.doesNotMatch(source, /getUserMedia/, 'tutorial bridge never requests microphone access');

const chat = fs.readFileSync(path.resolve(__dirname, '../chat.html'), 'utf8');
assert.match(chat, /id="tab-text"[^>]*data-tour-type-mode/);
assert.match(chat, /id="tab-voice"[^>]*data-tour-talk-mode/);

console.log('Tutorial frame bridge checks passed.');
