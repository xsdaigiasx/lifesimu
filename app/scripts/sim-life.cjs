/* H7b: mô phỏng vòng đời NPC 20 năm. Dùng đúng code domain của app (.test-build): lifecycle.settleCycle qua từng ngày.
 * Chạy: npm run sim:life -- [--years 20] [--seeds 30]   (luôn build lại .test-build để không chạy mã cũ)
 * Người chơi giả định thân (40 điểm) với mọi người đang giữ vai, để đo cả người nối tiếp nhớ mang máng người chơi.
 * Chỉ tiêu (HOI-THOAI bảng H, dòng H7b): vai trò không bị trống quá 30 ngày; tuổi và lịch đúng
 * (tuổi chỉ tăng đúng ngày sinh nhật, mỗi năm một sinh nhật; không ai giữ vai quá tuổi nghỉ; người về hưu, sinh viên đúng giai đoạn đời).
 * Đo thêm: số người mất mỗi năm, tuổi lúc mất, người mất trước 70, con nối nghiệp, save hợp lệ và cỡ lát cắt vòng đời. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
if(require.main===module||!fs.existsSync(path.join(root,'.test-build/domain/lifecycle.js'))){fs.mkdirSync(path.join(root,'.test-build'),{recursive:true});fs.writeFileSync(path.join(root,'.test-build/package.json'),'{"type":"commonjs"}');
 const r=spawnSync('node',['node_modules/typescript/bin/tsc','-p','tsconfig.tests.json'],{cwd:root,stdio:'inherit'});if(r.status)process.exit(r.status)}
const B=p=>require(path.join(root,'.test-build/domain',p));
const {engine}=B('engine'),N=B('npc'),L=B('lifecycle'),{stageOf}=B('talk/npc-life');

function run(seed,years){
 const days=years*365;let s={...engine.initial(),seed:{world:`life${seed}`,life:`life${seed}`}};
 const vacant={},gaps=[],deaths=[],left=[],heirs=[],bad=[];const prevAge={},bdays={};let maxLiving=0,minLiving=99;
 for(let d=1;d<=days;d++){
  // người chơi thân với mọi người đang giữ vai
  const rel={};for(const n of N.rosterOf(s))if(!n.family)rel[n.id]={score:40,lastDay:s.day,minutes:0};
  s={...s,day:d,social:{relations:rel,chatMinutesDay:0,chatDay:d},inbox:undefined,journal:undefined};
  const before=L.cycleOf(s);s=L.settleCycle(s);const cy=L.cycleOf(s);
  for(const g of cy.gone.filter(g=>g.day===d&&!before.gone.some(x=>x.id===g.id))){const p=N.personById(s,g.id);(g.why==='died'?deaths:left).push({role:g.role,age:p.age,day:d});vacant[g.role]=d}
  for(const [role,since] of Object.entries(vacant))if(!cy.vacant[role]){gaps.push(d-since);if(cy.holders[role]?.p)heirs.push(role);delete vacant[role]}
  const live=N.rosterOf(s);maxLiving=Math.max(maxLiving,live.length);minLiving=Math.min(minLiving,live.length);
  for(const n of live){const key=`${n.id}:${n.gen}`,a=n.age,bd=N.isBirthday(n.born,d);
   if(prevAge[key]!==undefined&&a!==prevAge[key]&&!(bd&&a===prevAge[key]+1))bad.push(`${key} tuổi đổi sai ngày ${d}: ${prevAge[key]}→${a}`);prevAge[key]=a;
   if(bd)bdays[key]=(bdays[key]??0)+1;
   const def=N.roleDef(n.id);if(def.retire!==undefined&&a>def.retire)bad.push(`${key} quá tuổi nghỉ ${def.retire}: ${a}`);
   if(n.id==='courier'&&stageOf(a)!=='study'&&a>22&&a>def.retire)bad.push(`${key} không còn là sinh viên`);
   if(n.id==='neighbor'&&stageOf(a)!=='retired')bad.push(`${key} hàng xóm về hưu nhưng ${a} tuổi`)}}
 for(const [k,c] of Object.entries(bdays)){const [id,gen]=k.split(':');const n=gen==='0'?N.buildRoster(`life${seed}`).find(x=>x.id===id):null;if(n&&!L.cycleOf(s).gone.some(g=>g.role===id&&g.h.gen===0)&&(c<years-1||c>years))bad.push(`${k} có ${c} sinh nhật trong ${years} năm`)}
 const maxGap=Math.max(0,...gaps,...Object.values(vacant).map(v=>days-v));
 return{seed,deaths,left,heirs,gaps,maxGap,bad,valid:!!engine.parse(JSON.stringify(s)),cycleBytes:JSON.stringify(s.cycle??{}).length,minLiving,maxLiving}}

function summarize(runs,years){const all=k=>runs.flatMap(r=>r[k]);const deaths=all('deaths'),left=all('left');
 return{runs:runs.length,years,deathsPerYear:deaths.length/runs.length/years,deathAgeMedian:median(deaths.map(x=>x.age)),deathsUnder70:deaths.filter(x=>x.age<70).length,deathsUnder70Pct:deaths.length?deaths.filter(x=>x.age<70).length/deaths.length:0,
  leftPerYear:left.length/runs.length/years,heirShare:(all('heirs').length)/Math.max(1,all('gaps').length),maxGap:Math.max(...runs.map(r=>r.maxGap)),bad:all('bad'),invalid:runs.filter(r=>!r.valid).length,cycleBytesMax:Math.max(...runs.map(r=>r.cycleBytes)),
  living:[Math.min(...runs.map(r=>r.minLiving)),Math.max(...runs.map(r=>r.maxLiving))]}}
const median=a=>{if(!a.length)return 0;const b=[...a].sort((x,y)=>x-y);return b[Math.floor(b.length/2)]};
function verdict(sum){return[['Vai trò không trống quá 30 ngày',sum.maxGap<=30,`${sum.maxGap} ngày`],['Tuổi và lịch đúng',sum.bad.length===0,sum.bad.slice(0,3).join('; ')||'không lỗi'],['Save hợp lệ',sum.invalid===0,`${sum.invalid} save lỗi`],['Gần như không ai mất trước 70 (tối đa 0,2 người mỗi thế giới 20 năm)',sum.deathsUnder70/sum.runs*20/sum.years<=.2,`${sum.deathsUnder70} người trong ${sum.runs} thế giới (${(sum.deathsUnder70Pct*100).toFixed(0)}% số người mất)`]]}

module.exports={run,summarize,verdict};
if(require.main===module){const arg=(k,d)=>{const i=process.argv.indexOf(k);return i>=0?Number(process.argv[i+1]):d};const years=arg('--years',20),seeds=arg('--seeds',30);
 const runs=[];for(let i=0;i<seeds;i++)runs.push(run(i,years));const sum=summarize(runs,years);
 console.log(`Vòng đời NPC ${years} năm x ${seeds} seed`);
 console.log(`Mất: ${sum.deathsPerYear.toFixed(2)} người mỗi năm, tuổi trung vị ${sum.deathAgeMedian}; rời vai (nghỉ hưu, ra trường): ${sum.leftPerYear.toFixed(2)} người mỗi năm; con nối nghiệp ${(sum.heirShare*100).toFixed(0)}% lần thay người`);
 console.log(`Số người đang sống ${sum.living[0]} đến ${sum.living[1]}; lát cắt vòng đời tối đa ${sum.cycleBytesMax} byte`);
 let ok=true;for(const [name,pass,detail] of verdict(sum)){ok&&=pass;console.log(`${pass?'ĐẠT':'CHƯA ĐẠT'}  ${name}: ${detail}`)}process.exit(ok?0:1)}
