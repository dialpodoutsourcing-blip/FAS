'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function freshCoordinator() {
  delete require.cache[require.resolve('../assets/js/interview-coordinator.js')];
  return require('../assets/js/interview-coordinator.js');
}

function harness(overrides) {
  const calls = [];
  let state = { questionIndex: 0, answers: [] };
  const interview = {
    currentQuestion() { return state.questionIndex < 2 ? { question: 'Question ' + (state.questionIndex + 1) } : null; },
    checkpoint() { return JSON.parse(JSON.stringify(state)); },
    restore(checkpoint) { state = JSON.parse(JSON.stringify(checkpoint)); calls.push(['restore', checkpoint]); },
    acceptAnswer(input) {
      calls.push(['accept', input]);
      const answer = { id: 'local-' + (state.answers.length + 1), field: 'field-' + state.questionIndex, text: input.text };
      state.answers.push(answer);
      state.questionIndex += 1;
      return { answer, followUps: [], summary: { after: state.answers.length }, nextQuestion: this.currentQuestion() };
    },
    reconcileAnswer(localId, saved) {
      calls.push(['reconcile', localId, saved.id]);
      state.answers.find(answer => answer.id === localId).id = saved.id;
    },
    completion() { return { complete: state.questionIndex >= 2, gaps: [] }; }
  };
  const projectStore = {
    async saveAnswerCheckpoint(answer, checkpoint) {
      calls.push(['save', answer, checkpoint]);
      return { ...answer, id: 'durable-' + checkpoint.questionIndex };
    }
  };
  const requestReply = async (answer, nextQuestion) => {
    calls.push(['reply', answer, nextQuestion]);
    return 'I heard you. ' + nextQuestion;
  };
  return {
    calls,
    interview,
    projectStore,
    requestReply,
    options: Object.assign({ interview, projectStore, agentKey: 'anchor', requestReply }, overrides || {})
  };
}

test('typed and spoken turns share the same durable submission result shape', async () => {
  const api = freshCoordinator();
  const first = harness();
  const typed = await api.create(first.options).submit({ text: 'Typed answer', source: 'type', turnId: 'typed-1' });
  assert.equal(first.calls[0][0], 'accept');
  assert.equal(first.calls[1][0], 'save');
  assert.equal(first.calls[1][1].agentKey, 'anchor');
  assert.equal(first.calls[2][0], 'reconcile');
  assert.equal(first.calls[3][0], 'reply');
  assert.deepEqual(Object.keys(typed).sort(), ['checkpoint', 'completion', 'message', 'nextQuestion', 'saved', 'source', 'summary'].sort());
  assert.equal(typed.source, 'type');
  assert.equal(typed.nextQuestion, 'Question 2');
  assert.equal(typed.message, 'I heard you. Question 2');

  const second = harness();
  const spoken = await api.create(second.options).submit({ text: 'Spoken answer', source: 'talk', turnId: 'voice-1' });
  assert.deepEqual(Object.keys(spoken).sort(), Object.keys(typed).sort());
  assert.equal(spoken.source, 'talk');
  assert.deepEqual(second.calls.map(call => call[0]), ['accept', 'save', 'reconcile', 'reply']);
});

test('duplicate turn ids share one promise and different concurrent turns are rejected', async () => {
  const api = freshCoordinator();
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const h = harness({ requestReply: async () => { await pending; return 'Saved. Question 2'; } });
  const coordinator = api.create(h.options);
  const first = coordinator.submit({ text: 'One answer', source: 'talk', turnId: 'same-turn' });
  const duplicate = coordinator.submit({ text: 'One answer', source: 'talk', turnId: 'same-turn' });
  assert.strictEqual(duplicate, first);
  assert.equal(coordinator.busy(), true);
  await assert.rejects(
    coordinator.submit({ text: 'Another answer', source: 'talk', turnId: 'other-turn' }),
    error => error && error.code === 'interview_busy'
  );
  release();
  await first;
  assert.equal(coordinator.busy(), false);
  assert.equal(coordinator.hasProcessed('same-turn'), true);
  assert.equal(h.calls.filter(call => call[0] === 'accept').length, 1);
});

test('save failure restores the exact prior checkpoint and permits retry', async () => {
  const api = freshCoordinator();
  let attempts = 0;
  const h = harness({
    projectStore: {
      async saveAnswerCheckpoint(answer) {
        attempts += 1;
        if (attempts === 1) throw new Error('database unavailable');
        return { ...answer, id: 'durable-retry' };
      }
    }
  });
  const coordinator = api.create(h.options);
  await assert.rejects(coordinator.submit({ text: 'Retry me', source: 'type', turnId: 'retry-turn' }), /database unavailable/);
  assert.deepEqual(h.interview.checkpoint(), { questionIndex: 0, answers: [] });
  assert.equal(coordinator.hasProcessed('retry-turn'), false);
  const result = await coordinator.submit({ text: 'Retry me', source: 'type', turnId: 'retry-turn' });
  assert.equal(result.saved.id, 'durable-retry');
  assert.equal(h.calls.filter(call => call[0] === 'accept').length, 2);
});

test('reply failure uses the exact engine-selected question after durable save', async () => {
  const api = freshCoordinator();
  const h = harness({ requestReply: async () => { throw new Error('AI unavailable'); } });
  const result = await api.create(h.options).submit({ text: 'My answer', source: 'talk', turnId: 'fallback-turn' });
  assert.equal(result.message, 'Question 2');
  assert.equal(result.nextQuestion, 'Question 2');
  assert.equal(result.saved.id, 'durable-1');
});

test('completed interviews return completion without accepting an extra answer', async () => {
  const api = freshCoordinator();
  const h = harness();
  await api.create(h.options).submit({ text: 'First', source: 'type', turnId: 'first' });
  const coordinator = api.create(h.options);
  await coordinator.submit({ text: 'Second', source: 'type', turnId: 'second' });
  const acceptedBefore = h.calls.filter(call => call[0] === 'accept').length;
  const result = await coordinator.submit({ text: 'Extra', source: 'talk', turnId: 'extra' });
  assert.equal(result.saved, null);
  assert.equal(result.completion.complete, true);
  assert.equal(result.nextQuestion, null);
  assert.equal(h.calls.filter(call => call[0] === 'accept').length, acceptedBefore);
});
