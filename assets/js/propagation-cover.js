(function(){
  'use strict';
  var duration=21600000,start=Date.now();
  var label=document.querySelector('[data-propagation-value]');
  var track=document.querySelector('.fas-propagation-cover__track');
  if(!label||!track)return;
  function update(){
    var elapsed=Math.min(Date.now()-start,duration);
    var value=Math.min(89,75+Math.floor(14*elapsed/duration));
    label.textContent=value+'%';
    track.setAttribute('aria-valuenow',String(value));
  }
  update();
  window.setInterval(update,60000);
})();
