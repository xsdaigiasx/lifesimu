const assert=require('node:assert/strict');
const {floorPoint,floorCell,floorPolygon,homeSize,HOME_FLOOR,blockedHomeCell,HOME_OUTER_FLOOR,HOME_SAFE_MARGIN,outerFloorPoint,homeSafeEdgePath}=require('../.test-build/domain/home-geometry');
const {homeOf,homeError,saveHome}=require('../.test-build/domain/home');
const {engine}=require('../.test-build/domain/engine');
for(let x=0;x<=10;x++)for(let y=0;y<=10;y++){
 const p=floorPoint(x,y),c=floorCell(p.x,p.y);
 assert(Math.abs(c.x-x)<1e-10&&Math.abs(c.y-y)<1e-10);
 for(const width of [320,374,768]){const left=13,top=87;const q=floorCell(((left+p.x/100*width)-left)/width*100,((top+p.y/100*width)-top)/width*100);assert.equal(Math.round(q.x)+0,x);assert.equal(Math.round(q.y)+0,y)}
}
assert.equal(floorPolygon(2,3,2,4).split(' ').length,4);
assert.deepEqual(homeSize({id:'bed',rotation:90}),{w:4,h:2});
const s=engine.initial(),original=homeOf(s).items;
const moved=original.map(i=>i.id==='bed'?{...i,x:3,y:4}:i);
assert.equal(homeError(moved),null);const result=saveHome(s,moved);assert(result.ok);assert(engine.parse(JSON.stringify(result.state)));assert.equal(homeOf(s).items[0].x,0);
for(const pos of [{x:0,y:7},{x:0,y:0},{x:9,y:9},{x:-1,y:4}]){assert(homeError(moved.map(i=>i.id==='bed'?{...i,...pos}:i)));assert(!saveHome(s,moved.map(i=>i.id==='bed'?{...i,...pos}:i)).ok)}
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
assert(HOME_ART.desk[0].src.endsWith('desk-90.png'));
assert(HOME_ART.desk[1].src.includes('desk-0.png?v=31'));
console.log('PASS: furniture camera correction0/90, both floor axes, upright verticals and desk orientation mapping');

const back=floorPoint(0,0),right=floorPoint(10,0),front=floorPoint(10,10),left=floorPoint(0,10);
assert.equal(back.x,front.x);assert.equal(right.y,left.y);
assert.equal(Math.hypot(right.x-back.x,right.y-back.y),Math.hypot(left.x-back.x,left.y-back.y));
assert.deepEqual(outerFloorPoint(0,10),{x:7.5,y:59});assert.deepEqual(outerFloorPoint(10,10),{x:50,y:87.75});
assert(left.x>7.5&&right.x<92.5&&front.y<87.75);assert.equal(HOME_SAFE_MARGIN,.5);
for(let x=0;x<=10;x++)for(let y=0;y<=10;y++){const p=floorPoint(x,y);const outerX=((p.x-HOME_OUTER_FLOOR.originX)/HOME_OUTER_FLOOR.stepX+(p.y-HOME_OUTER_FLOOR.originY)/HOME_OUTER_FLOOR.stepY)/2;const outerY=((p.y-HOME_OUTER_FLOOR.originY)/HOME_OUTER_FLOOR.stepY-(p.x-HOME_OUTER_FLOOR.originX)/HOME_OUTER_FLOOR.stepX)/2;assert(outerX>=.5-1e-10&&outerX<=9.5+1e-10);assert(outerY>=.5-1e-10&&outerY<=9.5+1e-10)}
assert.equal((homeSafeEdgePath().match(/Z/g)||[]).length,2);
assert.equal(blockedHomeCell(9,9),false);assert.equal(homeError(moved.map(i=>i.id==='bed'?{...i,x:8,y:6}:i)),null);
console.log('PASS: equal diamond axes, full floor corner coverage and old front-door floor cells usable');

const {rotateHomeObject,validHome}=require('../.test-build/domain/home');
const {HOME_GROUND}=require('../.test-build/domain/home-art');
for(const id of Object.keys(HOME_GROUND))for(const rotation of [0,90]){
 const item={id,x:3.5,y:4,rotation,placed:true},before=homeSize(item),turned=rotateHomeObject(item),after=homeSize(turned);
 assert.deepEqual(floorPoint(item.x+before.w/2,item.y+before.h/2),floorPoint(turned.x+after.w/2,turned.y+after.h/2));
 assert.deepEqual(rotateHomeObject(turned),item);
 const ground=HOME_GROUND[id][rotation?1:0];assert(ground.x>0&&ground.x<100&&ground.y>0&&ground.y<=100);
}
let half=homeOf(engine.initial()).items.map(i=>i.id==='desk'?{...i,x:4.5,y:7.5}:i);assert(validHome({items:half}));assert(engine.parse(JSON.stringify({...engine.initial(),home:{items:half}})));
assert(homeError([{id:'plant',x:3,y:4,rotation:0,placed:true},{id:'lamp',x:3.5,y:4.5,rotation:0,placed:true}]));
assert.equal(homeError([{id:'plant',x:3,y:4,rotation:0,placed:true},{id:'lamp',x:4,y:4,rotation:0,placed:true}]),null);
console.log('PASS: rotation preserves footprint center exactly, half-cell collision/save support and separate ground-contact anchors');

