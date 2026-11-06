/** Controlled fixtures, not observed event frequencies. Run after npm test. */
const B=p=>require('../.test-build/domain/'+p),T=B('talk/threads'),C=B('talk/compose'),N=B('npc'),L=B('talk/npc-life');
const roster=N.buildRoster('thread-samples');
console.log('# 30 mẫu hội thoại có tag\n\nSinh bằng `node scripts/talk-thread-samples.cjs` sau `npm test`. Đây là các tình huống kiểm thử được đặt trước; câu và nhánh được chọn bằng seed, không phải thống kê tần suất chơi.\n');
for(let i=0;i<30;i++){
 const t=T.THREAD_TOPICS[i%T.THREAD_TOPICS.length],event=t.events[i%t.events.length],k=L.EVENT_KINDS.find(k=>k.id===event);
 const n=roster.find(n=>(!t.roles||t.roles.includes(n.id))&&(!k.age||n.age>=k.age[0]&&n.age<=k.age[1]))||roster[0],seed='sample:'+i;
 const f={id:`npc:${n.id}:${event}:8`,topic:'self',sub:k.sub,about:n.id,day:8,tone:k.tone,private:0,knownBy:[n.id],vars:{event:k.name,item:'cái tivi mới',...(event==='slow'?{detail:'khách hỏi giá rồi đi xem thêm, chưa quay lại mua'}:{})},tags:['event:'+event]};
 const a=C.compose({npc:n,tier:'close',mood:k.tone==='good'?'happy':'tired',channel:'face',minute:600,day:10,seed,facts:[f],needFact:true});
 if(!a?.thread)throw Error('No thread '+event);
 const q=T.threadChoices(a.thread,n,seed)[i%2],b=T.respondThread(a.thread,n,q.signal,seed);
 console.log(`## ${i+1}. ${k.name} — ${n.name}\n\nSeed: \`${seed}\`; mạch: \`${t.id}\`; hướng đáp: \`${q.signal}\`.\n\n- NPC: ${a.text}\n- Người chơi: ${q.label}\n- NPC: ${b.text}\n`);
}
