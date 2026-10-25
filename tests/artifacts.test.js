'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const artifacts=require('../assets/js/artifacts.js');

test('ANCHOR turns all six answers into five complete, grounded blueprint sections',()=>{
 const project={id:'anchor-project',answers:[
  {id:'a1',agentKey:'anchor',field:'anchor.authority',text:'Turn scattered expertise into one focused paid program.'},
  {id:'a2',agentKey:'anchor',field:'anchor.arena',text:'Experienced solo consultants building their first group offer.'},
  {id:'a3',agentKey:'anchor',field:'anchor.evidence',text:'18 completions from 22 enrollments plus three approved testimonials.'},
  {id:'a4',agentKey:'anchor',field:'anchor.position',text:'A narrow promise beats an oversized content library.'},
  {id:'a5',agentKey:'anchor',field:'anchor.boundaries',text:'No revenue guarantees or uncited performance claims.'},
  {id:'a6',agentKey:'anchor',field:'anchor.activation',text:'Publish one case analysis and host a live workshop within 30 days.'}
 ]};
 const artifact=artifacts.build('anchor',project),copy=JSON.stringify(artifact.sections);
 assert.equal(artifact.sections.length,5);
 assert.ok(artifact.sections.every(section=>section.blocks.length&&section.blocks.every(block=>block.kind!=='gap')));
 for(const phrase of ['solo consultants','18 completions','narrow promise','No revenue guarantees','within 30 days'])assert.match(copy,new RegExp(phrase,'i'));
 const statement=artifact.sections.find(section=>section.title==='Trusted Expert Statement');
 assert.match(statement.blocks[0].text,/I help/i);
 assert.ok(statement.blocks[0].sourceIds.length>=4);
});

test('ANCHOR applies a five-part AI synthesis without losing source provenance',()=>{
 const base=artifacts.build('anchor',{id:'p',answers:['authority','arena','evidence','position','boundaries','activation'].map((field,index)=>({id:'s'+index,field:'anchor.'+field,text:'Answer '+field}))});
 const copy={authorityArena:'Focused arena.',trustedExpertStatement:'I help a defined audience achieve a grounded result.',evidence:'Strongest proof.',positionBoundaries:'Distinct position with responsible limits.',activation:'A focused 30-day action.'};
 const result=artifacts.applySynthesis(base,copy);
 assert.deepEqual(result.sections.map(section=>section.blocks[0].text),Object.values(copy));
 assert.ok(result.sections.every(section=>section.blocks[0].sourceIds.length));
 assert.deepEqual(base.sections[0].blocks[0].text.startsWith('Authority focus:'),true,'base artifact remains unchanged');
});

test('ANCHOR attaches a complete premium report without mutating the grounded base artifact',()=>{
 const base=artifacts.build('anchor',{id:'premium',answers:['authority','arena','evidence','position','boundaries','activation'].map((field,index)=>({id:'src-'+field,field:'anchor.'+field,text:'Grounded '+field+' answer '+(index+1)}))}),before=JSON.stringify(base);
 const report={
  executiveBrief:{opportunity:'Own the focused-program category.',credibility:'A documented client outcome supports the claim.',decision:'Lead with program clarity.',sourceIds:['src-authority','src-evidence']},
  expertStatement:{external:'I help experienced independent consultants turn scattered expertise into a focused program with a measurable transformation, using a proof-led process grounded in documented client work.',thesis:'The defensible position is clarity before scale.',sourceIds:['src-authority','src-arena','src-evidence','src-position']},
  authorityFoundation:{expertiseDomain:'Program positioning',distinctiveLens:'Clarity before scale',priorityBuyer:'Experienced independent consultants',costlyProblem:'Scattered expertise',transformation:'One focused program',boundaries:'No guaranteed commercial results',sourceIds:['src-authority','src-arena','src-position','src-boundaries']},
  evidenceMatrix:[{claim:'Can focus scattered expertise',proof:'Grounded evidence answer 3',confidence:82,commercialRelevance:'Reduces buyer confusion',gap:'Add a permissioned case study',sourceIds:['src-evidence']}],
  positioningMap:{xAxis:'Generic to specific',yAxis:'Theory to evidence',position:{x:82,y:76,label:'Proof-led program clarity',rationale:'Specific buyer and evidence.',sourceIds:['src-arena','src-evidence']},alternatives:[{label:'Generic business coach',x:25,y:35}]},
  messagingArchitecture:{signatureBelief:'Clarity must precede scale.',valuePromise:'Turn expertise into a focused program.',pillars:[{title:'Focus',message:'Choose one transformation.',proof:'Documented client work.',sourceIds:['src-evidence']}],languageToUse:['focused','proof-led'],languageToAvoid:['guaranteed','effortless']},
  risks:[{risk:'One proof point',impact:'The position may feel under-supported.',mitigation:'Capture another permissioned case.',sourceIds:['src-evidence']}],
  activationPlan:[{week:1,objective:'Package proof',actions:['Draft one anonymized case analysis'],successIndicator:'One approved case analysis',sourceIds:['src-activation']}],
  recommendations:[{priority:1,title:'Publish the proof',rationale:'Evidence makes the position credible.',nextStep:'Draft and approve the case analysis.',sourceIds:['src-evidence','src-activation']}]
 };
 const result=artifacts.applySynthesis(base,{premiumReport:report});
 assert.equal(JSON.stringify(base),before,'base artifact remains immutable');
 assert.deepEqual(result.premiumReport,report);
 assert.equal(result.sections.length,5);
 const known=new Set(result.sources.map(source=>source.id));
 const cited=JSON.stringify(result.premiumReport).match(/src-[a-z]+/g)||[];
 assert.ok(cited.length>8);assert.ok(cited.every(id=>known.has(id)));
 assert.match(result.sections[1].blocks[0].text,/independent consultants/i);
});

