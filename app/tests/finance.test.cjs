const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const P=require('../.test-build/domain/projects');
const S=require('../.test-build/domain/staff');
const F=require('../.test-build/domain/finance');
const {dateAt}=require('../.test-build/domain/format');
const sk=(p,l,g)=>({programming:p,logic:l,graphics:g,management:1,communication:1});
const emp=(id,o={})=>({id,name:id,gender:'male',age:28,origin:'x',hiredDay:0,wage:14_000_000,skills:sk(6,5,4),years:4,trust:70,risk:10,potential:50,personality:'Ngại',motive:'Ổn định',...o});
const base=(day,fund,staff,extra={})=>({...engine.initial(),day,company:{version:1,founded:0,fund,staff,...extra}});
const adv=(s,to)=>{for(let d=s.day+1;d<=to;d++)s=F.settleFinance(P.settleProjects(S.settleStaff({...s,day:d})));return s};
const proj=(o={})=>({id:'px',client:'K',title:'T',skill:'programming',lv:5,hours:30,difficulty:3,picky:0,urgent:false,traits:[],reward:6_000_000,days:20,opened:30,expires:37,accepted:30,due:50,team:[],progress:0,checks:0,ew:0,eh:0,...o});
const withP=(s,active,extra={})=>({...s,company:{...s.company,projects:{version:1,seq:5,last:s.day,offers:[],active,done:[],...extra}}});
// ngày 1 hằng tháng: 29 (1/12/2026), 60 (1/1/2027)
assert.equal(dateAt(60).getUTCDate(),1);assert.equal(dateAt(29).getUTCDate(),1);

// 1. Khoản ứng và khoản còn lại
assert.equal(F.advanceOf(6_000_000),1_800_000);
assert.equal(F.slowDays('p1'),F.slowDays('p1'),'trả chậm theo seed');
let slow=0;for(let i=0;i<500;i++){const d=F.slowDays('q'+i);if(d>0){slow++;assert(d>=F.FIN.slowMin&&d<=F.FIN.slowMax)}}assert(slow>60&&slow<140,'khoảng 1 trong 5 khách trả chậm: '+slow);
const A=emp('a');
let s=withP(base(30,1_000_000,[A]),[],{offers:[{...proj(),id:'o1',reward:6_000_000}]});
let r=P.projectAction(s,{kind:'projAccept',id:'o1'});assert(r.ok,r.error);s=r.state;
assert.equal(s.company.fund,2_800_000,'khách ứng 30% vào quỹ ngay');assert.equal(s.company.projects.active[0].adv,1_800_000);
assert.equal(s.company.finance.log[0].amount,1_800_000,'ghi vào sổ cái');
assert(engine.valid(s)&&engine.parse(JSON.stringify(s)));
// hoàn thành: phần còn lại thành khoản phải thu, quỹ không tăng
let t=withP(base(30,1_000_000,[]),[proj({adv:1_800_000,progress:30})]);
const before=t.company.fund;t=adv(t,31);
const res=t.company.projects.done[0];assert(res&&!res.canceled);
assert.equal(t.company.fund,before,'giao xong chưa nhận tiền');
assert.equal(res.owed,Math.max(0,res.pay-1_800_000));
if(res.owed>0){const rc=t.company.finance.recv[0];assert.equal(rc.amount,res.owed);assert(rc.due>=31+F.FIN.payDays,'trả sau ít nhất 30 ngày');
 assert.equal(F.incomingOf(t).length,1);
 let u=adv(t,rc.due-1);assert.equal(u.company.finance.recv.length,1,'chưa đến hạn');
 u=adv(u,rc.due);assert.equal(u.company.finance.recv.length,0);assert.equal(u.company.fund,before+res.owed,'khách trả đủ');
 assert(u.journal.some(j=>j.title==='Khách thanh toán'),'có nhật ký');assert(engine.valid(u))}
assert.deepEqual(F.settleFinance(t),t,'idempotent');

// 2. Quá hạn khách huỷ: thu hồi khoản ứng
let c=withP(base(30,5_000_000,[A]),[proj({adv:1_800_000,due:20,accepted:10})]);c=adv(c,31);
assert(c.company.projects.done[0].canceled);assert.equal(c.company.projects.done[0].adv,1_800_000);assert.equal(c.company.fund,3_200_000);
// quỹ không đủ thì chỉ thu hồi phần còn có
let c2=withP(base(30,500_000,[A]),[proj({adv:1_800_000,due:20,accepted:10})]);c2=adv(c2,31);assert.equal(c2.company.fund,0);

