'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {PDFDocument}=require('pdf-lib');
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

function premiumAnchor(){
 const artifacts=require('../assets/js/artifacts.js');
 const answers={authority:'I turn scattered consultant expertise into one focused, sellable program with a defined outcome.',arena:'Experienced independent consultants who have strong client work but struggle to package one repeatable offer.',evidence:'A leadership coach used my process to reduce twelve workshop topics to a six-week offer with a defined result.',position:'Clarity must come before scale; a narrower promise makes expertise easier to trust and buy.',boundaries:'I will not guarantee revenue, imply universal results, or claim evidence that a client has not approved.',activation:'Publish one anonymized case analysis, host a workshop for twenty qualified consultants, and invite five attendees to discovery calls.'};
 const built=artifacts.build('anchor',{id:'premium-export',version:2,answers:Object.entries(answers).map(([field,text])=>({id:'answer-'+field,field:'anchor.'+field,text}))});
 built.status='user_approved';return built;
}

test('premium Anchor renders a distinct five-page PDF in every approved theme',async()=>{
 const service=require('../lib/export-service.js'),themes=['editorial-strategy','luxury-editorial','boardroom-consultancy'],buffers=[];
 for(const theme of themes){
  const pdf=await service.renderPdf(premiumAnchor(),{theme});buffers.push(pdf);
  assert.equal(pdf.subarray(0,5).toString(),'%PDF-');assert.ok(pdf.length>12000,theme+' should contain substantive designed content');
  const document=await PDFDocument.load(pdf);assert.equal(document.getPageCount(),5);assert.equal(document.getTitle(),'Trusted Expert Blueprint');assert.match(document.getSubject(),/premium.*anchor/i);assert.ok((document.getKeywords()||'').includes(theme));
 }
 assert.notDeepEqual(buffers[0],buffers[1]);assert.notDeepEqual(buffers[1],buffers[2]);
});

test('premium Anchor embeds the approved material artwork and closes with a recommendation instead of a question',async()=>{
 const service=require('../lib/export-service.js');
 const {buildFinalDecision}=require('../lib/anchor-report-renderer.js');
 const anchor=premiumAnchor();
 anchor.premiumReport.finalDecision={recommendation:'Proceed with a controlled validation cycle before scaling.',rationale:'The position is credible, but the evidence base still needs direct market validation.',scaleTrigger:'Scale only after qualified buyer response confirms the positioning.',sourceIds:['answer-evidence','answer-activation']};
 const decision=buildFinalDecision(anchor.premiumReport);
 assert.deepEqual(decision,{recommendation:'Proceed with a controlled validation cycle before scaling.',rationale:'The position is credible, but the evidence base still needs direct market validation.',scaleTrigger:'Scale only after qualified buyer response confirms the positioning.'});
 assert.doesNotMatch(Object.values(decision).join(' '),/\?/);
 const pdf=await service.renderPdf(anchor,{theme:'editorial-strategy'}),document=await PDFDocument.load(pdf);
 const imageObjects=document.context.enumerateIndirectObjects().filter(([,object])=>/\/Subtype\s*\/Image/.test(object.toString()));
 assert.ok(imageObjects.length>=1,'the approved realistic Anchor artwork must be embedded in the PDF');
});

test('export request normalizes unknown branding while preserving premium report data',()=>{
 const service=require('../lib/export-service.js'),artifact=premiumAnchor(),request=service.assertExportRequest({format:'pdf',theme:'malicious-theme',artifact});
 assert.equal(request.theme,'editorial-strategy');assert.deepEqual(request.artifact.premiumReport,artifact.premiumReport);assert.equal(request.artifact.sources.length,6);
});

test('premium rendering contains long Unicode content safely and legacy exports still work',async()=>{
 const service=require('../lib/export-service.js'),anchor=premiumAnchor();anchor.premiumReport.executiveBrief.opportunity+=' → café — '+('Unbroken'.repeat(90));
 const [premium,legacy,docx]=await Promise.all([service.renderPdf(anchor,{theme:'boardroom-consultancy'}),service.renderPdf(artifact,{theme:'luxury-editorial'}),service.renderDocx(anchor)]);
 assert.equal((await PDFDocument.load(premium)).getPageCount(),5);assert.equal(legacy.subarray(0,5).toString(),'%PDF-');assert.equal(docx.subarray(0,2).toString(),'PK');
});

