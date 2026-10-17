const assert = require('node:assert/strict');
const { translateFrameRect, chooseCardPlacement, CHAPTER_URLS } = require('../assets/js/tutorial.js');

assert.deepEqual(CHAPTER_URLS, {
  dashboard:'index.html?tour=1',
  adam:'chat.html?agent=extract&tour=1',
  vault:'vault.html?tour=1',
  launch:'launch.html?tour=1'
});
assert.deepEqual(translateFrameRect({left:10,top:20,width:100,height:50},{left:200,top:80},1), {left:210,top:100,width:100,height:50});
assert.deepEqual(translateFrameRect({left:10,top:20,width:100,height:50},{left:200,top:80},0.8), {left:208,top:96,width:80,height:40});

const viewport = { width:1200, height:700 };
const card = { width:300, height:220 };
assert.equal(chooseCardPlacement({left:100,top:200,width:100,height:80}, viewport, card), 'right');
assert.equal(chooseCardPlacement({left:950,top:200,width:100,height:80}, viewport, card), 'left');
assert.equal(chooseCardPlacement({left:200,top:80,width:800,height:80}, viewport, card), 'bottom');
assert.equal(chooseCardPlacement({left:200,top:520,width:800,height:80}, viewport, card), 'top');
assert.equal(chooseCardPlacement({left:200,top:120,width:400,height:260}, {width:800,height:500}, card), 'docked');

console.log('Tutorial geometry checks passed.');
