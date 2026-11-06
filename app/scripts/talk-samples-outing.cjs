/* #357: in đoạn rủ, nhận lời, tới hẹn đi cùng từ game thật. Chạy sau khi build test: node scripts/talk-samples-outing.cjs [số đoạn] [seed] */
const B=p=>require('../.test-build/domain/'+p);
const {engine}=B('engine'),D=B('director'),N=B('npc'),{clockOf}=B('time'),I=B('inbox');
const want=+(process.argv[2]||5),tag=process.argv[3]||'1';let found=0;const seen=new Set();
const spots=[['market',540],['home',1110],['streetfood',720],['park',390],['office',720],['home',600]];
const show=(n,ls)=>ls.map(l=>l.who==='narr'?`  *${l.text}*`:`${l.who==='me'?'Bạn':n.name}: ${l.text}`).join('\n');
const yes=/Đi chứ|bao|đi liền/;
for(let w=0;w<400&&found<want;w++)for(let dd=0;dd<30&&found<want;dd++){let s={...engine.initial(),money:5e6,energy:90,seed:{world:`ot${tag}-${w}`,life:`ot${tag}-${w}`}};
 s={...s,social:{relations:Object.fromEntries(N.rosterOf(s).map(n=>[n.id,{score:[25,45,75][w%3],lastDay:0,minutes:5}])),chatMinutesDay:0,chatDay:0}};
 const [place,min]=spots[(w+dd)%spots.length];s={...s,day:3+dd+(w*7+ +tag)%11,clock:{...clockOf(s),minute:min,location:place}};
 for(const n of N.peopleHere(s)){if(seen.has(n.id))continue;const r=D.startTalk(s,n.id);if(!r.ok)continue;const p=D.storyOf(r.state).pending;if(!p?.talk||!D.planOf(p.talk))continue;
  const ev=D.openEvent(r.state),pref=[/bao/,/Mấy giờ/,/Đi chứ/][(w+found)%3];let i=ev.options.findIndex(o=>!o.locked&&pref.test(o.label));if(i<0)i=ev.options.findIndex(o=>!o.locked&&yes.test(o.label));if(i<0)continue;
  const lines=[`[${place} ngày ${s.day}, ${n.name} ${n.age} tuổi]`,`${n.name}: ${ev.line}`];let a=D.answerEvent(r.state,i);if(!a.ok)continue;let t=a.state;
  if(D.storyOf(t).pending?.talk){const e1=D.openEvent(t);lines.push(`Bạn: ${ev.options[i].label}`,`${n.name}: ${e1.line}`);const j=e1.options.findIndex(o=>!o.locked&&yes.test(o.label));if(j<0)continue;a=D.answerEvent(t,j);if(!a.ok)continue;t=a.state}
  if(a.scene)lines.push(show(n,a.scene));const ap=I.inboxOf(t).appts.find(x=>x.npc===n.id);if(!ap)continue;
  if(ap.status==='set'){t={...t,day:ap.day,clock:{...clockOf(t),minute:ap.minute,location:ap.place}};t=D.maybeStart(t,'arrive');lines.push(`(tới hẹn ngày ${ap.day} ${Math.floor(ap.minute/60)}:${String(ap.minute%60).padStart(2,'0')}, ${ap.place})`)}
  const e2=D.openEvent(t);if(!e2||!D.storyOf(t).pending?.appt)continue;lines.push(`${n.name}: ${e2.line}`,`Bạn: ${e2.options[0].label}`);const b=D.answerEvent(t,0);if(!b.ok)continue;
  lines.push(show(n,b.scene),`(tiền ${(b.state.money-t.money).toLocaleString('vi-VN')}đ, ${ap.act}, ${ap.pay})`);console.log(lines.join('\n')+'\n');found++;seen.add(n.id);break}}
