const assert=require('node:assert/strict');
const {morningOf,morningDue,markMorningSeen,validMorning}=require('../.test-build/domain/morning');
const {engine}=require('../.test-build/domain/engine');
let s={...engine.initial()};
assert(!morningDue(s),'ngày 0 chưa có bản tin');
s={...s,day:3};
assert(morningDue(s));
const m=morningOf(s);
assert(m.hood.length>0);assert.equal(m.unread.count,0);assert(Array.isArray(m.agenda));
s=markMorningSeen(s);assert(!morningDue(s));assert.equal(s.morning.seen,3);
assert(morningDue({...s,day:4}));
assert(engine.valid(s));
assert(!engine.valid({...s,morning:{seen:99}}));
assert(engine.valid({...engine.initial(),day:5}),'save cũ không có morning vẫn hợp lệ');
// tin nhắn chưa đọc và lịch hẹn
const t={...s,day:4,inbox:{version:1,seq:1,threads:{mom:[{id:'a',day:4,minute:420,from:'npc',text:'hi',kind:'note'}]},queue:[],appts:[],called:{},hello:{}}};
const mm=morningOf(t);assert.equal(mm.unread.count,1);assert.equal(mm.unread.names.length,1);
console.log('morning ok');
// T75 phần 2: mục tiêu tuần, báo cáo tháng, qua đêm
const M=require('../.test-build/domain/morning');
const {dateAt}=require('../.test-build/domain/format');
const mon=d=>{while(dateAt(d).getUTCDay()!==1)d++;return d};
const d0=mon(8);
assert.equal(dateAt(M.weekStart(d0+4)).getUTCDay(),1);assert.equal(M.weekStart(d0+4),d0);
let a={...engine.initial(),day:d0,money:1000000};
const g=M.pickGoals(a,d0);assert.equal(g.length,3);assert.equal(new Set(g).size,3);assert.deepEqual(g,M.pickGoals(a,d0),'cùng tuần cùng mục tiêu');
a=M.markMorningSeen(a);assert.deepEqual(a.morning.week,{start:d0,ids:g});assert(a.morning.month&&engine.valid(a));
// xong cả ba mục tiêu thì được thưởng ở tuần sau
const keyOf={task:'task:1:1:ok',study:'study:A',chat:'chat:x',recipe:'recipe:r',side:'side-done:o',project:'project:p'};
const jr=[];let n=0;for(const id of g){const need={task:3,study:2,chat:3}[id]??1;for(let i=0;i<need;i++)jr.push({id:`${d0+1}:420:${keyOf[id]}${i}`,key:keyOf[id]+i,day:d0+1,minute:420,title:id==='project'?'Dự án hoàn thành':'x',detail:'x'})}
let b={...a,journal:jr,day:d0+7};
assert.equal(M.goalProgress(b,g[0],d0),Math.min({task:3,study:2,chat:3}[g[0]]??1,jr.filter(e=>e.key.startsWith(keyOf[g[0]].slice(0,4))).length));
const b2=M.markMorningSeen(b);assert.equal(b2.money,b.money+M.WEEKLY.money,'thưởng 200.000đ');assert.equal(b2.morning.week.start,d0+7);assert(b2.morning.recap.lines.some(l=>l.text.includes('Tuần trước xong 3/3')));assert(engine.valid(b2));
// thiếu mục tiêu thì không thưởng
const c=M.markMorningSeen({...a,day:d0+7});assert.equal(c.money,a.money);assert(c.morning.recap.lines.some(l=>l.text.includes('Tuần trước xong 0/3')));
// báo cáo tháng
const m1=M.markMorningSeen({...engine.initial(),day:3,money:1000000});assert.equal(m1.morning.month.worth,1000000);
const m2=M.markMorningSeen({...m1,day:40,money:3000000});
assert(m2.morning.recap.lines.some(l=>l.text.includes('tài sản tăng 2.000.000')),JSON.stringify(m2.morning.recap.lines));
// qua đêm chỉ khi có công ty
assert.equal(M.morningOf({...engine.initial(),day:4}).night.length,0);
console.log('morning week/month ok');
// T75 phần 3: gợi ý thứ Sáu, sự kiện đáng nhớ năm ngoái
const fri=d=>{while(dateAt(d).getUTCDay()!==5)d++;return d};
const f=fri(10);assert.equal(M.morningOf({...engine.initial(),day:f}).weekend.length>=1,true,'thứ Sáu có gợi ý');
assert.equal(M.morningOf({...engine.initial(),day:f+1}).weekend.length,0,'ngày khác không có');
assert(M.morningOf({...engine.initial(),day:f,money:100000}).weekend.some(l=>l.text.includes('làm thêm')));
const ev=(day,key,title)=>({id:`${day}:420:${key}`,key,day,minute:420,title,detail:'x'});
let y={...engine.initial(),day:5,journal:[ev(4,'tier:senior','Thăng bậc'),ev(4,'chat:a:1:1','Trò chuyện'),ev(3,'recipe:pho','Học món phở')]};
y=M.markMorningSeen(y);
assert.deepEqual(y.morning.memories.map(x=>x.text).sort(),['Học món phở','Thăng bậc'],'chỉ giữ sự kiện đáng nhớ, trò chuyện bị bỏ');
assert(engine.valid(y));
const later={...y,day:5+365};assert(M.morningOf(later).ago.some(l=>l.text.includes('Thăng bậc')));
assert.equal(M.morningOf({...y,day:5+200}).ago.length,0);
const old=M.markMorningSeen({...y,day:5+500});assert.equal(old.morning.memories.length,0,'quá một năm rưỡi thì bỏ');
console.log('morning memory/friday ok');
// Lát cắt morning hỏng không làm mất cả đời chơi
{const ok=engine.initial(),good={...ok,day:3,money:1234567};
 for(const bad of [{seen:99},{seen:'x'},{seen:2,week:{start:-5,ids:['la']}},{seen:2,month:{key:'sai',worth:NaN,lv:{}}},{seen:2,recap:{day:9,lines:[]}}]){
  const p=engine.parse(JSON.stringify({...good,morning:bad}));assert(p,'vẫn đọc được: '+JSON.stringify(bad));assert.equal(p.money,1234567);assert.equal(p.day,3);assert.equal(p.morning,undefined);}
 assert.equal(engine.parse(JSON.stringify({...good,money:-5,morning:{seen:1}})),null,'lỗi ở chỗ khác vẫn bị từ chối');
 console.log('morning parse fallback ok')}
