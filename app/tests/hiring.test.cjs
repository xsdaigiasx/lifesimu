const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const H=require('../.test-build/domain/hiring');
const {foundCompany}=require('../.test-build/domain/company');
const {officeOf,SIZES}=require('../.test-build/domain/office');
const {defaultSkills}=require('../.test-build/domain/skill-xp');
const base=engine.initial();
const lv=n=>({level:n,xp:0});
// ứng viên: cùng seed cùng người, ràng buộc kỹ năng
const c1=H.makeCandidate('a:1',70),c2=H.makeCandidate('a:1',70);assert.deepEqual(c1,c2);
let high=0,total=2000,liars=0;const archSum=[];
for(let i=0;i<total;i++){const c=H.makeCandidate('t:'+i,90);
 for(const k of H.HIRE_SKILLS){assert(c.skills[k]>=1&&c.skills[k]<=10);assert(c.claim[k]>=c.skills[k]&&c.claim[k]<=10)}
 const main=Math.max(c.skills.programming,c.skills.logic,c.skills.graphics);assert(H.HIRE_SKILLS.every(k=>c.skills[k]<=main));
 assert(H.HIRE_SKILLS.reduce((a,k)=>a+c.skills[k],0)<=3*main+4,'tổng điểm bị chặn');
 assert(c.wage>=3000000&&c.wage<=200000000);if(c.risk>=60)high++;if(c.claim.programming!==c.skills.programming||c.claim.logic!==c.skills.logic||c.claim.graphics!==c.skills.graphics)liars++}
assert(high/total>=.2&&high/total<=.3,'rủi ro cao chiếm 20 đến 30%: '+high/total);assert(liars>0);
// uy tín thấp thì không có Senior
for(let i=0;i<500;i++){const c=H.makeCandidate('low:'+i,30);assert(Math.max(c.skills.programming,c.skills.logic,c.skills.graphics)<=6,'Senior cần uy tín')}
for(let i=0;i<500;i++){const c=H.makeCandidate('mid:'+i,70);assert(Math.max(c.skills.programming,c.skills.logic,c.skills.graphics)<=8,'Chuyên gia cần uy tín')}
// phát hiện người rủi ro cao sau khi phỏng vấn kỹ: 70 đến 80%
{let seen=0,hit=0;for(let i=0;i<4000;i++){const c=H.makeCandidate('w:'+i,90);if(c.risk<60)continue;seen++;
 const s={day:5,company:{hiring:{progress:{[c.id]:{sit:1,mot:1,ref:c.ref?1:undefined}},gone:[]}}};const w=H.viewOf({...base,day:5,company:{version:1,founded:0,fund:0,hiring:{postedDay:5,rep:90,progress:{[c.id]:{sit:1,mot:1,ref:1}},gone:[]}}},c).warn;
 if(w&&(w.kind==='ref'?w.level===2:w.level===1))hit++}
 const rate=hit/seen;assert(rate>=.66&&rate<=.82,'tỷ lệ phát hiện '+rate);assert(rate<1)}
// thông tin ẩn không lộ ra bản xem
{const c=H.makeCandidate('v:1',70),s={...base,company:{version:1,founded:0,fund:0,hiring:{postedDay:0,rep:70,progress:{},gone:[]}}};
 const v=H.viewOf(s,c),text=JSON.stringify(v);for(const k of ['trust','risk','potential'])assert(!(k in v),k);
 assert.equal(v.personality,null);assert.equal(v.motive,null);assert.equal(v.warn,null);assert.equal(v.flags,null);for(const k of H.HIRE_SKILLS)assert.equal(v.skills[k].est,null);
 assert(!text.includes('"seed"'))}
// sai số giảm đúng theo hành động
{const k=defaultSkills();k.communication=lv(1);k.management=lv(1);const s={...base,skills:k};
 const r1=x=>Math.round(x*10)/10;assert.equal(H.errOf(s,undefined,'logic'),2.5);assert.equal(r1(H.errOf(s,{q:{logic:1}},'logic')),1.8);assert.equal(r1(H.errOf(s,{q:{logic:2}},'logic')),1.1);
 assert.equal(H.errOf(s,{q:{logic:9}},'logic'),.5);assert.equal(H.errOf(s,{test:{logic:1}},'logic'),.5);
 const k2=defaultSkills();k2.communication=lv(5);k2.management=lv(5);const s2={...base,skills:k2};assert.equal(H.errOf(s2,undefined,'logic'),.5,'mỗi 2 Lv giao tiếp+quản lý giảm 0,5, tối thiểu 0,5');const k3=defaultSkills();k3.communication=lv(2);k3.management=lv(2);assert.equal(H.errOf({...base,skills:k3},undefined,'logic'),2);const k4=defaultSkills();k4.communication=lv(3);k4.management=lv(3);assert.equal(H.errOf({...base,skills:k4},undefined,'logic'),1.5)}
// luồng: đăng tin, phỏng vấn, thuê
const ready=(()=>{const k=defaultSkills();k.management=lv(4);k.programming=lv(5);
 const w=['2026-07','2026-08','2026-09'];let s={...base,money:80000000,skills:k,side:{version:1,rep:70,seq:0,last:-1,orders:[]}};
 s={...s,office:{...officeOf(s),role:'employee',employerId:'sen-code',tier:'junior',tierSince:0},work:{version:1,seed:0,trackingDay:s.day,serial:0,active:null,task:null,finished:[],holidayDays:[],periods:w.map(x=>({key:'sen-code:'+x,companyId:'sen-code',month:x,salary:9000000,minutes:600,paid:true,amount:1})),lastResult:''}};
 return s})();
