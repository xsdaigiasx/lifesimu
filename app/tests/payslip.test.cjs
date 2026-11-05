const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const W=require('../.test-build/domain/work');
const F=require('../.test-build/domain/finance');
const S=require('../.test-build/domain/staff');
const P=require('../.test-build/domain/projects');
const L=require('../.test-build/domain/payslip');
const {dateAt}=require('../.test-build/domain/format');
const sk={programming:6,logic:5,graphics:4,management:1,communication:1};
const emp=(id,o={})=>({id,name:id,gender:'male',age:28,origin:'x',hiredDay:0,wage:10_000_000,skills:sk,years:4,trust:70,risk:10,potential:50,personality:'Ngại',motive:'Ổn định',...o});
const base=(day,fund,staff,extra={})=>({...engine.initial(),day,company:{version:1,founded:0,fund,staff,...extra}});

// ngày 1: 29 (1/12/2026), 60 (1/1/2027); mùng 1 tháng sau của kỳ 2026-11 là ngày 29
assert.equal(dateAt(29).getUTCDate(),1);assert.equal(dateAt(60).getUTCDate(),1);
assert.equal(L.payDayOf('2026-11'),29);assert.equal(L.payDayOf('2026-12'),60);assert.equal(L.monthLabel('2026-11'),'11/2026');

// 1. Bảng lương người chơi: đọc từ WagePeriod, không đổi số
const std=W.standardMinutes('2026-11');
const s0={...engine.initial(),day:20,work:{...W.workOf(engine.initial()),periods:[
 {key:'sen-code:2026-10',companyId:'sen-code',month:'2026-10',salary:12_000_000,minutes:480*10,paid:true,amount:5_000_000,bonus:0},
 {key:'sen-code:2026-11',companyId:'sen-code',month:'2026-11',salary:12_000_000,minutes:std/2,paid:false,amount:0,bonus:300_000}]}};
assert(engine.valid(s0)&&engine.parse(JSON.stringify(s0)),'save có kỳ lương hợp lệ');
const slips=L.payslipsOf(s0);assert.equal(slips.length,2);assert.equal(slips[0].month,'2026-11','tháng mới trước');
const cur=slips[0];assert.equal(cur.base,Math.round(12_000_000*(std/2)/std));assert.equal(cur.bonus,300_000);assert.equal(cur.total,cur.base+300_000);assert.equal(cur.paid,false);
assert.equal(cur.days,Math.round(std/2/480));assert.equal(cur.stdDays,std/480);assert.equal(cur.payDay,29);
assert.equal(W.pendingWages(s0),cur.total,'khớp lương tích luỹ hiện có');
assert.equal(slips[1].paid,true);assert.equal(slips[1].total,5_000_000,'kỳ đã trả lấy số đã nhận');
assert.deepEqual(L.payslipsOf(engine.initial()),[],'chưa có kỳ nào');

// 2. Tháng sau: lương ngày 1 vẫn đúng số, thông báo có tháng
const n=W.settleNewDay({...s0,day:28},{...s0,day:29});
assert.equal(L.payslipsOf(n)[0].paid,true);assert.equal(L.payslipsOf(n)[0].total,cur.total);
const j=n.journal.find(x=>x.title==='Nhận lương');assert(j&&j.detail.startsWith('Nhận lương tháng 11/2026:'),j&&j.detail);

// 3. Bảng lương công ty: dự kiến ngày 1 tới = đúng số settleFinance sẽ trả
const A=emp('a'),B=emp('b',{wage:8_000_000,hiredDay:10});
let c=base(20,100_000_000,[A,B],{policy:{perk:true}});
const nx=L.nextPayroll(c);assert.equal(nx.day,29);assert.equal(nx.mult,1.05);assert.equal(nx.rows.length,2);
assert.equal(nx.rows[0].amount,F.wageAmount(A,29,c.company));assert.equal(nx.total,nx.rows[0].amount+nx.rows[1].amount);
assert.equal(nx.rows[0].wage,10_000_000);
const fund0=c.company.fund;let d=c;for(let x=21;x<=29;x++)d=F.settleFinance(S.settleStaff({...d,day:x}));
assert.equal(fund0-d.company.fund,nx.total,'quỹ giảm đúng tổng dự kiến');
const lp=L.lastPayroll(d);assert(lp&&lp.day===29);assert.equal(lp.total,nx.total);assert.equal(lp.rows.length,2);
const note=d.journal.find(x=>x.title==='Đã trả lương');assert(note&&note.detail.includes('2 người'),note&&note.detail);
assert.equal(L.lastPayroll(base(5,1e6,[A])),null,'chưa trả kỳ nào');
assert.deepEqual(L.nextPayroll(base(5,1e6,[])).rows,[]);
assert(engine.valid(d)&&engine.parse(JSON.stringify(d)),'save hợp lệ sau trả lương');
// settle idempotent
const again=F.settleFinance(d);assert.equal(again.company.fund,d.company.fund);
console.log('payslip ok');
