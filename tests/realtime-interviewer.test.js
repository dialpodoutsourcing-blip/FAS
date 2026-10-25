'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function load() {
  delete require.cache[require.resolve('../assets/js/realtime-interviewer.js')];
  return require('../assets/js/realtime-interviewer.js');
}

class Channel {
  constructor() { this.readyState = 'connecting'; this.handlers = {}; this.sent = []; this.closed = 0; }
  addEventListener(name, fn) { (this.handlers[name] ||= []).push(fn); }
  emit(name, payload) { for (const fn of this.handlers[name] || []) fn(payload === undefined ? {} : { data: JSON.stringify(payload) }); }
  send(value) { this.sent.push(JSON.parse(value)); }
  close() { this.readyState = 'closed'; this.closed += 1; }
}

class Peer {
  constructor() { this.channel = new Channel(); this.transceivers = []; this.connectionState = 'new'; }
  addTransceiver(track, options) { this.transceivers.push([track, options]); return {}; }
  createDataChannel() { return this.channel; }
  async createOffer() { return { type: 'offer', sdp: 'v=0\r\nm=audio 9 RTP/AVP 0' }; }
  async setLocalDescription(value) { this.local = value; }
  async setRemoteDescription(value) { this.remote = value; }
  close() { this.connectionState = 'closed'; }
}

class LifecycleTarget {
  constructor() { this.hidden = false; this.handlers = {}; }
  addEventListener(name, fn) { (this.handlers[name] ||= []).push(fn); }
  removeEventListener(name, fn) { this.handlers[name] = (this.handlers[name] || []).filter(value => value !== fn); }
  emit(name) { for (const fn of this.handlers[name] || []) fn({ type: name }); }
}

function harness(overrides) {
  const peer = new Peer();
  const track = { kind: 'audio', enabled: true, stops: 0, stop() { this.stops += 1; } };
  const stream = { getAudioTracks: () => [track], getTracks: () => [track] };
  const mediaCalls = [];
  const mediaDevices = { async getUserMedia(constraints) { mediaCalls.push(constraints); return stream; } };
  const audio = { autoplay: false, srcObject: null, src: '', plays: 0, pauses: 0, play() { this.plays += 1; return Promise.resolve(); }, pause() { this.pauses += 1; } };
  const requests = [];
  const states = [];
  const partials = [];
  const finals = [];
  const errors = [];
  const captures = [];
  const lifecycle = new LifecycleTarget();
  const options = Object.assign({
    agentKey: 'anchor',
    peerFactory: () => peer,
    audioFactory: () => audio,
    mediaDevices,
    fetchImpl: async (url, init) => { requests.push({ url, init }); return new Response('v=0\r\nanswer', { status: 200 }); },
    getAccessToken: async () => 'access-token',
    lifecycleTarget: lifecycle,
    onState: value => states.push(value),
    onPartialTranscript: value => partials.push(value),
    onFinalTranscript: value => { finals.push(value); },
    onError: error => errors.push(error),
    onCaptureChange: active => captures.push(active)
  }, overrides || {});
  return { peer, track, stream, mediaCalls, mediaDevices, audio, requests, states, partials, finals, errors, captures, lifecycle, options };
}

function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }

test('unsupported capability fails before microphone or network traffic', async () => {
  const { createRealtimeInterviewer } = load();
  let fetched = 0;
  const controller = createRealtimeInterviewer({ peerFactory: null, mediaDevices: {}, fetchImpl: async () => { fetched += 1; } });
  await assert.rejects(controller.start(), error => error && error.code === 'voice_unsupported');
  assert.equal(fetched, 0);
  assert.equal(controller.state(), 'unsupported');
});

