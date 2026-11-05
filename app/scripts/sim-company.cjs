/* T50: mô phỏng cân bằng công ty. Dùng đúng code domain của app (.test-build), không viết lại logic.
 * Chạy: npm run sim:company -- [--months 12] [--seeds 30]   (tự build nếu chưa có .test-build)
 * Persona: cùng cách nhận và giao dự án (chỉ nhận việc vừa sức, mỗi người một dự án), khác nhau ở tuyển dụng và quản lý: Cẩn thận (phỏng vấn đủ, đào tạo, xử lý việc nhân sự), Trung bình (phỏng vấn sơ, xử lý ngẫu nhiên), Ẩu (thuê người đầu tiên, không phỏng vấn, bỏ qua việc nhân sự). */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
if(!fs.existsSync(path.join(root,'.test-build/domain/engine.js'))){fs.mkdirSync(path.join(root,'.test-build'),{recursive:true});fs.writeFileSync(path.join(root,'.test-build/package.json'),'{"type":"commonjs"}');
 const r=spawnSync('node',['node_modules/typescript/bin/tsc','-p','tsconfig.tests.json'],{cwd:root,stdio:'inherit'});if(r.status)process.exit(r.status)}
const B=p=>require(path.join(root,'.test-build/domain',p));
const C=B('company');const {engine}=B('engine'),H=B('hiring'),P=B('projects'),S=B('staff'),F=B('finance'),HR=B('hr'),M=B('manage'),{initialOffice,SIZES}=B('office'),{defaultSkills}=B('skill-xp'),{dateAt}=B('format'),{START}=B('time'),{hash}=B('shift');
const assert=require('node:assert/strict');
/** `--set PROJ.rewardBase=2.6` ghi đè hằng số lúc chạy để thử số liệu (không đổi mã nguồn). */
const CONSTS={HIRING:H.HIRING,PROJ:P.PROJ,FIN:F.FIN,STAFF:S.STAFF,HR:HR.HR,MG:M.MG,POL:B('policy').POL};
for(let i=0;i<process.argv.length;i++)if(process.argv[i]==='--set'){const[k,v]=process.argv[i+1].split('=');const[g,f]=k.split('.');if(!CONSTS[g]||!(f in CONSTS[g]))throw new Error('Không có hằng số '+k);CONSTS[g][f]=Number(v)}
const PERSONAS=['careful','average','sloppy'];
const NAME={careful:'Cẩn thận',average:'Trung bình',sloppy:'Ẩu'};
const rngOf=seed=>{let x=hash(`sim:${seed}`)||1;return()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296}};

function initial(seed,day0){
 const o={...initialOffice(),role:'owner',name:'Công ty mô phỏng',size:'small',industry:'tech',leaseUntil:day0+30};
 const skills=defaultSkills();skills.management={level:4,xp:0};skills.communication={level:3,xp:0};skills.programming={level:5,xp:0};
 return{...engine.initial(),day:day0,office:o,skills,company:{version:1,founded:seed%50,fund:50_000_000,rep:50,staff:[]}}}
const clockReset=s=>({...s,office:{...s.office,leaseUntil:s.day+30},clock:{minute:START,location:'office',lastWorkDay:-1,lastStudyDay:-1,lastRestDay:-1}});
const chain=s=>M.settleManage(HR.settleHr(F.settleFinance(P.settleProjects(S.settleStaff(s)))));
const act=(s,fn,a)=>{const r=fn(s,a);return r.ok?r.state:s};
const mainOf=e=>['programming','logic','graphics'].reduce((a,k)=>e.skills[k]>e.skills[a]?k:a,'programming');

/** Khi hết nhân viên, hết dự án và quỹ dưới phí đăng tin: chủ góp vốn từ tiền cá nhân (Góp vốn, T50). Chủ có việc phụ nên tiền cá nhân luôn có. */
function rescueStep(s){const c=s.company;const idle=!c.staff.length&&!P.projectsOf(s).active.length&&!F.incomingOf(s).length&&c.fund<H.HIRING.postFee+8_000_000;
 if(!idle)return s;const r=C.investFund({...s,money:Math.max(s.money,C.INVEST_AMOUNTS[1])},C.INVEST_AMOUNTS[1]);return r.ok?{...r.state,money:s.money}:s}
