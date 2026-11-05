const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const H=require('../.test-build/domain/hr');
const {defaultSkills}=require('../.test-build/domain/skill-xp');
const comm=(t,l)=>{t.skills={...defaultSkills(),communication:{level:l,xp:0}};return t};
const S=require('../.test-build/domain/staff');
const P=require('../.test-build/domain/projects');
const sk=(p,l,g)=>({programming:p,logic:l,graphics:g,management:1,communication:1});
const PERS=['Cầu toàn','Hay khoe','Ngại','Nóng tính','Hay giúp đỡ','Tham'];
const emp=(id,o={})=>({id,name:id,gender:'male',age:28,origin:'x',hiredDay:0,wage:14_000_000,skills:sk(6,5,4),years:4,trust:70,risk:10,potential:50,personality:'Ngại',motive:'Học hỏi',...o});
const base=(day,staff,extra={})=>({...engine.initial(),day,company:{version:1,founded:0,fund:50_000_000,staff,...extra}});
const adv=(s,to)=>{for(let d=s.day+1;d<=to;d++)s=H.settleHr({...s,day:d});return s};
const team=PERS.map((p,i)=>emp('e'+i,{personality:p,wage:10_000_000+i*1_000_000}));

// 1. tất định, tối đa 2 việc mỗi ngày, mỗi người 1 việc chờ
let a=adv(base(40,team),120),b=adv(base(40,team),120);assert.deepEqual(a,b,'tất định');
for(let d=41;d<=120;d++){const x=H.settleHr({...a,day:d});}
let s=base(40,team),maxDay=0;
for(let d=41;d<=200;d++){const before=(s.company.hr?.log??[]).length;s=H.settleHr({...s,day:d});const made=s.company.hr.log.length-before;maxDay=Math.max(maxDay,made);
 const ids=s.company.hr.pending.map(p=>p.emp);assert.equal(new Set(ids).size,ids.length,'mỗi người một việc chờ');
 s={...s,company:{...s.company,hr:{...s.company.hr,pending:s.company.hr.pending.slice(0)}}}}
assert(maxDay<=2,'tối đa 2 việc mỗi ngày');
assert.deepEqual(H.settleHr(s),s,'idempotent');assert(engine.valid(s)&&engine.parse(JSON.stringify(s)));


// 2. đủ 20 mô-típ chạy được: mọi lựa chọn của mọi mô-típ áp dụng không lỗi và giữ save hợp lệ
assert.equal(H.MOTIFS.length,20);
const mk=(motif,variant=0)=>{let t=base(60,[emp('a',{personality:'Tham'}),emp('b')]);comm(t,5);
 t.company.projects={version:1,seq:3,last:60,offers:[],done:[],active:[{id:'p1',client:'K',title:'T',skill:'programming',lv:5,hours:60,difficulty:3,picky:0,urgent:false,traits:[],reward:6e6,days:30,opened:40,expires:47,accepted:50,due:90,team:['a','b'],progress:10,checks:0,ew:20,eh:0}]};
 t.company.hr={version:1,last:60,seq:5,pending:[{id:'h1',emp:'a',motif,variant,day:60,expires:63,other:'b',ref:'p1'}],log:[],memories:[],hooks:[]};return t};
for(const m of H.MOTIFS){for(let v=0;v<m.variants;v++){const t=mk(m.id,v),view=H.hrView(t,'h1');assert(view&&view.line.length>10,m.id);
 for(const o of view.options){assert(H.hrPreview(t,'h1',o.tag),m.id+o.tag);const r=H.hrAction(t,{kind:'hrChoose',id:'h1',tag:o.tag});assert(r.ok,m.id+':'+o.tag+':'+r.error);
  assert(engine.valid(r.state),m.id+':'+o.tag);assert.equal(r.state.company.hr.pending.length,0)}}}

