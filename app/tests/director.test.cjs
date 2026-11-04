const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../.test-build/domain/director');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');
const {socialOf}=require('../.test-build/domain/social');const N=require('../.test-build/domain/npc');
const at=(day,minute,location,extra={})=>{const s=engine.initial();return{...s,day,money:5e6,clock:{...clockOf(s),minute,location},...extra}};
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state),'state hợp lệ');return r.state};
const withPending=(s,npc,motif,variant=0,extra={})=>({...s,story:{...D.storyOf(s),pending:{key:`${s.day}:x${Math.random().toString(36).slice(2,7)}`,npc,motif,variant,by:'npc',day:s.day,...extra}}});

test('người chơi chủ động: chỉ khi người đó ở đây; mở câu chuyện; cách nhau 60 phút',()=>{
 let s=at(0,1140,'home');assert.equal(D.startTalk(s,'co-hanh').ok,false,'Cô Hạnh không ở khu trọ buổi tối');assert.equal(D.startTalk(s,'me').ok,false,'Mẹ chỉ liên lạc từ xa');
 s=ok(D.startTalk(s,'ba-tu'));const ev=D.openEvent(s);assert.equal(ev.npc.id,'ba-tu');assert.ok(ev.options.length>=2);assert.ok(ev.options.every(o=>!/[+−-]\d/.test(o.label)),'không ghi hệ quả');
 const back=engine.parse(JSON.stringify(s));assert.ok(back&&back.story.pending,'câu chuyện đang mở giữ qua lưu');
 assert.equal(D.startTalk(s,'ba-tu').ok,false,'đang có chuyện dở');s=ok(D.answerEvent(s,0));assert.equal(D.storyOf(s).pending,undefined);
 assert.ok(s.journal.some(j=>j.title.startsWith('Bà Tư')));assert.equal(D.startTalk(s,'ba-tu').ok,false,'chưa đủ 60 phút');
 assert.ok(D.startTalk({...s,clock:{...s.clock,minute:clockOf(s).minute+60}},'ba-tu').ok);
});

test('NPC tự bắt chuyện tối đa 3 lần mỗi ngày',()=>{
 let total=0;for(let day=0;day<20;day++){let s=at(day,480,'home');let count=0;for(let m=480;m<1400;m+=20){for(const place of ['home','market','park','office']){s={...s,clock:{...clockOf(s),minute:m,location:place}};const n=D.maybeStart(s,'arrive');if(D.storyOf(n).pending&&!D.storyOf(s).pending){count++;const ev=D.openEvent(n);const i=ev.options.findIndex(o=>!o.locked);s=ok(D.answerEvent(n,i))}}}assert.ok(count<=3,`ngày ${day}: ${count}`);total+=count}
 assert.ok(total>=15,'có sự kiện xảy ra đều đặn: '+total);
});

test('quan hệ cộng tối đa 5 điểm mỗi người mỗi ngày',()=>{
 let s=at(0,1140,'home');for(let i=0;i<4;i++){s=withPending(s,'ba-tu','greet');s=ok(D.answerEvent(s,0))}assert.equal(socialOf(s).relations['ba-tu'].score,5);
 s={...s,day:1,clock:{...clockOf(s),minute:1140}};s=withPending(s,'ba-tu','greet');s=ok(D.answerEvent(s,0));assert.equal(socialOf(s).relations['ba-tu'].score,8);
});

test('nhờ giúp ghi ký ức và móc; tới hạn thì gặp lại nhắc đúng việc bằng thời gian áng chừng',()=>{
 let s=withPending(at(0,1140,'home'),'ba-tu','favor',0);s=ok(D.answerEvent(s,0));const st=D.storyOf(s);assert.equal(st.memories.length,1);assert.equal(st.memories[0].topic,'xách đồ');assert.equal(st.hooks.length,1);
 const h=st.hooks[0];assert.ok(h.from>=3&&h.from<=15);s={...s,day:h.from,clock:{...clockOf(s),minute:1140,location:'home'}};
 s=ok(D.startTalk(s,'ba-tu'));const ev=D.openEvent(s);assert.equal(ev.motif,'Gặp lại');assert.match(ev.line,/xách đồ/);assert.doesNotMatch(ev.line+ev.recall,/\d+\/\d+|\d{4}/,'không ghi ngày cụ thể');
 assert.match(ev.recall,/^(Mấy hôm trước|Tuần trước|Mấy tuần trước)/);s=ok(D.answerEvent(s,0));assert.equal(D.storyOf(s).hooks.length,0);
});

