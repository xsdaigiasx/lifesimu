const test=require('node:test'),assert=require('node:assert/strict');
const I=require('../.test-build/domain/inbox');const D=require('../.test-build/domain/director');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');
const {socialOf}=require('../.test-build/domain/social');const N=require('../.test-build/domain/npc');const {dateAt}=require('../.test-build/domain/format');
const at=(day,minute,location,extra={})=>{const s=engine.initial();return{...s,day,money:5e6,clock:{...clockOf(s),minute,location},...extra}};
const withRel=(s,id,score,lastDay=s.day)=>({...s,social:{...socialOf(s),relations:{...socialOf(s).relations,[id]:{score,lastDay,minutes:0}}}});
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state),'state hợp lệ');return r.state};
const close=N.NPCS.find(n=>n.story&&!n.remote&&n.id!=='me');
const day=(d,s)=>I.settleInbox({...s,day:d});

test('lịch tin mỗi ngày: tối đa 2, Mẹ cách ít nhất 2 ngày, nhắc trọ trước 2 ngày',()=>{
 let s=at(0,420,'home');for(const n of N.NPCS.filter(n=>n.story&&!n.remote))s=withRel(s,n.id,40,0);
 const momDays=[];for(let d=1;d<60;d++){s=I.deliverDue(day(d,{...s,clock:{...s.clock,minute:1439}})).state;
  const q=I.inboxOf(s).threads;const today=Object.values(q).flat().filter(m=>m.day===d&&m.from==='npc'&&m.kind!=='note'&&m.kind!=='missed');assert.ok(today.length<=I.DAILY_MESSAGES,`ngày ${d}: ${today.length} tin`);
  if((q.me??[]).some(m=>m.day===d&&m.from==='npc'))momDays.push(d);if(dateAt(d+2).getUTCDate()===1)assert.ok((q['ba-tu']??[]).some(m=>m.day===d&&m.kind==='rent'),'nhắc trọ')}
 assert.ok(momDays.length>=8,'Mẹ nhắn đều');for(let i=1;i<momDays.length;i++)assert.ok(momDays[i]-momDays[i-1]>=2,'Mẹ cách ít nhất 2 ngày');
 assert.ok(engine.valid(s));assert.ok(engine.parse(JSON.stringify(s)),'giữ qua lưu');
});

test('tin tới giờ mới vào hộp, đọc và trả lời một lần, nhắn không tốn giờ',()=>{
 let s=at(3,420,'home');s=I.settleInbox(s);const q=I.inboxOf(s).queue.find(x=>x.npc==='me');if(!q){s={...s,inbox:{...I.inboxOf(s),queue:[{id:'q3:me:mom-care',npc:'me',day:3,minute:1150,from:'npc',text:'Ăn chưa con?',kind:'mom-care',replies:['Dạ rồi','Chưa mẹ']}]}}}
 const target=I.inboxOf(s).queue.find(x=>x.npc==='me');assert.equal(I.deliverDue({...s,clock:{...s.clock,minute:target.minute-1}}).from.length,0,'chưa tới giờ');
 const r=I.deliverDue({...s,clock:{...s.clock,minute:target.minute}});assert.deepEqual(r.from,['Mẹ']);s=r.state;assert.equal(I.unreadCount(s,'me'),1);
 s=I.markRead(s,'me');assert.equal(I.unreadCount(s),0);const msg=I.inboxOf(s).threads.me.at(-1),min=clockOf(s).minute;
 s=ok(I.replyMessage(s,'me',msg.id,0));assert.equal(clockOf(s).minute,min,'nhắn tin không tốn giờ');assert.equal(I.replyMessage(s,'me',msg.id,1).ok,false,'không trả lời hai lần');
 assert.ok(socialOf(s).relations.me.score>0);
});

test('hỏi thăm mỗi ngày một lần, cần có số',()=>{
 let s=at(2,600,'home');assert.equal(I.sendMessage(s,close.id,'hello').ok,false,'chưa quen thì chưa có số');
 s=withRel(s,close.id,12);s=ok(I.sendMessage(s,close.id,'hello'));assert.equal(I.sendMessage(s,close.id,'hello').ok,false);assert.equal(clockOf(s).minute,600);
 assert.ok(I.contactsOf(s).some(n=>n.id===close.id));assert.ok(I.contactsOf(at(0,600,'home')).some(n=>n.id==='me'),'Mẹ luôn có trong danh bạ');
});

