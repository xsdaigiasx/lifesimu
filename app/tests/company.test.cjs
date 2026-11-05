const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const {COMPANY,checksOf,canFound,foundCompany,fundOf,monthsWorked,ownCash,validCompany}=require('../.test-build/domain/company');
const {officeOf,SIZES,activeLease}=require('../.test-build/domain/office');
const {bankOf}=require('../.test-build/domain/bank');const {defaultSkills}=require('../.test-build/domain/skill-xp');
const base=engine.initial();
// điều kiện: mới chơi thì chưa đủ
assert(!canFound(base));assert(checksOf(base).some(c=>!c.ok));assert(!foundCompany(base,{name:'X',industry:'tech'}).ok);
// dựng người chơi đủ điều kiện: đang đi làm thuê, 3 tháng chấm công, kỹ năng, uy tín, vốn
const lv=n=>({level:n,xp:0});
const ready=(over={})=>{const k=defaultSkills();k.management=lv(4);k.programming=lv(5);let s={...base,money:60000000,skills:k};
 const m=['2026-07','2026-08','2026-09'];
 s={...s,office:{...officeOf(s),role:'employee',employerId:'sen-code',tier:'junior',tierSince:0},work:{...(s.work??{version:1,seed:0,trackingDay:s.day,serial:0,active:null,task:null,finished:[],holidayDays:[],periods:[],lastResult:''}),periods:m.map(x=>({key:'sen-code:'+x,companyId:'sen-code',month:x,salary:9000000,minutes:600,paid:true,amount:1}))},side:{version:1,rep:60,seq:0,last:-1,orders:[]},...over};return s};
const r0=ready();assert.equal(monthsWorked(r0),3);
assert(canFound(r0),JSON.stringify(checksOf(r0).filter(c=>!c.ok)));
// từng điều kiện thiếu đều chặn
const miss=(patch)=>{const s={...r0,...patch};assert(!canFound(s));assert(!foundCompany(s,{name:'X',industry:'tech'}).ok)};
miss({skills:{...r0.skills,management:lv(3)}});miss({skills:{...r0.skills,programming:lv(4)}});
miss({work:{...r0.work,periods:r0.work.periods.slice(0,2)}});miss({side:{...r0.side,rep:59}});
miss({money:49999999});
// tự có = tiền mặt trừ dư nợ: 55 triệu tiền mặt nhưng nợ 40 triệu thì chưa đủ 20 triệu tự có
const debt={...r0,money:55000000,bank:{...bankOf(r0),loans:[{id:'l1',principal:40000000,months:12,startDay:0,balance:40000000,paid:0,nextDue:30,fee:0}]}};
assert.equal(ownCash(debt),15000000);assert(!canFound(debt));
const debtOk={...debt,money:70000000};assert.equal(ownCash(debtOk),30000000);assert(canFound(debtOk));
// mở công ty: nghỉ việc, vốn vào quỹ, thuê văn phòng Nhỏ từ quỹ
const f=foundCompany(r0,{name:'Công ty Lâm',industry:'tech'});assert(f.ok,f.error);const s=f.state;
assert(engine.valid(s));assert(engine.parse(JSON.stringify(s)));
assert.equal(officeOf(s).role,'owner');assert.equal(officeOf(s).size,'small');assert.equal(officeOf(s).employerId,null);assert(activeLease(s));
assert.equal(s.company.fund,COMPANY.fund-SIZES.small.rent);assert.equal(fundOf(s),s.company.fund);
assert.equal(s.money,r0.money-COMPANY.fund,'tiền cá nhân chỉ bị trừ vốn');
assert.equal(s.ledger[0].amount,-COMPANY.fund);
// không mở lần hai, không thuê khi chưa có công ty
assert(!foundCompany(s,{name:'Y',industry:'tech'}).ok);
assert(!canFound(s));
// tên, ngành không hợp lệ
assert(!foundCompany(r0,{name:'  ',industry:'tech'}).ok);assert(!foundCompany(r0,{name:'x'.repeat(33),industry:'tech'}).ok);assert(!foundCompany(r0,{name:'X',industry:'khong-co'}).ok);
// không đụng trạng thái gốc
assert.equal(officeOf(r0).role,'employee');assert.equal(r0.company,undefined);
// validator
assert(validCompany({version:1,founded:0,fund:0},5));assert(!validCompany({version:1,founded:6,fund:0},5));assert(!validCompany({version:1,founded:0,fund:-1},5));assert(!validCompany({version:2,founded:0,fund:0},5));assert(!engine.valid({...base,company:{version:1,founded:0,fund:1.5}}));
console.log('company ok');
