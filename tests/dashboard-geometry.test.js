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
        specialistActions:[...document.querySelectorAll('[data-home-sidebar-action]')].map(node=>{const value=node.getBoundingClientRect();return{top:value.top,bottom:value.bottom,left:value.left,right:value.right,width:value.width,height:value.height,chevron:Boolean(node.querySelector('.step-link__chevron'))};}),
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
    geometry.specialistActions.forEach((action,index)=>{assert.ok(action.chevron,`specialist action ${index+1} uses the reference chevron`);assert.ok(action.height>=20&&action.right<=geometry.sidebarFooter.right,`specialist action ${index+1} remains contained`);});
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

browserTest('large desktop keeps the corrected reference lockup, sidebar shell, and restrained card lighting',async()=>{
  await withPage({width:1907,height:980},async page=>{
    const result=await page.evaluate(()=>{
      const box=node=>{const r=node.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      const lockup=document.querySelector('.home-sidebar__lockup'),mark=document.querySelector('.home-sidebar__lockup-mark'),word=document.querySelector('.home-sidebar__lockup-word'),shell=document.querySelector('.home-sidebar__account-shell'),account=document.querySelector('.home-sidebar__account'),signout=document.querySelector('.home-sidebar__signout');
      return{
        scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
        lockup:box(lockup),mark:box(mark),word:box(word),sidebar:box(document.querySelector('[data-home-sidebar]')),
        shell:box(shell),account:box(account),signout:box(signout),
        rows:[...document.querySelectorAll('[data-home-sidebar-card]')].map(row=>{const task=box(row.querySelector('.step-link__task')),subtitle=box(row.querySelector('.step-link__subtitle')),action=row.querySelector('[data-home-sidebar-action]');return{task,subtitle,legacy:getComputedStyle(action,'::after').content};}),
        cards:[...document.querySelectorAll('.home-roadmap-card')].map(card=>{const haze=card.querySelector('.home-roadmap-card__haze'),c=box(card),h=box(haze);return{card:c,haze:h,hazePointer:getComputedStyle(haze).pointerEvents,cornerContent:getComputedStyle(card,'::after').content};})
      };
    });
    assert.ok(result.scrollWidth<=1907&&result.scrollHeight<=980,'large desktop remains one screen');
    assert.ok(result.lockup.left>=result.sidebar.left&&result.lockup.right<=result.sidebar.right,'brand lockup remains inside the sidebar');
    assert.ok(result.mark.right+8<=result.word.left,'A mark and FAS word never overlap');
    assert.ok(result.account.top>=result.shell.top&&result.account.bottom<=result.shell.bottom,'profile remains inside its shell');
    assert.ok(result.signout.top>=result.shell.top&&result.signout.bottom<=result.shell.bottom,'Sign Out remains inside the profile shell');
    result.rows.forEach((row,index)=>{assert.ok(Math.abs(row.task.left-row.subtitle.left)<=2,`specialist ${index+1} subtitle is not aligned under its title`);assert.ok(row.legacy==='none'||row.legacy==='normal',`specialist ${index+1} still renders a legacy status arrow`);});
    result.cards.forEach((item,index)=>{assert.ok(item.card.bottom<=976,`card ${index+1} is clipped below the 980px viewport at ${item.card.bottom}`);assert.ok(item.haze.left>=item.card.left&&item.haze.top>=item.card.top&&item.haze.right<=item.card.right&&item.haze.bottom<=item.card.bottom,`card ${index+1} smoke escapes its glass panel`);assert.equal(item.hazePointer,'none');assert.ok(item.cornerContent==='none'||item.cornerContent==='normal',`card ${index+1} still uses the oversized ring border`);});
  });
});

browserTest('1680 by 945 matches the supplied reference geometry',async()=>{
  await withPage({width:1680,height:945},async page=>{
    const g=await page.evaluate(()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom};};return{sidebar:r('[data-home-sidebar]'),dashboard:r('.home-sidebar__primary .nav-link'),specialists:r('.home-sidebar__specialists'),focus:r('.home-focus'),head:r('.home-section-head'),card:r('.home-roadmap-card'),card2:r('.home-roadmap-card:nth-child(2)'),quick:r('.home-quick'),keep:r('.home-encouragement'),account:r('.home-sidebar__account-shell'),scrollHeight:document.documentElement.scrollHeight};});
    assert.ok(g.sidebar.width>=280&&g.sidebar.width<=288,`sidebar width ${g.sidebar.width}`);
    assert.ok(g.dashboard.x>=18&&g.dashboard.x<=22&&g.dashboard.y>=136&&g.dashboard.y<=144,`Dashboard row at ${g.dashboard.x},${g.dashboard.y}`);
    assert.ok(g.specialists.y>=388&&g.specialists.y<=398,`specialist divider begins at ${g.specialists.y}`);
    assert.ok(g.focus.x>=338&&g.focus.x<=346&&g.focus.y>=179&&g.focus.y<=187&&g.focus.height>=178&&g.focus.height<=186,`focus geometry ${JSON.stringify(g.focus)}`);
    assert.ok(g.head.x>=338&&g.head.x<=346&&g.head.y>=398&&g.head.y<=406,`roadmap heading at ${g.head.x},${g.head.y}`);
    assert.ok(g.card.x>=338&&g.card.x<=346&&g.card.y>=491&&g.card.y<=499&&g.card.width>=448&&g.card.width<=458&&g.card.height>=394&&g.card.height<=404,`first card ${JSON.stringify(g.card)}`);
    assert.ok(g.card2.x>=813&&g.card2.x<=821&&g.card2.width>=448&&g.card2.width<=458,`second card ${JSON.stringify(g.card2)}`);
    assert.ok(g.quick.x>=1294&&g.quick.x<=1302&&g.quick.y>=420&&g.quick.y<=428&&g.quick.width>=337&&g.quick.width<=347&&g.quick.height>=297&&g.quick.height<=307,`Quick Access ${JSON.stringify(g.quick)}`);
    assert.ok(g.keep.y>=743&&g.keep.y<=751&&g.keep.height>=142&&g.keep.height<=152,`Keep Going ${JSON.stringify(g.keep)}`);
    assert.ok(g.account.x>=18&&g.account.x<=22&&g.account.y>=778&&g.account.y<=786&&g.account.width>=240&&g.account.width<=248&&g.account.height>=127&&g.account.height<=137,`account shell ${JSON.stringify(g.account)}`);
    assert.ok(g.scrollHeight<=945,`reference viewport scrolls to ${g.scrollHeight}`);
  });
});

