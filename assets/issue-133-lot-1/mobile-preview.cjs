// Review-only browser screenshot. No game UI or game state is changed.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.ISSUE133_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'../..');
const data=p=>'data:image/'+(p.endsWith('.png')?'png':'webp')+';base64,'+fs.readFileSync(p).toString('base64');
const cards=[['bed-basic','Giường'],['wardrobe-comfort','Tủ gỗ'],['desk-comfort','Bàn có kệ'],['plant-comfort','Trầu bà'],['lamp-comfort','Đèn gốm'],['rug-comfort','Thảm len']];
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 await page.setContent(`<!doctype html><html lang="vi"><meta charset="utf-8"><style>
 *{box-sizing:border-box}body{margin:0;background:#f4f0e5;color:#354632;font-family:Arial,sans-serif;padding:12px}header{height:46px}h1{font-size:19px;margin:0 0 5px}p{font-size:12px;margin:0;color:#65705e}.room{display:block;width:100%;border:1px solid #d6d3c3;border-radius:9px;margin-bottom:10px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.card{height:147px;background:#fcfaf3;border:1px solid #dedbcc;border-radius:8px;text-align:center;padding:6px}.card img{display:block;margin:auto;width:100%;height:115px;object-fit:contain}.label{font-size:12px;padding-top:4px}
 </style><header><h1>Nội thất phòng trọ</h1><p>Ảnh duyệt lô 1 · Issue #133</p></header><img class="room" src="${data(path.join(__dirname,'room-grid-preview.webp'))}"><div class="grid">${cards.map(([id,label])=>`<div class="card"><img src="${data(path.join(root,'app/public/assets/furniture',id+'_a.png'))}"><div class="label">${label}</div></div>`).join('')}</div></html>`);
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 await page.screenshot({path:path.join(__dirname,'mobile-390x844.png'),fullPage:false});
 console.log('PASS: 390x844 asset review screenshot, all seven images decoded');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
