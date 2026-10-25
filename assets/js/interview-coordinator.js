(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.FAS = root.FAS || {};
    root.FAS.createInterviewCoordinator = api.create;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function create(options) {
    options = options || {};
    var interview = options.interview;
    var projectStore = options.projectStore;
    var agentKey = options.agentKey;
    var requestReply = options.requestReply || function (_, nextQuestion) { return Promise.resolve(nextQuestion); };
    var turns = new Map();
    var active = null;

    if (!interview || !projectStore || !agentKey) throw new Error('Interview, project store, and agent key are required.');

    function resultShape(values) {
      return {
        saved: values.saved || null,
        checkpoint: values.checkpoint || interview.checkpoint(),
        message: values.message || '',
        nextQuestion: values.nextQuestion || null,
        summary: values.summary || null,
        completion: values.completion || interview.completion(),
        source: values.source || 'type'
      };
    }

    function submit(input) {
      input = input || {};
      var turnId = String(input.turnId || '').trim();
      var text = String(input.text || '').trim();
      var source = input.source === 'talk' ? 'talk' : 'type';
      if (!turnId) return Promise.reject(new Error('turnId is required.'));
      if (turns.has(turnId)) return turns.get(turnId);
      if (active) {
        var busyError = new Error('Another interview turn is still being saved.');
        busyError.code = 'interview_busy';
        return Promise.reject(busyError);
      }
      if (!interview.currentQuestion()) {
        var completed = Promise.resolve(resultShape({ source: source, completion: interview.completion() }));
        turns.set(turnId, completed);
        return completed;
      }
      if (!text) return Promise.reject(new Error('Answer text is required.'));

      var previousCheckpoint = interview.checkpoint();
      var accepted = null;
      var durablySaved = false;
      var promise = Promise.resolve().then(function () {
        accepted = interview.acceptAnswer({ text: text });
        var answer = Object.assign({ agentKey: agentKey, clientRef: 'interview:' + turnId }, accepted.answer);
        var checkpoint = Object.assign({ agentKey: agentKey }, interview.checkpoint());
        return projectStore.saveAnswerCheckpoint(answer, checkpoint);
      }).then(function (saved) {
        durablySaved = true;
        interview.reconcileAnswer(accepted.answer.id, saved);
        var checkpoint = interview.checkpoint();
        var nextQuestion = accepted.followUps.length
          ? accepted.followUps[0].question
          : accepted.nextQuestion && accepted.nextQuestion.question;
        var reply = nextQuestion
          ? Promise.resolve().then(function () { return requestReply(text, nextQuestion); }).catch(function () { return nextQuestion; })
          : Promise.resolve('');
        return reply.then(function (message) {
          return resultShape({
            saved: saved,
            checkpoint: checkpoint,
            message: message || nextQuestion || '',
            nextQuestion: nextQuestion || null,
            summary: accepted.summary,
            completion: interview.completion(),
            source: source
          });
        });
      }).catch(function (error) {
        if (!durablySaved) interview.restore(previousCheckpoint);
        turns.delete(turnId);
        throw error;
      }).finally(function () {
        if (active && active.turnId === turnId) active = null;
      });

      turns.set(turnId, promise);
      active = { turnId: turnId, promise: promise };
      return promise;
    }

    return {
      submit: submit,
      busy: function () { return Boolean(active); },
      hasProcessed: function (turnId) { return turns.has(String(turnId || '')); }
    };
  }

  return { create: create };
});
