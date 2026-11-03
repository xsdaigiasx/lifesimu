const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const sharp=require(process.env.SHARP_MODULE||'sharp'),root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
function bounds(data,width,height){
  let left=width,top=height,right=-1,bottom=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]){
    left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
  }
  return {left,top,right,bottom};
}
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function verifyLayout(assets){
  const layout=read('previews/placements.json');
  const find=p=>assets.find(a=>a.id===p.id&&a.direction===p.direction&&a.variant===p.variant);
  const ground=[];
  for(const p of layout.placements){
    assert(Number.isInteger(p.x)&&Number.isInteger(p.y),p.id+' must use integer floor coordinates');
    const a=find(p);assert(a,p.id+' missing asset');const [w,h]=a.footprint_tiles;
    assert(p.x>=0&&p.y>=0&&p.x+w<=8&&p.y+h<=8,p.id+' outside floor');
    if(w&&h&&p.z===0)ground.push({...p,w,h});
    if(p.support_id){
      const support=layout.placements.find(q=>q.id===p.support_id),sa=find(support);
      assert(p.x>=support.x&&p.y>=support.y&&p.x+w<=support.x+sa.footprint_tiles[0]&&p.y+h<=support.y+sa.footprint_tiles[1],p.id+' outside support');
      assert.equal(p.z,2.9,'lamp must rest on desk top');
    }
  }
  for(let i=0;i<ground.length;i++)for(let j=i+1;j<ground.length;j++)assert(!overlaps(ground[i],ground[j]),ground[i].id+' overlaps '+ground[j].id);
  const fixed=[{id:'kitchen',x:0,y:0,w:5,h:1},{id:'bathroom',x:5,y:0,w:3,h:3}];
  for(const p of ground)for(const r of [...fixed,...layout.clearance_rects])assert(!overlaps(p,r),p.id+' blocks '+r.id);
  // A floor rug is walkable. Solid furniture and fixed facilities are obstacles.
  const obstacles=[...fixed,...ground.filter(p=>p.id!=='rug-small')];
  const blocked=(x,y)=>obstacles.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);
  const queue=[layout.walk_start],seen=new Set();
  while(queue.length){const [x,y]=queue.shift(),key=x+','+y;if(x<0||y<0||x>=8||y>=8||seen.has(key)||blocked(x,y))continue;seen.add(key);queue.push([x-1,y],[x+1,y],[x,y-1],[x,y+1]);}
  for(const target of layout.walk_targets)assert(seen.has(target.join(',')),'unreachable approach '+target);
  return {integer_xy:true,ground_overlaps:0,door_clearances:'clear',reachable_approaches:layout.walk_targets.length};
}
async function main(){
  const all=[],edgeMargins={};let max=0;
  for(const group of ['room','furniture']){
    const m=read(group+'/manifest.json');assert.equal(m.palette.length,8);assert(!m.anchor.includes('conflict'));
    assert.deepEqual(m.tile_px,[128,64]);assert.equal(m.z_px,32);
    for(const a of m.assets){
      all.push(a);const file=path.join(root,group,a.file),bytes=fs.statSync(file).size;
      const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      assert.deepEqual([info.width,info.height],a.frame_px,a.file);assert(bytes<150*1024,a.file+' too large');
      const [w,h]=a.frame_px,[fx,fy]=a.footprint_tiles;
      assert.deepEqual(a.anchor_px,[w/2+(fx-fy)*32,h]);
      assert.deepEqual(a.mount_origin_px,[a.anchor_px[0]-(fx-fy)*64,h-(fx+fy)*32]);
      assert(data.some((v,i)=>i%4===3&&v===255),a.file+' missing opaque pixels');
      const svg=fs.readFileSync(path.join(root,group,a.source),'utf8');
      assert(!/gradient|filter=|<image|<text|opacity=/i.test(svg),a.file+' non-flat artwork');
      if(a.id!=='room-shell-tro'){
        const b=bounds(data,w,h);assert(b.left>0&&b.top>0&&b.right<w-1&&b.bottom<h-1,a.file+' touches canvas edge');
        edgeMargins[a.file]=[b.left,b.top,w-1-b.right,h-1-b.bottom];
        // Overscan also catches an entire leaf clipped beyond the original PNG border.
        const overscan=svg.replace(/^<svg[^>]*>/,`<svg xmlns="http://www.w3.org/2000/svg" width="${w+16}" height="${h+16}" viewBox="-8 -8 ${w+16} ${h+16}">`);
        const raw=await sharp(Buffer.from(overscan)).ensureAlpha().raw().toBuffer();
        const ob=bounds(raw,w+16,h+16);
        assert(ob.left>8&&ob.top>8&&ob.right<w+7&&ob.bottom<h+7,a.file+' SVG extends outside canvas');
      }
      if(a.id==='door-main'){assert.deepEqual(a.frame_px,[128,320]);assert.equal(a.height_z,8);}
      max=Math.max(max,bytes);
    }
  }
  assert.equal(all.length,20);
  for(const [direction,footprint,anchor]of [['a',[3,2],[192,168]],['b',[2,3],[128,168]]]){
    const rug=all.find(a=>a.id==='rug-small'&&a.direction===direction);assert(rug,'missing rug '+direction);
    assert.deepEqual(rug.footprint_tiles,footprint);assert.deepEqual(rug.anchor_px,anchor);assert.deepEqual(rug.frame_px,[320,168]);
  }
  console.log(JSON.stringify({assets:all.length,max_png_bytes:max,plant_margins_ltrb:edgeMargins['plant-monstera_a_default.png'],wall_margins_ltrb:Object.fromEntries(Object.entries(edgeMargins).filter(([name])=>/door-|window/.test(name))),standalone_borders:'transparent, SVG overscan clean',layout:verifyLayout(all)},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
