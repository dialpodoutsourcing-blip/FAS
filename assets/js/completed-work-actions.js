(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.FAS=root.FAS||{};root.FAS.completedWorkActions=api;}
})(typeof window!=='undefined'?window:null,function(){
  'use strict';

  function buildVaultPdfUrl(options){
    var value=options||{},params=new URLSearchParams();
    params.set('agent',value.agentKey||'anchor');
    params.set('preview','pdf');
    if(value.projectId&&value.projectId!=='local-default')params.set('project',value.projectId);
    if(value.sessionId)params.set('session',value.sessionId);
    return'vault.html?'+params.toString();
  }

  return{buildVaultPdfUrl:buildVaultPdfUrl};
});
