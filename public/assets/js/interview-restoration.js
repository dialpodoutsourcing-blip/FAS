(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.FAS=root.FAS||{};root.FAS.interviewRestoration=api;}
})(typeof window!=='undefined'?window:null,function(){
  'use strict';

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function questions(agent){var result=[];(agent&&agent.chapters||[]).forEach(function(chapter){(chapter.questions||[]).forEach(function(question){result.push(question);});});return result;}
  function text(answer){var value=answer&&answer.value;return String(answer&&answer.text||(value&&value.text)||value||'').trim();}
  function field(answer){return answer&&(answer.field||answer.field_path)||'';}
  function normalizeAnswer(answer){return{id:answer.id,field:field(answer),text:text(answer),prompt:answer.prompt||(answer.value&&answer.value.prompt)||null,basis:answer.basis||'user',permissionStatus:answer.permissionStatus||answer.permission_status||'not_required',createdAt:answer.createdAt||answer.created_at||'',incomplete:Boolean(answer.incomplete||(answer.value&&answer.value.incomplete)),trigger:answer.trigger||(answer.value&&answer.value.trigger)||null,supersedesId:answer.supersedesId||answer.supersedes_id||null,relation:answer.relation||(answer.value&&answer.value.relation)||null};}

  function reconcile(agent,checkpoint,durableAnswers,options){
    options=options||{};
    var saved=(durableAnswers||[]).map(normalizeAnswer).filter(function(answer){return answer.field&&answer.text;}),state=Object.assign({chapterIndex:0,questionIndex:0,answers:[],conflicts:[],summaries:[],phases:[],probeAttempts:{},insufficientFields:[]},clone(checkpoint||{}));
    if(!saved.length)return state;
    var checkpointAnswers=(state.answers||[]).map(normalizeAnswer).filter(function(answer){return answer.field&&answer.text;}),durableFields={};saved.forEach(function(answer){durableFields[answer.field]=true;});
    state.answers=checkpointAnswers.filter(function(answer){return!durableFields[answer.field];}).concat(saved).sort(function(left,right){var list=questions(agent),leftIndex=list.findIndex(function(question){return question.field===left.field;}),rightIndex=list.findIndex(function(question){return question.field===right.field;});return leftIndex-rightIndex;});
    saved=state.answers;
    var latest={};saved.forEach(function(answer){latest[answer.field]=answer;});
    state.probeAttempts=Object.assign({},state.probeAttempts||{});Object.keys(latest).forEach(function(key){if(latest[key].incomplete&&latest[key].trigger){state.probeAttempts[key]=state.probeAttempts[key]||1;if(!state.pendingPrompt&&typeof options.followUpQuestion==='function')state.pendingPrompt=options.followUpQuestion(latest[key].trigger);}});
    var list=questions(agent),requiredAnswered=list.filter(function(question){return question.required;}).every(function(question){var answer=latest[question.field];return Boolean(answer&&answer.text);}),next=options.completed&&requiredAnswered?-1:list.findIndex(function(question){var answer=latest[question.field];return question.required&&(!answer||!answer.text||answer.incomplete);});
    state.questionIndex=next<0?list.length:next;
    state.insufficientFields=Object.keys(latest).filter(function(key){return latest[key].incomplete;});
    return state;
  }

  function transcript(agent,durableAnswers,followUpQuestion){
    var byField={};questions(agent).forEach(function(question){byField[question.field]=question.question;});
    var byId={};(durableAnswers||[]).forEach(function(answer){if(answer&&answer.id)byId[answer.id]=answer;});
    var result=[];(durableAnswers||[]).forEach(function(answer){var savedText=text(answer),previous=byId[answer.supersedesId||answer.supersedes_id],prompt=answer.prompt||(answer.value&&answer.value.prompt)||(answer.relation==='follow_up'&&previous&&typeof followUpQuestion==='function'?followUpQuestion(previous.trigger||(previous.value&&previous.value.trigger)):null)||byField[field(answer)];if(!savedText)return;if(prompt)result.push({role:'agent',text:prompt});result.push({role:'user',text:savedText});});return result;
  }

  return{reconcile:reconcile,transcript:transcript};
});
