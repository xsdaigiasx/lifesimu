const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const H=require('../.test-build/domain/hr');
const S=require('../.test-build/domain/staff');
const P=require('../.test-build/domain/projects');
const M=require('../.test-build/domain/manage');
const HI=require('../.test-build/domain/hiring');
const ST=require('../.test-build/domain/strain');
const {defaultSkills}=require('../.test-build/domain/skill-xp');
const sk=(p,l,g)=>({programming:p,logic:l,graphics:g,management:1,communication:1});
const emp=(id,o={})=>({id,name:id,gender:'male',age:28,origin:'x',hiredDay:0,wage:14_000_000,skills:sk(6,5,4),years:4,trust:70,risk:10,potential:50,personality:'Ngại',motive:'Học hỏi',...o});
const base=(day,staff,extra={})=>({...engine.initial(),day,company:{version:1,founded:0,fund:80_000_000,staff,...extra}});
const proj=(o={})=>({id:'px',client:'K',title:'T',skill:'programming',lv:5,hours:40,difficulty:3,picky:0,urgent:false,traits:[],reward:9_000_000,days:20,opened:20,expires:27,accepted:20,due:60,team:['a'],progress:0,checks:0,ew:0,eh:0,...o});
const withP=(s,active,extra={})=>({...s,company:{...s.company,projects:{version:1,seq:5,last:s.day,offers:[],active,done:[],...extra}}});
const CLK=()=>({minute:600,location:'office',lastWorkDay:-1,lastStudyDay:-1,lastRestDay:-1});
const mid=(s,o={})=>withP(s,[proj({progress:20,...o})]);

// 1. Độ biết ban đầu
assert.equal(HI.KNOW.start,20);assert.equal(HI.startKnow(undefined),20);
assert.equal(HI.startKnow({q:{programming:2},test:{programming:1},sit:1}),20+2+3+3);
assert.equal(HI.startKnow({cv:1,sit:1,mot:1,ref:1,q:{programming:5,logic:5},test:{programming:1,logic:1}}),20+HI.KNOW.interviewMax,'tối đa 15');
const a0=base(23,[emp('a'),emp('z',{know:99})]);
assert.equal(S.knowOf(a0.company.staff[0]),20,'thiếu thì mặc định');assert.equal(S.knowOf(a0.company.staff[1]),99);
assert(engine.valid(withP(a0,[proj()]))&&!engine.valid(base(23,[emp('a',{know:101})])),'validator độ biết 0–100');

// 2. Tăng theo ngày làm (ngày 24, 25, 28 là ngày làm; 22 nghỉ lễ), thân hơn thì nhanh hơn
const run=(s,to)=>{for(let d=s.day+1;d<=to;d++)s=P.settleProjects({...s,day:d});return s};
let t=run(withP(base(23,[emp('a')]),[proj({progress:0})]),28);
assert.equal(S.knowOf(t.company.staff[0]),23,'+1 mỗi ngày làm: '+S.knowOf(t.company.staff[0]));
t=run(withP(base(23,[emp('a',{bond:30}),emp('b',{bond:60})]),[proj({team:['a','b'],progress:0,hours:200})]),28);
assert.equal(S.knowOf(t.company.staff[0]),23.6,'Thân ×1,2');assert.equal(S.knowOf(t.company.staff[1]),24.5,'Tri kỷ ×1,5');
const idle=run(base(23,[emp('a')]),28);assert.equal(S.knowOf(idle.company.staff[0]),20,'không làm chung thì không tăng');
// họp 1-1 +4
let o=base(30,[emp('a')]);o.clock=CLK();
const r1=M.manageAction(o,{kind:'mgTalk',emp:'a'});assert(r1.ok,r1.error);assert.equal(S.knowOf(r1.state.company.staff[0]),24);
// xong dự án +6 (cộng thêm +1 ngày làm)
t=run(withP(base(23,[emp('a')]),[proj({hours:12,progress:11.5})]),24);
assert.equal(t.company.projects.done.length,1,'xong dự án');assert.equal(S.knowOf(t.company.staff[0]),20+1+6,'+6 khi xong');
assert.deepEqual(t.company.projects.done[0].team,['a']);assert.equal(t.company.projects.done[0].lv,5);
assert(engine.valid(t)&&engine.parse(JSON.stringify(t)),'save hợp lệ sau dự án');

