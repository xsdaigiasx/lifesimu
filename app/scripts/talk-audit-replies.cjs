/* Rà câu NPC kèm lựa chọn trả lời (60 câu, mỗi người mỗi ý định một câu). Chạy sau khi build test: node scripts/talk-audit-replies.cjs */
const B=p=>require('../.test-build/domain/'+p);
const {engine}=B('engine'),D=B('director'),N=B('npc'),{clockOf,START}=B('time');
const out=[],seenI={};
for(let w=0;w<30&&out.length<90;w++){let s={...engine.initial(),money:5e6,seed:{world:'aud'+w,life:'aud'+w}};
 s={...s,social:{relations:Object.fromEntries(N.rosterOf(s).map(n=>[n.id,{score:[5,15,35,65][w%4],lastDay:0,minutes:5}])),chatMinutesDay:0,chatDay:0}};
 for(let d=3;d<40;d+=3){s={...s,day:d};for(const [place,min] of [['market',540],['home',1200],['streetfood',720],['park',450]]){s={...s,clock:{...clockOf(s),minute:min,location:place}};
  for(const n of N.peopleHere(s)){const r=D.startTalk(s,n.id);if(!r.ok)continue;const ev=D.openEvent(r.state);const p=D.storyOf(r.state).pending;if(!ev||!p?.talk)continue;const k=`${n.id}:${p.talk.intent}`;seenI[k]=(seenI[k]??0)+1;if(seenI[k]>1)continue;
   out.push(`[${p.talk.intent}${p.talk.sub?'/'+p.talk.sub:''}] ${n.name}: ${p.talk.text}\n    → ${ev.options.map(o=>o.label).join(' | ')}`)}}}}
console.log(out.slice(0,90).join('\n'));
