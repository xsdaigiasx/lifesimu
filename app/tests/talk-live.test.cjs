const test=require('node:test'),assert=require('node:assert/strict');
const B=p=>require('../.test-build/domain/'+p);
const {engine}=B('engine'),D=B('director'),I=B('inbox'),St=B('talk/state'),C=B('talk/compose'),{clockOf}=B('time'),{lifeOf}=B('life');
const at=(day,minute,location,extra={})=>{const s=engine.initial();return{...s,day,money:5e6,energy:90,clock:{...clockOf(s),minute,location},...extra}};
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state),'state hợp lệ');return r.state};

test('H5: Lô 1 có khoảng 500 mảnh riêng cho 6 người, câu hứa cho đồ đều có quà thật',()=>{
 const own=C.TALK.pieces.filter(p=>p.id.startsWith('l1-'));assert.ok(own.length>=500,'số mảnh '+own.length);
 for(const id of ['me','em','landlord','sen-dev','ant-dev','veg','courier'])assert.ok(own.filter(p=>p.npc===id).length>=50,id);
});

test('H5: trò chuyện với chủ trọ dùng câu ghép, lựa chọn thái độ, trả lời ghi nhật ký và vân tay',()=>{
 let s=ok(D.startTalk(at(20,1150,'home'),'landlord'));const p=D.storyOf(s).pending;
 if(!p.talk)return;// mô-típ khác (gặp lại, khất nợ) vẫn dùng câu cũ
 assert.equal(p.line,undefined);const ev=D.openEvent(s);assert.equal(ev.line,p.talk.text);assert.ok(ev.options.length>=3&&ev.options.length<=4);
 let n=s;for(let k=0;k<3&&D.storyOf(n).pending;k++)n=ok(D.answerEvent(n,D.openEvent(n).options.findIndex(o=>!o.locked)));
 assert.equal(D.storyOf(n).pending,undefined);const turns=St.talkOf(n).log.length;assert.ok(turns>=1&&turns<=3,'số lượt '+turns);assert.ok(St.printsOf(n,'landlord').some(x=>x.k.startsWith('p:')));
 assert.ok(St.printsOf(n,'landlord').some(x=>x.k.startsWith('r:')),'ghi bộ lựa chọn');
 // gặp lại trong ngày (sau 60 phút): câu khác
 const again=D.startTalk({...n,clock:{...clockOf(n),minute:1215}},'landlord');if(again.ok&&D.storyOf(again.state).pending.talk)assert.notEqual(D.storyOf(again.state).pending.talk.text,p.talk.text);
});

test('H5: câu hứa cho đồ thì Nhận cho thật vào Tủ bếp',()=>{
 let s=at(20,500,'market');const key=`${s.day}:1`;const t={text:'Lấy thêm bó rau nha, cô cho.',intent:'ask',prints:['p:l1-075'],gift:['vegetable',1]};
 s={...s,story:{...D.storyOf(s),seq:1,pending:{key,npc:'veg',motif:'greet',variant:0,by:'npc',day:s.day,talk:t}}};assert.ok(engine.valid(s));
 const ev=D.openEvent(s);assert.match(ev.options[0].label,/cảm ơn/);const before=lifeOf(s).pantry.filter(x=>x.ingredient==='vegetable').reduce((a,x)=>a+x.qty,0);
 const n=ok(D.answerEvent(s,0));assert.equal(lifeOf(n).pantry.filter(x=>x.ingredient==='vegetable').reduce((a,x)=>a+x.qty,0),before+1);
 const no=ok(D.answerEvent(s,1));assert.equal(lifeOf(no).pantry.filter(x=>x.ingredient==='vegetable').reduce((a,x)=>a+x.qty,0),before);
 // save sai (quà không có trong danh mục) bị chặn
 assert.equal(engine.valid({...s,story:{...D.storyOf(s),pending:{...D.storyOf(s).pending,talk:{...t,gift:['vàng',1]}}}}),false);
});

