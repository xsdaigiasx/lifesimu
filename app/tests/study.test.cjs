const test=require('node:test'),assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');const {initialOffice}=require('../.test-build/domain/office');
const {clockOf,END}=require('../.test-build/domain/time');const {workOf}=require('../.test-build/domain/work');
const {xpNeeded}=require('../.test-build/domain/skill-xp');
const S=require('../.test-build/domain/study');
const lv=(level)=>({level,xp:0});
const skills=(p=1,c=1)=>({programming:lv(p),logic:lv(1),graphics:lv(1),management:lv(1),communication:lv(c),cooking:lv(1)});
function st({day=0,minute=1080,tier='junior',probation=false,prog=1,money=5e6,energy=90}={}){const s=engine.initial();const office={...initialOffice(),role:'employee',employerId:'sen-code',tier,tierSince:0};if(probation)office.probation={start:0,end:60,workDays:0};return{...s,day,money,energy,mood:90,fullness:90,stress:10,office,skills:skills(prog),work:workOf({...s,day}),clock:{...clockOf(s),minute,location:'home'}}}
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state),'state hợp lệ');return r.state};
const totalXp=k=>{let t=k.xp;for(let l=1;l<k.level;l++)t+=xpNeeded(l);return t};

test('trần XP đi làm theo bậc, chứng chỉ nâng trần',()=>{
 assert.equal(S.workCap(st({probation:true}),'programming'),2);
 assert.equal(S.workCap(st(),'programming'),4);
 assert.equal(S.workCap(st({tier:'middle'}),'programming'),6);
 assert.equal(S.workCap(st({tier:'senior'}),'programming'),8);
 assert.equal(S.workCap(st({tier:'lead'}),'programming'),10);
 const c=st();c.study={certs:['programming:advanced'],sessions:{},week:0,weekCount:0};
 assert.equal(S.workCap(c,'programming'),7);assert.equal(S.workCap(c,'logic'),4);
});

test('XP đi làm dừng ở trần, thanh gần đầy',()=>{
 const s=S.addWorkXp(st({prog:3}),'programming',1e6);
 assert.deepEqual(s.skills.programming,{level:4,xp:xpNeeded(4)-1});
 assert.equal(S.addWorkXp(s,'programming',500),s,'đã ở trần thì không nhận thêm');
 assert.ok(engine.valid(s));
});

test('khoá Cơ bản: 2 giờ, học phí theo buổi, năng lượng, một buổi mỗi ngày',()=>{
 const s0=st();const s=ok(S.studySkill(s0,'logic','basic'));
 assert.equal(clockOf(s).minute,1200);assert.equal(s.money,s0.money-70000);assert.equal(s.energy,s0.energy-10);
 assert.equal(totalXp(s.skills.logic),70);assert.equal(clockOf(s).lastStudyDay,0);
 assert.equal(S.studySkill(s,'logic','basic').ok,false,'một buổi mỗi ngày');
 assert.equal(S.studySkill(st({minute:1000}),'logic','basic').ok,false,'lớp tối từ 18:00');
 assert.equal(S.studySkill(st({minute:END-60}),'logic','basic').ok,false,'không đủ 2 giờ');
 assert.equal(S.studySkill(st({money:1000}),'logic','basic').ok,false,'thiếu học phí');
 assert.equal(S.studySkill(st({energy:5}),'logic','basic').ok,false,'thiếu năng lượng');
});

test('điều kiện vào khoá và Lv tối đa của từng kiểu học',()=>{
 assert.equal(S.studyQuote(st(),'programming','advanced').ok,false,'Nâng cao cần Lv4');
 assert.equal(S.studyQuote(st({prog:4}),'programming','basic').ok,false,'Cơ bản chỉ tới Lv4');
 assert.equal(S.studyQuote(st({prog:3}),'programming','self').ok,false,'tự học chỉ tới Lv3');
 assert.equal(S.studyQuote(st({prog:7}),'programming','expert').ok,false,'Chuyên sâu cần bậc Middle');
 assert.equal(S.studyQuote(st({prog:7,tier:'middle'}),'programming','expert').ok,true);
// T56: laptop cũ khởi đầu ×0,9 nên tự học tại nhà còn 36 XP.
 const self=ok(S.studySkill(st(),'graphics','self'));assert.equal(totalXp(self.skills.graphics),36);assert.equal(self.money,st().money);
 assert.equal(self.study.certs.length,0);
 const capped=ok(S.studySkill({...st({prog:3}),skills:{...skills(3),programming:{level:3,xp:xpNeeded(3)-1}}},'programming','basic'));
 assert.equal(capped.skills.programming.level,4,'khoá không đẩy vượt Lv đích');assert.equal(S.studyQuote(capped,'programming','basic').ok,false);
});

test('đủ 5 buổi thì nhận chứng chỉ; từ buổi thứ 4 trong tuần XP còn 50%',()=>{
 let s=st({prog:4});const gains=[];
 for(let d=0;d<5;d++){s={...s,day:d,clock:{...clockOf(s),minute:1080},energy:90,mood:90,fullness:90,stress:10};const before=totalXp(s.skills.programming);s=ok(S.studySkill(s,'programming','advanced'));gains.push(totalXp(s.skills.programming)-before)}
 assert.deepEqual(gains,[150,150,150,75,75]);
 assert.deepEqual(s.study.certs,['programming:advanced']);assert.equal(S.certLevel(s,'programming'),2);
 assert.ok(s.journal.some(j=>/chứng chỉ Nâng cao/.test(j.body??j.text??JSON.stringify(j))));
 s={...s,day:7,clock:{...clockOf(s),minute:1080},energy:90};const before=totalXp(s.skills.programming);s=ok(S.studySkill(s,'programming','advanced'));
 assert.equal(totalXp(s.skills.programming)-before,150,'tuần mới tính lại');assert.equal(s.study.weekCount,1);
});

test('XP học nhân hệ số thể trạng',()=>{const s=ok(S.studySkill({...st(),energy:30,mood:30,fullness:30},'logic','basic'));assert.ok(totalXp(s.skills.logic)<70)});

test('save: dữ liệu học hợp lệ được nhận, dữ liệu sai bị từ chối',()=>{
 const s=st();assert.ok(engine.valid({...s,study:{certs:['logic:basic'],sessions:{'logic:basic':5},week:0,weekCount:1}}));
 assert.equal(engine.valid({...s,study:{certs:['flying:basic'],sessions:{},week:0,weekCount:0}}),false);
 assert.equal(engine.valid({...s,study:{certs:[],sessions:{'logic:basic':-1},week:0,weekCount:0}}),false);
 assert.equal(engine.valid({...s,study:{certs:[],sessions:{},week:5,weekCount:0}}),false,'tuần không ở tương lai');
});
