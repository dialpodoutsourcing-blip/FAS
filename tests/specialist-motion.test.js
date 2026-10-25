'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'..','assets','css','styles.css'),'utf8');const nav=fs.readFileSync(path.join(__dirname,'..','assets','js','nav.js'),'utf8');const adam=fs.readFileSync(path.join(__dirname,'..','assets','js','adam.js'),'utf8');
test('every specialist has a unique additive motion signature',()=>{
 const names=['anchorSettle','extractFacet','radarSweep','forgeFlame','architectTrace','voiceWave','launchRise'];for(const name of names){assert.match(css,new RegExp(`@keyframes\\s+${name}\\b`));assert.match(css,new RegExp(`animation[^;]*${name}`));}
 for(const key of ['anchor','extract','radar','forge','architect','voice','launch'])assert.match(css,new RegExp(`data-agent-motion=["']?${key}`));
 assert.ok(nav.includes('data-agent-motion'));assert.ok(adam.includes('data-agent-motion'));
});
test('motion respects reduced preferences and avoids layout properties',()=>{
 const reduced=css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*$/);assert.ok(reduced);assert.match(reduced[0],/animation:\s*none/);
 for(const block of css.matchAll(/@keyframes\s+(?:anchorSettle|extractFacet|radarSweep|forgeFlame|architectTrace|voiceWave|launchRise)\b[\s\S]*?\n\}/g))assert.doesNotMatch(block[0],/\b(?:width|height|top|left|margin|padding):/);
});

