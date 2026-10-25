'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const artifacts=require('../assets/js/artifacts.js');const agents=require('../assets/js/agents.js');

test('ANCHOR, RADAR, FORGE, and ARCHITECT expose required deliverables',()=>{
 const expected={anchor:['trusted_expert_statement'],radar:['buyer_intelligence_brief','validation_plan'],forge:['brand_identity_brief','screening_record'],architect:['program_one_sheet','curriculum_map','delivery_map','asset_inventory','production_backlog']};
 for(const [key,outputs] of Object.entries(expected))for(const output of outputs)assert.ok(agents.get(key).outputs.includes(output),`${key}:${output}`);
});

test('buyer segment scoring is transparent and equally weighted',()=>{
 const scored=artifacts.scoreBuyerSegments([{name:'Local coaches',access:5,urgency:4,abilityToPay:3,credibility:5,deliveryFit:4,evidence:3},{name:'Everyone',access:1,urgency:1,abilityToPay:1,credibility:1,deliveryFit:1,evidence:1}]);
 assert.equal(scored[0].name,'Local coaches');assert.equal(scored[0].score,4);assert.deepEqual(scored[0].inputs,{access:5,urgency:4,abilityToPay:3,credibility:5,deliveryFit:4,evidence:3});
});

test('naming stress test includes usage contexts and a clearance disclaimer',()=>{
 const result=artifacts.stressTestName('North Star Method');
 for(const key of ['webinar','referral','productTitle','socialBio'])assert.match(result.examples[key],/North Star Method/);
 assert.match(result.disclaimer,/not.*trademark|independent.*trademark/i);
});

test('curriculum validation requires the six-loop fields for every phase',()=>{
 const result=artifacts.validateCurriculum([{name:'Foundation',firstAction:'Audit',benchmark:'Score 8',mistakeCost:'Lost month',proofStory:'Client A',resource:'Worksheet',doneDefinition:'Approved map'},{name:'Build',firstAction:'Plan'}]);
 assert.equal(result.valid,false);assert.ok(result.gaps.every(gap=>gap.phase==='Build'));assert.deepEqual(result.gaps.map(gap=>gap.field),['benchmark','mistakeCost','proofStory','resource','doneDefinition']);
});

