const assert=require('node:assert/strict');const {engine}=require('../.test-build/domain/engine');const {officeAction,officeOf,questionFor,COMPANIES}=require('../.test-build/domain/office');const {clockOf,route,goTo,finishDay,spendTime,personalActivity}=require('../.test-build/domain/time');const {places}=require('../.test-build/domain/places');
const good=r=>{assert(r.ok,r.error);assert(engine.valid(r.state));return r.state};const cv='Tôi tốt nghiệp CNTT, biết lập trình và mong muốn học hỏi cùng đội ngũ.';
assert.equal(route('home','office').minutes,15);assert.equal(route('office','home').minutes,15);assert.equal(route('home','home').minutes,0);assert.notEqual(route('home','office').minutes,route('home','hospital').minutes);for(const a of places)for(const b of places){assert.deepEqual(route(a.id,b.id),route(b.id,a.id));}
assert.equal(places.find(p=>p.id==='apartments').name,'Khu nhà phố');
for(const c of COMPANIES.filter(c=>c.industry!=='tech'))assert(!officeAction(engine.initial(),{kind:'apply',id:c.id,cv}).ok);
for(const company of COMPANIES.filter(c=>c.industry==='tech')){
 let s=good(goTo(engine.initial(),'office'));assert.equal(clockOf(s).minute,435);s=good(officeAction(s,{kind:'apply',id:company.id,cv}));assert.equal(clockOf(s).minute,450);assert.equal(s.office.application.interviewDay,1);assert(!officeAction(s,{kind:'startInterview'}).ok);assert(!officeAction(s,{kind:'apply',id:company.id,cv}).ok);assert(!officeAction(s,{kind:'acceptOffer'}).ok);
 s=good(finishDay(s));assert.equal(s.day,1);assert.equal(clockOf(s).location,'home');assert.equal(clockOf(s).minute,420);assert(!officeAction(s,{kind:'startInterview'}).ok);s=good(goTo(s,'office'));s=good(officeAction(s,{kind:'startInterview'}));assert.equal(clockOf(s).minute,675);assert(!officeAction(s,{kind:'startInterview'}).ok);assert(!goTo(s,'market').ok);assert(!finishDay(s).ok);assert(!personalActivity(s,'rest').ok);assert(!engine.buy(s,'plant').ok);assert(goTo(s,'office').ok);
 for(let i=0;i<3;i++){s=engine.parse(JSON.stringify(s));assert(s);s=good(officeAction(s,{kind:'answer',choice:questionFor(s.office.application.questions[i]).answer}));}
 assert.equal(s.office.application.status,'passed');assert.equal(s.office.role,'visitor');assert(!officeAction(s,{kind:'acceptOffer'}).ok);assert(!officeAction(s,{kind:'answer',choice:0}).ok);s=good(finishDay(s));assert.equal(s.day,2);s=good(goTo(s,'office'));s=good(officeAction(s,{kind:'acceptOffer'}));assert.equal(s.office.role,'employee');assert(!officeAction(s,{kind:'shift'}).ok);assert(!officeAction(s,{kind:'acceptOffer'}).ok);s=good(finishDay(s));s=good(goTo(s,'office'));
}
let fail=good(goTo(engine.initial(),'office'));fail=good(officeAction(fail,{kind:'apply',id:'sen-code',cv}));fail=good(finishDay(fail));fail=good(goTo(fail,'office'));fail=good(officeAction(fail,{kind:'startInterview'}));for(let i=0;i<3;i++)fail=good(officeAction(fail,{kind:'answer',choice:(questionFor(fail.office.application.questions[i]).answer+1)%3}));assert.equal(fail.office.application.status,'failed');assert(!officeAction(fail,{kind:'acceptOffer'}).ok);assert(!officeAction(fail,{kind:'apply',id:'sen-code',cv}).ok);fail=good(finishDay(fail));assert(officeAction(fail,{kind:'apply',id:'sen-code',cv}).ok);
let missed=good(officeAction(engine.initial(),{kind:'apply',id:'sen-code',cv}));missed=good(finishDay(good(finishDay(missed))));assert(!officeAction(missed,{kind:'startInterview'}).ok);assert(officeAction(missed,{kind:'apply',id:'sen-code',cv}).ok);
const late={...engine.initial(),clock:{...clockOf(engine.initial()),minute:1495}};assert(!goTo(late,'office').ok);assert(!officeAction(late,{kind:'apply',id:'sen-code',cv}).ok);assert(!spendTime(late,10).ok);assert(engine.valid(late));assert(!engine.valid({...late,clock:{...late.clock,minute:1501}}));assert(!engine.valid({...late,clock:{...late.clock,lastWorkDay:99}}));assert(!engine.valid({...fail,office:{...fail.office,application:{...fail.office.application,questions:['bad','bad','bad']}}}));assert.equal(clockOf(engine.initial()).minute,420);
console.log('PASS: IT eligibility, CV/day+1 interview/day+2 work, 4h charge once, answer/save progress, failed retry, missed schedule, legacy instant wage disabled, travel symmetry/distances, clock validation and end-of-day budget.');

