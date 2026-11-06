const test=require('node:test'),assert=require('node:assert/strict');
const B=p=>require('../.test-build/domain/'+p),T=B('talk/threads'),C=B('talk/compose'),N=B('npc'),R=B('talk/replies'),D=B('director'),I=B('inbox'),L=B('talk/npc-life'),S=B('talk/interlude'),{engine}=B('engine'),{clockOf}=B('time');
const state=()=>{const s=engine.initial();return {...s,day:10,money:5e6,energy:90,clock:{...clockOf(s),minute:540,location:'market'}}};
const npc=id=>N.castById(state(),id);
const fact=(kind='slow',id='veg',extra={})=>{const k=L.EVENT_KINDS.find(k=>k.id===kind);return {id:`npc:${id}:${kind}:8`,topic:'self',sub:k.sub,about:id,day:8,tone:k.tone,private:0,knownBy:[id],vars:{event:k.name,item:'cái tivi mới'},tags:['event:'+kind],...extra}};
const ctx=(f,seed='test',more={})=>({npc:npc(f.about),tier:'close',mood:f.tone==='good'?'happy':'tired',channel:'face',minute:540,place:'market',day:10,seed,facts:[f],needFact:true,...more});
test('tag catalog: every branch has answers; duplicate IDs and unbound tags rejected',()=>{
 assert.deepEqual(T.threadProblems(),[]);assert.equal(T.THREAD_TOPICS.length,18);assert.equal(T.THREAD_TOPICS.reduce((n,t)=>n+t.beats.length,0),174);
 const bad=structuredClone(T.THREAD_TOPICS);bad[0].beats[0].requires.push('not-generated');assert.match(T.threadProblems(bad).join(','),/tag không nguồn/);
});
test('1000 seeds: sales-slow never becomes sold-out, sales-brisk or a promise of free goods',()=>{
 const seen=new Set();for(let i=0;i<1000;i++){const f=fact(),a=C.compose(ctx(f,'slow:'+i));assert.equal(a.thread.topic,'sales-slow');assert.equal(a.intent,'complain');assert.equal(a.fact.id,f.id);assert.ok(!a.gift);assert.doesNotMatch(a.text,/hết sạch|đắt hàng|bỏ mối|cho thêm/);assert.deepEqual(C.compose(ctx(f,'slow:'+i)),a);seen.add(a.text);
  assert.equal(C.compose(ctx(f,'bad:'+i,{intents:['brag']})),null);
 }assert.equal(seen.size,3);
});
test('all sample events: privacy/identity/channel and semantic replies; no cross-thread answers',()=>{
 for(const t of T.THREAD_TOPICS)for(const event of t.events)for(let i=0;i<12;i++){
  const f=fact(event,t.roles?.[0]??'landlord'),c=ctx(f,`${event}:${i}`),a=C.compose(c);assert.ok(a?.thread,event);assert.equal(a.thread.topic,t.id);assert.ok(T.validThread(a.thread));assert.doesNotMatch(a.text,/[{}]/);
  for(const q of T.threadChoices(a.thread,c.npc,c.seed)){const b=T.respondThread(a.thread,c.npc,q.signal,c.seed);assert.ok(b,`${event}:${q.signal}`);assert.doesNotMatch(b.text,/[{}]/);assert.ok(T.validThread(b.thread));if(q.action==='ask'){assert.ok(b.thread.tags.includes('heard:'+q.signal));assert.ok(!T.threadChoices(b.thread,c.npc,c.seed).some(x=>x.signal===q.signal));assert.equal(T.respondThread(b.thread,c.npc,q.signal,c.seed),null)}}
  assert.equal(C.compose({...c,npc:npc('courier')}),null);
  assert.equal(C.compose({...c,facts:[{...f,private:3}],tier:'stranger'}),null);
  assert.equal(C.compose({...c,minute:1380,channel:'face'}),null);
 }
});
test('no disconnected activity: hearing about illness never means running/eating or recording that memory',()=>{
 for(let i=0;i<1000;i++){const n=npc('neighbor'),f=fact('backache','neighbor'),a=C.compose(ctx(f,'sick:'+i));const scene=S.sceneOf({npc:n,thread:a.thread,signal:'duration',kind:'talk',intent:'complain',tier:'close',channel:'face',place:i%2?'park':'restaurant',minute:540,seed:'scene:'+i,said:`Bị lâu chưa ${n.self}?`});assert.doesNotMatch(JSON.stringify(scene),/chạy bộ|chạy tiếp|ngồi ăn|ăn chung/);assert.match(scene.lines[2].text,/2 ngày trước/)}
});
test('event detail stays stable across seeds of dialogue; missing detail never leaves placeholders',()=>{
 const f=fact('slow','veg',{vars:{event:'buôn bán ế',detail:'khách hỏi giá rồi đi xem thêm, chưa quay lại mua'}});
 for(let i=0;i<50;i++){const a=C.compose(ctx(f,'detail:'+i)),b=T.respondThread(a.thread,npc('veg'),'cause','reply:'+i);assert.ok(b.text.includes(f.vars.detail));assert.ok(!b.text.includes('sửa đường'))}
 const a=C.compose(ctx(fact()));assert.doesNotMatch(T.respondThread(a.thread,npc('veg'),'cause','empty').text,/[{}]|undefined/);
 const n=npc('veg');assert.deepEqual(L.eventsBetween('stable',n,0,100),L.eventsBetween('stable',n,0,100));
});
test('game integration: every choice matches its displayed answer after save/reload; legacy saves accepted',()=>{
 for(const event of ['slow','backache','kidexam','buy']){
  const s=state(),f=fact(event),a=C.compose(ctx(f));const opened=D.openTalk(s,npc('veg'),D.talkLineOf(a),'npc');assert.ok(engine.valid(opened));const restored=engine.parse(JSON.stringify(opened));assert.ok(restored);
  const ev=D.openEvent(restored);assert.equal(ev.options.length,4);
  const options=R.buildReplies({...B('talk/live').replyCtxOf(restored,npc('veg'),a.intent,D.storyOf(restored).pending.key),thread:a.thread});
  for(let i=0;i<4;i++){const out=D.answerEvent(restored,i);assert.ok(out.ok,out.error);assert.ok(engine.valid(out.state));assert.equal(out.state.money,s.money);assert.equal(D.storyOf(out.state).pending,undefined);
   const expected=T.respondThread(a.thread,npc('veg'),options[i].signal,'scene:'+D.storyOf(restored).pending.key);assert.equal(out.text,expected.text);if(out.scene)assert.equal(out.scene[2].text,expected.text);
  }
  const bad=structuredClone(opened);bad.story.pending.talk.thread.tags.push('event:brisk');assert.equal(engine.valid(bad),false);
  const old=structuredClone(opened);delete old.story.pending.talk.thread;assert.ok(engine.valid(old));
 }
});
test('inbox integration: stored choice signal drives response, not only generic ask action',()=>{
 const s=state(),f=fact(),a=C.compose(ctx(f,'sms',{channel:'text'})),choices=T.threadChoices(a.thread,npc('veg'),'sms');
 const msg={id:'tag-test',day:10,minute:540,from:'npc',text:a.text,kind:'checkin',replies:choices.slice(0,2).map(q=>q.label),talk:{i:a.intent,a:['ask','ask'],thread:a.thread,signals:choices.slice(0,2).map(q=>q.signal),f:f.id}};
 const withMsg={...s,inbox:{...I.inboxOf(s),threads:{veg:[msg]}}};assert.ok(engine.valid(withMsg));
 const late=I.replyMessage({...withMsg,day:12},'veg',msg.id,0);assert.ok(late.ok);assert.match(I.inboxOf(late.state).threads.veg.at(-1).text,/^Lúc nhắn tin/);assert.ok(engine.valid(late.state));
 for(let i=0;i<2;i++){const out=I.replyMessage(withMsg,'veg',msg.id,i);assert.ok(out.ok);assert.ok(engine.valid(out.state));assert.equal(I.inboxOf(out.state).threads.veg.at(-1).text,T.respondThread(a.thread,npc('veg'),choices[i].signal,'re:'+msg.id).text)}
});
test('needFact excludes an unrelated generic body; used openings remain blocked',()=>{
 const f={...fact(),tags:undefined},data={frames:[{id:'f',intent:'complain',slots:['body']}],pieces:[{id:'b',slot:'body',text:'Chuyện gì cũng được.',intent:['complain']}]};assert.equal(C.compose(ctx(f,'generic',{data})),null);
 let recent=[];for(let i=0;i<3;i++){const a=C.compose(ctx(fact(),'used'+i,{recent}));assert.ok(a?.thread);recent.push(...a.prints.filter(k=>k.startsWith('p:')).map(k=>({k,d:10})))}
 const a=C.compose(ctx(fact(),'exhausted',{recent}));assert.ok(!a?.thread);
});
