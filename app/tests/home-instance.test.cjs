const assert=require('node:assert/strict');
const {homeOf,homeError,saveHome,buyHome,validHome,uidOf,HOME_MAX}=require('../.test-build/domain/home');
const {engine}=require('../.test-build/domain/engine');
let s={...engine.initial(),money:50000000};
assert.deepEqual(homeOf(s).items.map(uidOf),['bed','desk']);
// mua nhiều cái theo trần: cây 3, đèn 3, tranh 3; giường chỉ 1
for(let n=1;n<=3;n++){const r=buyHome(s,'plant');assert(r.ok,'cây '+n);s=r.state}
assert.deepEqual(homeOf(s).items.filter(i=>i.id==='plant').map(uidOf),['plant','plant-2','plant-3']);
assert.equal(buyHome(s,'plant').ok,false);assert.equal(HOME_MAX.plant,3);
assert.equal(buyHome(s,'bed').ok,false);
assert(engine.parse(JSON.stringify(s)));
// đặt bản thể thứ 2 vào chỗ khác, lưu và tải lại đúng vị trí, hướng
const items=homeOf(s).items.map(i=>uidOf(i)==='plant-2'?{...i,x:3,y:5,rotation:90,placed:true}:uidOf(i)==='plant'?{...i,x:5,y:5,placed:true}:i);
assert.equal(homeError(items),null);
const saved=saveHome(s,items);assert(saved.ok,saved.error);
const back=engine.parse(JSON.stringify(saved.state));assert(back);
const p2=homeOf(back).items.find(i=>uidOf(i)==='plant-2'),p1=homeOf(back).items.find(i=>uidOf(i)==='plant');
assert.deepEqual([p2.x,p2.y,p2.rotation,p2.placed],[3,5,90,true]);assert.deepEqual([p1.x,p1.y,p1.placed],[5,5,true]);
assert.equal(homeOf(back).items.find(i=>uidOf(i)==='plant-3').placed,false);
// hai cây không chồng ô; trùng uid bị từ chối
assert(homeError(items.map(i=>uidOf(i)==='plant-2'?{...i,x:5,y:5,rotation:0}:i)));
const dupe=homeOf(s).items.map(i=>uidOf(i)==='plant-2'?{...i,uid:'plant'}:i);
assert.equal(validHome({items:dupe,grid:8}),false);assert(!saveHome(s,dupe).ok);
// lưu không được đổi tập đồ sở hữu
assert(!saveHome(s,items.filter(i=>uidOf(i)!=='plant-3')).ok);
// hai tranh: cùng tường thì chồng nhau, khác tường thì được; trần 2
let t={...engine.initial(),money:50000000};for(let n=0;n<2;n++)t=buyHome(t,'painting').state;
assert.equal(buyHome(t,'painting').ok,false);
const wall=(w,x,y)=>homeOf(t).items.map(i=>i.id==='painting'?(uidOf(i)==='painting'?{...i,mount:'wall',wall:'left',x:0,y:6,placed:true}:{...i,mount:'wall',wall:w,x,y,placed:true}):i);
assert(homeError(wall('left',0,6)));
assert.equal(homeError(wall('right',0,0)),null);
// save cũ chưa có uid vẫn tải được và được gán mã
const legacy=JSON.parse(JSON.stringify(engine.initial()));legacy.home={grid:8,items:[{id:'bed',x:0,y:3,rotation:0,placed:true},{id:'desk',x:0,y:6,rotation:0,placed:true}]};
assert(engine.parse(JSON.stringify(legacy)));assert.deepEqual(homeOf(legacy).items.map(uidOf),['bed','desk']);
console.log('PASS home instances: uid, caps, save/load by uid, duplicates, wall overlap, legacy saves');