function hireStep(s,persona,target){
 const c=s.company;if(c.staff.length>=target)return s;
 const need=H.HIRING.postFee;
 if(!H.postActive(s)){if(c.fund>=need+(persona==='sloppy'?0:8_000_000))s=act(s,H.hiringAction,{kind:'post'});else return s}
 for(const cand of H.candidatesOf(s)){
  if(s.company.staff.length>=target)break;
  if(persona==='careful'){
   const main=H.HIRE_SKILLS.filter(k=>['programming','logic','graphics'].includes(k)).reduce((a,k)=>cand.claim[k]>cand.claim[a]?k:a,'programming');
   for(const a of [{what:'cv'},{what:'situation'},{what:'motive'},{what:'ref'},{what:'tech',skill:main},{what:'tech',skill:main}])s=act(s,H.hiringAction,{kind:'interview',id:cand.id,...a});
   const v=H.viewOf(s,cand);if(!v||(v.warn&&(v.warn.kind==='ref'?v.warn.level>=2:v.warn.level>=1))||(v.flags&&v.flags.includes(main)))continue;
   const est=v.skills[main].est;if(!est||est.lo<4)continue;if(s.company.fund<cand.wage*3+cand.fee+5_000_000)continue;
   s=act(s,H.hiringAction,{kind:'hire',id:cand.id})}
  else if(persona==='average'){
   for(const a of [{what:'cv'},{what:'situation'}])s=act(s,H.hiringAction,{kind:'interview',id:cand.id,...a});
   const v=H.viewOf(s,cand);if(v&&v.warn&&v.warn.kind==='hint'&&v.warn.level>=1)continue;if(s.company.fund<cand.wage*2+cand.fee)continue;
   s=act(s,H.hiringAction,{kind:'hire',id:cand.id})}
  else{if(s.company.fund<cand.wage+cand.fee)continue;s=act(s,H.hiringAction,{kind:'hire',id:cand.id})}}
 return s}

function projectStep(s,persona,rnd){
 const ps=()=>P.projectsOf(s);
 for(const o of [...ps().offers].sort((a,b)=>b.reward-a.reward)){
  const st=s.company.staff;if(!st.length)break;if(ps().active.length>=Math.min(P.PROJ.maxActive,st.length))break;
  const best=Math.max(...st.map(e=>e.skills[o.skill]));
  const slack=1;if(o.lv>best+slack){continue}
  s=act(s,P.projectAction,{kind:'projAccept',id:o.id});
  const proj=ps().active.find(p=>p.id===o.id);if(!proj)continue;
  const load=e=>ps().active.filter(x=>x.team.includes(e.id)).length;
  const order=[...st].sort((a,b)=>load(a)-load(b)||b.skills[o.skill]-a.skills[o.skill]);
  const n=o.hours>=56?2:1;
  for(const e of order.slice(0,n))s=act(s,P.projectAction,{kind:'projAssign',id:o.id,emp:e.id})}
 if(persona==='careful')for(const p of ps().active)if(p.team.length&&p.progress>=p.hours*.6&&p.checks<P.PROJ.maxChecks)s=act(s,P.projectAction,{kind:'projCheck',id:p.id});
 return s}

function peopleStep(s,persona,rnd){
 if(persona==='sloppy')return s;
 for(const ev of [...HR.hrOf(s).pending]){
  const v=HR.hrView(s,ev.id);if(!v)continue;const ok=v.options.filter(o=>!o.locked);if(!ok.length)continue;
  const bad=['letgo','accept','ignore','deny','refuse','busy','push','ban'];
  const pool=persona==='careful'?ok.filter(o=>!bad.includes(o.tag)):ok;const use=pool.length?pool:ok;
  const pick=persona==='careful'?use[0]:use[Math.floor(rnd()*use.length)];s=act(s,HR.hrAction,{kind:'hrChoose',id:ev.id,tag:pick.tag})}
 if(persona==='careful')for(const e of s.company.staff)if(M.canTrain(e,s.day)&&s.company.fund>25_000_000&&!e.train){const k=mainOf(e);if(e.skills[k]<8)s=act(s,M.manageAction,{kind:'mgTrain',emp:e.id,skill:k});break}
 return s}