test('từ chối thì người đó nhớ, lần gặp lại thái độ khác',()=>{
 let s=withPending(at(0,1140,'home'),'ba-tu','favor',0);s=ok(D.answerEvent(s,2));const h=D.storyOf(s).hooks[0];s={...s,day:h.from,clock:{...clockOf(s),minute:1140,location:'home'}};
 s=ok(D.startTalk(s,'ba-tu'));const ev=D.openEvent(s);assert.match(ev.line,/bận/);assert.ok(!ev.options.some(o=>/quà/.test(o.label)));
});

test('lựa chọn thiếu kỹ năng hoặc thiếu tiền bị khoá',()=>{
 const s=withPending(at(0,1140,'home'),'ba-tu','favor',2);const ev=D.openEvent(s);assert.equal(ev.options[0].locked,true);assert.match(ev.options[0].need,/Lập trình Lv2/);assert.equal(D.answerEvent(s,0).ok,false);
 const poor=withPending(at(0,1140,'home',{money:1000}),'ba-tu','loan',2);assert.equal(D.openEvent(poor).options[0].locked,true);assert.equal(D.answerEvent(poor,0).ok,false);
});

test('cho mượn: khoảng 20% không trả với người tính cách trung bình; tới hạn thì trả hoặc ghi nhớ',()=>{
 let unpaid=0,runs=300;for(let i=0;i<runs;i++){let s=at(i,1140,'home');s={...s,story:{...D.storyOf(s),seq:i*7}};s=withPending(s,'ba-tu','loan',0);s=ok(D.answerEvent(s,0));const l=D.storyOf(s).loans[0];if(!l.repay)unpaid++}
 assert.ok(unpaid/runs>.12&&unpaid/runs<.28,'tỷ lệ không trả '+unpaid/runs);
 let s=withPending(at(0,1140,'home'),'ba-tu','loan',0);s=ok(D.answerEvent(s,0));const l=D.storyOf(s).loans[0],before=s.money;assert.equal(before,5e6-200000);
 const next=D.settleStory(s,{...s,day:l.due});const done=D.storyOf(next).loans[0];assert.ok(done.settled);if(l.repay)assert.equal(next.money,before+200000);else assert.ok(D.storyOf(next).memories.some(m=>m.topic==='chưa trả tiền mượn'));assert.ok(engine.valid(next));
});

test('hao mòn khi lâu không gặp, có sàn theo bậc đã đạt',()=>{
 const base=at(0,1140,'home');const mk=(score,peak)=>({...base,day:14,social:{relations:{'ba-tu':{score,lastDay:0,minutes:0}},chatMinutesDay:0,chatDay:0,peak:{'ba-tu':peak}}});
 assert.equal(socialOf(D.settleStory(base,mk(35,35))).relations['ba-tu'].score,34);assert.equal(socialOf(D.settleStory(base,mk(30,35))).relations['ba-tu'].score,30,'không tụt dưới mốc Thân');
 assert.equal(socialOf(D.settleStory(base,{...mk(25,25),day:13})).relations['ba-tu'].score,25,'chỉ hao mỗi 7 ngày');
});

test('Mẹ nhắn tin buổi tối; dữ liệu câu chuyện sai bị từ chối',()=>{
 let s=withPending(at(0,1140,'home'),'me','mom',1);s=ok(D.answerEvent(s,1));const {stock}=require('../.test-build/domain/life');assert.equal(stock(s,'rice'),3,'mẹ gửi gạo');
 assert.equal(engine.valid({...s,story:{...D.storyOf(s),pending:{key:'x',npc:'khong-co',motif:'greet',variant:0,by:'npc',day:0}}}),false);
 assert.equal(engine.valid({...s,story:{...D.storyOf(s),loans:[{id:'l',npc:'ba-tu',amount:-5,due:3,repay:true}]}}),false);
 assert.equal(N.agoText(1),'hôm qua');assert.equal(N.agoText(3),'mấy hôm trước');assert.equal(N.agoText(30),'tháng trước');
});
