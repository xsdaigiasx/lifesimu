const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname,'../..');
const m = require('./manifest.json');
const old = require('../storybook-lot5/manifest.json');
async function checkImage(item) {
  const file = path.join(ROOT,item.file),buffer=fs.readFileSync(file);
  assert(buffer.length<150000, `${item.file} exceeds 150000 bytes`);
  assert.equal(buffer.length,item.bytes);
  assert.equal(crypto.createHash('sha256').update(buffer).digest('hex'),item.sha256);
  const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual([info.width,info.height],item.frame_px);
  let zero=0,solid=0;const bb=[info.width,info.height,0,0];
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++) {
    const a=data[(y*info.width+x)*4+3];if(a===0)zero++;if(a===255)solid++;
    if(a>0){bb[0]=Math.min(bb[0],x);bb[1]=Math.min(bb[1],y);bb[2]=Math.max(bb[2],x+1);bb[3]=Math.max(bb[3],y+1)}
    if(x===0||y===0||x===info.width-1||y===info.height-1)assert.equal(a,0,`${item.file} clipped at frame edge`);
  }
  assert(zero>info.width*info.height*.1);assert(solid>100);
  return {file:item.file,frame_px:item.frame_px,bytes:buffer.length,alpha_bbox_px:bb,transparent_pixels:zero,sha256:item.sha256};
}
async function main(){
  assert.equal(m.items.length,12);const report=[];
  for(const id of ['bed','wardrobe','desk']) {
    assert.deepEqual(m.items.filter(i=>i.id===id).map(i=>i.direction),['a','b','c','d']);
    for(const i of m.items.filter(i=>i.id===id)) {
      const template=old.items.find(t=>t.id===i.id&&t.model===i.model&&t.direction===i.direction);
      for(const k of ['frame_px','anchor_px','footprint_tiles','mount_origin_px','footprint_corners_px','front_vector_xy'])assert.deepEqual(i[k],template[k],`${i.file} ${k}`);
      const [w,d]=i.footprint_tiles;
      assert.equal(i.anchor_px[0],64*w);assert.equal(i.frame_px[0],64*(w+d));
      assert.equal(i.anchor_px[1],i.frame_px[1]);
      report.push(await checkImage(i));
    }
    // Rear views must be separately rendered. Reject exact image mirroring.
    const by=d=>m.items.find(i=>i.id===id&&i.direction===d);
    for(const [front,rear] of [['a','c'],['b','d']]) {
      const f=await sharp(path.join(ROOT,by(front).file)).flop().raw().toBuffer();
      const r=await sharp(path.join(ROOT,by(rear).file)).raw().toBuffer();
      assert(!f.equals(r),`${id} ${rear} is mirrored ${front}`);
    }
  }
  const room=m.room;assert.deepEqual(room.frame_px,[1448,1086]);assert.deepEqual(room.origin_px,[724,350]);
  const project=(x,y)=>[724+64*(x-y),350+32*(x+y)];
  assert.deepEqual(room.floor_corners_px,[[0,0],[8,0],[8,8],[0,8]].map(p=>project(...p)));
  report.push(await checkImage(room));
  const placements=require('./placements.json');
  const blocked=[room.kitchen,room.bath];
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  for(const p of placements){const i=m.items.find(i=>i.id===p.id&&i.direction===p.direction);const r={...p,w:i.footprint_tiles[0],h:i.footprint_tiles[1]};assert(r.x>=0&&r.y>=0&&r.x+r.w<=8&&r.y+r.h<=8);assert(!blocked.some(b=>overlap(r,b)),`${p.id} collides`);blocked.push(r)}
  const cells=new Set();for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(!blocked.some(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h))cells.add(`${x},${y}`);
  const seen=new Set(),queue=[cells.values().next().value];while(queue.length){const key=queue.shift();if(!cells.has(key)||seen.has(key))continue;seen.add(key);const [x,y]=key.split(',').map(Number);queue.push(`${x+1},${y}`,`${x-1},${y}`,`${x},${y+1}`,`${x},${y-1}`)}assert.equal(seen.size,cells.size,'Walkable floor is disconnected');
  const mobile=await sharp(path.join(__dirname,'previews/mobile-380.webp')).metadata();assert.equal(mobile.width,380);
  const result={status:'pass',checks:['13 decoded RGBA assets; frame, alpha, hash and <150000 bytes','12 names/directions; inherited footprint and anchor values','rear images are not exact mirror copies','canonical room grid; fixed kitchen/bath rectangles','preview placement has no collisions; remaining floor connected','mobile preview width 380px'],limitations:['Artwork contact points are registered by template bounding boxes, not a reconstructed 3D mesh. Visual in-game review remains required.','No changes to game UI, core, save or balance; runtime integration not tested.'],walkable_cells:cells.size,images:report};
  fs.writeFileSync(path.join(__dirname,'validation.json'),JSON.stringify(result,null,2)+'\n');console.log(`PASS: ${report.length} assets, ${cells.size} connected free cells, 380px preview`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
