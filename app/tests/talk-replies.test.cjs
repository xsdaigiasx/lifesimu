const test=require('node:test'),assert=require('node:assert/strict');
const Rp=require('../.test-build/domain/talk/replies'),C=require('../.test-build/domain/talk/compose'),N=require('../.test-build/domain/npc'),St=require('../.test-build/domain/talk/state');
const {engine}=require('../.test-build/domain/engine');const {INTENTS}=require('../.test-build/domain/talk/types');
const R=N.buildRoster('replies'),by=id=>R.find(n=>n.id===id);
const P=(o={})=>({energy:80,stress:20,mood:70,money:1e6,minute:600,end:1320,skills:{communication:3},...o});
const ctx=(o={})=>({npc:by('landlord'),intent:'complain',tier:'close',day:20,seed:'s',player:P(),log:[],...o});
const MATCH={complain:['help','advise','ask','share','silent'],request:['help','refuse','ask'],invite:['accept','refuse','ask'],ask:['share','ask','silent'],brag:['ask','advise','share','accept','silent'],news:['ask','share','silent'],tease:['share','silent'],apologize:['accept','silent','refuse']};

test('mỗi lượt 3 đến 4 lựa chọn, hành động hợp ý định, có cả tích cực và không tích cực, chữ đã điền',()=>{
 for(const intent of INTENTS)for(const tier of ['stranger','acquaint','close','bestie','hostile'])for(const n of R)for(let i=0;i<3;i++){const o=Rp.buildReplies(ctx({npc:n,intent,tier,seed:`${n.id}${i}`}));
  assert.ok(o.length>=3&&o.length<=4,`${intent} ${tier}: ${o.length}`);assert.equal(new Set(o.map(x=>x.id)).size,o.length);
  for(const x of o){assert.ok(MATCH[intent].includes(x.action),`${intent} ${x.action}`);assert.ok(!/[{}]/.test(x.label),x.label)}
  if(tier!=='hostile')assert.ok(o.some(x=>['cold','rude','dodge','blunt'].includes(x.attitude)),'có lựa chọn không chiều lòng')}
});

test('khoe: "khao" và "để dành" chỉ hợp tin vui lớn, tiền; người bán khoe hàng có bộ riêng',()=>{
 const labels=(n,sub,k)=>{const set=new Set();for(let i=0;i<40;i++)for(const o of Rp.buildReplies(ctx({npc:n,intent:'brag',tier:'close',seed:`${n.id}${k}${i}`,...(sub?{sub}:{})})))set.add(o.label);return[...set].join('|')};
 const me=by('landlord'),veg=by('veg');
 for(const sub of [undefined,'family','study','buy','hobby'])assert.ok(!/khao|để dành/.test(labels(me,sub,'a')),'không hợp: '+sub);
 assert.ok(/khao/.test(labels(me,'promotion','b')),'thăng chức thì có khao');assert.ok(/để dành/.test(labels(me,'salary','c')),'lương thì có để dành');
 assert.ok(/Lấy cho/.test(labels(veg,undefined,'d'))&&/Nhìn ngon/.test(labels(veg,undefined,'e')),'người bán khoe hàng');
 assert.ok(!/Lấy cho|Nhìn ngon/.test(labels(me,undefined,'f')),'người thường không có câu mua hàng');
 assert.ok(!/khao|để dành/.test(labels(veg,undefined,'g')),'người bán khoe hàng không bị chúc khao');
 for(const sub of ['buy','family','money'])assert.ok(!/Lấy cho|Nhìn ngon/.test(labels(veg,sub,'h'+sub)),'người bán khoe chuyện riêng (tivi, con, tiền) không có câu mua hàng: '+sub);
});

test('không lặp nguyên bộ lựa chọn với cùng NPC trong 7 ngày',()=>{
 for(let i=0;i<20;i++){const c=ctx({seed:'r'+i,intent:'ask'}),a=Rp.buildReplies(c),recent=[{k:Rp.setPrint('landlord',a),d:20}];
  const b=Rp.buildReplies({...c,recent});assert.notEqual(Rp.setPrint('landlord',b),Rp.setPrint('landlord',a));
  const later=Rp.buildReplies({...c,recent,day:27});assert.equal(Rp.setPrint('landlord',later),Rp.setPrint('landlord',a),'qua 7 ngày thì được')}
});

