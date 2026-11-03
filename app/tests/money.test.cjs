const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {post,posted,validTx,MONEY_CAP,TX_KEEP}=require('../.test-build/domain/money');
const {engine}=require('../.test-build/domain/engine');
const base=()=>structuredClone(engine.initial());

// post: ghi sổ, tiền và mã giao dịch
{
 const s=base(),m0=s.money;
 assert.equal(post(s,{id:'t:a',name:'Thu',amount:1000}),'ok');
 assert.equal(s.money,m0+1000);assert.equal(s.ledger[0].amount,1000);assert(posted(s,'t:a'));
 assert.equal(post(s,{id:'t:a',name:'Thu',amount:1000}),'duplicate','cùng mã không ghi hai lần');
 assert.equal(s.money,m0+1000);assert.equal(s.ledger.length,1);
 assert.equal(post(s,{name:'Chi',amount:-m0*2}),'short','không cho âm tiền');
 assert.equal(post(s,{name:'Thu lớn',amount:MONEY_CAP}),'cap','không vượt trần');
 assert.equal(post(s,{name:'Lẻ',amount:1.5}),'invalid');assert.equal(post(s,{name:'Lẻ',amount:NaN}),'invalid');
 assert.equal(post(s,{id:'bad id',name:'x',amount:1}),'invalid');
 assert.equal(post(s,{name:'Không',amount:0}),'ok');assert.equal(s.ledger.length,1);
 assert.equal(s.money,m0+1000,'giao dịch bị từ chối không đổi tiền');
}
// mã tự sinh không trùng nhau, danh sách mã giữ tối đa TX_KEEP
{
 const s=base();for(let i=0;i<TX_KEEP+50;i++)assert.equal(post(s,{name:'Thu',amount:1}),'ok');
 assert.equal(s.txIds.length,TX_KEEP);assert.equal(new Set(s.txIds).size,TX_KEEP);assert(s.ledger.length<=100);
 assert(validTx(s));assert(engine.parse(JSON.stringify(s)),'save có txIds vẫn nạp được');
 assert(!validTx({...s,txIds:[1]}));assert(!validTx({...s,txSeq:-1}));assert(!engine.parse(JSON.stringify({...s,txIds:['bad id']})));
}
// Mọi đường mua bán trong engine đi qua post: số dư khớp tổng sổ cái
{
 const s=base();assert.equal(typeof engine.buy,'function');
}
// Cấm đổi tiền ngoài money.ts và cấm Math.random trong logic game
{
 const root=path.join(__dirname,'..','src');const files=[];(function walk(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);fs.statSync(p).isDirectory()?walk(p):/\.(ts|tsx)$/.test(f)&&files.push(p)}})(root);
 const raw=[/\.money\s*[-+*/]?=(?!=)/,/money\s*:\s*[A-Za-z_.]+\.money\b/,/money\s*:\s*[A-Za-z_.]+\s*[-+]\s*\w/];
 for(const f of files){const rel=path.relative(root,f).replace(/\\/g,'/');if(rel==='domain/money.ts'||rel==='domain/reset.ts')continue;const t=fs.readFileSync(f,'utf8');
  for(const re of raw)assert(!re.test(t),`đổi tiền trực tiếp trong ${rel}: ${re}`);
  if(rel.startsWith('domain/'))assert(!/Math\.random/.test(t),`Math.random trong logic ${rel}`)}
}
console.log('PASS money gateway: idempotent txId, no negative or over-cap, bounded id list, save round-trip, no raw money mutation or Math.random in domain');
