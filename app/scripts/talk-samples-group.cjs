/* H7c: in 30 câu mẫu cảnh nhóm, tin đồn, NPC kể tin, người nghe đáp khi người chơi kể lại, để chủ dự án duyệt.
 * Chạy sau khi build test: node scripts/talk-samples-group.cjs [số câu] */
const {engine}=require('../.test-build/domain/engine'),G=require('../.test-build/domain/talk/gossip'),N=require('../.test-build/domain/npc'),D=require('../.test-build/domain/talk/group-data');
const want=Number(process.argv[2]||30),out=[],seen=new Set(),kinds={spat:0,gossip:0,price:0,chat:0,tell:0,after:0,reply:0},cap={spat:7,gossip:8,price:2,chat:5,tell:4,after:6,reply:3};
const add=(k,text)=>{if(seen.has(text)||kinds[k]>=cap[k])return false;seen.add(text);kinds[k]++;out.push(`[${k}] ${text}`);return true};
const PLACES=[['market',540],['home',1200],['park',450],['streetfood',720],['office',600],['market',600],['home',960]];
for(let w=0;w<60&&out.length<want;w++){const world='mau-h7c-'+w;
 for(let day=20;day<90&&out.length<want;day+=7)for(const [place,minute] of PLACES){
  const s={...engine.initial(),day,seed:{world,life:'l'},clock:{minute,location:place,lastWorkDay:-1,lastStudyDay:-1,lastRestDay:-1},office:{...(engine.initial().office||{}),role:'employee',employerId:w%2?'sen-code':'an-nhien-tech'}};
  const sc=G.pickScene(s,`m${w}:${day}`);if(sc){const name=id=>N.castById(s,id).name;const kind=sc.kind;
   if(kinds[kind]<cap[kind]){add(kind,sc.lines.map(l=>`${name(l.who)}: ${l.text}`).join(' / '))}
   if(kinds.after<cap.after){const choices=G.groupChoices(s,sc).map(c=>c.id).filter(c=>!['listen','join','ask'].includes(c));for(const c of choices){const st={...s,gossip:{version:1,heard:[],told:[],pending:sc}};const r=G.answerGroup(st,c);if(r.ok&&r.lines?.length)add('after',`(${c}) `+r.lines.map(l=>`${name(l.who)}: ${l.text}`).join(' / '))}}}
  const here=N.peopleHere(s).filter(n=>!n.remote&&!n.family);for(const n of here){const t=G.npcTells(s,n,`${w}:${day}`);if(t)add('tell',`${n.name} kể: ${t.text}`)}
 }}
// câu đáp khi người chơi kể lại tin (một người mỗi bậc tuổi)
{const s={...engine.initial(),seed:{world:'mau-h7c-0',life:'l'}};for(const id of ['neighbor','banhmi','courier'])for(const l of D.TELL_REPLY.slice(0,2)){const n=N.castById(s,id);add('reply',`${n.name} đáp: ${l.text.replace(/\{pS\}/g,n.self).replace(/\{pY\}/g,n.you).replace(/^./,c=>c.toUpperCase()).replace(/([.?!]\s+)(\p{Ll})/gu,(_,p,c)=>p+c.toUpperCase())}`)}}
out.slice(0,want).forEach((l,i)=>console.log(`${i+1}. ${l}`));console.error(kinds);