/** Chạy một công ty `days` ngày; trả chỉ số và vi phạm bất biến. */
function run(persona,seed,days=360){
 const day0=100,target=3,rnd=rngOf(`${persona}:${seed}`);let s=initial(seed,day0);
 const m={persona,seed,dead:0,deadDay:null,stuckDays:0,quits:0,debtDays:0,minFund:Infinity,violations:[],hired:0,rescues:0,maxStaff:0,fundAt:{},repAt:{}};
 let prevIds=new Set();const seen=new Set(),res=[];
 for(let d=day0+1;d<=day0+days;d++){
  s=clockReset({...s,day:d});
  if(dateAt(d).getUTCDate()===1){const rent=SIZES.small.rent;s={...s,company:{...s.company,fund:Math.max(0,s.company.fund-rent)}}}
  const before=s;s=chain(s);
  try{assert.deepEqual(chain(s),s,'settle không idempotent')}catch(e){m.violations.push(`d${d}: ${e.message}`)}
  {const f0=s.company.fund;s=rescueStep(s);if(s.company.fund>f0)m.rescues++}
  s=hireStep(s,persona,target);s=projectStep(s,persona,rnd);s=peopleStep(s,persona,rnd);
  const c=s.company;
  for(const r of P.projectsOf(s).done)if(!seen.has(r.id)){seen.add(r.id);res.push(r)}
  if(!Number.isInteger(c.fund)||c.fund<0)m.violations.push(`d${d}: quỹ ${c.fund}`);
  const keys=(c.finance?.debts??[]).map(x=>`${x.emp}:${x.since}`);if(new Set(keys).size!==keys.length)m.violations.push(`d${d}: nợ lương trùng`);
  if(!engine.valid(s)){m.violations.push(`d${d}: save không hợp lệ`);if(process.env.SIM_DEBUG&&m.violations.length===1){for(const k of Object.keys(c)){const t2={...s,company:{...c}};delete t2.company[k];if(engine.valid(t2))console.log('invalid part:',k,JSON.stringify(c[k]).slice(0,600))}for(const k of Object.keys(s)){const t2={...s};delete t2[k];if(engine.valid(t2))console.log('invalid root part:',k)}}}
  const ids=new Set(c.staff.map(e=>e.id));for(const id of prevIds)if(!ids.has(id))m.quits++;for(const id of ids)if(!prevIds.has(id))m.hired++;prevIds=ids;
  m.maxStaff=Math.max(m.maxStaff,c.staff.length);m.minFund=Math.min(m.minFund,c.fund);
  if(F.owedWages(s)>0)m.debtDays++;
  const idle=!P.projectsOf(s).active.length&&!F.incomingOf(s).length&&c.fund<H.HIRING.postFee&&!c.staff.length;
  if(idle){m.stuckDays++}
  if(!m.dead&&d-day0>=30&&c.staff.length===0&&c.fund<H.HIRING.postFee&&idle){m.dead=1;m.deadDay=d-day0}
  if(process.env.SIM_TRACE&&(d-day0)%(+process.env.SIM_TRACE)===0)console.log(JSON.stringify(P.projectsOf(s).active.map(p=>[p.skill,p.lv,p.hours,Math.round(p.progress),p.due-d,p.team.length])),JSON.stringify(c.staff.map(e=>{const w=S.workAt(e,d);return[Math.round(w.fatigue),Math.round(w.morale),S.speedOf(e,d,{skill:'programming',lv:3}).toFixed?.(2)]})),persona,d-day0,'fund',(c.fund/1e6).toFixed(1),'staff',c.staff.length,'active',P.projectsOf(s).active.length,'offers',P.projectsOf(s).offers.length,'rep',c.rep,'recv',F.incomingOf(s).length,'debt',F.owedWages(s),'hiring',H.postActive(s));const mo=Math.floor((d-day0)/30);if(!(mo in m.fundAt)&&(d-day0)%30===0){m.fundAt[mo]=c.fund;m.repAt[mo]=c.rep??50}}
 const done=res.filter(r=>!r.canceled),all=res;
 if(process.env.SIM_TRACE)console.log(JSON.stringify(P.projectsOf(s).done.slice(0,8).map(r=>[r.title.slice(0,12),r.skill,r.stars,r.late,r.canceled?'X':'',r.reward]))),console.log(JSON.stringify(s.company.staff.map(e=>[e.name,e.skills,e.personality,e.wage])));
 m.fund=s.company.fund;m.rep=s.company.rep??50;m.staff=s.company.staff.length;m.done=done.length;m.canceled=all.length-done.length;
 m.stars=done.length?done.reduce((a,r)=>a+r.stars,0)/done.length:0;m.late=done.filter(r=>r.late>0).length;
 m.bondAvg=s.company.staff.length?s.company.staff.reduce((a,e)=>a+S.bondOf(e),0)/s.company.staff.length:0;
 return m}

