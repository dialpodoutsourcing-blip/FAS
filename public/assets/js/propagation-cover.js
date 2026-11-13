(function(){
  'use strict';
  var label=document.querySelector('[data-propagation-value]');
  var track=document.querySelector('.fas-propagation-cover__track');
  if(!label||!track)return;
  var value=97;
  label.textContent=value+'%';
  track.setAttribute('aria-valuenow',String(value));
})();
