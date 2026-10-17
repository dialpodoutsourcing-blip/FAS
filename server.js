'use strict';
const path=require('node:path');
const express=require('express');
require('dotenv').config();
const REALTIME_URL='https://api.openai.com/v1/realtime/calls';
const MAX_SDP_LENGTH=16384;
function buildRealtimeSessionConfig(){return{type:'realtime',model:'gpt-realtime-2.1',instructions:"You are ADAM, the warm, intelligent guide inside FAS. Speak naturally and conversationally, with grounded confidence, varied pacing, and brief human pauses. Deliver only the requested tutorial narration. Preserve its meaning, add no facts, greetings, questions, or closing remarks, and never sound theatrical.",tools:[],tool_choice:'none',audio:{input:{turn_detection:null},output:{voice:'cedar',speed:1}}};}
function createApp({fetchImpl=globalThis.fetch,apiKey=process.env.OPENAI_API_KEY,allowedOrigin=process.env.FAS_ORIGIN||'http://127.0.0.1:4173'}={}){
 const app=express();
 app.post('/api/realtime-session',express.text({type:'application/sdp',limit:'16kb'}),async(req,res)=>{
  const origin=req.get('origin'),forwardedHost=req.get('x-forwarded-host'),requestHost=forwardedHost||req.get('host'),requestProtocol=req.get('x-forwarded-proto')||req.protocol,sameOrigin=requestHost?`${requestProtocol}://${requestHost}`:''; if(origin&&origin!==allowedOrigin&&origin!==sameOrigin)return res.status(403).json({error:'Origin not allowed.'});
  const sdp=req.body; if(typeof sdp!=='string'||!sdp.trim()||sdp.length>MAX_SDP_LENGTH||!/^v=0(?:\r?\n)/.test(sdp)||!/(?:^|\r?\n)m=audio\s/m.test(sdp))return res.status(400).json({error:'A valid audio SDP offer is required.'});
  if(!apiKey)return res.status(503).json({error:'Narration unavailable.'});
  try{for(const model of ['gpt-realtime-2.1','gpt-realtime-1.5']){const form=new FormData();form.set('sdp',sdp);form.set('session',JSON.stringify({...buildRealtimeSessionConfig(),model:model}));const upstream=await fetchImpl(REALTIME_URL,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'OpenAI-Safety-Identifier':'local-fas-tutorial'},body:form});if(upstream.ok){const answer=await upstream.text();if(answer.trim())return res.type('application/sdp').send(answer);return res.status(502).json({error:'Narration unavailable.'});}if(![502,503,504].includes(upstream.status))return res.status(502).json({error:'Narration unavailable.'});}return res.status(502).json({error:'Narration unavailable.'});}catch(_){return res.status(502).json({error:'Narration unavailable.'});}
 });
 app.use((error,req,res,next)=>{if(error&&error.type==='entity.too.large')return res.status(400).json({error:'A valid audio SDP offer is required.'});return next(error);});
 app.get('/',(req,res)=>res.redirect('/index.html'));
 app.use(express.static(path.resolve(__dirname),{setHeaders:function(res,filePath){if(filePath.endsWith('.html'))res.setHeader('Cache-Control','no-store');}}));return app;
}
const app=createApp();
if(require.main===module){const port=Number(process.env.PORT)||4173;app.listen(port,'127.0.0.1',()=>console.log(`FAS is running at http://127.0.0.1:${port}`));}
module.exports=app;
module.exports.createApp=createApp;
module.exports.buildRealtimeSessionConfig=buildRealtimeSessionConfig;
