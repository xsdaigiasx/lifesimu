/* H8: mô phỏng hội thoại Lô 1 (HOI-THOAI I.9). Dùng đúng code domain (.test-build): director (startTalk, maybeStart, openEvent, answerEvent, settleStory), inbox (settleInbox, deliverDue) và bộ ghép câu.
 * Chạy: npm run sim:talk -- [--days 30] [--seeds 30]   (luôn build lại .test-build)
 * Người chơi trung bình: đi làm ngày thường, sáng ghé chợ hoặc trạm xe buýt, tối về nhà; gặp người Lô 1 thì nói chuyện 70%; ăn trưa ngoài, tối nấu hoặc ăn ngoài.
 * Chỉ tiêu (I.9): từ 90% câu không trùng nguyên văn (trong một đời chơi); 0 câu nhắc dữ kiện sai (mảnh có chủ đề phải khớp dữ kiện, đủ biến, NPC được biết);
 * người thường gặp (từ 12 câu một tháng) có từ 6 trong 8 ý định; từ 30% câu nhắc trạng thái người chơi hoặc biến cố thật (mảnh có chủ đề khớp dữ kiện). */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
if(!process.env.SIM_NO_BUILD){fs.mkdirSync(path.join(root,'.test-build'),{recursive:true});fs.writeFileSync(path.join(root,'.test-build/package.json'),'{"type":"commonjs"}');
 const r=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','-p','tsconfig.tests.json'],{cwd:root,stdio:'inherit'});if(r.status)process.exit(r.status)}
const B=p=>require(path.join(root,'.test-build/domain',p));
const {engine}=B('engine'),D=B('director'),N=B('npc'),I=B('inbox'),J=B('journal'),{clockOf,START}=B('time'),{dateAt}=B('format'),{hash}=B('shift');
const C=B('talk/compose'),{factsOf}=B('talk/facts'),{canKnow}=B('talk/axes');
/* H6: cả 12 người có mảnh riêng (Lô 1 và Lô 2; đồng nghiệp ở cả hai công ty) */
const TALKERS=['me','em','landlord','sen-dev','ant-dev','veg','courier','neighbor','meat','grocery','banhmi','sen-pm','ant-pm','sen-design','ant-design','sen-qa','ant-qa'],FRESH=process.argv.includes('--fresh');
const rngOf=key=>{let x=hash(`simtalk:${key}`)||1;return()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296}};
const MEALS=['Cơm tấm','Bún bò','Phở','Bánh mì','Hủ tiếu'],COOK=['Cơm trứng','Canh chua','Cơm thịt rau'];
const piece=id=>C.TALK.pieces.find(p=>p.id===id);

/** Dữ kiện có thật mà câu nhắc tới: mảnh có chủ đề thì dữ kiện phải đúng chủ đề, có trong danh sách lúc nói, NPC được biết, đủ biến. Trả về lỗi (rỗng là đúng) và câu có nhắc thật không. */
function audit(said,npc,facts,present){const errs=[],ps=said.pieces.map(piece);let real=false;
 for(const p of ps){if(!p){errs.push('mảnh lạ');continue}if(p.topic){const f=said.fact;if(!f){errs.push(`${p.id}: có chủ đề mà không có dữ kiện`);continue}
  if(!(p.topic.includes(f.sub)||p.topic.includes(f.topic)))errs.push(`${p.id}: chủ đề ${p.topic} khác ${f.sub}`);else real=true}
  for(const v of p.needs??[])if(said.fact?.vars?.[v]===undefined)errs.push(`${p.id}: thiếu ${v}`)}
 const f=said.fact;if(f){if(!facts.some(x=>x.id===f.id))errs.push(`dữ kiện ${f.id} không có thật`);if(!canKnow(f,npc,present))errs.push(`${npc} không được biết ${f.id}`)}
 if(/[{}]/.test(said.text))errs.push('còn chỗ trống');return{errs,real}}

