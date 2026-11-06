const test=require('node:test'),assert=require('node:assert/strict');
const B=p=>require('../.test-build/domain/'+p);
const {engine}=B('engine'),D=B('director'),I=B('inbox'),O=B('talk/outing'),C=B('talk/compose'),{clockOf}=B('time'),{dateAt}=B('format');
const at=(day,minute,location,extra={})=>{const s=engine.initial();return{...s,day,money:5e6,energy:90,clock:{...clockOf(s),minute,location},...extra}};
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state),'state hợp lệ');return r.state};
const rel=(s,id,score)=>({...s,social:{chatMinutesDay:0,chatDay:0,...s.social,relations:{...(s.social?.relations??{}),[id]:{score,lastDay:s.day,minutes:5}}}});
const invite=(s,npc,piece)=>({...s,story:{...D.storyOf(s),pending:{key:`${s.day}:9`,npc,motif:'greet',variant:0,by:'npc',day:s.day,talk:{text:'Chiều nay ra công viên đánh cờ không?',intent:'invite',prints:[`p:${piece}`]}}}});
const dow=d=>dateAt(d).getUTCDay();

test('#357: câu rủ có kế hoạch hợp lệ (lúc, việc, chỗ có thật), đủ cho các lời rủ ra ngoài',()=>{
 const plans=C.TALK.pieces.filter(p=>p.plan);assert.ok(plans.length>=60,'số câu rủ có kế hoạch '+plans.length);
 for(const p of plans){assert.ok(p.intent.includes('invite')&&p.slot==='ask',p.id);assert.ok(O.PLAN_ATS.includes(p.plan.at)&&O.OUT_ACTS.includes(p.plan.act),p.id)}
});

test('#357: giờ hẹn: trong ngày đã qua thì dời sang mai; cuối tuần là thứ bảy, đang thứ bảy thì hôm nay hoặc chủ nhật',()=>{
 const fri=[...Array(14).keys()].find(d=>dow(d)===5),sat=fri+1;
 assert.deepEqual(O.whenOf({at:'afternoon',act:'drink'},fri,600),{day:fri,minute:960});
 assert.deepEqual(O.whenOf({at:'afternoon',act:'drink'},fri,1000),{day:fri+1,minute:960},'qua giờ thì mai');
 assert.deepEqual(O.whenOf({at:'weekend',act:'walk'},fri,600),{day:sat,minute:960});
 assert.deepEqual(O.whenOf({at:'weekend',act:'walk'},sat,600),{day:sat,minute:960});
 assert.deepEqual(O.whenOf({at:'weekend',act:'walk'},sat,1000),{day:sat+1,minute:960});
 assert.equal(O.timeText({day:fri,minute:960},fri),'4 giờ chiều nay');assert.equal(O.timeText({day:sat,minute:960},fri),'4 giờ chiều mai');
});

test('#357: nhận lời thì NPC chốt giờ và có hẹn; NPC bao, mình bao, ai nấy trả; hỏi mấy giờ thì NPC nói giờ rồi hỏi lại',()=>{
 let s=rel(at(10,600,'home'),'neighbor',75);s=invite(s,'neighbor','l2-083');
 const ev=D.openEvent(s),labels=ev.options.map(o=>o.label);
 const pick=re=>{const i=labels.findIndex(l=>re.test(l));return i<0?null:ok(D.answerEvent(s,i))};
 const plain=D.answerEvent(s,labels.findIndex(l=>/^Đi chứ, .* đi với/.test(l)));assert.ok(plain.ok);
 assert.equal(plain.scene.length,3);assert.match(plain.scene[1].text,/4 giờ chiều nay/);
 const ap=I.inboxOf(plain.state).appts.find(a=>a.npc==='neighbor');assert.deepEqual([ap.act,ap.pay,ap.place,ap.minute,ap.status],['chess','each','park',960,'set']);
 const ask=pick(/Mấy giờ/);if(ask){const p=D.storyOf(ask).pending;assert.ok(p.talk&&p.talk.turn===2);assert.match(p.talk.text,/4 giờ chiều nay/);assert.ok(!D.openEvent(ask).options.some(o=>/Mấy giờ/.test(o.label)))}
 /* câu rủ ăn uống: có câu "bao" */
 let e=rel(at(10,600,'streetfood'),'courier',75);e=invite(e,'courier','l1-554');const el=D.openEvent(e).options.map(o=>o.label);
 const joke=el.findIndex(l=>/thì .* đi liền/.test(l)),treat=el.findIndex(l=>/để .* bao/.test(l));
 if(joke>=0)assert.equal(I.inboxOf(ok(D.answerEvent(e,joke))).appts[0].pay,'npc');
 if(treat>=0)assert.equal(I.inboxOf(ok(D.answerEvent(e,treat))).appts[0].pay,'me');
 assert.ok(joke>=0||treat>=0,'có lựa chọn bao: '+el.join(' | '));
 /* đánh cờ không tốn tiền: không có câu "bao" */assert.ok(!labels.some(l=>/bao/.test(l)));
});

