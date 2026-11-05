const assert=require('node:assert/strict');
const S=require('../scripts/sim-company.cjs');
// CI ngắn: 3 tháng x 3 seed mỗi persona, tất định, không vi phạm bất biến
const runs=[];for(const p of S.PERSONAS)for(let i=0;i<3;i++)runs.push(S.run(p,i,90));
for(const r of runs){assert.deepEqual(r.violations,[],`${r.persona}:${r.seed} ${r.violations[0]}`);assert.equal(r.dead,0,`${r.persona}:${r.seed} bế tắc trong 3 tháng đầu`)}
assert.deepEqual(S.run('careful',1,90),S.run('careful',1,90),'tất định theo seed');
const det=S.detection(3000);
assert(det.highShare>=.2&&det.highShare<=.3,'rủi ro cao 20 đến 30%: '+det.highShare);
assert(det.detect>=.7&&det.detect<=.8,'phát hiện 70 đến 80%: '+det.detect);
// persona Ẩu thiệt hại hơn Cẩn thận về uy tín sau 3 tháng
const avg=p=>runs.filter(r=>r.persona===p).reduce((a,r)=>a+r.rep,0)/3;assert(avg('careful')>avg('sloppy'));
console.log('sim-company.test ok');
