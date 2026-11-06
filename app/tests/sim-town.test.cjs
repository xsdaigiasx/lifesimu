const assert=require('node:assert/strict');
const S=require('../scripts/sim-town.cjs');
// CI ngắn: 1 năm x 2 seed mỗi persona, tất định, đạt các chỉ tiêu
const runs=Object.keys(S.PERSONAS).flatMap(p=>[0,1].map(i=>S.run(i,1,p)));
assert.deepEqual(S.run(1,1,'avg'),S.run(1,1,'avg'),'tất định theo seed');
for(const [name,pass,detail] of S.verdict(S.summarize(runs,1)))assert.ok(pass,`${name}: ${detail}`);
console.log('sim-town.test ok');
