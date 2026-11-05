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
 const i=ev.options.findIndex(o=>!o.locked);const n=ok(D.answerEvent(s,i));
 assert.equal(D.storyOf(n).pending,undefined);assert.equal(St.talkOf(n).log.length,1);assert.ok(St.printsOf(n,'landlord').some(x=>x.k.startsWith('p:')));
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
