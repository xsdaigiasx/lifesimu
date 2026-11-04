const fs=require('fs'),path=require('path'),crypto=require('crypto'),sharp=require('sharp');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'app/public/assets/city/terrain');
const dirs=['xm','xp','ym','yp'],C={grass:[156,194,138],earth:[205,171,132],sand:[239,218,173],paving:[227,218,199],plaza:[220,219,209],road:[132,145,150],curb:[191,184,163],water:[135,187,196],foam:[214,235,223]};
const defs=[['grass-1','grass'],['grass-2','grass'],['grass-3','grass'],['grass-flowers','grass'],['earth','earth'],['sand','sand'],['sidewalk','paving'],['plaza','plaza']].map(([id,kind])=>({id,kind}));
const roads=[['road-x',['xm','xp']],['road-y',['ym','yp']],['road-corner-xm-ym',['xm','ym']],['road-corner-xm-yp',['xm','yp']],['road-corner-xp-ym',['xp','ym']],['road-corner-xp-yp',['xp','yp']],...dirs.map(d=>['road-t-no-'+d,dirs.filter(x=>x!==d)]),['road-cross',dirs],['road-zebra-x',['xm','xp']],['road-zebra-y',['ym','yp']]];
for(const [id,connections]of roads)defs.push({id,kind:'road',connections});
defs.push({id:'water-center',kind:'water',shore:'center'});
for(const d of dirs)defs.push({id:'water-edge-'+d,kind:'water',shore:'edge',land_sides:[d]});
for(const a of ['xm','xp'])for(const b of ['ym','yp'])for(const type of ['convex','concave'])defs.push({id:'water-'+type+'-'+a+'-'+b,kind:'water',shore:type,land_sides:[a,b]});
const codes={grass:'G',earth:'E',sand:'S',paving:'P',plaza:'L',road:'A',curb:'C',water:'W',foam:'F'};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function road(d,u,v){return (u>=.2&&u<=.8&&v>=.2&&v<=.8)||(d.connections.includes('xm')&&u<.5&&v>=.2&&v<=.8)||(d.connections.includes('xp')&&u>.5&&v>=.2&&v<=.8)||(d.connections.includes('ym')&&v<.5&&u>=.2&&u<=.8)||(d.connections.includes('yp')&&v>.5&&u>=.2&&u<=.8)}
function coast(d,u,v){if(d.shore==='center')return 2;const a=d.land_sides.includes('xp')?1-u:u,b=d.land_sides.includes('yp')?1-v:v;
 if(d.shore==='edge')return d.land_sides[0][0]==='x'?a-.22:b-.22;
 if(d.shore==='convex')return a<.34&&b<.34?.12-Math.hypot(a-.34,b-.34):Math.min(a-.22,b-.22);
 return a>.1&&b>.1?Math.hypot(a-.1,b-.1)-.12:Math.max(a-.22,b-.22);
}
function surface(d,u,v){if(d.kind==='road'){if(road(d,u,v))return 'road';if(road(d,clamp(u-.014,0,1),v)||road(d,clamp(u+.014,0,1),v)||road(d,u,clamp(v-.014,0,1))||road(d,u,clamp(v+.014,0,1)))return 'curb';return 'paving'}
 if(d.kind==='water'){let z=coast(d,u,v);return z<-.055?'grass':z<0?'sand':z<.022?'foam':'water'}return d.kind}
function edge(d,side,t){const p=side==='xm'?[0,t]:side==='xp'?[1,t]:side==='ym'?[t,0]:[t,1];return surface(d,...p)}
async function texture(name){return sharp(path.join(__dirname,'materials',name+'.png')).removeAlpha().raw().toBuffer({resolveWithObject:true})}
async function pixels(d){const tex=await texture(d.kind==='grass'||d.kind==='water'?'grass':'stone'),out=Buffer.alloc(256*128*4);
 for(let y=0;y<128;y++)for(let x=0;x<256;x++){const u=(x+.5-128)/256+(y+.5)/128,v=-(x+.5-128)/256+(y+.5)/128;if(u<0||v<0||u>=1||v>=1)continue;const k=(y*256+x)*4,s=surface(d,u,v),base=C[s];let grain=0;
  const ti=((Math.floor(v*tex.info.height)%tex.info.height)*tex.info.width+Math.floor(u*tex.info.width)%tex.info.width)*tex.info.channels;
  grain=((tex.data[ti]+tex.data[ti+1]+tex.data[ti+2])/3-180)*.035;
  // A quiet common border for all variants; differences stay strictly inside.
  const fade=clamp(Math.min(u,v,1-u,1-v)/.10,0,1);grain*=fade;
  let rgb=base.map(c=>clamp(Math.round(c+grain),0,255));
  if((s==='paving'||s==='plaza')&&fade>.15){const scale=d.kind==='plaza'?4:6,gu=u*scale,gv=v*scale;
   if(Math.min(gu%1,gv%1)<.026)rgb=rgb.map(c=>c-13);
  }
  if(d.kind==='grass'&&fade>.95){const variant=d.id==='grass-2'?2:d.id==='grass-3'?3:1,ix=Math.floor(u*24),iy=Math.floor(v*24),r=(ix*17+iy*31+variant*43)%53;
   if(r<4&&u*24%1<.16&&v*24%1<.55)rgb=[132,166,115];
   if(d.id==='grass-flowers'&&(ix*11+iy*7)%29===0&&Math.hypot(u*24%1-.5,v*24%1-.5)<.30)rgb=(ix+iy)%2?[242,184,198]:[244,213,141];
  }
  if(d.kind==='road'&&s==='road'){
   let white=false;
   if(d.id==='road-x'||d.id==='road-zebra-x')white=Math.abs(v-.5)<.008&&(u% .5>.14&&u% .5<.32);
   if(d.id==='road-y'||d.id==='road-zebra-y')white=Math.abs(u-.5)<.008&&(v% .5>.14&&v% .5<.32);
   if(d.id==='road-zebra-x')white=white||(u>.38&&u<.62&&v>.24&&v<.76&&((v-.24)/.085)%1<.52);
   if(d.id==='road-zebra-y')white=white||(v>.38&&v<.62&&u>.24&&u<.76&&((u-.24)/.085)%1<.52);
   if(white)rgb=[246,236,211];
  }
  if(s==='water'&&fade>.95&&((u*17+v*5)%1<.025)&&((v*19)%1<.14))rgb=[173,211,210];
  for(let c=0;c<3;c++)out[k+c]=rgb[c];out[k+3]=255;
 }
 return out;
}
function P(x,y,ox,oy){return [ox+(x-y)*128,oy+(x+y)*64]}
async function mosaic(layout,file,width=1536){const rows=layout.length,cols=layout[0].length,w=(rows+cols)*128,h=(rows+cols)*64,layers=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){let p=P(x,y,rows*128,0);layers.push({input:fs.readFileSync(path.join(dir,layout[y][x]+'.webp')),left:p[0]-128,top:p[1]})}
 return sharp({create:{width:w,height:h,channels:4,background:'#fbf3e2'}}).composite(layers).resize({width,withoutEnlargement:true}).webp({quality:91}).toFile(file)}
