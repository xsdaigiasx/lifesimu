const fs=require('fs'),path=require('path'),sharp=require('sharp');
const root=path.resolve(__dirname,'../..'),m=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'))),by=Object.fromEntries(m.items.map(i=>[i.id,i]));
async function main(){const tiles=path.join(root,'app/public/assets/city/terrain');if(!fs.existsSync(tiles))throw Error('Need issue #97 lot A terrain to compose the review corner');
 const n=20,ox=n*128,oy=700,W=n*256,H=n*128+oy,layers=[];
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){let id=x===9&&y===9?'road-cross':y===9?(x===5?'road-zebra-x':'road-x'):x===9?(y===5?'road-zebra-y':'road-y'):'grass-'+(1+(x*3+y)%3);if(x>9&&y>9&&x<19&&y<19)id='grass-flowers';layers.push({input:fs.readFileSync(path.join(tiles,id+'.webp')),left:ox+(x-y)*128-128,top:oy+(x+y)*64})}
 const plots=[{id:'home',x:1,y:2},{id:'bus',x:6,y:2},{id:'office',x:12,y:1},{id:'market',x:1,y:12},{id:'park',x:11,y:11}];
 // Verify all placements, footprints and road clearance before compositing.
 for(let i=0;i<plots.length;i++){const a=plots[i],ma=by[a.id],[w,h]=ma.footprint_tiles;if(a.x<0||a.y<0||a.x+w>n||a.y+h>n||a.x<=9&&a.x+w>9||a.y<=9&&a.y+h>9)throw Error('Plot crosses road/bounds '+a.id);for(let j=0;j<i;j++){let b=plots[j],[bw,bh]=by[b.id].footprint_tiles;if(a.x<b.x+bw&&a.x+w>b.x&&a.y<b.y+bh&&a.y+h>b.y)throw Error('Overlapping plots')}}
 plots.sort((a,b)=>a.x+a.y+by[a.id].footprint_tiles.reduce((s,x)=>s+x,0)-b.x-b.y-by[b.id].footprint_tiles.reduce((s,x)=>s+x,0));
 for(const p of plots){const v=by[p.id];layers.push({input:fs.readFileSync(path.join(root,v.file)),left:ox+(p.x-p.y)*128-v.floor_origin_px[0],top:oy+(p.x+p.y)*64-v.floor_origin_px[1]})}
 const full=await sharp({create:{width:W,height:H,channels:4,background:'#fbf3e2'}}).composite(layers).png().toBuffer();
 await sharp(full).resize(2560).webp({quality:90}).toFile(path.join(__dirname,'previews/street-corner.webp'));
 // Native-size crop proves detail is rendered at source pixels, not upscaled from a map.
 const o=by.office,p=plots.find(p=>p.id==='office'),left=ox+(p.x-p.y)*128-o.floor_origin_px[0],top=oy+(p.x+p.y)*64-o.floor_origin_px[1];
 await sharp(full).extract({left:left+350,top:top+360,width:760,height:760}).webp({quality:92}).toFile(path.join(__dirname,'previews/detail-native-1x.webp'));
 await sharp(full).resize(380).webp({quality:91}).toFile(path.join(__dirname,'previews/mobile-380.webp'));
 fs.writeFileSync(path.join(__dirname,'preview-layout.json'),JSON.stringify({review_only:true,world_size:[n,n],tile_px:[256,128],origin_px:[ox,oy],placements:plots,road_cross:[9,9],no_footprint_overlaps:true,no_footprints_on_road:true,not_a_game_layout:true},null,2)+'\n');
 console.log('Street corner, native crop and mobile previews ready');
}main().catch(e=>{console.error(e);process.exit(1)});
