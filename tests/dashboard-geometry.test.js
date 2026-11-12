const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');

const root=path.resolve(__dirname,'..');
const edge=[process.env.PLAYWRIGHT_EXECUTABLE_PATH,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/chromium','/usr/bin/chromium-browser','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(candidate=>candidate&&fs.existsSync(candidate));
const browserTest=edge?test:test.skip;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8')
  .replace(/<link rel="stylesheet" href="assets\/css\/tokens\.css">/,`<style>${fs.readFileSync(path.join(root,'assets/css/tokens.css'),'utf8')}</style>`)
  .replace(/<link rel="stylesheet" href="assets\/css\/styles\.css">/,`<style>${fs.readFileSync(path.join(root,'assets/css/styles.css'),'utf8')}</style>`)
  .replace(/<script[\s\S]*?<\/script>/g,'');

async function withPage(viewport,run){
  const browser=await chromium.launch({headless:true,executablePath:edge});
  try{
    const page=await browser.newPage({viewport});
    await page.setContent(html,{waitUntil:'domcontentloaded'});
    await page.evaluate(async()=>{document.body.removeAttribute('data-auth-pending');if(document.fonts)await document.fonts.ready;});
    await run(page);
  }finally{await browser.close();}
}

browserTest('dashboard matches the one-screen desktop geometry at 1920x1080',async()=>{
  await withPage({width:1920,height:1080},async page=>{
    const geometry=await page.evaluate(()=>{
      const rect=selector=>{const value=document.querySelector(selector).getBoundingClientRect();return{left:value.left,top:value.top,right:value.right,bottom:value.bottom,width:value.width,height:value.height};};
      return{scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,sidebar:rect('.sidebar[data-home-sidebar]'),title:rect('.home-hero__title'),subtitle:rect('.home-hero__copy > p:last-child'),focus:rect('.home-focus'),roadmap:rect('.home-roadmap'),cards:rect('.home-roadmap__grid'),card:rect('.home-roadmap-card'),cardAgent:rect('.home-roadmap-card__agent'),cardFooter:rect('.home-roadmap-card footer'),utility:rect('.home-quick'),encouragement:rect('.home-encouragement'),footer:rect('.home-sidebar__footer')};
    });
    assert.ok(geometry.scrollWidth<=1920,`horizontal document overflow: ${geometry.scrollWidth}`);
    assert.ok(geometry.scrollHeight<=1080,`vertical document overflow: ${geometry.scrollHeight}`);
    assert.ok(geometry.sidebar.width>=308&&geometry.sidebar.width<=316,`sidebar width ${geometry.sidebar.width}`);
    assert.ok(geometry.title.top>=76&&geometry.title.top<=84,`greeting baseline begins at ${geometry.title.top}`);
    assert.ok(geometry.subtitle.top>=149&&geometry.subtitle.top<=165,`supporting line begins at ${geometry.subtitle.top}`);
    assert.ok(geometry.focus.top>=250&&geometry.focus.top<=300,`focus top ${geometry.focus.top}`);
    assert.ok(geometry.focus.height>=210&&geometry.focus.height<=235,`focus height ${geometry.focus.height}`);
    const utilityLead=geometry.cards.top-geometry.utility.top;
    assert.ok(utilityLead>=70&&utilityLead<=110,`utility leads cards by ${utilityLead}px instead of the reference band`);
    assert.ok(geometry.cardAgent.top>=895&&geometry.cardAgent.top<=910,`card copy begins at ${geometry.cardAgent.top}`);
    assert.ok(geometry.cardFooter.bottom<=geometry.card.bottom-8,`card action footer ${geometry.cardFooter.bottom} is clipped by card ${geometry.card.bottom}`);
    assert.ok(geometry.encouragement.bottom<=1080,`encouragement panel is clipped at ${geometry.encouragement.bottom}`);
    assert.ok(geometry.footer.bottom<=1075&&geometry.footer.bottom>=970,`account footer remains visible at ${geometry.footer.bottom}`);
  });
});

browserTest('dashboard contains a 140-character customer name without overflow',async()=>{
  await withPage({width:1920,height:1080},async page=>{
    await page.locator('[data-account-name]').evaluateAll((nodes,name)=>nodes.forEach(node=>node.textContent=name),'M'.repeat(140));
    const overflow=await page.evaluate(()=>{const title=document.querySelector('.home-hero__title'),header=document.querySelector('.home-hero'),subtitle=document.querySelector('.home-hero__copy > p:last-child');return{page:document.documentElement.scrollWidth>innerWidth,title:title.scrollWidth>title.clientWidth,titleBottom:title.getBoundingClientRect().bottom,subtitleBottom:subtitle.getBoundingClientRect().bottom,headerBottom:header.getBoundingClientRect().bottom};});
    assert.equal(overflow.page,false);
    assert.ok(overflow.titleBottom<=overflow.headerBottom,`long title ends at ${overflow.titleBottom} after header ${overflow.headerBottom}`);
    assert.ok(overflow.subtitleBottom<=overflow.headerBottom,`subtitle ends at ${overflow.subtitleBottom} after header ${overflow.headerBottom}`);
  });
});

browserTest('scaled desktop dashboard stays on one screen at 1508x782',async()=>{
  await withPage({width:1508,height:782},async page=>{
    const geometry=await page.evaluate(()=>{
      const rect=selector=>{const value=document.querySelector(selector).getBoundingClientRect();return{left:value.left,top:value.top,right:value.right,bottom:value.bottom,width:value.width,height:value.height};};
      return{scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,sidebar:rect('.sidebar[data-home-sidebar]'),focus:rect('.home-focus'),focusIdentity:rect('.home-focus__identity'),focusAction:rect('.home-focus__action'),cards:rect('.home-roadmap__grid'),card:rect('.home-roadmap-card'),cardFooter:rect('.home-roadmap-card footer'),utility:rect('.home-quick'),encouragement:rect('.home-encouragement')};
    });
    assert.ok(geometry.scrollWidth<=1508,`horizontal document overflow: ${geometry.scrollWidth}`);
    assert.ok(geometry.scrollHeight<=782,`vertical document overflow: ${geometry.scrollHeight}`);
    assert.ok(geometry.sidebar.width>=220&&geometry.sidebar.width<=232,`compact sidebar width ${geometry.sidebar.width}`);
    assert.ok(geometry.focus.top>=138&&geometry.focus.top<=154,`compact focus top ${geometry.focus.top}`);
    assert.ok(geometry.focus.height>=138&&geometry.focus.height<=154,`compact focus height ${geometry.focus.height}`);
    assert.ok(geometry.focusIdentity.bottom<=geometry.focus.bottom,`focus identity is clipped at ${geometry.focusIdentity.bottom}`);
    assert.ok(geometry.focusAction.bottom<=geometry.focus.bottom,`focus action is clipped at ${geometry.focusAction.bottom}`);
    assert.ok(geometry.cards.top>=386&&geometry.cards.top<=406,`compact cards top ${geometry.cards.top}`);
    assert.ok(geometry.card.bottom<=778,`roadmap card is clipped at ${geometry.card.bottom}`);
    assert.ok(geometry.cardFooter.bottom<=geometry.card.bottom-6,`roadmap footer ${geometry.cardFooter.bottom} is clipped by card ${geometry.card.bottom}`);
    assert.ok(geometry.utility.left>geometry.card.right,`utility rail ${geometry.utility.left} must remain beside roadmap ${geometry.card.right}`);
    assert.ok(geometry.encouragement.bottom<=778,`encouragement panel is clipped at ${geometry.encouragement.bottom}`);
  });
});

browserTest('very short desktop restores scrolling instead of clipping dashboard actions',async()=>{
  await withPage({width:1536,height:600},async page=>{
    const geometry=await page.evaluate(()=>{const card=document.querySelector('.home-roadmap-card:last-child').getBoundingClientRect(),footer=document.querySelector('.home-roadmap-card:last-child footer').getBoundingClientRect();return{scrollHeight:document.documentElement.scrollHeight,cardBottom:card.bottom,footerBottom:footer.bottom};});
    assert.ok(geometry.scrollHeight>600,'very short desktop remains vertically scrollable');
    assert.ok(geometry.footerBottom<=geometry.cardBottom,'roadmap action remains contained in its card');
  });
});

browserTest('desktop breakpoint boundary does not clip focus content',async()=>{
  await withPage({width:1025,height:768},async page=>{
    const geometry=await page.evaluate(()=>{const focus=document.querySelector('.home-focus').getBoundingClientRect(),identity=document.querySelector('.home-focus__identity').getBoundingClientRect(),action=document.querySelector('.home-focus__action').getBoundingClientRect();return{focusBottom:focus.bottom,identityBottom:identity.bottom,actionBottom:action.bottom,scrollHeight:document.documentElement.scrollHeight};});
    assert.ok(geometry.identityBottom<=geometry.focusBottom,`focus identity is clipped at ${geometry.identityBottom}`);
    assert.ok(geometry.actionBottom<=geometry.focusBottom,`focus action is clipped at ${geometry.actionBottom}`);
    assert.ok(geometry.scrollHeight>768,'narrow desktop keeps lower dashboard content reachable');
  });
});

for(const viewport of [{width:1440,height:900},{width:1280,height:800},{width:1024,height:768},{width:768,height:1024},{width:390,height:844}]){
  browserTest(`dashboard has no horizontal overflow at ${viewport.width}x${viewport.height}`,async()=>{
    await withPage(viewport,async page=>{
      const width=await page.evaluate(()=>document.documentElement.scrollWidth);
      assert.ok(width<=viewport.width,`scrollWidth ${width} exceeds ${viewport.width}`);
      if(viewport.width<=768){const fit=await page.evaluate(()=>{const card=document.querySelector('.home-roadmap-card'),footer=card.querySelector('footer');return footer.getBoundingClientRect().bottom<=card.getBoundingClientRect().bottom;});assert.ok(fit,'mobile card contains its action footer');}
    });
  });
}
