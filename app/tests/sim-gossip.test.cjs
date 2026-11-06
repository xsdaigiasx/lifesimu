const assert=require('node:assert/strict');
const S=require('../scripts/sim-gossip.cjs');
// CI ngắn: 1 năm x 3 seed, tất định, đạt các chỉ tiêu H7c
const runs=[0,1,2].map(i=>S.run(i,1));
assert.deepEqual(S.run(1,1),runs[1],'tất định theo seed');
for(const [name,pass,detail] of S.verdict(S.summarize(runs,1)))assert.ok(pass,`${name}: ${detail}`);
console.log('sim-gossip.test ok');
