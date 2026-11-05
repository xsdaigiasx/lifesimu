/* T43: mô phỏng sự kiện NPC 12 tháng. Dùng đúng code domain của app (.test-build): director (maybeStart, startTalk, answerEvent, settleStory) và social.
 * Chạy: npm run sim:npc -- [--months 12] [--seeds 30]   (luôn build lại .test-build để không chạy mã cũ)
 * Persona: Hay trò chuyện (đi 5 nơi mỗi ngày, nói chuyện với gần hết người gặp), Trung bình (3 nơi, 5 ngày một tuần, nói chuyện khoảng nửa), Ít giao du (về nhà mỗi tối, hiếm khi nói chuyện).
 * Mọi persona trả lời bằng cùng một cách: 65% chọn lựa chọn thân thiện đầu tiên, còn lại chọn ngẫu nhiên trong các lựa chọn mở.
 * Chỉ tiêu lặp chỉ đo sự kiện NPC tự bắt chuyện (người chơi chủ động chọn thì tự chịu). Hỏi thăm thuần là xã giao nên không tính vào tỉ lệ phản ứng.
 * Chỉ tiêu (mục 30 Kế hoạch, cách đo nằm ở `verdict`): không lặp mô-típ cùng NPC trong 14 ngày; từ 30% sự kiện phản ứng với trạng thái người chơi; callback ít nhất mỗi 5 ngày chơi (cửa sổ 5 ngày có đi chơi liên tiếp, bỏ 14 ngày đầu); bậc quan hệ không dồn vào Xa lạ; không NPC nào chiếm quá nhiều. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
{fs.mkdirSync(path.join(root,'.test-build'),{recursive:true});fs.writeFileSync(path.join(root,'.test-build/package.json'),'{"type":"commonjs"}');
 const r=spawnSync('node',['node_modules/typescript/bin/tsc','-p','tsconfig.tests.json'],{cwd:root,stdio:'inherit'});if(r.status)process.exit(r.status)}
const B=p=>require(path.join(root,'.test-build/domain',p));
const {engine}=B('engine'),D=B('director'),N=B('npc'),{socialOf}=B('social'),{clockOf,START}=B('time'),{dateAt}=B('format'),{hash}=B('shift');
/** `--set NPC_DAILY_LIMIT=2` ghi đè hằng số của director lúc chạy (REPEAT_DAYS, FADE_DAYS, RECALL_GAP, NPC_DAILY_LIMIT, PLAYER_COOLDOWN). */
for(let i=0;i<process.argv.length;i++)if(process.argv[i]==='--set'){const[k,v]=process.argv[i+1].split('=');if(!(k in D))throw new Error('Không có hằng số '+k);console.warn('Lưu ý: --set chỉ đổi được hằng số đọc qua export; hằng số nội bộ phải sửa mã');D[k]=Number(v)}
const PERSONAS=['chatty','average','hermit'];
const NAME={chatty:'Hay trò chuyện',average:'Trung bình',hermit:'Ít giao du'};
const TALK={chatty:.9,average:.5,hermit:.15};
/** [nơi, giờ sớm nhất, giờ muộn nhất]; giờ ghé thật rút ngẫu nhiên trong khoảng (phút kể từ 00:00) để gặp được người có lịch ở nơi đó. */
const PLACES=[['market',450,660],['office',540,1020],['streetfood',660,1230],['park',420,1080],['home',1080,1320],['bank',540,960],['hospital',480,1020]];
const BASE=PLACES.slice(0,5),RARE=PLACES.slice(5);
const rngOf=key=>{let x=hash(`simnpc:${key}`)||1;return()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296}};
/** Mô-típ có hạn chờ riêng hoặc do móc kích hoạt, không tính vào chỉ tiêu "không lặp 14 ngày". */
const EXEMPT=new Set(['greet','mom','return','debt']);
/** Phản ứng với trạng thái người chơi, tính trên sự kiện (bỏ hỏi thăm thuần không ký ức): có ký ức đính kèm, hoặc mô-típ chỉ mở khi tiền, quan hệ, ký ức, khoản nợ đạt điều kiện. */
const reactive=(p,score)=>!!p.memory||['return','debt','private','meal'].includes(p.motif)||(['loan','recipe'].includes(p.motif)&&score>=10);