test('nhận lời hẹn: đến đúng nơi đúng giờ thì diễn ra, lỡ hẹn thì mất điểm và bị nhớ',()=>{
 let s=withRel(at(4,700,'home'),close.id,35);const ib=I.inboxOf(s);
 s={...s,inbox:{...ib,threads:{[close.id]:[{id:'m1',day:4,minute:700,from:'npc',text:'Mai đi ăn không?',kind:'invite',replies:['Được','Bận'],appt:{day:5,minute:1110,place:'streetfood'}}]}}};
 s=ok(I.replyMessage(s,close.id,'m1',0));assert.equal(I.inboxOf(s).appts.length,1);assert.ok(s.journal.some(j=>j.title.startsWith('Hẹn đi ăn')));
 // đến đúng giờ ở quán
 let a=I.settleInbox({...s,day:5});a={...a,clock:{...a.clock,minute:1100,location:'streetfood'}};assert.ok(I.dueAppointment(a));
 assert.equal(I.dueAppointment({...a,clock:{...a.clock,location:'home'}}),undefined,'sai chỗ thì không có hẹn');
 a=D.maybeStart(a,'arrive');const ev=D.storyOf(a).pending;assert.ok(ev&&ev.npc===close.id,'buổi hẹn mở câu chuyện');assert.equal(I.inboxOf(a).appts[0].status,'done');
 const before=socialOf(a).relations[close.id].score;a=ok(D.answerEvent(a,0));assert.ok(socialOf(a).relations[close.id].score>=before);
 // lỡ hẹn
 let m=I.settleInbox({...s,day:5});const sc=socialOf(m).relations[close.id].score;m=I.settleInbox({...m,day:6});
 assert.equal(I.inboxOf(m).appts[0].status,'missed');assert.equal(socialOf(m).relations[close.id].score,sc+I.MISSED_PENALTY);
 assert.ok(D.storyOf(m).memories.some(x=>x.npc===close.id&&x.topic==='lỡ hẹn đi ăn'));assert.ok(I.inboxOf(m).queue.some(q=>q.npc===close.id&&q.kind==='missed'));assert.ok(engine.valid(m));
});

test('rủ đi ăn: không rủ Mẹ, không hẹn chồng',()=>{
 let s=withRel(at(2,600,'home'),close.id,35);assert.equal(I.sendMessage(s,'me','invite').ok,false);
 let found=false;for(let d=2;d<30&&!found;d++){const t={...s,day:d};const r=ok(I.sendMessage(t,close.id,'invite'));if(I.inboxOf(r.state??r).appts.length){found=true;assert.equal(I.sendMessage(r,close.id,'invite').ok,false,'đã có hẹn');assert.equal(I.inboxOf(r).appts[0].day,d+1)}}
 assert.ok(found,'có ngày nhận lời');
});

test('không trả lời Mẹ quá 2 ngày thì Mẹ nhớ',()=>{
 let s=at(2,600,'home');s={...s,inbox:{...I.inboxOf(s),threads:{me:[{id:'m1',day:2,minute:1150,from:'npc',text:'Ăn chưa con?',kind:'mom-care',replies:['Dạ rồi','Chưa']}]}}};
 s=I.settleInbox({...s,day:3});assert.equal(I.inboxOf(s).threads.me[0].answered,undefined);s=I.settleInbox({...s,day:4});
 assert.equal(I.inboxOf(s).threads.me[0].answered,-1);assert.ok(D.storyOf(s).memories.some(x=>x.npc==='me'&&x.topic==='chưa trả lời mẹ'));
});

test('gọi điện: 15 phút, Mẹ và từ Thân, mỗi ngày một lần',()=>{
 let s=withRel(at(2,600,'home'),close.id,15);assert.equal(I.callNpc(s,close.id).ok,false,'Quen biết chưa gọi được');
 s=ok(I.callNpc(s,'me'));assert.equal(clockOf(s).minute,600+I.CALL_MINUTES);assert.equal(I.callNpc(s,'me').ok,false);
 s=withRel(s,close.id,32);s=ok(I.callNpc(s,close.id));assert.ok(s.journal.some(j=>j.title===`Gọi điện cho ${close.name}`));
});

test('dữ liệu hộp thư hỏng bị từ chối',()=>{
 const s=at(2,600,'home');assert.ok(engine.valid({...s,inbox:I.inboxOf(s)}));
 for(const bad of [{version:2},{...I.inboxOf(s),threads:{ai:[]}},{...I.inboxOf(s),appts:[{id:'a',npc:'me',day:99,minute:0,place:'home',status:'set'}]},{...I.inboxOf(s),queue:Array(21).fill({id:'q',npc:'me',day:0,minute:0,from:'npc',text:'',kind:'note'})}])assert.equal(engine.valid({...s,inbox:bad}),false);
});

test('lời nhắn theo vai vế: người lớn nói kiểu người lớn, người chơi đáp có dạ ạ',()=>{
 const s=withRel(at(4,700,'home'),'ba-tu',35);
 const hi=I.inboxOf(I.sendMessage(s,'ba-tu','hello').state).threads['ba-tu'];assert.match(hi[0].text,/bà.*ạ\?$/);
 const inv=I.inboxOf(I.sendMessage(s,'ba-tu','invite').state).threads['ba-tu'];assert.match(inv[0].text,/con mời bà/);assert.doesNotMatch(inv[1].text,/Ok|nha!/);
 let t=s;const seen=[];for(let d=1;d<40;d++){t=I.settleInbox({...t,day:d});for(const q of I.inboxOf(t).queue)if(q.npc==='ba-tu'&&(q.kind==='invite'||q.kind==='checkin'))seen.push(q)}
 assert.ok(seen.length,'Bà Tư có nhắn');for(const q of seen){assert.match(q.text,/bà|con/);assert.ok(q.replies.every(r=>r.startsWith('Dạ')),q.replies.join('/'))}
 assert.equal(I.voiceFor('dev-an').rank,'peer');assert.equal(I.voiceFor('tuan').rank,'junior');assert.equal(I.voiceFor('dev-trang').rank,'senior');
});
