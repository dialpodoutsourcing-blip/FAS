'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createClipNarrator}=require('../assets/js/clip-narrator.js');

function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return{promise,resolve};}
function harness(){
 const requests=[],pending=[],revoked=[];
 const audio={src:'',currentTime:0,plays:0,pauses:0,play(){this.plays+=1;return Promise.resolve();},pause(){this.pauses+=1;},removeAttribute(name){if(name==='src')this.src='';},load(){}};
 const narrator=createClipNarrator({audioFactory:()=>audio,fetchImpl:(url,init)=>{requests.push({url,init});const d=deferred();pending.push(d);return d.promise;},urlApi:{createObjectURL:blob=>'blob:'+blob.id,revokeObjectURL:url=>revoked.push(url)},abortControllerFactory:()=>({signal:{},aborted:false,abort(){this.aborted=true;}})});
 return{audio,narrator,requests,pending,revoked};
}

test('Next cuts the current clip immediately and stale audio can never play',async()=>{
 const h=harness();await h.narrator.connect();
 const first=h.narrator.speak('First step');
 await Promise.resolve();
 h.pending[0].resolve({ok:true,blob:async()=>({id:'first'})});await first;
 assert.equal(h.audio.src,'blob:first');assert.equal(h.audio.plays,1);
 const second=h.narrator.speak('Second step');
 await Promise.resolve();
 assert.equal(h.audio.pauses,2,'navigation pauses playback synchronously');
 assert.equal(h.audio.src,'','navigation removes the old clip synchronously');
 h.pending[1].resolve({ok:true,blob:async()=>({id:'second'})});await second;
 assert.equal(h.audio.src,'blob:second');assert.equal(h.audio.plays,2);
});

test('rapid navigation aborts intermediate requests and plays only the visible step',async()=>{
 const h=harness();await h.narrator.connect();
 const one=h.narrator.speak('One');
 await Promise.resolve();
 const two=h.narrator.speak('Two');
 await Promise.resolve();
 const three=h.narrator.speak('Three');
 await Promise.resolve();
 h.pending[0].resolve({ok:true,blob:async()=>({id:'one'})});
 h.pending[1].resolve({ok:true,blob:async()=>({id:'two'})});
 h.pending[2].resolve({ok:true,blob:async()=>({id:'three'})});
 await Promise.all([one,two,three]);
 assert.equal(h.audio.src,'blob:three');assert.equal(h.audio.plays,1);
 assert.match(h.requests[2].init.body,/Three/);
});
