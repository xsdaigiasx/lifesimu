const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sharp=require(process.env.ISSUE133_SHARP||'sharp');
const root=path.resolve(__dirname,'../..'),expected=['bicycle','motorbike','scooter','headphones','tv','casual','officeWear','coat','backpack'];
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json')));assert.equal(manifest.items.length,9);assert.deepEqual(manifest.items.map(m=>m.id).sort(),expected.slice().sort());
 for(const m of manifest.items){
  const b=fs.readFileSync(path.join(root,'app/public',m.file)),meta=await sharp(b).metadata();
  assert.equal(meta.format,'webp',m.id);assert.deepEqual([meta.width,meta.height],[256,256],m.id);assert(meta.hasAlpha,m.id);assert(b.length<40000,m.id+' size');assert.equal(b.length,m.bytes,m.id);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),m.sha256,m.id);
  const {data,info}=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});let l=256,t=256,r=-1,bt=-1,clear=0,opaque=0;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){const a=data[(y*256+x)*4+3];if(a===0)clear++;if(a>=128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);bt=Math.max(bt,y);opaque++}if(x<16||x>=240||y<16||y>=240)assert.equal(a,0,m.id+' alpha margin');}
  assert(opaque>100&&clear>info.width*info.height*.1,m.id+' nonempty transparency');assert(l>=18&&t>=18&&r<238&&bt<238,m.id+' visible bounds');assert(Math.abs((l+r+1)/2-128)<=2&&Math.abs((t+bt+1)/2-128)<=2,m.id+' centered');assert.deepEqual([l,t,r+1,bt+1],m.alpha_bbox_px,m.id);
 }
 console.log(JSON.stringify({result:'PASS',sprites:9,frame:'256x256',max_bytes:Math.max(...manifest.items.map(m=>m.bytes)),checks:['WebP','decoded alpha','transparent margins','centered silhouette','SHA-256','under 40000 bytes']}));
})().catch(e=>{console.error(e);process.exitCode=1});
