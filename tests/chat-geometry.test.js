const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');

const root=path.resolve(__dirname,'..');
const completionModalControllerPath=path.join(root,'assets/js/completion-modal.js');
const completionModalController=fs.existsSync(completionModalControllerPath)?fs.readFileSync(completionModalControllerPath,'utf8'):'';
const edge=[process.env.PLAYWRIGHT_EXECUTABLE_PATH,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/chromium'].find(candidate=>candidate&&fs.existsSync(candidate));
const browserTest=edge?test:test.skip;
const html=fs.readFileSync(path.join(root,'chat.html'),'utf8')
  .replace(/<link rel="stylesheet" href="assets\/css\/tokens\.css">/,`<style>${fs.readFileSync(path.join(root,'assets/css/tokens.css'),'utf8')}</style>`)
  .replace(/<link rel="stylesheet" href="assets\/css\/styles\.css">/,`<style>${fs.readFileSync(path.join(root,'assets/css/styles.css'),'utf8')}</style>`)
  .replace(/<script[\s\S]*?<\/script>/g,'');

async function withPage(viewport,run){
  const browser=await chromium.launch({headless:true,executablePath:edge});
  try{
    const page=await browser.newPage({viewport});
    await page.setContent(html,{waitUntil:'domcontentloaded'});
    await page.evaluate(async()=>{document.body.removeAttribute('data-auth-pending');document.querySelector('[data-chat-loading]').hidden=true;if(document.fonts)await document.fonts.ready;});
    await run(page);
  }finally{await browser.close();}
}

browserTest('premium chat matches the one-screen reference geometry at 1680x945',async()=>{
  await withPage({width:1680,height:945},async page=>{
    const g=await page.evaluate(()=>{
      const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
      const messages=[...document.querySelectorAll('.thread > .msg')].filter(node=>!node.hidden).map(node=>({user:node.classList.contains('msg--user'),box:(()=>{const r=node.getBoundingClientRect();return{x:r.x,width:r.width,right:r.right};})()}));
      const thread=document.querySelector('.thread');
      return{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,sidebar:box('.sidebar'),header:box('.chat-reference-header'),progress:box('.chat-reference-progress'),workspace:box('.chat-shell__workspace'),composer:box('.chat-reference-composer'),messages,threadOverflow:getComputedStyle(thread).overflowY,glass:getComputedStyle(document.querySelector('.chat-reference-composer')).backdropFilter};
    });
    assert.ok(g.width<=1680,`horizontal overflow ${g.width}`);
    assert.ok(g.height<=945,`vertical overflow ${g.height}`);
    assert.ok(g.sidebar.width>=275&&g.sidebar.width<=300,`sidebar width ${g.sidebar.width}`);
    assert.ok(g.header.height>=112&&g.header.height<=155,`header height ${g.header.height}`);
    assert.ok(g.progress.height>=58&&g.progress.height<=78,`progress height ${g.progress.height}`);
    assert.ok(g.composer.bottom<=941,`composer clipped at ${g.composer.bottom}`);
    assert.equal(g.threadOverflow,'auto');
    assert.notEqual(g.glass,'none','composer uses real glass blur');
    const agent=g.messages.find(message=>!message.user),user=g.messages.find(message=>message.user);
    assert.ok(agent.box.width<g.workspace.width*.76,`agent message is too wide at ${agent.box.width}`);
    assert.ok(user.box.width<g.workspace.width*.68,`user message is too wide at ${user.box.width}`);
    assert.ok(user.box.x>agent.box.x&&user.box.right>agent.box.right,'user message is right aligned');
  });
});

browserTest('short conversations keep the input actions aligned to the workspace bottom',async()=>{
  await withPage({width:1680,height:945},async page=>{
    await page.locator('.thread > .msg').evaluateAll(nodes=>nodes.slice(1).forEach(node=>node.remove()));
    const result=await page.evaluate(()=>{
      const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:r.height};};
      const workspace=document.querySelector('.chat-shell__workspace'),paddingBottom=parseFloat(getComputedStyle(workspace).paddingBottom)||0;
      return{shell:box('.chat-shell'),workspace:box('.chat-shell__workspace'),paddingBottom,thread:box('.thread'),suggestions:box('.chat-suggestions-bar'),composer:box('.chat-reference-composer'),lastAction:box('[data-agent-completion]')};
    });
    assert.ok(Math.abs(result.workspace.bottom-result.shell.bottom)<=1,`workspace ends ${result.shell.bottom-result.workspace.bottom}px above shell bottom`);
    assert.ok(Math.abs(result.lastAction.bottom-(result.workspace.bottom-result.paddingBottom))<=1,`input actions do not align to the workspace content bottom`);
    assert.ok(result.thread.bottom<=result.suggestions.top,'conversation stays above input actions');
    assert.ok(result.composer.top>=result.suggestions.bottom,'composer stays below suggestions');
  });
});