browserTest('1680 reference keeps glass cards, balanced number capsules, and sidebar rhythm',async()=>{
  await withPage({width:1680,height:945},async page=>{
    const result=await page.evaluate(()=>{
      const box=node=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
      const cards=[...document.querySelectorAll('.home-roadmap-card')];
      const steps=[...document.querySelectorAll('.home-roadmap-card__step')];
      const active=document.querySelector('.home-sidebar__primary .nav-link');
      const specialists=document.querySelector('.home-sidebar__specialists');
      const lockup=document.querySelector('.home-sidebar__lockup');
      const lockupMark=document.querySelector('.home-sidebar__lockup-mark');
      const lockupWord=document.querySelector('.home-sidebar__lockup-word');
      const specialistTitle=document.querySelector('.home-sidebar__specialists > .nav-group__title');
      return{
        cards:cards.map(card=>({box:box(card),background:getComputedStyle(card).backgroundImage,backdrop:getComputedStyle(card).backdropFilter,shadow:getComputedStyle(card).boxShadow})),
        steps:steps.map(step=>({box:box(step),display:getComputedStyle(step).display,lineHeight:getComputedStyle(step).lineHeight})),
        active:box(active),
        lockup:box(lockup),
        lockupVisual:{left:lockupMark.getBoundingClientRect().left,right:lockupWord.getBoundingClientRect().right},
        specialistTitle:box(specialistTitle),
        specialists:{box:box(specialists),borderTop:getComputedStyle(specialists).borderTopWidth},
        scrollHeight:document.documentElement.scrollHeight
      };
    });
    result.cards.forEach((card,index)=>{assert.ok(card.background.split('gradient').length>=4,`card ${index+1} lacks layered glass: ${card.background}`);assert.notEqual(card.backdrop,'none',`card ${index+1} lacks backdrop blur`);assert.match(card.shadow,/rgba\(255, 255, 255, 0\.16\)/,`card ${index+1} lost its bright glass edge: ${card.shadow}`);assert.match(card.shadow,/rgba\((222, 174, 53|0, 205, 157), 0\.2\)/,`card ${index+1} lost its colored lower edge: ${card.shadow}`);});
    result.steps.forEach((step,index)=>{assert.ok(Math.abs(step.box.width-54)<=1&&Math.abs(step.box.height-34)<=1,`step ${index+1} capsule is ${step.box.width}x${step.box.height}`);assert.equal(step.display,'grid');});
    assert.ok(Math.abs(result.steps[0].box.width-result.steps[1].box.width)<=.5&&Math.abs(result.steps[0].box.height-result.steps[1].box.height)<=.5,'number capsule borders are not balanced');
    assert.equal(result.specialists.borderTop,'1px');
    assert.ok(result.lockupVisual.right-result.lockupVisual.left>=112&&result.lockupVisual.right-result.lockupVisual.left<=124,`sidebar lockup visual width is ${result.lockupVisual.right-result.lockupVisual.left}`);
    assert.ok(result.specialistTitle.y>=410&&result.specialistTitle.y<=424,`specialist label starts at ${result.specialistTitle.y}`);
    assert.ok(result.specialists.box.y>result.active.y+result.active.height+42&&result.specialists.box.y<=398,'sidebar divider and specialist label retain the reference breathing room');
    assert.ok(result.scrollHeight<=945,`refined dashboard scrolls to ${result.scrollHeight}`);
  });
});

browserTest('desktop through 901px stays in the one-screen composition',async()=>{
  await withPage({width:1508,height:901},async page=>{
    const geometry=await page.evaluate(()=>{const card=document.querySelector('.home-roadmap-card:last-child').getBoundingClientRect(),footer=document.querySelector('.home-roadmap-card:last-child footer').getBoundingClientRect(),encouragement=document.querySelector('.home-encouragement').getBoundingClientRect();return{scrollHeight:document.documentElement.scrollHeight,cardBottom:card.bottom,footerBottom:footer.bottom,encouragementBottom:encouragement.bottom};});
    assert.ok(geometry.scrollHeight<=901,'901px desktop should remain in the one-screen composition');
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
