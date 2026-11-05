const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const B=require('../.test-build/domain/backup');
const R=require('../.test-build/domain/reset');
const mem=(o={})=>{const d={...o};return{d,getItem:k=>k in d?d[k]:null,setItem:(k,v)=>{d[k]=String(v)},removeItem:k=>{delete d[k]}}};
const KEY=R.SAVE_KEYS[0],PROF=R.SAVE_KEYS[2],PH=R.SAVE_KEYS[1];
const save=(day,money)=>JSON.stringify({...engine.initial(),day,money});
(async()=>{
 // 1. Không có save thì không có gì để xuất
 assert.equal(B.packOf(mem(),1),null);
 // 2. Xuất rồi nhập lại, giữ đủ các khoá
 const st=mem({[KEY]:save(40,5_000_000),[PROF]:JSON.stringify({name:'An',gender:'male',complete:true})});
 const pack=B.packOf(st,123),text=await B.encryptPack(pack,40);
 const env=JSON.parse(text);assert.equal(env.app,'next-day');assert.equal(env.format,1);assert.equal(env.day,40);
 assert(!text.includes('5000000')&&!text.includes('"An"'),'nội dung phải được mã hoá');
 assert.notEqual(await B.encryptPack(pack,40),text,'IV ngẫu nhiên mỗi lần');
 const r=await B.decryptPack(text);assert(r.ok);assert.deepEqual(r.pack.data,pack.data);
 // 3. Sửa tay thì bị phát hiện
 const flip=s=>{const c=s[10]==='A'?'B':'A';return s.slice(0,10)+c+s.slice(11)};
 assert.deepEqual(await B.decryptPack(JSON.stringify({...env,data:flip(env.data)})),{ok:false,error:'tamper'});
 assert.deepEqual(await B.decryptPack(JSON.stringify({...env,iv:flip(env.iv)})),{ok:false,error:'tamper'});
 assert.deepEqual(await B.decryptPack(JSON.stringify({...env,day:999})),{ok:true,pack:pack},'day chỉ là nhãn, không ảnh hưởng save');
 // 4. Tệp lạ, rỗng, phiên bản mới
 for(const bad of['','{','[]','{"app":"x"}',JSON.stringify({...env,app:'other'})])assert.deepEqual(await B.decryptPack(bad),{ok:false,error:'format'},bad);
 assert.deepEqual(await B.decryptPack(JSON.stringify({...env,format:2})),{ok:false,error:'unsupported'});
 // 5. Save bên trong sai thì bị từ chối dù mã hoá đúng
 for(const data of[{[KEY]:'{"x":1}'},{[KEY]:save(1,1),[PH]:'rác'},{[KEY]:save(1,1),[PROF]:'{"name":1}'},{[PROF]:'{}'},{[KEY]:save(1,1),other:'x'}]){
  const t=await B.encryptPack({v:1,savedAt:1,data},1);assert.deepEqual(await B.decryptPack(t),{ok:false,error:'invalid'},JSON.stringify(data).slice(0,40))}
 // 6. Ghi đè: đời hiện tại thành bản sao lưu 7 ngày, khoá không có trong gói bị xoá
 const cur=mem({[KEY]:save(7,1_000),[PH]:'{"stale":1}'});
 assert(B.applyPack(cur,r.pack,5_000));
 assert.equal(cur.d[KEY],pack.data[KEY]);assert.equal(cur.d[PROF],pack.data[PROF]);assert(!(PH in cur.d),'khoá phone cũ bị xoá');
 const info=R.backupInfo(cur,5_000);assert.equal(info.day,7);assert.equal(info.money,1_000);
 assert(R.restoreBackup(cur,6_000),'khôi phục lại được đời trước khi nhập');assert.equal(JSON.parse(cur.d[KEY]).day,7);
 assert.equal(B.fileName(40),'next-day-ngay-41.json');
 console.log('backup ok');
})().catch(e=>{console.error(e);process.exit(1)});
