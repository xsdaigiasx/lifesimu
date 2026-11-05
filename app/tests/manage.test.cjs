const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const M=require('../.test-build/domain/manage');
const Pol=require('../.test-build/domain/policy');
const P=require('../.test-build/domain/projects');
const S=require('../.test-build/domain/staff');
const F=require('../.test-build/domain/finance');
const H=require('../.test-build/domain/hr');
const sk=(p,l,g)=>({programming:p,logic:l,graphics:g,management:1,communication:1});
const emp=(id,o={})=>({id,name:id,gender:'male',age:28,origin:'x',hiredDay:0,wage:14_000_000,skills:sk(6,5,4),years:4,trust:70,risk:10,potential:50,personality:'Ngại',motive:'Học hỏi',...o});
const base=(day,staff,fund=50_000_000,extra={})=>({...engine.initial(),day,company:{version:1,founded:0,fund,staff,...extra}});
const act=(s,a)=>{const r=M.manageAction(s,a);assert(r.ok,r.error);assert(engine.valid(r.state));return r.state};
const proj=(team)=>({id:'p1',client:'K',title:'T',skill:'programming',lv:5,hours:150,difficulty:3,picky:0,urgent:false,traits:[],reward:6e6,days:40,opened:50,expires:57,accepted:50,due:100,team,progress:0,checks:0,ew:0,eh:0});
const withP=(s,team)=>({...s,company:{...s.company,projects:{version:1,seq:3,last:s.day,offers:[],done:[],active:[proj(team)]}}});

// họp 1-1: tốn 20 phút, +quan hệ, 7 ngày một lần
let s=base(60,[emp('a'),emp('b')]);const b0=S.bondOf(s.company.staff[0]);
let t=act(s,{kind:'mgTalk',emp:'a'});assert(S.bondOf(t.company.staff[0])===b0+3);
assert.equal(M.manageAction(t,{kind:'mgTalk',emp:'a'}).ok,false);
t={...t,day:67};assert(M.manageAction(t,{kind:'mgTalk',emp:'a'}).ok);

// đào tạo: trừ quỹ, nửa giờ, xong +3 kinh nghiệm, 60 ngày một khoá
t=act(s,{kind:'mgTrain',emp:'a',skill:'logic'});assert.equal(t.company.fund,47_000_000);assert(t.company.finance.log[0].amount===-3_000_000);
assert.equal(M.manageAction(t,{kind:'mgTrain',emp:'a',skill:'logic'}).ok,false,'đang học');
assert.equal(M.manageAction(base(60,[emp('a')],1_000_000),{kind:'mgTrain',emp:'a',skill:'logic'}).ok,false,'thiếu quỹ');
const slow=P.settleProjects({...withP(t,['a']),day:63}),fast=P.settleProjects({...withP(s,['a']),day:63});
assert(slow.company.projects.active[0].progress<fast.company.projects.active[0].progress*.75,'đang học làm chậm');
let d=t;for(let i=61;i<=65;i++)d=M.settleManage({...d,day:i});assert(d.company.staff[0].train,'chưa hết ngày học');
d=M.settleManage({...d,day:66});assert(!d.company.staff[0].train);assert.equal(d.company.staff[0].work.exp.logic,3);assert(d.journal.some(j=>j.title==='a học xong'));
assert.equal(M.manageAction({...d,day:100},{kind:'mgTrain',emp:'a',skill:'logic'}).ok,false,'cách 60 ngày');
assert(M.manageAction({...d,day:127},{kind:'mgTrain',emp:'a',skill:'logic'}).ok);
assert.deepEqual(M.settleManage(d),d,'idempotent');

// cảnh cáo: giảm tinh thần, 3 lần thì nghỉ, hết hạn sau 90 ngày
t=act(s,{kind:'mgWarn',emp:'a'});assert.equal(t.company.staff[0].warns,1);assert(S.workAt(t.company.staff[0],60).morale<S.workAt(s.company.staff[0],60).morale);
t=act({...t,day:61},{kind:'mgWarn',emp:'a'});assert.equal(M.warnsOf(t.company.staff[0],61),2);
assert.equal(M.warnsOf(t.company.staff[0],61+91),0,'hết hiệu lực sau 90 ngày');
t=act({...t,day:62},{kind:'mgWarn',emp:'a'});assert(!t.company.staff.some(x=>x.id==='a'),'lần ba thì nghỉ');

