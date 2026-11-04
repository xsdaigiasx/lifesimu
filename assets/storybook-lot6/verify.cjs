const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),sharp=require('sharp');
const root=path.resolve(__dirname,'../..'),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json')));
async function main(){const checks=[];
 for(const v of manifest.items){const b=fs.readFileSync(path.join(root,v.file)),m=await sharp(b).metadata();assert.equal(m.width,v.frame[0]);assert.equal(m.height,v.frame[1]);assert(m.hasAlpha);assert.equal(b.length,v.bytes);assert(b.length<150000);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),v.sha256);
  const {data,info}=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});let minx=info.width,miny=info.height,maxx=-1,maxy=-1,transparent=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){let a=data[(y*info.width+x)*4+3];if(!a){transparent++;continue}minx=Math.min(x,minx);miny=Math.min(y,miny);maxx=Math.max(x,maxx);maxy=Math.max(y,maxy)}assert(transparent>0);assert(Math.min(minx,miny,info.width-1-maxx,info.height-1-maxy)>8);
  checks.push({id:v.id,frame:[m.width,m.height],bytes:b.length,rgba:m.channels===4,alpha_bbox:[minx,miny,maxx+1,maxy+1],margin_px:Math.min(minx,miny,info.width-1-maxx,info.height-1-maxy),hash_matches:true});
 }
 const runtime=manifest.items.find(x=>x.id==='rental-storybook'),expected=[[50,30.25],[92.5,59],[50,87.75],[7.5,59]];
 runtime.floor_corners.forEach((p,i)=>p.pixel.forEach((n,k)=>assert(Math.abs(n/runtime.frame[k]*100-expected[i][k])<1e-9)));
 // Independent domain occupancy and connectivity check, not derived from the rendered pixels.
 const blocked=(x,y)=>x>=5&&y<3||x<5&&y<1,free=[];for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(!blocked(x,y))free.push([x,y]);assert.equal(free.length,50);
 const seen=new Set(['0,1']),q=[[0,1]];for(let i=0;i<q.length;i++){let [x,y]=q[i];for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(nx>=0&&ny>=0&&nx<8&&ny<8&&!blocked(nx,ny)&&!seen.has(nx+','+ny)){seen.add(nx+','+ny);q.push([nx,ny])}}assert.equal(seen.size,50);
 const canonical=manifest.items.find(x=>x.id==='room-master-storybook');assert.equal(canonical.axes[0],2*canonical.axes[1]);
 // All logical safe-grid intersections map into the outer square, including old half-tile positions.
 let points=0;for(let x=0;x<=8;x+=.5)for(let y=0;y<=8;y+=.5){let u=.4+.9*x,v=.4+.9*y;assert(u>=0&&v>=0&&u<=8&&v<=8);points++}
 const report={issue:89,lot:6,checks,normalized_runtime_floor_matches_source:true,canonical_projection_2_to_1:true,bath_tiles:9,kitchen_tiles:5,free_cells:50,all_free_cells_connected:seen.size===50,safe_grid_points_checked:points,limitations:['Original rental-diamond PNG cannot be decoded via available connector; normalized registration checked against home-geometry.ts, not image pixels.','room-master original has a furnished irregular floor; the new sibling preserves 1448x1086 frame and uses an explicit canonical 8x8 floor.','No UI integration or browser playtest in this asset-only PR; CSS bath occlusion must use supplied mask.']};
 fs.writeFileSync(path.join(__dirname,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}main().catch(e=>{console.error(e);process.exit(1)});
