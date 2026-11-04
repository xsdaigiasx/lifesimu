const test=require('node:test'),assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const {faintIfLate,spendTime,clockOf}=require('../.test-build/domain/time');
const base=engine.initial();
const at=(extra,minute,location)=>({...base,...extra,clock:{...clockOf(base),minute,location}});
test('kiệt sức giữa ngày: ngất, mất 3 giờ, tỉnh ở nhà, có nguyên nhân',()=>{
 const s=faintIfLate(at({energy:0,money:1000000},720,'home'));
 assert.equal(s.day,0);assert.equal(clockOf(s).minute,900);assert.equal(clockOf(s).location,'home');
 assert.ok(s.energy>=25);assert.equal(s.lastReport.faint.why,'tired');assert.equal(s.lastReport.faint.place,'home');assert.ok(engine.valid(s));
 const h=faintIfLate(at({fullness:0},720,'home'));assert.equal(h.lastReport.faint.why,'hungry');assert.ok(h.fullness>=35);
});
test('kiệt sức ngoài đường sức khỏe thấp: vào viện, trả viện phí',()=>{
 const s=faintIfLate(at({energy:0,health:20,money:1000000},720,'bank'));
 assert.equal(s.lastReport.faint.place,'hospital');assert.equal(s.money,850000);assert.ok(s.energy>=45);
});
test('không ngất khi chưa về 0; đang làm ca thì chờ',()=>{
 const s=at({energy:3},720,'home');assert.equal(faintIfLate(s),s);
 const w=at({energy:0,work:{active:{}}},720,'home');assert.equal(faintIfLate(w),w);
});
test('dưới 20 hao sức khỏe 2 mỗi giờ thức, đủ thì không hao',()=>{
 const low=at({energy:15,health:80},600,'home'),r=spendTime(low,120);assert.ok(r.ok);assert.equal(r.state.health,76);
 const ok=at({energy:60,fullness:60,health:80},600,'home'),r2=spendTime(ok,120);assert.equal(r2.state.health,80);
});
