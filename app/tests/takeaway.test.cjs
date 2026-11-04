const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../.test-build/domain/life');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');
const {fullnessOf}=require('../.test-build/domain/vitals');
const at=(minute,location,extra={})=>{const s=engine.initial();return{...s,day:2,money:1e6,fullness:30,clock:{...clockOf(s),minute,location},...extra}};
test('mang về: giá +10%, vào túi hạn 1 ngày, không tăng no ngay, save hợp lệ',()=>{
 const s=at(720,'streetfood'),r=L.lifeAction(s,{kind:'eatOut',id:'comTam',takeaway:true});assert.ok(r.ok,r.error);
 assert.equal(r.state.money,s.money-L.takeawayPrice('comTam'));assert.equal(L.takeawayPrice('comTam'),Math.round(L.EAT_OUT.comTam.price*1.1));
 assert.ok(fullnessOf(r.state)<=fullnessOf(s),'chưa ăn nên không tăng no');const it=L.bagItems(r.state);assert.equal(it.length,1);assert.equal(it[0].expiresDay,s.day+1);
 assert.ok(engine.valid(r.state));assert.ok(engine.parse(JSON.stringify(r.state)));
 assert.equal(L.lifeAction(at(720,'home'),{kind:'eatOut',id:'comTam',takeaway:true}).ok,false,'phải ở quán');
});
test('túi mặc định 3 món, ba lô 8 món, đầy thì báo rõ',()=>{
 let s=at(600,'streetfood');for(let i=0;i<3;i++){const r=L.lifeAction(s,{kind:'eatOut',id:'banhMi',takeaway:true});assert.ok(r.ok,r.error);s=r.state}
 assert.equal(L.bagCap(s),3);const full=L.lifeAction(s,{kind:'eatOut',id:'banhMi',takeaway:true});assert.equal(full.ok,false);assert.match(full.error,/Túi đã đầy/);
 const owned={...s,life:{...L.lifeOf(s),owned:['backpack']}};assert.equal(L.bagCap(owned),8);assert.ok(L.lifeAction(owned,{kind:'eatOut',id:'banhMi',takeaway:true}).ok);assert.ok(engine.valid(owned));
});
test('ăn món trong túi ở bất kỳ đâu: tăng no, bỏ khỏi túi, chung luật no; hết hạn thì không ăn được',()=>{
 let s=at(600,'streetfood');s=L.lifeAction(s,{kind:'eatOut',id:'comTam',takeaway:true}).state;const id=L.bagItems(s)[0].id;
 const out={...s,clock:{...clockOf(s),location:'bank'}},r=L.lifeAction(out,{kind:'eatBag',id});assert.ok(r.ok,r.error);assert.ok(fullnessOf(r.state)>fullnessOf(out)+40);assert.equal(L.bagItems(r.state).length,0);assert.ok(engine.valid(r.state));
 assert.equal(L.lifeAction({...out,fullness:95},{kind:'eatBag',id}).ok,false,'đang no');
 assert.equal(L.lifeAction({...out,day:out.day+1,life:{...out.life,settledDay:out.day+1}},{kind:'eatBag',id}).ok,false,'sang ngày sau thì món mang về hết hạn');
});
