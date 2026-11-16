'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

test('completed PDF route identifies the specialist and preview mode', () => {
  const actions = require('../assets/js/completed-work-actions.js');
  assert.equal(actions.buildVaultPdfUrl({ agentKey: 'anchor', projectId: 'local-default' }), 'vault.html?agent=anchor&preview=pdf');
});

test('completed PDF route preserves cloud routing context and encodes reserved characters', () => {
  const actions = require('../assets/js/completed-work-actions.js');
  const value = actions.buildVaultPdfUrl({ agentKey: 'extract & proof', projectId: 'project/one?draft=yes', sessionId: 'session #2' });
  const url = new URL(value, 'https://fas.test/');
  assert.equal(url.pathname, '/vault.html');
  assert.equal(url.searchParams.get('agent'), 'extract & proof');
  assert.equal(url.searchParams.get('preview'), 'pdf');
  assert.equal(url.searchParams.get('project'), 'project/one?draft=yes');
  assert.equal(url.searchParams.get('session'), 'session #2');
});

test('completed PDF route omits empty and local-only context', () => {
  const actions = require('../assets/js/completed-work-actions.js');
  assert.equal(actions.buildVaultPdfUrl({ agentKey: 'voice', projectId: 'local-default', sessionId: '' }), 'vault.html?agent=voice&preview=pdf');
});