// sa thải: bồi thường 1 tháng, rời dự án, đội giảm tinh thần, nợ lương đánh dấu, việc chờ biến mất
let f=withP(base(60,[emp('a'),emp('b')]),['a','b']);
f.company.finance={version:1,last:59,recv:[],debts:[{emp:'a',name:'a',amount:5e6,since:50}],log:[]};
f.company.hr={version:1,last:60,seq:2,pending:[{id:'h1',emp:'a',motif:'late',variant:0,day:60,expires:63}],log:[],memories:[],hooks:[]};
const mb=S.workAt(f.company.staff[1],60).morale;
const fired=act(f,{kind:'mgFire',emp:'a'});assert.equal(fired.company.fund,50_000_000-14_000_000);assert.equal(fired.company.staff.length,1);
assert.deepEqual(fired.company.projects.active[0].team,['b']);assert(S.workAt(fired.company.staff[0],60).morale<mb);
assert(fired.company.finance.debts[0].left);assert.equal(fired.company.hr.pending.length,0);
assert.equal(M.manageAction(base(60,[emp('a')],5_000_000),{kind:'mgFire',emp:'a'}).ok,false,'thiếu quỹ thì không đổi gì');
assert.equal(M.manageAction(s,{kind:'mgFire',emp:'zz'}).ok,false);assert.equal(M.manageAction({...s,company:undefined},{kind:'mgFire',emp:'a'}).ok,false);

// chính sách
let p=act(s,{kind:'mgPolicy',key:'overtime',value:true});assert.equal(Pol.policyOf(p.company).overtime,true);
const ot=P.settleProjects({...withP(p,['a']),day:63}),no=P.settleProjects({...withP(s,['a']),day:63});assert(ot.company.projects.active[0].progress>no.company.projects.active[0].progress,'làm thêm giờ nhanh hơn');
const f0=S.workAt(p.company.staff[0],60).fatigue;let q=M.settleManage({...p,day:62});assert(S.workAt(q.company.staff[0],62).fatigue>f0,'mệt hơn');assert.deepEqual(M.settleManage(q),q);
p=act(s,{kind:'mgPolicy',key:'perk',value:true});assert.equal(F.monthlyCost(p),Math.round(28_000_000*1.05));
const pay=adv=>F.settleFinance({...adv,day:60});let pf=base(59,[emp('a')],30_000_000,{policy:{perk:true,last:59}});pf=F.settleFinance({...pf,day:60});assert.equal(pf.company.fund,30_000_000-14_700_000,'lương +5% khi có phúc lợi');
p=act(s,{kind:'mgPolicy',key:'candor',value:'open'});assert.equal(p.company.policy.candor,'open');p=act(p,{kind:'mgPolicy',key:'candor',value:null});assert.equal(p.company.policy.candor,undefined);
assert.equal(M.manageAction(s,{kind:'mgPolicy',key:'candor',value:'zzz'}).ok,false);
// văn hoá thẳng thắn giảm sự kiện báo lỗi muộn
const lateCount=(candor)=>{let n=0;for(let i=0;i<300;i++){let x=withP(base(100+i,[emp('a',{personality:'Ngại'}),emp('b')],5e7,{policy:candor?{candor}:undefined}),['a']);x.company.hr={version:1,last:99+i,seq:0,pending:[],log:[],memories:[],hooks:[]};x=H.settleHr(x);if(x.company.hr.pending.some(e=>e.motif==='late'))n++}return n};
assert(lateCount('open')<lateCount('closed'),'thẳng thắn ít báo lỗi muộn');

// hợp lệ
assert(!engine.valid(base(60,[emp('a',{warns:9})])));assert(!engine.valid(base(60,[emp('a',{train:{skill:'zzz',until:3}})])));
assert(!engine.valid(base(60,[emp('a')],5e7,{policy:{candor:'x'}})));assert(engine.valid(base(60,[emp('a')],5e7,{policy:{overtime:true,candor:'open',last:59}})));
// góp vốn từ tiền cá nhân (T50)
const C=require('../.test-build/domain/company'),O=require('../.test-build/domain/office');
const own=base(60,[emp('a')],1_000_000);own.office={...O.initialOffice(),role:'owner',size:'small',leaseUntil:90};own.money=20_000_000;
let iv=C.investFund(own,10_000_000);assert(iv.ok,iv.error);assert.equal(iv.state.company.fund,11_000_000);assert.equal(iv.state.money,10_000_000);assert(engine.valid(iv.state));
assert.equal(iv.state.company.finance.log[0].amount,10_000_000);
assert.equal(C.investFund({...own,money:1_000_000},5_000_000).ok,false,'thiếu tiền cá nhân');assert.equal(C.investFund(own,7_000_000).ok,false,'số tiền không hợp lệ');
assert.equal(C.investFund({...own,office:{...own.office,role:'employee',employerId:'sen-code'}},5_000_000).ok,false);
console.log('manage.test ok');
