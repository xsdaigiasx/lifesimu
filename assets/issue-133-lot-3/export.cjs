// Office sprite raster finishing: preserve the legacy frame/anchor and occupied region.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require(process.env.ISSUE133_SHARP||'sharp');
const root=path.resolve(__dirname,'../..'),baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'baseline.json'))),spec=JSON.parse(fs.readFileSync(path.join(__dirname,'prompts.json'))),sources=JSON.parse(fs.readFileSync(path.join(__dirname,'sources.local.json')));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function bounds(data,w,h){let l=w,t=h,r=-1,b=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}if(r<l)throw Error('Empty alpha');return [l,t,r+1,b+1]}
const svg=(w,h,s)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${s}</svg>`);
(async()=>{const items=[];
for(const j of spec.items){const old=baseline.items.find(m=>m.id===j.id);if(!sources[j.id])throw Error('Missing source '+j.id);
const original=fs.readFileSync(sources[j.id]),raw=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true}),box=bounds(raw.data,raw.info.width,raw.info.height);
const left=Math.max(0,box[0]-2),top=Math.max(0,box[1]-2),right=Math.min(raw.info.width,box[2]+2),bottom=Math.min(raw.info.height,box[3]+2),target=old.alpha_bbox_px;
const scale=Math.min((target[2]-target[0])/(right-left),(target[3]-target[1])/(bottom-top)),w=Math.max(1,Math.floor((right-left)*scale)),h=Math.max(1,Math.floor((bottom-top)*scale));
const wall=j.id==='wall_art'||j.id.startsWith('certificate_'),x=Math.round((target[0]+target[2]-w)/2),y=wall?Math.round((target[1]+target[3]-h)/2):target[3]-h;
const cropped=await sharp(original).extract({left,top,width:right-left,height:bottom-top}).resize(w,h,{kernel:'lanczos3'}).toBuffer();
const image=sharp({create:{width:old.sprite_width,height:old.sprite_height,channels:4,background:'#00000000'}}).composite([{input:cropped,left:x,top:y}]);
let buffer=await image.clone().png({compressionLevel:9,adaptiveFiltering:true}).toBuffer(),encoding='rgba',colours=null;
if(buffer.length>=150000){for(const n of [256,128,64]){buffer=await image.clone().png({palette:true,colours:n,dither:.2,effort:10,compressionLevel:9}).toBuffer();encoding='indexed';colours=n;if(buffer.length<150000)break}}
if(buffer.length>=150000)throw Error(j.id+' exceeds 150000 bytes');
const file='/assets/offices/small/sprites/'+j.filename;fs.writeFileSync(path.join(root,'app/public',file),buffer);
const decoded=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
items.push({id:j.id,name:j.name,file,frame_px:[old.sprite_width,old.sprite_height],anchor_px:[old.anchor_point.x,old.anchor_point.y],footprint_tiles:null,height_z:null,direction:j.direction,alpha_bbox_px:bounds(decoded.data,old.sprite_width,old.sprite_height),baseline_bbox_px:target,source_crop_px:[left,top,right,bottom],export_offset_px:[x,y],export_scale:scale,bytes:buffer.length,encoding,palette_colours:colours,sha256:hash(buffer),source_sha256:hash(original)});
}
const W=1320,H=Math.ceil(items.length/6)*260,layers=[];let labels='';
for(let i=0;i<items.length;i++){const m=items[i],x=i%6*220,y=Math.floor(i/6)*260,img=await sharp(path.join(root,'app/public',m.file)).resize(200,200,{fit:'inside'}).toBuffer(),z=await sharp(img).metadata();layers.push({input:img,left:x+Math.floor((220-z.width)/2),top:y+40+200-z.height});labels+=`<text x="${x+6}" y="${y+19}" font-family="Arial" font-size="12" fill="#34432f">${m.id}</text><text x="${x+6}" y="${y+255}" font-family="Arial" font-size="11" fill="#34432f">${m.frame_px.join('x')} / ${m.bytes} B</text>`;}
layers.push({input:svg(W,H,labels),left:0,top:0});await sharp({create:{width:W,height:H,channels:4,background:'#f4f0e5'}}).composite(layers).webp({quality:92}).toFile(path.join(__dirname,'contact-sheet.webp'));
for(let y=0,page=1;y<H;y+=780,page++)await sharp(path.join(__dirname,'contact-sheet.webp')).extract({left:0,top:y,width:W,height:Math.min(780,H-y)}).webp({quality:94}).toFile(path.join(__dirname,'page-'+page+'.webp'));
const P=(x,y)=>[600+64*(x-y),180+32*(x+y)],gridLayers=[];let grid=`<path d="M${P(0,0)}L${P(8,0)}L${P(8,8)}L${P(0,8)}Z" fill="#e4d3b7"/>`;
for(let i=0;i<=8;i++)for(const [a,b]of [[P(i,0),P(i,8)],[P(0,i),P(8,i)]])grid+=`<path d="M${a}L${b}" stroke="#a8af95" stroke-width="1"/>`;
grid+='<text x="24" y="32" font-family="Arial" font-size="19" fill="#34432f">Kiểm tra neo trên lưới 128×64 — ảnh minh họa, không phải bố trí game</text>';
gridLayers.push({input:svg(1200,900,grid),left:0,top:0});const samples=[['executive_chair',2,2],['executive_desk',2,3],['low_storage_cabinet',5,1],['monstera_plant',1,6],['glass_conference_table',6,3],['workstation_pair',5,5]];let dots='';
for(const [id,x,y]of samples){const m=items.find(m=>m.id===id),[px,py]=P(x,y);gridLayers.push({input:path.join(root,'app/public',m.file),left:px-m.anchor_px[0],top:py-m.anchor_px[1]});dots+=`<circle cx="${px}" cy="${py}" r="3" fill="#ac6244"/>`;}
gridLayers.push({input:svg(1200,900,dots),left:0,top:0});await sharp({create:{width:1200,height:900,channels:4,background:'#f4f0e5'}}).composite(gridLayers).webp({quality:92}).toFile(path.join(__dirname,'anchor-preview.webp'));
fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify({issue:133,lot:3,reference:spec.reference,reference_sha256:hash(fs.readFileSync(path.join(root,spec.reference))),baseline_commit:baseline.base_commit,runtime_manifest:baseline.manifest,canonical_set:'small',copy_targets:['medium','large'],expected:38,exported:items.length,geometry:'legacy office pixel coordinates; floor footprint and z not provided by source manifest',items},null,2)+'\n');
console.log(JSON.stringify({exported:items.length,max_bytes:Math.max(...items.map(m=>m.bytes)),total_bytes:items.reduce((s,m)=>s+m.bytes,0)}));
})().catch(e=>{console.error(e);process.exitCode=1});
