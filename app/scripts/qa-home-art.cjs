const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');const fs=require('node:fs');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});const p=await b.newPage({viewport:{width:1280,height:900}});const root='.qa-artifacts/home';fs.mkdirSync(root,{recursive:true});
for(const rotation of [0,90]){
 await p.addInitScript(({rotation})=>{localStorage.setItem('life-simulator-profile-v1',JSON.stringify({name:'Minh An',gender:'male',complete:true}));localStorage.setItem('life-simulator-vi-v1',JSON.stringify({version:1,day:0,money:5200000,energy:85,mood:75,health:90,stress:20,xp:0,owned:[],equipped:[],ledger:[],lastReport:null,home:{items:[['bed',0,3],['desk',0,7],['wardrobe',4,3],['table',4,5],['plant',6,5],['lamp',6,7],['rug',3,7]].map(([id,x,y])=>({id,x,y,rotation,placed:true}))}}));},{rotation});
 await p.goto(process.env.QA_BASE_URL || 'http://127.0.0.1:5173');if(rotation===0)await p.evaluate(()=>Promise.all(['bed','wardrobe','desk','table','plant','lamp','rug'].flatMap(id=>[0,90].map(async turn=>{const image=new Image();image.src='/assets/static-scenes/furniture-v2/'+id+'-'+turn+'.png';await image.decode();if(!image.naturalWidth)throw new Error('Invalid sprite')}))));await p.getByRole('button',{name:'Đến',exact:true}).click();await p.getByRole('button',{name:'Vào phòng',exact:true}).click();await p.locator('.home-scene img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));
 await p.screenshot({path:`${root}/all-desktop-${rotation}.png`,fullPage:true});
 assert((await p.locator('.home-scene').boundingBox()).width>=600);assert.equal(await p.locator('.placebar').count(),0);assert.equal(await p.locator('.home-object').count(),7);assert.equal(await p.locator('.home-wall-front,.home-wall-right').count(),0);assert((await p.locator('.home-scene>img').getAttribute('src')).endsWith('rental-diamond.png'));assert.equal(await p.locator('.home-object>img').evaluateAll(es=>es.filter(e=>getComputedStyle(e).transform==='none').length),0);
 await p.setViewportSize({width:390,height:780});await p.screenshot({path:`${root}/all-mobile-${rotation}.png`,fullPage:true});
 if(rotation===90){
  await p.getByRole('button',{name:'Sắp xếp',exact:true}).click();assert.equal(await p.locator('.home-object-actions button svg').count(),3);assert.equal(await p.locator('.home-edit-actions').count(),0);await p.screenshot({path:`${root}/toolbar-mobile.png`,fullPage:true});
  await p.getByRole('button',{name:'Lưu',exact:true}).click();
  const base=await p.locator('.home-scene').screenshot({path:`${root}/walls-base.png`});
  await p.locator('.home-scene').evaluate(e=>{const t=document.createElement('div');t.style='position:absolute;inset:0;background:rgb(255,0,255);z-index:400;pointer-events:none';e.append(t)});
  const covered=await p.locator('.home-scene').screenshot({path:`${root}/walls-test.png`});
  const colors=await p.evaluate(async(urls)=>{const values=[];for(const url of urls){const image=new Image();image.src='data:image/png;base64,'+url;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);values.push([[25,75],[85,75],[76,42],[50,60]].map(([x,y])=>Array.from(ctx.getImageData(Math.floor(image.width*x/100),Math.floor(image.height*y/100),1,1).data)))}return values},[base.toString('base64'),covered.toString('base64')]);
  assert.deepEqual(colors[0][2],colors[1][2]);for(const n of [0,1,3])assert.deepEqual(colors[1][n],[255,0,255,255]);
 }
 await p.setViewportSize({width:1280,height:900});
}
console.log('PASS: 14 sprite variants decode; all7 furnishings visible at0/90; desktop room>=600px, no room footer; 3 inline icon controls; open front/right edges; bathroom wall covers marker; furniture projection matrices active');await b.close()})().catch(e=>{console.error(e);process.exit(1)});

