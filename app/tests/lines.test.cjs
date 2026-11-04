const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../.test-build/domain/director');const Lx=require('../.test-build/domain/lines');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');
const at=(day,minute,location,extra={})=>{const s=engine.initial();return{...s,day,money:5e6,energy:90,clock:{...clockOf(s),minute,location},...extra}};
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state),'state hợp lệ');return r.state};
const firstOpen=ev=>ev.options.findIndex(o=>!o.locked);

test('thư viện câu: mọi chỗ trống điền được, không ghi ngày, từ địa phương nhẹ',()=>{
 for(const l of Lx.LINES){const t=Lx.fill(l.text,{self:'bà',you:'con',ago:'tuần trước',topic:'xách đồ',fear:'cô đơn',amount:'200 nghìn'});assert.doesNotMatch(t,/[{}]/,l.id);assert.doesNotMatch(t,/\d+\/\d+/,l.id);
  const local=(t.match(/\b(nghen|hen|hông|rứa|răng|ni|hỉ|nờ|tui|á)\b/g)||[]).length;assert.ok(local<=2,`${l.id}: ${local} từ địa phương`)}
 assert.ok(Lx.LINES.length>=100,'đủ câu cho bản chơi thử: '+Lx.LINES.length);
});

test('giọng theo người: Bà Tư không dùng câu của giọng miền Bắc',()=>{
 for(let i=0;i<40;i++){const l=Lx.chooseLine('greet','tay',15,[],i*7919);assert.ok(!l.voice||l.voice==='tay',l.id)}
 const close=Lx.chooseLine('greet','sg',40,[],3),stranger=Lx.chooseLine('greet','sg',0,[],3);assert.ok((close.min??0)>=30&&(stranger.max??100)<10,'câu đổi theo bậc');
});

test('60 ngày nói chuyện: không lặp câu với cùng người trong 10 lần; có nhắc chuyện cũ đều',()=>{
 let s=at(0,1140,'home'),said=[],callbacks=new Set();
 for(let day=0;day<60;day++){s={...s,day,clock:{...clockOf(s),minute:1110,location:'home'}};
  for(const m of [1110,1180]){s={...s,clock:{...clockOf(s),minute:m}};const r=D.startTalk(s,'ba-tu');if(!r.ok)continue;s=r.state;const p=D.storyOf(s).pending;if(p.line)said.push(p.line);if(p.memory)callbacks.add(day);s=ok(D.answerEvent(s,firstOpen(D.openEvent(s))))}
  s={...s,clock:{...clockOf(s),minute:1200}};const m=D.maybeStart(s,'arrive');if(D.storyOf(m).pending){const p=D.storyOf(m).pending;if(p.npc==='ba-tu'&&p.line)said.push(p.line);if(p.memory&&p.npc==='ba-tu')callbacks.add(day);s=ok(D.answerEvent(m,firstOpen(D.openEvent(m))))}
  if(day%4===0){s={...s,story:{...D.storyOf(s),pending:{key:`${day}:fav`,npc:'ba-tu',motif:'favor',variant:day%3===2?0:day%3,by:'npc',day}}};s=ok(D.answerEvent(s,0))}
  s=D.settleStory(s,{...s,day:day+1})}
 for(let i=0;i<said.length;i++)assert.ok(!said.slice(Math.max(0,i-10),i).includes(said[i]),`lặp câu ${said[i]} ở lần ${i}`);
 assert.ok(callbacks.size>=12,'nhắc chuyện cũ ít nhất mỗi 5 ngày: '+callbacks.size);
});

test('ký ức nhẹ mờ sau 30 ngày, ký ức nặng còn nhớ',()=>{
 const base=at(40,1140,'home'),mk=w=>({id:'m'+w,day:5,npc:'ba-tu',motif:'favor',topic:'xách đồ',tag:'help',weight:w});
 const s={...base,story:{...D.storyOf(base),memories:[mk(2),mk(4)]}};const next=D.settleStory(s,{...s,day:41});assert.deepEqual(D.storyOf(next).memories.map(m=>m.weight),[4]);
});

test('quỵt nợ: gặp lại thì người đó xin khất; xoá nợ được ghi nhớ lâu',()=>{
 let s=at(10,1140,'home');s={...s,story:{...D.storyOf(s),loans:[{id:'l1',npc:'ba-tu',amount:500000,due:9,repay:false,settled:'unpaid'}]}};
 s=ok(D.startTalk(s,'ba-tu'));let ev=D.openEvent(s);assert.equal(ev.motif,'Khất nợ');assert.match(ev.line,/khất|chưa/);
 const half=ok(D.answerEvent(s,1));assert.equal(half.money,s.money+250000);assert.ok(D.storyOf(half).loans[0].resolved);
 const forgive=ok(D.answerEvent(s,2));assert.ok(D.storyOf(forgive).memories.some(m=>m.topic==='được xoá nợ'&&m.weight===4));
 const ext=ok(D.answerEvent(s,0));const l=D.storyOf(ext).loans[0];assert.equal(l.settled,undefined);assert.equal(l.due,17);
});
