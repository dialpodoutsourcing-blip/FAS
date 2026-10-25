(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.runtimeConfig=api;}})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  function load(options){
    options=options||{};
    var target=options.target||(typeof window!=='undefined'?window:{}),fetchImpl=options.fetchImpl||(typeof fetch!=='undefined'?fetch:null);
    if(!fetchImpl)return Promise.reject(new Error('Runtime configuration is unavailable.'));
    return fetchImpl('/api/runtime-config',{cache:'no-store',headers:{Accept:'application/json'}}).then(function(response){
      if(!response.ok)throw new Error('Runtime configuration is unavailable.');
      return response.json();
    }).then(function(config){
      var normalized=config&&config.configured&&config.supabaseUrl&&config.supabasePublishableKey?{supabaseUrl:String(config.supabaseUrl).replace(/\/+$/,''),supabasePublishableKey:String(config.supabasePublishableKey),configured:true}:{supabaseUrl:'',supabasePublishableKey:'',configured:false};
      target.FAS_CONFIG=normalized;
      return normalized;
    });
  }
  return{load:load};
});