test('hiện mờ khi thiếu kỹ năng, năng lượng hoặc giờ; mệt thì Giúp tốn thêm sức và có thể nổi cáu; vui mới có Đùa',()=>{
 const all=(o)=>Array.from({length:30},(_,i)=>Rp.buildReplies(ctx({seed:'k'+i,...o}))).flat();
 const adv=all({player:P({skills:{communication:1}})}).filter(x=>x.action==='advise');assert.ok(adv.length&&adv.every(x=>x.locked&&x.need==='Giao tiếp Lv2'));
 assert.ok(all({player:P({energy:3})}).filter(x=>x.action==='help').every(x=>x.locked));assert.ok(all({player:P({minute:1315})}).filter(x=>x.action==='help').every(x=>x.locked));
 const tired=all({player:P({energy:20})});assert.ok(tired.filter(x=>x.action==='help').every(x=>x.energy===10));
 assert.ok(!all({player:P({mood:30}),intent:'invite'}).some(x=>x.attitude==='joke'));assert.ok(all({intent:'request',player:P({stress:90})}).some(x=>x.attitude==='rude'));
 assert.ok(!all({intent:'request'}).some(x=>x.attitude==='rude'),'không mệt không căng thì không có Khó chịu');
});

test('không có câu đúng cho mọi người: cùng một thái độ, người này thích người kia không',()=>{
 const opt=(a,x)=>({id:'x',attitude:a,action:x,label:'',minutes:5,energy:0,money:0,locked:false});
 for(const [a,x] of [['warm','help'],['blunt','advise'],['joke','ask']]){const vals=[];for(let w=0;w<20;w++)for(const n of N.buildRoster('fit'+w))vals.push(Rp.resolveReply(ctx({npc:n}),opt(a,x)).relation);
  assert.ok(Math.max(...vals)-Math.min(...vals)>=3,`${a}: ${Math.min(...vals)}..${Math.max(...vals)}`)}
 const proud={...by('landlord'),traits:['tự trọng','kiệm lời','cẩn thận']},soft={...by('landlord'),traits:['dễ xúc động','tốt bụng','hay nói']};
 assert.ok(Rp.resolveReply(ctx({npc:soft}),opt('warm','help')).relation>Rp.resolveReply(ctx({npc:proud}),opt('warm','help')).relation,'người tự trọng không thích bị thương hại');
 const hot={...by('landlord'),traits:['cau có','cẩn thận','tự trọng']};assert.ok(Rp.resolveReply(ctx({npc:hot}),opt('blunt','advise')).relation>Rp.resolveReply(ctx({npc:soft}),opt('blunt','advise')).relation,'người cau có quý thẳng thắn');
});

test('lặp cùng thái độ trong 7 ngày giảm hiệu quả; giúp mãi thì quen dựa dẫm; ký ức theo trọng số; việc nhẹ',()=>{
 const n={...by('landlord'),traits:['dễ xúc động','tốt bụng','hay nói']},o={id:'x',attitude:'warm',action:'help',label:'',minutes:15,energy:5,money:0,locked:false};
 const log=k=>Array.from({length:k},(_,i)=>({d:19-i,n:'landlord',a:'warm',x:'help'}));
 const r0=Rp.resolveReply(ctx({npc:n}),o).relation,r1=Rp.resolveReply(ctx({npc:n,log:log(1)}),o).relation,r2=Rp.resolveReply(ctx({npc:n,log:log(2)}),o).relation;
 assert.ok(r0>r1&&r1>r2&&r2>0,`${r0} ${r1} ${r2}`);assert.equal(Rp.resolveReply(ctx({npc:n,log:log(2).map(l=>({...l,d:1}))}),o).relation,r0,'quá 7 ngày thì như mới');
 assert.ok(Rp.resolveReply(ctx({npc:n,log:log(2)}),o).reliant);assert.ok(!Rp.resolveReply(ctx({npc:n}),o).reliant);
 assert.deepEqual(Rp.resolveReply(ctx({npc:n}),o).memory,{topic:'được giúp',tag:'help',weight:3});assert.equal(Rp.resolveReply(ctx({npc:n}),o).light,false);
 assert.equal(Rp.resolveReply(ctx({npc:n}),{...o,action:'ask'}).light,true,'Hỏi thêm là việc nhẹ');
 assert.equal(Rp.resolveReply(ctx({npc:n,intent:'complain',tier:'close'}),{...o,attitude:'dodge',action:'silent'}).memory.tag,'dodge');assert.equal(Rp.resolveReply(ctx({npc:n,tier:'acquaint'}),{...o,attitude:'dodge',action:'silent'}).memory,undefined);
 assert.ok(Rp.resolveReply(ctx({npc:n}),{...o,attitude:'rude',action:'refuse'}).relation<0);
});

