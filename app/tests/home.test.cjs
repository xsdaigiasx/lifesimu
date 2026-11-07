const assert=require('node:assert/strict');
const {floorPoint,floorCell,floorPolygon,homeSize,HOME_FLOOR,blockedHomeCell,HOME_OUTER_FLOOR,HOME_SAFE_MARGIN,outerFloorPoint,homeSafeEdgePath,dragCell}=require('../.test-build/domain/home-geometry');
const {homeOf,homeError,saveHome}=require('../.test-build/domain/home');
const {engine}=require('../.test-build/domain/engine');
for(let x=0;x<=8;x++)for(let y=0;y<=8;y++){
 const p=floorPoint(x,y),c=floorCell(p.x,p.y);
 assert(Math.abs(c.x-x)<1e-10&&Math.abs(c.y-y)<1e-10);
 for(const width of [320,374,768]){const left=13,top=87;const q=floorCell(((left+p.x/100*width)-left)/width*100,((top+p.y/100*width)-top)/width*100);assert.equal(Math.round(q.x)+0,x);assert.equal(Math.round(q.y)+0,y)}
}
assert.equal(floorPolygon(2,3,2,4).split(' ').length,4);
assert.deepEqual(homeSize({id:'bed',rotation:90}),{w:2,h:1});
const s=engine.initial(),original=homeOf(s).items;
const moved=original.map(i=>i.id==='bed'?{...i,x:3,y:4}:i);
assert.equal(homeError(moved),null);const result=saveHome(s,moved);assert(result.ok);assert(engine.parse(JSON.stringify(result.state)));assert.equal(homeOf(s).items[0].x,0);
for(const pos of [{x:0,y:6},{x:0,y:0},{x:7,y:1},{x:9,y:9},{x:-1,y:4}]){assert(homeError(moved.map(i=>i.id==='bed'?{...i,...pos}:i)));assert(!saveHome(s,moved.map(i=>i.id==='bed'?{...i,...pos}:i)).ok)}
assert(!saveHome(s,original.map(i=>({...i,placed:false}))).ok);
console.log('PASS home floor projection/inverse at mobile and desktop sizes, rotation, blocked zones, overlap, immutable save and round-trip');


const {homeArtProjection,HOME_SOURCE_AXES,HOME_ART}=require('../.test-build/domain/home-art');
for(const [id,views] of Object.entries(HOME_SOURCE_AXES))for(let turn=0;turn<2;turn++){
 const [right,left]=views[turn],p=homeArtProjection(id,turn*90);
 // Straight top edges match both room floor axes; upright edges remain vertical.
 assert(Math.abs(p.shearY+p.scaleY*right-HOME_FLOOR.stepY/HOME_FLOOR.stepX)<1e-10,id);
 assert(Math.abs(p.shearY-p.scaleY*left+HOME_FLOOR.stepY/HOME_FLOOR.stepX)<1e-10,id);
 assert(p.scaleY>0.8&&p.scaleY<1.3);
}
assert(HOME_ART.desk[0].src.endsWith('desk-basic_a.webp'));
assert(HOME_ART.desk[1].src.endsWith('desk-basic_b.webp'));
console.log('PASS: furniture camera correction0/90, both floor axes, upright verticals and desk orientation mapping');

const back=floorPoint(0,0),right=floorPoint(8,0),front=floorPoint(8,8),left=floorPoint(0,8);
assert.equal(back.x,front.x);assert.equal(right.y,left.y);
assert.equal(Math.hypot(right.x-back.x,right.y-back.y),Math.hypot(left.x-back.x,left.y-back.y));
// Góc sàn khớp ảnh phòng lô 6: (0,8) tại px 212,606 và (8,8) tại px 724,862 trên khung 1448×1086.
const near=(p,q)=>assert(Math.abs(p.x-q.x)<1e-9&&Math.abs(p.y-q.y)<1e-9,JSON.stringify(p));near(outerFloorPoint(0,8),{x:212/1448*100,y:606/1086*100});near(outerFloorPoint(8,8),{x:50,y:862/1086*100});
assert.equal(HOME_SAFE_MARGIN,0);
for(let x=0;x<=8;x++)for(let y=0;y<=8;y++){const p=floorPoint(x,y);const outerX=((p.x-HOME_OUTER_FLOOR.originX)/HOME_OUTER_FLOOR.stepX+(p.y-HOME_OUTER_FLOOR.originY)/HOME_OUTER_FLOOR.stepY)/2;const outerY=((p.y-HOME_OUTER_FLOOR.originY)/HOME_OUTER_FLOOR.stepY-(p.x-HOME_OUTER_FLOOR.originX)/HOME_OUTER_FLOOR.stepX)/2;assert(outerX>=-1e-10&&outerX<=8+1e-10);assert(outerY>=-1e-10&&outerY<=8+1e-10)}
assert.equal((homeSafeEdgePath().match(/Z/g)||[]).length,2);
assert.equal(blockedHomeCell(7,7),false);assert.equal(blockedHomeCell(6,2),true);assert.equal(blockedHomeCell(2,0),true);assert.equal(blockedHomeCell(2,1),false);assert.equal(homeError(moved.map(i=>i.id==='bed'?{...i,x:5,y:5}:i)),null);
console.log('PASS: equal diamond axes, full floor corner coverage and old front-door floor cells usable');