test('#357: tới hẹn thì đi cùng: tốn giờ, tiền theo người trả, cộng quan hệ, để lại ký ức; không đi thì NPC phật ý',()=>{
 const base=rel(at(12,950,'streetfood'),'courier',40),mk=pay=>{const r=I.addAppointment(base,{npc:'courier',day:12,minute:960,place:'streetfood',act:'eat',pay});return D.maybeStart(r.state,'arrive')};
 for(const [pay,cost] of [['each',40000],['me',80000],['npc',0]]){const s=mk(pay);assert.ok(D.storyOf(s).pending?.appt,'vào sự kiện đi cùng');const ev=D.openEvent(s);assert.equal(ev.options.length,2);
  const r=D.answerEvent(s,0),n=ok(r);assert.equal(s.money-n.money,cost,pay);assert.equal(r.scene.length,3);assert.ok(clockOf(n).minute>=clockOf(s).minute+45);
  assert.ok(n.social.relations.courier.score>s.social.relations.courier.score);assert.ok(D.storyOf(n).memories.some(m=>m.npc==='courier'&&m.topic==='đi ăn chung'));assert.equal(D.storyOf(n).pending,undefined)}
 const s=mk('each'),n=ok(D.answerEvent(s,1));assert.ok(n.social.relations.courier.score<s.social.relations.courier.score);assert.equal(I.inboxOf(n).appts.find(a=>a.npc==='courier').status,'missed');
 const poor={...mk('me'),money:1000};assert.ok(D.openEvent(poor).options[0].locked);assert.equal(D.answerEvent(poor,0).ok,false);
});

test('#357 tầng 3: 3 lần cùng việc trong 14 ngày thành nếp, thứ sáu NPC rủ cho thứ bảy; từ chối 2 lần liền thì thôi rủ',()=>{
 const fri=[...Array(30).keys()].find(d=>d>=14&&dow(d)===5);let s=rel(at(fri,480,'home'),'courier',40);
 const ib=I.inboxOf(s);s={...s,inbox:{...ib,appts:[3,7,10].map((k,i)=>({id:`h${i}`,npc:'courier',day:fri-k,minute:450,place:'park',act:'run',status:'done'}))}};
 assert.deepEqual(I.habitOf(s,'courier'),{act:'run',place:'park',minute:450});
 const old={...s,inbox:{...I.inboxOf(s),appts:I.inboxOf(s).appts.map(a=>({...a,day:a.day-10}))}};assert.equal(I.habitOf(old,'courier'),null,'quá 14 ngày thì hết nếp');
 const declined=n=>({...s,inbox:{...I.inboxOf(s),threads:{courier:Array.from({length:n},(_,i)=>({id:`m${i}`,day:fri-7*(i+1),minute:600,from:'npc',text:'x',kind:'invite',replies:['a','b'],answered:1,appt:{day:fri-7*(i+1)+1,minute:450,place:'park',act:'run'}}))}}});
 assert.ok(I.habitOf(declined(1),'courier'));assert.equal(I.habitOf(declined(2),'courier'),null,'từ chối 2 lần liền thì thôi');
 const missed={...s,inbox:{...I.inboxOf(s),appts:[...I.inboxOf(s).appts,...[1,2].map(i=>({id:`x${i}`,npc:'courier',day:fri-i,minute:450,place:'park',act:'run',status:'missed'}))]}};assert.equal(I.habitOf(missed,'courier'),null,'lỡ hẹn 2 lần liền thì thôi');
 assert.ok(I.upcomingAppointments({...s,inbox:{...I.inboxOf(s),appts:[{id:'u',npc:'courier',day:fri+1,minute:450,place:'park',act:'run',status:'set'}]}})[0].title.startsWith('Chạy bộ với'));
});
