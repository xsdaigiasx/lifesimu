const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');const fs=require('node:fs');const artifacts=path.resolve('.qa-artifacts/home');fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:780},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{if(localStorage.getItem('life-simulator-profile-v1'))return;localStorage.setItem('life-simulator-profile-v1',JSON.stringify({name:'Minh An',gender:'male',complete:true}));localStorage.setItem('life-simulator-vi-v1',JSON.stringify({version:1,day:0,money:5200000,energy:85,mood:75,health:90,stress:20,xp:0,owned:['plant'],equipped:[],ledger:[],lastReport:null}));});
 async function enter(){await page.getByRole('button',{name:'Đến',exact:true}).click();await page.getByRole('button',{name:'Vào phòng',exact:true}).click();}
 await page.goto(process.env.QA_BASE_URL || 'http://127.0.0.1:5173');await enter();await page.getByRole('button',{name:'Sắp xếp',exact:true}).click();
 async function scene(){await page.locator('.home-scene').scrollIntoViewIfNeeded();return page.locator('.home-scene').boundingBox()}
 async function dragTo(locator,x,y){const r=await scene();const f=await page.evaluate(async({x,y})=>(await import('/src/domain/home-geometry.ts')).floorPoint(x,y),{x,y});x=f.x;y=f.y;const b=await locator.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(r.x+x/100*r.width,r.y+y/100*r.height,{steps:12});await page.mouse.up();}
 // Pick from inventory at its center, then drop at the center of the desired footprint.
 await dragTo(page.locator('.home-picker button').filter({hasText:'Giường đơn'}),4,6);
 let bed=page.getByRole('button',{name:'Di chuyển Giường đơn',exact:true});
 await page.getByRole('button',{name:'Lưu',exact:true}).click({timeout:2000});
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('life-simulator-vi-v1')));
 assert.deepEqual([saved.home.items[0].x,saved.home.items[0].y],[3,4]);
 await page.getByRole('button',{name:'Sắp xếp',exact:true}).click();
 await dragTo(page.locator('.home-picker button').filter({hasText:'Giường đơn'}),1,9);
 assert.match(await page.locator('.home-message').innerText(),/chồng|ngoài/);
 // Shelf to room with real touch input, then cancel and confirm nothing was saved.
 const r=await scene();const plant=await page.locator('.home-picker button').filter({hasText:'Chậu cây'}).boundingBox();
 const cdp=await page.context().newCDPSession(page);
 const sx=plant.x+plant.width/2,sy=plant.y+plant.height/2,ex=r.x+50/100*r.width,ey=r.y+(33.125+2.5875*13)/100*r.height;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy}]});
 for(let n=1;n<=10;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx+(ex-sx)*n/10,y:sy+(ey-sy)*n/10}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.equal(await page.getByRole('button',{name:'Di chuyển Chậu cây',exact:true}).count(),1);
 await page.screenshot({path:path.join(artifacts,'room-edit.png'),fullPage:true});
 await page.getByRole('button',{name:'Hủy',exact:true}).click();
 assert.equal(await page.locator('.home-object').count(),2);
 await page.reload();await enter();
 saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('life-simulator-vi-v1')));assert.equal(saved.home.items[0].x,3);
 await page.screenshot({path:path.join(artifacts,'room-saved.png'),fullPage:true});
 // Drag directly on a placed object, retaining the original grab offset.
await page.getByRole('button',{name:'Sắp xếp',exact:true}).click();
await scene();let b=await bed.boundingBox();let sr=await page.locator('.home-scene').boundingBox();
await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
await page.mouse.move(b.x+b.width/2+0/100*sr.width,b.y+b.height/2+5.175/100*sr.height,{steps:10});await page.mouse.up();
await page.getByRole('button',{name:'Xoay 90°',exact:true}).click();
await page.getByRole('button',{name:'Lưu',exact:true}).click();
saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('life-simulator-vi-v1')));
assert.deepEqual([saved.home.items[0].x,saved.home.items[0].y,saved.home.items[0].rotation],[3,6,90]);
for(const viewport of [{width:320,height:640},{width:430,height:932},{width:1280,height:900}]){
 await page.setViewportSize(viewport);await page.getByRole('button',{name:'Sắp xếp',exact:true}).click();
 await page.getByRole('button',{name:'Lưu',exact:true}).click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('.placebar').count(),0);assert.equal(await page.locator('.home-tools').getByRole('button',{name:'Kỹ năng',exact:true}).count(),1);
}
assert.deepEqual(errors,[]);
 console.log('PASS mobile 390x780: mouse shelf drag, saved coordinates, invalid collision rollback, real touch shelf drag, cancel, reload persistence, no browser errors');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});






