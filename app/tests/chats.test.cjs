const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const C=require('../.test-build/domain/talk/groups'),G=require('../.test-build/domain/talk/gossip'),N=require('../.test-build/domain/npc'),L=require('../.test-build/domain/lifecycle'),O=require('../.test-build/domain/office');
const base=(world,employee=true)=>({...engine.initial(),seed:{world,life:'l'},...(employee?{office:{...O.initialOffice(),role:'employee',employerId:'sen-code'}}:{})});
const atClock=(s,minute,location='home')=>({...s,clock:{minute,location,lastWorkDay:-1,lastStudyDay:-1,lastRestDay:-1}});
const withScores=(s,v)=>({...s,social:{relations:Object.fromEntries(N.rosterOf(s).map(n=>[n.id,{score:v,lastDay:0,minutes:5}])),chatMinutesDay:0,chatDay:s.day}});

// thành viên theo nơi ở, chỗ làm
{const s=base('c1');assert(C.membersOf(s,'block').some(n=>n.id==='landlord'));assert.deepEqual(C.membersOf(s,'family').map(n=>n.id).sort(),['em','me']);assert.equal(C.membersOf(s,'work').length,4);
 assert.equal(C.membersOf(base('c1',false),'work').length,0);assert.deepEqual(C.myGroups(base('c1',false)),['block','family'])}

// 1 năm x 3 seed: mỗi nhóm tối đa 3, tổng tối đa 6 tin mỗi ngày; tin đồn chỉ về người ngoài nhóm; tất định; lát cắt nhỏ, save hợp lệ
{const stats={days:0,msgs:0,rumor:0,invite:0,news:0,maxBytes:0};
 for(const w of ['y1','y2','y3']){let s=base(w);
  for(let d=1;d<=365;d++){s=C.settleChats({...s,day:d});const again=C.settleChats(s);assert.equal(again,s,'qua ngày hai lần không sinh thêm tin');let total=0;
   for(const g of C.GROUPS){const today=(s.chats.msgs[g]??[]).filter(m=>m.day===d);assert(today.length<=C.CHAT.perGroup,`${g} ngày ${d}: ${today.length} tin`);total+=today.length;const ids=new Set(C.membersOf(s,g).map(n=>n.id));const seenR=new Set((s.chats.msgs[g]??[]).filter(m=>m.day<d&&m.rumor).map(m=>m.rumor));
    for(const m of today){assert(ids.has(m.from),`${g}: người ngoài nhóm nhắn`);if(m.rumor){const r=G.parseRumor(m.rumor);assert(r);assert(!seenR.has(m.rumor),'tin đồn nhắc lại trong nhóm');if(r.ev!=='price')assert(!ids.has(r.about),'tin đồn về người trong nhóm');stats.rumor++}if(m.kind==='invite')stats.invite++;if(m.kind==='news')stats.news++;assert(!/[{}]/.test(m.text),m.text);assert(!(s.chats.msgs[g]??[]).some(o=>o.day<d&&o.from!=='player'&&o.text===m.text),'lặp câu trong 7 ngày: '+m.text)}}
   assert(total<=C.CHAT.total);stats.msgs+=total;stats.days++;stats.maxBytes=Math.max(stats.maxBytes,JSON.stringify(s.chats).length)}
  assert(engine.parse(JSON.stringify(s)));assert(C.validChats(s.chats,s.day))}
 const perDay=stats.msgs/stats.days;assert(perDay>=1.5&&perDay<=6,`trung bình ${perDay.toFixed(1)} tin mỗi ngày`);assert(stats.rumor>20&&stats.invite>10&&stats.news>20,JSON.stringify(stats));assert(stats.maxBytes<8000,`${stats.maxBytes} byte`);
 const a=C.settleChats({...base('y9'),day:40}),b=C.settleChats({...base('y9'),day:40});assert.deepEqual(a.chats,b.chats,'tất định theo seed')}