function run(seed,days){const rnd=rngOf(seed),lines=[],errors=[],follows={n:0,texts:new Set()},topics={n:0},L=B('talk/live'),F=B('talk/facts');let s={...engine.initial()};const day0=s.day+seed*37;
 s={...s,day:day0,money:3_000_000,seed:{world:`talk${seed}`,life:`talk${seed}`},office:{...B('office').initialOffice(),role:'employee',employerId:seed%2?'an-nhien-tech':'sen-code'}};
 /* giữa game: quan hệ với người Lô 1 rải đều các bậc theo seed (Lạ, Quen biết, Thân, Tri kỷ); --fresh để bắt đầu từ 0 */
 if(!FRESH){const rel={};for(const id of TALKERS)rel[id]={score:[4,18,40,66][(hash(`rel:${seed}:${id}`)>>>3)%4],lastDay:day0,minutes:0};s={...s,social:{relations:rel,chatMinutesDay:0,chatDay:day0}}}
 s=J.recordJournal(s,`office:acceptOffer:${day0}`,'Nhận việc','');s=J.recordJournal(s,`move:${day0}`,'Chuyển tới phòng trọ','');
 const at=(place,minute)=>{s={...s,clock:{...clockOf(s),minute,location:place}}};
 const ate=(n,minute,place,out)=>{const l=B('life').lifeOf(s);s={...s,life:{...l,ate:[...(l.ate??[]),{n,d:s.day,m:minute,p:place,...(out?{out:true}:{})}].slice(-7)}}};
 /** Ghép lại câu từ trạng thái ngay trước khi mở (tất định) để biết dữ kiện đã dùng rồi kiểm. */
 let rumorTells=0;
 const check=(before,npcId,text,channel,seedKey,o={})=>{const npc=N.castById(before,npcId),said=L.sayNow(before,npc,channel,seedKey,o);if(!said||said.text!==text){errors.push(`${npcId}: ghép lại không khớp`+(process.env.DBG?` [${text}] vs [${said?.text}]`:""));return null}
  const c=clockOf(before),place=channel==='face'?c.location:undefined,present=place?F.witnesses(before,before.day,o.minute??c.minute,place):[];const a=audit(said,npcId,factsOf(before),present);errors.push(...a.errs.map(e=>`${npcId} ngày ${before.day-day0}: ${e}`));return{intent:said.intent,real:a.real,tier:L.tierFor(before,npc)}};
 const answer1=()=>{const ev=D.openEvent(s);if(!ev)return false;const open=ev.options.map((o,i)=>o.locked?-1:i).filter(i=>i>=0);const order=open.length?[rnd()<.6?open[0]:open[Math.floor(rnd()*open.length)],...open]:[0];
  for(const i of order){const r=D.answerEvent(s,i);if(r.ok){s=r.state;return true}}const st=structuredClone(s.story);delete st.pending;s={...s,story:st};return false};
 /* H6: trả lời tới hết chuyện (tối đa 3 lượt); câu NPC đáp tiếp được đếm riêng và kiểm chỗ trống */
 const answer=()=>{for(let k=0;k<3&&D.storyOf(s).pending;k++){if(!answer1())return;const p=D.storyOf(s).pending;if(p?.talk&&(p.talk.turn??1)>1){follows.n++;if(/[{}]/.test(p.talk.text))errors.push(`${p.npc}: câu đáp tiếp còn chỗ trống`);follows.texts.add(p.talk.text)}}};
 /* H7c: người quen có khi kể tin đồn thay cho câu ghép (không có vân tay mảnh): không ghép lại, chỉ đếm */
 const opened=(before,by)=>{const p=D.storyOf(s).pending;if(p?.talk&&!p.talk.prints.length&&p.talk.intent==='news'){rumorTells++;answer();return}if(p?.talk&&TALKERS.includes(p.npc)){const r=check(before,p.npc,p.talk.text,'face',`talk:${p.key}:${p.npc}`);if(r)lines.push({day:s.day-day0,npc:p.npc,by,ch:'face',text:p.talk.text,...r})}answer()};
 for(let d=0;d<days;d++){const dow=dateAt(s.day).getUTCDay(),work=dow>=1&&dow<=5;
  {const before=s;s=I.settleInbox(s);const q=I.inboxOf(s).queue.filter(x=>x.day===s.day&&((x.npc==='me'&&x.kind==='mom-care')||(x.npc==='em'&&x.kind==='checkin')));const base={...s,talk:before.talk};
   for(const m of q){const r=check(base,m.npc,m.text,'text',m.npc==='me'?`mom:${s.day}`:`em:${s.day}`,{minute:m.minute,...(m.npc==='em'?{intents:['brag','complain','ask','invite','news','tease','apologize']}:{})});if(r)lines.push({day:d,npc:m.npc,by:'npc',ch:'text',text:m.text,...r})}}
  const visits=[];if(rnd()<.6)visits.push(['market',450+Math.floor(rnd()*150)]);if(work&&rnd()<.4)visits.push(['streetfood',420+Math.floor(rnd()*20)]);if(!work&&rnd()<.6)visits.push(['park',430+Math.floor(rnd()*50)]);if(!work&&rnd()<.5)visits.push(['home',930+Math.floor(rnd()*60)]);if(work){visits.push(['bus',425+Math.floor(rnd()*50)]);visits.push(['office',540+Math.floor(rnd()*420)])}
  if(!work&&rnd()<.5)visits.push(['streetfood',1140+Math.floor(rnd()*80)]);visits.push(['home',1110+Math.floor(rnd()*180)]);visits.sort((a,b)=>a[1]-b[1]);
  s={...s,energy:rnd()<.25?15:70};
  for(const [place,minute] of visits){at(place,minute);
   if(place==='office'&&minute>=780)ate(MEALS[Math.floor(rnd()*MEALS.length)],720,'streetfood',true);
   if(place==='home'){if(rnd()<.5)ate(COOK[Math.floor(rnd()*COOK.length)],minute,'home',false);else ate(MEALS[Math.floor(rnd()*MEALS.length)],minute-30,'streetfood',true)}
   {const before=s,a=D.maybeStart(s,'arrive');if(a!==s){s=a;opened(before,'npc')}}
   const here=N.peopleHere(s,place).filter(n=>TALKERS.includes(n.id)).sort(()=>rnd()-.5);
   for(const n of here){if(rnd()>=.7)continue;const before=s,ts=D.topicsFor(s,n.id),t=ts.length&&rnd()<.3?ts[Math.floor(rnd()*ts.length)]:null,r=D.startTalk(s,n.id,t?'topic:'+t:'talk');if(!r.ok)continue;s=r.state;
    if(t){const p=D.storyOf(s).pending,npc=N.castById(before,n.id),said=L.answerNow(before,npc,'face',`topic:${before.day}:${D.storyOf(before).seq+1}:${t}:${npc.id}`,t);topics.n++;
     if(!said||said.text!==p.talk.text)errors.push(`${n.id}: câu đáp chủ đề ghép lại không khớp`);else{const c=clockOf(before),a=audit(said,n.id,factsOf(before),F.witnesses(before,before.day,c.minute,c.location));errors.push(...a.errs.map(e=>`${n.id} chủ đề ${t}: ${e}`));lines.push({day:s.day-day0,npc:n.id,by:'player',ch:'face',text:p.talk.text,intent:said.intent,real:a.real,tier:L.tierFor(before,npc),topic:t})}
     answer();continue}
    opened(before,'player')}}
  s=I.deliverDue({...s,clock:{...clockOf(s),minute:1430}}).state;
  const next={...s,day:s.day+1,clock:{...clockOf(s),minute:START,location:'home'}};s=D.settleStory(s,next)}
 return{seed,days,lines,errors,follows:{n:follows.n,uniq:follows.texts.size},topics:topics.n,valid:D.validStory(s.story,s.day)&&engine.valid(s)}}

