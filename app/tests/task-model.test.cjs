const test=require('node:test'),assert=require('node:assert/strict');
const {skillSpeed,errorChance,taskXp,TASKS,skillsOf}=require('../.test-build/domain/work.js');
const {engine}=require('../.test-build/domain/engine');
const base=engine.initial();const withLv=(skill,level)=>({...base,skills:{...skillsOf(base),[skill]:{level,xp:0}}});
test('tốc độ kỹ năng s = clamp(1 + 0,12 d; 0,5; 1,6)',()=>{assert.equal(skillSpeed(0),1);assert.ok(Math.abs(skillSpeed(2)-1.24)<1e-9);assert.equal(skillSpeed(10),1.6);assert.equal(skillSpeed(-10),.5)});
test('XP = H × 8 × (1 + 0,25 × thiếu Lv); quá dễ (d ≥ 3) nhận một nửa',()=>{const t={minutes:120,level:3};assert.equal(taskXp(t,3),16);assert.equal(taskXp(t,1),24);assert.equal(taskXp(t,5),16);assert.equal(taskXp(t,6),8)});
test('tỷ lệ lỗi giảm khi Lv cao hơn, tăng khi thiếu Lv, kẹp 3–60%',()=>{const t=TASKS.find(t=>t.id==='api');const at=l=>errorChance(withLv(t.skill,l),'api');assert.ok(at(t.level+2)<at(t.level));assert.ok(at(t.level-2)>at(t.level));assert.equal(at(10),3);assert.ok(at(1)<=60)});
test('thể trạng kém làm tăng lỗi, chăm đủ thì không phạt',()=>{const t=TASKS.find(t=>t.id==='api');const ok=withLv(t.skill,t.level);const tired={...ok,energy:10};assert.ok(errorChance(tired,'api')>errorChance(ok,'api'));assert.ok(Math.abs(errorChance(ok,'api')-t.error)<1e-9||t.error<3)});
