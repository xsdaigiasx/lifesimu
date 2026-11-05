const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../.test-build/domain/gifts'),L=require('../.test-build/domain/life'),I=require('../.test-build/domain/inbox'),D=require('../.test-build/domain/director');
const C=require('../.test-build/domain/talk/compose'),K=require('../.test-build/domain/talk/check'),Rp=require('../.test-build/domain/talk/replies'),N=require('../.test-build/domain/npc');
const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');
const at=(day,location='home',minute=600)=>{const s=engine.initial();return{...s,day,clock:{...clockOf(s),minute,location}}};
const stock=(s,id)=>L.stock(s,id);

test('Mẹ gửi xe khách: tin nhắn tới thì có kiện ở bến từ hôm sau, chỉ nhận được ở trạm xe buýt',()=>{
 let s=at(10);s={...s,inbox:{...I.inboxOf(s),queue:[{id:'q10:me:g',npc:'me',day:10,minute:500,from:'npc',text:'x',kind:'mom-gift'}]}};
 s=I.deliverDue(s).state;assert.equal(G.parcelsOf(s).length,1);assert.equal(G.readyParcels(s).length,0,'hôm nay chưa tới bến');assert.ok(engine.valid(s));
 assert.equal(I.deliverDue(s).state,s,'không gửi trùng');
 s={...s,day:11};assert.equal(G.readyParcels(s).length,1);assert.equal(L.lifeAction(s,{kind:'parcel'}).ok,false,'ở nhà không nhận được');
 const r=L.lifeAction({...s,clock:{...clockOf(s),location:'bus'}},{kind:'parcel'});assert.ok(r.ok,r.error);
 assert.equal(stock(r.state,'rice'),3);assert.equal(stock(r.state,'egg'),6);assert.equal(G.parcelsOf(r.state).length,0);assert.ok(r.state.journal.some(j=>j.key.startsWith('parcel:')));
});

test('quá 3 ngày không ra bến: người quen mang giùm, hư mất một nửa',()=>{
 let s=G.sendParcel(at(10),'me',[['rice',3],['egg',6]],'p1');const p=G.parcelsOf(s)[0];assert.deepEqual([p.day,p.until],[11,13]);
 s=G.settleParcels({...s,day:13});assert.equal(G.parcelsOf(s).length,1,'ngày 13 còn giữ');
 s=G.settleParcels({...s,day:14});assert.equal(G.parcelsOf(s).length,0);assert.equal(stock(s,'rice'),1);assert.equal(stock(s,'egg'),3);assert.ok(engine.valid(s));
});

test('tin Mẹ qua sự kiện cũng gửi kiện thật, không còn tự vào Tủ bếp',()=>{
 const s=at(10,'home',1100);const st={...D.storyOf(s),pending:{key:'10:1',npc:'me',motif:'mom',variant:1,by:'npc',day:10}};const r=D.answerEvent({...s,story:st},1);assert.ok(r.ok,r.error);
 assert.equal(stock(r.state,'rice'),0);assert.equal(G.parcelsOf(r.state).length,1);
});

test('câu hứa cho đồ phải gắn món thật; Nhận thì cho thật',()=>{
 const data={frames:[{id:'k',intent:'ask',slots:['body','tail']}],pieces:[{id:'b',slot:'body',text:'rau mới về',intent:['ask']},{id:'t',slot:'tail',text:'lấy thêm bó rau nha, {self} cho',intent:['ask'],gift:['vegetable',1]}]};
 assert.deepEqual(K.talkProblems(data),[]);
 assert.ok(K.talkProblems({...data,pieces:[data.pieces[0],{...data.pieces[1],gift:undefined}]}).some(x=>/câu hứa/.test(x)));
 assert.ok(K.talkProblems({...data,pieces:[data.pieces[0],{...data.pieces[1],gift:['vang',1]}]}).some(x=>/danh mục/.test(x)));
 const npc=N.castById({},'veg'),f={id:'f',topic:'player',sub:'food',about:'player',day:9,tone:'plain',private:0,knownBy:'all',vars:{}};
 const said=C.compose({npc,tier:'acquaint',mood:'neutral',channel:'face',minute:600,day:10,seed:'g',facts:[f],intents:['ask'],data});assert.deepEqual(said.gift,['vegetable',1]);
 const ctx={npc,intent:'ask',tier:'acquaint',day:10,seed:'g',player:{energy:80,stress:10,mood:70,money:1e6,minute:600,end:1320,skills:{}},log:[],gift:said.gift};
 const opts=Rp.buildReplies(ctx);assert.equal(opts[0].action,'accept');assert.equal(opts[1].action,'refuse');assert.ok(opts.length>=3);
 assert.deepEqual(Rp.resolveReply(ctx,opts[0]).gift,['vegetable',1]);assert.equal(Rp.resolveReply(ctx,opts[1]).gift,undefined);
 const n=G.receiveGift(at(10),'vegetable',1);assert.equal(stock(n,'vegetable'),1);
 assert.ok(G.isGiftItem('fish'),'nguyên liệu mới thêm vào INGREDIENTS là tặng được');
});
