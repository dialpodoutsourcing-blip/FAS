(function(root,factory){var create=factory();if(typeof module==='object'&&module.exports)module.exports=create;if(root){root.FAS=root.FAS||{};root.FAS.createRetryConfirmationModal=create;}})(typeof window!=='undefined'?window:null,function(){
  return function createRetryConfirmationModal(options){
    var dialog=options.dialog,title=options.title,description=options.description,confirmButton=options.confirmButton,cancelButton=options.cancelButton;
    var active=false,settled=false,mode='type',trigger=null,fallback=false;

    function isOpen(){return active;}
    function hide(){
      if(typeof dialog.close==='function'&&dialog.open)dialog.close();
      else{dialog.removeAttribute('open');dialog.removeAttribute('data-fallback-modal');}
    }
    function restoreFocus(){if(trigger&&trigger.isConnected&&typeof trigger.focus==='function')trigger.focus();}
    function close(){if(!active)return;active=false;hide();restoreFocus();trigger=null;}
    function decide(value,source){if(!active||settled)return;settled=true;close();options.onDecision(Boolean(value),source);}
    function open(details){
      if(active)return;
      active=true;settled=false;mode=options.getMode()==='talk'?'talk':'type';trigger=details&&details.trigger||null;
      var agentName=details&&details.agentName||'this specialist';
      title.textContent='Retry '+agentName+'?';
      description.textContent='This will clear '+agentName+'\'s saved interview answers. Your existing blueprint stays in history until the completed retry creates its replacement.';
      fallback=typeof dialog.showModal!=='function';
      if(!fallback)dialog.showModal();else{dialog.setAttribute('data-fallback-modal','');dialog.setAttribute('open','');}
      cancelButton.focus();
    }

    confirmButton.addEventListener('click',function(){decide(true,'button');});
    cancelButton.addEventListener('click',function(){decide(false,'button');});
    dialog.addEventListener('cancel',function(event){event.preventDefault();if(mode==='type')decide(false,'dismiss');});
    dialog.addEventListener('click',function(event){if(event.target===dialog&&mode==='type')decide(false,'dismiss');});
    dialog.addEventListener('keydown',function(event){
      if(!active||!fallback)return;
      if(event.key==='Escape'){event.preventDefault();if(mode==='type')decide(false,'dismiss');return;}
      if(event.key!=='Tab')return;
      if(!event.shiftKey&&event.target===confirmButton){event.preventDefault();cancelButton.focus();}
      else if(event.shiftKey&&event.target===cancelButton){event.preventDefault();confirmButton.focus();}
    });

    return{open:open,close:close,isOpen:isOpen,resolve:decide};
  };
});
