const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../.test-build/domain/life');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');
const at=(extra={})=>{const s=engine.initial();return{...s,day:4,money:1e6,energy:80,clock:{...clockOf(s),minute:660,location:'home'},...extra}};
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state),'state hợp lệ');assert.ok(engine.parse(JSON.stringify(r.state)));return r.state};
const stocked=(s,list)=>({...s,life:{...L.lifeOf(s),pantry:list.map(([i,q])=>({ingredient:i,qty:q,boughtDay:4,expiresDay:4+L.INGREDIENTS[i].days}))}});
const finish=(s,pos)=>{for(let stage=0;stage<3;stage++)s=ok(L.lifeAction(s,{kind:'cookStep',id:L.lifeOf(s).cooking.id,stage,position:pos??L.COOK_TARGETS[stage]}));return s};
test('tên tự động theo nguyên liệu',()=>{
 assert.equal(L.improvName(['rice','pork','vegetable']).name,'Cơm trộn thịt rau');assert.equal(L.improvName(['tofu','vegetable','vegetable']).name,'Đậu xào rau');
 assert.equal(L.improvName(['egg','egg']).name,'Trứng rim');assert.equal(L.improvName(['vegetable','vegetable']).name,'Rau luộc');
 assert.equal(L.improvName(['fish','egg']).name,'Cá rim trứng lạ');assert.equal(L.improvName(['fish','egg']).group,'la');
});
test('món tự chế: tối đa Vừa ăn, năng lượng theo nguyên liệu, ghi Đã thử',()=>{
 let s=stocked(at(),[['rice',3],['pork',2],['vegetable',3]]);s=ok(L.lifeAction(s,{kind:'improvise',items:['rice','pork','vegetable','vegetable']}));
 assert.equal(L.lifeOf(s).cooking.custom.name,'Cơm trộn thịt rau');assert.equal(L.stock(s,'vegetable'),1);s=finish(s);
 const m=L.lifeOf(s).meals[0];assert.equal(m.quality,'normal','minigame hoàn hảo vẫn chỉ Vừa ăn');assert.equal(m.custom.energy,10+12+4+4);
 const t=L.lifeOf(s).tried;assert.equal(t.length,1);assert.equal(t[0].key,'rice+pork+vegetable+vegetable');assert.equal(t[0].result,'custom');
 assert.equal(L.lifeAction(at(),{kind:'improvise',items:['rice']}).ok,false,'ít nhất 2 phần');
});
test('đúng bộ món chưa biết thì tự khám phá; món riêng NPC thì không',()=>{
 let s=stocked(at(),[['rice',2],['egg',4],['fish',1],['vegetable',2]]);assert.equal(L.knowsRecipe(s,'canhChua'),false);
 s=ok(L.lifeAction(s,{kind:'improvise',items:['rice','fish','vegetable','vegetable']}));assert.ok(L.knowsRecipe(s,'canhChua'));assert.equal(L.lifeOf(s).learned.canhChua.by,'self');assert.equal(L.lifeOf(s).cooking.custom,undefined);
 s=finish(s);assert.equal(L.lifeOf(s).meals[0].quality,'tasty','theo công thức thì được Thơm ngon');assert.ok(s.journal.some(j=>j.title==='Học món Canh chua cá'));
 let n=stocked(at(),[['rice',2],['egg',2],['vegetable',2]]);n=ok(L.lifeAction(n,{kind:'improvise',items:['rice','egg','vegetable']}));assert.equal(L.knowsRecipe(n,'comChien'),false);assert.ok(L.lifeOf(n).cooking.custom,'Cơm chiên trứng phải học Chị Mai');
});
test('xung khắc thì Hơi cháy; rủi ro ngộ độc theo seed khi ăn',()=>{
 let s=stocked(at(),[['fish',1],['egg',2]]);s=finish(ok(L.lifeAction(s,{kind:'improvise',items:['fish','egg']})));assert.equal(L.lifeOf(s).meals[0].quality,'burnt');
 let hits=0;for(let seed=0;seed<1000;seed++)if(L.improvCustom(['pork','vegetable'],1,seed*7919).risky)hits++;assert.ok(hits>80&&hits<200,`~13,5% (${hits})`);
 let none=0;for(let seed=0;seed<200;seed++)if(L.improvCustom(['pork','vegetable'],10,seed*7919).risky)none++;assert.equal(none,0,'Lv10 không còn rủi ro');
 let r=stocked(at(),[['pork',1],['vegetable',1]]);r=finish(ok(L.lifeAction(r,{kind:'improvise',items:['pork','vegetable']})));const m=L.lifeOf(r).meals[0];r={...r,life:{...L.lifeOf(r),meals:[{...m,custom:{...m.custom,risky:true}}]},clock:{...r.clock,minute:900}};
 r=ok(L.lifeAction(r,{kind:'eat',id:m.id}));assert.ok(L.lifeOf(r).pending,'ngộ độc chờ phát tác');assert.equal(L.lifeOf(r).conditions.some(c=>c.id==='foodPoisoning'),false);
});
