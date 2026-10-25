'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const upgrade = require('../assets/js/anchor-artifact-upgrade.js');
const artifacts = require('../assets/js/artifacts.js');

const fields = ['authority', 'arena', 'evidence', 'position', 'boundaries', 'activation'];

function completeProject() {
  return {
    id: 'legacy-project',
    answers: fields.map((field, index) => ({
      id: `answer-${index + 1}`,
      agentKey: 'anchor',
      field: `anchor.${field}`,
      text: `Saved ${field} answer with enough specific detail to remain useful.`
    }))
  };
}

function legacyArtifact() {
  return {
    id: 'trusted-expert-statement-legacy-project',
    artifactId: 'persisted-artifact-id',
    agentKey: 'anchor',
    type: 'trusted_expert_statement',
    title: 'Trusted Expert Blueprint',
    version: 1,
    status: 'user_approved',
    exportTheme: 'luxury-editorial',
    sections: [{ title: 'Authority arena', blocks: [{ text: 'Legacy summary.' }] }]
  };
}

function synthesizedReport() {
  return {
    executiveBrief: { opportunity: 'Specific opportunity.', decision: 'Specific decision.' },
    expertStatement: { external: 'A substantive expert statement.' },
    authorityFoundation: { distinctiveLens: 'A defensible lens.', boundaries: 'Clear boundaries.' },
    evidenceMatrix: [{ claim: 'Claim.', proof: 'Proof.', gap: 'Gap.' }],
    positioningMap: { position: { label: 'Position.' } },
    messagingArchitecture: { pillars: [{ title: 'Pillar.' }] },
    risks: [{ risk: 'Risk.' }],
    activationPlan: [{ week: 1, objective: 'Objective.', actions: ['Action.'], successIndicator: 'Indicator.' }],
    recommendations: [{ priority: 1, title: 'Recommendation.' }]
  };
}

test('collectAnswers uses the latest non-empty saved value for every exact Anchor field', () => {
  const project = completeProject();
  project.answers.unshift({ id: 'old-authority', agent_key: 'anchor', field: 'anchor.authority', text: 'Old value.' });
  project.answers.push({ id: 'latest-authority', agent_key: 'anchor', field: 'anchor.authority', text: 'Latest authority answer.' });
  project.answers.push({ id: 'blank-authority', agentKey: 'anchor', field: 'anchor.authority', text: '   ' });
  project.answers.push({ id: 'extract-answer', agentKey: 'extract', field: 'anchor.authority', text: 'Wrong agent.' });

  const answers = upgrade.collectAnswers(project);

  assert.deepEqual(answers.map(answer => answer.field), fields.map(field => `anchor.${field}`));
  assert.equal(answers[0].id, 'latest-authority');
  assert.equal(answers[0].text, 'Latest authority answer.');
  assert.equal(upgrade.collectAnswers({ answers: project.answers.filter(answer => answer.field !== 'anchor.evidence') }), null);
});

test('needsUpgrade accepts only a complete legacy Anchor artifact', () => {
  const project = completeProject();
  const selected = legacyArtifact();

  assert.equal(upgrade.needsUpgrade('anchor', selected, project), true);
  assert.equal(upgrade.needsUpgrade('extract', selected, project), false);
  assert.equal(upgrade.needsUpgrade('anchor', { ...selected, sections: [] }, project), false);
  assert.equal(upgrade.needsUpgrade('anchor', { ...selected, premiumReport: synthesizedReport() }, project), false);
  assert.equal(upgrade.needsUpgrade('anchor', selected, { answers: project.answers.slice(0, 5) }), false);
});

test('upgrade synthesizes from saved answers and appends one themed version to the existing artifact', async () => {
  const project = completeProject();
  const selected = legacyArtifact();
  const report = synthesizedReport();
  const requests = [];
  const saves = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url, init });
    return { ok: true, json: async () => ({ sections: { premiumReport: report } }) };
  };

  const result = await upgrade.upgrade({
    agentKey: 'anchor', project, selected, artifacts, fetchImpl,
    saveVersion: async (...args) => { saves.push(args); return { currentVersion: 2 }; }
  });

  assert.equal(result.upgraded, true);
  assert.deepEqual(result.artifact.premiumReport, report);
  assert.equal(result.artifact.exportTheme, 'luxury-editorial');
  assert.equal(requests[0].url, '/api/artifact-synthesis');
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    agentKey: 'anchor',
    answers: fields.map((field, index) => ({ id: `answer-${index + 1}`, field: `anchor.${field}`, text: `Saved ${field} answer with enough specific detail to remain useful.`, basis:'user', permissionStatus:'not_required' }))
  });
  assert.equal(saves.length, 1);
  assert.equal(saves[0][0], 'persisted-artifact-id');
  assert.equal(saves[0][1], 1);
  assert.equal(saves[0][2].premiumReport.executiveBrief.opportunity, 'Specific opportunity.');
});

test('upgrade saves the deterministic premium report when AI synthesis is unavailable', async () => {
  const saves = [];
  const result = await upgrade.upgrade({
    agentKey: 'anchor', project: completeProject(), selected: legacyArtifact(), artifacts,
    fetchImpl: async () => { throw new Error('offline'); },
    saveVersion: async (...args) => { saves.push(args); return { currentVersion: 2 }; }
  });

  assert.equal(result.upgraded, true);
  assert.ok(result.artifact.premiumReport);
  assert.ok(result.artifact.premiumReport.evidenceMatrix.length >= 3);
  assert.equal(saves.length, 1);
});

test('upgrade performs no work for ineligible artifacts', async () => {
  let calls = 0;
  const selected = { ...legacyArtifact(), premiumReport: synthesizedReport() };
  const result = await upgrade.upgrade({
    agentKey: 'anchor', project: completeProject(), selected, artifacts,
    fetchImpl: async () => { calls += 1; },
    saveVersion: async () => { calls += 1; }
  });

  assert.deepEqual(result, { upgraded: false, artifact: selected, reason: 'not-eligible' });
  assert.equal(calls, 0);
});

test('strict migration rebuild requires successful premium synthesis', async () => {
  await assert.rejects(()=>upgrade.rebuild({project:completeProject(),artifacts,strictSynthesis:true,fetchImpl:async()=>{throw new Error('offline');}}),/offline/);
  const fallback=await upgrade.rebuild({project:completeProject(),artifacts,fetchImpl:async()=>{throw new Error('offline');}});
  assert.ok(fallback.premiumReport,'normal review upgrades retain the grounded deterministic fallback');
});

test('private or pending Anchor evidence is never included in a publishable rebuild',async()=>{
  const project=completeProject();project.answers.find(answer=>answer.field==='anchor.evidence').permissionStatus='private';
  assert.equal(upgrade.collectAnswers(project),null);
  await assert.rejects(()=>upgrade.rebuild({project,artifacts,fetchImpl:async()=>{throw new Error('must not synthesize');}}),/six complete/i);
});
