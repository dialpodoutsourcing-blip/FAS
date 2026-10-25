'use strict';
const {Document,Packer,Paragraph,TextRun,HeadingLevel,Table,TableRow,TableCell,WidthType,ShadingType,Header,Footer,AlignmentType,PageNumber,PageBreak,BorderStyle,TableLayoutType,VerticalAlign}=require('docx');
const {buildFinalDecision}=require('./anchor-report-renderer');

const GOLD='B88943',DARK='1C211F',MUTED='66706C',PALE='F4EFE6',GREEN='2F7466',LINE='D7D1C6',WHITE='FFFFFF',RED='A65346';
const noBorders={top:{style:BorderStyle.NONE,size:0,color:WHITE},bottom:{style:BorderStyle.NONE,size:0,color:WHITE},left:{style:BorderStyle.NONE,size:0,color:WHITE},right:{style:BorderStyle.NONE,size:0,color:WHITE},insideHorizontal:{style:BorderStyle.NONE,size:0,color:WHITE},insideVertical:{style:BorderStyle.NONE,size:0,color:WHITE}};
function run(text,options={}){return new TextRun(Object.assign({text:String(text||'—'),font:'Aptos',size:21,color:DARK},options));}
function paragraph(text,options={}){const children=Array.isArray(text)?text:[run(text,options.run)];return new Paragraph({children,spacing:options.spacing||{after:150,line:300},alignment:options.alignment,border:options.border,bullet:options.bullet,keepNext:options.keepNext});}
function label(text){return new Paragraph({children:[run(String(text).toUpperCase(),{bold:true,size:15,color:GOLD,characterSpacing:18})],spacing:{after:70},keepNext:true});}
function heading(text,level=HeadingLevel.HEADING_1){return new Paragraph({text,heading:level,keepNext:true});}
function cell(labelText,value,options={}){return new TableCell({width:{size:options.width||50,type:WidthType.PERCENTAGE},shading:{fill:options.fill||WHITE,type:ShadingType.CLEAR},margins:{top:150,bottom:150,left:170,right:170},verticalAlign:VerticalAlign.TOP,children:[label(labelText),paragraph(value,{spacing:{after:0,line:270}})]});}
function sectionBreak(){return new Paragraph({children:[new PageBreak()]});}
function twoColumnRows(items){const rows=[];for(let i=0;i<items.length;i+=2)rows.push(new TableRow({children:[cell(items[i][0],items[i][1]),items[i+1]?cell(items[i+1][0],items[i+1][1]):cell('','')]}));return rows;}
function simpleTable(headers,rows,widths){return new Table({width:{size:100,type:WidthType.PERCENTAGE},layout:TableLayoutType.FIXED,borders:{top:{style:BorderStyle.SINGLE,size:4,color:LINE},bottom:{style:BorderStyle.SINGLE,size:4,color:LINE},left:{style:BorderStyle.SINGLE,size:4,color:LINE},right:{style:BorderStyle.SINGLE,size:4,color:LINE},insideHorizontal:{style:BorderStyle.SINGLE,size:3,color:LINE},insideVertical:{style:BorderStyle.SINGLE,size:3,color:LINE}},rows:[new TableRow({tableHeader:true,children:headers.map((value,index)=>new TableCell({width:{size:widths[index],type:WidthType.PERCENTAGE},shading:{fill:DARK,type:ShadingType.CLEAR},margins:{top:110,bottom:110,left:120,right:120},children:[new Paragraph({children:[run(value,{bold:true,size:16,color:WHITE})],spacing:{after:0}})]}))})].concat(rows.map((row,rowIndex)=>new TableRow({children:row.map((value,index)=>new TableCell({width:{size:widths[index],type:WidthType.PERCENTAGE},shading:{fill:rowIndex%2?WHITE:'F8F6F1',type:ShadingType.CLEAR},margins:{top:115,bottom:115,left:120,right:120},verticalAlign:VerticalAlign.TOP,children:[paragraph(value,{spacing:{after:0,line:245},run:{size:18}})]}))})))});}

