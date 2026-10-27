(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.progression=api;}})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 function checkpointComplete(project){
  var checkpoint=project&&project.checkpoints&&project.checkpoints.anchor;
  if(!checkpoint||Number(checkpoint.questionIndex)<6)return false;
  if((checkpoint.insufficientFields||[]).length)return false;
  return !(checkpoint.conflicts||[]).some(function(conflict){return conflict&&conflict.status==='open';});
 }
 function anchorComplete(project){
  return checkpointComplete(project)||(project&&project.artifacts||[]).some(function(artifact){return(artifact.agentKey||artifact.agent_key)==='anchor';});
 }
 function canEnter(agentKey,project){return agentKey!=='extract'||anchorComplete(project);}
 function lockReason(agentKey,project){return canEnter(agentKey,project)?'':'Finish ANCHOR to unlock EXTRACT.';}
 function apply(project,doc){if(!doc)return;var unlocked=anchorComplete(project);Array.prototype.forEach.call(doc.querySelectorAll('[data-agent-link="extract"]'),function(link){var label=link.querySelector&&link.querySelector('[data-progression-label]');if(unlocked){var href=link.getAttribute('data-unlocked-href');if(href)link.href=href;link.removeAttribute('aria-disabled');link.classList.remove('is-locked');if(label)label.textContent='Continue';}else{if(!link.getAttribute('data-unlocked-href'))link.setAttribute('data-unlocked-href',link.href);link.href='chat.html?agent=anchor&notice=extract-locked';link.setAttribute('aria-disabled','true');link.classList.add('is-locked');if(label)label.textContent='Finish ANCHOR to unlock';}});}
 return{anchorComplete:anchorComplete,canEnter:canEnter,lockReason:lockReason,apply:apply};
});
