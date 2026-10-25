'use strict';
const test=require('node:test');const assert=require('node:assert/strict');

test('project API validates UUIDs, bodies, and membership',async()=>{
 const api=require('../lib/project-api.js');
 assert.throws(()=>api.assertUuid('not-an-id'),/id/i);
 assert.throws(()=>api.validateAnswer({field:'x',text:''}),/answer/i);
 assert.deepEqual(api.validateAnswer({field:'extract.origin',text:'A specific event',basis:'user'}),{field:'extract.origin',text:'A specific event',basis:'user',permissionStatus:'not_required'});
 await assert.rejects(()=>api.authorize({userId:'u2',projectId:'p1',lookup:async()=>({userId:'u1',role:'owner'})} ),/access/i);
 assert.equal((await api.authorize({userId:'u1',projectId:'p1',lookup:async()=>({userId:'u1',role:'editor'})})).role,'editor');
});

test('changed approved facts mark only exact dependent artifact versions stale',()=>{
 const api=require('../lib/project-api.js');
 const dependencies=[{artifactVersionId:'a1v1',factId:'f1',factVersion:1},{artifactVersionId:'a2v1',factId:'f2',factVersion:1},{artifactVersionId:'a3v1',factId:'f1',factVersion:2}];
 assert.deepEqual(api.markStale(dependencies,{factId:'f1',newVersion:2}),['a1v1']);
});

test('approval creates a new immutable decision without rewriting old versions',()=>{
 const api=require('../lib/project-api.js'),versions=[{version:1,status:'draft',content:{title:'Original'}}];
 const result=api.approveVersion(versions,1,'user-1');
 assert.equal(versions[0].status,'draft');assert.equal(result.version.status,'user_approved');assert.equal(result.approval.version,1);assert.notEqual(result.version,versions[0]);
});

