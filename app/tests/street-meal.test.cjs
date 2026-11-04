const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../.test-build/domain/life');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');
const {fullnessOf}=require('../.test-build/domain/vitals');const {statDeltas}=require('../.test-build/domain/stat-delta');
const at=(minute,location,extra={})=>{const s=engine.initial();return{...s,day:2,money:1e6,fullness:30,clock:{...clockOf(s),minute,location},...extra}};
test('ăn ở quán: đúng nơi, trừ tiền, tăng no, chung luật 3 giờ',()=>{
 assert.equal(L.lifeAction(at(720,'home'),{kind:'streetMeal',id:'comTam'}).ok,false,'phải ở quán');
 const s=at(720,'streetfood'),r=L.lifeAction(s,{kind:'streetMeal',id:'comTam'});assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state));
 assert.equal(r.state.money,s.money-L.STREET_MEALS.comTam.price);assert.ok(fullnessOf(r.state)>fullnessOf(s)+40);assert.equal(clockOf(r.state).minute,720+L.STREET_MEALS.comTam.minutes);
 assert.match(L.lifeAction(r.state,{kind:'streetMeal',id:'banhMi'}).error,/3 giờ/);
 assert.equal(L.lifeAction(at(720,'streetfood',{fullness:95}),{kind:'streetMeal',id:'pho'}).ok,false,'đang no');
 assert.equal(L.lifeAction(at(720,'streetfood',{money:1000}),{kind:'streetMeal',id:'pho'}).ok,false,'thiếu tiền');
 const d=statDeltas(s,r.state);assert.ok(d.some(x=>x.key==='fullness'&&x.value>0&&x.good));assert.ok(d.some(x=>x.key==='energy'));
});
test('báo chỉ số: bỏ qua qua ngày, căng thẳng giảm là tốt',()=>{
 const s=at(600,'home');assert.deepEqual(statDeltas(s,{...s,day:3,energy:100}),[]);
 const d=statDeltas(s,{...s,stress:s.stress-10});assert.equal(d[0].key,'stress');assert.equal(d[0].good,true);
 assert.deepEqual(statDeltas(s,{...s,energy:s.energy-1}),[],'thay đổi nhỏ bỏ qua');
});
test('bỏ món đã nấu hết hạn',()=>{let s=at(600,'home');s={...s,life:{...L.lifeOf(s),meals:[{id:'x',recipe:'eggRice',cookedDay:0,expiresDay:1}]}};const r=L.lifeAction(s,{kind:'discardFood'});assert.ok(r.ok,r.error);assert.equal(L.lifeOf(r.state).meals.length,0)});
