const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');

const root=path.resolve(__dirname,'..');
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

browserTest('premium chat keeps long identity content inside the desktop toolbar',async()=>{
  await withPage({width:1508,height:782},async page=>{
    await page.locator('[data-agent-title]').evaluate(node=>node.textContent='A'.repeat(140));
    const result=await page.evaluate(()=>{const header=document.querySelector('.chat-reference-header'),save=document.querySelector('[data-save-exit]');return{pageWidth:document.documentElement.scrollWidth,headerWidth:header.scrollWidth,headerClient:header.clientWidth,saveRight:save.getBoundingClientRect().right};});
    assert.ok(result.pageWidth<=1508,`long identity causes page width ${result.pageWidth}`);
    assert.ok(result.headerWidth<=result.headerClient,`toolbar content overflows by ${result.headerWidth-result.headerClient}px`);
    assert.ok(result.saveRight<=1504,`save action clipped at ${result.saveRight}`);
  });
});
