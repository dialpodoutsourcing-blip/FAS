(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.retry=api;}})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  function normalize(value){return String(value||'').toLowerCase().replace(/[^a-z\s]/g,' ').replace(/\s+/g,' ').trim();}
  function classify(value){var text=normalize(value);return /^(please )?(retry|restart|restart this step|restart current step|start over|start again|start from the start)$/.test(text)||/^(let s )?(start over|start again|start from the start)$/.test(text)?'request':null;}
  function classifyConfirmation(value){var text=normalize(value);if(/^(yes|yes retry|yes start over|confirm|do it|start over|restart)$/.test(text))return true;if(/^(no|no thanks|cancel|keep my work|never mind|nevermind)$/.test(text))return false;return null;}
  return Object.freeze({classify:classify,classifyConfirmation:classifyConfirmation});
});
