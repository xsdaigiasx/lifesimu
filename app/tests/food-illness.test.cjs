const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../.test-build/domain/life');const T=require('../.test-build/domain/time');const {engine}=require('../.test-build/domain/engine');const V=require('../.test-build/domain/vitals');
const at=(minute,location,extra={})=>{const s=engine.initial();return{...s,day:4,money:1e6,energy:80,clock:{...T.clockOf(s),minute,location},...extra}};
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state),'state hợp lệ');assert.ok(engine.parse(JSON.stringify(r.state)));return r.state};
const finish=(s,last)=>{for(let stage=0;stage<3;stage++)s=ok(L.lifeAction(s,{kind:'cookStep',id:L.lifeOf(s).cooking.id,stage,position:stage===2&&last!==undefined?last:L.COOK_TARGETS[stage]}));return s};
test('chợ chiều: rẻ 30%, hạn ngắn hơn 1 ngày, gắn nhãn chiều',()=>{
 const am=ok(L.lifeAction(at(600,'market'),{kind:'ingredient',id:'vegetable',qty:1})),pm=ok(L.lifeAction(at(960,'market'),{kind:'ingredient',id:'vegetable',qty:1}));
 assert.equal(1e6-am.money,12000);assert.equal(1e6-pm.money,8500);const a=L.lifeOf(am).pantry[0],b=L.lifeOf(pm).pantry[0];assert.equal(a.expiresDay,6);assert.equal(b.expiresDay,5);assert.equal(b.late,true);
 const eg=ok(L.lifeAction(at(960,'market'),{kind:'ingredient',id:'egg',qty:1}));assert.equal(1e6-eg.money,5000,'trứng không có giá chiều');
});
test('rủi ro theo độ tươi và độ chín, không theo giá; Lv làm giảm',()=>{
 const stock=(s,p)=>({...s,life:{...L.lifeOf(s),pantry:p}});
 let fresh=stock(at(660,'home'),[{ingredient:'rice',qty:1,boughtDay:4,expiresDay:34},{ingredient:'egg',qty:2,boughtDay:4,expiresDay:9}]);fresh=finish(ok(L.lifeAction(fresh,{kind:'cook',id:'eggRice'})));assert.equal(L.lifeOf(fresh).meals[0].risk,undefined,'tươi và chín thì không rủi ro');
 let stale=stock(at(660,'home'),[{ingredient:'rice',qty:1,boughtDay:1,expiresDay:31},{ingredient:'egg',qty:2,boughtDay:0,expiresDay:5}]);stale=finish(ok(L.lifeAction(stale,{kind:'cook',id:'eggRice'})));assert.equal(L.lifeOf(stale).meals[0].risk,Math.round(8-1.5),'sắp hỏng 8% trừ Lv1');
 let raw=stock(at(660,'home'),[{ingredient:'rice',qty:1,boughtDay:4,expiresDay:34},{ingredient:'egg',qty:2,boughtDay:4,expiresDay:9}]);raw=finish(ok(L.lifeAction(raw,{kind:'cook',id:'eggRice'})),5);const m=L.lifeOf(raw).meals[0];assert.equal(m.raw,true);assert.equal(m.risk,Math.round(15-1.5));
 let veg=stock(at(660,'home'),[{ingredient:'vegetable',qty:2,boughtDay:0,expiresDay:5}]);veg={...veg,life:{...L.lifeOf(veg),recipes:['rauMuong']}};veg=finish(ok(L.lifeAction(veg,{kind:'cook',id:'rauMuong'})),5);assert.equal(L.lifeOf(veg).meals[0].risk,undefined,'không có đạm thì không ngộ độc');
 const street=ok(L.lifeAction(at(720,'streetfood',{fullness:20}),{kind:'eatOut',id:'comTam'}));assert.equal(L.lifeOf(street).pending,undefined);
});
test('ngộ độc phát tác sau 2–4 giờ, nhẹ tự khỏi sau 2 ngày, nặng phải điều trị và hôm sau mới khỏi',()=>{
 let s=at(700,'home',{fullness:20});s={...s,life:{...L.lifeOf(s),meals:[{id:'x',recipe:'eggRice',cookedDay:4,expiresDay:5,quality:'normal',risk:60}]}};
 let sick;for(let d=4;d<40&&!sick;d++){const t={...s,day:d,life:{...L.lifeOf(s),settledDay:d,meals:[{id:'x',recipe:'eggRice',cookedDay:d,expiresDay:d+1,quality:'normal',risk:60}]}};const r=ok(L.lifeAction(t,{kind:'eat',id:'x'}));if(L.lifeOf(r.state??r).pending)sick=r}
 assert.ok(sick,'có lúc bị');const p=L.lifeOf(sick).pending;assert.ok(p.minute>=T.clockOf(sick).minute+110&&p.minute<=T.clockOf(sick).minute+230);
 assert.equal(V.applyIllness(sick,p.minute-1),sick,'chưa tới giờ');const on=V.applyIllness(sick,p.minute);assert.ok(L.lifeOf(on).conditions.some(c=>c.id==='foodPoisoning'));assert.ok(on.energy<sick.energy);assert.equal(L.lifeOf(on).pending,undefined);
 const mild={...on,life:{...L.lifeOf(on),conditions:[{id:'foodPoisoning',sinceDay:on.day,diagnosed:false}]}};let n=L.settleLifeDay(mild,{...mild,day:mild.day+1});assert.ok(L.lifeOf(n).conditions.length===1);n=L.settleLifeDay(n,{...n,day:mild.day+2});assert.equal(L.lifeOf(n).conditions.length,0,'nhẹ tự khỏi');
 let sev={...on,life:{...L.lifeOf(on),conditions:[{id:'foodPoisoning',sinceDay:on.day,diagnosed:true,severe:true}]},clock:{...on.clock,minute:800,location:'hospital'}};assert.ok(V.vitalFactor(sev)<V.vitalFactor({...sev,life:{...L.lifeOf(sev),conditions:[{id:'foodPoisoning',sinceDay:on.day,diagnosed:true}]}}),'nặng làm việc kém hơn');
 let k=L.settleLifeDay(sev,{...sev,day:sev.day+3});assert.equal(L.lifeOf(k).conditions.length,1,'nặng không tự khỏi');
 sev=ok(L.lifeAction(sev,{kind:'treat',id:'foodPoisoning'}));assert.equal(L.lifeOf(sev).conditions.length,1,'không khỏi ngay');assert.equal(L.lifeAction(sev,{kind:'treat',id:'foodPoisoning'}).ok,false);
 k=L.settleLifeDay(sev,{...sev,day:sev.day+1});assert.equal(L.lifeOf(k).conditions.length,0,'hôm sau khỏi');
});
