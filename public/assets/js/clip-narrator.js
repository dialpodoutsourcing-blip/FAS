(function(root,factory){var api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.createClipNarrator=api.createClipNarrator;}})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 function createClipNarrator(options){
  options=options||{};var makeAudio=options.audioFactory||function(){return new root.Audio();},fetchImpl=options.fetchImpl||(root.fetch&&root.fetch.bind(root)),getAccessToken=options.getAccessToken||function(){return Promise.resolve('');},urlApi=options.urlApi||(root.URL||URL),makeAbort=options.abortControllerFactory||function(){return new AbortController();},onStatus=options.onStatus||function(){};
  var audio=makeAudio(),controller=null,currentUrl='',currentText='',generation=0,muted=false,destroyed=false,playbackResolved=false,resolvePlayback,playbackAvailable=new Promise(function(resolve){resolvePlayback=resolve;});audio.autoplay=true;
  function settle(value){if(!playbackResolved){playbackResolved=true;resolvePlayback(Boolean(value));}}
  function stop(){generation+=1;if(controller){controller.abort();controller=null;}if(audio.pause)audio.pause();audio.currentTime=0;if(audio.removeAttribute)audio.removeAttribute('src');else audio.src='';if(audio.load)audio.load();if(currentUrl){urlApi.revokeObjectURL(currentUrl);currentUrl='';}}
  function connect(){onStatus('ADAM ready');return Promise.resolve(true);}
  function unlockPlayback(){try{var result=audio.play&&audio.play();if(audio.pause)audio.pause();return Promise.resolve(result).then(function(){return true;},function(){return false;});}catch(_){return Promise.resolve(false);}}
  function speak(text){currentText=String(text||'').trim();stop();if(!currentText||muted||destroyed)return Promise.resolve(false);var token=generation,active=controller=makeAbort();onStatus('Preparing ADAM…');return Promise.resolve(getAccessToken()).then(function(accessToken){var headers={'Content-Type':'application/json'};if(accessToken)headers.Authorization='Bearer '+accessToken;return fetchImpl('/api/narration',{method:'POST',headers:headers,body:JSON.stringify({text:currentText}),signal:active.signal});}).then(function(response){if(!response.ok)throw new Error('Narration unavailable');return response.blob();}).then(function(blob){if(destroyed||muted||token!==generation)return false;controller=null;currentUrl=urlApi.createObjectURL(blob);audio.src=currentUrl;onStatus('ADAM speaking');return Promise.resolve(audio.play()).then(function(){settle(true);return true;});}).catch(function(error){if(token===generation&&!destroyed){settle(false);onStatus('Narration unavailable — captions are still available');}return false;});}
  function cancel(){stop();}
  function replay(){return speak(currentText);}
  function mute(){muted=true;stop();onStatus('Muted');}
  function unmute(){muted=false;onStatus('ADAM ready');return currentText?speak(currentText):Promise.resolve(false);}
  function destroy(){if(destroyed)return;stop();destroyed=true;settle(false);}
  return Object.freeze({connect:connect,unlockPlayback:unlockPlayback,speak:speak,cancel:cancel,replay:replay,mute:mute,unmute:unmute,isMuted:function(){return muted;},whenPlaybackAvailable:function(){return playbackAvailable;},destroy:destroy});
 }
 return{createClipNarrator:createClipNarrator};
});
