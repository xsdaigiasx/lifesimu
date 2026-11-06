/* H7a: mô phỏng NPC ngẫu nhiên. Dùng đúng code domain của app (.test-build): settleCycle, settleTown qua từng ngày, câu ghép bằng talk/live.sayNow.
 * Chạy: npm run sim:town -- [--years 2] [--seeds 30]   (luôn build lại .test-build để không chạy mã cũ)
 * 3 persona đi các nơi theo nhịp khác nhau (Ở nhà: chỉ khu trọ; Trung bình: khu trọ, chợ 3 buổi, quán ngày thường, công viên 2 buổi; Đi nhiều: mọi nơi mỗi ngày),
 * gặp NPC ngẫu nhiên đang có mặt thì trò chuyện 60% (cộng 1 điểm quan hệ).
 * Chỉ tiêu (HOI-THOAI bảng H, dòng H7): không quá 12 NPC ngẫu nhiên cùng lúc; người lạ gặp lại nhớ lần trước
 * (gặp lại sau 7 đến 90 ngày thì câu đầu nhắc lần gặp trước ít nhất 90%; chuyện đã sang nhịp mới thì nhắc từ 2 ngày); người mới chỉ tới ở nơi người chơi lui tới trong 7 ngày (khu trọ luôn tính);
 * tối đa 2 người mới trong 7 ngày; save hợp lệ. Đo thêm: số người đang có, người tới, chuyển đi, quay lại mỗi năm. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
if(require.main===module||!fs.existsSync(path.join(root,'.test-build/domain/town.js'))){fs.mkdirSync(path.join(root,'.test-build'),{recursive:true});fs.writeFileSync(path.join(root,'.test-build/package.json'),'{"type":"commonjs"}');
 const r=spawnSync('node',['node_modules/typescript/bin/tsc','-p','tsconfig.tests.json'],{cwd:root,stdio:'inherit'});if(r.status)process.exit(r.status)}
const B=p=>require(path.join(root,'.test-build/domain',p));
const {engine}=B('engine'),N=B('npc'),L=B('lifecycle'),W=B('town'),T=B('town-data'),V=B('talk/live'),{hash}=B('shift'),{dateAt}=B('format');
const MET=['met','metsame','metnew','back'];
const PERSONAS={home:{name:'Ở nhà',go:()=>['home']},avg:{name:'Trung bình',go:(d,dow)=>['home',...([1,3,6].includes(dow)?['market']:[]),...(dow>=1&&dow<=5?['streetfood']:[]),...([2,0].includes(dow)?['park']:[])]},out:{name:'Đi nhiều',go:()=>['home','market','streetfood','park']}};

function run(seed,years,persona='avg'){const P=PERSONAS[persona],days=years*365;let s={...engine.initial(),seed:{world:`town${seed}`,life:`town${seed}`}};
 const r={seed,persona,maxOn:0,onSum:0,came:0,left:0,back:0,meets:0,remeets:0,recalled:0,backMeets:0,backRecalled:0,badPlace:[],burst:0,samples:[],miss:[]};const comes=[];
 for(let d=1;d<=days;d++){s={...s,day:d,inbox:undefined};const before=L.cycleOf(s);s=W.settleTown(L.settleCycle(s));const cy=L.cycleOf(s);
  const onB=N.townOn(before),onA=N.townOn(cy);
  for(const id of onA.filter(x=>!onB.includes(x))){r.came++;comes.push(d);const h=cy.holders[id];if(h?.r===d)r.back++;
   const place=T.archOf(h?.a)?.place,been=before.town?.been??{};if(place&&place!=='home'&&!((been[place]??-99)>=d-7))r.badPlace.push(`${id} ngày ${d} ở ${place}`)}
  r.left+=cy.gone.filter(g=>g.day===d&&T.isTown(g.role)&&g.why==='left').length;
  if(comes.filter(x=>x>d-7).length>2)r.burst++;
  r.maxOn=Math.max(r.maxOn,onA.length);r.onSum+=onA.length;
  const dow=dateAt(d).getUTCDay();
  for(const place of P.go(d,dow)){s=N.markBeen(s,place);
   const people=N.rosterOf(s).filter(n=>n.arch&&T.archOf(n.arch).place===place);
   for(const n of people){const sl=n.schedule.find(x=>x.place===place&&x.days.includes(dow));if(!sl)continue;const minute=sl.from+20;if(!N.presentAt(n,d,minute,place))continue;
    if(hash(`${seed}:${d}:${n.id}:talk`)%100>=60)continue;
    const rel=s.social?.relations?.[n.id],last=rel&&rel.lastDay<d?rel.lastDay:-1,h=L.cycleOf(s).holders[n.id];r.meets++;
    const st={...s,clock:{...(s.clock??{}),minute,location:place}},said=V.sayNow(st,n,'face',`sim:${d}:${n.id}`),sub=said?.fact?.sub;
    if(h?.r!==undefined&&last<h.r){r.backMeets++;if(sub==='back')r.backRecalled++}
    else if(last>=0&&d-last>=7&&d-last<=90){r.remeets++;if(MET.includes(sub))r.recalled++;else if(r.miss.length<5)r.miss.push(`${n.id} d${d} last${last} ${said?.text} facts:${require(path.join(root,".test-build/domain/talk/arcs")).townFacts(st).filter(f=>f.about===n.id).map(f=>f.sub).join(",")}`);if(r.samples.length<6&&MET.includes(sub))r.samples.push(`${n.name}: ${said.text}`)}
    const so=s.social??{relations:{},chatMinutesDay:0,chatDay:d};s={...s,social:{...so,relations:{...so.relations,[n.id]:{score:Math.min(100,(rel?.score??0)+1),lastDay:d,minutes:5}}}}}}}
 return{...r,avgOn:r.onSum/days,valid:!!engine.parse(JSON.stringify(s)),townBytes:JSON.stringify(s.cycle?.town??{}).length}}

function summarize(runs,years){const by=p=>runs.filter(r=>r.persona===p),sum=(l,k)=>l.reduce((a,r)=>a+r[k],0);
 const out={};for(const p of Object.keys(PERSONAS)){const l=by(p);if(!l.length)continue;out[p]={n:l.length,avgOn:sum(l,'avgOn')/l.length,maxOn:Math.max(...l.map(r=>r.maxOn)),came:sum(l,'came')/l.length/years,left:sum(l,'left')/l.length/years,back:sum(l,'back')/l.length/years,recall:sum(l,'recalled')/Math.max(1,sum(l,'remeets')),remeets:sum(l,'remeets')/l.length/years,backRecall:sum(l,'backRecalled')/Math.max(1,sum(l,'backMeets')),backMeets:sum(l,'backMeets')}}
 return{by:out,maxOn:Math.max(...runs.map(r=>r.maxOn)),badPlace:runs.flatMap(r=>r.badPlace),burst:sum(runs,'burst'),invalid:runs.filter(r=>!r.valid).length,townBytes:Math.max(...runs.map(r=>r.townBytes)),samples:runs.flatMap(r=>r.samples).slice(0,8)}}
function verdict(sum){const rec=Object.values(sum.by).filter(x=>x.remeets>0).map(x=>x.recall),minRec=rec.length?Math.min(...rec):1;
 return[['Không quá 12 NPC ngẫu nhiên cùng lúc',sum.maxOn<=12,`tối đa ${sum.maxOn}`],['Người lạ gặp lại nhớ lần trước (từ 90%)',minRec>=.9,`thấp nhất ${(minRec*100).toFixed(1)}%`],
  ['Người mới chỉ tới ở nơi hay lui tới',sum.badPlace.length===0,sum.badPlace.slice(0,3).join('; ')||'đúng'],['Tối đa 2 người mới trong 7 ngày',sum.burst===0,`${sum.burst} lần vượt`],['Save hợp lệ',sum.invalid===0,`${sum.invalid} save lỗi`]]}

module.exports={run,summarize,verdict,PERSONAS};
if(require.main===module){const arg=k=>{const i=process.argv.indexOf('--'+k);return i>0?Number(process.argv[i+1]):undefined};const years=arg('years')??2,seeds=arg('seeds')??30;
 const runs=[];for(const p of Object.keys(PERSONAS))for(let i=0;i<seeds;i++)runs.push(run(i,years,p));const sum=summarize(runs,years);
 console.log(`NPC ngẫu nhiên: ${years} năm x ${seeds} seed x ${Object.keys(PERSONAS).length} persona`);
 for(const [p,x] of Object.entries(sum.by))console.log(`${PERSONAS[p].name}: đang có trung bình ${x.avgOn.toFixed(1)} (tối đa ${x.maxOn}), mỗi năm tới ${x.came.toFixed(1)}, chuyển đi ${x.left.toFixed(1)}, quay lại ${x.back.toFixed(2)}; gặp lại ${x.remeets.toFixed(0)} lần/năm, nhớ lần trước ${(x.recall*100).toFixed(1)}%; người quay lại ${x.backMeets} lần gặp, nhận ra ${(x.backRecall*100).toFixed(0)}%`);
 console.log(`Lát cắt town tối đa ${sum.townBytes} byte`);for(const t of sum.samples)console.log('  '+t);
 let ok=true;for(const [name,pass,detail] of verdict(sum)){console.log(`${pass?'ĐẠT':'CHƯA'}  ${name}: ${detail}`);ok&&=pass}process.exit(ok?0:1)}
