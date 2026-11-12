const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');

const root=path.resolve(__dirname,'..');
const edge=[process.env.PLAYWRIGHT_EXECUTABLE_PATH,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/chromium','/usr/bin/chromium-browser','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(candidate=>candidate&&fs.existsSync(candidate));
const browserTest=edge?test:test.skip;
const imageData=name=>`data:image/png;base64,${fs.readFileSync(path.join(root,'assets/images',name)).toString('base64')}`;
const styles=fs.readFileSync(path.join(root,'assets/css/styles.css'),'utf8')
  .replace('../images/dashboard-anchor-platform.png',imageData('dashboard-anchor-platform.png'))
  .replace('../images/dashboard-extract-platform.png',imageData('dashboard-extract-platform.png'))
  .replace('../images/dashboard-hero-waves.png',imageData('dashboard-hero-waves.png'))
  .replace('../images/dashboard-focus-landscape.png',imageData('dashboard-focus-landscape.png'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8')
  .replace(/<link rel="stylesheet" href="assets\/css\/tokens\.css">/,`<style>${fs.readFileSync(path.join(root,'assets/css/tokens.css'),'utf8')}</style>`)
  .replace(/<link rel="stylesheet" href="assets\/css\/styles\.css">/,`<style>${styles}</style>`)
  .replace('assets/images/dashboard-anchor-platform.png',imageData('dashboard-anchor-platform.png'))
  .replace('assets/images/dashboard-extract-platform.png',imageData('dashboard-extract-platform.png'))
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
    assert.ok(geometry.cardAgent.top>=855&&geometry.cardAgent.top<=880,`card copy begins at ${geometry.cardAgent.top}`);
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

browserTest('scaled desktop preserves the polished reference details at 1508x782',async()=>{
  await withPage({width:1508,height:782},async page=>{
    const geometry=await page.evaluate(()=>{
      const rect=selector=>{const node=document.querySelector(selector);if(!node)return null;const value=node.getBoundingClientRect();return{left:value.left,top:value.top,right:value.right,bottom:value.bottom,width:value.width,height:value.height};};
      return{
        scrollHeight:document.documentElement.scrollHeight,
        progress:rect('.home-focus__progress'),gauge:rect('.home-focus__gauge'),gaugeNumber:rect('.home-focus__gauge strong'),gaugeDenominator:rect('.home-focus__gauge span'),gaugeLabel:rect('.home-focus__progress small'),
        sidebarAccount:rect('.home-sidebar__account'),signout:rect('.home-sidebar__signout'),sidebarFooter:rect('.home-sidebar__footer'),sidebarAtmosphere:rect('.home-sidebar__atmosphere'),
        specialistActions:[...document.querySelectorAll('[data-home-sidebar-action]')].map(node=>{const value=node.getBoundingClientRect();return{top:value.top,bottom:value.bottom,left:value.left,right:value.right,width:value.width,height:value.height,subtitle:Boolean(node.querySelector('.step-link__subtitle')),chevron:Boolean(node.querySelector('.step-link__chevron')),legacyArrow:getComputedStyle(node,'::after').content};}),
        cardHaze:[...document.querySelectorAll('.home-roadmap-card__haze')].map(node=>{const value=node.getBoundingClientRect(),card=node.closest('.home-roadmap-card').getBoundingClientRect();return{top:value.top,left:value.left,right:value.right,bottom:value.bottom,cardTop:card.top,cardLeft:card.left,cardRight:card.right,cardBottom:card.bottom,pointerEvents:getComputedStyle(node).pointerEvents};}),
        cardCornerOpacity:[...document.querySelectorAll('.home-roadmap-card')].map(node=>Number(getComputedStyle(node,'::after').opacity)),lockedCopyOpacity:Number(getComputedStyle(document.querySelector('.home-roadmap-card.is-locked .home-roadmap-card__copy')).opacity),savedNoteDisplay:getComputedStyle(document.querySelector('.home-sidebar__footer .saved-note')).display,
        cardArtwork:[...document.querySelectorAll('.home-roadmap-card__art')].map(node=>{const value=node.getBoundingClientRect();return{top:value.top,bottom:value.bottom,height:value.height};}),
        cardArtworkImages:[...document.querySelectorAll('.home-roadmap-card__art img')].map(node=>{const value=node.getBoundingClientRect();return{top:value.top,bottom:value.bottom,height:value.height};}),
        cardDescriptions:[...document.querySelectorAll('.home-roadmap-card__copy h3 + p')].map(node=>{const value=node.getBoundingClientRect();return{top:value.top,bottom:value.bottom,height:value.height};}),
        cardFooters:[...document.querySelectorAll('.home-roadmap-card footer')].map(node=>{const value=node.getBoundingClientRect();return{top:value.top,bottom:value.bottom,height:value.height};}),
        cards:[...document.querySelectorAll('.home-roadmap-card')].map(node=>{const value=node.getBoundingClientRect();return{top:value.top,bottom:value.bottom,height:value.height};}),
        cardActions:[...document.querySelectorAll('[data-home-card-action]')].map(node=>{const value=node.getBoundingClientRect();return{top:value.top,bottom:value.bottom,height:value.height};}),
        quick:rect('.home-quick'),encouragement:rect('.home-encouragement'),flourish:rect('.home-encouragement__flourish'),encouragementOverflow:getComputedStyle(document.querySelector('.home-encouragement')).overflow
      };
    });
    assert.ok(geometry.gauge&&geometry.gaugeNumber&&geometry.gaugeDenominator&&geometry.gaugeLabel,'progress gauge details exist');
    assert.ok(geometry.gaugeNumber.top>=geometry.gauge.top&&geometry.gaugeNumber.bottom<=geometry.gauge.bottom,'progress number stays inside its gauge');
    assert.ok(geometry.gaugeDenominator.top>=geometry.gauge.top&&geometry.gaugeDenominator.bottom<=geometry.gauge.bottom,'progress denominator stays inside its gauge');
    assert.ok(Math.abs(geometry.gaugeNumber.bottom-geometry.gaugeDenominator.bottom)<=6,'progress number and denominator share a clean baseline');
    assert.ok(geometry.gaugeLabel.height>10&&geometry.gaugeLabel.bottom<=geometry.progress.bottom,'progress label remains visible inside the progress panel');
    assert.ok(geometry.signout&&geometry.signout.height>=32,'dedicated Sign Out control remains visible');
    assert.ok(geometry.signout.bottom<=geometry.sidebarFooter.bottom,'Sign Out remains inside the sidebar footer');
    assert.ok(geometry.sidebarAtmosphere&&geometry.sidebarAtmosphere.bottom<=geometry.sidebarFooter.bottom,'sidebar atmosphere remains inside the footer');
    geometry.specialistActions.forEach((action,index)=>{assert.ok(action.subtitle&&action.chevron,`specialist row ${index+1} uses subtitle and chevron details`);assert.ok(action.height>20&&action.right<=geometry.sidebarFooter.right,`specialist row ${index+1} remains contained`);assert.ok(action.legacyArrow==='none'||action.legacyArrow==='normal',`specialist row ${index+1} still shows the legacy diagonal arrow`);});
    assert.equal(geometry.cardHaze.length,2,'both cards expose native haze layers');
    geometry.cardHaze.forEach((haze,index)=>{assert.ok(haze.top>=haze.cardTop&&haze.left>=haze.cardLeft&&haze.right<=haze.cardRight&&haze.bottom<=haze.cardBottom,`card ${index+1} haze is not contained`);assert.equal(haze.pointerEvents,'none',`card ${index+1} haze remains non-interactive`);});
    geometry.cardCornerOpacity.forEach((opacity,index)=>assert.ok(opacity<=.35,`card ${index+1} corner arc is too literal at ${opacity}`));
    assert.ok(geometry.lockedCopyOpacity>=.82,`locked card copy is dimmed below readable contrast at ${geometry.lockedCopyOpacity}`);
    assert.equal(geometry.savedNoteDisplay,'none','reference sidebar removes the extra saved-status line');
    geometry.cardArtworkImages.forEach((image,index)=>assert.ok(image.bottom<=geometry.cardArtwork[index].bottom,`card ${index+1} artwork overflows its wrapper by ${image.bottom-geometry.cardArtwork[index].bottom}px`));
    assert.equal(geometry.cardDescriptions.length,2,'both roadmap descriptions exist');
    geometry.cardDescriptions.forEach((description,index)=>assert.ok(description.height>20&&description.bottom<=geometry.cardFooters[index].top,`card ${index+1} description remains visible above its actions`));
    geometry.cardFooters.forEach((footer,index)=>assert.ok(footer.bottom<=geometry.cards[index].bottom-6,`card ${index+1} actions remain inside the card`));
    geometry.cardActions.forEach((action,index)=>assert.ok(action.height>12&&action.bottom<=geometry.cardFooters[index].bottom,`card ${index+1} detail action remains visible`));
    assert.ok(geometry.quick.bottom<geometry.encouragement.top,'utility panels retain their reference separation');
    assert.ok(geometry.encouragement.bottom<=778,'Keep Going remains fully visible');
    assert.equal(geometry.encouragementOverflow,'hidden','Keep Going clips its decorative curve');
    assert.ok(geometry.flourish&&geometry.flourish.top<geometry.encouragement.bottom,'Keep Going lower curve remains visible');
    assert.ok(geometry.scrollHeight<=782,`polished dashboard overflowed to ${geometry.scrollHeight}px`);
  });
});

browserTest('desktop just above compact height keeps every action reachable',async()=>{
  await withPage({width:1508,height:901},async page=>{
    const geometry=await page.evaluate(()=>{const card=document.querySelector('.home-roadmap-card:last-child').getBoundingClientRect(),footer=document.querySelector('.home-roadmap-card:last-child footer').getBoundingClientRect(),encouragement=document.querySelector('.home-encouragement').getBoundingClientRect();return{scrollHeight:document.documentElement.scrollHeight,cardBottom:card.bottom,footerBottom:footer.bottom,encouragementBottom:encouragement.bottom};});
    assert.ok(geometry.scrollHeight>901,'901px desktop restores scrolling until the full layout fits');
    assert.ok(geometry.footerBottom<=geometry.cardBottom,'roadmap footer remains inside its card');
    assert.ok(geometry.encouragementBottom<=geometry.scrollHeight,'Keep Going remains reachable within the document');
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
