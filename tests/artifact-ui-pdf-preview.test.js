'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const vault = require('../assets/js/vault-library.js');

test('PDF launcher opens the viewer with cached preparation for the selected artifact', async () => {
  const calls = [], artifact = { artifactId:'anchor-1', version:2, exportTheme:'luxury-editorial' };
  const item = { agentKey:'anchor', title:'Trusted Expert Blueprint', version:artifact };
  const preview = { open(request) { calls.push(['open',request]); return request.prepare(); } };
  const launcher = vault.createPdfPreviewLauncher({
    preview,
    prepare(artifactValue, format, theme) { calls.push(['prepare',artifactValue,format,theme]); return Promise.resolve({blob:'pdf',disposition:'attachment; filename="anchor.pdf"'}); }
  });
  const result = await launcher(item,{id:'origin'});
  assert.deepEqual(result,{blob:'pdf',disposition:'attachment; filename="anchor.pdf"'});
  assert.equal(calls[0][0],'open');
  assert.equal(calls[0][1].title,'Trusted Expert Blueprint');
  assert.equal(calls[0][1].artifact,artifact);
  assert.deepEqual(calls[1],['prepare',artifact,'pdf','luxury-editorial']);
});

test('PDF launcher exposes preparation failures without replacing the vault item', async () => {
  const item = { agentKey:'extract', title:'Expertise Map', version:{artifactId:'extract-1',version:1} };
  let received;
  const launcher = vault.createPdfPreviewLauncher({
    preview:{open(request){received=request;return request.prepare();}},
    prepare(){return Promise.reject(new Error('export offline'));}
  });
  await assert.rejects(launcher(item,null),/export offline/);
  assert.equal(received.artifact,item.version);
  assert.equal(item.title,'Expertise Map');
});