// Mẹ (mã 'me') nhắn thì là Mẹ, không lẫn với người chơi
{let s=base('fam');let momMsg=null;for(let d=1;d<120&&!momMsg;d++){s=C.settleChats({...s,day:d});momMsg=(s.chats.msgs.family??[]).find(m=>m.from==='me')}assert(momMsg,'Mẹ có nhắn');assert.equal(N.castById(s,momMsg.from).id,'me')}
// tin tới theo giờ; đọc thì hết chấm và biết tin đồn trong nhóm
{let s=null;for(let d=10;d<200&&!s;d++){const x=C.settleChats({...base('r1'),day:d});if(C.GROUPS.some(g=>(x.chats.msgs[g]??[]).some(m=>m.day===d&&m.rumor)))s=x}assert(s,'có ngày có tin đồn');
 const g=C.GROUPS.find(g=>(s.chats.msgs[g]??[]).some(m=>m.day===s.day&&m.rumor)),m=s.chats.msgs[g].find(m=>m.day===s.day&&m.rumor);
 const early=atClock(s,m.minute-1),late=atClock(s,1400);assert(!C.visibleMsgs(early,g).some(x=>x.id===m.id),'chưa tới giờ thì chưa thấy');assert(C.groupUnread(late,g)>0);
 const r=C.readGroup(late,g);assert.equal(C.groupUnread(r,g),0);assert(r.gossip.heard.some(h=>h.r===m.rumor&&h.how==='chat'))}

// trả lời 1 lần mỗi nhóm mỗi ngày, cộng nhẹ người vừa nhắn; nhận lời rủ thì có hẹn: đến thì cả nhóm thân hơn, không đến thì người rủ giận nhẹ
{let found=null;for(let w=0;w<40&&!found;w++)for(let d=5;d<120&&!found;d++){const x=C.settleChats({...base('i'+w),day:d});for(const g of ['block','work']){const m=(x.chats.msgs[g]??[]).find(m=>m.day===d&&m.kind==='invite'&&m.invite.day===d);if(m&&(x.chats.msgs[g].filter(y=>y.day===d).at(-1).id===m.id)){found={x,g,m};break}}}
 assert(found,'có lời rủ');const {x,g,m}=found;let s=withScores(atClock(x,m.minute+1,'home'),12);const rep=C.groupReplies(s,g);assert.equal(rep.to.id,m.id);assert.deepEqual(rep.options.map(o=>o.id),['pi-1','pi-2']);
 const r=C.replyGroup(s,g,'pi-1');assert(r.ok);assert.equal(C.groupReplies(r.state,g),null,'một lần mỗi ngày');assert.equal(C.replyGroup(r.state,g,'pi-2').ok,false);{const rel=r.state.social.relations[m.from];assert(rel.score>12||rel.carry>0,'cộng nhẹ (bậc Quen biết nhân 0,6 nên có thể dồn vào phần lẻ)')}
 const appt=r.state.chats.appts.at(-1);assert.equal(appt.place,m.invite.place);
 const there=atClock(r.state,m.invite.minute,m.invite.place);assert(C.dueGroupAppt(there));const at=C.attendGroup(there);assert(at.ok,at.error);for(const n of C.membersOf(there,g))assert(at.state.social.relations[n.id].score>=there.social.relations[n.id].score);assert.equal(at.state.chats.appts.at(-1).status,'done');assert(at.state.journal.some(e=>e.key.startsWith('chatappt:')));
 const miss=C.settleChats({...r.state,day:r.state.day+1});assert.equal(miss.chats.appts.find(a=>a.id===appt.id).status,'missed');assert(miss.social.relations[m.from].score<r.state.social.relations[m.from].score)}

// save: dữ liệu hỏng bị chặn; người rời vai thì xoá tin và hẹn của họ
{const s=C.settleChats({...base('v1'),day:30});for(const bad of [{...s.chats,version:2},{...s.chats,msgs:{xyz:[]}},{...s.chats,appts:[{id:'a',g:'block',day:99,minute:1,place:'park',from:'landlord',status:'set'}]}])assert.equal(C.validChats(bad,30),false);
 const from=C.GROUPS.flatMap(g=>s.chats.msgs[g]??[])[0].from;const n=L.archive(s,from,from+'.0');assert(!C.GROUPS.some(g=>(n.chats.msgs[g]??[]).some(m=>m.from===from)))}
console.log('PASS chats: members, ≤3 per group ≤6 per day, rumors only about outsiders, read/hear, one reply per day, group invites attend/miss, save slice, archive');
