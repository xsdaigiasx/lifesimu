const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../.test-build/domain/life');const H=require('../.test-build/domain/home');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');
const at=(location,extra={})=>{const s=engine.initial();return{...s,day:3,money:5e7,clock:{...clockOf(s),minute:600,location},...extra}};
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state),'state hợp lệ');assert.ok(engine.parse(JSON.stringify(r.state)));return r.state};
const withFridge=(s,tier='basic')=>{const r=H.buyHome(s,'fridge',tier);assert.ok(r.ok,r.error);return L.chillPantry(r.state)};
test('không có tủ: hạn thường; có tủ: thịt để gấp đôi, gạo không đổi',()=>{
 let s=ok(L.lifeAction(at('market'),{kind:'ingredient',id:'pork',qty:2}));assert.equal(L.lifeOf(s).pantry[0].expiresDay,4);
 s=withFridge(at('market'));s=ok(L.lifeAction(s,{kind:'ingredient',id:'pork',qty:2}));s=ok(L.lifeAction(s,{kind:'ingredient',id:'rice',qty:2}));
 const p=L.lifeOf(s).pantry;assert.deepEqual(p.find(x=>x.ingredient==='pork'),{ingredient:'pork',qty:2,boughtDay:3,expiresDay:5,cold:true});assert.equal(p.find(x=>x.ingredient==='rice').cold,undefined);
 assert.equal(H.homePrice('fridge','comfort'),4500000);assert.equal(H.homePrice('fridge','premium'),8000000);
});
test('tủ đầy thì phần dư để ngoài, hạn thường',()=>{
 let s=withFridge(at('market'));for(let i=0;i<2;i++)s=ok(L.lifeAction(s,{kind:'ingredient',id:'egg',qty:10}));s=ok(L.lifeAction(s,{kind:'ingredient',id:'egg',qty:3}));
 const eggs=L.lifeOf(s).pantry.filter(p=>p.ingredient==='egg');assert.equal(eggs.find(p=>p.cold).qty,20);const warm=eggs.find(p=>!p.cold);assert.equal(warm.qty,3);assert.equal(warm.expiresDay,3+5);
 assert.equal(L.coldUsed(L.lifeOf(s),s.day),20);assert.equal(L.stock(s,'egg'),23);
});
test('mua tủ sau: cất lô đang để ngoài, sắp hỏng trước; mẫu đắt để lâu hơn',()=>{
 let s=ok(L.lifeAction(at('market'),{kind:'ingredient',id:'vegetable',qty:2}));s=withFridge(s,'premium');const v=L.lifeOf(s).pantry[0];assert.equal(v.cold,true);assert.equal(v.expiresDay,3+6);
});
test('món nấu cất tủ để thêm ngày; dữ liệu lạ bị từ chối',()=>{
 let s=withFridge(at('home'));s={...s,life:{...L.lifeOf(s),pantry:[{ingredient:'rice',qty:2,boughtDay:3,expiresDay:30},{ingredient:'egg',qty:4,boughtDay:3,expiresDay:8}]}};
 s=ok(L.lifeAction(s,{kind:'cook',id:'eggRice'}));for(let stage=0;stage<3;stage++)s=ok(L.lifeAction(s,{kind:'cookStep',id:L.lifeOf(s).cooking.id,stage,position:L.COOK_TARGETS[stage]}));
 const m=L.lifeOf(s).meals[0];assert.equal(m.cold,true);assert.equal(m.expiresDay,3+2);
 assert.equal(engine.valid({...s,life:{...L.lifeOf(s),meals:[{...m,expiresDay:m.cookedDay+5}]}}),false);
 assert.equal(engine.valid({...s,life:{...L.lifeOf(s),pantry:[{ingredient:'egg',qty:1,boughtDay:3,expiresDay:5,cold:'yes'}]}}),false);
});