/** Số ý định cần trong tháng theo bậc lúc đầu tháng: Lạ chỉ được Khoe, Than, Hỏi, Kể tin, Xin lỗi (Xin lỗi để dành cho chuyện thật) nên cần đủ 4; từ Quen biết cần 6 trong 8. */
const NEED={hostile:3,stranger:4,acquaint:6,close:6,bestie:6};
const mostTier=ls=>{const c={};for(const l of ls)c[l.tier]=(c[l.tier]||0)+1;return Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0]};
/* Câu đáp chủ đề người chơi mở: người chơi chọn chủ đề nên không tính vào chỉ tiêu I.9 (chỉ đếm số lần) */
function summarize(runs0){const runs=runs0.map(r=>({...r,lines:r.lines.filter(l=>!l.topic)}));const per={},all={n:0,uniq:0,real:0,err:0};
 for(const r of runs){const seen=new Set();for(const l of r.lines){all.n++;if(!seen.has(l.text))all.uniq++;seen.add(l.text);if(l.real)all.real++;const x=per[l.npc]??={n:0,months:0,intents:[],real:0,byTier:{},low:[]};x.n++;if(l.real)x.real++}
  all.err+=r.errors.length;const months=Math.max(1,r.days/30);for(const id of TALKERS){const ls=r.lines.filter(l=>l.npc===id);if(ls.length/months>=12){const x=per[id];x.months++;const k=new Set(ls.map(l=>l.intent)).size;x.intents.push(k);const t=ls[0].tier;/* chủ dự án 06/11: mốc theo bậc lúc đầu tháng (câu đầu tiên), người lên bậc trong tháng không bị đòi mốc cao hơn */(x.byTier[t]??=[]).push(k);if(k<NEED[t])x.low.push(`${id}:${r.seed} ${t} ${k} [${[...new Set(ls.map(l=>l.intent))].join(" ")}]`)}}}
 return{all,per,runs:runs.length,invalid:runs.filter(r=>!r.valid).length,errors:runs.flatMap(r=>r.errors).slice(0,10)}}
