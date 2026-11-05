(function(root,factory){var create=factory();if(typeof module==='object'&&module.exports)module.exports=create;if(root){root.FAS=root.FAS||{};root.FAS.createRetryConfirmationModal=create;}})(typeof window!=='undefined'?window:null,function(){
  return function createRetryConfirmationModal(options){
    var dialog=options.dialog,title=options.title,description=options.description,confirmButton=options.confirmButton,cancelButton=options.cancelButton;
    var active=false,settled=false,mode='type',trigger=null;

    function isOpen(){return active;}
    function hide(){
      if(typeof dialog.close==='function'&&dialog.open)dialog.close();
      else dialog.removeAttribute('open');
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
      if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
      cancelButton.focus();
    }

    confirmButton.addEventListener('click',function(){decide(true,'button');});
    cancelButton.addEventListener('click',function(){decide(false,'button');});
    dialog.addEventListener('cancel',function(event){event.preventDefault();if(mode==='type')decide(false,'dismiss');});
    dialog.addEventListener('click',function(event){if(event.target===dialog&&mode==='type')decide(false,'dismiss');});

    return{open:open,close:close,isOpen:isOpen};
  };
});
