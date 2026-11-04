const assert=require('node:assert/strict');
const {homeOf,saveHome,buyHome,uidOf,placedAt,decorRelief,DECOR_CAP}=require('../.test-build/domain/home');
const {napAtHome,onlineGig,gigPay}=require('../.test-build/domain/home-use');
const {engine}=require('../.test-build/domain/engine');
let s={...engine.initial(),money:50000000,energy:50,stress:50};
// giường, bàn mặc định đã đặt
assert(placedAt(s,'bed')&&placedAt(s,'desk'));
const n=napAtHome(s);assert(n.ok,n.error);assert(n.state.energy>s.energy);assert(!napAtHome(n.state).ok);
const g=onlineGig(s);assert(g.ok,g.error);assert.equal(g.state.money,s.money+gigPay(s));assert(!onlineGig(g.state).ok);
assert(engine.valid(g.state));assert(engine.parse(JSON.stringify(g.state)));
// bàn cất vào kho: không làm thêm; chuyển chỗ vẫn dùng được
const stored=saveHome(s,homeOf(s).items.map(i=>i.id==='desk'?{...i,placed:false}:i));assert(stored.ok,stored.error);
assert(!onlineGig(stored.state).ok);
const moved=saveHome(s,homeOf(s).items.map(i=>i.id==='desk'?{...i,x:3,y:6}:i));assert(moved.ok,moved.error);
assert(onlineGig(moved.state).ok);
// trang trí cộng dồn có trần
let d=s;for(const id of ['plant','plant','plant','lamp','lamp','lamp'])d=buyHome(d,id,'premium').state;
const cells=[[5,4],[6,4],[7,4],[5,5],[6,5],[7,5]];let k=0;
const placed=saveHome(d,homeOf(d).items.map(i=>['plant','lamp'].includes(i.id)?{...i,x:cells[k][0],y:cells[k++][1],placed:true}:i));assert(placed.ok,placed.error);
assert.equal(decorRelief(placed.state),DECOR_CAP);assert.equal(decorRelief(s),0);
console.log('home-use ok');
