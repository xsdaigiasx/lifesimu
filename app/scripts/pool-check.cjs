/* T42: kiểm tra và xem thử bể thuộc tính NPC.
 * Chạy: npm run pool:check -- [--file duong-dan.json] [--samples 200]
 * Không có --file thì kiểm src/domain/npc-pool.json. Dữ liệu sai: in lỗi và thoát mã 1 (không in mẫu). */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1]};
{fs.mkdirSync(path.join(root,'.test-build'),{recursive:true});fs.writeFileSync(path.join(root,'.test-build/package.json'),'{"type":"commonjs"}');
 const r=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','-p','tsconfig.tests.json'],{cwd:root,stdio:'inherit'});if(r.status)process.exit(r.status)}
const {poolProblems}=require(path.join(root,'.test-build/domain/pool-check'));
const file=path.resolve(arg('--file',path.join(root,'src/domain/npc-pool.json')));
let data;try{data=JSON.parse(fs.readFileSync(file,'utf8'))}catch(e){console.error(`Không đọc được ${file}: ${e.message}`);process.exit(1)}
const bad=poolProblems(data);
if(bad.length){console.error(`${file}: ${bad.length} lỗi, dữ liệu bị chặn`);for(const b of bad)console.error('  - '+b);process.exit(1)}
console.log(`OK ${file}`);
const n=Number(arg('--samples',200));
if(n>0){// sinh mẫu bằng đúng bộ sinh của game; --file khác mặc định thì nạp bể đó vào POOL trước khi sinh
 const N=require(path.join(root,'.test-build/domain/npc'));
 if(!process.argv.includes('--file'))null;else{for(const k of Object.keys(N.POOL))N.POOL[k]=data[k];N.TRAIT_CONFLICTS.splice(0,N.TRAIT_CONFLICTS.length,...data.conflicts)}
 const names=new Set();
 for(let i=0;i<n;i++){const p=N.generateNpc('mau'+i);names.add(p.name);const pr=N.profileProblems(p);
  console.log(`${String(i+1).padStart(3)}. ${p.name}, ${p.gender==='male'?'nam':'nữ'} ${p.age} tuổi, ${p.origin}, ${p.job}; ${p.traits.join(', ')}; ${p.quirk}; mục tiêu: ${p.goal}; sợ: ${p.fear}${pr.length?'  !! '+pr.join('; '):''}`)}
 console.log(`${n} mẫu, ${names.size} tên khác nhau`)}
