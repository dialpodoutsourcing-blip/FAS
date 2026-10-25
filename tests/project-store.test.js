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

test('local agent reset removes its answers, checkpoint, artifacts, and versions only', async () => {
  const stores = require('../assets/js/project-store.js');
  const storage = memoryStorage();
  const store = stores.create({ storage, projectId: 'reset-project' });
  await store.saveAnswer({ agentKey:'anchor', field:'anchor.authority', text:'Anchor answer' });
  await store.saveAnswer({ agentKey:'extract', field:'extract.context', text:'Extract answer' });
  await store.saveCheckpoint({ agentKey:'anchor', questionIndex:1 });
  await store.saveArtifact({ id:'anchor-map', agentKey:'anchor', title:'Anchor', sections:[] });
  await store.saveArtifact({ id:'extract-map', agentKey:'extract', title:'Extract', sections:[] });
  await store.resetAgent('anchor');
  const project = await store.loadProject();
  assert.equal(project.answers.some(answer => answer.agentKey === 'anchor'), false);
  assert.equal(project.checkpoints.anchor, undefined);
  assert.equal(project.artifacts.some(artifact => artifact.agentKey === 'anchor'), false);
  assert.equal(project.artifactVersions.some(version => version.agentKey === 'anchor'), false);
  assert.equal(project.answers.some(answer => answer.agentKey === 'extract'), true);
  assert.equal(project.artifacts.some(artifact => artifact.agentKey === 'extract'), true);
});

test('local project store persists a normalized export theme across instances', async () => {
  const stores = require('../assets/js/project-store.js');
  const storage = memoryStorage(),projectId='theme-project';
  const first = stores.create({ storage, projectId });
  await first.saveArtifact({ id:'anchor-map', agentKey:'anchor', title:'Trusted Expert Blueprint', sections:[] });
  assert.equal((await first.loadProject()).artifacts[0].exportTheme,'editorial-strategy');
  const saved=await first.saveExportTheme('anchor-map','luxury-editorial');
  assert.equal(saved.exportTheme,'luxury-editorial');
  const reopened=stores.create({storage,projectId});
  assert.equal((await reopened.loadProject()).artifacts[0].exportTheme,'luxury-editorial');
  assert.equal((await reopened.saveExportTheme('anchor-map','not-a-theme')).exportTheme,'editorial-strategy');
});

test('local project store hydrates legacy artifacts with the default export theme', async () => {
  const stores=require('../assets/js/project-store.js'),storage=memoryStorage(),projectId='legacy-theme';
  storage.setItem('fas.project.'+projectId,JSON.stringify({id:projectId,answers:[],checkpoints:{},artifacts:[{id:'legacy',agentKey:'anchor'}],artifactVersions:[],facts:[],gaps:[],conflicts:[]}));
  const project=await stores.create({storage,projectId}).loadProject();
  assert.equal(project.artifacts[0].exportTheme,'editorial-strategy');
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

test('Supabase store loads the ordered dynamic agent interview catalog', async () => {
  const stores = require('../assets/js/project-store.js');
  const fetchImpl = async url => {
    if (url.includes('/agent_definitions?')) return { ok:true, json:async()=>[{key:'extract',name:'EXTRACT',definition:{title:'Expertise Extraction Coach'}}] };
    if (url.includes('/agent_chapters?')) return { ok:true, json:async()=>[{id:'chapter-1',agent_key:'extract',key:'origin',label:'Origin',position:1}] };
    if (url.includes('/agent_questions?')) return { ok:true, json:async()=>[{id:'question-1',chapter_id:'chapter-1',field_path:'extract.origin',prompt:'What problem did you first solve?',position:1,required:true,config:{hints:['Start at the beginning']}}] };
    return { ok:true, json:async()=>[] };
  };
  const store = stores.create({supabaseUrl:'https://example.supabase.co',anonKey:'anon-public',accessToken:'user-token',projectId:'11111111-1111-4111-8111-111111111111',fetchImpl});
  const catalog = await store.loadAgentCatalog();
  assert.equal(catalog[0].key, 'extract');
  assert.equal(catalog[0].chapters[0].questions[0].field, 'extract.origin');
  assert.equal(catalog[0].chapters[0].questions[0].question, 'What problem did you first solve?');
  assert.deepEqual(catalog[0].chapters[0].questions[0].hints, ['Start at the beginning']);
});

test('Supabase store hydrates saved artifact content and project-scopes persisted export themes', async () => {
  const stores=require('../assets/js/project-store.js'),calls=[];
  const projectId='11111111-1111-4111-8111-111111111111',artifactId='22222222-2222-4222-8222-222222222222';
  const content={id:'trusted-expert-statement-project',agentKey:'anchor',title:'Trusted Expert Blueprint',type:'trusted_expert_statement',sections:[{title:'Authority arena',blocks:[{kind:'synthesis',text:'Saved premium content.'}]}],premiumReport:{executiveBrief:{opportunity:'Saved opportunity.'}}};
  const fetchImpl=async(url,init={})=>{calls.push({url,init});if(url.includes('/projects?'))return{ok:true,json:async()=>[{id:projectId}]};if(url.includes('/answers?')||url.includes('/interview_sessions?'))return{ok:true,json:async()=>[]};if(url.includes('/artifact_versions?'))return{ok:true,json:async()=>[{id:'version-one',artifact_id:artifactId,version:1,status:'draft',content}]};if(url.includes('/artifacts?')&&(!init.method||init.method==='GET'))return{ok:true,json:async()=>[{id:artifactId,agent_key:'anchor',export_theme:'boardroom-consultancy'}]};if(init.method==='PATCH')return{ok:true,json:async()=>[{id:artifactId,agent_key:'anchor',export_theme:'luxury-editorial'}]};return{ok:true,json:async()=>[]};};
  const store=stores.create({supabaseUrl:'https://example.supabase.co',anonKey:'anon-public',accessToken:'user-token',projectId,userId:'33333333-3333-4333-8333-333333333333',sessionId:'44444444-4444-4444-8444-444444444444',fetchImpl});
  const project=await store.loadProject();
  assert.equal(project.artifacts[0].exportTheme,'boardroom-consultancy');
  assert.equal(project.artifactVersions.length,1);assert.equal(project.artifactVersions[0].artifactId,artifactId);assert.equal(project.artifactVersions[0].premiumReport.executiveBrief.opportunity,'Saved opportunity.');assert.equal(project.artifactVersions[0].exportTheme,'boardroom-consultancy');
  assert.match(calls.find(call=>call.url.includes('/artifact_versions?')).url,new RegExp('artifact_id=in\\.\\('+artifactId+'\\)'));
  const saved=await store.saveExportTheme(artifactId,'luxury-editorial');
  assert.equal(saved.exportTheme,'luxury-editorial');
  const patch=calls.find(call=>call.init.method==='PATCH');
  assert.match(patch.url,new RegExp('artifacts\\?id=eq\\.'+artifactId+'.*project_id=eq\\.'+projectId));
  assert.deepEqual(JSON.parse(patch.init.body),{export_theme:'luxury-editorial'});
});