test('start unlocks playback, captures enhanced audio, negotiates send-receive SDP, and authenticates', async () => {
  const { createRealtimeInterviewer } = load();
  const h = harness();
  const controller = createRealtimeInterviewer(h.options);
  const started = controller.start();
  assert.equal(h.audio.plays, 1, 'playback is unlocked inside the user gesture call stack');
  await started;
  assert.deepEqual(h.mediaCalls[0], { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
  assert.equal(h.peer.transceivers.length, 1);
  assert.equal(h.peer.transceivers[0][0], h.track);
  assert.equal(h.peer.transceivers[0][1].direction, 'sendrecv');
  assert.equal(h.requests[0].url, '/api/realtime-interview-session');
  assert.equal(h.requests[0].init.headers.Authorization, 'Bearer access-token');
  assert.equal(h.requests[0].init.headers['X-FAS-Agent'], 'anchor');
  assert.equal(h.peer.remote.sdp, 'v=0\r\nanswer');
  assert.equal(h.captures.at(-1), true);
  h.peer.ontrack({ streams: ['remote-stream'] });
  assert.equal(h.audio.srcObject, 'remote-stream');
  h.peer.channel.readyState = 'open'; h.peer.channel.emit('open');
  assert.equal(controller.state(), 'listening');
});

test('plays a remote audio track when WebRTC omits the streams collection', async () => {
  const { createRealtimeInterviewer } = load();
  const generated = { tracks: [] };
  const h = harness({ mediaStreamFactory: tracks => { generated.tracks = tracks; return generated; } });
  const controller = createRealtimeInterviewer(h.options);
  await controller.start();
  const remoteTrack = { kind: 'audio' };
  h.peer.ontrack({ streams: [], track: remoteTrack });
  assert.equal(h.audio.srcObject, generated);
  assert.deepEqual(generated.tracks, [remoteTrack]);
  assert.ok(h.audio.plays > 1);
});

test('maps Realtime events to truthful states and finalizes each normalized turn exactly once', async () => {
  const { createRealtimeInterviewer } = load();
  const h = harness();
  const controller = createRealtimeInterviewer(h.options);
  await controller.start();
  h.peer.channel.readyState = 'open'; h.peer.channel.emit('open');
  h.peer.channel.emit('message', { type: 'input_audio_buffer.speech_started' });
  h.peer.channel.emit('message', { type: 'conversation.item.input_audio_transcription.delta', item_id: 'item-1', delta: '  My ' });
  h.peer.channel.emit('message', { type: 'conversation.item.input_audio_transcription.delta', item_id: 'item-1', delta: ' answer  ' });
  assert.equal(controller.partialTranscript(), 'My answer');
  assert.equal(h.partials.at(-1).text, 'My answer');
  h.peer.channel.emit('message', { type: 'input_audio_buffer.speech_stopped' });
  assert.equal(controller.state(), 'thinking');
  const completed = { type: 'conversation.item.input_audio_transcription.completed', item_id: 'item-1', transcript: '  My   answer. ', turn_id: 'turn-1' };
  h.peer.channel.emit('message', completed);
  h.peer.channel.emit('message', completed);
  assert.deepEqual(h.finals, [{ turnId: 'turn-1', itemId: 'item-1', text: 'My answer.' }]);
  h.peer.channel.emit('message', { type: 'response.output_audio.delta' });
  assert.equal(controller.state(), 'speaking');
  h.peer.channel.emit('message', { type: 'response.done' });
  assert.equal(controller.state(), 'listening');
  h.peer.channel.emit('message', { type: 'error', error: { message: 'private upstream detail' } });
  assert.equal(controller.state(), 'error');
  assert.equal(h.errors.length, 1);
  assert.doesNotMatch(h.errors[0].message, /private upstream detail/);
});

test('speech interruption, explicit pause/resume, and background lifecycle control the microphone safely', async () => {
  const { createRealtimeInterviewer } = load();
  const h = harness();
  const controller = createRealtimeInterviewer(h.options);
  await controller.start(); h.peer.channel.readyState = 'open'; h.peer.channel.emit('open');
  controller.speak('Here is the next question.');
  h.peer.channel.emit('message', { type: 'response.output_audio.delta' });
  h.peer.channel.emit('message', { type: 'input_audio_buffer.speech_started' });
  assert.equal(h.peer.channel.sent.at(-1).type, 'response.cancel');
  assert.ok(h.audio.pauses > 0);
  controller.pause();
  assert.equal(h.track.enabled, false);
  assert.equal(h.captures.at(-1), false);
  assert.equal(controller.state(), 'paused');
  controller.resume();
  assert.equal(h.track.enabled, true);
  assert.equal(h.captures.at(-1), true);
  assert.equal(controller.state(), 'listening');
  h.lifecycle.hidden = true; h.lifecycle.emit('visibilitychange');
  assert.equal(h.track.enabled, false);
  h.lifecycle.hidden = false; h.lifecycle.emit('visibilitychange');
  assert.equal(h.track.enabled, false, 'foregrounding never re-enables the microphone');
  controller.resume();
  h.lifecycle.emit('pagehide');
  assert.equal(h.track.enabled, false);
});

test('application copy can still be spoken while microphone input is paused', async () => {
  const { createRealtimeInterviewer } = load();
  const h = harness();
  const controller = createRealtimeInterviewer(h.options);
  await controller.start(); h.peer.channel.readyState = 'open'; h.peer.channel.emit('open');
  controller.pause();
  assert.equal(h.track.enabled, false);
  controller.speak('Your interview is complete.');
  assert.equal(h.peer.channel.sent.at(-1).type, 'response.create');
  assert.match(h.peer.channel.sent.at(-1).response.instructions, /interview is complete/);
  assert.equal(h.track.enabled, false);
});

test('speech playback failure is reported without disabling the Type fallback', async () => {
  const { createRealtimeInterviewer } = load();
  const h = harness();
  h.audio.play = function () { this.plays += 1; return this.plays > 1 ? Promise.reject(new Error('autoplay private detail')) : Promise.resolve(); };
  const controller = createRealtimeInterviewer(h.options);
  await controller.start(); h.peer.channel.readyState = 'open'; h.peer.channel.emit('open');
  controller.speak('A question');
  await Promise.resolve(); await Promise.resolve();
  assert.equal(h.errors.length, 1);
  assert.equal(h.errors[0].code, 'voice_playback_failed');
  assert.doesNotMatch(h.errors[0].message, /private detail/);
});

test('stop preserves partial text, never finalizes it, waits for finalized work, and cleans up once', async () => {
  const { createRealtimeInterviewer } = load();
  let release;
  const saved = new Promise(resolve => { release = resolve; });
  const h = harness({ onFinalTranscript: () => saved });
  const controller = createRealtimeInterviewer(h.options);
  await controller.start(); h.peer.channel.readyState = 'open'; h.peer.channel.emit('open');
  h.peer.channel.emit('message', { type: 'conversation.item.input_audio_transcription.delta', item_id: 'partial-item', delta: 'unfinished thought' });
  const waiting = controller.stop({ waitFor: saved });
  await Promise.resolve();
  assert.equal(h.track.stops, 0, 'resources remain owned until the durable turn finishes');
  release(); await waiting; await controller.stop();
  assert.equal(controller.partialTranscript(), 'unfinished thought');
  assert.equal(h.track.stops, 1);
  assert.equal(h.peer.channel.closed, 1);
  assert.equal(h.peer.connectionState, 'closed');
  assert.equal(h.audio.srcObject, null);
  assert.equal(controller.state(), 'stopped');
});

test('pause and stop remain authoritative when microphone permission resolves late', async () => {
  const { createRealtimeInterviewer } = load();
  const permission = deferred();
  const pausedHarness = harness({ mediaDevices: { getUserMedia: () => permission.promise } });
  const paused = createRealtimeInterviewer(pausedHarness.options);
  const starting = paused.start(); paused.pause(); permission.resolve(pausedHarness.stream); await starting;
  assert.equal(pausedHarness.track.enabled, false, 'late permission cannot override pause');

  const stopPermission = deferred(); let fetched = 0;
  const stoppedHarness = harness({ mediaDevices: { getUserMedia: () => stopPermission.promise }, fetchImpl: async () => { fetched += 1; } });
  const stopped = createRealtimeInterviewer(stoppedHarness.options);
  const lateStart = stopped.start().catch(() => false);
  const stopping = stopped.stop();
  stopPermission.resolve(stoppedHarness.stream);
  await Promise.all([lateStart, stopping]);
  assert.equal(stoppedHarness.track.stops, 1);
  assert.equal(fetched, 0);
  assert.equal(stopped.state(), 'stopped');
});

test('failed negotiation and runtime terminal events disable capture and release resources', async () => {
  const { createRealtimeInterviewer } = load();
  const failed = harness({ fetchImpl: async () => new Response('unavailable', { status: 502 }) });
  const failedController = createRealtimeInterviewer(failed.options);
  await assert.rejects(failedController.start());
  assert.equal(failed.track.stops, 1);
  assert.equal(failed.peer.connectionState, 'closed');

  for (const terminal of [
    { type: 'conversation.item.input_audio_transcription.failed' },
    { type: 'error' }
  ]) {
    const h = harness(); const controller = createRealtimeInterviewer(h.options);
    await controller.start(); h.peer.channel.readyState = 'open'; h.peer.channel.emit('open');
    h.peer.channel.emit('message', terminal);
    await Promise.resolve();
    assert.equal(h.track.enabled, false);
    assert.equal(h.track.stops, 1);
    assert.equal(h.peer.connectionState, 'closed');
    assert.equal(controller.state(), 'error');
  }
});

test('final transcript without a stable item id is rejected instead of inventing a duplicate-prone turn', async () => {
  const { createRealtimeInterviewer } = load();
  const h = harness(); const controller = createRealtimeInterviewer(h.options);
  await controller.start(); h.peer.channel.readyState = 'open'; h.peer.channel.emit('open');
  h.peer.channel.emit('message', { type: 'conversation.item.input_audio_transcription.completed', transcript: 'No stable identity' });
  assert.equal(h.finals.length, 0);
  assert.equal(h.errors.at(-1).code, 'voice_transcript_identity_missing');
});
