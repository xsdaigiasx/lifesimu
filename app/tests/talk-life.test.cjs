const test=require('node:test'),assert=require('node:assert/strict');
const Lf=require('../.test-build/domain/talk/npc-life'),N=require('../.test-build/domain/npc'),T=require('../.test-build/domain/talk/facts');
const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');

test('biến cố đời NPC: tất định theo seed; trung bình 2 đến 5 biến cố mỗi tháng; tối đa 2 cùng lúc; hợp tuổi và vai',()=>{
 const ids=new Set(Lf.EVENT_KINDS.map(k=>k.id));assert.equal(ids.size,31);
 for(const k of Lf.EVENT_KINDS)if(k.next)assert.ok(ids.has(k.next[0]),k.id);
 let total=0,people=0;
 for(let w=0;w<30;w++){const world='life'+w;for(const n of N.buildRoster(world)){const ev=Lf.eventsBetween(world,n,30,389);people++;total+=ev.length;
  assert.deepEqual(ev,Lf.eventsBetween(world,n,30,389),'cùng seed cùng đời sống');
  for(const e of ev){const k=Lf.EVENT_KINDS.find(x=>x.id===e.kind);if(!k.chained&&k.age){const a=N.ageAt(n.born,e.start);assert.ok(a>=k.age[0]&&a<=k.age[1],`${n.id} ${a} ${e.kind}`)};if(k.roles)assert.ok(k.roles.includes(n.id));assert.ok(e.end>e.start)}
  for(let d=30;d<390;d+=7)assert.ok(Lf.eventsOn(world,n,d).filter(e=>!Lf.EVENT_KINDS.find(k=>k.id===e.kind).chained).length<=2)}}
 const perMonth=total/people/12;assert.ok(perMonth>=2&&perMonth<=5,'mỗi tháng '+perMonth.toFixed(2));
});

test('cảm xúc ngày giữ nguyên trong ngày, theo biến cố; hoạt động và mệt đói theo giờ',()=>{
 const R=N.buildRoster('mood');let badSad=0,bad=0;
 for(const n of R.filter(n=>!n.arch))for(let d=0;d<120;d++){const m=Lf.moodOf('mood',n,d);assert.equal(m,Lf.moodOf('mood',n,d));const ev=Lf.eventsOn('mood',n,d);
  if(ev.length&&ev.every(e=>e.tone==='bad')){bad++;if(['sad','tired','annoyed'].includes(m))badSad++}if(ev.length&&ev.every(e=>e.tone==='good'))assert.ok(['happy','excited'].includes(m))}
 assert.equal(badSad,bad,'biến cố xấu thì không vui');
 const veg=R.find(n=>n.id==='veg'),mon=[0,1,2,3,4,5,6,7].find(d=>require('../.test-build/domain/format').dateAt(d).getUTCDay()===1);
 assert.equal(Lf.activityOf(veg,mon,600).place,'market');assert.ok(Lf.activityOf(veg,mon,120).sleeping);
 const a=Lf.needsOf(veg,mon,700),b=Lf.needsOf(veg,mon,1000);assert.ok(b.fatigue>a.fatigue);assert.ok(Lf.needsOf(veg,mon,715).hunger>Lf.needsOf(veg,mon,725).hunger,'ăn trưa xong đỡ đói');
});

test('biến cố thành dữ kiện bản thân: chỉ chính NPC biết, mức riêng tư theo loại',()=>{
 const s={...engine.initial(),seed:{world:'facts2',life:'l'},day:100};const f=Lf.npcFacts(s);assert.ok(f.length>0);
 for(const x of f){assert.equal(x.topic,'self');assert.deepEqual(x.knownBy,[x.about]);assert.ok(x.vars.event)}
 assert.ok(T.factsOf(s).some(x=>x.topic==='self'));
});

test('quên: 30 ngày giảm 1, trọng số 5 thì 60 ngày, nhắc lại +1; người tốt bụng quên lỗi nhanh; tối đa 12 mỗi người, 200 tổng',()=>{
 const m=(id,w,tag='help',npc='veg',day=0)=>({id,day,npc,tag,weight:w});const tr=()=>[];
 assert.deepEqual(Lf.forgetMemories([m('a',3)],29,tr).map(x=>x.weight),[3]);assert.deepEqual(Lf.forgetMemories([m('a',3)],30,tr).map(x=>x.weight),[2]);
 assert.deepEqual(Lf.forgetMemories([m('a',2)],30,tr),[]);assert.deepEqual(Lf.forgetMemories([m('a',2)],30,tr,()=>true).length,1,'đang gắn móc thì giữ');
 assert.deepEqual(Lf.forgetMemories([m('a',5)],59,tr).map(x=>x.weight),[5]);assert.deepEqual(Lf.forgetMemories([m('a',5)],60,tr).map(x=>x.weight),[4]);
 const r=Lf.reinforce(m('a',3),20);assert.equal(r.weight,4);assert.deepEqual(Lf.forgetMemories([r],49,tr).map(x=>x.weight),[4],'nhắc lại thì tính lại từ đầu');
 assert.deepEqual(Lf.forgetMemories([m('a',3,'refuse')],20,()=>['tốt bụng']).map(x=>x.weight),[2]);assert.deepEqual(Lf.forgetMemories([m('a',3,'refuse')],30,()=>['cau có']).map(x=>x.weight),[3]);
 // đi một năm: giảm dần đều
 let list=[m('a',4)];for(let d=1;d<=365;d++)list=Lf.forgetMemories(list,d,tr);assert.equal(list.length,0);
 const many=Array.from({length:20},(_,i)=>m('x'+i,2+i%4,'help','veg',i));assert.equal(Lf.forgetMemories(many,25,tr).length,12);assert.ok(Lf.forgetMemories(many,25,tr).every(x=>x.weight>=3||x.day>=8));
 const big=Array.from({length:23*12},(_,i)=>m('y'+i,3,'help',N.NPC_IDS[i%23],0));assert.equal(Lf.forgetMemories(big,1,tr).length,200);
});

test('một năm qua ngày: đời sống NPC không làm save lớn thêm quá 5 KB',()=>{
 const D=require('../.test-build/domain/director');let s={...engine.initial(),seed:{world:'size',life:'l'},day:0};const before=JSON.stringify(s).length;
 const mk=(i)=>({id:'m'+i,day:0,npc:N.NPC_IDS[i%23],motif:'favor',topic:'xách đồ',tag:'help',weight:2+i%4});
 s={...s,story:{...D.storyOf(s),memories:Array.from({length:60},(_,i)=>mk(i))}};
 for(let d=1;d<=365;d++){const n={...s,day:d};s=D.settleStory(s,n)}
 assert.ok(engine.valid(s));assert.ok(JSON.stringify(s).length-before<5000,'thêm '+(JSON.stringify(s).length-before)+' byte');assert.equal(D.storyOf(s).memories.length,0,'không ai nhắc lại thì quên hết sau một năm');
});
