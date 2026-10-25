'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const artifact={schemaVersion:1,id:'expertise-map-p1',agentKey:'extract',type:'expertise_map',title:'Expertise Map',version:3,status:'user_approved',generatedAt:'2026-10-25T12:00:00.000Z',sections:[{title:'Origin story',blocks:[{kind:'evidence',text:'A specific source-grounded origin story.',sourceId:'s1'}]},{title:'Proof bank',blocks:[{kind:'evidence',text:'12 clients completed the process.',sourceId:'s2'}]}],sources:[{id:'s1',field:'origin',basis:'user'},{id:'s2',field:'proof',basis:'user'}],warnings:[]};

test('export service renders valid PDF and DOCX from one normalized artifact',async()=>{
 const service=require('../lib/export-service.js');
 const normalized=service.normalizeArtifact(artifact);
 const [pdf,docx]=await Promise.all([service.renderPdf(normalized),service.renderDocx(normalized)]);
 assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
 assert.equal(docx.subarray(0,2).toString(),'PK');
 assert.ok(pdf.length>1000);assert.ok(docx.length>1000);
 assert.equal(normalized.contentFingerprint,service.normalizeArtifact(artifact).contentFingerprint);
 assert.match(service.filename(normalized,'pdf'),/^FAS-Expertise-Map-v3-[a-f0-9]{8}\.pdf$/);
});

test('export service rejects invalid, oversized, and unsupported requests',()=>{
 const service=require('../lib/export-service.js');
 assert.throws(()=>service.normalizeArtifact({title:'No sections'}),/invalid/i);
 assert.throws(()=>service.assertExportRequest({format:'exe',artifact}),/format/i);
 assert.throws(()=>service.assertExportRequest({format:'pdf',artifact:Object.assign({},artifact,{sections:[{title:'Huge',blocks:[{text:'x'.repeat(1100000)}]}]})}),/large/i);
});

test('server exposes a bounded binary export route',()=>{
 const fs=require('node:fs');const path=require('node:path');const source=fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
 assert.match(source,/app\.post\('\/api\/exports'/);assert.match(source,/application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/);assert.match(source,/Content-Disposition/);assert.match(source,/limit:'1mb'/);
});

