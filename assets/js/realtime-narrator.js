(function(root){
 'use strict';
 function createRealtimeNarrator(options){
  options=options||{};var makePeer=options.peerFactory||function(){return new root.RTCPeerConnection();},makeAudio=options.audioFactory||function(){return new root.Audio();},fetchImpl=options.fetchImpl||(root.fetch&&root.fetch.bind(root)),onStatus=options.onStatus||function(){};
  var peer=null,channel=null,audio=null,ready=false,active=false,cancelPending=false,muted=false,destroyed=false,currentText='',queuedText='',generation=0;
  function status(value){if(!destroyed)onStatus(value);}
  function send(value){if(channel&&channel.readyState==='open')channel.send(JSON.stringify(value));}
  function request(text){if(!text||muted||destroyed)return;var token=++generation;active=true;cancelPending=false;if(audio&&audio.play)audio.play().catch(function(){status('Narration unavailable — captions are still available');});send({type:'response.create',response:{instructions:'Speak only this tutorial narration. Preserve its meaning exactly. Use warm, natural, conversational pacing. Do not add facts, greetings, questions, or closing remarks. Narration: '+text,metadata:{tutorial_token:String(token)}}});}
  function cancel(){generation+=1;queuedText='';if(active&&!cancelPending){send({type:'response.cancel'});cancelPending=true;}if(audio&&audio.pause)audio.pause();}
  async function connect(){
   status('Connecting ADAM…');
   try{peer=makePeer();audio=makeAudio();audio.autoplay=true;peer.addTransceiver('audio',{direction:'recvonly'});peer.ontrack=function(event){audio.srcObject=event.streams&&event.streams[0];if(audio.play)audio.play().catch(function(){status('Narration unavailable — captions are still available');});};channel=peer.createDataChannel('oai-events');channel.addEventListener('open',function(){ready=true;status('ADAM ready');if(queuedText){var text=queuedText;queuedText='';request(text);}});channel.addEventListener('message',function(event){var data;try{data=JSON.parse(event.data);}catch(_){return;}if(data.type==='response.output_audio.delta'||data.type==='response.audio.delta')status('ADAM speaking');else if(data.type==='response.done'){active=false;cancelPending=false;status(muted?'Muted':'ADAM ready');if(queuedText&&!muted){var nextText=queuedText;queuedText='';request(nextText);}}else if(data.type==='error'){active=false;cancelPending=false;status('Narration unavailable — captions are still available');}});var offer=await peer.createOffer();await peer.setLocalDescription(offer);var response=await fetchImpl('/api/realtime-session',{method:'POST',headers:{'Content-Type':'application/sdp'},body:offer.sdp});if(!response.ok)throw new Error('Realtime session unavailable');await peer.setRemoteDescription({type:'answer',sdp:await response.text()});return true;
   }catch(error){status('Narration unavailable — captions are still available');throw error;}
  }
  function speak(text){currentText=String(text||'').trim();cancel();if(!currentText||muted)return;if(!ready||active){queuedText=currentText;return;}request(currentText);}
  function replay(){if(!currentText||muted)return;cancel();if(active){queuedText=currentText;return;}request(currentText);}
  function mute(){muted=true;cancel();status('Muted');}
  function unmute(){muted=false;status(ready?'ADAM ready':'Connecting ADAM…');if(currentText){queuedText=currentText;if(ready&&!active){queuedText='';request(currentText);}}}
  function destroy(){if(destroyed)return;cancel();destroyed=true;ready=false;if(channel&&channel.close)channel.close();if(peer&&peer.close)peer.close();if(audio){if(audio.pause)audio.pause();audio.srcObject=null;audio.src='';}}
  return Object.freeze({connect:connect,speak:speak,cancel:cancel,mute:mute,unmute:unmute,replay:replay,isMuted:function(){return muted;},destroy:destroy});
 }
 var api={createRealtimeNarrator:createRealtimeNarrator};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.createRealtimeNarrator=createRealtimeNarrator;}
})(typeof window!=='undefined'?window:null);
