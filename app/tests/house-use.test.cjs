const test=require('node:test'),assert=require('node:assert/strict');
const H=require('../.test-build/domain/housing');const U=require('../.test-build/domain/home-use');const {engine}=require('../.test-build/domain/engine');const T=require('../.test-build/domain/time');
const at=(location,extra={})=>{const s=engine.initial();return{...s,day:3,money:5e10,energy:50,clock:{...T.clockOf(s),minute:600,location},...extra}};
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state));return r.state};
test('nhà phố: nghỉ 1 giờ, làm thêm, giải trí, mỗi việc một lần mỗi ngày',()=>{
 for(const [house,place] of [['townhouse','apartments'],['villa','villa']]){
  const s=ok(H.moveHouse(at(place),house,house==='villa'?'own':'rent'));
  assert.ok(U.hasSpot(s,'bed')&&U.hasSpot(s,'desk'),house);
  const n=ok(U.napAtHome(s));assert.ok(n.energy>s.energy);assert.equal(U.napAtHome(n).ok,false);
  const g=ok(U.onlineGig(s));assert.ok(g.money>s.money);assert.equal(U.onlineGig(g).ok,false);
  const p=ok(U.playAtHome(s));assert.ok(p.mood>=s.mood);assert.equal(U.playAtHome(p).ok,false);
  // không ở nhà thì không dùng được
  assert.equal(U.napAtHome({...s,clock:{...s.clock,location:'park'}}).ok,false);
 }
});
