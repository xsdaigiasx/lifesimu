const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const {clockOf}=require('../.test-build/domain/time');
const {officeOf,COMPANIES}=require('../.test-build/domain/office');
const {lifeAction,lifeOf,depositBp,savingBp}=require('../.test-build/domain/life');
const {pmt,creditFactor,quote,bankOf,loanRoom,monthlyIncome,settleBank,validBank,dueOf,interestOf,BANK,bankAction}=require('../.test-build/domain/bank');
const at=(s,location)=>({...s,clock:{...clockOf(s),location}});
const base=at({...engine.initial(),money:20000000},'bank');
const co=Array.isArray(COMPANIES)?COMPANIES[0].id:Object.keys(COMPANIES)[0];
const job=s=>({...s,office:{...officeOf(s),role:'employee',employerId:co,tier:'junior',tierSince:0}});
// PMT: ví dụ kế hoạch 100 triệu, 12%, 12 tháng ra khoảng 8,88 triệu
assert(Math.abs(pmt(100000000,12,.12)-8884879)<5);
assert.equal(creditFactor(300),.5);assert.equal(creditFactor(850),1.2);assert(creditFactor(600)>.8&&creditFactor(600)<1);
const q=quote(1200000,12);assert.equal(q.total,q.payment*12);assert(q.interest>0);
// chưa có việc thì không vay được
assert.equal(monthlyIncome(base),0);
let r=bankAction(base,{kind:'loan',amount:1000000,months:12});assert(!r.ok);
// có việc: hạn mức = 3 × lương × hệ số, vay trong hạn mức
const w=job(base);assert(monthlyIncome(w)>0);const room=loanRoom(w);assert(room>=BANK.loanMin);
assert(!bankAction(w,{kind:'loan',amount:room+BANK.loanStep,months:12}).ok);
assert(!bankAction(at(w,'home'),{kind:'loan',amount:1000000,months:12}).ok);// phải ở quầy
assert(!bankAction(w,{kind:'loan',amount:1000000,months:7}).ok);
r=bankAction(w,{kind:'loan',amount:1000000,months:12});assert(r.ok,r.error);
let s=r.state;assert.equal(s.money,w.money+1000000);assert.equal(bankOf(s).loans.length,1);
assert(loanRoom(s)<room);// dư nợ trừ vào hạn mức
assert(engine.valid(s)&&engine.parse(JSON.stringify(s)));
// trả kỳ đúng hạn: tăng điểm, lùi hạn 30 ngày, giảm dư nợ gốc
const L=bankOf(s).loans[0],due=dueOf(L);
r=bankAction(s,{kind:'payLoan',id:L.id});assert(r.ok,r.error);
assert.equal(r.state.money,s.money-due);let b=bankOf(r.state);
assert.equal(b.loans[0].paid,1);assert.equal(b.loans[0].nextDue,L.nextDue+30);assert.equal(b.credit,BANK.creditStart+BANK.onTimeCredit);assert(b.loans[0].balance<L.balance);
// trả đủ 12 kỳ thì khoản vay đóng, tổng đã trả khớp PMT ± làm tròn
let t=r.state,paidSum=due;for(let k=1;k<12;k++){const x=bankOf(t).loans[0],d=dueOf(x);const y=bankAction(t,{kind:'payLoan',id:x.id});assert(y.ok,y.error);paidSum+=d;t=y.state}
assert.equal(bankOf(t).loans.length,0);assert(Math.abs(paidSum-q0(1000000,12))<=12);
function q0(p,m){return pmt(p,m)*m}
assert(bankOf(t).credit>BANK.creditStart);assert(engine.valid(t));
// tất toán sớm
r=bankAction(s,{kind:'payoff',id:L.id});assert(r.ok,r.error);assert.equal(bankOf(r.state).loans.length,0);assert.equal(r.state.money,s.money-(L.balance+interestOf(L.balance)));
// trễ hạn: phí một lần, hạ điểm, không âm số dư, trả xong khôi phục nhẹ
const lateDay={...s,day:L.nextDue+1,money:s.money};
let m=settleBank(lateDay);b=bankOf(m);assert.equal(b.credit,BANK.creditStart-BANK.lateCredit);assert(b.loans[0].fee>0);assert(m.stress>=lateDay.stress);
const again=settleBank({...m,day:m.day+3});assert.equal(bankOf(again).credit,b.credit);assert.equal(bankOf(again).loans[0].fee,b.loans[0].fee);// chỉ một lần mỗi kỳ
assert(!bankAction(at(again,'bank'),{kind:'loan',amount:500000,months:6}).ok);// đang trễ thì chưa vay thêm
const paidLate=bankAction(again,{kind:'payLoan',id:L.id});assert(paidLate.ok,paidLate.error);assert(bankOf(paidLate.state).loans[0].fee===0);assert(paidLate.state.money>=0);
const poor=bankAction({...again,money:0},{kind:'payLoan',id:L.id});assert(!poor.ok);// không đủ tiền thì từ chối, không âm
// tối đa 2 khoản
let two=w;for(let k=0;k<2;k++){const y=bankAction(two,{kind:'loan',amount:500000,months:6});assert(y.ok,y.error);two=y.state}
assert(!bankAction(two,{kind:'loan',amount:500000,months:6}).ok);
// điều kiện hợp lệ của save
assert(validBank(bankOf(s),s.day));assert(!validBank({...bankOf(s),credit:200},s.day));assert(!validBank({...bankOf(s),loans:[{...L,months:5}]},s.day));
// qua lifeAction (điện thoại và quầy dùng chung)
assert(lifeAction(w,{kind:'loan',amount:1000000,months:12}).ok);
// tiết kiệm kỳ hạn 3, 6, 12 tháng; sổ cũ không có rate vẫn đọc được
assert.equal(depositBp(90),100);assert.equal(depositBp(180),250);assert.equal(depositBp(360),600);
let d=lifeAction(base,{kind:'deposit',amount:1000000,term:180});assert(d.ok,d.error);
const acct=lifeOf(d.state).savings[0];assert.equal(acct.rate,250);assert.equal(savingBp(acct),250);
const early=lifeAction(d.state,{kind:'withdraw',id:acct.id});assert(early.ok);assert.equal(early.state.money,base.money-(0)+0-0+0);
const mature=lifeAction({...d.state,day:d.state.day+180},{kind:'withdraw',id:acct.id});assert(mature.ok);assert.equal(mature.state.money,d.state.money+1025000);
const legacy={...d.state,life:{...lifeOf(d.state),savings:[{id:'old',principal:1000000,openedDay:0,term:90}]}};
assert.equal(savingBp(legacy.life.savings[0]),180);assert(engine.valid(legacy)&&engine.parse(JSON.stringify(legacy)));
console.log('bank ok');