test('H5: tin nhắn Mẹ và em ghép từ bộ sinh, ghi vân tay; tất định theo ngày',()=>{
 let seen=0;for(let d=3;d<40;d++){const s=I.settleInbox(at(d,420,'home'));const q=I.inboxOf(s).queue.filter(x=>(x.npc==='me'&&x.kind==='mom-care')||(x.npc==='em'&&x.kind==='checkin'));
  for(const m of q){seen++;assert.ok(!/[{}]/.test(m.text),m.text);if(St.printsOf(s,m.npc).length)assert.ok(St.printsOf(s,m.npc).some(x=>x.k.startsWith('t:')));assert.ok(!m.replies||m.replies.length===2)}
  assert.deepEqual(I.settleInbox(at(d,420,'home')).inbox,s.inbox,'tất định')}
 assert.ok(seen>=8,'có tin của Mẹ hoặc em: '+seen);
});

const LO2=['neighbor','meat','grocery','banhmi','sen-pm','ant-pm','sen-design','ant-design','sen-qa','ant-qa'];
test('H6: Lô 2 có mảnh riêng cho 7 vai (đồng nghiệp ở cả hai công ty), mọi người Lô 1 và Lô 2 nói bằng bộ ghép',()=>{
 const own=C.TALK.pieces.filter(p=>p.id.startsWith('l2-'));
 for(const id of LO2)assert.ok(own.filter(p=>p.npc===id).length>=50,id);assert.ok(own.length>=600,'số mảnh Lô 2 '+own.length);
 const L=B('talk/live');for(const id of ['me','em','landlord','sen-dev','veg','courier',...LO2])assert.ok(L.hasOwnLines(id),id);
});

/** Trả lời đến hết chuyện, chọn lựa chọn mở được đầu tiên; trả về số lượt. */
const finish=(s,pickAt=0)=>{let n=s,k=0;for(;k<4&&D.storyOf(n).pending;k++){const ev=D.openEvent(n),open=ev.options.map((o,i)=>o.locked?-1:i).filter(i=>i>=0);n=ok(D.answerEvent(n,open[Math.min(pickAt,open.length-1)]))}return{n,k}};
test('#354: chọn câu kéo dài chuyện thì hiện đoạn tự diễn (câu vừa nói, câu dẫn, câu chốt, câu chào), tốn thêm 10 phút, không còn lượt sau',()=>{
 let scenes=0;
 for(let d=20;d<60;d++){const s=at(d,960,'home'),r=D.startTalk(s,'neighbor');if(!r.ok||!D.storyOf(r.state).pending.talk)continue;
  for(let i=0;i<4;i++){const ev=D.openEvent(r.state);if(i>=ev.options.length||ev.options[i].locked)continue;const a=D.answerEvent(r.state,i);assert.ok(a.ok,a.error);const n=a.state;assert.ok(engine.valid(n));
   assert.equal(D.storyOf(n).pending,undefined,'không còn lượt sau');
   if(a.scene){scenes++;assert.equal(a.scene.length,4);assert.equal(a.scene[0].text,ev.options[i].label,'mở bằng câu người chơi vừa chọn');assert.deepEqual(a.scene.map(l=>l.who),['me','narr','npc','me']);
    assert.ok(a.scene.every(l=>!/[{}]/.test(l.text)),'không còn chỗ trống');assert.ok(D.storyOf(n).memories.some(m=>m.npc==='neighbor'&&m.tag==='scene'),'để lại ký ức nhẹ');assert.ok(clockOf(n).minute-clockOf(r.state).minute>=15,'tốn thêm 10 phút')}}}
 assert.ok(scenes>=5,'có đoạn tự diễn: '+scenes);
});
test('#354 tầng 1: ký ức nhẹ cùng chủ đề không nhân dòng; câu rủ, câu nhờ không thành đoạn tự diễn',()=>{
 let s=at(20,960,'home'),k=0;for(let d=20;d<70&&k<6;d++){s={...s,day:d,clock:{...clockOf(s),minute:960,location:'home'}};const r=D.startTalk(s,'neighbor');if(!r.ok||!D.storyOf(r.state).pending.talk)continue;const p=D.storyOf(r.state).pending,ev=D.openEvent(r.state);
  for(let i=0;i<ev.options.length;i++){if(ev.options[i].locked)continue;const a=D.answerEvent(r.state,i);if(!a.ok)continue;if(['invite','request'].includes(p.talk.intent))assert.equal(a.scene,undefined);if(a.scene){k++;s=a.state;break}}}
 const mine=D.storyOf(s).memories.filter(m=>m.npc==='neighbor'&&m.tag==='scene');assert.ok(mine.length>=1);assert.equal(new Set(mine.map(m=>m.topic)).size,mine.length,'mỗi chủ đề một dòng');
});

