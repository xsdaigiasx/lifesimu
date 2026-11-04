const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../.test-build/domain/life');const I=require('../.test-build/domain/inbox');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');
const at=(minute,location,extra={})=>{const s=engine.initial();return{...s,day:2,money:2e6,clock:{...clockOf(s),minute,location},...extra}};
const withPantry=s=>({...s,life:{...L.lifeOf(s),pantry:['rice','egg','fish','vegetable','pork','tofu'].map(i=>({ingredient:i,qty:5,boughtDay:s.day,expiresDay:s.day+1}))}});
test('công thức mở dần: Cơm trứng có sẵn, món khác cần Lv hoặc Mẹ chỉ',()=>{
 const s=withPantry(at(600,'home'));assert.ok(L.knowsRecipe(s,'eggRice'));for(const id of ['tofuRice','porkRice','fishRice','canhChua'])assert.equal(L.knowsRecipe(s,id),false,id);
 assert.match(L.lifeAction(s,{kind:'cook',id:'canhChua'}).error,/Chưa biết/);assert.ok(L.lifeAction(s,{kind:'cook',id:'eggRice'}).ok);
 const lv3={...s,skills:{...s.skills,cooking:{level:3,xp:0}}};assert.ok(L.knowsRecipe(lv3,'tofuRice')&&L.knowsRecipe(lv3,'porkRice'));assert.equal(L.knowsRecipe(lv3,'fishRice'),false);
 assert.equal(L.nextMomRecipe(s),'canhChua');const t=L.learnRecipe(s,'canhChua');assert.ok(L.knowsRecipe(t,'canhChua'));assert.ok(engine.valid(t));assert.equal(L.nextMomRecipe(t),'porkRice');
 assert.equal(engine.valid({...s,life:{...L.lifeOf(s),recipes:['abc']}}),false);
});
test('Mẹ chỉ món nào thì học đúng món đó',()=>{
 let s=at(1200,'home');let found;for(let d=1;d<80&&!found;d++){s=I.settleInbox({...s,day:d});found=I.inboxOf(s).queue.find(q=>q.kind==='mom-recipe')}
 assert.ok(found,'Mẹ có gửi công thức');assert.equal(found.recipe,'canhChua');assert.match(found.text,/canh chua/i);
 s=I.deliverDue({...s,day:found.day,clock:{...s.clock,minute:found.minute}}).state;const m=I.inboxOf(s).threads.me.find(x=>x.kind==='mom-recipe');
 const r=I.replyMessage(s,'me',m.id,0);assert.ok(r.ok,r.error);assert.ok(L.knowsRecipe(r.state,'canhChua'));assert.ok(engine.valid(r.state));
});
test('app ngân hàng: trả nợ ở đâu cũng được, không tốn giờ',()=>{
 let s=at(900,'park');s={...s,life:{...L.lifeOf(s),loan:{principal:1e6,balance:1015000,dueDay:30}}};
 const r=L.lifeAction(s,{kind:'repayApp',amount:500000});assert.ok(r.ok,r.error);assert.equal(clockOf(r.state).minute,900);assert.equal(L.lifeOf(r.state).loan.balance,515000);assert.equal(r.state.money,s.money-500000);
 const all=L.lifeAction(r.state,{kind:'repayApp',amount:515000});assert.ok(all.ok);assert.equal(L.lifeOf(all.state).loan,null);
 assert.equal(L.lifeAction(r.state,{kind:'repayApp',amount:600000}).ok,false,'không trả quá dư nợ');assert.equal(L.lifeAction(s,{kind:'repay',amount:1000}).ok,false,'trả ở quầy vẫn cần ra ngân hàng');
});