// 3. Dự đoán: khoảng rộng và lệch khi độ biết thấp
const N=400,stat=know=>{let w=0,out=0,err=0;for(let i=0;i<N;i++){const b=P.bandOf(10,know,'s'+i);w+=b.hi-b.lo;if(10<b.lo||10>b.hi)out++;err+=Math.abs((b.lo+b.hi)/2-10)}return{w:w/N,out:out/N,err:err/N}};
const lo=stat(20),mdl=stat(60),hi=stat(95);
assert(lo.w>mdl.w&&mdl.w>hi.w,'khoảng hẹp dần: '+[lo.w,mdl.w,hi.w]);
assert(lo.err>mdl.err&&mdl.err>hi.err,'tâm lệch giảm dần');
assert(lo.out>.1&&hi.out===0,'độ biết thấp thì thực tế hay trượt khỏi khoảng: '+lo.out+' / '+hi.out);
assert.deepEqual(P.bandOf(10,50,'x'),P.bandOf(10,50,'x'),'cùng seed cho cùng dự đoán');
const fa=P.forecast(mid(base(30,[emp('a',{know:20})])),mid(base(30,[emp('a',{know:20})])).company.projects.active[0]);
const fb=P.forecast(mid(base(30,[emp('a',{know:95})])),mid(base(30,[emp('a',{know:95})])).company.projects.active[0]);
assert(fa.range.days&&fb.range.days);assert(fa.range.days.hi-fa.range.days.lo>=fb.range.days.hi-fb.range.days.lo,'khoảng ngày');
assert(fa.range.err.hi-fa.range.err.lo>fb.range.err.hi-fb.range.err.lo,'khoảng lỗi');assert.equal(fa.know,20);assert.equal(fb.know,95);
assert(fb.range.days.lo<=fb.range.trueDays&&fb.range.trueDays<=fb.range.days.hi,'độ biết cao thì sát thực tế');
// mỗi lần kiểm tra như thêm độ biết
const sc=mid(base(30,[emp('a',{know:20})]),{checks:2});assert.equal(P.forecast(sc,sc.company.projects.active[0]).know,50);

// 4. Cùng một việc, hai người khác nhau cho kết quả khác nhau (bảng 35.1/35.5)
const job={skill:'programming',lv:5};
const A=emp('A',{personality:'Cầu toàn',skills:sk(6,5,4),work:{morale:70,loyalty:60,fatigue:0,ambition:55,day:30}});
const B=emp('B',{personality:'Hay khoe',skills:sk(7,5,4),work:{morale:55,loyalty:60,fatigue:65,ambition:70,day:30}});
assert(S.speedOf(B,30,job)>S.speedOf(A,30,job),'B nhanh hơn');assert(S.errorOf(B,30,job)>S.errorOf(A,30,job),'B nhiều lỗi hơn vì mệt');

// 5. Sự kiện giữa việc theo tính cách
const PERS={stuck:'Ngại',polish:'Cầu toàn',demand:'Tham',scope:'Hay khoe',clash:'Nóng tính'};
const ctx=(e,s)=>({s,e,day:s.day,bond:30,comm:3,ps:s.company.projects,proj:s.company.projects.active.find(p=>p.team.includes(e.id)),variant:0});
for(const[id,pers]of Object.entries(PERS)){
 const m=H.motifOf(id);assert(m,id);
 for(const p of ['Cầu toàn','Hay khoe','Ngại','Nóng tính','Hay giúp đỡ','Tham']){
  const e=emp('a',{personality:p}),s=mid(base(30,[e]));
  const w=m.weight(ctx(s.company.staff[0],s));assert(p===pers?w>0:w===0,`${id} ${p}: ${w}`)}
 const e=emp('a',{personality:pers}),early=mid(base(30,[e]),{progress:3}),late=mid(base(30,[e]),{progress:39});
 assert.equal(m.weight(ctx(early.company.staff[0],early)),0,id+' chưa chạy đủ');assert.equal(m.weight(ctx(late.company.staff[0],late)),0,id+' gần xong');
 const idle=base(30,[e]);idle.company.projects={version:1,seq:0,last:30,offers:[],active:[],done:[]};assert.equal(m.weight(ctx(idle.company.staff[0],idle)),0,id+' không có dự án');
 assert(m.options(ctx(mid(base(30,[e])).company.staff[0],mid(base(30,[e])))).length>=3,id+' có lựa chọn');
}
const choose=(motif,pers,tag,o={})=>{const e=emp('a',{personality:pers,...o});let s=mid(base(30,[e]));s.company.hr={version:1,last:30,seq:1,pending:[{id:'h1',emp:'a',motif,variant:0,day:30,expires:33,ref:'px'}],log:[],memories:[],hooks:[]};
 s.clock=CLK();const r=H.hrAction(s,{kind:'hrChoose',id:'h1',tag});assert(r.ok,r.error);assert(engine.valid(r.state)&&engine.parse(JSON.stringify(r.state)),motif+':'+tag+' save hợp lệ');return r.state};