/** Tỉ lệ phát hiện ứng viên rủi ro cao khi phỏng vấn kỹ (cv, tình huống, động lực, người giới thiệu, 2 câu kỹ thuật). */
function detection(n=3000){
 let high=0,hit=0,low=0,false_=0,pool=0;
 const base=initial(1,100);base.company.hiring={postedDay:100,rep:50,progress:{},gone:[]};
 for(let i=0;i<n;i++){const c=H.makeCandidate(`det:${i}`,50);pool++;
  const main=['programming','logic','graphics'].reduce((a,k)=>c.claim[k]>c.claim[a]?k:a,'programming');
  const s=structuredClone(base);s.company.hiring.progress[c.id]={cv:1,sit:1,mot:1,ref:c.ref?1:undefined,q:{[main]:2}};
  const v=H.viewOf(s,c),flag=!!v.warn&&(v.warn.kind==='ref'?v.warn.level>=2:v.warn.level>=1);
  if(c.risk>=60){high++;if(flag)hit++}else{low++;if(flag)false_++}}
 return{highShare:high/pool,detect:hit/high,falseAlarm:false_/low}}

const q=(a,p)=>{const b=[...a].sort((x,y)=>x-y);return b.length?b[Math.min(b.length-1,Math.floor(p*b.length))]:0};
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
function summarize(runs){const by={};for(const p of PERSONAS)by[p]=runs.filter(r=>r.persona===p);
 const out={};for(const p of PERSONAS){const r=by[p];out[p]={n:r.length,deadPct:100*mean(r.map(x=>x.dead)),stuckDays:mean(r.map(x=>x.stuckDays)),fundMed:q(r.map(x=>x.fund),.5),fundP10:q(r.map(x=>x.fund),.1),rep:mean(r.map(x=>x.rep)),repP10:q(r.map(x=>x.rep),.1),staff:mean(r.map(x=>x.staff)),quits:mean(r.map(x=>x.quits)),debtDays:mean(r.map(x=>x.debtDays)),done:mean(r.map(x=>x.done)),stars:mean(r.map(x=>x.stars)),late:mean(r.map(x=>x.late)),canceled:mean(r.map(x=>x.canceled)),bond:mean(r.map(x=>x.bondAvg)),viol:r.reduce((a,x)=>a+x.violations.length,0),rescues:mean(r.map(x=>x.rescues)),deadBefore90:100*mean(r.map(x=>x.deadDay!==null&&x.deadDay<=90?1:0))}}
 return out}
