/* H7c: mô phỏng cảnh nhóm và tin đồn. Dùng đúng code domain của app (.test-build): settleCycle, settleTown, settleGossip qua từng ngày, maybeGroup khi tới nơi.
 * Chạy: npm run sim:gossip -- [--years 1] [--seeds 30]   (luôn build lại .test-build để không chạy mã cũ)
 * Người chơi kiểu Trung bình (khu trọ tối, chợ 3 buổi, quán ngày thường, công viên 2 buổi); gặp cảnh nhóm thì chọn đều các lựa chọn; mỗi nơi 40% nói chuyện riêng với một người (người quen kể tin 25%), 30% kể lại một tin cho người quen đang có mặt.
 * Chỉ tiêu H7c (HOI-THOAI I.4b, chủ dự án duyệt 06/11): tối đa 1 cảnh nhóm mỗi ngày; 4 đến 15 cảnh mỗi tháng; tin sai hoặc thổi phồng 15 đến 35% số tin người chơi nghe;
 * không có tin về người chơi; mỗi tháng nghe ít nhất 2 tin; save hợp lệ và lát cắt gossip dưới 4 KB. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
if(require.main===module||!fs.existsSync(path.join(root,'.test-build/domain/talk/gossip.js'))){fs.mkdirSync(path.join(root,'.test-build'),{recursive:true});fs.writeFileSync(path.join(root,'.test-build/package.json'),'{"type":"commonjs"}');
 const r=spawnSync('node',['node_modules/typescript/bin/tsc','-p','tsconfig.tests.json'],{cwd:root,stdio:'inherit'});if(r.status)process.exit(r.status)}
const B=p=>require(path.join(root,'.test-build/domain',p));
const {engine}=B('engine'),N=B('npc'),L=B('lifecycle'),W=B('town'),G=B('talk/gossip'),{hash}=B('shift'),D=B('director'),{dateAt}=B('format');
const GO=(dow)=>[...([1,3,6].includes(dow)?[['market',540]]:[]),...(dow>=1&&dow<=5?[['streetfood',720]]:[]),...([2,0].includes(dow)?[['park',450]]:[]),['home',1200]];

function run(seed,years){const days=years*365;let s={...engine.initial(),seed:{world:`gossip${seed}`,life:`gossip${seed}`}};
 const so={relations:{},chatMinutesDay:0,chatDay:0};for(const n of N.rosterOf(s))so.relations[n.id]={score:20,lastDay:0,minutes:5};s={...s,social:so};
 const r={seed,scenes:0,maxDay:0,kinds:{chat:0,gossip:0,spat:0,price:0},choices:{},heard:0,wrong:0,aboutPlayer:0,told:0,found:0,maxBytes:0,valid:true};
 for(let d=1;d<=days;d++){s={...s,day:d,inbox:undefined};s=G.settleGossip(W.settleTown(L.settleCycle(s)));let today=0;const dow=dateAt(d).getUTCDay();
  for(const [place,minute] of GO(dow)){s={...s,clock:{...(s.clock??{}),minute,location:place,lastWorkDay:-1,lastStudyDay:-1,lastRestDay:-1}};s=G.maybeGroup(s,'arrive');const sc=s.gossip?.pending;
   if(sc){today++;r.scenes++;r.kinds[sc.kind]++;const opts=G.groupChoices(s,sc),c=opts[hash(`${seed}:${d}:${place}:c`)%opts.length].id;r.choices[c]=(r.choices[c]??0)+1;const a=G.answerGroup(s,c);if(a.ok)s=a.state;else s={...s,gossip:{...s.gossip,pending:undefined}}}
   /* nói chuyện riêng với một người quen đang có mặt (40%): người quen kể tin như director.open (TELL_PCT) */
   if(hash(`${seed}:${d}:${place}:talk`)%100<40){const here=N.peopleHere(s).filter(n=>!n.remote&&!n.family);if(here.length){const n=here[hash(`${seed}:${d}:${place}:who`)%here.length];if(hash(`tell:${seed}:${d}:${n.id}`)%100<D.TELL_PCT){const t=G.npcTells(s,n,`${seed}:${d}:${n.id}`);if(t)s=G.hear(s,t.rumor,'npc')}}}
   if(hash(`${seed}:${d}:${place}:tell`)%100<30){const here=N.peopleHere(s);for(const n of here){const list=G.tellables(s,n.id);if(!list.length)continue;const t=G.tellRumor(s,n.id,list[0].id);if(t.ok){s=t.state;r.told++}break}}}
  r.maxDay=Math.max(r.maxDay,today);
  for(const h of (s.gossip?.heard??[]).filter(h=>h.day===d)){r.heard++;const x=G.parseRumor(h.r);if(x.truth!=='t')r.wrong++;if(!N.isNpcId(x.about)&&!['veg','meat'].includes(x.about))r.aboutPlayer++}
  r.maxBytes=Math.max(r.maxBytes,JSON.stringify(s.gossip??{}).length)}
 r.found=(s.journal??[]).filter(e=>e.key.startsWith('told:')).length;r.valid=!!engine.parse(JSON.stringify(s));return r}

