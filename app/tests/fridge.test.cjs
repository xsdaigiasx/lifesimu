const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../.test-build/domain/life');const H=require('../.test-build/domain/home');const O=require('../.test-build/domain/orders');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');
const at=(location,extra={})=>{const s=engine.initial();return{...s,day:3,money:5e7,clock:{...clockOf(s),minute:600,location},...extra}};
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state),'state hợp lệ');assert.ok(engine.parse(JSON.stringify(r.state)));return r.state};
const withFridge=(s,tier='basic')=>{const r=H.buyHome(s,'fridge',tier);assert.ok(r.ok,r.error);return r.state};
const home=s=>({...s,clock:{...clockOf(s),location:'home'}});
const put=(s,target,id,on=true)=>L.lifeAction(s,{kind:'fridge',target,id,put:on});

test('đồ chợ vào Tủ bếp, kể cả khi đã có tủ lạnh',()=>{
 let s=ok(L.lifeAction(withFridge(at('market')),{kind:'ingredient',id:'pork',qty:2}));
 assert.deepEqual(L.lifeOf(s).pantry,[{ingredient:'pork',qty:2,boughtDay:3,expiresDay:4}]);assert.equal(L.coldUsed(L.lifeOf(s),s.day),0);
 assert.equal(H.homePrice('fridge','comfort'),4500000);assert.equal(H.homePrice('fridge','premium'),8000000);
});
test('cất tủ lạnh: hạn dài hơn; lấy ra: hạn rút lại, không lời ngày',()=>{
 let s=ok(L.lifeAction(withFridge(at('market')),{kind:'ingredient',id:'vegetable',qty:3}));s=home(s);
 const k=L.lotKey(L.lifeOf(s).pantry[0]);s=ok(put(s,'lot',k));let p=L.lifeOf(s).pantry[0];assert.equal(p.cold,true);assert.equal(p.expiresDay,3+4);assert.equal(p.qty,3);
 s=ok(put(s,'lot',L.lotKey(p),false));p=L.lifeOf(s).pantry[0];assert.equal(p.cold,undefined);assert.equal(p.expiresDay,3+2);
 assert.equal(put({...s,clock:{...clockOf(s),location:'market'}},'lot',L.lotKey(p)).ok,false,'phải ở nhà');
 assert.equal(put(home(at('home')),'lot','egg:3:0:0').ok,false,'chưa có tủ');
});
test('sức chứa theo loại: 26 kg gạo hay 30 trứng vẫn 1 ô; đồ khô không vào tủ',()=>{
 let s=withFridge(at('market'));for(const id of ['egg','egg','egg','pork','tofu','fish','vegetable'])s=ok(L.lifeAction(s,{kind:'ingredient',id,qty:10}));
 s=ok(L.lifeAction(s,{kind:'ingredient',id:'rice',qty:10}));s=home(s);
 const lot=id=>L.lifeOf(s).pantry.find(p=>p.ingredient===id&&!p.cold);
 for(const id of ['egg','pork','tofu','fish','vegetable'])s=ok(put(s,'lot',L.lotKey(lot(id))));
 assert.equal(L.coldUsed(L.lifeOf(s),s.day),5);assert.equal(L.lifeOf(s).pantry.find(p=>p.ingredient==='egg').qty,30);
 assert.equal(put(s,'lot',L.lotKey(lot('rice'))).ok,false,'gạo để tủ bếp');
});
test('tủ đầy loại mới thì không cất được, loại đã có thì vẫn cất được',()=>{
 let s=withFridge(at('home'));const day=3;const life=L.lifeOf(s);
 const kinds=['egg','pork','tofu','fish','vegetable'];s={...s,life:{...life,pantry:[...kinds.map(id=>({ingredient:id,qty:1,boughtDay:day,expiresDay:day+1,cold:true})),{ingredient:'egg',qty:2,boughtDay:2,expiresDay:day+3}],meals:[{id:'m1',recipe:'eggRice',cookedDay:day,expiresDay:day+1,quality:'normal',cold:true},{id:'m2',recipe:'eggRice',cookedDay:day,expiresDay:day+1,quality:'normal'}]}};
 assert.ok(engine.valid(s));assert.equal(L.coldUsed(L.lifeOf(s),day),6);
 s=ok(put(s,'meal','m2'));assert.equal(L.coldUsed(L.lifeOf(s),day),6,'cùng món chiếm chung ô');
 s=ok(put(s,'lot','egg:2:0:0'));assert.equal(H.FRIDGE.basic.cap,6);
 s={...s,life:{...L.lifeOf(s),bag:[{id:'bag:9',out:'pho',day:3,expiresDay:4}]}};const r=put(s,'bag','bag:9');assert.equal(r.ok,false);assert.match(r.error,/đầy/);
});
test('món đã nấu không tự vào tủ; cất tủ thì thêm ngày, tối đa 3 ngày',()=>{
 let s=withFridge(at('home'));s={...s,life:{...L.lifeOf(s),pantry:[{ingredient:'rice',qty:2,boughtDay:3,expiresDay:30},{ingredient:'egg',qty:4,boughtDay:3,expiresDay:8}]}};
 s=ok(L.lifeAction(s,{kind:'cook',id:'eggRice'}));for(let stage=0;stage<3;stage++)s=ok(L.lifeAction(s,{kind:'cookStep',id:L.lifeOf(s).cooking.id,stage,position:L.COOK_TARGETS[stage]}));
 let m=L.lifeOf(s).meals[0];assert.equal(m.cold,undefined);assert.equal(m.expiresDay,4);
 s=ok(put(s,'meal',m.id));m=L.lifeOf(s).meals[0];assert.equal(m.cold,true);assert.equal(m.expiresDay,5);
 assert.equal(engine.valid({...s,life:{...L.lifeOf(s),meals:[{...m,expiresDay:m.cookedDay+5}]}}),false);
 assert.equal(engine.valid({...s,life:{...L.lifeOf(s),pantry:[{ingredient:'egg',qty:1,boughtDay:3,expiresDay:5,cold:'yes'}]}}),false);
});
test('món mang về: cất tủ ở nhà rời khỏi túi, ăn ở nhà; ra ngoài không ăn được',()=>{
 let s=withFridge(at('home'));s={...s,life:{...L.lifeOf(s),bag:[{id:'bag:1',out:'pho',day:3,expiresDay:4}]}};assert.ok(engine.valid(s));
 s=ok(put(s,'bag','bag:1'));assert.equal(L.bagItems(s).length,0);assert.equal(L.fridgeDishes(s).length,1);assert.equal(L.lifeOf(s).bag[0].expiresDay,5);
 assert.equal(L.lifeAction({...s,clock:{...clockOf(s),location:'market'}},{kind:'eatBag',id:'bag:1'}).ok,false);
 s=ok(L.lifeAction(s,{kind:'eatBag',id:'bag:1'}));assert.equal(L.lifeOf(s).bag.length,0);
});
test('bán tủ lạnh 55%: đồ trong tủ ra Tủ bếp, hạn tính lại',()=>{
 let s=withFridge(at('home'));const uid=H.homeOf(s).items.find(i=>i.id==='fridge');
 s={...s,life:{...L.lifeOf(s),pantry:[{ingredient:'pork',qty:2,boughtDay:3,expiresDay:5,cold:true},{ingredient:'pork',qty:1,boughtDay:3,expiresDay:4}]},home:{...H.homeOf(s),items:H.homeOf(s).items.map(i=>i.id==='fridge'?{...i,placed:false}:i)}};
 s={...s,clock:{...clockOf(s),location:'mall'}};assert.ok(engine.valid(s));
 const q=O.saleOf(s,{kind:'home',uid:H.uidOf(uid)});assert.ok(q.ok,q.error);assert.ok(q.value>0&&q.value<2500000);
 s=ok(O.sellBack(s,{kind:'home',uid:H.uidOf(uid)}));const p=L.lifeOf(s).pantry;assert.equal(p.length,1);assert.equal(p[0].qty,3);assert.equal(p[0].cold,undefined);assert.equal(p[0].expiresDay,4);
 assert.equal(H.homeOf(s).items.some(i=>i.id==='fridge'),false);
});
