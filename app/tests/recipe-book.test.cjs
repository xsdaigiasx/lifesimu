const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../.test-build/domain/life');const D=require('../.test-build/domain/director');const I=require('../.test-build/domain/inbox');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');const {socialOf}=require('../.test-build/domain/social');
const at=(minute,location,extra={})=>{const s=engine.initial();return{...s,day:6,money:1e6,clock:{...clockOf(s),minute,location},...extra}};
const withRel=(s,id,score)=>({...s,social:{...socialOf(s),relations:{...socialOf(s).relations,[id]:{score,lastDay:s.day,minutes:0}}}});
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state));return r.state};
test('món của NPC: không mở bằng Lv, chỉ học từ đúng người, ghi sổ và nhật ký',()=>{
 const s=at(600,'home',{skills:{...engine.initial().skills,cooking:{level:10,xp:0}}});for(const id of ['rauMuong','thitKho','comChien'])assert.equal(L.knowsRecipe(s,id),false,id);
 assert.deepEqual(L.recipeSources('rauMuong'),[{kind:'npc',npc:'co-hanh'}]);assert.deepEqual(L.recipeSources('porkRice').map(x=>x.kind),['lv','npc']);
 const base=at(600,'home');assert.ok(engine.valid(base));const n=L.learnRecipe(base,'thitKho','chu-luc','Chú Lực');assert.ok(L.knowsRecipe(n,'thitKho'));assert.deepEqual(L.lifeOf(n).learned.thitKho,{by:'chu-luc',day:6});assert.ok(n.journal.some(j=>j.title==='Học món Thịt kho trứng'&&j.npcId==='chu-luc'));assert.ok(engine.valid(n));
 assert.equal(L.learnRecipe(n,'thitKho','chu-luc','Chú Lực'),n,'học lại không đổi gì');
 assert.equal(engine.valid({...n,life:{...L.lifeOf(n),learned:{abc:{by:'me',day:1}}}}),false);
});
test('câu chuyện Dạy nấu ăn: chọn Ghi lại cẩn thận thì học món riêng của người đó',()=>{
 let s=withRel(at(540,'market'),'chu-luc',15);s={...s,story:{...D.storyOf(s),pending:{key:`${s.day}:t`,npc:'chu-luc',motif:'recipe',variant:0,by:'npc',day:s.day}}};
 const ev=D.openEvent(s);assert.equal(ev.npc.id,'chu-luc');s=ok(D.answerEvent(s,0));assert.ok(L.knowsRecipe(s,'thitKho'));assert.equal(L.lifeOf(s).learned.thitKho.by,'chu-luc');
});
test('Mẹ chỉ món ghi người chỉ là Mẹ',()=>{
 let s=at(1200,'home');s={...s,inbox:{...I.inboxOf(s),threads:{me:[{id:'m1',day:6,minute:1150,from:'npc',text:'x',kind:'mom-recipe',recipe:'canhChua',replies:['a','b']}]}}};
 s=ok(I.replyMessage(s,'me','m1',0));assert.equal(L.lifeOf(s).learned.canhChua.by,'me');
});