const {rotateHomeObject,validHome}=require('../.test-build/domain/home');
const {HOME_GROUND}=require('../.test-build/domain/home-art');
for(const id of Object.keys(HOME_GROUND))for(const rotation of [0,90]){
 const item={id,x:3,y:4,rotation,placed:true},before=homeSize(item),turned=rotateHomeObject(item),after=homeSize(turned);
 assert.deepEqual({x:turned.x,y:turned.y},{x:item.x,y:item.y});
 assert.deepEqual(rotateHomeObject(rotateHomeObject(rotateHomeObject(turned))),item,'xoay 4 lần về chỗ cũ');assert.equal(turned.rotation,rotation+90);
 const ground=HOME_GROUND[id][rotation?1:0];assert(ground.x>0&&ground.x<100&&ground.y>0&&ground.y<=100);
}
let half=homeOf(engine.initial()).items.map(i=>i.id==='desk'?{...i,x:4.5,y:5.5}:i);assert(validHome({items:half,grid:8}));assert(engine.parse(JSON.stringify({...engine.initial(),home:{items:half,grid:8}})));
assert(homeError([{id:'plant',x:3,y:4,rotation:0,placed:true},{id:'lamp',x:3.5,y:4.5,rotation:0,placed:true}]));
assert.equal(homeError([{id:'plant',x:3,y:4,rotation:0,placed:true},{id:'lamp',x:4,y:4,rotation:0,placed:true}]),null);
console.log('PASS: rotation preserves integer origin, half-cell collision/save support and separate ground-contact anchors');


