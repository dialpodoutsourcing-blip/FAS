'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function node() {
  const listeners = {};
  return {
    hidden: false, disabled: false, textContent: '', href: '', download: '', data: '', open: false, focusCount: 0,
    addEventListener(type, listener) { (listeners[type] ||= []).push(listener); },
    dispatch(type, extra = {}) { const event = { target: this, preventDefault() { this.defaultPrevented = true; }, ...extra }; (listeners[type] || []).forEach(fn => fn(event)); return event; },
    setAttribute(name, value) { this[name] = String(value); },
    removeAttribute(name) { delete this[name]; },
    showModal() { this.open = true; }, close() { this.open = false; }, focus() { this.focusCount += 1; }
  };
}

function setup() {
  const urls = [], revoked = [];
  const elements = { dialog: node(), title: node(), status: node(), viewer: node(), openLink: node(), downloadLink: node(), retryButton: node(), closeButton: node() };
  const api = require('../assets/js/pdf-preview.js');
  const controller = api.create({
    elements,
    urlApi: { createObjectURL(blob) { const value = 'blob:pdf-' + (urls.length + 1); urls.push([value, blob]); return value; }, revokeObjectURL(value) { revoked.push(value); } }
  });
  return { controller, elements, urls, revoked };
}

test('prepared PDF becomes embedded with open and download recovery controls', async () => {
  const ui = setup(), blob = new Blob(['%PDF-test'], { type: 'application/pdf' });
  const opening = ui.controller.open({ title: 'Anchor Blueprint', prepare: async () => ({ blob, disposition: 'attachment; filename="anchor.pdf"' }) });
  assert.equal(ui.controller.isOpen(), true);
  assert.match(ui.elements.status.textContent, /preparing/i);
  await opening;
  assert.equal(ui.elements.viewer.data, 'blob:pdf-1');
  assert.equal(ui.elements.openLink.href, 'blob:pdf-1');
  assert.equal(ui.elements.downloadLink.href, 'blob:pdf-1');
  assert.equal(ui.elements.downloadLink.download, 'anchor.pdf');
  assert.equal(ui.elements.retryButton.hidden, true);
  assert.match(ui.elements.status.textContent, /ready/i);
});

test('failed preparation remains open and the retry control prepares again', async () => {
  const ui = setup(); let attempts = 0;
  const prepare = async () => { attempts += 1; if (attempts === 1) throw new Error('offline'); return { blob: new Blob(['%PDF-ok']), disposition: '' }; };
  await assert.rejects(ui.controller.open({ title: 'Report', prepare }), /offline/);
  assert.equal(ui.controller.isOpen(), true);
  assert.equal(ui.elements.retryButton.hidden, false);
  assert.match(ui.elements.status.textContent, /could not/i);
  ui.elements.retryButton.dispatch('click');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(attempts, 2);
  assert.equal(ui.elements.viewer.data, 'blob:pdf-1');
});

test('replacement and close revoke only inactive object URLs and restore focus', async () => {
  const ui = setup(), origin = node();
  await ui.controller.open({ title: 'First', origin, prepare: async () => ({ blob: new Blob(['%PDF-1']) }) });
  await ui.controller.open({ title: 'Second', origin, prepare: async () => ({ blob: new Blob(['%PDF-2']) }) });
  assert.deepEqual(ui.revoked, ['blob:pdf-1']);
  assert.equal(ui.elements.viewer.data, 'blob:pdf-2');
  ui.elements.dialog.dispatch('cancel');
  assert.deepEqual(ui.revoked, ['blob:pdf-1', 'blob:pdf-2']);
  assert.equal(ui.controller.isOpen(), false);
  assert.equal(origin.focusCount, 1);
});

test('close button uses the same cleanup path', async () => {
  const ui = setup();
  await ui.controller.open({ title: 'Report', prepare: async () => ({ blob: new Blob(['%PDF']) }) });
  ui.elements.closeButton.dispatch('click');
  assert.deepEqual(ui.revoked, ['blob:pdf-1']);
  assert.equal(ui.controller.isOpen(), false);
});
