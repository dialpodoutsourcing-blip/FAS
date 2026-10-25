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
    var mediaDevices = options.mediaDevices || (root && root.navigator && root.navigator.mediaDevices);
    var fetchImpl = options.fetchImpl || (root && root.fetch && root.fetch.bind(root));
    var getAccessToken = options.getAccessToken || function () { return Promise.resolve(''); };
    var lifecycleTarget = options.lifecycleTarget || (root && root.document);
    var onState = options.onState || function () {};
    var onPartialTranscript = options.onPartialTranscript || function () {};
    var onFinalTranscript = options.onFinalTranscript || function () {};
    var onError = options.onError || function () {};
    var peer = null;
    var channel = null;
    var audio = null;
    var localStream = null;
    var currentState = 'idle';
    var ready = false;
    var paused = false;
    var stopped = false;
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

    function setState(value) {
      if (currentState === value) return;
      currentState = value;
      onState(value);
    }

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

    function send(payload) {
      if (!channel || channel.readyState !== 'open' || stopped) return false;
      channel.send(JSON.stringify(payload));
      return true;
    }

    function playRemote() {
      if (!audio || !audio.play) return;
      var playing;
      try { playing = audio.play(); } catch (_) { return; }
      if (playing && playing.catch) playing.catch(function () {});
    }

    function sendSpeech(text) {
      if (!text || paused || stopped) return false;
      if (!ready) { queuedSpeech = text; return false; }
      responseActive = true;
      playRemote();
      return send({
        type: 'response.create',
        response: {
          instructions: 'Speak only the following application-supplied interview copy. Preserve its meaning and wording. Add nothing. Copy: ' + text
        }
      });
    }

    function cancelSpeech() {
      if (responseActive) send({ type: 'response.cancel' });
      responseActive = false;
      if (audio && audio.pause) audio.pause();
    }

    function finalizeTranscript(data) {
      var itemId = normalizedText(data.item_id || data.itemId);
      var turnId = normalizedText(data.turn_id || data.turnId || itemId);
      var text = normalizedText(data.transcript || data.text || partials.get(itemId));
      if (!itemId) itemId = turnId || ('voice-item-' + Date.now());
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
        if (!paused && !stopped) setState('speaking');
        return;
      }
      if (data.type === 'response.done') {
        responseActive = false;
        if (!paused && !stopped) setState('listening');
        return;
      }
      if (data.type === 'error') {
        responseActive = false;
        reportError('The voice interview encountered a connection error.', 'voice_realtime_error');
      }
    }

    function bindLifecycle() {
      if (!lifecycleTarget || !lifecycleTarget.addEventListener || lifecycleBound) return;
      lifecycleTarget.addEventListener('visibilitychange', handleVisibility);
      lifecycleTarget.addEventListener('pagehide', handlePageHide);
      lifecycleBound = true;
    }

    function unbindLifecycle() {
      if (!lifecycleTarget || !lifecycleTarget.removeEventListener || !lifecycleBound) return;
      lifecycleTarget.removeEventListener('visibilitychange', handleVisibility);
      lifecycleTarget.removeEventListener('pagehide', handlePageHide);
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
      playRemote();
      setState('connecting');
      bindLifecycle();
      startPromise = Promise.resolve().then(function () {
        return mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      }).then(function (stream) {
        localStream = stream;
        peer = makePeer();
        var tracks = stream.getAudioTracks ? stream.getAudioTracks() : [];
        tracks.forEach(function (track) { peer.addTransceiver(track, { direction: 'sendrecv', streams: [stream] }); });
        peer.ontrack = function (event) { if (!audio) return; audio.srcObject = event.streams && event.streams[0] || null; playRemote(); };
        channel = peer.createDataChannel('oai-events');
        channel.addEventListener('open', function () {
          ready = true;
          if (!paused && !stopped) setState('listening');
          if (queuedSpeech && !paused) { var text = queuedSpeech; queuedSpeech = ''; sendSpeech(text); }
        });
        channel.addEventListener('message', handleMessage);
        return peer.createOffer();
      }).then(function (offer) {
        return peer.setLocalDescription(offer).then(function () { return offer; });
      }).then(function (offer) {
        return Promise.resolve(getAccessToken()).then(function (token) {
          var headers = { 'Content-Type': 'application/sdp' };
          if (token) headers.Authorization = 'Bearer ' + token;
          return fetchImpl('/api/realtime-interview-session', { method: 'POST', headers: headers, body: offer.sdp });
        });
      }).then(function (response) {
        if (!response || !response.ok) throw safeError('Voice interview unavailable.', 'voice_connection_failed');
        return response.text();
      }).then(function (sdp) {
        return peer.setRemoteDescription({ type: 'answer', sdp: sdp });
      }).then(function () { return true; }).catch(function (error) {
        if (currentState !== 'unsupported') reportError('Microphone permission or voice connection failed. You can continue by typing.', error && error.code || 'voice_connection_failed');
        throw error;
      });
      return startPromise;
    }

    function speak(text) {
      currentSpeech = normalizedText(text);
      queuedSpeech = '';
      if (!currentSpeech || stopped) return false;
      if (responseActive) cancelSpeech();
      return sendSpeech(currentSpeech);
    }

    function repeat() { return currentSpeech ? speak(currentSpeech) : false; }

    function pause() {
      if (stopped) return;
      paused = true;
      if (localStream && localStream.getAudioTracks) localStream.getAudioTracks().forEach(function (track) { track.enabled = false; });
      cancelSpeech();
      setState('paused');
    }

    function resume() {
      if (stopped || !localStream) return false;
      paused = false;
      localStream.getAudioTracks().forEach(function (track) { track.enabled = true; });
      playRemote();
      setState(ready ? 'listening' : 'connecting');
      return true;
    }

    function stop(stopOptions) {
      if (stopPromise) return stopPromise;
      if (stopped) return Promise.resolve();
      pause();
      var waits = Array.from(inFlight);
      if (stopOptions && stopOptions.waitFor) waits.push(Promise.resolve(stopOptions.waitFor));
      stopPromise = Promise.allSettled(waits).then(function () {
        stopped = true;
        ready = false;
        unbindLifecycle();
        if (localStream && localStream.getTracks) localStream.getTracks().forEach(function (track) { if (track.stop) track.stop(); });
        if (channel && channel.close) channel.close();
        if (peer && peer.close) peer.close();
        if (audio) { if (audio.pause) audio.pause(); audio.srcObject = null; audio.src = ''; }
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
      state: function () { return currentState; }
    });
  }

  return { createRealtimeInterviewer: createRealtimeInterviewer };
});
