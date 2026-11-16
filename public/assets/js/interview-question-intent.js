(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.interviewQuestionIntent=api;}})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  function normalize(value){return String(value||'').toLowerCase().replace(/[^a-z0-9\s?]/g,' ').replace(/\s+/g,' ').trim();}
  var control=/^(?:repeat(?: the question| that)?|say that again|pause|stop|stop listening|switch to typ(?:e|ing)|use typing|end(?: the)? interview|finish voice|retry|restart|start over|yes|no|confirm|cancel)$/;
  var clarification=/^(?:what do you mean|what does that mean|can you (?:explain|clarify)(?: that| the question)?|could you (?:explain|clarify)(?: that| the question)?|please (?:explain|clarify)(?: that| the question)?|can you give me an example|could you give me an example)\??$/;
  var questionStart=/^(?:what|why|how|who|when|where|which|can|could|would|is|are|do|does|did|should)\b/;
  function classify(input){
    input=input||{};var text=normalize(input.text),words=text.replace(/\?/g,'').split(' ').filter(Boolean);
    if(!text||control.test(text.replace(/\?/g,'')))return null;
    if(/^(?:i|we|my|our)\b/.test(text)||/^what i (?:do|mean|offer|provide)\b/.test(text))return null;
    if(clarification.test(text))return{type:'clarification'};
    if(words.length<=20&&questionStart.test(text)&&(text.endsWith('?')||/^(?:what|why|how|who|when|where|which|can|could|would|should)\b/.test(text)))return{type:'basic_question'};
    return null;
  }
  return Object.freeze({classify:classify});
});
