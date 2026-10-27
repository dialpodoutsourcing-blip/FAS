(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.progression=api;}})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 function anchorComplete(project){return(project&&project.artifacts||[]).some(function(artifact){return(artifact.agentKey||artifact.agent_key)==='anchor';});}
 function canEnter(agentKey,project){return agentKey!=='extract'||anchorComplete(project);}
 function lockReason(agentKey,project){return canEnter(agentKey,project)?'':'Finish ANCHOR to unlock EXTRACT.';}
 return{anchorComplete:anchorComplete,canEnter:canEnter,lockReason:lockReason};
});
