/* #354: in đoạn tự diễn ngẫu nhiên từ game thật (chọn câu kéo dài chuyện). Chạy sau khi build test: node scripts/talk-samples-scene.cjs [số đoạn] [seed] */
const B=p=>require('../.test-build/domain/'+p);
const {engine}=B('engine'),D=B('director'),N=B('npc'),{clockOf}=B('time');
const want=+(process.argv[2]||5),tag=process.argv[3]||String(Date.now()%100000),out=[];
const spots=[['market',540],['home',1110],['streetfood',720],['park',390],['home',1200],['market',600],['office',720],['park',1080]];
for(let w=0;w<60&&out.length<want;w++){let s={...engine.initial(),money:5e6,energy:90,seed:{world:`sc${tag}-${w}`,life:`sc${tag}-${w}`}};
 s={...s,social:{relations:Object.fromEntries(N.rosterOf(s).map(n=>[n.id,{score:[8,25,45,75][w%4],lastDay:0,minutes:5}])),chatMinutesDay:0,chatDay:0}};
 const [place,min]=spots[(w*7+ +tag)%spots.length];s={...s,day:3+w%20,clock:{...clockOf(s),minute:min,location:place}};
 const n=N.peopleHere(s)[w%Math.max(1,N.peopleHere(s).length)];if(!n)continue;const r=D.startTalk(s,n.id);if(!r.ok)continue;
 const ev=D.openEvent(r.state);if(!ev)continue;let res=null;for(const [i,o] of ev.options.entries()){if(o.locked)continue;const a=D.answerEvent(r.state,i);if(a.ok&&a.scene){res=a;break}}
 if(!res)continue;const name={me:'Bạn',npc:n.name};
 out.push(`[${place} ${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}, ${n.name} ${n.age} tuổi]\n${n.name}: ${ev.line}\n`+res.scene.map(l=>l.who==='narr'?`  *${l.text}*`:`${name[l.who]}: ${l.text}`).join('\n'))}
console.log(out.join('\n\n'));