test('H6: người chơi tự mở lời theo chủ đề; Hỏi chuyện của họ cần Quen biết; người bán cho hỏi hàng',()=>{
 const s=at(25,960,'home');assert.deepEqual(D.topicsFor(s,'neighbor'),['health','mine']);
 assert.equal(D.startTalk(s,'neighbor','topic:theirs').ok,false);
 for(const t of ['health','mine']){const n=ok(D.startTalk(s,'neighbor','topic:'+t)),p=D.storyOf(n).pending;assert.ok(p.talk,'câu ghép');assert.match(p.talk.said,/\S/);assert.ok(D.openEvent(n).options.length>=3);finish(n)}
 const known={...s,social:{relations:{neighbor:{score:20,lastDay:25,minutes:0}},chatMinutesDay:0,chatDay:25}};assert.ok(D.topicsFor(known,'neighbor').includes('theirs'));
 const m=at(25,480,'market');assert.ok(D.topicsFor(m,'meat').includes('favor'),'hỏi hàng không cần quen');const f=ok(D.startTalk(m,'meat','topic:favor'));assert.ok(D.storyOf(f).pending.talk.text.length>3);
 assert.deepEqual(D.topicsFor(at(25,600,'hospital'),'doctor'),[],'người chưa có mảnh riêng không có chủ đề');
});

test('H6: gọi Mẹ mở cuộc nói chuyện ghép câu qua điện thoại; Nhật ký chỉ ghi một lần',()=>{
 let opened=0;for(let d=10;d<30;d++){const r=I.callNpc(at(d,1200,'home'),'me');assert.ok(r.ok,r.error);const p=D.storyOf(r.state).pending;if(!p)continue;opened++;
  assert.equal(p.talk.ch,'call');assert.equal(D.openEvent(r.state).motif,'Gọi điện');const {n}=finish(r.state);assert.equal(n.journal.filter(j=>j.title.startsWith('Gọi điện')||j.title.includes('Trò chuyện')).length,1)}
 assert.ok(opened>=15,'cuộc gọi Mẹ ghép câu: '+opened);
});

test('H6: trả lời tin Mẹ ghép thì câu đáp cũng ghép, không còn chỗ trống',()=>{
 let n=0;for(let d=3;d<60&&n<6;d++){let s=I.settleInbox(at(d,420,'home'));s=I.deliverDue({...s,clock:{...clockOf(s),minute:1430}}).state;
  const m=(I.inboxOf(s).threads.me??[]).find(x=>x.talk&&x.answered===undefined);if(!m)continue;
  for(const c of [0,1]){const r=ok(I.replyMessage(s,'me',m.id,c)),re=I.inboxOf(r).threads.me.at(-1);assert.equal(re.from,'npc');assert.ok(!/[{}]/.test(re.text),re.text)}n++}
 assert.ok(n>=3,'tin Mẹ ghép có trả lời: '+n);
});
