const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const G=require('../.test-build/domain/talk/gossip'),T=require('../.test-build/domain/talk/ties'),P=require('../.test-build/domain/talk/price'),N=require('../.test-build/domain/npc'),L=require('../.test-build/domain/lifecycle');
const {marketPrice,INGREDIENTS}=require('../.test-build/domain/life');
const at=(world,day,place,minute)=>({...engine.initial(),day,seed:{world,life:'l'},clock:{minute,location:place,lastWorkDay:-1,lastStudyDay:-1,lastRestDay:-1}});
const withScores=(s,v)=>({...s,social:{relations:Object.fromEntries(N.rosterOf(s).map(n=>[n.id,{score:v,lastDay:0,minutes:5}])),chatMinutesDay:0,chatDay:s.day}});

// mã tin đồn tự chứa dữ liệu, mã hỏng bị từ chối
{const r=G.parseRumor(G.rumorId({about:'veg',gen:0,ev:'cold',start:12,truth:'big'}));assert.equal(r.ev,'cold');assert.equal(r.truth,'big');
 assert.equal(G.parseRumor('veg~0~nope~1~t~'),null);assert.equal(G.parseRumor('ai-do~0~cold~1~t~'),null);assert.equal(G.parseRumor('veg~0~cold~1~maybe~'),null)}

// tin đồn tất định theo seed, chỉ về NPC hoặc giá chợ, người trong cuộc không tự lan tin mình
{const s=at('g-test',40,'market',540),a=G.rumorsOn(s),b=G.rumorsOn(s);assert.deepEqual(a,b);assert(a.length>0);
 for(const r of a){assert(N.isNpcId(r.about)||['veg','meat'].includes(r.about));if(r.ev!=='price'){const n=N.castById(s,r.about);assert(n);assert.equal(G.knows(s,r,n),false)}}
 const r=a.find(x=>x.ev!=='price'),subj=N.castById(s,r.about),near=T.tiesOf(s,subj).map(t=>t.npc.id);
 for(const n of N.rosterOf(s).filter(n=>!n.remote&&!n.family&&n.id!==subj.id)){if(G.knows(s,r,n,r.start)){assert.fail(`${n.id} biết ngay ngày đầu`)}if(G.knows(s,r,n,r.start+1))assert(near.includes(n.id),'hôm sau chỉ người quen biết')}}

// quan hệ NPC với NPC: đối xứng về điểm, có loại theo nơi chung, xưng hô theo tuổi
{const s=at('g-test',10,'market',540),[a,b]=['veg','meat'].map(id=>N.castById(s,id)),t1=T.tieOf(s,a,b),t2=T.tieOf(s,b,a);assert.equal(t1.kind,'market');assert.equal(t1.score,t2.score);
 const old={...a,age:70,gender:'female'},young={...b,age:25,gender:'male'};assert.deepEqual([T.between(young,old).self,T.between(young,old).you],['cháu','bà']);assert.deepEqual([T.between(old,young).self,T.between(old,young).you],['bà','cháu']);assert.equal(T.between(young,old).junior,true)}

// tìm một cảnh nhóm cãi nhau và một cảnh tin đồn
function find(kind){for(let w=0;w<80;w++)for(let d=20;d<120;d+=3)for(const [p,m] of [['market',540],['home',1200],['park',450],['streetfood',720],['market',600]]){const s=at('g'+w,d,p,m),sc=G.pickScene(s,'t');if(sc&&sc.kind===kind)return{s,sc}}assert.fail('không tìm được cảnh '+kind)}
{const {s:s0,sc}=find('spat'),s=withScores({...s0,gossip:{version:1,heard:[],told:[],scene:s0.day,pending:sc}},20);
 assert(G.validGossip(s.gossip,s.day));assert.equal(G.maybeGroup(s,'again'),s,'đang có cảnh thì không mở cảnh khác');
 const r=G.answerGroup(s,'sideA');assert(r.ok);const rel=r.state.social.relations;assert(rel[sc.a].score>20);assert(rel[sc.b].score<20);
 assert.equal(T.deltaOf(r.state,sc.a,sc.b),-G.GROUP.tie);assert.equal(r.state.gossip.pending,undefined);assert(r.lines.length===2);assert(r.state.journal.some(e=>e.key===`group:${sc.key}`));
 assert.equal(G.maybeGroup(r.state,'again2'),r.state,'tối đa 1 cảnh mỗi ngày');assert(engine.parse(JSON.stringify(r.state)));
 assert.equal(G.answerGroup(r.state,'listen').ok,false)}
{const {s:s0,sc}=find('gossip'),s={...s0,gossip:{version:1,heard:[],told:[],scene:s0.day,pending:sc}};
 assert.deepEqual(G.groupChoices(s,sc).map(c=>c.id),['ask','listen','brush']);const r=G.answerGroup(s,'listen');assert(r.ok);assert.deepEqual(r.state.gossip.heard.map(h=>h.r),[sc.rumor]);
 const b=G.answerGroup(s,'brush');assert(b.ok);assert.equal(b.state.gossip.heard.length,0,'gạt đi thì không nghe tin')}

