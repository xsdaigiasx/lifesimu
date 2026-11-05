const assert=require('node:assert/strict');
const P=require('../.test-build/domain/professions');
const {TASKS}=require('../.test-build/domain/work');
const {COMPANIES}=require('../.test-build/domain/office');
const {SKILLS}=require('../.test-build/domain/skill-xp');
const C=require('../.test-build/domain/career');
const {engine}=require('../.test-build/domain/engine');
const known={skills:Object.keys(SKILLS),tasks:TASKS.map(t=>t.id),companies:COMPANIES.map(c=>c.id)};
// mọi gói nghề hợp lệ, mã nhiệm vụ và công ty có thật
for(const p of P.PROFESSIONS)assert.deepEqual(P.checkProfession(p,known),[],p.id);
assert.deepEqual(P.TECH.taskIds.sort(),known.tasks.slice().sort(),'gói Công nghệ liệt kê đủ nhiệm vụ');
// gói hỏng bị bắt
const broken={...P.TECH,loop:'x',craft:['programming','programming'],taskIds:['không-có'],tiers:{...P.TECH.tiers,middle:{name:'M',salary:1}},companyFactor:{'lạ':1}};
const bad=P.checkProfession(broken,known);for(const k of ['loop','craft','taskIds','tiers.middle','companyFactor.lạ'])assert(bad.includes(k),k+' '+bad);
// số liệu cũ không đổi
assert.deepEqual(C.TIER_NAME,{junior:'Junior',middle:'Middle',senior:'Senior',lead:'Lead'});
assert.deepEqual(C.TIER_SALARY,{junior:9000000,middle:14000000,senior:22000000,lead:32000000});
assert.equal(C.COMPANY_FACTOR['an-nhien-tech'],1.2);assert.equal(C.tierSalary('sen-code','junior',false,.85),9000000);assert.equal(C.tierSalary('an-nhien-tech','middle',true,.85),Math.round(14000000*1.2*.85));
assert.deepEqual(C.TIERS,['junior','middle','senior','lead']);
// loại vòng lặp và nghề hiện tại
assert.equal(P.professionOf(engine.initial()).id,'tech');assert(P.LOOPS[P.TECH.loop].ready&&P.LOOPS[P.TECH.goal.loop].ready);
assert.equal(P.professionById('tech'),P.TECH);assert.equal(P.professionById('khong'),undefined);
console.log('professions ok');
