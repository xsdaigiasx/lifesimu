const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const P=require('../.test-build/domain/projects');
const S=require('../.test-build/domain/staff');
const {isWorkday}=require('../.test-build/domain/work');const {clockOf}=require('../.test-build/domain/time');
const sk=(p,l,g)=>({programming:p,logic:l,graphics:g,management:1,communication:1});
const emp=(id,personality,o={})=>({id,name:id,gender:'male',age:28,origin:'x',hiredDay:0,wage:14_000_000,skills:sk(6,5,4),years:4,trust:70,risk:10,potential:50,personality,motive:'Ổn định',...o});
const base=(staff,extra={})=>({...engine.initial(),day:30,company:{version:1,founded:0,fund:1_000_000,staff,...extra}});
const adv=(s,to)=>{for(let d=s.day+1;d<=to;d++)s=P.settleProjects(S.settleStaff({...s,day:d}));return s};
const proj=(o={})=>({id:'px',client:'K',title:'T',skill:'programming',lv:5,hours:30,difficulty:3,picky:0,urgent:false,traits:[],reward:6_000_000,days:20,opened:30,expires:37,accepted:30,due:50,team:[],progress:0,checks:0,ew:0,eh:0,...o});
const withP=(s,active,extra={})=>({...s,company:{...s.company,projects:{version:1,seq:5,last:s.day,offers:[],active,done:[],...extra}}});
// 1. Dự án mới theo seed, trong giới hạn, tất định
const A=emp('a','Cầu toàn'),B=emp('b','Hay khoe');
const s0=base([A,B]);const s1=adv(s0,80);const s1b=adv(s0,80);
assert.deepEqual(s1.company.projects,s1b.company.projects,'cùng seed cùng dự án');
const ps=s1.company.projects;assert(ps.offers.length>=1&&ps.offers.length<=P.PROJ.maxOffers,'có dự án mời, không quá giới hạn');
for(const o of ps.offers){assert(o.hours>=12&&o.hours<=96&&o.lv>=1&&o.lv<=8&&o.reward>0&&o.days>=1&&o.expires>=80)}
assert(engine.valid(s1)&&engine.parse(JSON.stringify(s1)),'save hợp lệ sau khi sinh dự án');
assert.deepEqual(P.settleProjects(s1),s1,'idempotent');
// 2. Nhận dự án
let r=P.projectAction(s1,{kind:'projAccept',id:ps.offers[0].id});assert(r.ok,r.error);assert.equal(r.state.company.projects.active.length,1);assert.equal(r.state.company.projects.offers.length,ps.offers.length-1);
assert(!P.projectAction(base([]),{kind:'projAccept',id:'p0'}).ok);
const noStaff=withP(base([]),[],{offers:[{...proj(),id:'o1'}]});assert(!P.projectAction(noStaff,{kind:'projAccept',id:'o1'}).ok,'cần nhân viên');
const many=withP(base([A]),[proj({id:'a1'}),proj({id:'a2'}),proj({id:'a3'})],{offers:[{...proj(),id:'o1'}]});assert(!P.projectAction(many,{kind:'projAccept',id:'o1'}).ok,'tối đa 3 dự án');
// 3. Giao việc: giới hạn đội và tải theo tính cách
const C=emp('c','Hay giúp đỡ'),D=emp('d','Ngại'),E2=emp('e','Tham'),F=emp('f','Nóng tính');
let t=withP(base([A,C,D,E2,F]),[proj({id:'p1'}),proj({id:'p2'}),proj({id:'p3'})]);
const asg=(st,id,emp)=>{const r=P.projectAction(st,{kind:'projAssign',id,emp});return r};
r=asg(t,'p1','a');assert(r.ok);t=r.state;r=asg(t,'p2','a');assert(r.ok);t=r.state;assert(!asg(t,'p3','a').ok,'cầu toàn nhận tối đa 2 việc');
r=asg(t,'p1','c');t=r.state;r=asg(t,'p2','c');t=r.state;r=asg(t,'p3','c');assert(r.ok,'hay giúp đỡ nhận được 3 việc');t=r.state;
assert(!asg(t,'p1','a').ok,'không giao trùng');
for(const e of ['d','e','f'])if(!t.company.projects.active[0].team.includes(e)){r=asg(t,'p1',e);if(r.ok)t=r.state}
assert(t.company.projects.active[0].team.length<=P.PROJ.maxTeam);assert(!asg(t,'p1','e').ok||t.company.projects.active[0].team.length<=P.PROJ.maxTeam);
r=P.projectAction(t,{kind:'projUnassign',id:'p1',emp:'c'});assert(r.ok&&!r.state.company.projects.active[0].team.includes('c'));
// 4. Cùng một việc, hai nhân viên cho kết quả khác nhau (mục 35.5): A chắc nhưng chậm, B nhanh nhưng mệt nên nhiều lỗi
const wA={...S.initialWork(A),morale:70,fatigue:0,day:30},wB={...S.initialWork(B),morale:55,fatigue:65,day:30};
const eA={...A,skills:sk(6,5,4),work:wA},eB={...B,skills:sk(7,5,4),work:wB};
const job=proj({lv:5,team:['x']});const sa=withP(base([{...eA,id:'x'}]),[{...job,team:['x']}]),sb=withP(base([{...eB,id:'x'}]),[{...job,team:['x']}]);
const fa=P.forecast(sa,sa.company.projects.active[0]),fb=P.forecast(sb,sb.company.projects.active[0]);
assert(fb.rate>fa.rate,`B nhanh hơn: ${fb.rate} > ${fa.rate}`);assert(fb.errRate>fa.errRate,`B nhiều lỗi hơn: ${fb.errRate} > ${fa.errRate}`);
const endA=adv(sa,90),endB=adv(sb,90);const ra=endA.company.projects.done[0],rb=endB.company.projects.done[0];
assert(ra&&rb&&!ra.canceled&&!rb.canceled,'cả hai hoàn thành');assert(rb.day<=ra.day,'B xong sớm hơn hoặc cùng ngày');
// 5. Điểm kiểm tra: tốn giờ, giảm lỗi, tối đa 2 lần
let c=P.projectAction(sa,{kind:'projCheck',id:'px'});assert(c.ok,c.error);assert(clockOf(c.state).minute>clockOf(sa).minute||c.state.day>sa.day,'kiểm tra tốn giờ');
const f1=P.forecast(c.state,c.state.company.projects.active[0]);assert(f1.errRate<fa.errRate,'kiểm tra giảm lỗi');
c=P.projectAction(c.state,{kind:'projCheck',id:'px'});assert(c.ok);assert(!P.projectAction(c.state,{kind:'projCheck',id:'px'}).ok,'tối đa 2 lần');
// 6. Kết quả: tiền vào quỹ, uy tín, kinh nghiệm, tinh thần
assert(ra.pay>=Math.round(ra.reward*.3/1000)*1000*.9&&ra.pay<=ra.reward*1.1+1000);assert.equal(endA.company.fund,1_000_000+ra.pay);
const repDelta=P.PROJ.repStars[ra.stars]+(ra.late>0?P.PROJ.repLate:0);assert.equal(P.repOfCompany(endA),Math.min(100,Math.max(0,50+repDelta)));
const ex=endA.company.staff[0].work.exp;if(ra.stars>=3)assert.equal(ex.programming,1);
assert(S.expMult({exp:{programming:10}},'programming')>S.expMult({exp:{programming:4}},'programming')&&Math.abs(S.expMult({exp:{programming:99}},'programming')-1.2)<1e-9);
// 7. Không tiến độ cuối tuần; mệt tăng theo số việc đang giữ
let wk=30;while(isWorkday(wk+1))wk++;const wkend=wk+1;{const a=withP(base([{...A,work:{...S.initialWork(A),day:wk}}]),[proj({team:['a']})]);const b=adv({...a,day:wk,company:{...a.company,projects:{...a.company.projects,last:wk}}},wkend);assert(!isWorkday(wkend)&&b.company.projects.active[0].progress===0,'cuối tuần không có tiến độ')}
const one=withP(base([{...C,work:{...S.initialWork(C),day:30}}]),[proj({id:'q1',team:['c']})]),three=withP(base([{...C,work:{...S.initialWork(C),day:30}}]),[proj({id:'q1',team:['c']}),proj({id:'q2',team:['c']}),proj({id:'q3',team:['c']})]);
let d1=30;while(!isWorkday(d1+1))d1++;d1++;const f1w=adv(one,d1).company.staff[0].work.fatigue,f3w=adv(three,d1).company.staff[0].work.fatigue;assert(f3w>f1w,'giữ 3 việc mệt hơn 1 việc');
const p3=adv(three,d1).company.projects.active,p1=adv(one,d1).company.projects.active;assert(p1[0].progress>p3[0].progress,'một việc nhanh hơn khi chia 3 việc');
// 8. Không giao ai: quá hạn thì khách huỷ, mất uy tín
const idle=withP(base([A]),[proj({due:34})]);const gone=adv(idle,34+P.PROJ.grace+1);assert.equal(gone.company.projects.active.length,0);assert(gone.company.projects.done[0].canceled);assert.equal(P.repOfCompany(gone),50+P.PROJ.repCancel);
// 9. Trễ hạn bị trừ tiền và sao
const slow=withP(base([{...D,skills:sk(2,2,2),work:{...S.initialWork(D),day:30}}]),[proj({lv:5,hours:40,due:34,team:['d']})]);const late=adv(slow,34+P.PROJ.grace+30);const lr=late.company.projects.done[0];if(!lr.canceled){assert(lr.late>0&&lr.pay<lr.reward)}
// 10. Save: tương thích và từ chối dữ liệu xấu
assert(engine.valid(withP(base([A]),[proj({team:['a']})])));assert(engine.valid(base([A])),'save không có projects, rep vẫn hợp lệ');
assert(!engine.valid(withP(base([A]),[proj({progress:-1})])));assert(!engine.valid(withP(base([A]),[proj({checks:9})])));assert(!engine.valid({...base([A]),company:{...base([A]).company,rep:101}}));
console.log('projects ok');