// kể lại tin: tin đúng thì người nghe thân hơn; tin sai mà người nghe quen người trong cuộc thì người trong cuộc có thể biết, giận
{let done={good:false,found:false};for(let w=0;w<60&&!(done.good&&done.found);w++)for(let d=20;d<100&&!(done.good&&done.found);d+=4)for(const [p,m] of [['market',540],['home',1200],['streetfood',720]]){
  const s=withScores(at('g'+w,d,p,m),20),here=N.peopleHere(s);if(!here.length)continue;
  for(const r of G.rumorsOn(s).filter(r=>r.ev!=='price')){const h=G.hear(s,r.id,'over');for(const n of here){if(!G.tellables(h,n.id).some(x=>x.id===r.id))continue;const t=G.tellRumor(h,n.id,r.id);assert(t.ok,t.error);assert(t.text);
    assert.equal(G.tellables(t.state,n.id).some(x=>x.id===r.id),false,'không kể một tin hai lần cho cùng người');
    const told=t.state.gossip.told.at(-1);
    if(r.truth==='t'&&!(require('../.test-build/domain/talk/group-data').RUMOR_TEXT[r.ev]?.private)){assert(t.state.social.relations[n.id].score>20);assert.equal(told.out,undefined);done.good=true}
    if(told.out!==undefined){const later=G.settleGossip({...t.state,day:told.out});assert(later.social.relations[r.about].score<20);assert(later.gossip.told.at(-1).done);assert(later.journal.some(e=>e.key.startsWith('told:')));
     const again=G.settleGossip(later);assert.equal(again.social.relations[r.about].score,later.social.relations[r.about].score,'chỉ giận một lần');done.found=true}}}}
 assert(done.good&&done.found,JSON.stringify(done))}
// chưa đủ quen thì không kể được
{const s=withScores(at('g1',30,'market',540),5),n=N.peopleHere(s)[0],r=G.rumorsOn(s).find(x=>x.about!==n.id),h=G.hear(s,r.id,'over');assert.equal(G.tellRumor(h,n.id,r.id).ok,false)}

// giá chợ: đợt tăng giá thật, tin đúng có trước 3 ngày
{let checked=0;for(let w=0;w<20;w++){const world='price'+w;for(let b=0;b<200;b+=20){const p=P.priceWave(world,b);if(!p)continue;const s={...engine.initial(),day:p.from,seed:{world,life:'l'}};
  const item=p.seller==='veg'?'vegetable':'pork';assert.equal(marketPrice({...s,clock:{minute:480,location:'market'}},item),Math.round(INGREDIENTS[item].price*1.2/500)*500);
  const before={...s,day:p.from-3};assert(G.rumorsOn(before).some(r=>r.ev==='price'&&r.about===p.seller&&r.truth==='t'),'tin có trước 3 ngày');
  assert.equal(marketPrice({...s,day:p.to+1,clock:{minute:480,location:'market'}},item)<=INGREDIENTS[item].price,true);checked++}}assert(checked>10)}

// save: lát cắt tuỳ chọn, save cũ không có vẫn hợp lệ, dữ liệu hỏng bị chặn; người rời vai thì xoá dấu vết
{const s=at('g2',30,'home',1200);assert(engine.parse(JSON.stringify(s)));
 for(const bad of [{version:2,heard:[],told:[]},{version:1,heard:[{r:'x',day:1,how:'over'}],told:[]},{version:1,heard:[],told:[],d:{'veg|meat':999}},{version:1,heard:[],told:[],scene:99}])assert.equal(G.validGossip(bad,30),false);
 const g={version:1,heard:[],told:[{r:G.rumorId({about:'meat',gen:0,ev:'cold',start:20,truth:'false'}),to:'veg',day:25}],d:{'meat|veg':-6,'grocery|veg':3}};assert(G.validGossip(g,30));
 const n=L.archive({...s,gossip:g},'veg','veg.0');assert.deepEqual(n.gossip.told,[]);assert.deepEqual(n.gossip.d,{})}
console.log('PASS gossip: rumors deterministic, spread by ties, no rumors about player, group scenes 1/day, side/brush/listen, retell risk, price waves, save slice, archive');
