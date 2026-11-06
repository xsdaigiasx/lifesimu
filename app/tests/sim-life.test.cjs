const assert=require('node:assert/strict');
const S=require('../scripts/sim-life.cjs');
// CI ngắn: 20 năm x 2 seed, tất định, đạt các chỉ tiêu
const runs=[0,1].map(i=>S.run(i,20));
assert.deepEqual(S.run(1,3),S.run(1,3),'tất định theo seed');
for(const [name,pass,detail] of S.verdict(S.summarize(runs,20)))assert.ok(pass,`${name}: ${detail}`);
console.log('sim-life.test ok');
