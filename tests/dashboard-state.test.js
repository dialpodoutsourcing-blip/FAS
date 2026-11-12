const test=require('node:test');
const assert=require('node:assert/strict');

const dashboard=require('../assets/js/dashboard.js');

test('dashboard starts a new customer at ANCHOR',()=>{
  const state=dashboard.derive({answers:[],checkpoints:{},artifacts:[]},['anchor','extract']);
  assert.deepEqual({key:state.key,step:state.step,total:state.total,status:state.status,action:state.action},{key:'anchor',step:1,total:2,status:'Not started',action:'Start step 1'});
});

test('dashboard keeps a partially answered customer on their actual specialist',()=>{
  const project={answers:[{agentKey:'anchor',text:'Useful answer'}],checkpoints:{anchor:{questionIndex:1}},artifacts:[]};
  const state=dashboard.derive(project,['anchor','extract']);
  assert.equal(state.key,'anchor');
  assert.equal(state.status,'In progress');
  assert.equal(state.action,'Continue step 1');
});

test('dashboard advances to EXTRACT only after ANCHOR is complete',()=>{
  const project={answers:[],checkpoints:{anchor:{questionIndex:6,insufficientFields:[],conflicts:[]}},artifacts:[{agentKey:'anchor'}]};
  const state=dashboard.derive(project,['anchor','extract']);
  assert.equal(state.key,'extract');
  assert.equal(state.step,2);
  assert.equal(state.status,'Not started');
  assert.equal(state.href,'chat.html?agent=extract');
});

test('dashboard reviews the final specialist when all available work is complete',()=>{
  const project={answers:[],checkpoints:{},artifacts:[{agentKey:'anchor'},{agentKey:'extract'}]};
  const state=dashboard.derive(project,['anchor','extract']);
  assert.equal(state.key,'extract');
  assert.equal(state.status,'Complete');
  assert.equal(state.action,'Review step 2');
  assert.equal(state.href,'review.html?asset=extract');
});

test('dashboard projects a clear state for every available roadmap card',()=>{
  const project={answers:[],checkpoints:{anchor:{questionIndex:6,insufficientFields:[],conflicts:[]}},artifacts:[{agentKey:'anchor'}]};
  const state=dashboard.derive(project,['anchor','extract']);
  assert.deepEqual(state.cards.map(card=>({key:card.key,status:card.status,action:card.action,href:card.href})),[
    {key:'anchor',status:'Complete',action:'Review',href:'review.html?asset=anchor'},
    {key:'extract',status:'Current',action:'Start',href:'chat.html?agent=extract'}
  ]);
});

test('dashboard locks later cards and includes future entitlements safely',()=>{
  const state=dashboard.derive({answers:[],checkpoints:{},artifacts:[]},['anchor','extract','radar']);
  assert.deepEqual(state.cards.map(card=>[card.key,card.status,card.action]),[
    ['anchor','Current','Start'],
    ['extract','Locked','Locked'],
    ['radar','Locked','Locked']
  ]);
});

test('dashboard marks every roadmap card complete when all available work is done',()=>{
  const project={answers:[],checkpoints:{},artifacts:[{agentKey:'anchor'},{agentKey:'extract'}]};
  const state=dashboard.derive(project,['anchor','extract']);
  assert.deepEqual(state.cards.map(card=>[card.key,card.status,card.action]),[
    ['anchor','Complete','Review'],
    ['extract','Complete','Review']
  ]);
});

test('render preserves the locked destination and authenticated Anchor session',()=>{
  const state=dashboard.derive({answers:[],checkpoints:{},artifacts:[]},['anchor','extract']);
  const label={textContent:'',className:''};
  const action={textContent:''};
  const extractCard={
    href:'',
    classList:{toggle(){}},
    querySelector(selector){return selector==='[data-home-card-status]'?label:selector==='[data-home-card-action]'?action:null;},
    setAttribute(){},removeAttribute(){}
  };
  const doc={querySelector(selector){return selector==='[data-home-card="extract"]'?extractCard:null;}};
  dashboard.render(state,doc,{projectId:'p',sessions:{anchor:'anchor-session',extract:'extract-session'}});
  assert.equal(extractCard.href,'chat.html?agent=anchor&notice=extract-locked&project=p&session=anchor-session');
});

function renderNode(){
  const classes=new Set();
  const subtitle={textContent:'with a specialist'};
  const chevron={textContent:'›'};
  const action={querySelector(selector){return selector==='.step-link__subtitle'?subtitle:selector==='.step-link__chevron'?chevron:null;}};
  const iconClasses=new Set(['is-locked']);
  const icon={classList:{toggle(name,on){if(on)iconClasses.add(name);else iconClasses.delete(name);}}};
  return{
    href:'',action,subtitle,chevron,classes,iconClasses,
    classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);}},
    querySelector(selector){return selector==='[data-home-sidebar-action]'?action:selector==='.em'?icon:null;},
    setAttribute(){},removeAttribute(){}
  };
}

test('render keeps sidebar specialist rows aligned with live roadmap state',()=>{
  const cases=[
    {project:{answers:[],checkpoints:{},artifacts:[]},want:[['anchor','is-current'],['extract','is-locked']]},
    {project:{answers:[],checkpoints:{anchor:{questionIndex:6,insufficientFields:[],conflicts:[]}},artifacts:[{agentKey:'anchor'}]},want:[['anchor','is-complete'],['extract','is-current']]},
    {project:{answers:[],checkpoints:{},artifacts:[{agentKey:'anchor'},{agentKey:'extract'}]},want:[['anchor','is-complete'],['extract','is-complete']]}
  ];
  for(const scenario of cases){
    const nodes={anchor:renderNode(),extract:renderNode()};
    const doc={querySelector(selector){const match=selector.match(/^\[data-home-sidebar-card="(anchor|extract)"\]$/);return match?nodes[match[1]]:null;}};
    dashboard.render(dashboard.derive(scenario.project,['anchor','extract']),doc,null);
    for(const [key,className] of scenario.want){
      assert.ok(nodes[key].classes.has(className),`${key} receives ${className}`);
      assert.equal(nodes[key].subtitle.textContent,'with a specialist');
      assert.equal(nodes[key].chevron.textContent,'›');
      assert.equal(nodes[key].iconClasses.has('is-locked'),className==='is-locked',`${key} emblem lock follows ${className}`);
    }
  }
});