browserTest('premium chat keeps long identity content inside the desktop toolbar',async()=>{
  await withPage({width:1508,height:782},async page=>{
    await page.locator('[data-agent-title]').evaluate(node=>node.textContent='A'.repeat(140));
    const result=await page.evaluate(()=>{const header=document.querySelector('.chat-reference-header'),save=document.querySelector('[data-save-exit]');return{pageWidth:document.documentElement.scrollWidth,headerWidth:header.scrollWidth,headerClient:header.clientWidth,saveRight:save.getBoundingClientRect().right};});
    assert.ok(result.pageWidth<=1508,`long identity causes page width ${result.pageWidth}`);
    assert.ok(result.headerWidth<=result.headerClient,`toolbar content overflows by ${result.headerWidth-result.headerClient}px`);
    assert.ok(result.saveRight<=1504,`save action clipped at ${result.saveRight}`);
  });
});

for(const viewport of [{width:1024,height:768},{width:768,height:1024},{width:390,height:844}]){
  browserTest(`premium chat remains reachable without horizontal overflow at ${viewport.width}x${viewport.height}`,async()=>{
    await withPage(viewport,async page=>{
      const result=await page.evaluate(()=>{
        const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
        const menu=document.querySelector('[data-menu-toggle]');
        const suggestions=[...document.querySelectorAll('.chat-suggestions .pill')].filter(node=>getComputedStyle(node).display!=='none').map(node=>node.getBoundingClientRect().width);
        return{width:document.documentElement.scrollWidth,composer:box('.chat-reference-composer'),workspace:box('.chat-shell__workspace'),menuDisplay:getComputedStyle(menu).display,menuVisible:menu.getBoundingClientRect().width>0,threadOverflow:getComputedStyle(document.querySelector('.thread')).overflowY,suggestions};
      });
      assert.ok(result.width<=viewport.width,`horizontal overflow ${result.width}`);
      assert.ok(result.composer.left>=0&&result.composer.right<=viewport.width,`composer spans ${result.composer.left}..${result.composer.right}`);
      assert.ok(result.composer.bottom<=result.workspace.bottom+1,'composer remains inside the chat workspace');
      if(viewport.width<=900){assert.ok(result.menuVisible&&result.menuDisplay!=='none','mobile menu remains available');result.suggestions.forEach(width=>assert.ok(width>=96,`suggestion chip is unreadably narrow at ${width}px`));}
      assert.equal(result.threadOverflow,'auto');
    });
  });
}

browserTest('premium chat stops decorative motion for reduced-motion users',async()=>{
  await withPage({width:1680,height:945},async page=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    const animations=await page.evaluate(()=>({orb:getComputedStyle(document.querySelector('.orb')).animationName,typing:getComputedStyle(document.querySelector('.bubble--typing span')).animationName,spinner:getComputedStyle(document.querySelector('.chat-loading__spinner')).animationName}));
    assert.deepEqual(animations,{orb:'none',typing:'none',spinner:'none'});
  });
});

browserTest('premium chat exposes utility actions through a pointer-accessible overflow control',async()=>{
  await withPage({width:1680,height:945},async page=>{
    const summary=page.locator('.chat-utilitybar > summary');
    assert.equal(await summary.isVisible(),true,'utility overflow trigger is visible');
    await summary.click();
    const result=await page.locator('[data-chat-history-toggle]').evaluate(node=>({visible:Boolean(node.offsetWidth&&node.offsetHeight),pointer:getComputedStyle(node).pointerEvents}));
    assert.deepEqual(result,{visible:true,pointer:'auto'});
  });
});

