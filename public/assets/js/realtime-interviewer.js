(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.FAS = root.FAS || {};
    root.FAS.createRealtimeInterviewer = api.createRealtimeInterviewer;
  }
})(typeof window !== 'undefined' ? window : null, function (root) {
  'use strict';

  function normalizedText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function createRealtimeInterviewer(options) {
    options = options || {};
    var makePeer = options.peerFactory || (root && root.RTCPeerConnection ? function () { return new root.RTCPeerConnection(); } : null);
    var makeAudio = options.audioFactory || (root && root.Audio ? function () { return new root.Audio(); } : null);
    var makeMediaStream = options.mediaStreamFactory || (root && root.MediaStream ? function (tracks) { return new root.MediaStream(tracks); } : null);
    var mediaDevices = options.mediaDevices || (root && root.navigator && root.navigator.mediaDevices);
    var fetchImpl = options.fetchImpl || (root && root.fetch && root.fetch.bind(root));
    var getAccessToken = options.getAccessToken || function () { return Promise.resolve(''); };
    var lifecycleTarget = options.lifecycleTarget || (root && root.document);
    var pageLifecycleTarget = options.pageLifecycleTarget || root || lifecycleTarget;
    var makeAbortController = options.abortControllerFactory || (typeof AbortController !== 'undefined' ? function () { return new AbortController(); } : null);
    var onState = options.onState || function () {};
    var onPartialTranscript = options.onPartialTranscript || function () {};
    var onFinalTranscript = options.onFinalTranscript || function () {};
    var onError = options.onError || function () {};
    var onCaptureChange = options.onCaptureChange || function () {};
    var peer = null;
    var channel = null;
    var audio = null;
    var localStream = null;
    var currentState = 'idle';
    var ready = false;
    var paused = false;
    var stopped = false;
    var stopRequested = false;
    var cleaned = false;
    var responseActive = false;
    var currentSpeech = '';
    var queuedSpeech = '';
    var partials = new Map();
    var latestPartial = '';
    var finalizedItems = new Set();
    var finalizedTurns = new Set();
    var inFlight = new Set();
    var startPromise = null;
    var stopPromise = null;
    var lifecycleBound = false;
    var abortController = null;
    var speechResolver = null;

    function setState(value) {
      if (currentState === value) return;
      currentState = value;
      onState(value);
    }

    function captureActive() { return Boolean(!stopped&&!stopRequested&&!cleaned&&localStream&&localStream.getAudioTracks&&localStream.getAudioTracks().some(function(track){return track.enabled!==false;})); }
    function notifyCapture() { onCaptureChange(captureActive()); }

    function safeError(message, code) {
      var error = new Error(message);
      if (code) error.code = code;
      return error;
    }

    function reportError(message, code) {
      var error = safeError(message, code);
      setState(code === 'voice_unsupported' ? 'unsupported' : 'error');
      onError(error);
      return error;
    }

    function finishSpeech(value) { if (speechResolver) { var resolve = speechResolver; speechResolver = null; resolve(value); } }

    function cleanupResources() {
      if (cleaned) return;
      cleaned = true;
      ready = false;
      responseActive = false;
      finishSpeech(false);
      unbindLifecycle();
      if (localStream && localStream.getTracks) localStream.getTracks().forEach(function (track) { track.enabled = false; if (track.stop) track.stop(); });
      notifyCapture();
      if (channel && channel.close) channel.close();
      if (peer && peer.close) peer.close();
      if (audio) { if (audio.pause) audio.pause(); audio.srcObject = null; audio.src = ''; }
    }

    function terminateWithError(message, code) {
      paused = true;
      if (abortController) abortController.abort();
      cleanupResources();
      return reportError(message, code);
    }

    function send(payload) {
      if (!channel || channel.readyState !== 'open' || stopped) return false;
      channel.send(JSON.stringify(payload));
      return true;
    }

    function playRemote(notifyFailure) {
      if (!audio || !audio.play) return;
      var playing;
      try { playing = audio.play(); } catch (_) { if (notifyFailure) onError(safeError('ADAM audio could not play. Continue with Type or retry voice.', 'voice_playback_failed')); return; }
      if (playing && playing.catch) playing.catch(function () { if (notifyFailure) onError(safeError('ADAM audio could not play. Continue with Type or retry voice.', 'voice_playback_failed')); });
    }

    function sendSpeech(text) {
      if (!text || stopped || stopRequested || cleaned) return false;
      if (!ready) { queuedSpeech = text; return false; }
      responseActive = true;
      playRemote(true);
      var sent = send({
        type: 'response.create',
        response: {
          instructions: 'Speak only the following application-supplied interview copy. Preserve its meaning and wording. Add nothing. Copy: ' + text
        }
      });
      if (!sent) return false;
      return new Promise(function (resolve) { finishSpeech(false); speechResolver = resolve; });
    }

    function cancelSpeech() {
      if (responseActive) send({ type: 'response.cancel' });
      responseActive = false;
      finishSpeech(false);
      if (audio && audio.pause) audio.pause();
    }

    function finalizeTranscript(data) {
      var itemId = normalizedText(data.item_id || data.itemId);
      var turnId = normalizedText(data.turn_id || data.turnId || itemId);
      var text = normalizedText(data.transcript || data.text || partials.get(itemId));
      if (!itemId) { terminateWithError('The spoken transcript could not be identified safely. Continue with Type or retry voice.', 'voice_transcript_identity_missing'); return; }
      if (!turnId) turnId = itemId;
      if (!text || finalizedItems.has(itemId) || finalizedTurns.has(turnId)) return;
      finalizedItems.add(itemId);
      finalizedTurns.add(turnId);
      partials.delete(itemId);
      latestPartial = '';
      var work;
      try { work = Promise.resolve(onFinalTranscript({ turnId: turnId, itemId: itemId, text: text })); }
      catch (error) { work = Promise.reject(error); }
      var tracked = work.catch(function () { onError(safeError('The spoken answer could not be saved.', 'voice_turn_failed')); }).finally(function () { inFlight.delete(tracked); });
      inFlight.add(tracked);
    }

    function handleMessage(event) {
      var data;
      try { data = JSON.parse(event && event.data); } catch (_) { return; }
      if (!data || typeof data.type !== 'string') return;
      if (data.type === 'input_audio_buffer.speech_started') {
        if (responseActive) cancelSpeech();
        if (!paused && !stopped) setState('listening');
        return;
      }
      if (data.type === 'input_audio_buffer.speech_stopped') {
        if (!paused && !stopped) setState('thinking');
        return;
      }
      if (data.type === 'conversation.item.input_audio_transcription.delta' || data.type === 'input_audio_transcription.delta') {
        var itemId = normalizedText(data.item_id || data.itemId || 'current');
        var partial = normalizedText((partials.get(itemId) || '') + ' ' + String(data.delta || ''));
        partials.set(itemId, partial);
        latestPartial = partial;
        onPartialTranscript({ itemId: itemId === 'current' ? '' : itemId, text: partial });
        return;
      }
      if (data.type === 'conversation.item.input_audio_transcription.completed' || data.type === 'input_audio_transcription.completed') {
        finalizeTranscript(data);
        return;
      }
      if (data.type === 'response.output_audio.delta' || data.type === 'response.audio.delta') {
        responseActive = true;
        if (!stopped) setState('speaking');
        return;
      }
      if (data.type === 'response.done') {
        responseActive = false;
        finishSpeech(true);
        if (!stopped) setState(paused ? 'paused' : 'listening');
        return;
      }
      if (data.type === 'conversation.item.input_audio_transcription.failed' || data.type === 'input_audio_transcription.failed') {
        terminateWithError('The spoken answer could not be transcribed. Continue with Type or retry voice.', 'voice_transcription_failed');
        return;
      }
      if (data.type === 'error') {
        responseActive = false;
        terminateWithError('The voice interview encountered a connection error.', 'voice_realtime_error');
      }
    }

    function bindLifecycle() {
      if (!lifecycleTarget || !lifecycleTarget.addEventListener || lifecycleBound) return;
      lifecycleTarget.addEventListener('visibilitychange', handleVisibility);
      if(pageLifecycleTarget&&pageLifecycleTarget.addEventListener)pageLifecycleTarget.addEventListener('pagehide', handlePageHide);
      lifecycleBound = true;
    }

    function unbindLifecycle() {
      if (!lifecycleTarget || !lifecycleTarget.removeEventListener || !lifecycleBound) return;
      lifecycleTarget.removeEventListener('visibilitychange', handleVisibility);
      if(pageLifecycleTarget&&pageLifecycleTarget.removeEventListener)pageLifecycleTarget.removeEventListener('pagehide', handlePageHide);
      lifecycleBound = false;
    }

    function handleVisibility() { if (lifecycleTarget.hidden) pause(); }
    function handlePageHide() { pause(); }

    function start() {
      if (startPromise) return startPromise;
      if (!makePeer || !makeAudio || !mediaDevices || typeof mediaDevices.getUserMedia !== 'function' || !fetchImpl) {
        var unsupported = reportError('Voice interviews are not supported in this browser. You can continue by typing.', 'voice_unsupported');
        return Promise.reject(unsupported);
      }
      audio = makeAudio();
      audio.autoplay = true;
      playRemote(false);
      setState('connecting');
      bindLifecycle();
      abortController=makeAbortController?makeAbortController():null;
      startPromise = Promise.resolve().then(function () {
        return mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      }).then(function (stream) {
        if(stopRequested){if(stream.getTracks)stream.getTracks().forEach(function(track){track.enabled=false;if(track.stop)track.stop();});throw safeError('Voice start cancelled.','voice_stopped');}
        localStream = stream;
        if(paused&&stream.getAudioTracks)stream.getAudioTracks().forEach(function(track){track.enabled=false;});
        notifyCapture();
        peer = makePeer();
        var tracks = stream.getAudioTracks ? stream.getAudioTracks() : [];
        tracks.forEach(function (track) { peer.addTransceiver(track, { direction: 'sendrecv', streams: [stream] });if(track.addEventListener){track.addEventListener('ended',function(){if(!stopRequested)terminateWithError('Microphone access ended. Continue with Type or retry voice.','voice_microphone_ended');});track.addEventListener('mute',function(){if(!stopRequested)pause();});} });
        peer.ontrack = function (event) { if (!audio) return; audio.srcObject = event.streams && event.streams[0] || event.track && makeMediaStream && makeMediaStream([event.track]) || null; playRemote(true); };
        var peerFailure=function(){var state=peer&&peer.connectionState;if(!stopRequested&&!cleaned&&(state==='failed'||state==='closed'||state==='disconnected'))terminateWithError('The voice connection ended. Continue with Type or retry voice.','voice_connection_failed');};
        if(peer.addEventListener)peer.addEventListener('connectionstatechange',peerFailure);else peer.onconnectionstatechange=peerFailure;
        channel = peer.createDataChannel('oai-events');
        channel.addEventListener('open', function () {
          if(stopRequested||cleaned)return;
          ready = true;
          if (!paused && !stopped) setState('listening');
          if (queuedSpeech) { var text = queuedSpeech; queuedSpeech = ''; sendSpeech(text); }
        });
        channel.addEventListener('message', handleMessage);
        channel.addEventListener('error',function(){if(!stopRequested)terminateWithError('The voice connection ended. Continue with Type or retry voice.','voice_channel_error');});
        channel.addEventListener('close',function(){if(!stopRequested&&!cleaned)terminateWithError('The voice connection ended. Continue with Type or retry voice.','voice_channel_closed');});
        return peer.createOffer();
      }).then(function (offer) {
        if(stopRequested)throw safeError('Voice start cancelled.','voice_stopped');
        return peer.setLocalDescription(offer).then(function () { return offer; });
      }).then(function (offer) {
        return Promise.resolve(getAccessToken()).then(function (token) {
          var headers = { 'Content-Type': 'application/sdp' };
          if (token) headers.Authorization = 'Bearer ' + token;
          if(stopRequested)throw safeError('Voice start cancelled.','voice_stopped');
          return fetchImpl('/api/realtime-interview-session', { method: 'POST', headers: headers, body: offer.sdp,signal:abortController&&abortController.signal });
        });
      }).then(function (response) {
        if (!response || !response.ok) throw safeError('Voice interview unavailable.', 'voice_connection_failed');
        return response.text();
      }).then(function (sdp) {
        if(stopRequested)throw safeError('Voice start cancelled.','voice_stopped');
        return peer.setRemoteDescription({ type: 'answer', sdp: sdp });
      }).then(function () { return true; }).catch(function (error) {
        cleanupResources();
        if (!stopRequested&&currentState !== 'unsupported') reportError('Microphone permission or voice connection failed. You can continue by typing.', error && error.code || 'voice_connection_failed');
        throw error;
      });
      return startPromise;
    }

    function speak(text) {
      currentSpeech = normalizedText(text);
      queuedSpeech = '';
      if (!currentSpeech || stopped || stopRequested) return false;
      if (responseActive) cancelSpeech();
      return sendSpeech(currentSpeech);
    }

    function repeat() { return currentSpeech ? speak(currentSpeech) : false; }

    function pause() {
      if (stopped || stopRequested) return;
      paused = true;
      if (localStream && localStream.getAudioTracks) localStream.getAudioTracks().forEach(function (track) { track.enabled = false; });
      notifyCapture();
      cancelSpeech();
      setState('paused');
    }

    function resume() {
      if (stopped || stopRequested || cleaned || !localStream) return false;
      paused = false;
      localStream.getAudioTracks().forEach(function (track) { track.enabled = true; });
      notifyCapture();
      playRemote(true);
      setState(ready ? 'listening' : 'connecting');
      return true;
    }

    function stop(stopOptions) {
      if (stopPromise) return stopPromise;
      if (stopped) return Promise.resolve();
      pause();
      stopRequested=true;
      paused=true;
      if(localStream&&localStream.getAudioTracks)localStream.getAudioTracks().forEach(function(track){track.enabled=false;});
      notifyCapture();
      if(abortController)abortController.abort();
      var waits = Array.from(inFlight);
      if(startPromise)waits.push(startPromise.catch(function(){}));
      if (stopOptions && stopOptions.waitFor) waits.push(Promise.resolve(stopOptions.waitFor));
      stopPromise = Promise.allSettled(waits).then(function () {
        stopped = true;
        cleanupResources();
        setState('stopped');
      });
      return stopPromise;
    }

    return Object.freeze({
      start: start,
      speak: speak,
      repeat: repeat,
      pause: pause,
      resume: resume,
      stop: stop,
      partialTranscript: function () { return latestPartial; },
      state: function () { return currentState; },
      captureActive:captureActive
    });
  }

  return { createRealtimeInterviewer: createRealtimeInterviewer };
});