async function renderAnchorDocx(artifact){
 const report=artifact.premiumReport,decision=buildFinalDecision(report),foundation=report.authorityFoundation,children=[];
 children.push(new Paragraph({spacing:{before:980,after:100},children:[run('FITNESS AUTHORITY SYSTEM · ANCHOR',{bold:true,size:18,color:GOLD,characterSpacing:28})]}));
 children.push(new Paragraph({children:[run('TRUSTED EXPERT',{bold:true,size:54,color:DARK}),new TextRun({text:'BLUEPRINT',break:1,font:'Aptos',bold:true,size:54,color:DARK})],spacing:{after:180,line:560}}));
 children.push(paragraph('A private authority and positioning decision brief',{spacing:{after:300,line:300},run:{size:24,color:MUTED}}));
 children.push(new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:8,color:GOLD,space:1}},spacing:{after:360},children:[run(`Version ${artifact.version}  ·  Evidence fingerprint ${artifact.contentFingerprint.slice(0,8)}`,{bold:true,size:17,color:GREEN})]}));
 children.push(label('EXECUTIVE OPPORTUNITY'));
 children.push(paragraph(report.executiveBrief.opportunity,{spacing:{after:220,line:360},run:{bold:true,size:28}}));
 children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},layout:TableLayoutType.FIXED,borders:noBorders,rows:[new TableRow({children:[cell('CREDIBILITY',report.executiveBrief.credibility,{fill:PALE}),cell('STRATEGIC DECISION',report.executiveBrief.decision,{fill:PALE})]})]}));

 children.push(sectionBreak(),heading('AUTHORITY FOUNDATION'));
 children.push(paragraph(report.expertStatement.external,{spacing:{after:240,line:350},border:{left:{style:BorderStyle.SINGLE,size:16,color:GOLD,space:12}},run:{bold:true,size:24}}));
 children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},layout:TableLayoutType.FIXED,borders:{top:{style:BorderStyle.SINGLE,size:3,color:LINE},bottom:{style:BorderStyle.SINGLE,size:3,color:LINE},left:{style:BorderStyle.SINGLE,size:3,color:LINE},right:{style:BorderStyle.SINGLE,size:3,color:LINE},insideHorizontal:{style:BorderStyle.SINGLE,size:3,color:LINE},insideVertical:{style:BorderStyle.SINGLE,size:3,color:LINE}},rows:twoColumnRows([['EXPERTISE DOMAIN',foundation.expertiseDomain],['PRIORITY BUYER',foundation.priorityBuyer],['COSTLY PROBLEM',foundation.costlyProblem],['TRANSFORMATION',foundation.transformation],['DISTINCTIVE LENS',foundation.distinctiveLens],['CLAIM BOUNDARY',foundation.boundaries]])}));
 children.push(heading('Internal positioning thesis',HeadingLevel.HEADING_2),paragraph(report.expertStatement.thesis));

 children.push(sectionBreak(),heading('EVIDENCE & CREDIBILITY'));
 children.push(paragraph('Confidence scores are strategic assessments of specificity and support—not measured performance results.',{run:{color:MUTED,italics:true}}));
 children.push(simpleTable(['Claim','Proof','Confidence','Evidence gap'],report.evidenceMatrix.map(item=>[item.claim,item.proof,String(item.confidence)+'/100',item.gap]),[25,32,13,30]));
 children.push(heading('Risks to manage',HeadingLevel.HEADING_2));
 report.risks.forEach(item=>children.push(paragraph([run(item.risk+': ',{bold:true,color:RED}),run(item.impact+' Mitigation: '+item.mitigation)],{bullet:{level:0}})));

 children.push(sectionBreak(),heading('POSITION & MESSAGE'));
 children.push(label('POSITIONING DECISION'),paragraph(report.positioningMap.position.label,{spacing:{after:80},run:{bold:true,size:26}}),paragraph(report.positioningMap.position.rationale));
 children.push(heading('Message architecture',HeadingLevel.HEADING_2),paragraph(report.messagingArchitecture.signatureBelief,{run:{bold:true,size:24}}));
 children.push(simpleTable(['Pillar','Message','Supporting proof'],report.messagingArchitecture.pillars.map(item=>[item.title,item.message,item.proof]),[22,39,39]));
 children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},layout:TableLayoutType.FIXED,borders:noBorders,rows:[new TableRow({children:[cell('LANGUAGE TO USE',report.messagingArchitecture.languageToUse.join(' · '),{fill:'E8F0ED'}),cell('LANGUAGE TO AVOID',report.messagingArchitecture.languageToAvoid.join(' · '),{fill:'F5E9E5'})]})]}));

 children.push(sectionBreak(),heading('30-DAY ACTIVATION'));
 children.push(simpleTable(['Week','Objective','Actions','Success indicator'],report.activationPlan.slice().sort((a,b)=>a.week-b.week).map(item=>[String(item.week),item.objective,item.actions.join(' '),item.successIndicator]),[9,24,34,33]));
 children.push(heading('Prioritized next decisions',HeadingLevel.HEADING_2));
 report.recommendations.slice().sort((a,b)=>a.priority-b.priority).forEach(item=>children.push(paragraph([run(String(item.priority).padStart(2,'0')+'  '+item.title+' — ',{bold:true,color:GOLD}),run(item.nextStep)],{spacing:{after:110,line:275}})));
 children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},layout:TableLayoutType.FIXED,borders:{top:{style:BorderStyle.SINGLE,size:8,color:GREEN},bottom:{style:BorderStyle.SINGLE,size:4,color:LINE},left:{style:BorderStyle.SINGLE,size:4,color:LINE},right:{style:BorderStyle.SINGLE,size:4,color:LINE},insideHorizontal:{style:BorderStyle.NONE,size:0,color:WHITE},insideVertical:{style:BorderStyle.NONE,size:0,color:WHITE}},rows:[new TableRow({children:[new TableCell({shading:{fill:'E8F0ED',type:ShadingType.CLEAR},margins:{top:180,bottom:180,left:190,right:190},children:[label('RECOMMENDED DECISION'),paragraph(decision.recommendation,{spacing:{after:90},run:{bold:true,size:24}}),paragraph(decision.rationale,{spacing:{after:90}}),paragraph([run('Scale trigger: ',{bold:true,color:GREEN}),run(decision.scaleTrigger)],{spacing:{after:0}})]})]})]}));

 const header=new Header({children:[new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:4,color:LINE,space:4}},children:[run('FAS  ·  TRUSTED EXPERT BLUEPRINT',{bold:true,size:15,color:GOLD})]})]});
 const footer=new Footer({children:[new Paragraph({alignment:AlignmentType.RIGHT,border:{top:{style:BorderStyle.SINGLE,size:3,color:LINE,space:4}},children:[run('FAS · ANCHOR · CONFIDENTIAL    ',{bold:true,size:14,color:MUTED}),new TextRun({children:['PAGE ',PageNumber.CURRENT],font:'Aptos',size:14,color:MUTED})]})]});
 const document=new Document({creator:'Fitness Authority System',title:artifact.title,description:'FAS Trusted Expert Blueprint',styles:{default:{document:{run:{font:'Aptos',size:21,color:DARK},paragraph:{spacing:{after:150,line:300}}}},paragraphStyles:[{id:'Title',name:'Title',basedOn:'Normal',next:'Normal',run:{font:'Aptos Display',size:54,bold:true,color:DARK},paragraph:{spacing:{after:220}}},{id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',run:{font:'Aptos Display',size:34,bold:true,color:DARK,allCaps:true},paragraph:{spacing:{before:120,after:220},border:{bottom:{style:BorderStyle.SINGLE,size:6,color:GOLD,space:8}}}},{id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',run:{font:'Aptos',size:25,bold:true,color:DARK},paragraph:{spacing:{before:260,after:100}}}]},sections:[{properties:{page:{margin:{top:850,right:850,bottom:760,left:850}}},headers:{default:header},footers:{default:footer},children:children}]});
 return Buffer.from(await Packer.toBuffer(document));
}

module.exports={renderAnchorDocx};
