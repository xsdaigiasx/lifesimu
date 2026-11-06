/* Rà hội thoại 3 lượt: mỗi lượt chọn câu kéo dài chuyện, in câu NPC và lựa chọn. Chạy sau khi build test: node scripts/talk-audit-long.cjs */
const B=p=>require('../.test-build/domain/'+p);
const {engine}=B('engine'),D=B('director'),N=B('npc'),{clockOf}=B('time');
const out=[];let k=0;
for(let w=0;w<20&&out.length<14;w++){let s={...engine.initial(),money:5e6,seed:{world:'long'+w,life:'long'+w}};
 s={...s,social:{relations:Object.fromEntries(N.rosterOf(s).map(n=>[n.id,{score:[15,35,65][w%3],lastDay:0,minutes:5}])),chatMinutesDay:0,chatDay:0}};
 for(let d=3;d<30&&out.length<14;d+=4){s={...s,day:d};for(const [place,min] of [['market',540],['home',1200],['streetfood',720]]){s={...s,clock:{...clockOf(s),minute:min,location:place}};
  for(const n of N.peopleHere(s).slice(0,1)){const r=D.startTalk(s,n.id);if(!r.ok)continue;let t=r.state;const lines=[];
   for(let turn=0;turn<3;turn++){const ev=D.openEvent(t);if(!ev)break;const p=D.storyOf(t).pending;lines.push(`  ${n.name}: ${ev.line}`);lines.push(`    → ${ev.options.map(o=>o.label).join(' | ')}`);
    const opts=ev.options.map((o,i)=>({o,i})).filter(x=>!x.o.locked);const pick=opts.find(x=>/kể|Kể|Hỏi|hỏi|rồi sao|Còn|giúp|phụ|Nghe/.test(x.o.label))??opts[0];if(!pick)break;lines.push(`    ✔ ${pick.o.label}`);const a=D.answerEvent(t,pick.i);if(!a.ok)break;t=a.state}
   if(lines.length>6)out.push(lines.join('\n'))}}}}
console.log(out.slice(0,12).join('\n\n'));