function visitsOf(persona,day,rnd){const dow=dateAt(day).getUTCDay(),T=([p,lo,hi])=>[p,lo+Math.floor(rnd()*(hi-lo))];
 if(persona==='chatty'){const v=BASE.filter(([p])=>!(p==='office'&&(dow===0||dow===6))&&!(p==='market'&&dow===0));if(rnd()<.5)v.push(RARE[Math.floor(rnd()*RARE.length)]);return v.map(T).sort((a,b)=>a[1]-b[1])}
 if(persona==='average'){if(rnd()<2/7)return[];const pick=[...PLACES].sort(()=>rnd()-.5).slice(0,3);return pick.map(T).sort((a,b)=>a[1]-b[1])}
 const v=[PLACES[4]];if(rnd()<1/3)v.unshift(PLACES[Math.floor(rnd()*PLACES.length)]);return v.map(T).sort((a,b)=>a[1]-b[1])}

function run(persona,seed,days){
 const rnd=rngOf(`${persona}:${seed}`),events=[],played=[];let s={...engine.initial()};const day0=s.day+seed*37;s={...s,day:day0,money:3_000_000,seed:{world:`sim${seed}`,life:`sim${seed}`},office:{...require('../.test-build/domain/office').initialOffice(),role:'employee',employerId:seed%2?'an-nhien-tech':'sen-code'}};
 const answer=()=>{const ev=D.openEvent(s);if(!ev)return;const open=ev.options.map((o,i)=>o.locked?-1:i).filter(i=>i>=0);
  const order=open.length?[rnd()<.65?open[0]:open[Math.floor(rnd()*open.length)],...open]:[0];
  for(const i of order){s={...s,money:Math.max(s.money,3_000_000)};const r=D.answerEvent(s,i);if(r.ok){s=r.state;return}}
  const st=structuredClone(s.story);delete st.pending;s={...s,story:st}};
 const record=()=>{const p=D.storyOf(s).pending;if(p)events.push({day:s.day-day0,npc:p.npc,motif:p.motif,by:p.by,memory:!!p.memory,react:reactive(p,socialOf(s).relations[p.npc]?.score??0),hint:!!p.line&&p.line.startsWith('hint:')})};
 const at=(place,minute)=>{s={...s,clock:{...clockOf(s),minute,location:place}}};
 for(let d=0;d<days;d++){
  const vs=visitsOf(persona,s.day,rnd);if(vs.length)played.push(s.day-day0);
  for(const[place,minute]of vs){at(place,minute);
   const a=D.maybeStart(s,'arrive');if(a!==s){s=a;record();answer()}
   const here=N.peopleHere(s,place).sort(()=>rnd()-.5);
   for(const n of here){if(rnd()>=TALK[persona])continue;const r=D.startTalk(s,n.id);if(!r.ok)continue;s=r.state;record();answer()}}
  const next={...s,day:s.day+1,clock:{...clockOf(s),minute:START,location:'home'}};s=D.settleStory(s,next)}
 const tiers={};for(const n of [...['landlord','veg','neighbor','courier','banhmi','doctor','teller'].map(id=>N.castById(s,id)),...N.coworkersOf(s)]){const t=N.relationTier(socialOf(s).relations[n.id]?.score??0,n.id);tiers[t]=(tiers[t]||0)+1}
 return{persona,seed,days,events,played,tiers,valid:D.validStory(s.story,s.day)}}

/** Chỉ số tổng hợp cho một persona (gộp mọi seed). */
function summarize(runs){const out={};for(const p of PERSONAS){const rs=runs.filter(r=>r.persona===p);if(!rs.length)continue;
 const ev=rs.flatMap(r=>r.events),byNpc={};for(const e of ev)byNpc[e.npc]=(byNpc[e.npc]||0)+1;
 let rep=0,repN=0;for(const r of rs){const last={};for(const e of r.events){if(EXEMPT.has(e.motif)||e.by!=='npc')continue;repN++;const k=e.npc+':'+e.motif;if(k in last&&e.day-last[k]<14)rep++;last[k]=e.day}}
 let win=0,winOk=0;for(const r of rs){const cb=new Set(r.events.filter(e=>e.memory).map(e=>e.day));const pd=r.played.filter(d=>d>=14);for(let a=0;a+5<=pd.length;a+=5){win++;if(pd.slice(a,a+5).some(d=>cb.has(d)))winOk++}}
 const tiers={};let tn=0;for(const r of rs)for(const[t,c]of Object.entries(r.tiers)){tiers[t]=(tiers[t]||0)+c;tn+=c}
 const top=Object.entries(byNpc).sort((a,b)=>b[1]-a[1])[0];
 out[p]={runs:rs.length,events:ev.length/rs.length,perDay:ev.length/rs.reduce((a,r)=>a+r.days,0),hints:ev.filter(e=>e.hint).length/rs.length,repeat:repN?rep/repN:0,repeatN:rep,react:ev.filter(e=>e.motif!=='greet'||e.memory).length?ev.filter(e=>e.react).length/ev.filter(e=>e.motif!=='greet'||e.memory).length:0,cbWin:win?winOk/win:0,strange:(tiers['Xa lạ']||0)/Math.max(1,tn),tiers:Object.fromEntries(Object.entries(tiers).map(([k,v])=>[k,v/Math.max(1,tn)])),topNpc:top?top[0]:'-',topShare:top?top[1]/ev.length:0,met:Object.keys(byNpc).length,motifs:Object.entries(ev.reduce((m,e)=>(m[e.motif]=(m[e.motif]||0)+1,m),{})).sort((a,b)=>b[1]-a[1]),invalid:rs.filter(r=>!r.valid).length}}return out}
