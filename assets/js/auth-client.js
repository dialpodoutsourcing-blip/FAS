(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.authClient=api;}})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  var SESSION_KEY='fas.supabase.session';
  function clean(value){return typeof value==='string'?value.trim():'';}
  function authError(code,message){var error=new Error(message||'Unable to complete this account request.');error.code=code||'account_request_failed';return error;}
  function create(options){
    options=options||{};
    var supabaseUrl=clean(options.supabaseUrl).replace(/\/+$/,''),publishableKey=clean(options.publishableKey),fetchImpl=options.fetchImpl||(typeof fetch!=='undefined'?fetch:null),storage=options.storage||(typeof localStorage!=='undefined'?localStorage:null),now=options.now||Date.now,refreshInFlight=null;
    if(!supabaseUrl||!publishableKey||!fetchImpl)throw authError('auth_not_configured','Account access is not configured.');
    function read(){try{var value=storage&&storage.getItem(SESSION_KEY),session=value&&JSON.parse(value);return session&&session.accessToken&&session.refreshToken&&session.expiresAt?session:null;}catch(_){return null;}}
    function write(session){if(storage)storage.setItem(SESSION_KEY,JSON.stringify(session));return session;}
    function clear(){if(storage)storage.removeItem(SESSION_KEY);}
    function normalize(payload,type){
      if(!payload||!payload.access_token||!payload.refresh_token)throw authError('account_request_failed');
      var expiresAt=Number(payload.expires_at)||Math.floor(now()/1000)+Number(payload.expires_in||3600),session={accessToken:String(payload.access_token),refreshToken:String(payload.refresh_token),expiresAt:expiresAt,user:payload.user||read()&&read().user||null};
      if(type)session.type=type;
      return session;
    }
    function safeError(payload,status,action){
      var code=payload&&clean(payload.code||payload.error),message='Unable to complete this account request.';
      if(code==='invalid_credentials'||(status===400&&action==='signin')){code='invalid_credentials';message='Unable to sign in with those credentials.';}
      else if(code==='email_not_confirmed'){message='Please confirm your email before signing in.';}
      else code='account_request_failed';
      return authError(code,message);
    }
    function request(path,requestOptions){
      requestOptions=requestOptions||{};
      var headers={apikey:publishableKey,'Content-Type':'application/json',Accept:'application/json'};
      if(requestOptions.token)headers.Authorization='Bearer '+requestOptions.token;
      var init={method:requestOptions.method||'POST',headers:headers};
      if(requestOptions.body!==undefined)init.body=JSON.stringify(requestOptions.body);
      return fetchImpl(supabaseUrl+path,init).then(function(response){return Promise.resolve(response.json()).catch(function(){return{};}).then(function(payload){if(!response.ok)throw safeError(payload,response.status,requestOptions.action);return payload;});});
    }
    function signUp(input){
      input=input||{};var redirect=clean(input.emailRedirectTo),path='/auth/v1/signup'+(redirect?'?redirect_to='+encodeURIComponent(redirect):'');
      return request(path,{body:{email:clean(input.email),password:String(input.password||''),data:input.data||{}},action:'signup'}).then(function(payload){if(payload.access_token)return write(normalize(payload));return{confirmationRequired:true,user:payload.user||null};});
    }
    function resendConfirmation(input){input=input||{};var body={type:'signup',email:clean(input.email)};if(clean(input.emailRedirectTo))body.options={emailRedirectTo:clean(input.emailRedirectTo)};return request('/auth/v1/resend',{body:body,action:'resend'}).then(function(){return{sent:true};});}
    function signIn(input){input=input||{};return request('/auth/v1/token?grant_type=password',{body:{email:clean(input.email),password:String(input.password||'')},action:'signin'}).then(function(payload){return write(normalize(payload));});}
    function refresh(){
      if(refreshInFlight)return refreshInFlight;
      var session=read();if(!session)return Promise.reject(authError('auth_required','Please sign in to continue.'));
      refreshInFlight=request('/auth/v1/token?grant_type=refresh_token',{body:{refresh_token:session.refreshToken},action:'refresh'}).then(function(payload){return write(normalize(payload));}).catch(function(error){clear();throw error;});
      return refreshInFlight.finally(function(){refreshInFlight=null;});
    }
    function requireSession(){var session=read();if(!session)return Promise.reject(authError('auth_required','Please sign in to continue.'));if(Number(session.expiresAt)<=Math.floor(now()/1000)+60)return refresh();return Promise.resolve(session);}
    function signOut(){var session=read();if(!session){clear();return Promise.resolve();}return request('/auth/v1/logout',{body:{},token:session.accessToken,action:'signout'}).then(function(){clear();},function(error){clear();throw error;});}
    function sendRecovery(input){input=input||{};var redirect=clean(input.redirectTo),path='/auth/v1/recover'+(redirect?'?redirect_to='+encodeURIComponent(redirect):'');return request(path,{body:{email:clean(input.email)},action:'recovery'}).then(function(){return{sent:true};});}
    function updatePassword(input){return requireSession().then(function(session){return request('/auth/v1/user',{method:'PUT',body:{password:String(input&&input.password||'')},token:session.accessToken,action:'password_update'});});}
    function getUser(){return requireSession().then(function(session){return request('/auth/v1/user',{method:'GET',token:session.accessToken,action:'user'});});}
    function consumeCallback(value){
      var url;try{url=new URL(String(value||''),'https://fas.local/');}catch(_){return Promise.reject(authError('account_request_failed'));}
      var params=new URLSearchParams(url.search),hash=new URLSearchParams(url.hash.replace(/^#/,''));hash.forEach(function(item,key){if(!params.has(key))params.set(key,item);});
      if(params.get('error')||params.get('error_code'))return Promise.reject(authError('account_request_failed'));
      var accessToken=params.get('access_token'),refreshToken=params.get('refresh_token');
      if(!accessToken||!refreshToken)return Promise.reject(authError('account_callback_missing','This account link is invalid or expired.'));
      var payload={access_token:accessToken,refresh_token:refreshToken,expires_in:Number(params.get('expires_in')||3600)};
      return request('/auth/v1/user',{method:'GET',token:accessToken,action:'user'}).then(function(user){payload.user=user;return write(normalize(payload,params.get('type')||undefined));});
    }
    return{supabaseUrl:supabaseUrl,publishableKey:publishableKey,signUp:signUp,resendConfirmation:resendConfirmation,signIn:signIn,refresh:refresh,signOut:signOut,sendRecovery:sendRecovery,updatePassword:updatePassword,consumeCallback:consumeCallback,getSession:read,requireSession:requireSession,getUser:getUser,clearSession:clear};
  }
  return{create:create,SESSION_KEY:SESSION_KEY};
});
