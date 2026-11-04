// Asset review only; no game state or UI changes.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require(process.env.ISSUE133_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'../..'),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json')));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const cards=manifest.items.map(m=>`<article><img src="data:image/webp;base64,${fs.readFileSync(path.join(root,'app/public',m.file)).toString('base64')}"><div>${m.name}</div></article>`).join('');
 await page.setContent(`<!doctype html><html lang="vi"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:12px;background:#f4f0e5;color:#354632;font-family:Arial,sans-serif}header{height:48px}h1{font-size:18px;margin:0 0 5px}p{font-size:12px;margin:0;color:#65705e}main{display:grid;grid-template-columns:1fr 1fr;gap:8px}article{height:144px;padding:6px;text-align:center;background:#fcfaf3;border:1px solid #dedbcc;border-radius:8px}img{display:block;margin:auto;width:100%;height:110px;object-fit:contain}article div{font-size:12px;padding-top:6px}</style><header><h1>Đồ trung tâm thương mại</h1><p>Ảnh duyệt lô 2 — 9 mẫu</p></header><main>${cards}</main></html>`);
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 const overflow=await page.evaluate(()=>document.documentElement.scrollHeight>844);if(overflow)throw Error('Mobile page overflows 844px');
 await page.screenshot({path:path.join(__dirname,'mobile-390x844.png'),fullPage:false});console.log('PASS: 390x844 review, 9 decoded product images, no page overflow');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
