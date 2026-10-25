(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.accountController=api;}})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  function clean(value){return typeof value==='string'?value.trim():'';}
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function create(options){
    options=options||{};var auth=options.auth||{},context=options.context||{},localImport=options.localImport||null,doc=options.document||(typeof document!=='undefined'?document:null),location=options.location||(typeof window!=='undefined'?window.location:{href:'',search:'',hash:'',assign:function(){}}),retryImport=null,state={mode:'signup',message:'',pending:false,authenticated:false,email:'',canRetryImport:false};
    function render(){
      if(!doc)return;
      Array.prototype.forEach.call(doc.querySelectorAll('[data-auth-view]'),function(view){view.hidden=view.getAttribute('data-auth-view')!==state.mode;});
      var status=doc.querySelector('[data-auth-status]');if(status)status.textContent=state.message;
      var email=doc.querySelector('[data-auth-confirm-email]');if(email)email.textContent=state.email;
      Array.prototype.forEach.call(doc.querySelectorAll('[data-auth-submit]'),function(button){button.disabled=state.pending;button.setAttribute('aria-busy',String(state.pending));});
      var retry=doc.querySelector('[data-auth-import-retry]');if(retry)retry.hidden=!state.canRetryImport;
      if(doc.body)doc.body.setAttribute('data-auth-mode',state.mode);
    }
    function set(values){Object.keys(values).forEach(function(key){state[key]=values[key];});render();return clone(state);}
    function getState(){return clone(state);}
    function redirectUrl(){try{var url=new URL(location.href,'https://fas.local/');return url.origin+url.pathname;}catch(_){return clean(location.href).split(/[?#]/)[0];}}
    function returnPath(){var value='';try{value=new URLSearchParams(location.search||'').get('return')||'';}catch(_){}return context.safeReturnPath?context.safeReturnPath(value):'index.html';}
    function metadata(session){var user=session&&session.user||{},data=user.user_metadata||{};return{displayName:clean(data.display_name||data.full_name),projectName:clean(data.project_name||data.business_name)};}
    function migrate(importer,candidate,account){return Promise.resolve(importer.run(candidate)).then(function(result){return{account:account,result:result};});}
    function finish(session,input){
      var details=input||metadata(session);set({mode:'migrating',message:'Preparing your private FAS workspace…',pending:true,authenticated:true,canRetryImport:false});
      return context.bootstrap({displayName:clean(details.displayName),projectName:clean(details.projectName)}).then(function(account){
        var importer=typeof localImport==='function'?localImport(account):localImport;
        if(!importer||!importer.inspect)return{account:account,result:null};
        return Promise.resolve(importer.inspect()).then(function(candidate){if(!candidate)return{account:account,result:null};set({mode:'migrating',message:'Moving your saved FAS answers into your private workspace…',pending:true});retryImport=function(){return migrate(importer,candidate,account);};return retryImport();});
      }).then(function(outcome){if(outcome.result&&outcome.result.status==='skipped'){set({mode:'migration-skip',message:'Cloud work already exists. Your local answers were left untouched.',pending:false,canRetryImport:false});return{ok:true,skipped:true,context:outcome.account};}retryImport=null;set({pending:false,message:'Your workspace is ready.',canRetryImport:false});location.assign(returnPath());return{ok:true,context:outcome.account};}).catch(function(){set({mode:'error',message:'Your account is ready, but saved local work could not be moved. It is still safe in this browser.',pending:false,authenticated:true,canRetryImport:Boolean(retryImport)});return{ok:false,code:retryImport?'import_failed':'bootstrap_failed'};});
    }
    function retryLocalImport(){if(!retryImport)return Promise.resolve({ok:false,code:'nothing_to_retry'});set({mode:'migrating',message:'Retrying your saved-work import…',pending:true,canRetryImport:false});return retryImport().then(function(outcome){retryImport=null;if(outcome.result&&outcome.result.status==='complete'){set({pending:false,message:'Your workspace is ready.'});location.assign(returnPath());return{ok:true,context:outcome.account};}set({mode:'migration-skip',message:'Cloud work already exists. Your local answers were left untouched.',pending:false});return{ok:true,skipped:true,context:outcome.account};}).catch(function(){set({mode:'error',message:'Your saved local work is still safe. Please try the import again.',pending:false,canRetryImport:true});return{ok:false,code:'import_failed'};});}
    function fail(error,signin){var message=signin&&error&&error.code==='invalid_credentials'?'Unable to sign in with those credentials.':'We could not complete that account request. Please try again.';set({mode:'error',message:message,pending:false});return{ok:false,code:error&&error.code||'account_request_failed'};}
    function start(config){
      if(config&&config.unavailable){set({mode:'error',message:'Account configuration could not be loaded. Check your connection and refresh to retry.',pending:false,authenticated:false});return Promise.resolve({mode:'config-error'});}
      if(!config||!config.configured){set({mode:'error',message:'Cloud accounts are not configured yet. You may continue in local preview mode.',pending:false,authenticated:false});return Promise.resolve({mode:'local'});}
      var callback=Boolean((location.hash&&location.hash.length>1)||/[?&](error|access_token|type)=/i.test(location.search||''));
      if(callback&&auth.consumeCallback)return auth.consumeCallback(location.href).then(function(session){if(session.type==='recovery'){set({mode:'reset',message:'Choose a new password.',authenticated:true});return{mode:'reset'};}return finish(session);}).catch(function(error){return fail(error,false);});
      var existing=auth.getSession&&auth.getSession();
      if(existing){var ready=auth.requireSession?auth.requireSession():Promise.resolve(existing);return ready.then(function(session){return finish(session);}).catch(function(error){return fail(error,false);});}
      set({mode:'signup',message:'Create your private FAS workspace.'});return Promise.resolve({mode:'signup'});
    }
    function submitSignup(input){
      input=input||{};var password=String(input.password||''),confirmation=String(input.confirmation||'');
      if(password!==confirmation){set({mode:'error',message:'Your password confirmation does not match.',pending:false});return Promise.resolve({ok:false,code:'password_mismatch'});}
      if(password.length<8||!clean(input.email)){set({mode:'error',message:'Use a valid email and a password with at least eight characters.',pending:false});return Promise.resolve({ok:false,code:'invalid_signup'});}
      set({pending:true,message:'Creating your secure account…',email:clean(input.email)});
      var details={displayName:clean(input.displayName),projectName:clean(input.projectName)};
      return auth.signUp({email:clean(input.email),password:password,data:{display_name:details.displayName,project_name:details.projectName||'My Authority Project'},emailRedirectTo:redirectUrl()}).then(function(result){if(result.confirmationRequired){set({mode:'confirm',message:'Check your email to confirm your account.',pending:false});return{ok:true,confirmationRequired:true};}return finish(result,details);}).catch(function(error){return fail(error,false);});
    }
    function resendConfirmation(){if(!state.email)return Promise.resolve({ok:false,code:'email_required'});set({pending:true,message:'Sending a new confirmation email…'});return auth.resendConfirmation({email:state.email,emailRedirectTo:redirectUrl()}).then(function(){set({mode:'confirm',message:'A new confirmation email is on its way.',pending:false});return{ok:true};}).catch(function(error){return fail(error,false);});}
    function submitSignin(input){input=input||{};set({pending:true,message:'Signing you in…'});return auth.signIn({email:clean(input.email),password:String(input.password||'')}).then(function(session){return finish(session);}).catch(function(error){return fail(error,true);});}
    function submitRecovery(input){input=input||{};var email=clean(input.email);if(!email){set({mode:'error',message:'Enter your account email.',pending:false});return Promise.resolve({ok:false,code:'email_required'});}set({pending:true,email:email,message:'Sending your recovery link…'});return auth.sendRecovery({email:email,redirectTo:redirectUrl()}).then(function(){set({mode:'confirm',message:'Check your email for a secure password-reset link.',pending:false});return{ok:true};}).catch(function(error){return fail(error,false);});}
    function submitPasswordReset(input){input=input||{};var password=String(input.password||''),confirmation=String(input.confirmation||'');if(password!==confirmation||password.length<8){set({mode:'error',message:'Your passwords must match and contain at least eight characters.',pending:false});return Promise.resolve({ok:false,code:'password_mismatch'});}set({pending:true,message:'Updating your password…'});return auth.updatePassword({password:password}).then(function(){var session=auth.getSession&&auth.getSession();return finish(session||{user:{}});}).catch(function(error){return fail(error,false);});}
    return{start:start,submitSignup:submitSignup,submitSignin:submitSignin,submitRecovery:submitRecovery,submitPasswordReset:submitPasswordReset,resendConfirmation:resendConfirmation,retryLocalImport:retryLocalImport,getState:getState,show:function(mode){set({mode:mode,message:''});}};
  }
  function formValues(form){var data=new FormData(form),result={};data.forEach(function(value,key){result[key]=String(value);});return result;}
  function bind(controller,doc){
    Array.prototype.forEach.call(doc.querySelectorAll('[data-auth-switch]'),function(button){button.addEventListener('click',function(){controller.show(button.getAttribute('data-auth-switch'));});});
    Array.prototype.forEach.call(doc.querySelectorAll('[data-auth-form]'),function(form){form.addEventListener('submit',function(event){event.preventDefault();var action=form.getAttribute('data-auth-form'),values=formValues(form),method={signup:'submitSignup',signin:'submitSignin',recover:'submitRecovery',reset:'submitPasswordReset'}[action];if(method)controller[method](values).then(function(result){if(result&&result.ok)Array.prototype.forEach.call(form.querySelectorAll('input[type="password"]'),function(input){input.value='';});});});});
    var resend=doc.querySelector('[data-auth-resend]');if(resend)resend.addEventListener('click',function(){controller.resendConfirmation();});
    var retry=doc.querySelector('[data-auth-import-retry]');if(retry)retry.addEventListener('click',function(){controller.retryLocalImport();});
  }
  function mount(root){
    var FAS=root.FAS=root.FAS||{},doc=root.document;
    return FAS.runtimeConfig.load({target:root}).catch(function(){return{unavailable:true,configured:false};}).then(function(config){
      var auth=config.configured?FAS.authClient.create({supabaseUrl:config.supabaseUrl,publishableKey:config.supabasePublishableKey}):{},context=config.configured?FAS.accountContext.create({auth:auth}):{},authorizedFetch=function(url,init){return auth.requireSession().then(function(session){return root.fetch(url,Object.assign({},init,{headers:Object.assign({},init&&init.headers||{},{Authorization:'Bearer '+session.accessToken})}));});},localImport=config.configured&&FAS.localImport?function(account){return FAS.localImport.create({storage:root.localStorage,auth:auth,context:account,supabaseUrl:config.supabaseUrl,publishableKey:config.supabasePublishableKey,fetchImpl:root.fetch.bind(root),synthesisFetch:authorizedFetch,anchorUpgrade:FAS.anchorArtifactUpgrade,artifacts:FAS.artifacts});}:null,controller=create({auth:auth,context:context,localImport:localImport,document:doc,location:root.location});
      FAS.account=controller;bind(controller,doc);return controller.start(config);
    });
  }
  if(typeof window!=='undefined'&&window.document){if(window.document.readyState==='loading')window.document.addEventListener('DOMContentLoaded',function(){mount(window);});else mount(window);}
  return{create:create,mount:mount};
});
