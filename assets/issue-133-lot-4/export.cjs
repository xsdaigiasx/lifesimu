// Raster finishing for product cards only: alpha crop, uniform resize and WebP encoding.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require(process.env.ISSUE133_SHARP||'sharp');
const root=path.resolve(__dirname,'../..'),spec=JSON.parse(fs.readFileSync(path.join(__dirname,'prompts.json'))),sources=JSON.parse(fs.readFileSync(path.join(__dirname,'sources.local.json')));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function bounds(data,w,h){let l=w,t=h,r=-1,b=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}if(r<l)throw Error('Empty image');return [l,t,r+1,b+1]}
const label=(x,y,s,size=15)=>`<text x="${x}" y="${y}" font-family="Arial" font-size="${size}" fill="#364535">${s}</text>`;
(async()=>{
 const items=[];
 for(const j of spec.items){
  if(!sources[j.id])throw Error('Missing source '+j.id);
  const original=fs.readFileSync(sources[j.id]),raw=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const [l,t,r,b]=bounds(raw.data,raw.info.width,raw.info.height),left=Math.max(0,l-2),top=Math.max(0,t-2),right=Math.min(raw.info.width,r+2),bottom=Math.min(raw.info.height,b+2);
  const cropped=await sharp(original).extract({left,top,width:right-left,height:bottom-top}).resize(220,220,{fit:'inside',kernel:'lanczos3'}).toBuffer(),z=await sharp(cropped).metadata();
  const image=sharp({create:{width:256,height:256,channels:4,background:'#00000000'}}).composite([{input:cropped,left:Math.floor((256-z.width)/2),top:Math.floor((256-z.height)/2)}]);
  let buffer=await image.clone().webp({lossless:true,effort:6,alphaQuality:100}).toBuffer(),encoding='lossless',quality=null;
  if(buffer.length>=40000){for(const q of [95,92,90,88,85,82]){buffer=await image.clone().webp({quality:q,alphaQuality:100,effort:6}).toBuffer();encoding='lossy';quality=q;if(buffer.length<40000)break}}
  if(buffer.length>=40000)throw Error(j.id+' exceeds 40000 bytes');
  const dest=path.join(root,'app/public',j.file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,buffer);
  const decoded=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true}),bbox=bounds(decoded.data,256,256);
  items.push({id:j.id,name:j.name,file:j.file,frame_px:[256,256],anchor_px:[128,128],footprint_tiles:null,direction:j.direction,alpha_bbox_px:bbox,bytes:buffer.length,encoding,quality,alpha_quality:100,sha256:hash(buffer),source_sha256:hash(original),source_crop_px:[left,top,right,bottom]});
 }
 const W=960,H=1080,layers=[];let text='';
 for(let i=0;i<items.length;i++){
  const j=items[i],x=i%3*320,y=Math.floor(i/3)*360,file=path.join(root,'app/public',j.file);
  layers.push({input:file,left:x+32,top:y+30});
  const small=await sharp(file).resize(64,64).toBuffer();
  layers.push({input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="8" fill="#34443c"/></svg>`),left:x+232,top:y+278});
  layers.push({input:small,left:x+240,top:y+286});
  text+=label(x+12,y+22,j.id)+label(x+12,y+317,j.name,14)+label(x+12,y+339,j.bytes+' B / '+j.encoding+(j.quality?' '+j.quality:''),12);
 }
 layers.push({input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${text}</svg>`),left:0,top:0});
 await sharp({create:{width:W,height:H,channels:4,background:'#f4f0e5'}}).composite(layers).webp({quality:92}).toFile(path.join(__dirname,'contact-sheet.webp'));
 const manifest={issue:133,lot:4,reference:spec.reference,reference_sha256:hash(fs.readFileSync(path.join(root,spec.reference))),asset_type:'meal-card',units:'pixels; no floor footprint or z coordinate',expected:9,exported:items.length,items};
 fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({exported:items.length,max_bytes:Math.max(...items.map(m=>m.bytes)),total_bytes:items.reduce((s,m)=>s+m.bytes,0)}));
})().catch(e=>{console.error(e);process.exitCode=1});

