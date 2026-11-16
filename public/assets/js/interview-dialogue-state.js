(function(root,factory){var create=factory();if(typeof module==='object'&&module.exports)module.exports=create;if(root){root.FAS=root.FAS||{};root.FAS.createInterviewDialogueState=create;}})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  function questionKey(question){return String(question&&question.field||'')+'\n'+String(question&&question.question||'').trim();}
  return function createInterviewDialogueState(options){
    options=options||{};var limit=Math.max(2,Number(options.historyLimit)||24),activeKey='',items=[],turns=0;
    function ensure(question){var next=questionKey(question);if(next!==activeKey){activeKey=next;items=[];turns=0;}return next;}
    return Object.freeze({
      history:function(question){ensure(question);return items.slice(-limit).map(function(item){return{role:item.role,content:item.content};});},
      record:function(question,role,content){ensure(question);var text=String(content||'').trim();if(!text)return;items.push({role:role==='assistant'?'assistant':'user',content:text.slice(0,1000)});turns+=1;if(items.length>limit)items=items.slice(-limit);},
      turnCount:function(){return turns;},
      reset:function(){activeKey='';items=[];turns=0;}
    });
  };
});
