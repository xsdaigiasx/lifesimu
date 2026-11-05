const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../.test-build/domain/talk/facts'),C=require('../.test-build/domain/talk/compose'),N=require('../.test-build/domain/npc');
const L=require('../.test-build/domain/life');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');const {dateAt}=require('../.test-build/domain/format');
const {recordJournal}=require('../.test-build/domain/journal');const I=require('../.test-build/domain/inbox');
const mon=(()=>{for(let d=7;d<21;d++)if(dateAt(d).getUTCDay()===1)return d})();
const at=(minute,location,extra={})=>{const s=engine.initial();return{...s,seed:{world:'facts',life:'l'},day:mon,money:1e6,fullness:30,clock:{...clockOf(s),minute,location},...extra}};
const sub=(s,x)=>T.factsOf(s).filter(f=>f.sub===x&&f.topic!=='self');
const say=(s,id,o={})=>C.compose({npc:N.castById(s,id),tier:'close',mood:'neutral',channel:'face',minute:clockOf(s).minute,day:s.day,seed:'x',facts:T.factsOf(s),present:N.peopleHere(s).map(n=>n.id),...o});

test('25 loại dữ kiện; dữ kiện nào cũng hợp lệ',()=>{
 assert.equal(T.FACT_SUBS.length,25);assert.equal(new Set(T.FACT_SUBS).size,25);
 const s=at(600,'market');for(const f of T.factsOf(s)){assert.ok(f.topic==='self'||T.FACT_SUBS.includes(f.sub),f.sub);assert.ok(f.knownBy==='all'||f.knownBy==='present'||f.knownBy.length>0,f.id);for(const id of Array.isArray(f.knownBy)?f.knownBy:[])assert.ok(N.isNpcId(id),id)}
 assert.ok(sub(s,'weather').length===1&&sub(s,'forecast').length===1,'thời tiết ai cũng biết');assert.equal(sub(s,'weather')[0].knownBy,'all');
});

test('ăn ngoài: chỉ người có mặt ở quán lúc đó biết; NPC không nhắc điều không thấy',()=>{
 const r=L.lifeAction(at(720,'streetfood'),{kind:'eatOut',id:'comTam'});assert.ok(r.ok,r.error);const s=r.state;assert.ok(engine.valid(s));
 assert.deepEqual(L.lifeOf(s).ate.map(a=>[a.n,a.p,a.out]),[['Cơm tấm','streetfood',true]]);
 const f=sub(s,'food')[0];assert.ok(f&&f.vars.dish==='cơm tấm');assert.ok(f.knownBy.includes('banhmi'),'người bán bánh mì ở quán lúc trưa');assert.ok(!f.knownBy.includes('veg'),'người bán rau không ở quán');
 for(let i=0;i<40;i++){const t=say(s,'veg',{seed:'v'+i,intents:['ask','tease']}).text;assert.ok(!t.includes('cơm tấm'),t)}
 assert.ok(Array.from({length:40},(_,i)=>say(s,'banhmi',{seed:'b'+i,intents:['ask','tease']}).text).some(t=>t.includes('cơm tấm')),'người thấy thì có thể nhắc');
 assert.equal(sub({...s,day:s.day+1},'food').length,0,'qua ngày thì thôi nhắc bữa ăn');
});

test('người thân chỉ biết chuyện lớn khi người chơi đã gọi hoặc nhắn sau chuyện đó',()=>{
 let s=recordJournal(at(600,'home'),`move:${mon}:pho`,'Chuyển tới Nhà phố','x');
 let f=sub(s,'home')[0];assert.ok(f.knownBy.includes('landlord'));assert.ok(!f.knownBy.includes('me'));assert.equal(f.vars.place,'Nhà phố');
 const r=I.callNpc(s,'me');assert.ok(r.ok,r.error);s=r.state;f=sub(s,'home')[0];assert.ok(f.knownBy.includes('me'),'đã gọi Mẹ');
 assert.equal(T.lastContact(s,'me'),mon);assert.deepEqual(T.familyTold(s,mon+1),[]);
});

test('chuyện riêng theo phận sự: tiền trọ chỉ chủ trọ, khoản vay chỉ ngân hàng; mệt thì người có mặt thấy',()=>{
 const s=at(600,'market',{energy:10,money:50000,bank:{version:1,credit:600,seq:1,loans:[{id:'l1',principal:5e6,months:6,startDay:0,balance:4e6,paid:1}]}});
 assert.deepEqual(sub(s,'loan')[0].knownBy,['teller']);assert.equal(sub(s,'loan')[0].private,2);
 const tired=sub(s,'tired')[0];assert.equal(tired.knownBy,'present');
 const here=N.peopleHere(s).map(n=>n.id);assert.ok(here.includes('veg'));
 const C2=require('../.test-build/domain/talk/axes');assert.ok(C2.canKnow(tired,'veg',here));assert.ok(!C2.canKnow(tired,'teller',here));
 assert.ok(sub(s,'money').every(f=>!f.knownBy.includes('veg')),'người lạ không biết người chơi kẹt tiền');assert.equal(sub(s,'money').length,0,'chưa nợ trọ, chưa kể ai thì không ai biết');
 const owe=at(600,'home',{money:50000,rent:{billedMonth:'2026-01',owed:1500000,dueDay:mon,notice:null}});assert.deepEqual(sub(owe,'money')[0].knownBy,['landlord']);assert.deepEqual(sub(owe,'rent')[0].knownBy,['landlord']);
});

test('NPC còn nợ người chơi thì biết; lỡ hẹn chỉ người bị lỡ biết',()=>{
 let s=at(600,'home',{story:{version:1,seq:0,log:[],memories:[],hooks:[],loans:[{id:'a',npc:'courier',amount:200000,due:mon,repay:false,settled:'unpaid'}]}});
 s={...recordJournal(s,`appt-missed:x`,'Lỡ hẹn','x','veg')};
 assert.deepEqual(sub(s,'debt')[0].knownBy,['courier']);assert.equal(sub(s,'debt')[0].vars.amount,'200 nghìn');assert.deepEqual(sub(s,'missed')[0].knownBy,['veg']);
});