async function main(){fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(path.join(__dirname,'previews'),{recursive:true});let items=[];
 for(const d of defs){const raw=await pixels(d),out=await sharp(raw,{raw:{width:256,height:128,channels:4}}).webp({lossless:true,effort:6}).toBuffer();fs.writeFileSync(path.join(dir,d.id+'.webp'),out);items.push({...d,file:'app/public/assets/city/terrain/'+d.id+'.webp',footprint_tiles:[1,1],frame_px:[256,128],anchor_px:[128,128],floor_origin_px:[128,0],tile_px:[256,128],bytes:out.length,sha256:hash(out),edge_profiles:Object.fromEntries(dirs.map(side=>[side,Array.from({length:100},(_,i)=>codes[edge(d,side,(i+.5)/100)]).join('')]))})}
 fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify({issue:97,lot:'A',projection:'orthographic-2:1',tile_px:[256,128],edge_profile_legend:codes,edge_sampling:'100 equal samples, t increases along the other world axis; match xp to xm and yp to ym without reversing t',alpha:'Hard pixel-center coverage of diamond; no antialias alpha overlap or transparent cracks at native integer placement',items},null,2)+'\n');
 const mix=Array.from({length:8},(_,y)=>Array.from({length:8},(_,x)=>x===3||x===4?'road-y':y===3||y===4?'road-x':((x+y)%3===0?'grass-flowers':'grass-'+(1+(x+y)%3))));
 // One-tile roads, coherent turns/T/cross instead of an oversized intersection.
 const street=Array.from({length:8},()=>Array(8).fill('grass-1'));for(let i=0;i<8;i++){street[3][i]='road-x';street[i][3]='road-y'}street[3][3]='road-cross';street[3][5]='road-zebra-x';street[5][3]='road-zebra-y';
 await mosaic(street,path.join(__dirname,'previews/streets.webp'));
 const lake=Array.from({length:6},(_,y)=>Array.from({length:6},(_,x)=>x===0||x===5||y===0||y===5?'grass-1':'water-center'));
 for(let i=2;i<4;i++){lake[1][i]='water-edge-ym';lake[4][i]='water-edge-yp';lake[i][1]='water-edge-xm';lake[i][4]='water-edge-xp'}
 lake[1][1]='water-convex-xm-ym';lake[1][4]='water-convex-xp-ym';lake[4][1]='water-convex-xm-yp';lake[4][4]='water-convex-xp-yp';
 await mosaic(lake,path.join(__dirname,'previews/lake.webp'));
 // Contact sheet on exact diamond floor positions; labels are preview-only.
 const cellW=320,cellH=205,cols=5,rows=Math.ceil(items.length/cols),layers=[];for(let i=0;i<items.length;i++){let x=(i%cols)*cellW+32,y=Math.floor(i/cols)*cellH+10;layers.push({input:fs.readFileSync(path.join(root,items[i].file)),left:x,top:y});let label=`<svg width="320" height="45"><text x="160" y="25" text-anchor="middle" font-family="DejaVu Sans" font-size="15" fill="#4a3b33">${items[i].id}</text></svg>`;layers.push({input:Buffer.from(label),left:x-32,top:y+132})}
 await sharp({create:{width:cellW*cols,height:cellH*rows,channels:4,background:'#fbf3e2'}}).composite(layers).webp({quality:90}).toFile(path.join(__dirname,'previews/lot-a.webp'));
 await sharp(path.join(__dirname,'previews/streets.webp')).resize(380).webp({quality:90}).toFile(path.join(__dirname,'previews/mobile-380.webp'));
 console.log(JSON.stringify({tiles:items.length,bytes:items.reduce((s,i)=>s+i.bytes,0),largest:Math.max(...items.map(i=>i.bytes))}));
}
module.exports={defs,dirs,surface,edge,pixels,mosaic,P,root,dir};if(require.main===module)main().catch(e=>{console.error(e);process.exit(1)});
