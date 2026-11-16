(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.FAS=root.FAS||{};root.FAS.answerRelevance=api;}})(typeof window!=='undefined'?window:null,function(){
  'use strict';

  function normalize(value){return String(value||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
  function result(status,reason){return{status:status,reason:reason};}
  function words(value){return normalize(value).split(' ').filter(Boolean);}

  var repeat=/^(?:repeat|repeat the question|repeat that|say that again|ask me the question again|(?:what was that again|what did you ask me)(?: i (?:cannot|can t|don t|do not) understand)?)$/;
  var confusion=/^(?:i (?:cannot|can t|don t|do not) understand(?: you| the question| what you mean)?|i (?:am|m) trying to understand you|what do you mean|i am confused|i m confused)$/;
  var audience=/\b(?:dentists?|coaches?|consultants?|founders?|owners?|leaders?|teams?|businesses?|companies?|clients?|customers?|people|parents?|women|men|professionals?|creators?|agencies|industr(?:y|ies)|markets?|audiences?|buyers?)\b/;
  var help=/\b(?:help|ask|advice|fix|solve|known|expert|support|teach|guide|build|create|improve|grow|understand)\b/;
  var proof=/\b(?:proof|evidence|result|results|outcome|outcomes|client|clients|customer|customers|revenue|sales|increased|decreased|saved|grew|helped|case|testimonial)\b/;
  var date=/\b(?:january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|week|month|quarter|year|q[1-4])\b|\b\d{1,2}(?:st|nd|rd|th)?\b/;
  var owner=/\b(?:own|owns|owner|responsible|accountable|assigned|lead|leads|team)\b/;
  var process=/\b(?:first|then|next|finally|step|steps|process|method|workflow|audit|plan|launch|review|deliver)\b/;
  var position=/\b(?:believe|principle|view|position|should|shouldn t|must|never|refuse|boundary|boundaries|different|approach)\b/;
  var action=/\b(?:now|next|start|begin|first|action|activate|today|tomorrow|week)\b/;
  var stop=new Set(['what','which','who','when','where','why','how','do','does','did','is','are','was','were','the','a','an','and','or','to','of','for','from','in','on','with','your','you','their','this','that','most','specifically','current','exact','real']);

  function hasQuestionOverlap(text,question){
    var answerWords=new Set(words(text));
    return words(question).some(function(word){return word.length>3&&!stop.has(word)&&answerWords.has(word);});
  }

  function fieldMatches(text,field){
    var suffix=String(field||'').toLowerCase().split('.').pop();
    if(/^(?:arena|audience|reader|buyer|segment|market)$/.test(suffix))return audience.test(text);
    if(/^(?:authority|expertise|problem|transformation)$/.test(suffix))return help.test(text)||audience.test(text);
    if(/^(?:evidence|proof|results?|outcomes?|metrics?)$/.test(suffix))return proof.test(text)||/\d/.test(text);
    if(/^(?:dates?|calendar|timeline|schedule)$/.test(suffix))return date.test(text);
    if(/^(?:owners?|roles?|responsibility)$/.test(suffix))return owner.test(text);
    if(/^(?:method|process|steps?|workflow|backward_plan)$/.test(suffix))return process.test(text);
    if(/^(?:position|boundaries|principles?|beliefs?)$/.test(suffix))return position.test(text);
    if(/^(?:activation|actions?|next_step)$/.test(suffix))return action.test(text);
    return false;
  }

  function classifyDecision(value){
    var text=normalize(value);
    if(/^(?:yes|save it|yes save it)$/.test(text))return true;
    if(/^(?:no|don t save it|discard it)$/.test(text))return false;
    return null;
  }

  function assess(input){
    input=input||{};
    var text=normalize(input.text),question=input.question||{},field=question.field||'';
    if(!text)return result('clarify','empty');
    if(repeat.test(text))return result('repeat','repeat_request');
    if(confusion.test(text))return result('clarify','confusion');
    if(fieldMatches(text,field)||hasQuestionOverlap(text,question.question||''))return result('accept','question_match');
    return result('confirm','uncertain_relevance');
  }

  return{assess:assess,classifyDecision:classifyDecision};
});