test('thói quen người chơi và lát cắt save',()=>{
 const l=Array.from({length:8},(_,i)=>({d:10+i,n:'veg',a:i<5?'rude':'warm',x:'silent'}));assert.equal(Rp.habitOf(l,20),'rude');assert.equal(Rp.habitOf(l.slice(0,5),20),null);
 assert.equal(Rp.habitOf(l,60),null,'quá 30 ngày thì thôi');
 let s={...engine.initial(),day:20};s=St.noteReplyFor(s,{d:20,n:'veg',a:'warm',x:'help'});s=St.notePrintsFor(s,'veg',['p:x','f:y']);assert.ok(engine.valid(s));
 assert.equal(engine.valid({...s,talk:{...s.talk,log:[{d:20,n:'veg',a:'evil',x:'help'}]}}),false);assert.equal(engine.valid({...s,talk:{...s.talk,prints:{'ba-tu':[]}}}),false);
 assert.equal(Rp.playerAddress(N.castById({},'doctor')).call,'bác sĩ');
});
// 06/11: câu than không phải chuyện đau ốm thì không có lựa chọn "đi khám", "nghỉ đi", "bị lâu chưa"
{const n=R.find(x=>x.id==='neighbor')??R[0],all=sub=>{const set=new Set();for(let i=0;i<60;i++)for(const o of Rp.buildReplies(ctx({npc:n,intent:'complain',tier:'close',seed:'c'+i,...(sub?{sub}:{})})))set.add(o.label);return[...set].join('|')};
 const plain=all(),sick=all('sick');assert(!/khám|nghỉ đi|bị lâu chưa/.test(plain),plain);assert(/khám|nghỉ đi|bị lâu chưa/.test(sick),sick);assert(/rồi sao nữa|cực ghê/.test(plain),plain)}

// 06/11: nhận dạng câu NPC để chọn bộ câu trả lời hợp (chủ dự án: câu trả lời lạc quẻ)
{const F=(i,t)=>Rp.lineForm(i,t);
 assert.equal(F('ask','Cháu nè, dạo này cháu có tự nấu cơm không?'),'yesno');assert.equal(F('ask','Mặt em quen quen, tuần trước gặp ngoài công viên phải không?'),'recog');
 assert.equal(F('ask','Cháu ơi, cháu nhớ chú không, bữa gặp ngoài công viên đó.'),'recog');assert.equal(F('ask','Như cũ hả em, em ăn tại chỗ hay mang về, ăn cho ngon nha em.'),'choice');
 assert.equal(F('ask','Dạo này cháu khỏe không?'),'well');assert.equal(F('ask','Trời râm mát vầy con đi làm nhớ mặc ấm.'),'tip');
 assert.equal(F('news','Mai trời mưa đó.'),'weather');assert.equal(F('news','Nghe nói tuần sau thịt heo lên giá.'),'price');assert.equal(F('news','Đầu đường mới mở xe cà phê, ngon mà rẻ.'),'gossip');
 const labels=(intent,form)=>{const set=new Set();for(let i=0;i<40;i++)for(const o of Rp.buildReplies(ctx({intent,tier:'close',seed:'f'+i,form})))set.add(o.label);return[...set].join('|')};
 assert(!/hỏi thăm|hơi mệt/.test(labels('ask','yesno')));assert(/nhầm người|nhớ/.test(labels('ask','recog')));assert(!/rồi sao nữa/.test(labels('news','weather')));assert(/mua trước/.test(labels('news','price')))}
