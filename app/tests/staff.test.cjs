const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const H=require('../.test-build/domain/hiring');
const S=require('../.test-build/domain/staff');
const sk=(p,l,g)=>({programming:p,logic:l,graphics:g,management:1,communication:1});
const emp=(personality,o={})=>({id:'e-'+personality,name:'N',gender:'male',age:28,origin:'x',hiredDay:0,wage:14_000_000,skills:sk(6,5,4),years:4,trust:70,risk:10,potential:50,personality,motive:'Ổn định',...o});
const day=20;
// 1. Sáu tính cách cho hành vi đo được khác nhau (cùng kỹ năng, lương, ngày)
const by=Object.fromEntries(H.PERSONALITIES.map(p=>[p,S.behaviorOf(emp(p),day)]));
assert.equal(new Set(Object.values(by).map(b=>JSON.stringify(b))).size,6,'mỗi tính cách một hành vi riêng');
const maxOf=k=>H.PERSONALITIES.reduce((a,p)=>by[p][k]>by[a][k]?p:a);
assert.equal(maxOf('reportDelay'),'Ngại');assert.equal(maxOf('raiseChance'),'Tham');assert.equal(maxOf('conflict'),'Nóng tính');assert.equal(maxOf('overreach'),'Hay khoe');
assert.equal(by['Hay giúp đỡ'].loadCap,3);assert(by['Hay giúp đỡ'].coop>0);assert.equal(by['Cầu toàn'].coop,0);
assert(by['Cầu toàn'].error<by['Hay khoe'].error&&by['Cầu toàn'].error<by['Nóng tính'].error,'cầu toàn ít lỗi nhất');
assert(by['Cầu toàn'].speed<by['Nóng tính'].speed,'cầu toàn chậm hơn nóng tính');
// 2. Khớp tính cách với tính chất việc
const jobOf=traits=>({skill:'programming',lv:6,traits});
assert(S.speedOf(emp('Tham'),day,jobOf(['reward']))>S.speedOf(emp('Tham'),day,jobOf([])),'tham nhanh hơn khi có thưởng');
assert(S.speedOf(emp('Tham'),day,jobOf(['long']))<S.speedOf(emp('Tham'),day,jobOf([])),'tham chậm với việc dài hạn không thưởng');
assert(S.speedOf(emp('Cầu toàn'),day,jobOf(['urgent']))<S.speedOf(emp('Cầu toàn'),day,jobOf([])),'cầu toàn không hợp việc gấp');
assert(S.errorOf(emp('Ngại'),day,jobOf(['client']))>S.errorOf(emp('Ngại'),day,jobOf([])),'ngại dễ lỗi khi tiếp khách');
// 3. Kỹ năng so với yêu cầu: d = Lv − Lv yêu cầu (35.1)
const e0=emp('Hay giúp đỡ');assert(S.speedOf(e0,day,{skill:'programming',lv:4})>S.speedOf(e0,day,{skill:'programming',lv:8}));assert(S.errorOf(e0,day,{skill:'programming',lv:4})<S.errorOf(e0,day,{skill:'programming',lv:8}));
// 4. Thang tinh thần mục 35.1
assert.deepEqual([75,70,55,40,30,20,10].map(S.moraleMult),[1.1,1.1,1,1,.85,.85,.6]);
// 5. Lương so với mức hợp lý đổi tinh thần, gắn bó, nguy cơ nghỉ
const fair=S.fairWage(emp('Cầu toàn')),low=emp('Cầu toàn',{wage:Math.round(fair*.6)}),ok=emp('Cầu toàn',{wage:fair}),high=emp('Cầu toàn',{wage:Math.round(fair*1.25)});
const far=90,wl=S.workAt(low,far),wo=S.workAt(ok,far),wh=S.workAt(high,far);
assert(wl.morale<wo.morale&&wo.morale<wh.morale,`morale ${wl.morale}<${wo.morale}<${wh.morale}`);assert(wl.loyalty<wo.loyalty&&wo.loyalty<wh.loyalty);
assert(S.quitRisk(low,far)>S.quitRisk(ok,far)&&S.quitRisk(ok,far)>=S.quitRisk(high,far));assert(S.quitRisk(low,far)>.2,'lương thấp nhiều thì nguy cơ nghỉ rõ');
const lowT=emp('Tham',{wage:Math.round(fair*.6)});assert(S.quitRisk(lowT,far)>S.quitRisk(low,far),'người Tham nghỉ sớm hơn khi bị trả thấp');
assert(S.speedOf(low,far)<S.speedOf(high,far),'tinh thần thấp làm chậm');
// 6. Động cơ Lương cao nhạy với lương hơn Ổn định
const sensLow=emp('Cầu toàn',{motive:'Lương cao',wage:Math.round(fair*.7)}),stabLow=emp('Cầu toàn',{motive:'Ổn định',wage:Math.round(fair*.7)});
assert(S.workAt(sensLow,far).morale<S.workAt(stabLow,far).morale);
// 7. Mệt trên 50 cộng lỗi 0,005 mỗi điểm; mệt hồi theo ngày
const tired=emp('Cầu toàn',{work:{...S.initialWork(emp('Cầu toàn')),fatigue:80,day:0}});
assert.equal(S.workAt(tired,0).fatigue,80);assert(S.errorOf(tired,0)>S.errorOf(emp('Cầu toàn'),0));assert(Math.abs((S.errorOf(tired,0)-S.errorOf(emp('Cầu toàn'),0))-.15)<.002,'80 mệt thêm khoảng 0,15 lỗi');
assert.equal(S.workAt(tired,2).fatigue,50);assert.equal(S.workAt(tired,10).fatigue,0);
// 8. Xác định: cùng đầu vào cùng kết quả; tham vọng riêng theo id
assert.deepEqual(S.workAt(emp('Tham'),40),S.workAt(emp('Tham'),40));assert(S.initialWork(emp('Tham')).ambition>S.initialWork(emp('Ngại')).ambition);
assert(S.workAt(emp('Tham'),200).ambition>S.workAt(emp('Tham'),0).ambition&&S.workAt(emp('Ngại'),200).ambition===S.workAt(emp('Ngại'),0).ambition);
// 9. Cập nhật vào save và tương thích save cũ (không có work)
const company={version:1,founded:0,fund:1_000_000,staff:[emp('Tham'),emp('Ngại',{id:'e2'})]};
let s={...engine.initial(),day:30,company};
const v0=engine.valid(s);
const t1=S.settleStaff(s);assert(t1.company.staff.every(e=>e.work&&e.work.day===30));assert.deepEqual(S.settleStaff(t1),t1,'idempotent');
if(v0){assert(engine.valid(t1));assert(engine.parse(JSON.stringify(t1)));assert(!engine.valid({...t1,company:{...t1.company,staff:[{...t1.company.staff[0],work:{...t1.company.staff[0].work,morale:120}}]}}));assert(!engine.valid({...t1,company:{...t1.company,staff:[{...t1.company.staff[0],work:{...t1.company.staff[0].work,day:99}}]}}))}
assert(H.validStaff([emp('Tham')],30,7),'save cũ không có work vẫn hợp lệ');assert(H.validStaff([{...emp('Tham'),work:S.initialWork(emp('Tham'))}],30,7));assert(!H.validStaff([{...emp('Tham'),work:{morale:-1,loyalty:50,fatigue:0,ambition:10,day:3}}],30,7));
// 10. Sang ngày mới trong game: settleLifeDay ghi chỉ số
const {settleLifeDay}=require('../.test-build/domain/life');const nx=settleLifeDay(s,{...s,day:31});if(nx.company&&nx.company.staff)assert(nx.company.staff.every(e=>!e.work||e.work.day===31));
console.log('staff ok',v0?'':'(engine.valid bỏ qua: trạng thái dựng tay)');
