'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const vault=require('../assets/js/vault-library.js');

function version(overrides={}){
  return Object.assign({artifactId:'anchor-artifact',agentKey:'anchor',version:2,status:'draft',title:'Trusted Expert Blueprint',sections:[{title:'Authority arena',blocks:[{kind:'synthesis',text:'A specific authority position grounded in current answers.'}]}]},overrides);
}

test('buildItems selects only each active artifact exact current version',()=>{
  const project={
    artifacts:[
      {id:'anchor-artifact',agentKey:'anchor',currentVersion:2,status:'draft'},
      {id:'extract-artifact',agentKey:'extract',currentVersion:3,status:'user_approved'},
      {id:'missing-current',agentKey:'radar',currentVersion:4,status:'draft'},
      {id:'sectionless',agentKey:'forge',currentVersion:1,status:'draft'}
    ],
    artifactVersions:[
      version({version:1,title:'Stale Anchor'}),
      version(),
      version({artifactId:'extract-artifact',agentKey:'extract',version:3,status:'user_approved',title:'Expertise Map'}),
      version({artifactId:'missing-current',agentKey:'radar',version:3,title:'Stale Radar'}),
      version({artifactId:'sectionless',agentKey:'forge',version:1,title:'Empty',sections:[]}),
      version({artifactId:'retired-only',agentKey:'voice',version:1,title:'Retired Copy'})
    ]
  };

  const items=vault.buildItems(project,['anchor','extract','radar','forge','voice']);

  assert.deepEqual(items.map(item=>[item.agentKey,item.title,item.version.version,item.statusLabel]),[
    ['anchor','Trusted Expert Blueprint',2,'Completed'],
    ['extract','Expertise Map',3,'Approved']
  ]);
});

test('buildItems suppresses duplicate version rows and never falls back to stale content',()=>{
  const current=version(),duplicate=version({title:'Duplicate row'}),project={
    artifacts:[{id:'anchor-artifact',agentKey:'anchor',currentVersion:2},{id:'anchor-artifact',agentKey:'anchor',currentVersion:2},{id:'missing',agentKey:'extract',currentVersion:2}],
    artifactVersions:[current,duplicate,version({artifactId:'missing',agentKey:'extract',version:1,title:'Old Extract'})]
  };

  const items=vault.buildItems(project,['anchor','extract']);

  assert.equal(items.length,1);
  assert.equal(items[0].artifact.id,'anchor-artifact');
  assert.equal(items[0].version,duplicate);
});

test('createExportGate shares one in-flight export and clears after it settles',async()=>{
  const gate=vault.createExportGate();
  let starts=0,release;
  const task=()=>{starts+=1;return new Promise(resolve=>{release=resolve;});};

  const first=gate.run('anchor-artifact:2',task);
  const duplicate=gate.run('anchor-artifact:2',task);
  assert.equal(first,duplicate);
  assert.equal(starts,1);

  release('saved.pdf');
  assert.equal(await first,'saved.pdf');
  assert.equal(await gate.run('anchor-artifact:2',()=>{starts+=1;return Promise.resolve('again.pdf');}),'again.pdf');
  assert.equal(starts,2);
});

test('buildItems orders known specialists first and derives a safe meaningful summary',()=>{
  const project={artifacts:[
    {id:'unknown',agentKey:'custom',currentVersion:1},
    {id:'extract',agentKey:'extract',currentVersion:1},
    {id:'anchor',agentKey:'anchor',currentVersion:1}
  ],artifactVersions:[
    version({artifactId:'unknown',agentKey:'custom',version:1,title:'Custom Notes',sections:[{title:'Empty',blocks:[{kind:'gap',text:'Missing'}]},{title:'Real',blocks:[{text:'  Useful custom summary.  '}]}]}),
    version({artifactId:'extract',agentKey:'extract',version:1,title:'Expertise Map'}),
    version({artifactId:'anchor',agentKey:'anchor',version:1,title:'Anchor Blueprint'})
  ]};

  const items=vault.buildItems(project,['anchor','extract']);

  assert.deepEqual(items.map(item=>item.agentKey),['anchor','extract','custom']);
  assert.equal(items[2].summary,'Useful custom summary.');
});

test('buildItems handles empty and malformed project data without mutation',()=>{
  const project={artifacts:[{id:'bad',agentKey:'anchor',currentVersion:'nope'}],artifactVersions:[]},before=JSON.stringify(project);
  assert.deepEqual(vault.buildItems(project,['anchor']),[]);
  assert.deepEqual(vault.buildItems(null,['anchor']),[]);
  assert.equal(JSON.stringify(project),before);
});

test('view preference defaults safely and restores only supported layouts',()=>{
  assert.equal(vault.normalizeView(), 'cards');
  assert.equal(vault.normalizeView('cards'), 'cards');
  assert.equal(vault.normalizeView('list'), 'list');
  assert.equal(vault.normalizeView('grid'), 'cards');

  assert.equal(vault.createViewPreference(null,'fas.vault.view').load(),'cards');
  assert.equal(vault.createViewPreference({getItem:()=> 'list'},'fas.vault.view').load(),'list');
  assert.equal(vault.createViewPreference({getItem:()=> 'broken'},'fas.vault.view').load(),'cards');
  assert.equal(vault.createViewPreference({getItem:()=>{throw new Error('blocked');}},'fas.vault.view').load(),'cards');
});

test('view preference normalizes saves and never exposes storage failures',()=>{
  const writes=[],preference=vault.createViewPreference({setItem:(key,value)=>writes.push([key,value])},'fas.vault.view');
  assert.equal(preference.save('list'),'list');
  assert.equal(preference.save('unknown'),'cards');
  assert.deepEqual(writes,[['fas.vault.view','list'],['fas.vault.view','cards']]);

  const blocked=vault.createViewPreference({setItem:()=>{throw new Error('blocked');}},'fas.vault.view');
  assert.equal(blocked.save('list'),'list');
});

test('storage lookup fails closed when the browser property getter throws',()=>{
  const browser={};
  Object.defineProperty(browser,'localStorage',{get(){throw new Error('SecurityError');}});
  assert.equal(vault.getStorage(browser,'localStorage'),null);
  assert.equal(vault.getStorage({localStorage:{getItem(){return'cards';}}},'localStorage').getItem(),'cards');
  assert.equal(vault.getStorage(null,'localStorage'),null);
});