let c=choose('polish','Cầu toàn','extend');assert.equal(c.company.projects.active[0].due,62);assert.equal(c.company.rep,49);assert(c.company.hr.memories[0].topic.includes('thêm thời gian'));
c=choose('polish','Cầu toàn','cut');assert.equal(c.company.projects.active[0].hours,35);assert.equal(c.company.projects.active[0].reward,8_280_000);
c=choose('scope','Hay khoe','allow');assert.equal(c.company.projects.active[0].hours,44);assert.equal(c.company.projects.active[0].reward,9_450_000);
c=choose('stuck','Ngại','sync');assert.equal(c.company.projects.active[0].progress,22,'họp nhanh gỡ vướng cộng tiến độ');assert.equal(S.knowOf(c.company.staff[0]),23,'họp nhanh cộng độ biết');
c=choose('stuck','Ngại','help');assert.equal(c.company.fund,77_900_000,'thêm người tốn quỹ');assert.equal(c.company.projects.active[0].progress,24,'thêm người cộng tiến độ');
c=choose('stuck','Ngại','check');assert(c.company.projects.active[0].ew<=0);
c=choose('demand','Tham','bonus');assert(c.company.fund<80_000_000);
c=choose('clash','Nóng tính','swap',{});assert.equal(c.company.projects.active[0].team.length,1,'một người thì không đổi được');
// sinh sự kiện: Ngại đang làm dự án giữa chừng thì sớm muộn có 'stuck'
let g=mid(base(30,[emp('a')]));let seen=false;for(let d=31;d<=120&&!seen;d++){g=H.settleHr({...g,day:d});seen=g.company.hr.log.some(l=>l.motif==='stuck');if(g.company.hr.pending.length)g.company.hr.pending=[]}
assert(seen,'sự kiện giữa việc sinh ra theo tính cách');

// 6. Sau việc: quá sức, quá dễ, ký ức, kiệt sức, chán
const fake=(e)=>{const s=base(40,[e]);const w=S.workAt(e,40);const m=new Map([[e.id,w]]);return{s,m,get:x=>m.get(x.id),set:(id,v)=>m.set(id,v)}};
{const e=emp('a',{skills:sk(3,3,3),work:{morale:60,loyalty:60,fatigue:10,ambition:50,day:40}}),f=fake(e);let notes=[];
 for(let i=1;i<=3;i++){notes=ST.afterProject(f.s,{id:'p'+i,title:'T',skill:'programming',lv:6,stars:3},[e],f.get,f.set,40+i);
  const w=f.m.get('a');if(i<3){assert.equal(w.strain.over,i);assert.equal(notes.length,0)}}
 const w=f.m.get('a');assert.equal(notes.length,1,'kiệt sức');assert.equal(w.strain.over,0);assert.equal(w.fatigue,40);assert.equal(w.morale,45);assert(w.off>=43);
 assert(f.s.company.hr.hooks.some(k=>k.motif==='sick'),'móc ốm sau kiệt sức');assert(f.s.company.hr.memories.some(m=>m.tag==='over'&&m.motif==='work'),'ký ức quá sức')}
{const e=emp('a',{skills:sk(9,9,9),work:{morale:60,loyalty:60,fatigue:0,ambition:70,day:40}}),f=fake(e);let notes=[];
 for(let i=1;i<=3;i++)notes=ST.afterProject(f.s,{id:'p'+i,title:'T',skill:'programming',lv:3,stars:4},[e],f.get,f.set,40+i);
 const w=f.m.get('a');assert.equal(notes.length,1,'chán việc');assert.equal(w.morale,50);assert.equal(w.loyalty,55);assert(f.s.company.hr.hooks.some(k=>k.motif==='poach'));assert(f.s.company.hr.memories.some(m=>m.tag==='easy'))}
{const e=emp('a',{skills:sk(9,9,9),work:{morale:60,loyalty:60,fatigue:0,ambition:30,day:40}}),f=fake(e);
 for(let i=1;i<=3;i++)ST.afterProject(f.s,{id:'p'+i,title:'T',skill:'programming',lv:3,stars:4},[e],f.get,f.set,40+i);
 assert.equal(f.m.get('a').morale,60,'tham vọng thấp thì không chán')}
{const e=emp('a',{skills:sk(6,6,6)}),f=fake(e);ST.afterProject(f.s,{id:'p1',title:'T',skill:'programming',lv:6,stars:5},[e],f.get,f.set,41);
 assert.equal(f.m.get('a').strain.over,0);assert(f.s.company.hr.memories.some(m=>m.tag==='fit'),'vừa sức và được khen');
 ST.afterProject(f.s,{id:'p2',title:'T',skill:'programming',lv:6,stars:1},[e],f.get,f.set,42);assert(f.s.company.hr.memories.some(m=>m.tag==='blamed'),'bị trách khi dự án hỏng')}
// 7. Toàn bộ qua settle: quá sức 3 lần liên tiếp
{let s=base(23,[emp('a',{skills:sk(3,3,3),work:{morale:70,loyalty:60,fatigue:0,ambition:50,day:23}})]);
 for(let k=1;k<=3;k++){s=withP(s,[proj({id:'q'+k,lv:7,hours:6,progress:5.9,team:['a'],due:200})],{done:s.company.projects?.done??[]});s=run({...s,day:s.day},s.day+1)}
 assert(s.company.hr&&s.company.hr.memories.some(m=>m.tag==='over'),'settle ghi ký ức quá sức');assert(engine.valid(s)&&engine.parse(JSON.stringify(s)),'save hợp lệ');
 assert(s.journal.some(j=>j.title.includes('kiệt sức'))||s.company.staff[0].work.strain.over>=1,'đã tính chuỗi quá sức')}
console.log('know ok');