let s=ready;
const f=foundCompany(s,{name:'Lâm Tech',industry:'tech'});
if(!f.ok){console.log('bỏ qua luồng đầy đủ: '+f.error);process.exit(1)}
s=f.state;assert(H.candidatesOf(s).length===0);assert(!H.hiringAction(s,{kind:'interview',id:'x',what:'cv'}).ok);
let p=H.hiringAction(s,{kind:'post'});assert(p.ok,p.error);s=p.state;assert.equal(s.company.fund,f.state.company.fund-H.HIRING.postFee);assert(engine.valid(s));assert(engine.parse(JSON.stringify(s)));
assert.equal(s.company.hiring.rep,50,'T47: Senior và Chuyên gia theo uy tín công ty (mặc định 50), không theo uy tín tay trái');
assert(!H.hiringAction(s,{kind:'post'}).ok,'không đăng trùng');
const list=H.candidatesOf(s);assert(list.length>=3&&list.length<=5);
assert.deepEqual(H.candidatesOf(s).map(c=>c.id),list.map(c=>c.id),'ổn định sau reload');
const c=list[0];
let m0=s.clock.minute,r=H.hiringAction(s,{kind:'interview',id:c.id,what:'tech',skill:'programming'});assert(r.ok,r.error);assert.equal(r.state.clock.minute-m0,20);
s=r.state;assert(H.viewOf(s,c).skills.programming.est);assert(!H.viewOf(s,c).skills.logic.est);assert(engine.valid(s));assert(engine.parse(JSON.stringify(s)));
assert(!H.hiringAction(s,{kind:'interview',id:c.id,what:'tech'}).ok,'phải chọn kỹ năng');
r=H.hiringAction(s,{kind:'interview',id:c.id,what:'cv'});assert(r.ok);s=r.state;assert(!H.hiringAction(s,{kind:'interview',id:c.id,what:'cv'}).ok);assert(Array.isArray(H.viewOf(s,c).flags));
r=H.hiringAction(s,{kind:'interview',id:c.id,what:'situation'});s=r.state;assert.equal(H.viewOf(s,c).personality,c.personality);
if(!c.ref)assert(!H.hiringAction(s,{kind:'interview',id:c.id,what:'ref'}).ok);
// bài test: tối đa 2, bài thứ ba ứng viên bỏ
r=H.hiringAction(s,{kind:'interview',id:c.id,what:'test',skill:'logic'});assert.equal(r.state.clock.minute-s.clock.minute,60);s=r.state;
r=H.hiringAction(s,{kind:'interview',id:c.id,what:'test',skill:'graphics'});s=r.state;
r=H.hiringAction(s,{kind:'interview',id:c.id,what:'test',skill:'management'});assert(r.ok);s=r.state;assert(!H.candidatesOf(s).some(x=>x.id===c.id),'ứng viên bỏ đi sau quá nhiều bài test');assert(engine.valid(s));
// thuê
const d=H.candidatesOf(s)[0];const rich={...s,company:{...s.company,fund:100000000}};
const h=H.hiringAction(rich,{kind:'hire',id:d.id});assert(h.ok,h.error);assert.equal(H.staffOf(h.state).length,1);assert.equal(h.state.company.fund,100000000-d.fee);
assert(!H.candidatesOf(h.state).some(x=>x.id===d.id));assert(!H.hiringAction(h.state,{kind:'hire',id:d.id}).ok,'không thuê trùng');assert(engine.valid(h.state));assert(engine.parse(JSON.stringify(h.state)));
const poor={...s,company:{...s.company,fund:0}};if(d.fee>0)assert(!H.hiringAction(poor,{kind:'hire',id:d.id}).ok,'thiếu quỹ');
// hết chỗ
const full={...rich,company:{...rich.company,staff:Array.from({length:SIZES.small.seats-1},(_,i)=>({id:'e'+i,name:'N',gender:'male',age:25,origin:'x',hiredDay:0,wage:5000000,skills:{programming:1,logic:1,graphics:1,management:1,communication:1},years:0,trust:50,risk:10,potential:50,personality:'Ngại',motive:'Ổn định'}))}};
assert(engine.valid(full));assert(!H.hiringAction(full,{kind:'hire',id:d.id}).ok,'hết ghế');
// từ chối
const dec=H.hiringAction(s,{kind:'decline',id:d.id});assert(dec.ok);assert(!H.candidatesOf(dec.state).some(x=>x.id===d.id));
// lứa mới sau 7 ngày; hồ sơ cũ hết hạn sau 14 ngày
const later={...s,day:s.day+7};assert(H.candidatesOf(later).length>H.candidatesOf(s).length-1);
const old={...s,day:s.day+15};assert(!H.candidatesOf(old).some(x=>H.candidatesOf(s).slice(0,1).some(y=>y.id===x.id)));
// khách thường không tuyển
assert(!H.hiringAction(ready,{kind:'post'}).ok);
// save hỏng bị chặn
assert(!engine.valid({...s,company:{...s.company,staff:[{id:'a'}]}}));assert(!engine.valid({...s,company:{...s.company,hiring:{...s.company.hiring,postedDay:-1}}}));
console.log('hiring ok');