function summarize(runs,years){const sum=k=>runs.reduce((a,r)=>a+r[k],0),months=runs.length*years*12;
 const kinds={},choices={};for(const r of runs){for(const [k,v] of Object.entries(r.kinds))kinds[k]=(kinds[k]??0)+v;for(const [k,v] of Object.entries(r.choices))choices[k]=(choices[k]??0)+v}
 return{n:runs.length,perMonth:sum('scenes')/months,maxDay:Math.max(...runs.map(r=>r.maxDay)),heardPerMonth:sum('heard')/months,wrongPct:sum('heard')?100*sum('wrong')/sum('heard'):0,aboutPlayer:sum('aboutPlayer'),toldPerMonth:sum('told')/months,foundPerYear:sum('found')/runs.length/years,maxBytes:Math.max(...runs.map(r=>r.maxBytes)),valid:runs.every(r=>r.valid),kinds,choices}}
function verdict(x){return[
 ['Tối đa 1 cảnh nhóm mỗi ngày',x.maxDay<=1,`cao nhất ${x.maxDay}`],
 ['4 đến 15 cảnh mỗi tháng',x.perMonth>=4&&x.perMonth<=15,`${x.perMonth.toFixed(1)}`],
 ['Tin sai hoặc thổi phồng 15 đến 35%',x.wrongPct>=15&&x.wrongPct<=35,`${x.wrongPct.toFixed(1)}%`],
 ['Không có tin về người chơi',x.aboutPlayer===0,`${x.aboutPlayer}`],
 ['Mỗi tháng nghe ít nhất 2 tin',x.heardPerMonth>=2,`${x.heardPerMonth.toFixed(1)}`],
 ['Save hợp lệ, lát cắt gossip dưới 4 KB',x.valid&&x.maxBytes<4096,`${x.maxBytes} byte`]]}
module.exports={run,summarize,verdict};
if(require.main===module){const arg=(k,d)=>{const i=process.argv.indexOf(k);return i>=0?Number(process.argv[i+1]):d};const years=arg('--years',1),seeds=arg('--seeds',30);
 const x=summarize(Array.from({length:seeds},(_,i)=>run(i,years)),years);
 console.log(`H7c ${seeds} seed x ${years} năm: ${x.perMonth.toFixed(1)} cảnh mỗi tháng, nghe ${x.heardPerMonth.toFixed(1)} tin mỗi tháng (${x.wrongPct.toFixed(1)}% sai hoặc thổi phồng), kể ${x.toldPerMonth.toFixed(1)} tin mỗi tháng, bị phát hiện ${x.foundPerYear.toFixed(1)} lần mỗi năm`);
 console.log('Loại cảnh',x.kinds,'Lựa chọn',x.choices);let ok=true;for(const [name,pass,detail] of verdict(x)){console.log(`${pass?'ĐẠT':'CHƯA'}  ${name}: ${detail}`);ok&&=pass}process.exit(ok?0:1)}
