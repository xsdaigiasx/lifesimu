/* H1: kiểm tra kho khung và mảnh hội thoại, in câu mẫu.
 * Chạy: npm run talk:check -- [--samples 30]
 * Dữ liệu sai: in lỗi và thoát mã 1. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1]};
{fs.mkdirSync(path.join(root,'.test-build'),{recursive:true});fs.writeFileSync(path.join(root,'.test-build/package.json'),'{"type":"commonjs"}');
 const r=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','-p','tsconfig.tests.json'],{cwd:root,stdio:'inherit'});if(r.status)process.exit(r.status)}
const C=require(path.join(root,'.test-build/domain/talk/compose')),K=require(path.join(root,'.test-build/domain/talk/check')),N=require(path.join(root,'.test-build/domain/npc'));
const Threads=require(path.join(root,'.test-build/domain/talk/threads'));
const bad=[...K.talkProblems(C.TALK,{minFramesPerIntent:3}),...Threads.threadProblems()];
console.log(`${Threads.THREAD_TOPICS.length} mạch, ${Threads.THREAD_TOPICS.reduce((n,t)=>n+t.beats.length,0)} câu có tag`);
if(bad.length){console.error(`${bad.length} lỗi, dữ liệu bị chặn`);for(const b of bad)console.error('  - '+b);process.exit(1)}
console.log(`OK ${C.TALK.frames.length} khung, ${C.TALK.pieces.length} mảnh`);
const n=Number(arg('--samples',30)),R=N.buildRoster('mau'),moods=['happy','excited','neutral','tired','sad','annoyed'],tiers=['stranger','acquaint','close','bestie'];
const facts=[{id:'f1',topic:'player',sub:'food',about:'player',day:9,tone:'plain',private:0,knownBy:'all',vars:{dish:'cơm tấm'}},{id:'f2',topic:'world',sub:'weather',about:'world',day:10,tone:'bad',private:0,knownBy:'all',vars:{weather:'mưa'}},{id:'f3',topic:'player',sub:'work',about:'player',day:4,tone:'good',private:0,knownBy:'all',vars:{event:'Middle'}},{id:'f4',topic:'world',sub:'world',about:'world',day:10,tone:'plain',private:0,knownBy:'all',vars:{place:'quán bún bò đầu hẻm',time:'tối mai'}}];
for(let i=0;i<n;i++){const npc=R[i%R.length],self={...facts[0]},ownSick={id:'s'+i,topic:'self',sub:'sick',about:npc.id,day:8,tone:'bad',private:0,knownBy:'all',vars:{weather:'mưa'}};
 const said=C.compose({npc,tier:tiers[i%4],mood:moods[i%6],channel:i%5===0?'text':'face',minute:600+i*13%600,day:10,seed:'mau'+i,facts:[self,ownSick,...facts.slice(1)]});
 console.log(`${String(i+1).padStart(3)}. ${npc.name} (${tiers[i%4]}, ${moods[i%6]}) [${said?.intent??'chào'}] ${said?.text??'(không nói)'}`)}
