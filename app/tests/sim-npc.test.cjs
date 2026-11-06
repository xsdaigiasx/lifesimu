const assert=require('node:assert/strict');
const S=require('../scripts/sim-npc.cjs');
// CI ngắn: 2 tháng x 3 seed mỗi persona, tất định, story hợp lệ, không lặp mô-típ trong 14 ngày
const runs=[];for(const p of S.PERSONAS)for(let i=0;i<3;i++)runs.push(S.run(p,i,60));
for(const r of runs){assert.ok(r.valid,`${r.persona}:${r.seed} story không hợp lệ`);assert.ok(r.events.length>0,`${r.persona}:${r.seed} không có sự kiện nào`)}
assert.deepEqual(S.run('average',1,60),S.run('average',1,60),'tất định theo seed');
const sum=S.summarize(runs);for(const p of S.PERSONAS)assert.equal(sum[p].repeatN,0,`${p}: lặp mô-típ trong 14 ngày`);
assert.ok(sum.chatty.perDay>sum.hermit.perDay,'người hay trò chuyện có nhiều sự kiện hơn người ít giao du');
// 06/11: thêm chỉ tiêu T43 (callback, Xa lạ, Tri kỷ, NPC nhiều nhất) trên 4 tháng x 2 seed; trước đây CI không kiểm nên 2 chỉ tiêu trượt từ H6 không ai thấy.
// Câu gợi ý gần mốc cần cả năm, chỉ đo ở bản đầy đủ `npm run sim:npc`.
const long=S.PERSONAS.flatMap(p=>[0,1].map(i=>S.run(p,i,120)));
for(const [name,pass,detail] of S.verdict(S.summarize(long)))if(!name.includes('gợi ý'))assert.ok(pass,`${name}: ${detail}`);
console.log('sim-npc.test ok');
