'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const createRetryConfirmationModal = require('../assets/js/retry-confirmation-modal.js');

function target() {
  const listeners = {};
  return {
    textContent: '',
    open: false,
    isConnected: true,
    focusCount: 0,
    attributes: {},
    addEventListener(type, listener) { (listeners[type] ||= []).push(listener); },
    dispatch(type, properties = {}) {
      const event = { target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...properties };
      (listeners[type] || []).forEach(listener => listener(event));
      return event;
    },
    setAttribute(name, value) { this.attributes[name] = String(value); if (name === 'open') this.open = true; },
    removeAttribute(name) { delete this.attributes[name]; if (name === 'open') this.open = false; },
    hasAttribute(name) { return Object.hasOwn(this.attributes, name); },
    focus() { this.focusCount += 1; }
  };
}

function setup(mode = 'type', native = true) {
  const dialog = target();
  if (native) {
    dialog.showModalCount = 0;
    dialog.closeCount = 0;
    dialog.showModal = function () { this.open = true; this.showModalCount += 1; };
    dialog.close = function () { this.open = false; this.closeCount += 1; };
  }
  const title = target();
  const description = target();
  const confirmButton = target();
  const cancelButton = target();
  const decisions = [];
  const controller = createRetryConfirmationModal({
    dialog, title, description, confirmButton, cancelButton,
    getMode: () => mode,
    onDecision: (decision, source) => decisions.push([decision, source])
  });
  return { controller, dialog, title, description, confirmButton, cancelButton, decisions };
}

test('open labels the specialist, focuses No, and does not stack openings', () => {
  const ui = setup();
  ui.controller.open({ agentName: 'ANCHOR' });
  ui.controller.open({ agentName: 'EXTRACT' });
  assert.equal(ui.title.textContent, 'Retry ANCHOR?');
  assert.match(ui.description.textContent, /clear ANCHOR's saved interview answers/i);
  assert.equal(ui.cancelButton.focusCount, 1);
  assert.equal(ui.dialog.showModalCount, 1);
  assert.equal(ui.controller.isOpen(), true);
});

test('buttons resolve a modal once and restore a connected trigger', () => {
  const ui = setup();
  const trigger = target();
  ui.controller.open({ agentName: 'ANCHOR', trigger });
  ui.cancelButton.dispatch('click');
  ui.confirmButton.dispatch('click');
  assert.deepEqual(ui.decisions, [[false, 'button']]);
  assert.equal(trigger.focusCount, 1);
  assert.equal(ui.controller.isOpen(), false);
});

test('Type backdrop and Escape cancel while Talk requires an explicit decision', () => {
  const typedBackdrop = setup('type');
  typedBackdrop.controller.open({ agentName: 'ANCHOR' });
  typedBackdrop.dialog.dispatch('click');
  assert.deepEqual(typedBackdrop.decisions, [[false, 'dismiss']]);

  const typedEscape = setup('type');
  typedEscape.controller.open({ agentName: 'ANCHOR' });
  const typeCancel = typedEscape.dialog.dispatch('cancel');
  assert.equal(typeCancel.defaultPrevented, true);
  assert.deepEqual(typedEscape.decisions, [[false, 'dismiss']]);

  const talked = setup('talk');
  talked.controller.open({ agentName: 'ANCHOR' });
  talked.dialog.dispatch('click');
  const talkCancel = talked.dialog.dispatch('cancel');
  assert.equal(talkCancel.defaultPrevented, true);
  assert.deepEqual(talked.decisions, []);
  assert.equal(talked.controller.isOpen(), true);
});

test('fallback uses the open attribute and skips a disconnected trigger', () => {
  const ui = setup('type', false);
  const trigger = target();
  trigger.isConnected = false;
  ui.controller.open({ agentName: 'ANCHOR', trigger });
  assert.equal(ui.dialog.hasAttribute('open'), true);
  ui.controller.close();
  assert.equal(ui.dialog.hasAttribute('open'), false);
  assert.equal(trigger.focusCount, 0);
});
