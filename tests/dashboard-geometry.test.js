const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('C:/vibec/review/node_modules/playwright-core');

const root=path.resolve(__dirname,'..');
const edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
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

test('dashboard matches the one-screen desktop geometry at 1920x1080',async()=>{
  await withPage({width:1920,height:1080},async page=>{
    const geometry=await page.evaluate(()=>{
      const rect=selector=>{const value=document.querySelector(selector).getBoundingClientRect();return{left:value.left,top:value.top,right:value.right,bottom:value.bottom,width:value.width,height:value.height};};
      return{scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,sidebar:rect('.sidebar[data-home-sidebar]'),title:rect('.home-hero__title'),subtitle:rect('.home-hero__copy > p:last-child'),focus:rect('.home-focus'),roadmap:rect('.home-roadmap'),cards:rect('.home-roadmap__grid'),card:rect('.home-roadmap-card'),cardAgent:rect('.home-roadmap-card__agent'),cardFooter:rect('.home-roadmap-card footer'),utility:rect('.home-quick'),footer:rect('.home-sidebar__footer')};
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
    assert.ok(geometry.footer.bottom<=1075&&geometry.footer.bottom>=970,`account footer remains visible at ${geometry.footer.bottom}`);
  });
});

test('dashboard contains a 140-character customer name without overflow',async()=>{
  await withPage({width:1920,height:1080},async page=>{
    await page.locator('[data-account-name]').evaluateAll((nodes,name)=>nodes.forEach(node=>node.textContent=name),'M'.repeat(140));
    const overflow=await page.evaluate(()=>({page:document.documentElement.scrollWidth>innerWidth,title:(()=>{const node=document.querySelector('.home-hero__title');return node.scrollWidth>node.clientWidth;})()}));
    assert.deepEqual(overflow,{page:false,title:false});
  });
});

for(const viewport of [{width:1440,height:900},{width:1280,height:800},{width:1024,height:768},{width:768,height:1024},{width:390,height:844}]){
  test(`dashboard has no horizontal overflow at ${viewport.width}x${viewport.height}`,async()=>{
    await withPage(viewport,async page=>{
      const width=await page.evaluate(()=>document.documentElement.scrollWidth);
      assert.ok(width<=viewport.width,`scrollWidth ${width} exceeds ${viewport.width}`);
    });
  });
}