// Issue #1: ngất lúc 01:00
{
  const assert = require('node:assert/strict');
  const {engine} = require('../.test-build/domain/engine');
  const {faintIfLate, clockOf, clockText, END, START} = require('../.test-build/domain/time');
  assert.equal(END, 1500);
  const base = engine.initial();
  const at = (extra, minute, location) => ({...base, ...extra, clock: {...clockOf(base), minute, location}});
  assert.equal(clockText(at({}, 1500, 'home')), '01:00');
  // Chưa tới 01:00: không ngất.
  const early = at({}, 1495, 'home'); assert.equal(faintIfLate(early), early);
  // Ở nhà: ngủ tại chỗ, không mất tiền ngoài sinh hoạt.
  const home = faintIfLate(at({money: 1000000}, 1500, 'home'));
  assert.equal(home.day, 1); assert.equal(home.clock.minute, START); assert.equal(home.clock.location, 'home');
  assert.equal(home.money, 1000000); assert.equal(home.lastReport.faint.place, 'home'); assert.ok(engine.valid(home));
  // Ở ngoài: về nhà, mất tối đa 20% tiền mặt, không bao giờ âm.
  let lostSome = 0, total = 200;
  for (let d = 0; d < total; d++) {
    const r = faintIfLate(at({day: d, money: 2000000 + d * 1000, health: 80}, 1500, 'market'));
    assert.equal(r.clock.location, 'home'); assert.ok(r.money >= 0); assert.ok(r.lastReport.faint.lost <= Math.floor((2000000 + d * 1000) * 0.2)); if (r.lastReport.faint.lost > 0) lostSome++;
    assert.ok(engine.valid(r));
  }
  assert.ok(lostSome > total * 0.15 && lostSome < total * 0.45, 'tỉ lệ mất tiền ~30%: ' + lostSome);
  // Sức khoẻ < 30: vào viện, trả viện phí, không mất tiền do ngất.
  const hosp = faintIfLate(at({money: 1000000, health: 20}, 1500, 'park'));
  assert.equal(hosp.lastReport.faint.place, 'hospital'); assert.equal(hosp.lastReport.faint.lost, 0); assert.equal(hosp.money, 1000000 - 150000);
  // Tiền ít: không âm.
  const poor = faintIfLate(at({money: 30000, health: 20}, 1500, 'park')); assert.ok(poor.money >= 0); assert.ok(engine.valid(poor));
  // Mất mô phỏng 30 đêm liên tiếp: luôn hợp lệ, tất định.
  let s = at({money: 3000000}, 1500, 'bank');
  for (let i = 0; i < 30; i++) { s = faintIfLate(s); assert.ok(engine.valid(s)); s = {...s, clock: {...s.clock, minute: 1500, location: i % 2 ? 'home' : 'mall'}}; }
  assert.equal(s.day, 30);
}