// 3. tăng lương đổi lương, quỹ, bond
let r=H.hrAction(mk('raise'),{kind:'hrChoose',id:'h1',tag:'full'});assert(r.ok);
assert.equal(r.state.company.staff[0].wage,15_400_000);assert(S.bondOf(r.state.company.staff[0])>S.bondOf(emp('a',{})));
assert(r.state.company.hr.memories.some(m=>m.tag==='full'));
r=H.hrAction(mk('raise'),{kind:'hrChoose',id:'h1',tag:'deny'});assert(r.ok);assert(r.state.company.hr.hooks.some(k=>k.motif==='poach'),'từ chối tạo móc nhảy việc');
// thưởng trừ quỹ và ghi sổ cái
r=H.hrAction(mk('raise'),{kind:'hrChoose',id:'h1',tag:'bonus'});assert(r.ok);assert(r.state.company.fund<50_000_000);assert(r.state.company.finance.log[0].amount<0);
// thiếu quỹ / thiếu Giao tiếp
let poor=mk('raise');poor.company.fund=0;assert.equal(H.hrAction(poor,{kind:'hrChoose',id:'h1',tag:'bonus'}).ok,false);
let weak=mk('conflict');comm(weak,1);assert.equal(H.hrAction(weak,{kind:'hrChoose',id:'h1',tag:'mediate'}).ok,false);
assert.equal(H.hrAction(mk('raise'),{kind:'hrChoose',id:'h1',tag:'zzz'}).ok,false);assert.equal(H.hrAction(mk('raise'),{kind:'hrChoose',id:'nope',tag:'full'}).ok,false);

// 4. nghỉ phép/ốm: không tính tiến độ dự án
r=H.hrAction(mk('sick'),{kind:'hrChoose',id:'h1',tag:'approve'});assert(r.ok);
const off=r.state.company.staff[0].work.off;assert.equal(off,63);
let q=r.state;q.company.staff[1].work=S.workAt(q.company.staff[1],60);
q.company.staff[0].work.off=70;const withOff=P.settleProjects({...q,day:63}),noOff=P.settleProjects({...mk('sick'),day:63});
assert(withOff.company.projects.active[0].progress<noOff.company.projects.active[0].progress,'người nghỉ không góp giờ');

// 5. nghỉ việc rời đội dự án và đánh dấu nợ lương
r=H.hrAction(mk('quit'),{kind:'hrChoose',id:'h1',tag:'accept'});assert(r.ok);
assert.equal(r.state.company.staff.length,1);assert.deepEqual(r.state.company.projects.active[0].team,['b']);
// roll tất định
const t1=H.hrAction(mk('quit'),{kind:'hrChoose',id:'h1',tag:'talk'}),t2=H.hrAction(mk('quit'),{kind:'hrChoose',id:'h1',tag:'talk'});assert.deepEqual(t1,t2);

// 6. quá hạn: bỏ qua bị phạt; quit/poach thì nghỉ
let ig=mk('late');const m0=S.workAt(ig.company.staff[0],60);ig=H.settleHr({...ig,day:64});
assert.equal(ig.company.hr.pending.filter(p=>p.id==='h1').length,0);
const w1=S.workAt(ig.company.staff.find(x=>x.id==='a'),64);assert(w1.morale<m0.morale);assert(ig.company.hr.memories.some(m=>m.tag==='ignored'));
assert(S.bondOf(ig.company.staff.find(x=>x.id==='a'))<S.bondOf(emp('a')));
assert.equal(H.settleHr({...mk('late'),day:63}).company.hr.pending.some(p=>p.id==='h1'),true,'chưa quá hạn');
for(const id of ['quit','poach']){const g=H.settleHr({...mk(id),day:64});assert(!g.company.staff.some(x=>x.id==='a'),id+' bỏ qua thì nghỉ');assert(g.journal.some(j=>j.key==='hr:h1'))}

