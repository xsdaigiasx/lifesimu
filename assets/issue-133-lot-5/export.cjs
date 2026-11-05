// Finishing only: canvas registration, original silhouette/character protection, compression.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process'),sharp=require('sharp');
const root=path.resolve(__dirname,'../..'),spec=JSON.parse(fs.readFileSync(path.join(__dirname,'prompts.json'))),baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'baseline.json'))),sources=JSON.parse(fs.readFileSync(path.join(__dirname,'sources.local.json')));
const BASE='d25988610bf0fa6ee3ffdcf514aee242c81c6622',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const original=f=>execFileSync('git',['show',BASE+':app/public/'+f],{cwd:root,maxBuffer:20000000});
const svg=(w,h,s)=>Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'">'+s+'</svg>');
const txt=(x,y,s,z=15)=>'<text x="'+x+'" y="'+y+'" font-family="Arial" font-size="'+z+'" fill="#364535">'+s+'</text>';
function bbox(d,w,h){let l=w,t=h,r=-1,b=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>=128){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y)}return [l,t,r+1,b+1]}
(async()=>{const items=[];
for(const j of spec.items){const old=baseline.find(m=>m.file===j.file),[w,h]=old.frame_px,src=fs.readFileSync(sources[j.id]),meta=await sharp(src).metadata();let img,registration;
if(j.transparent&&!j.id.startsWith('office-shell')){
 const before=await sharp(original(j.file)).ensureAlpha().raw().toBuffer(),raw=await sharp(src).ensureAlpha().raw().toBuffer(),a=bbox(before,w,h),b=bbox(raw,meta.width,meta.height);
 const resized=await sharp(src).extract({left:b[0],top:b[1],width:b[2]-b[0],height:b[3]-b[1]}).resize(a[2]-a[0],a[3]-a[1],{fit:'fill'}).toBuffer();
 const canvas=await sharp({create:{width:w,height:h,channels:4,background:'#00000000'}}).composite([{input:resized,left:a[0],top:a[1]}]).raw().toBuffer();
 // Keep original edge coverage exactly; protect silhouettes and all external margins.
 for(let k=0;k<w*h;k++){canvas[k*4+3]=before[k*4+3];if(!canvas[k*4+3]){canvas[k*4]=canvas[k*4+1]=canvas[k*4+2]=0}}
 img=sharp(canvas,{raw:{width:w,height:h,channels:4}});registration={method:'occupied-frame registration + original alpha',source_bbox:b,target_bbox:a,original_alpha_sha256:hash(await sharp(original(j.file)).extractChannel('alpha').raw().toBuffer())};
}else{img=sharp(src).resize(w,h,{fit:'fill'}).ensureAlpha();registration={method:'whole canvas resample',source_frame:[meta.width,meta.height]};
 if(j.id==='office'){
  // Original people are explicitly outside redraw scope. Restore their original pixels,
  // including nearby chair overlaps, with a soft border outside the protected rectangles.
  const generated=await img.raw().toBuffer(),before=await sharp(original(j.file)).ensureAlpha().raw().toBuffer();
  const protectedRegions=[[828,150,995,376],[1120,190,1300,455]];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let amount=0;for(const [l,t,r,b]of protectedRegions){const d=Math.max(l-x,0,x-r,t-y,0,y-b);amount=Math.max(amount,Math.max(0,1-d/12))}if(amount)for(let c=0;c<4;c++){const k=(y*w+x)*4+c;generated[k]=Math.round(before[k]*amount+generated[k]*(1-amount));}}
  img=sharp(generated,{raw:{width:w,height:h,channels:4}});registration.protected_original_character_rectangles=protectedRegions;
 }
}
let buffer,quality=92;const files=j.office_size?['assets/offices/'+j.office_size+'/background.webp','assets/offices/'+j.office_size+'/room-cleaned-v02.png']:[j.file];
for(const f of files){
 let encoding,colours=null;if(f.endsWith('.png')){for(quality of [50,40,30,20]){const small=await img.clone().resize(768,768).png({palette:true,quality,colours:256,dither:0}).toBuffer();buffer=await sharp(small).resize(w,h,{kernel:'nearest'}).png({compressionLevel:9,palette:true,quality:100,colours:256,dither:0}).toBuffer();if(buffer.length<150000)break}colours=buffer.readUInt32BE(buffer.indexOf(Buffer.from('PLTE'))-4)/3;encoding='indexed PNG; 768px sampling; nearest x2';}else{for(quality of [92,85,75,65,55,45,35]){buffer=await img.clone().webp({quality,alphaQuality:100,effort:5}).toBuffer();if(buffer.length<150000)break}encoding='WebP';}
 if(buffer.length>=150000)throw Error(f+' exceeds 150000 bytes');const dest=path.join(root,'app/public',f);fs.writeFileSync(dest,buffer);
 items.push({id:j.id,file:f,frame_px:[w,h],anchor_px:j.id==='rental'?[724,350]:null,footprint_tiles:j.id==='rental'?[8,8]:null,direction:'original camera',bytes:buffer.length,encoding,quality,colours,sha256:hash(buffer),source_sha256:hash(src),registration});console.log(f,buffer.length,quality,colours);
}
}
const floors=JSON.parse(fs.readFileSync(path.join(root,'app/src/domain/house-floors.json')));
for(const m of items)if(m.file.includes('/houses/')){const d=Object.values(floors).find(x=>x.f.slice(1)===m.file),g=JSON.parse(fs.readFileSync(path.join(root,'assets/storybook-lot4/manifest.json'))).items.find(x=>x.file.slice(1)===m.file);m.anchor_px=[d.ox,d.oy];m.footprint_tiles=g.floor_tiles;m.geometry=Object.fromEntries(['origin_px','axis_x_px','axis_y_px','floor_corners','rooms','stairs','doors','partition_runs','outer_wall_height_px','partition_height_px'].map(k=>[k,g[k]]));}
fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify({issue:133,lot:5,reference:spec.reference,baseline_commit:BASE,projection:'128x64 tile; 2:1; z=32px',items},null,2)+'\n');
const W=1500,H=Math.ceil(items.length/3)*400,layers=[];let labels='';
for(let i=0;i<items.length;i++){const m=items[i],x=i%3*500,y=Math.floor(i/3)*400,b=await sharp(path.join(root,'app/public',m.file)).resize(480,330,{fit:'inside'}).toBuffer(),z=await sharp(b).metadata();layers.push({input:b,left:x+Math.floor((500-z.width)/2),top:y+55});labels+=txt(x+8,y+22,m.file.replace('assets/',''),13)+txt(x+8,y+43,m.frame_px.join('x')+' / '+m.bytes+' B',12);}
layers.push({input:svg(W,H,labels),left:0,top:0});await sharp({create:{width:W,height:H,channels:4,background:'#f4f0e5'}}).composite(layers).webp({quality:92}).toFile(path.join(__dirname,'contact-sheet.webp'));
for(let y=0,p=1;y<H;y+=800,p++)await sharp(path.join(__dirname,'contact-sheet.webp')).extract({left:0,top:y,width:W,height:Math.min(800,H-y)}).webp({quality:92}).toFile(path.join(__dirname,'page-'+p+'.webp'));
const fw=1448,fh=1086,P=(x,y)=>[724+64*(x-y),350+32*(x+y)],furniture=JSON.parse(fs.readFileSync(path.join(root,'app/src/domain/furniture-sprites.json')));let grid='';for(let i=0;i<=8;i++)for(const [a,b]of [[P(i,0),P(i,8)],[P(0,i),P(8,i)]])grid+='<path d="M'+a+'L'+b+'" stroke="#4d786c" opacity=".35"/>';
const scene=[{input:path.join(root,'app/public/assets/room-master-storybook.webp'),left:0,top:0},{input:svg(fw,fh,grid),left:0,top:0}];
for(const [key,x,y]of [['rug-comfort_a',3,3],['bed-basic_a',0,3],['wardrobe-comfort_a',0,6],['desk-comfort_a',5,5],['plant-comfort_a',7,5]]){const m=furniture[key],[px,py]=P(x+m.fw,y+m.fh);scene.push({input:path.join(root,'app/public',m.f),left:px-m.ax,top:py-m.ay})}
const lamp=furniture['lamp-comfort_a'],lampPoint=P(5+2*.3+.5,5+2*.5+.5);scene.push({input:path.join(root,'app/public',lamp.f),left:Math.round(lampPoint[0]-lamp.ax),top:Math.round(lampPoint[1]-32*1.6-lamp.ay)});
await sharp({create:{width:fw,height:fh,channels:4,background:'#f4f0e5'}}).composite(scene).webp({quality:92}).toFile(path.join(__dirname,'room-grid-preview.webp'));
console.log(JSON.stringify({exported:items.length,max_bytes:Math.max(...items.map(m=>m.bytes)),total_bytes:items.reduce((s,m)=>s+m.bytes,0)}));
})().catch(e=>{console.error(e);process.exitCode=1});