// 3. Lương ngày 1
let w=adv(base(58,30_000_000,[A]),60);
assert.equal(w.company.fund,16_000_000,'trả lương 14 triệu ngày 1');assert.equal(w.company.finance.debts.length,0);
assert(w.company.finance.log.some(l=>l.label==='Lương a'&&l.amount===-14_000_000));
w=adv(base(58,30_000_000,[]),60);assert.equal(w.company.fund,30_000_000,'không nhân viên thì không trả');
w=adv(base(58,30_000_000,[emp('n',{hiredDay:45})]),60);assert.equal(30_000_000-w.company.fund,7_000_000,'người mới trả theo số ngày (15/30)');
w=adv(base(58,30_000_000,[emp('x',{hiredDay:60})]),60);assert.equal(w.company.fund,30_000_000,'thuê đúng ngày 1 chưa có lương');
w=adv(base(59,30_000_000,[A]),60);const w2=adv(base(59,30_000_000,[A]),60);assert.deepEqual(w,w2,'tất định');

// 4. Nợ lương: mất tinh thần, uy tín, trả khi quỹ có lại
let d0=base(58,5_000_000,[A],{rep:50});const m0=S.workAt(A,58).morale;
let d=adv(d0,60);
assert.equal(d.company.fund,5_000_000,'không đủ thì không trả');assert.equal(d.company.finance.debts.length,1);assert.equal(d.company.finance.debts[0].amount,14_000_000);
assert.equal(d.company.rep,47,'uy tín công ty giảm 3');
assert(d.company.staff[0].work.morale<m0,'tinh thần giảm');assert(d.journal.some(j=>j.title==='Chưa đủ tiền trả lương'));
const m1=d.company.staff[0].work.morale;d=adv(d,62);assert(d.company.staff[0].work.morale<=m1,'không hồi lên khi còn nợ');
assert.equal(F.owedWages(d),14_000_000);assert.equal(F.runwayOf(d).level,'danger');
assert(engine.valid(d)&&engine.parse(JSON.stringify(d)));
d={...d,company:{...d.company,fund:20_000_000}};d=adv(d,63);
assert.equal(d.company.finance.debts.length,0,'có tiền thì trả nợ lương');assert.equal(d.company.fund,6_000_000);
// quá 7 ngày thì xin nghỉ, nợ vẫn còn, rời khỏi đội dự án
let q=withP(base(58,0,[A,emp('b')],{rep:50}),[proj({id:'pq',team:['a','b'],hours:150,due:200,days:100})]);
q=adv(q,66);assert.equal(q.company.staff.length,2,'chưa đủ 7 ngày');
q=adv(q,67);assert.equal(q.company.staff.length,0,'cả hai xin nghỉ sau 7 ngày nợ lương');
assert(q.company.finance.debts.every(x=>x.left),'nợ của người đã nghỉ được đánh dấu');
assert(q.company.projects.active[0].team.length===0,'rời khỏi đội dự án');assert(q.journal.some(j=>j.title==='a xin nghỉ'));
assert(engine.valid(q)&&engine.parse(JSON.stringify(q)));
q={...q,company:{...q.company,fund:40_000_000}};q=adv(q,68);assert.equal(q.company.finance.debts.length,0,'vẫn trả nợ người đã nghỉ');
// bù ngày dài vẫn tất định và không vượt giới hạn
const long=adv({...base(30,200_000_000,[A])},30);const jump=F.settleFinance(P.settleProjects(S.settleStaff({...long,day:400})));assert(engine.valid(jump));

// 5. Runway
const rw=(fund,staff)=>F.runwayOf(base(10,fund,staff));
assert.deepEqual(rw(28_000_000,[A]),{months:2,level:'ok'});
assert.deepEqual(rw(27_000_000,[A]),{months:1.9,level:'warn'});
assert.deepEqual(rw(13_000_000,[A]),{months:.9,level:'danger'});
assert.deepEqual(rw(5_000_000,[]),{months:null,level:'ok'});
assert.equal(F.runwayText(1.5),'1,5 tháng');assert.equal(F.runwayText(null),'Chưa có chi phí');
// chủ công ty: tính cả tiền thuê văn phòng
const own=base(10,40_000_000,[A]);own.office={...own.office,role:'owner',size:'small',leaseUntil:40};assert.equal(F.monthlyCost(own),14_000_000+4_000_000);

// 6. Hợp lệ
assert(engine.valid({...base(10,1,[A]),company:{...base(10,1,[A]).company,finance:{version:1,last:9,recv:[],debts:[],log:[]}}}));
assert(!engine.valid({...base(10,1,[A]),company:{...base(10,1,[A]).company,finance:{version:1,last:99,recv:[],debts:[],log:[]}}}),'last không vượt ngày hiện tại');
assert(!engine.valid({...base(10,1,[A]),company:{...base(10,1,[A]).company,finance:{version:1,last:9,recv:[{id:'x',title:'t',client:'c',amount:-5,due:20}],debts:[],log:[]}}}),'số tiền âm không hợp lệ');
console.log('finance.test ok');
