(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.authGuard=api;api.mount(root);}})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  function clean(value){return typeof value==='string'?value.trim():'';}
  function userMetadata(session){var user=session&&session.user||{},data=user.user_metadata||{};return{displayName:clean(data.display_name||data.full_name||user.email&&user.email.split('@')[0])||'FAS Member',projectName:clean(data.project_name||data.business_name)||'My Authority Project'};}
  function protect(options){
    options=options||{};var config=options.config||{},auth=options.auth||{},context=options.context||{},location=options.location||{};
    if(config.unavailable)return Promise.resolve({mode:'config-error'});
    if(!config.configured)return Promise.resolve({mode:'local'});
    return auth.requireSession().then(function(session){var account=context.load();if(account)return{mode:'supabase',session:session,context:account};var details=userMetadata(session);return context.bootstrap(details).then(function(created){return{mode:'supabase',session:session,context:created};});}).catch(function(){
      if(auth.clearSession)auth.clearSession();if(context.clear)context.clear();
      var candidate=(location.pathname||'')+(location.search||''),safe=context.safeReturnPath?context.safeReturnPath(candidate):'index.html',destination='account.html?return='+encodeURIComponent(safe);
      if(location.assign)location.assign(destination);
      return{mode:'redirect',destination:destination};
    });
  }
  function renderAccount(session,doc){
    if(!doc)return;var details=userMetadata(session),parts=details.displayName.split(/\s+/).filter(Boolean),initials=parts.slice(0,2).map(function(part){return part.charAt(0).toUpperCase();}).join('')||'FA';
    Array.prototype.forEach.call(doc.querySelectorAll('[data-account-name]'),function(node){node.textContent=details.displayName;});
    Array.prototype.forEach.call(doc.querySelectorAll('[data-account-business]'),function(node){node.textContent=details.projectName;});
    Array.prototype.forEach.call(doc.querySelectorAll('[data-account-avatar]'),function(node){node.textContent=initials;});
  }
  function signOut(options){options=options||{};var auth=options.auth||{},context=options.context||{},location=options.location||{};return Promise.resolve().then(function(){return auth.signOut&&auth.signOut();}).catch(function(){}).then(function(){if(context.clear)context.clear();if(location.assign)location.assign('account.html');});}
  function bindSignOut(auth,context,root){Array.prototype.forEach.call(root.document.querySelectorAll('[data-account-signout]'),function(button){button.addEventListener('click',function(event){event.preventDefault();button.setAttribute('aria-busy','true');signOut({auth:auth,context:context,location:root.location});});});}
  function mount(root){
    var FAS=root.FAS=root.FAS||{};
    var ready=FAS.runtimeConfig.load({target:root}).catch(function(){return{unavailable:true,configured:false};}).then(function(config){
      if(!config.configured)return protect({config:config,location:root.location});
      var auth=FAS.authClient.create({supabaseUrl:config.supabaseUrl,publishableKey:config.supabasePublishableKey}),context=FAS.accountContext.create({auth:auth});
      FAS.auth=auth;FAS.accountContext.current=context;
      return protect({config:config,auth:auth,context:context,location:root.location}).then(function(result){if(result.mode==='supabase'){renderAccount(result.session,root.document);bindSignOut(auth,context,root);}return result;});
    }).then(function(result){if(result.mode==='config-error'&&root.location&&root.location.assign){var candidate=(root.location.pathname||'')+(root.location.search||'');root.location.assign('account.html?error=config&return='+encodeURIComponent(candidate));}if(root.document&&root.CustomEvent)root.document.dispatchEvent(new root.CustomEvent('fas:auth-ready',{detail:result}));return result;});
    FAS.authReady=ready;return ready;
  }
  return{protect:protect,renderAccount:renderAccount,signOut:signOut,mount:mount};
});
