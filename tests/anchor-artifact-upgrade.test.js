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

test('collectAnswers uses an explicit revision as the authoritative value for its exact Anchor field', () => {
  const project = completeProject();
  project.answers.unshift({ id: 'old-authority', agent_key: 'anchor', field: 'anchor.authority', text: 'Old value.' });
  project.answers.push({ id: 'latest-authority', agent_key: 'anchor', field: 'anchor.authority', text: 'Latest authority answer.', supersedesId:'answer-1' });
  project.answers.push({ id: 'blank-authority', agentKey: 'anchor', field: 'anchor.authority', text: '   ' });
  project.answers.push({ id: 'extract-answer', agentKey: 'extract', field: 'anchor.authority', text: 'Wrong agent.' });

  const answers = upgrade.collectAnswers(project);

  assert.deepEqual(answers.map(answer => answer.field), fields.map(field => `anchor.${field}`));
  assert.equal(answers[0].id, 'latest-authority');
  assert.equal(answers[0].text, 'Latest authority answer.');
  assert.equal(upgrade.collectAnswers({ answers: project.answers.filter(answer => answer.field !== 'anchor.evidence') }), null);
});

test('collectAnswers combines a main answer with chronological probe follow-ups instead of replacing it',()=>{
  const project=completeProject();
  project.answers[0].text='I help online coaches turn scattered expertise into a clear paid offer.';
  project.answers[0].incomplete=true;
  project.answers[0].trigger='vague_quantity';
  project.answers.push({id:'authority-numbers',agentKey:'anchor',field:'anchor.authority',text:'I have helped 24 coaches in the last 18 months.',supersedesId:'answer-1'});
  project.answers.push({id:'authority-detail',agentKey:'anchor',field:'anchor.authority',text:'Most reached a sellable offer in six weeks.',supersedesId:'authority-numbers'});

  const authority=upgrade.collectAnswers(project)[0];

  assert.equal(authority.id,'authority-detail');
  assert.equal(authority.text,'I help online coaches turn scattered expertise into a clear paid offer.\n\nSupporting detail: I have helped 24 coaches in the last 18 months.\n\nSupporting detail: Most reached a sellable offer in six weeks.');
});

test('collectAnswers excludes unusable follow-ups without losing usable main answers or other agents',()=>{
  const project=completeProject();
  project.answers.push({id:'pending-authority',agentKey:'anchor',field:'anchor.authority',text:'Yes, save this.',permissionStatus:'pending',supersedesId:'answer-1'});
  project.answers.push({id:'private-authority',agentKey:'anchor',field:'anchor.authority',text:'Private detail.',permissionStatus:'private',supersedesId:'answer-1'});
  project.answers.push({id:'incomplete-authority',agentKey:'anchor',field:'anchor.authority',text:'Half a thought.',incomplete:true,supersedesId:'answer-1'});
  project.answers.push({id:'extract-authority',agentKey:'extract',field:'anchor.authority',text:'Wrong specialist.',supersedesId:'answer-1'});

  const authority=upgrade.collectAnswers(project)[0];

  assert.equal(authority.id,'answer-1');
  assert.equal(authority.text,'Saved authority answer with enough specific detail to remain useful.');
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

test('completed EXTRACT work is eligible for a premium deterministic upgrade',async()=>{
  const fields=['context','diagnostic','origin','timeline','method','proof','point_of_view','boundaries','synthesis'];
  const project={answers:fields.map((field,index)=>({id:'e'+index,agentKey:'extract',field:'extract.'+field,text:'Specific '+field+' evidence and detail for the expertise report.'}))};
  const selected={id:'extract-map',artifactId:'extract-map',agentKey:'extract',version:1,sections:[{title:'Legacy',blocks:[{text:'Legacy'}]}]};
  assert.equal(upgrade.needsUpgrade('extract',selected,project),true);
  const rebuilt=await upgrade.rebuild({agentKey:'extract',project,artifacts,fetchImpl:async()=>({ok:false})});
  assert.ok(rebuilt.premiumReport);assert.ok(rebuilt.premiumReport.signatureMethod.stages.length>=4);
});

test('partial EXTRACT collection keeps every usable field while zero usable input fails closed',()=>{
  const project={answers:[
    {id:'origin',agentKey:'extract',field:'extract.origin',text:'I built this method after solving the same constraint repeatedly.'},
    {id:'method',agentKey:'extract',field:'extract.method',text:'Assess, map, implement, validate.'},
    {id:'pending-proof',agentKey:'extract',field:'extract.proof',text:'A pending client story.',permissionStatus:'pending'},
    {id:'private-boundary',agentKey:'extract',field:'extract.boundaries',text:'Private limits.',permissionStatus:'private'}
  ]};

  const answers=upgrade.collectAnswers(project,'extract');

  assert.deepEqual(answers.map(answer=>answer.field),['extract.origin','extract.method']);
  assert.equal(upgrade.collectAnswers({answers:project.answers.slice(2)},'extract'),null);
  assert.equal(upgrade.collectAnswers({answers:project.answers.slice(0,1)},'anchor'),null);
});

test('partial EXTRACT rebuild preserves deterministic gaps when synthesis is unavailable',async()=>{
  const project={id:'partial-extract',answers:[
    {id:'origin',agentKey:'extract',field:'extract.origin',text:'I built this method after solving the same constraint repeatedly.'},
    {id:'method',agentKey:'extract',field:'extract.method',text:'Assess, map, implement, validate.'}
  ]};

  const rebuilt=await upgrade.rebuild({agentKey:'extract',project,artifacts,fetchImpl:async()=>({ok:false})});

  assert.equal(rebuilt.title,'Expertise Map');
  assert.ok(rebuilt.premiumReport);
  assert.ok(rebuilt.sections.some(section=>section.blocks.some(block=>block.kind==='gap'&&/no approved source/i.test(block.text))));
});

test('local reset keeps history but loadReview does not select the retired run',async()=>{
  const stores=require('../assets/js/project-store.js'),storage={value:null,getItem(){return this.value;},setItem(_key,value){this.value=value;}};
  const store=stores.create({configured:false,storage,projectId:'reset-review'});
  await store.saveArtifact({id:'trusted-expert-statement-reset-review',agentKey:'anchor',type:'trusted_expert_statement',title:'OLD RUN',sections:[{title:'Old',blocks:[]}]});
  await store.resetAgent('anchor');

  const state=await upgrade.loadReview({store,agentKey:'anchor',artifacts,isReview:true});

  assert.equal(state.status,'empty');
  assert.equal(state.selected,undefined);
  assert.equal((JSON.parse(storage.value).artifactVersions||[]).length,1);
});

test('editing a resolved follow-up replaces its field instead of concatenating contradictory values',async()=>{
  const stores=require('../assets/js/project-store.js'),store=stores.create({configured:false,storage:null,projectId:'edit-follow-up'});
  await store.saveAnswer({id:'main',agentKey:'anchor',field:'anchor.authority',text:'I help coaches build offers.',incomplete:true,trigger:'vague_quantity'});
  const followUp=await store.saveAnswer({id:'follow-up',agentKey:'anchor',field:'anchor.authority',text:'24 clients.',supersedesId:'main',relation:'follow_up'});
  await store.reviseAnswer(followUp.id,'12 clients.');
  for(const field of fields.slice(1))await store.saveAnswer({agentKey:'anchor',field:'anchor.'+field,text:'Complete '+field+' detail.'});

  const authority=upgrade.collectAnswers(await store.loadProject(),'anchor')[0];

  assert.equal(authority.text,'12 clients.');
});
