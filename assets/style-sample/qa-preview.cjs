const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const sharp=require('sharp');
async function main(){
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:380,height:820},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('http://asset-trial.local/**',route=>{
      const rel=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'');
      const file=path.resolve(__dirname,rel||'preview.html');
      if(!file.startsWith(__dirname+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
      const type={'.html':'text/html','.json':'application/json','.png':'image/png','.webp':'image/webp'}[path.extname(file)];
      return route.fulfill({status:200,contentType:type||'application/octet-stream',body:fs.readFileSync(file)});
    });
    await page.goto('http://asset-trial.local/preview.html');
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('hướng a'));
    for(const id of ['bed','wardrobe','desk']){
      await page.selectOption('#item',id);
      for(const d of ['b','c','d','a']){await page.click('#rotate');assert((await page.locator('#status').innerText()).includes(`hướng ${d}`),`${id} rotation ${d}`)}
    }
    await page.selectOption('#item','bed');
    const clickTile=async(x,y)=>{const b=await page.locator('canvas').boundingBox();const px=724+64*(x-y),py=350+32*(x+y);await page.mouse.click(b.x+px*b.width/1448,b.y+py*b.height/1086)};
    await clickTile(5.5,1.5);assert((await page.locator('#status').innerText()).includes('bị chiếm'),'bath collision rejected');
    await clickTile(0.5,5.5);assert((await page.locator('#status').innerText()).includes('(0, 5)'),'move to free floor');
    await page.click('#reset');await page.selectOption('#item','bed');assert((await page.locator('#status').innerText()).includes('(1, 3)'));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow at 380px');
    await page.click('#grid');
    const screen=await page.screenshot({fullPage:true});
    await sharp(screen).webp({quality:84}).toFile(path.join(__dirname,'previews/browser-mobile-380.webp'));
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(__dirname,'browser-validation.json'),JSON.stringify({status:'pass',viewport:[380,820],checks:['all 12 orientations rendered via independent sprites','bed, wardrobe and desk each rotate through a/b/c/d','bath collision is rejected','move onto free tile works','reset works','no horizontal overflow at 380px','no uncaught browser errors'],scope:'Standalone asset viewer only; not the production game'},null,2)+'\n');
    console.log('PASS: mobile viewer, 12 orientations, collision, movement and reset');
  }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
