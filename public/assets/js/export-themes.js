(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.exportThemes=api;}})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 var THEMES=[
  {key:'editorial-strategy',name:'Editorial Strategy',description:'Luxury FAS styling with strategic tools, evidence, and decisive editorial hierarchy.',preview:'Dark · Gold · Strategic'},
  {key:'luxury-editorial',name:'Luxury Editorial',description:'Warm, spacious, narrative-led presentation with a private-dossier feel.',preview:'Warm · Editorial · Aspirational'},
  {key:'boardroom-consultancy',name:'Boardroom Consultancy',description:'Light, analytical decision brief built around scorecards, matrices, and action.',preview:'Light · Analytical · Executive'}
 ];
 function normalize(value){return THEMES.some(function(theme){return theme.key===value;})?value:'editorial-strategy';}
 function isDismissIntent(event){return Boolean(event&&(event.key==='Escape'||event.backdrop===true));}
 function createSelectionController(options){var busy=false;function notify(state){if(options.onState)options.onState(state);}return{pending:function(){return busy;},select:async function(value){if(busy)return false;var theme=normalize(value);busy=true;notify({status:'pending',theme:theme});try{await options.persist(theme);var result=await options.exportPdf(theme);busy=false;notify({status:'success',theme:theme,result:result});return result;}catch(error){busy=false;notify({status:'error',theme:theme,error:error});throw error;}}};}
 return{THEMES:THEMES,normalize:normalize,isDismissIntent:isDismissIntent,createSelectionController:createSelectionController};
});
