const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../.test-build/domain/social');const {engine}=require('../.test-build/domain/engine');
const base=()=>({...engine.initial(),day:3});
const withScore=(s,id,score)=>({...s,social:{...S.socialOf(s),relations:{[id]:{score,lastDay:s.day,minutes:0}},peak:{[id]:score}}});
const gain=(s,id,d,light=false)=>S.socialOf(S.adjustRelation(s,id,d,true,light)).relations[id].score;
test('hệ số theo bậc: bậc càng cao cộng càng chậm',()=>{
 assert.equal(S.tierMult(0),1);assert.equal(S.tierMult(10),.6);assert.equal(S.tierMult(30),.35);assert.equal(S.tierMult(60),.2);
 assert.equal(gain(withScore(base(),'dev-an',0),'dev-an',5),5);assert.equal(gain(withScore(base(),'dev-an',10),'dev-an',5),13);assert.equal(gain(withScore(base(),'dev-an',30),'dev-an',5),31);assert.equal(gain(withScore(base(),'dev-an',60),'dev-an',5),61);
});
test('phần lẻ dồn lại, không mất điểm',()=>{
 let s=withScore({...base()},'dev-an',30);const day=s.day;let total=0;for(let i=0;i<10;i++){s={...s,day:day+i};const before=S.socialOf(s).relations['dev-an'].score;s=S.adjustRelation(s,'dev-an',2);total+=S.socialOf(s).relations['dev-an'].score-before}
 assert.ok(total>=6&&total<=7,'10 lần +2 ở bậc Tri kỷ cho khoảng 7 điểm: '+total);assert.ok(S.validSocial(S.socialOf(s),day+9));
});
test('việc nhẹ chỉ đưa quan hệ tới 29 điểm, việc có chủ đích thì qua 30',()=>{
 assert.equal(gain(withScore(base(),'dev-an',28),'dev-an',5,true),29);assert.equal(gain(withScore(base(),'dev-an',29),'dev-an',5,true),29);
 assert.equal(gain(withScore(base(),'dev-an',29),'dev-an',5,false),32);
 assert.equal(gain(withScore(base(),'dev-an',30),'dev-an',5,true),30);assert.equal(gain(withScore(base(),'dev-an',30),'dev-an',5,false),31);
});
test('Mẹ (Gia đình) không áp dụng hệ số, điểm trừ không đổi',()=>{
 const s=withScore(base(),'me',45);assert.equal(gain(s,'me',4,true),49);assert.equal(gain(withScore(base(),'dev-an',45),'dev-an',-3),42);
});
