const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sharp=require(process.env.ISSUE133_SHARP||'sharp'),root=path.resolve(__dirname,'../..');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'))),prompts=JSON.parse(fs.readFileSync(path.join(__dirname,'prompts.json'))),live=JSON.parse(fs.readFileSync(path.join(root,'app/src/domain/furniture-sprites.json')));
 assert.equal(manifest.items.length,112,'All 112 sprites must be present');
 assert.equal(new Set(manifest.items.map(m=>m.id+'_'+m.direction)).size,112);
 let largest=0;
 for(const m of manifest.items){
  const key=m.id+'_'+m.direction,p=prompts.items.find(x=>x.key===key);assert(p);
  const b=fs.readFileSync(path.join(root,'app/public',m.file)),meta=await sharp(b).metadata();
  assert.equal(meta.format,'png',key);assert(meta.hasAlpha,key);assert.deepEqual([meta.width,meta.height],m.frame_px,key);assert(b.length<150000,key);
  assert.equal(crypto.createHash('sha256').update(b).digest('hex'),m.sha256,key);
  assert.deepEqual(m.anchor_px,[p.ax,p.ay],key);assert.deepEqual(m.footprint_tiles,[p.fw,p.fh],key);
  assert.equal(p.ax,p.fw*64,key+' floor anchor x');assert.equal(p.ay,p.h,key+' floor anchor y');assert.equal(p.w,(p.fw+p.fh)*64,key+' floor width');
  if(live[key]){const v=live[key];assert.deepEqual(m.frame_px,[v.w,v.h],key);assert.deepEqual(m.anchor_px,[v.ax,v.ay],key);assert.deepEqual(m.footprint_tiles,[v.fw,v.fh],key);}
  const {data,info}=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});let visible=0,transparent=0;
  for(let i=3;i<data.length;i+=4){if(data[i]>=128)visible++;if(data[i]===0)transparent++;}
  assert(visible>16&&transparent>info.width*info.height*.05,key+' alpha empty/opaque');
  // Bottom row remains transparent: antialiasing must not be cut at canvas edge.
  for(let x=0;x<info.width;x++)assert.equal(data[((info.height-1)*info.width+x)*4+3],0,key+' clipped bottom');
  largest=Math.max(largest,b.length);
 }
 console.log(JSON.stringify({result:'PASS',sprites:112,models:28,directions:4,maxBytes:largest,checks:['PNG dimensions','unchanged anchor and footprint metadata','RGBA transparency','nonempty subject','bottom alpha padding','SHA-256','under 150000 bytes']},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