/** Chỉ tiêu (Kế hoạch mục 33.2, 37 và quỹ; chủ dự án duyệt 05/11). */
function verdict(sum,det){const c=sum.careful,a=sum.average,s=sum.sloppy;return[
 ['Rủi ro cao chiếm 20 đến 30% pool',det.highShare>=.2&&det.highShare<=.3,`${(det.highShare*100).toFixed(1)}%`],
 ['Phỏng vấn kỹ phát hiện 70 đến 80%, không bao giờ 100%',det.detect>=.7&&det.detect<=.8,`${(det.detect*100).toFixed(1)}%`],
 ['0% bế tắc (hết người, hết dự án, quỹ dưới phí đăng tin) dù đã góp vốn, ở cả 3 persona',PERSONAS.every(p=>sum[p].deadPct===0),PERSONAS.map(p=>sum[p].deadPct.toFixed(0)+'%').join(' ')],
 ['Không thao tác tiền hai lần, save luôn hợp lệ',PERSONAS.every(p=>sum[p].viol===0),String(PERSONAS.reduce((x,p)=>x+sum[p].viol,0))],
 ['Ẩu không phá sản trước tháng 3',s.deadBefore90===0,s.deadBefore90.toFixed(0)+'%'],
 ['Ẩu thiệt hại rõ: uy tín thấp hơn Cẩn thận từ 5 điểm',c.rep-s.rep>=5,`${c.rep.toFixed(1)} so với ${s.rep.toFixed(1)}`],
 ['Ẩu nghỉ việc nhiều hơn Cẩn thận',s.quits>c.quits,`${s.quits.toFixed(1)} so với ${c.quits.toFixed(1)}`],
 ['Cẩn thận hơn Ẩu về quỹ trung vị tháng 12',c.fundMed>s.fundMed,`${(c.fundMed/1e6).toFixed(0)}tr so với ${(s.fundMed/1e6).toFixed(0)}tr`],
 ['Cẩn thận không âm quỹ (P10 trên 5 triệu)',c.fundP10>5_000_000,`${(c.fundP10/1e6).toFixed(0)}tr`]]}

function main(){
 const arg=n=>{const i=process.argv.indexOf('--'+n);return i>0?Number(process.argv[i+1]):undefined},months=arg('months')??12,seeds=arg('seeds')??30;
 const runs=[];for(const p of PERSONAS)for(let i=0;i<seeds;i++)runs.push(run(p,i,months*30));
 const sum=summarize(runs),det=detection();
 console.log(`Mô phỏng công ty: ${months} tháng, ${seeds} seed mỗi persona\n`);
 console.log('Persona      Quỹ giữa  Quỹ P10  Uy tín  Người  Nghỉ  Xong  Sao   Trễ  Huỷ   Gắn bó  Nợ lương(ngày)  Góp vốn  Bế tắc%');
 for(const p of PERSONAS){const x=sum[p];console.log(`${NAME[p].padEnd(12)} ${(x.fundMed/1e6).toFixed(0).padStart(6)}tr ${(x.fundP10/1e6).toFixed(0).padStart(6)}tr ${x.rep.toFixed(1).padStart(7)} ${x.staff.toFixed(1).padStart(6)} ${x.quits.toFixed(1).padStart(5)} ${x.done.toFixed(1).padStart(5)} ${x.stars.toFixed(2).padStart(5)} ${x.late.toFixed(1).padStart(4)} ${x.canceled.toFixed(1).padStart(4)} ${x.bond.toFixed(0).padStart(7)} ${x.debtDays.toFixed(1).padStart(15)} ${x.rescues.toFixed(1).padStart(8)} ${x.deadPct.toFixed(0).padStart(8)}`)}
 console.log(`\nPool: rủi ro cao ${(det.highShare*100).toFixed(1)}%, phát hiện ${(det.detect*100).toFixed(1)}%, báo nhầm ${(det.falseAlarm*100).toFixed(1)}%\n`);
 let bad=0;for(const[n,ok,v]of verdict(sum,det)){console.log(`${ok?'ĐẠT ':'CHƯA'} ${n}: ${v}`);if(!ok)bad++}
 process.exitCode=bad?1:0}
module.exports={run,detection,summarize,verdict,PERSONAS};
if(require.main===module)main();