const pc=x=>(x*100).toFixed(1)+'%';
function verdict(sum){const a=sum.all,v=[];
 v.push(['Từ 90% câu không trùng nguyên văn',a.n&&a.uniq/a.n>=.9,`${pc(a.uniq/a.n)} (${a.n} câu)`]);
 v.push(['0 câu nhắc dữ kiện sai',a.err===0,`${a.err} lỗi${sum.errors.length?': '+sum.errors.join('; '):''}`]);
 const freq=Object.entries(sum.per).filter(([,x])=>x.months);const low=freq.flatMap(([,x])=>x.low);
 v.push(['Người thường gặp có từ 6 trong 8 ý định mỗi tháng (Lạ: đủ 4 ý định được phép)',freq.length>0&&low.length===0,(freq.map(([id,x])=>`${id} ${Math.min(...x.intents)}–${Math.max(...x.intents)}`).join(', ')||'không ai đủ 12 câu')+(low.length?`; thiếu: ${low.join(', ')}`:'')]);
 v.push(['Từ 30% câu nhắc trạng thái người chơi hoặc biến cố thật',a.real/a.n>=.3,pc(a.real/a.n)]);
 v.push(['Save story hợp lệ',sum.invalid===0,`${sum.invalid} lần sai`]);return v}

function main(){const arg=n=>{const i=process.argv.indexOf('--'+n);return i>0?Number(process.argv[i+1]):undefined},days=arg('days')??30,seeds=arg('seeds')??30;
 const runs=[];for(let i=0;i<seeds;i++)runs.push(run(i,days));const sum=summarize(runs);
 console.log(`Mô phỏng hội thoại Lô 1 và Lô 2: ${days} ngày, ${seeds} seed\n\nNgười         Câu/đời   Nhắc thật   Ý định/tháng (người thường gặp)`);
 for(const id of TALKERS){const x=sum.per[id];if(!x)continue;console.log(`${id.padEnd(12)} ${(x.n/seeds).toFixed(1).padStart(8)} ${pc(x.real/x.n).padStart(10)}   ${x.months?`${Math.min(...x.intents)} đến ${Math.max(...x.intents)}`:'-'}`)}
 for(const id of TALKERS){const x=sum.per[id];if(x?.months)console.log(`  ${id}: `+Object.entries(x.byTier).map(([t,v])=>`${t} ${v.join('/')}`).join(', '))}
 if(process.argv.includes('--show'))for(const l of runs[0].lines.slice(0,40))console.log(`  ${l.day} ${l.npc} ${l.ch} [${l.intent}${l.real?'*':''}] ${l.text}`);
 {const f=runs.reduce((a,r)=>a+r.follows.n,0),t=runs.reduce((a,r)=>a+r.topics,0);console.log(`\nCâu đáp tiếp (lượt 2, 3): ${(f/seeds).toFixed(1)} mỗi đời; người chơi tự mở lời: ${(t/seeds).toFixed(1)} mỗi đời`)}
 console.log('');let bad=0;for(const [n,ok,val] of verdict(sum)){console.log(`${ok?'ĐẠT ':'CHƯA'} ${n}: ${val}`);if(!ok)bad++}process.exitCode=bad?1:0}
module.exports={run,summarize,verdict};
if(require.main===module)main();
