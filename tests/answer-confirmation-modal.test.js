'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const createAnswerConfirmationModal = require('../assets/js/answer-confirmation-modal.js');

function target() {
  const listeners = {};
  return {
    textContent:'', open:false, isConnected:true, focusCount:0, attributes:{},
    addEventListener(type, listener) { (listeners[type] ||= []).push(listener); },
    dispatch(type, properties={}) { const event={target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...properties}; (listeners[type]||[]).forEach(listener=>listener(event)); return event; },
    setAttribute(name,value){this.attributes[name]=String(value);if(name==='open')this.open=true;},
    removeAttribute(name){delete this.attributes[name];if(name==='open')this.open=false;},
    hasAttribute(name){return Object.hasOwn(this.attributes,name);},
    focus(){this.focusCount+=1;}
  };
}

function setup(mode='type', native=true) {
  const dialog=target();
  if(native){dialog.showModalCount=0;dialog.closeCount=0;dialog.showModal=function(){this.open=true;this.showModalCount+=1;};dialog.close=function(){this.open=false;this.closeCount+=1;};}
  const title=target(),description=target(),question=target(),answer=target(),confirmButton=target(),cancelButton=target(),decisions=[];
  const controller=createAnswerConfirmationModal({dialog,title,description,question,answer,confirmButton,cancelButton,getMode:()=>mode,onDecision:(decision,source)=>decisions.push([decision,source])});
  return{controller,dialog,title,description,question,answer,confirmButton,cancelButton,decisions};
}

test('open shows the held answer and current question with safe default focus',()=>{
  const ui=setup();ui.controller.open({question:'Who do you help?',answer:'My favorite color is blue.'});
  assert.equal(ui.title.textContent,'Does this answer the current question?');
  assert.equal(ui.question.textContent,'Who do you help?');
  assert.equal(ui.answer.textContent,'My favorite color is blue.');
  assert.match(ui.description.textContent,/not been saved/i);
  assert.equal(ui.cancelButton.focusCount,1);assert.equal(ui.controller.isOpen(),true);
});

test('buttons and spoken confirmation resolve exactly once',()=>{
  const clicked=setup();clicked.controller.open({question:'Q',answer:'A'});clicked.confirmButton.dispatch('click');clicked.cancelButton.dispatch('click');assert.deepEqual(clicked.decisions,[[true,'button']]);
  const spoken=setup('talk');spoken.controller.open({question:'Q',answer:'A'});spoken.controller.resolve(false,'voice');spoken.confirmButton.dispatch('click');assert.deepEqual(spoken.decisions,[[false,'voice']]);
});

test('Type can dismiss as no while Talk requires an explicit decision',()=>{
  const typed=setup('type');typed.controller.open({question:'Q',answer:'A'});typed.dialog.dispatch('click');assert.deepEqual(typed.decisions,[[false,'dismiss']]);
  const talked=setup('talk');talked.controller.open({question:'Q',answer:'A'});talked.dialog.dispatch('click');const cancel=talked.dialog.dispatch('cancel');assert.equal(cancel.defaultPrevented,true);assert.deepEqual(talked.decisions,[]);assert.equal(talked.controller.isOpen(),true);
});

test('fallback traps focus and restores a connected trigger',()=>{
  const ui=setup('type',false),trigger=target();ui.controller.open({question:'Q',answer:'A',trigger});assert.equal(ui.dialog.hasAttribute('data-fallback-modal'),true);
  const forward=ui.dialog.dispatch('keydown',{key:'Tab',target:ui.confirmButton});assert.equal(forward.defaultPrevented,true);assert.equal(ui.cancelButton.focusCount,2);
  const backward=ui.dialog.dispatch('keydown',{key:'Tab',shiftKey:true,target:ui.cancelButton});assert.equal(backward.defaultPrevented,true);assert.equal(ui.confirmButton.focusCount,1);
  ui.controller.close();assert.equal(trigger.focusCount,1);
});