browserTest('premium chat preserves stage meaning on mobile',async()=>{
  await withPage({width:390,height:844},async page=>{
    const summary=page.locator('[data-agent-stage-summary]');
    assert.equal(await summary.isVisible(),true);
    assert.match((await summary.textContent()).trim(),/Stage\s+\d+\s+of\s+\d+/i);
  });
});

browserTest('premium chat wraps long unbroken agent and customer messages',async()=>{
  await withPage({width:390,height:844},async page=>{
    await page.locator('.msg:not(.msg--user) .bubble__text').first().evaluate((node,text)=>node.textContent=text,'A'.repeat(1000));
    await page.locator('.msg--user .bubble__text').evaluate((node,text)=>node.textContent=text,'B'.repeat(1000));
    const messages=await page.locator('.bubble__text').evaluateAll(nodes=>nodes.slice(0,2).map(node=>({client:node.clientWidth,scroll:node.scrollWidth,wrap:getComputedStyle(node).overflowWrap})));
    messages.forEach(message=>{assert.ok(message.scroll<=message.client+1,`message clips ${message.scroll-message.client}px`);assert.equal(message.wrap,'anywhere');});
  });
});

browserTest('anchor completion modal is centered, contained, and exposes one focused primary action',async()=>{
  await withPage({width:1680,height:945},async page=>{
    await page.locator('[data-completion-panel]').evaluate(node=>node.showModal());
    const result=await page.evaluate(()=>{
      const modal=document.querySelector('[data-completion-panel]'),card=modal.querySelector('.completion-panel__card'),action=document.querySelector('[data-completion-generate]'),r=card.getBoundingClientRect();
      return{modal:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height},actionCount:modal.querySelectorAll('button,a').length,focused:document.activeElement===action,position:getComputedStyle(modal).position,zIndex:Number(getComputedStyle(modal).zIndex)};
    });
    assert.ok(result.modal.left>300&&result.modal.right<1380,`modal spans ${result.modal.left}..${result.modal.right}`);
    assert.ok(result.modal.top>120&&result.modal.bottom<825,`modal spans ${result.modal.top}..${result.modal.bottom}`);
    assert.equal(result.actionCount,1);
    assert.equal(result.focused,true);
    assert.equal(result.position,'fixed');
    assert.ok(result.zIndex>=80);
  });
});

browserTest('completion modal stays visible in Talk and native modality keeps focus out of the background',async()=>{
  await withPage({width:1280,height:800},async page=>{
    await page.evaluate(()=>{document.querySelector('#panel-text').hidden=true;document.querySelector('#panel-voice').hidden=false;document.querySelector('[data-completion-panel]').showModal();});
    const action=page.locator('[data-completion-generate]');
    await action.focus();
    await page.keyboard.press('Shift+Tab');
    const result=await page.evaluate(()=>{const modal=document.querySelector('[data-completion-panel]');return{visible:modal.getClientRects().length>0,open:modal.open,backgroundFocused:Boolean(document.activeElement.closest&&document.activeElement.closest('#panel-text,#panel-voice'))};});
    assert.deepEqual(result,{visible:true,open:true,backgroundFocused:false});
  });
});

browserTest('cached legacy completion shell is moved out of the hidden Type panel before opening',async()=>{
  await withPage({width:1280,height:800},async page=>{
    await page.addScriptTag({content:completionModalController});
    const result=await page.evaluate(()=>{
      const current=document.querySelector('[data-completion-panel]');
      const legacy=document.createElement('section');
      legacy.className='completion-panel';legacy.setAttribute('data-completion-panel','');legacy.hidden=true;
      legacy.innerHTML='<div class="completion-panel__card"><button data-completion-generate>Generate Trusted Expert Statement</button></div>';
      document.querySelector('#panel-text').appendChild(legacy);current.remove();
      document.querySelector('#panel-text').hidden=true;document.querySelector('#panel-voice').hidden=false;
      window.FAS.completionModal.create(legacy).open();
      return{parent:legacy.parentElement.tagName,hidden:legacy.hidden,open:legacy.hasAttribute('open'),rects:legacy.getClientRects().length};
    });
    assert.deepEqual(result,{parent:'BODY',hidden:false,open:true,rects:1});
  });
});
