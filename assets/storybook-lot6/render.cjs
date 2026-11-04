// Extends the exact SVG room artwork and storybook lot 4 materials; no AI image edits.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),sharp=require('sharp');
const root=path.resolve(__dirname,'../..'),ink='#4a3b33';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const variants=[
 {id:'rental-storybook',file:'app/public/assets/static-scenes/rental-storybook.webp',frame:[1536,1536],origin:[768,464.64],axes:[81.6,55.2],wall:250,projection:'legacy normalized floor registration'},
 {id:'room-master-storybook',file:'app/public/assets/room-master-storybook.webp',frame:[1448,1086],origin:[724,350],axes:[64,32],wall:200,projection:'orthographic-2:1'}
];
function scene(v,debug=false,mask=false){
 const [W,H]=v.frame,[ox,oy]=v.origin,[sx,sy]=v.axes,P=(x,y,z=0)=>[ox+(x-y)*sx,oy+(x+y)*sy-z],num=n=>+n.toFixed(4);
 const points=a=>a.map(p=>P(...p).map(num).join(',')).join(' ');
 const poly=(a,c,sw=1.5,extra='')=>`<polygon points="${points(a)}" fill="${c}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round" ${extra}/>`;
 const line=(a,c=ink,sw=1.5)=>`<polyline points="${points(a)}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
 const box=(x,y,w,d,z,h,top='#fbf3e2',left='#e9d8bd',right='#d9c7ac')=>poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],right)+poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],left)+poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],top);
 let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>`;
 for(const id of ['wood','stone','bath'])s+=`<pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse"><image href="data:image/png;base64,${fs.readFileSync(path.join(__dirname,'materials',id+'.png')).toString('base64')}" width="4" height="4"/></pattern>`;
 s+='</defs>';
 const fpoly=(x,y,w,h,c,t)=>`<g transform="matrix(${sx} ${sy} ${-sx} ${sy} ${ox} ${oy})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${t})" opacity=".22"/></g>`;
 if(!mask){
  s+=poly([[0,8,0],[8,8,0],[8,8,-14],[0,8,-14]],'#d9c4a7')+poly([[8,0,0],[8,8,0],[8,8,-14],[8,0,-14]],'#cdb79b');
  s+=fpoly(0,0,8,8,'#e6c39b','wood')+fpoly(0,0,5,1,'#eee6d5','stone')+fpoly(5,0,3,3,'#d2e5e7','bath');
  // Planks, subtle and in the same coordinate system as lot 4.
  for(let y=1;y<16;y++)s+=line([[0,y/2],[8,y/2]],'#c8ab88',.85);
  for(let y=0;y<16;y++)for(let x=(y%2?1:2);x<8;x+=2)s+=line([[x,y/2],[x,(y+1)/2]],'#c8ab88',.75);
  s+=fpoly(5,0,3,3,'#d2e5e7','bath');for(let i=0;i<=3;i++)s+=line([[5+i,0],[5+i,3]],'#9fbeba',1)+line([[5,i],[8,i]],'#9fbeba',1);
  s+=box(-.10,0,.10,8,0,v.wall,'#f6e7cf','#e9d8bd','#e9d8bd')+box(0,-.10,8,.10,0,v.wall,'#fcf2df','#f1e4cf','#d9c7ac');
  s+=line([[0,8,7],[0,0,7],[8,0,7]],'#d9a066',5);
  // Window on the left wall; all vertices remain in its vertical plane.
  s+=poly([[0,2.05,80],[0,5.35,80],[0,5.35,v.wall-30],[0,2.05,v.wall-30]],'#d9a066',2);
  s+=poly([[.015,2.2,89],[.015,5.2,89],[.015,5.2,v.wall-40],[.015,2.2,v.wall-40]],'#c6dedf',1);
  s+=line([[.02,3.7,89],[.02,3.7,v.wall-40]],'#ba8b5d',4);
  s+=line([[.03,2.2,137],[.03,5.2,137]],'#ba8b5d',3);
  for(const [y,w] of [[1.98,.45],[4.95,.48]]){s+=poly([[.06,y,72],[.06,y+w,72],[.06,y+w,v.wall-22],[.06,y,v.wall-22]],'#9cc28a');for(let i=1;i<4;i++)s+=line([[.07,y+w*i/4,75],[.07,y+w*i/4,v.wall-24]],'#82a475',1)}
  s+=line([[.08,1.86,v.wall-17],[.08,5.52,v.wall-17]],'#a5805d',4);
  // Fixed kitchen is entirely inside [0,5] x [0,1]; no loose furnishings.
  s+=box(.04,.04,4.90,.90,0,69,'#f4d58d','#d9a066','#cb9763');
  for(let x=1;x<5;x++){s+=line([[x,.955,5],[x,.955,66]],'#ac7f58',1.2);s+=line([[x-.18,.962,48],[x-.18,.962,57]],ink,2)}
  s+=box(.03,.03,4.92,.94,69,7,'#fbf3e2','#eee1c6','#dfcfb7');
  s+=poly([[.4,.22,77],[1.42,.22,77],[1.42,.77,77],[.4,.77,77]],'#7fb8b0');
  s+=line([[.9,.12,77],[.9,.12,103],[.9,.38,103],[.9,.38,91]],'#7b8984',4);
  s+=poly([[3,.2,77],[4.45,.2,77],[4.45,.8,77],[3,.8,77]],'#7c8078');
  for(const x of [3.4,4.05]){const a=[];for(let i=0;i<=24;i++){const t=i*Math.PI/12;a.push([x+.18*Math.cos(t),.5+.18*Math.sin(t),78])}s+=poly(a,'#d8dfd3',1)}
  // Cabinet doors against back wall, two warm tones; no labels or knobs with brands.
  s+=box(.1,.02,4.8,.34,v.wall-72,66,'#f4d58d','#d9a066','#c39465');
  for(let x=1.3;x<4.8;x+=1.2)s+=line([[x,.365,v.wall-70],[x,.365,v.wall-9]],'#ac7f58',1.2);
 }
 // Bath: low cutaway partitions keep the exact 3x3 floor legible.
 // Opening on y=3 from x=6 to 7 is one tile wide; no threshold obstruction.
 let bath=box(4.96,0,.08,3,0,53,'#fbf3e2','#e7d9c2','#dfcfb7')+box(5,2.96,1,.08,0,45)+box(7,2.96,1,.08,0,45);
 if(mask){s+=bath;return s+'</svg>'}
 // Simple fixed toilet, basin and shower. These are not placeable furniture.
 s+=box(5.35,.18,.65,.30,0,42,'#fbf3e2','#e5e8dc','#d2dcd6')+box(5.4,.45,.55,.85,0,18,'#fbf3e2','#e5e8dc','#d2dcd6');
 const oval=(x,y,z,rx,ry,c)=>{let a=[];for(let i=0;i<=32;i++){let t=i*Math.PI/16;a.push([x+rx*Math.cos(t),y+ry*Math.sin(t),z])}return poly(a,c,1)};
 s+=oval(5.675,.88,21,.27,.39,'#fbf3e2')+oval(5.675,.88,22,.16,.25,'#cfddd8');
 s+=box(6.45,.05,.8,.53,39,9,'#fbf3e2','#e5e8dc','#d2dcd6')+oval(6.85,.31,49,.28,.18,'#7fb8b0');
 s+=line([[6.85,.10,49],[6.85,.10,70],[6.85,.3,70]],'#7b8984',3);
 s+=line([[7.65,.05,30],[7.65,.05,123],[7.65,.4,123]],'#7b8984',3)+oval(7.65,.4,121,.15,.12,'#7fb8b0');
 s+=poly([[7.15,.7,1],[7.95,.7,1],[7.95,2,1],[7.15,2,1]],'#bbd8d3',1);
 s+=bath;
 if(debug){
  for(let i=0;i<=8;i++)s+=line([[i,0],[i,8]],'#306c91',1.8)+line([[0,i],[8,i]],'#306c91',1.8);
  const safe=(x,y)=>[.4+.9*x,.4+.9*y];
  for(let i=0;i<=8;i++)s+=line([safe(i,0),safe(i,8)],'#bc603e',1.2)+line([safe(0,i),safe(8,i)],'#bc603e',1.2);
  for(const [x,y,label] of [[0,0,'0,0'],[8,0,'8,0'],[8,8,'8,8'],[0,8,'0,8'],[2.5,.5,'Bếp 5×1'],[6.5,1.9,'Tắm 3×3']]){let p=P(x,y);s+=`<text x="${p[0]}" y="${p[1]-12}" font-family="DejaVu Sans" font-size="23" text-anchor="middle" fill="#284f61" stroke="#fff8eb" stroke-width="5" paint-order="stroke">${label}</text>`}
 }
 return s+'</svg>';
}
async function main(){
 const items=[];fs.mkdirSync(path.join(__dirname,'previews'),{recursive:true});
 for(const v of variants){let svg=scene(v),out=await sharp(Buffer.from(svg)).webp({quality:86,alphaQuality:100,effort:6}).toBuffer();if(out.length>=150000)throw Error('Asset exceeds 150 KB');fs.mkdirSync(path.dirname(path.join(root,v.file)),{recursive:true});fs.writeFileSync(path.join(root,v.file),out);
  const P=(x,y)=>[v.origin[0]+(x-y)*v.axes[0],v.origin[1]+(x+y)*v.axes[1]];
  items.push({...v,bytes:out.length,sha256:hash(out),compression:'WebP q86 alpha100 RGBA',floor_tiles:[8,8],floor_corners:[[0,0],[8,0],[8,8],[0,8]].map(world=>({world,pixel:P(...world)})),anchor_px:P(8,8),bath:{x:5,y:0,w:3,h:3},kitchen:{x:0,y:0,w:5,h:1},bath_opening:{axis:'y',at:3,from:6,to:7},safe_grid:{origin:P(.4,.4),axes:v.axes.map(n=>n*.9),margin_tiles:.4}});
  await sharp(Buffer.from(scene(v,true))).resize(768).webp({quality:88}).toFile(path.join(__dirname,'previews',v.id+'-grid.webp'));
  if(v.id==='rental-storybook'){let file='app/public/assets/static-scenes/rental-storybook-bath-mask.webp';let b=await sharp(Buffer.from(scene(v,false,true))).webp({lossless:true,effort:6}).toBuffer();fs.writeFileSync(path.join(root,file),b);items.push({id:'bath-mask',file,frame:v.frame,bytes:b.length,sha256:hash(b),compression:'WebP lossless RGBA',usage:'Partition-only occlusion overlay; replace old fixed CSS clip, not the full scene.'});}
 }
 const prompts=JSON.parse(fs.readFileSync(path.join(__dirname,'prompts.json')));
 fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify({issue:89,lot:6,source_commit:'c7d825263e489949f4210d7de55c9eba814b73f7',method:'Extended existing repo-native SVG room geometry; inherited lot4 AI material swatches, no new imagegen or external images',registration:'Runtime variant preserves normalized HOME_OUTER_FLOOR corners. Original rental-diamond PNG pixel dimensions could not be decoded through connector; new square frame is 1536x1536. room-master source is 1448x1086 and furnished with a different polygon; supplied canonical sibling preserves its frame, not that polygon.',items},null,2)+'\n');
 const bg=await sharp({create:{width:1536,height:1600,channels:4,background:'#fbf3e2'}}).png().toBuffer();
 const a=await sharp(path.join(root,variants[0].file)).resize(760).png().toBuffer(),b=await sharp(path.join(root,variants[1].file)).resize(760).png().toBuffer();
 const grid=await sharp(path.join(__dirname,'previews/rental-storybook-grid.webp')).resize(760).png().toBuffer();
 await sharp(bg).composite([{input:a,left:4,top:10},{input:b,left:770,top:100},{input:grid,left:4,top:795}]).resize(1200).webp({quality:90}).toFile(path.join(__dirname,'previews/lot-6.webp'));
 await sharp({create:{width:380,height:820,channels:4,background:'#fbf3e2'}}).composite([{input:await sharp(a).resize(380).toBuffer(),left:0,top:0},{input:await sharp(grid).resize(380).toBuffer(),left:0,top:410}]).webp({quality:90}).toFile(path.join(__dirname,'previews/mobile-380.webp'));
 console.log(items.map(x=>({id:x.id,bytes:x.bytes})));
}
module.exports={variants,scene};if(require.main===module)main().catch(e=>{console.error(e);process.exit(1)});