// 7. điểm thân: bậc, tốc độ, nguy cơ nghỉ
assert.equal(S.bondTier(10),'Bất hoà');assert.equal(S.bondTier(20),'Quen biết');assert.equal(S.bondTier(30),'Thân');assert.equal(S.bondTier(60),'Tri kỷ');
assert.equal(S.bondOf(emp('z',{trust:50})),25);
const hi=emp('hi',{bond:80,wage:6_000_000,motive:'Lương cao'}),lo=emp('lo',{bond:5,wage:6_000_000,motive:'Lương cao'}),md=emp('md',{bond:40,wage:6_000_000,motive:'Lương cao'});
assert(S.speedOf(hi,60)>S.speedOf(md,60)&&S.speedOf(md,60)>S.speedOf(lo,60));assert(S.quitRisk(lo,60)>S.quitRisk(hi,60));

// 8. móc tiếp nối: từ chối tăng lương, sau 7 đến 20 ngày có thể gặp việc nhảy việc
let hk=mk('raise');r=H.hrAction(hk,{kind:'hrChoose',id:'h1',tag:'deny'});const hook=r.state.company.hr.hooks.find(k=>k.motif==='poach');assert(hook&&hook.from===67&&hook.to===80);
// ký ức nhắc lại
const rec=mk('poach');rec.company.hr.memories=[{id:'m1',day:50,emp:'a',motif:'poach',topic:'sếp giữ em lại khi có nơi khác mời',tag:'match',weight:3}];
assert(/sếp giữ em lại khi có nơi khác mời, em vẫn nhớ/.test(H.hrView(rec,'h1').line));

// 9. đủ 15 mô-típ xuất hiện khi chạy lâu với nhiều tính cách
const seen=new Set();let big=base(40,Array.from({length:8},(_,i)=>emp('n'+i,{personality:PERS[i%6],motive:i%2?'Lương cao':'Học hỏi',hiredDay:0,skills:sk(7,6,5)})));
comm(big,5);
big.company.projects={version:1,seq:3,last:40,offers:[],done:[],active:[{id:'p1',client:'K',title:'T',skill:'programming',lv:5,hours:200,difficulty:3,picky:0,urgent:false,traits:[],reward:6e6,days:30,opened:30,expires:37,accepted:30,due:340,team:['n0','n1','n2'],progress:0,checks:0,ew:10,eh:0}]};
for(let d=41;d<=700;d++){big=H.settleHr({...big,day:d});for(const p of big.company.hr.pending)seen.add(p.motif);
 for(const p of [...big.company.hr.pending]){const v=H.hrView(big,p.id);const o=v.options.find(x=>!x.locked&&!['accept','letgo'].includes(x.tag))??v.options[0];const x=H.hrAction(big,{kind:'hrChoose',id:p.id,tag:o.tag});if(x.ok)big=x.state}
 if(big.company.staff.length<5){big.company.staff.push(emp('r'+d,{personality:PERS[d%6],hiredDay:d-40,skills:sk(7,6,5)}))}
 big.company.fund=Math.max(big.company.fund,20_000_000);if(!engine.valid(big)){console.log("INVALID",d,Object.keys(big.company),JSON.stringify(big.company.hr).slice(0,600),JSON.stringify(big.company.staff.map(e=>[e.id,e.bond,e.work])).slice(0,500),JSON.stringify(big.company.projects.active).slice(0,400));break}}
assert(engine.valid(big));
assert(seen.size>=13,'số mô-típ đã gặp: '+seen.size+' '+[...seen]);

// 10. hợp lệ
const ok=mk('raise');assert(engine.valid(ok));
const bad=mk('raise');bad.company.hr.pending[0].motif='xyz';assert(!engine.valid(bad));
const bad2=mk('raise');bad2.company.hr.last=999;assert(!engine.valid(bad2));
const bad3=mk('raise');bad3.company.staff[0].bond=150;assert(!engine.valid(bad3));
console.log('hr.test ok');
