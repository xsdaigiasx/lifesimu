const assert=require('node:assert/strict');
process.env.SIM_NO_BUILD='1';
const S=require('../scripts/sim-talk.cjs');
// H8 CI ngắn: 10 ngày x 3 seed, không câu nào nhắc sai dữ kiện, save story hợp lệ, tất định theo seed
const runs=[0,1,2].map(i=>S.run(i,10));
for(const r of runs){assert.deepEqual(r.errors,[],`seed ${r.seed}`);assert.ok(r.valid,`seed ${r.seed} story không hợp lệ`);assert.ok(r.lines.length>0)}
assert.deepEqual(S.run(1,10).lines,runs[1].lines,'tất định theo seed');
const sum=S.summarize(runs);assert.ok(sum.all.uniq/sum.all.n>=.9,'trùng câu');
console.log('sim-talk.test ok');
