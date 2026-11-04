// Raster finishing only: alpha bounds, uniform downscale, anchor alignment, PNG compression.
// Does not paint, synthesize directions, mirror sprites, or change game code.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require(process.env.ISSUE133_SHARP||'sharp');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),spec=JSON.parse(fs.readFileSync(path.join(__dirname,'prompts.json')));
const prior=JSON.parse(fs.readFileSync(path.join(root,'assets/storybook-lot5/manifest.json'))).items;
const sources=JSON.parse(fs.readFileSync(path.join(__dirname,'sources.local.json')));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const svg=(w,h,body)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`);
const text=(x,y,s,size=14)=>`<text x="${x}" y="${y}" font-family="Arial" font-size="${size}" fill="#3f493b">${s}</text>`;
async function finish(m){
 const source=fs.readFileSync(sources[m.key]);
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let l=info.width,t=info.height,r=-1,b=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
 if(r<l)throw Error('Empty alpha '+m.key);
 const xs=[];for(let y=Math.max(t,b-2);y<=b;y++)for(let x=l;x<=r;x++)if(data[(y*info.width+x)*4+3]>=128)xs.push(x);
 xs.sort((a,b)=>a-b);const sx=xs[Math.floor(xs.length/2)];
 // Two source pixels preserve antialiasing around the visible subject.
 const left=Math.max(0,l-2),top=Math.max(0,t-2),right=Math.min(info.width,r+3),bottom=Math.min(info.height,b+3);
 const old=prior.find(a=>a.id+'-'+a.model===m.id&&a.direction===m.direction)||prior.find(a=>a.id+'-'+a.model===m.id&&a.direction===(m.direction==='c'?'a':'b'));
 const boundsReference=['table-basic','table-comfort'].includes(m.id)?prior.find(a=>a.id+'-'+a.model===m.id&&a.direction==='a'):old;
 let box=boundsReference?.alpha_bbox_px||[12,m.id==='fridge-basic'?108:20,m.w-12,m.h-16];
 if(m.id==='plant-comfort')box=[16,56,112,165];
 if(m.id==='plant-premium')box=[24,12,104,165];
 let gx=(box[0]+box[2])/2,gy=box[3]-1;
 if(old&&!m.id.startsWith('door-')&&!m.id.startsWith('painting-')){
  const original=execFileSync('git',['show','5649d3d:app/public'+boundsReference.file],{cwd:root,maxBuffer:3000000});
  const raw=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});let low=-1,xx=[];
  for(let yy=0;yy<raw.info.height;yy++)for(let x=0;x<raw.info.width;x++)if(raw.data[(yy*raw.info.width+x)*4+3]>=128)low=Math.max(low,yy);
  for(let yy=Math.max(0,low-2);yy<=low;yy++)for(let x=0;x<raw.info.width;x++)if(raw.data[(yy*raw.info.width+x)*4+3]>=128)xx.push(x);
  xx.sort((a,b)=>a-b);gx=xx[Math.floor(xx.length/2)];gy=low;
 }
 // Fit the same occupied horizontal extent, not whichever foot happens to be lowest.
 // A different foreground foot after rotation must not shrink a whole wardrobe.
 const fixedHeight=m.id.startsWith('lamp-')?({basic:85,comfort:107,premium:125})[m.id.split('-')[1]]:m.id.startsWith('plant-')?({basic:62,comfort:109,premium:153})[m.id.split('-')[1]]:null;
 const scale=fixedHeight?Math.min(fixedHeight/(bottom-top),(m.w-4)/(right-left)):Math.min((box[2]-box[0])/(right-left),(gy-2)/(bottom-top));
 const width=Math.max(1,Math.floor((right-left)*scale)),height=Math.max(1,Math.floor((bottom-top)*scale));
 const x=Math.max(0,Math.min(m.w-width,Math.round((box[0]+box[2]-width)/2))),y=Math.round(gy-height);
 const resized=await sharp(source).extract({left,top,width:right-left,height:bottom-top}).resize(width,height,{kernel:'lanczos3'}).toBuffer();
 const out=await sharp({create:{width:m.w,height:m.h,channels:4,background:'#00000000'}}).composite([{input:resized,left:x,top:y}]).png({compressionLevel:9,adaptiveFiltering:true}).toBuffer();
 if(out.length>=150000)throw Error('PNG exceeds size limit '+m.key);
 const dest=path.join(root,'app/public',m.f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,out);
 const meta=await sharp(out).metadata();if(meta.width!==m.w||meta.height!==m.h||!meta.hasAlpha)throw Error('Invalid output '+m.key);
 return {id:m.id,direction:m.direction,rotation_deg:'abcd'.indexOf(m.direction)*90,file:m.f,frame_px:[m.w,m.h],anchor_px:[m.ax,m.ay],footprint_tiles:[m.fw,m.fh],height_px:m.h-(m.fw+m.fh)*32,height_z:(m.h-(m.fw+m.fh)*32)/32,bytes:out.length,sha256:hash(out),source_sha256:hash(source),source_crop_px:[left,top,right,bottom],source_bottom_anchor_px:[sx,b],calibration_ref:'5649d3d',prior_alpha_bbox_px:old?.alpha_bbox_px??null,calibration_bbox_px:box,prior_ground_contact_px:[gx,gy],export_scale:scale,export_offset_px:[x,y]};
}
async function sheet(items){
 const cw=240,ch=300,W=8*cw,H=Math.ceil(spec.items.length/8)*ch,composite=[];let labels='';
 for(let i=0;i<spec.items.length;i++){
 const m=spec.items[i],x=i%8*cw,y=Math.floor(i/8)*ch;
 labels+=text(x+10,y+24,m.key)+text(x+10,y+45,items.find(a=>a.id===m.id&&a.direction===m.direction)?.bytes+' B',12);
 if(!sources[m.key])continue;
 const img=await sharp(path.join(root,'app/public',m.f)).resize(220,240,{fit:'inside'}).toBuffer();const z=await sharp(img).metadata();
 composite.push({input:img,left:x+Math.floor((cw-z.width)/2),top:y+55+240-z.height});
 }
 composite.push({input:svg(W,H,labels),left:0,top:0});
 await sharp({create:{width:W,height:H,channels:4,background:'#f4f0e5'}}).composite(composite).webp({quality:90}).toFile(path.join(__dirname,'contact-sheet.webp'));
 for(let y=0,page=1;y<H;y+=1200,page++)await sharp(path.join(__dirname,'contact-sheet.webp')).extract({left:0,top:y,width:W,height:Math.min(1200,H-y)}).webp({quality:92}).toFile(path.join(__dirname,'directions-'+page+'.webp'));
}
async function room(){
 const W=1448,H=1086;let lines='';const P=(x,y)=>[724+64*(x-y),350+32*(x+y)];
 for(let i=0;i<=8;i++){for(const pts of [[P(i,0),P(i,8)],[P(0,i),P(8,i)]])lines+=`<path d="M${pts[0]}L${pts[1]}" stroke="#4d786c" stroke-width="1" opacity=".35"/>`;}
 const places=[['rug-comfort_a',3,4],['bed-basic_a',0,3],['wardrobe-comfort_a',2,1],['desk-comfort_a',5,4],['plant-comfort_a',6,6]];
 const layers=[{input:svg(W,H,lines),left:0,top:0}];
 for(const [key,x,y]of places){if(!sources[key])continue;const m=spec.items.find(a=>a.key===key),[px,py]=P(x+m.fw,y+m.fh);layers.push({input:path.join(root,'app/public',m.f),left:px-m.ax,top:py-m.ay});}
 if(sources['lamp-comfort_a'])layers.push({input:path.join(root,'app/public/assets/furniture/lamp-comfort_a.png'),left:745,top:463});
 await sharp({create:{width:W,height:H,channels:4,background:'#f4f0e5'}}).composite([{input:path.join(root,'app/public/assets/room-master-storybook.webp'),left:0,top:0},...layers]).webp({quality:90}).toFile(path.join(__dirname,'room-grid-preview.webp'));
 await sharp(path.join(__dirname,'room-grid-preview.webp')).resize(380).webp({quality:90}).toFile(path.join(__dirname,'mobile-380.webp'));
}
async function modelSheet(){
 const models=spec.items.filter(m=>m.direction==='a'),W=1680,H=1200,layers=[];let labels='';
 for(let i=0;i<models.length;i++){
  const m=models[i],x=i%7*240,y=Math.floor(i/7)*300;if(!sources[m.key])continue;
  const b=await sharp(path.join(root,'app/public',m.f)).resize(220,250,{fit:'inside'}).toBuffer(),z=await sharp(b).metadata();
  layers.push({input:b,left:x+Math.floor((240-z.width)/2),top:y+40+250-z.height});labels+=text(x+10,y+25,m.id);
 }
 layers.push({input:svg(W,H,labels),left:0,top:0});
 await sharp({create:{width:W,height:H,channels:4,background:'#f4f0e5'}}).composite(layers).webp({quality:90}).toFile(path.join(__dirname,'models-a.webp'));
}
(async()=>{const items=[];for(const m of spec.items)if(sources[m.key])items.push(await finish(m));
 fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify({issue:133,lot:1,reference:spec.reference,reference_sha256:hash(fs.readFileSync(path.join(root,spec.reference))),projection:'orthographic 2:1; tile 128x64; z unit 32px',expected:112,exported:items.length,items},null,2)+'\n');
 await sheet(items);await modelSheet();await room();console.log(JSON.stringify({exported:items.length,expected:112,maxBytes:Math.max(...items.map(a=>a.bytes))}));
})().catch(e=>{console.error(e);process.exitCode=1});
