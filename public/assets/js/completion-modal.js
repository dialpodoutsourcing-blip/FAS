(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.FAS=root.FAS||{};root.FAS.completionModal=api;}
})(typeof window!=='undefined'?window:null,function(){
  'use strict';

  function create(panel){
    function isOpen(){return Boolean(panel&&(panel.open||panel.hasAttribute('open'))&&!panel.hidden);}
    function open(){
      if(!panel)return;
      if(panel.closest&&panel.closest('[role="tabpanel"]')&&document.body)document.body.appendChild(panel);
      panel.hidden=false;
      if(typeof panel.showModal==='function'){
        if(!panel.open)panel.showModal();
        return;
      }
      panel.setAttribute('open','');
      panel.setAttribute('role','dialog');
      panel.setAttribute('aria-modal','true');
    }
    function close(){
      if(!panel)return;
      if(typeof panel.close==='function'&&panel.open){panel.close();return;}
      panel.removeAttribute('open');
      panel.hidden=true;
    }
    return{isOpen:isOpen,open:open,close:close};
  }

  return{create:create};
});