const pc=x=>(x*100).toFixed(1)+'%';
function verdict(sum){const v=[];
 for(const p of PERSONAS){const x=sum[p];if(!x)continue;const n=NAME[p],main=p!=='hermit';
  v.push([`${n}: không lặp mô-típ cùng NPC trong 14 ngày`,x.repeatN===0,`${x.repeatN} lần lặp (${pc(x.repeat)})`]);
  v.push([`${n}: từ 30% sự kiện phản ứng trạng thái`,x.react>=.3,pc(x.react)]);
  if(main)v.push([`${n}: callback trong ${p==='chatty'?'80%':'60%'} cửa sổ 5 ngày chơi`,x.cbWin>=(p==='chatty'?.8:.6),pc(x.cbWin)]);
  if(main)v.push([`${n}: Xa lạ không quá ${p==='chatty'?'40%':'70%'} dàn NPC`,x.strange<=(p==='chatty'?.4:.7),pc(x.strange)]);
  if(main)v.push([`${n}: Tri kỷ không quá ${p==='chatty'?'60%':'30%'} dàn NPC (bậc cao cần thời gian)`,(x.tiers['Tri kỷ']||0)<=(p==='chatty'?.6:.3),pc(x.tiers['Tri kỷ']||0)]);
  if(main)v.push([`${n}: NPC nhiều nhất không quá 30% sự kiện`,x.topShare<=.3,`${x.topNpc} ${pc(x.topShare)}`]);
  if(main)v.push([`${n}: có câu gợi ý gần mốc bậc`,x.hints>=1,`${x.hints.toFixed(1)} câu mỗi năm`]);
  v.push([`${n}: save story hợp lệ`,x.invalid===0,`${x.invalid} lần sai`])}
 return v}

function main(){
 const arg=n=>{const i=process.argv.indexOf('--'+n);return i>0?Number(process.argv[i+1]):undefined},months=arg('months')??12,seeds=arg('seeds')??30;
 const runs=[];for(const p of PERSONAS)for(let i=0;i<seeds;i++)runs.push(run(p,i,months*30));
 const sum=summarize(runs);
 console.log(`Mô phỏng NPC: ${months} tháng, ${seeds} seed mỗi persona\n`);
 console.log('Persona          Sự kiện/ngày  Phản ứng  Callback5  Xa lạ   Lặp14  NPC nhiều nhất   Số NPC gặp');
 for(const p of PERSONAS){const x=sum[p];console.log(`${NAME[p].padEnd(16)} ${x.perDay.toFixed(2).padStart(12)} ${pc(x.react).padStart(9)} ${pc(x.cbWin).padStart(10)} ${pc(x.strange).padStart(7)} ${String(x.repeatN).padStart(6)}  ${(x.topNpc+' '+pc(x.topShare)).padEnd(16)} ${x.met}`)}
 console.log('\nBậc quan hệ cuối năm (11 NPC, không tính Mẹ):');for(const p of PERSONAS)console.log(`  ${NAME[p].padEnd(16)} `+['Xa lạ','Quen biết','Thân','Tri kỷ'].map(t=>`${t} ${pc(sum[p].tiers[t]||0)}`).join(', '));
 console.log('\nCâu gợi ý gần mốc mỗi năm: '+PERSONAS.map(p=>`${NAME[p]} ${sum[p].hints.toFixed(1)}`).join(', '));console.log('\nMô-típ (số sự kiện mỗi năm, trung bình):');for(const p of PERSONAS)console.log(`  ${NAME[p].padEnd(16)} `+sum[p].motifs.map(([m,c])=>`${m} ${(c/sum[p].runs).toFixed(0)}`).join(', '));
 console.log('');let bad=0;for(const[n,ok,val]of verdict(sum)){console.log(`${ok?'ĐẠT ':'CHƯA'} ${n}: ${val}`);if(!ok)bad++}
 process.exitCode=bad?1:0}
module.exports={run,summarize,verdict,PERSONAS};
if(require.main===module)main();
