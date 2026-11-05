const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../.test-build/domain/fitness');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');const {lifeOf,lifeAction,validLife}=require('../.test-build/domain/life');const V=require('../.test-build/domain/vitals');
const at=(extra={})=>({...engine.initial(),day:10,energy:80,health:60,clock:{...clockOf(engine.initial()),location:'park',minute:480},...extra});
const run=(s,activity)=>{const r=lifeAction(s,{kind:'park',activity});assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state));assert.ok(engine.parse(JSON.stringify(r.state)));return r.state};
test('mới bắt đầu: Thể lực thấp, chữ mức Yếu',()=>{const s=at();assert.equal(F.fitValue(s),0);assert.equal(F.fitLevel(s),'Yếu');assert.equal(F.fitMult(s),1);assert.equal(F.sleepMult(s),1)});
test('Chạy bộ +4, Giãn cơ +2, Đi dạo +1',()=>{
 assert.equal(F.fitValue(run(at(),'exercise')),4);assert.equal(F.fitValue(run(at(),'stretch')),2);assert.equal(F.fitValue(run(at(),'walk')),1);assert.equal(F.fitValue(run(at(),'parkRest')),0);
});
test('trần cộng mỗi ngày',()=>{
 let s=run(at(),'exercise');s=run(s,'stretch');assert.equal(F.fitValue(s),5,'cả hai buổi chỉ cộng tối đa 5');
 s=run(s,'walk');assert.equal(F.fitValue(s),5,'đã chạm trần trong ngày');
 s={...s,day:11,clock:{...s.clock,minute:480}};s=run(s,'exercise');assert.equal(F.fitValue(s),9,'sang ngày mới cộng tiếp');
});
test('bỏ tập quá 3 ngày thì mất 1 điểm mỗi ngày, không âm',()=>{
 let s=run(at(),'exercise');const v=F.fitValue(s);
 assert.equal(F.fitValue(s,s.day+3),v);assert.equal(F.fitValue(s,s.day+4),v-1);assert.equal(F.fitValue(s,s.day+13),Math.max(0,v-10));assert.equal(F.fitValue(s,s.day+500),0);
});
test('chữ mức theo điểm và hiệu ứng tối đa 20% hao, 10% hồi ngủ',()=>{
 const withFit=v=>({...at(),life:{...lifeOf(at()),fit:{value:v,at:10,last:10,gainDay:10,gained:0}}});
 assert.equal(F.fitLevel(withFit(19)),'Yếu');assert.equal(F.fitLevel(withFit(20)),'Trung bình');assert.equal(F.fitLevel(withFit(40)),'Khá');assert.equal(F.fitLevel(withFit(65)),'Tốt');assert.equal(F.fitLevel(withFit(100)),'Rất tốt');
 assert.ok(Math.abs(F.fitMult(withFit(100))-.8)<1e-9);assert.ok(Math.abs(F.sleepMult(withFit(100))-1.1)<1e-9);
 const idle=s=>V.drainIdleEnergy(s,0,600).energy;assert.ok(idle(withFit(100))>idle(withFit(0)),'Thể lực cao hao ít hơn khi rảnh');
 assert.equal(V.sleepEnergy(480,1.1),88);assert.equal(V.sleepEnergy(480),80);
});
test('save hợp lệ: Thể lực sai bị chặn',()=>{
 const s=run(at(),'exercise');assert.ok(validLife(s.life,s.day));
 for(const bad of [{...s.life.fit,value:101},{...s.life.fit,gained:6},{...s.life.fit,at:s.day+1},{...s.life.fit,value:1.5}])assert.ok(!validLife({...s.life,fit:bad},s.day));
 assert.ok(validLife({...s.life,fit:undefined},s.day));
});
