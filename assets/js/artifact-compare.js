(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.FAS=root.FAS||{};root.FAS.artifactCompare=api;}
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  function identity(version){return String(version&&version.artifactId||version&&version.id||'');}
  function sectionText(section){return(section&&section.blocks||[]).map(function(block){return String(block&&block.text||'').replace(/\s+/g,' ').trim();}).filter(Boolean).join('\n\n');}
  function buildComparison(current,versions){
    if(!current)return null;
    var currentNumber=Number(current.version)||0,currentId=identity(current),previous=(versions||[]).filter(function(version){return version!==current&&identity(version)===currentId&&(Number(version.version)||0)<currentNumber;}).sort(function(a,b){return(Number(b.version)||0)-(Number(a.version)||0);})[0];
    if(!previous)return null;
    var previousMap={},currentMap={},order=[];
    (previous.sections||[]).forEach(function(section){var title=String(section.title||'Untitled section');previousMap[title]=sectionText(section);order.push(title);});
    (current.sections||[]).forEach(function(section){var title=String(section.title||'Untitled section');currentMap[title]=sectionText(section);if(order.indexOf(title)<0)order.push(title);});
    var rows=order.map(function(title){var before=previousMap[title],after=currentMap[title],status=before==null?'added':after==null?'removed':before===after?'unchanged':'changed';return{title:title,previousText:before||'Not included in this version.',currentText:after||'Not included in this version.',status:status};});
    return{previous:previous,current:current,rows:rows,changedCount:rows.filter(function(row){return row.status!=='unchanged';}).length};
  }
  return{buildComparison:buildComparison};
});
