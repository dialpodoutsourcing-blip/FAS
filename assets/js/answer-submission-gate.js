(function(root,factory){var create=factory();if(typeof module==='object'&&module.exports)module.exports=create;if(root){root.FAS=root.FAS||{};root.FAS.createAnswerSubmissionGate=create;}})(typeof window!=='undefined'?window:null,function(){
  return function createAnswerSubmissionGate(options){
    var pending=null;
    function hasPending(){return Boolean(pending);}
    function route(input,submit){
      if(pending)return Promise.resolve({status:'pending'});
      var question=options.getQuestion()||{},assessment=options.assess({text:input.text,question:question,agentKey:input.agentKey});
      if(assessment.status==='accept')return Promise.resolve(submit(input));
      if(assessment.status==='repeat'){options.onRepeat(input,assessment,question);return Promise.resolve({status:'repeat'});}
      if(assessment.status==='clarify'){options.onClarify(input,assessment,question);return Promise.resolve({status:'clarify'});}
      pending={input:input,question:question,submit:submit};options.onConfirm(pending);return Promise.resolve({status:'confirm'});
    }
    function resolve(decision){
      if(!pending)return Promise.resolve({status:'idle'});
      var held=pending;pending=null;
      if(decision===true)return Promise.resolve(held.submit(held.input));
      options.onRepeat(held.input,{status:'repeat',reason:'declined_confirmation'},held.question);return Promise.resolve({status:'repeat'});
    }
    return{route:route,resolve:resolve,hasPending:hasPending};
  };
});