// Save cũ lưới 10×10: vẫn nạp được, đồ tự vào chỗ hợp lệ của lưới 8×8, không mất món nào.
{
 const {migrateHome,HOME_GRID}=require('../.test-build/domain/home');
 const legacy=[{id:'bed',x:0,y:3,rotation:0,placed:true},{id:'desk',x:0,y:7,rotation:0,placed:true},{id:'table',x:8,y:8,rotation:0,placed:true},{id:'plant',x:9,y:9,rotation:0,placed:true},{id:'lamp',x:1,y:1,rotation:0,placed:false}];
 const old={...engine.initial(),home:{items:legacy}};
 assert(engine.parse(JSON.stringify(old)),'save cũ không có grid phải còn nạp được');
 const items=homeOf(old).items;
 assert.equal(items.length,legacy.length);
 assert.equal(homeError(items),null,'sau chuyển đổi không chồng, không vào bếp hay phòng tắm');
 for(const i of items.filter(i=>i.placed)){const {w,h}=homeSize(i);assert(i.x>=0&&i.y>=0&&i.x+w<=HOME_GRID&&i.y+h<=HOME_GRID)}
 assert(items.find(i=>i.id==='bed').placed);
 const saved=saveHome({...old,locationOverride:undefined},items);
 if(saved.ok){assert.equal(saved.state.home.grid,8);assert.deepEqual(homeOf(saved.state).items,items)}
 // hết chỗ thì cất vào kho thay vì mất
 const crowded=migrateHome(['bed','desk','table','wardrobe','rug'].map(id=>({id,x:0,y:3,rotation:0,placed:true})));
 assert.equal(crowded.length,5);assert.equal(homeError(crowded),null);
 assert.deepEqual(migrateHome(migrateHome(legacy)).map(i=>i.id),legacy.map(i=>i.id));
 console.log('PASS: save lưới 10×10 chuyển sang 8×8 giữ đủ đồ, hợp lệ, không chồng');
}
{
 // Việc 5: kéo đồ. Ô đặt = ô dưới ngón tay trừ độ lệch lúc bắt đầu kéo; mọi ô của món (sau khi xoay) phải trong lưới 8×8, ngoài bếp, vệ sinh, không đè đồ khác.
 const {HOME_ITEMS,HOME_GRID}=require('../.test-build/domain/home');
 const item={id:'bed',x:3,y:4,rotation:0,placed:true},grab={x:3.6,y:4.3},offset={x:grab.x-item.x,y:grab.y-item.y};
 assert.deepEqual(dragCell(grab,offset),{x:3,y:4},'chưa kéo thì đồ đứng yên');
 for(const [dx,dy] of [[1,0],[0,2],[-1.5,1],[2.5,-2]]){const c=dragCell({x:grab.x+dx,y:grab.y+dy},offset);assert(Math.abs(c.x-(item.x+dx))<=.5&&Math.abs(c.y-(item.y+dy))<=.5,`kéo ${dx},${dy}`)}
 const oracle=(id,x,y,rot)=>{const t=HOME_ITEMS[id],w=rot%180?t.h:t.w,h=rot%180?t.w:t.h;if(x<0||y<0||x+w>HOME_GRID||y+h>HOME_GRID)return false;for(let cx=Math.floor(x);cx<Math.ceil(x+w);cx++)for(let cy=Math.floor(y);cy<Math.ceil(y+h);cy++)if(blockedHomeCell(cx,cy))return false;return true};
 let ok=0,bad=0;
 for(const id of Object.keys(HOME_ITEMS)){if(id==='painting')continue;for(const rot of [0,90,180,270])for(let x=-1;x<=HOME_GRID+.5;x+=.5)for(let y=-1;y<=HOME_GRID+.5;y+=.5){
  const want=oracle(id,x,y,rot),got=homeError([{id,x,y,rotation:rot,placed:true}])===null;assert.equal(got,want,`${id} ${rot}° tại ${x},${y}`);want?ok++:bad++}}
 assert(ok>100&&bad>100,'quét đủ cả chỗ hợp lệ và không hợp lệ');
 // chồng đồ: hai đồ chạm cạnh thì được, đè nhau thì lỗi, kể cả sau khi xoay
 assert.equal(homeError([{id:'bed',x:3,y:3,rotation:0,placed:true},{id:'desk',x:3,y:3,rotation:0,placed:true}]),'Đồ đang chồng lên nhau.');
 const bw=HOME_ITEMS.bed.w;assert.equal(homeError([{id:'bed',x:3,y:3,rotation:0,placed:true},{id:'desk',x:3+bw,y:3,rotation:0,placed:true}]),null);
 console.log('PASS: kéo đồ: ô theo độ lệch lúc bắt đầu kéo, kiểm mọi ô sau khi xoay, quét '+(ok+bad)+' vị trí');
}

// Every tier/direction uses the source footprint, including asymmetric beds.
{
 const {furnitureFit}=require('../.test-build/domain/furniture-fit');
 const sprites=require('../src/domain/furniture-sprites.json');
 const {HOME_ITEMS}=require('../.test-build/domain/home');
 for(const [key,sp] of Object.entries(sprites)){
  const id=key.split('-')[0];if(id==='painting')continue;
  const rot=/_[bd]$/.test(key),t=HOME_ITEMS[id],w=rot?t.h:t.w,h=rot?t.w:t.h;
  const f=furnitureFit(sp,w,h);
  assert(f.scale>0&&Number.isFinite(f.cx)&&Number.isFinite(f.cy),key);
  assert(sp.fw*f.scale<=w*.9+1e-9&&sp.fh*f.scale<=h*.9+1e-9,key+' contact footprint fits');
  // Project the source footprint center: it must land exactly on destination center.
  assert.equal((sp.ax-(sp.fw-sp.fh)*32-f.cx)*f.scale,0);
  assert.equal((sp.ay-(sp.fw+sp.fh)*16-f.cy)*f.scale,0);
 }
 assert.equal(HOME_ITEMS.bed.w*HOME_ITEMS.bed.h,2);
 const {spriteBox,iso}=require('../.test-build/domain/office-plan');
 const b=spriteBox({x:2,y:3},'chair'),c=iso(2.5,3.5);
 assert.equal(b.width,96);assert.equal(b.left+b.width/2,c.x);
 assert.equal(b.top+b.height-24,c.y);
 console.log('PASS: all sprite tiers/directions fit centered footprints; bed two cells; chair inset');
}