test('ANCHOR deterministic premium fallback marks thin evidence as a gap without inventing proof',()=>{
 const artifact=artifacts.build('anchor',{id:'thin',answers:['authority','arena','evidence','position','boundaries','activation'].map(field=>({id:'src-'+field,field:'anchor.'+field,text:field==='evidence'?'I am still gathering examples.':'My '+field+' answer.'}))});
 assert.ok(artifact.premiumReport);
 assert.equal(artifact.premiumReport.evidenceMatrix[0].confidence,35);
 assert.match(artifact.premiumReport.evidenceMatrix[0].gap,/needs validation/i);
 assert.ok(artifact.premiumReport.evidenceMatrix.length>=3);
 assert.ok(artifact.premiumReport.messagingArchitecture.pillars.length>=3);
 assert.ok(artifact.premiumReport.risks.length>=2);
 assert.equal(artifact.premiumReport.activationPlan.length,4);
 assert.doesNotMatch(JSON.stringify(artifact.premiumReport),/certified|million|guaranteed result|\d+ clients/i);
 assert.ok(artifact.premiumReport.recommendations.length>=3);
});

test('EXTRACT artifact preserves evidence, exact language, permissions, and gaps',()=>{
 const artifact=artifacts.build('extract',{id:'project-1',answers:[
  {field:'extract.origin',text:'I started after my own setback.',basis:'user'},
  {field:'extract.proof',text:'A client said “I finally understand the process.”',basis:'user',permissionStatus:'pending'},
  {field:'extract.method',text:'Audit, map, then teach.',basis:'user'}
 ]});
 assert.equal(artifact.type,'expertise_map');assert.equal(artifact.title,'Expertise Map');
 for(const title of ['Origin story','Expertise pillars','Signature moves','Proof bank','Point of view','Story bank','Boundaries','Open gaps'])assert.ok(artifact.sections.some(section=>section.title===title),title);
 assert.ok(artifact.sources.every(source=>source.field&&source.basis));
 assert.equal(artifact.sources.find(source=>source.field==='extract.proof').permissionStatus,'pending');
 assert.ok(artifact.warnings.some(warning=>/permission/i.test(warning)));
 assert.equal(artifacts.validate(artifact).valid,true);
});

test('artifact validation rejects an unsupported factual claim',()=>{
 const result=artifacts.validate({type:'expertise_map',title:'Map',version:1,sections:[{title:'Proof bank',blocks:[{kind:'claim',text:'Guaranteed revenue'}]}],sources:[]});
 assert.equal(result.valid,false);assert.ok(result.errors.some(error=>/source/i.test(error)));
});

test('all seven agents build a semantic artifact',()=>{
 for(const key of ['anchor','extract','radar','forge','architect','voice','launch']){
  const artifact=artifacts.build(key,{id:'p',answers:[{field:key+'.example',text:'Approved source answer',basis:'user'}]});
  assert.ok(artifact.type);assert.ok(artifact.sections.length,key);assert.ok(artifact.sources.length,key);
 }
});

