const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const {settleInbox,deliverDue,callNpc,inboxOf,MOM_AID}=require('../.test-build/domain/inbox');
const {weekendJob,isWeekend,WEEKEND}=require('../.test-build/domain/weekend');
const base=engine.initial();
// hết tiền: Mẹ nhắn, gọi để nhận 1.000.000đ
let s={...base,day:10,money:50000};
s=settleInbox(s);assert(inboxOf(s).queue.some(q=>q.kind==='mom-aid'),'Mẹ nhắn khi hết tiền');
s=deliverDue({...s,day:11}).state;assert((inboxOf(s).threads.me??[]).some(m=>m.kind==='mom-aid'));
const c=callNpc(s,'me');assert(c.ok,c.error);assert.equal(c.state.money,s.money+MOM_AID.gift);
assert(engine.valid(c.state));assert(engine.parse(JSON.stringify(c.state)));
// không nhận hai lần
const c2=callNpc({...c.state,day:12},'me');assert(c2.ok);assert.equal(c2.state.money,c.state.money);
// trong 14 ngày không nhắn thêm; qua 14 ngày mới nhắn lại
let t=settleInbox({...c.state,day:20,money:0});assert(!inboxOf(t).queue.some(q=>q.kind==='mom-aid'&&q.day===20));
t=settleInbox({...c.state,day:26,money:0});assert(inboxOf(t).queue.some(q=>q.kind==='mom-aid'&&q.day===26));
// quá 3 ngày thì hết hạn nhận
const late=callNpc({...s,day:15},'me');assert(late.ok);assert.equal(late.state.money,s.money);
// còn tiền thì không nhắn
assert(!inboxOf(settleInbox({...base,day:10,money:5000000})).queue.some(q=>q.kind==='mom-aid'));
// ca cuối tuần
let day=base.day;while(!isWeekend(day))day++;
const w=weekendJob({...base,day,energy:80,money:0});assert(w.ok,w.error);assert.equal(w.state.money,WEEKEND.pay);assert(!weekendJob(w.state).ok);
assert(engine.valid(w.state));assert(engine.parse(JSON.stringify(w.state)));
let wd=base.day;while(isWeekend(wd))wd++;assert(!weekendJob({...base,day:wd,energy:80}).ok);
console.log('aid ok');
