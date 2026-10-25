'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
}

test('local project store persists answers, checkpoints, and immutable approved versions', async () => {
  const stores = require('../assets/js/project-store.js');
  const storage = memoryStorage();
  const store = stores.create({ storage, projectId: 'project-one' });
  assert.equal(store.mode, 'local');
  await store.saveAnswer({ agentKey: 'extract', field: 'origin.catalyst', value: 'A real turning point', basis: 'user' });
  await store.saveCheckpoint({ agentKey: 'extract', chapterIndex: 1, questionIndex: 2 });
  const first = await store.saveArtifact({ id: 'map-1', agentKey: 'extract', title: 'Expertise Map', sections: [] });
  const approved = await store.approveArtifact(first.id);
  await store.saveArtifact({ id: 'map-1', agentKey: 'extract', title: 'Changed draft', sections: [] });
  const project = await store.loadProject();
  assert.equal(project.answers[0].value, 'A real turning point');
  assert.equal(project.checkpoints.extract.questionIndex, 2);
  assert.equal(approved.status, 'user_approved');
  assert.equal(project.artifactVersions.filter(version => version.artifactId === 'map-1').length, 2);
  assert.equal(project.artifactVersions[0].title, 'Expertise Map');
});

test('Supabase store sends authenticated project-scoped REST requests without a service key', async () => {
  const stores = require('../assets/js/project-store.js');
  const calls = [];
  const store = stores.create({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-public',
    accessToken: 'user-token',
    projectId: '11111111-1111-4111-8111-111111111111',
    fetchImpl: async (url, init) => { calls.push({ url, init }); return { ok: true, json: async () => [] }; }
  });
  assert.equal(store.mode, 'supabase');
  await store.loadProject();
  assert.match(calls[0].url, /\/rest\/v1\/projects\?/);
  assert.equal(calls[0].init.headers.apikey, 'anon-public');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer user-token');
  assert.doesNotMatch(JSON.stringify(calls[0]), /service.role/i);
});

