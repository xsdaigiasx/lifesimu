const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../.test-build/domain/talk/compose'),K=require('../.test-build/domain/talk/check'),A=require('../.test-build/domain/talk/axes'),N=require('../.test-build/domain/npc');
const R=N.buildRoster('talk-test'),by=id=>R.find(n=>n.id===id);
const F=(o)=>({id:'f',topic:'player',sub:'food',about:'player',day:9,tone:'plain',private:0,knownBy:'all',vars:{dish:'cơm tấm'},...o});
const ctx=o=>({npc:by('landlord'),tier:'acquaint',mood:'neutral',channel:'face',minute:600,day:10,seed:'s',facts:[F()],...o});

test('kho mặc định qua bộ kiểm tra, mỗi ý định có ít nhất 3 khung',()=>{
 assert.deepEqual(K.talkProblems(C.TALK,{minFramesPerIntent:3}),[]);
});

test('bộ kiểm tra chặn mảnh lỗi',()=>{
 const base=JSON.parse(JSON.stringify(C.TALK)),bad=(patch,re)=>{const d=JSON.parse(JSON.stringify(base));patch(d);const out=K.talkProblems(d,{minFramesPerIntent:3});assert.ok(out.some(x=>re.test(x)),`${re}: ${out.join(' | ')}`)};
 bad(d=>d.pieces.push({...d.pieces[0]}),/trùng id/);
 bad(d=>d.pieces.push({id:'x1',slot:'body',text:'ăn {món} chưa',intent:['ask']}),/biến lạ/);
 bad(d=>d.pieces.push({id:'x2',slot:'body',text:'ăn {dish} chưa',intent:['ask']}),/không khai trong needs/);
 bad(d=>d.pieces.push({id:'x3',slot:'body',text:'chào • bạn',intent:['ask']}),/dấu •/);
 bad(d=>d.pieces.push({id:'x4',slot:'mid',text:'a',intent:['ask']}),/ô lạ/);
 bad(d=>d.pieces.push({id:'x5',slot:'body',text:'a',npc:'ba-tu'}),/mã NPC lạ/);
 bad(d=>d.pieces.push({id:'x6',slot:'feel',text:'b',intent:['invite'],channel:['text']}),/không khung nào dùng được/);
 bad(d=>d.frames.push({id:'z',intent:'ask',slots:['body','body']}),/cùng chức năng/);
 bad(d=>{d.frames=d.frames.filter(f=>f.id!=='tease-3')},/tease: có 2 khung/);
 bad(d=>d.pieces.push({id:'x7',slot:'body',text:'{x',intent:['ask']}),/ngoặc nhọn hở/);
 bad(d=>d.pieces.push({id:'x8',slot:'ask',text:'đi không',intent:['invite'],cold:true}),/lạnh nhạt/);
});

test('ghép câu từ dữ liệu mẫu: điền biến, xưng hô, tất định theo seed',()=>{
 const a=C.compose(ctx({intents:['ask']})),b=C.compose(ctx({intents:['ask']}));assert.deepEqual(a,b);
 assert.equal(a.intent,'ask');assert.ok(Array.from({length:30},(_,i)=>C.compose(ctx({intents:['ask'],seed:'d'+i})).text).some(x=>x.includes('cơm tấm')),'điền biến món');assert.ok(!/[{}]/.test(a.text),a.text);assert.match(a.text,/^[A-ZĐÀ-Ỹ]/u);assert.match(a.text,/[.?!]$/);
 assert.ok(a.prints.includes('f:'+a.frame)&&a.prints.includes('t:ask:food')&&a.pieces.every(p=>a.prints.includes('p:'+p)));
 const texts=new Set();for(let i=0;i<30;i++)texts.add(C.compose(ctx({intents:['ask'],seed:'s'+i})).text);assert.ok(texts.size>=5,'đủ đa dạng: '+texts.size);
});

test('điều kiện khống chế: riêng tư, độ thân, giọng, cảm xúc, mảnh riêng',()=>{
 const priv=F({id:'p',sub:'sick',private:2,vars:{}});
 assert.equal(C.compose(ctx({facts:[priv],intents:['ask']})).intent,null,'Quen biết không hỏi chuyện riêng mức 2');
 assert.equal(C.compose(ctx({facts:[priv],intents:['ask'],tier:'close'})).intent,'ask');
 assert.equal(A.intentAllowed('tease','acquaint','happy'),false);assert.equal(A.intentAllowed('tease','close','annoyed'),false);assert.equal(A.intentAllowed('invite','hostile','happy'),false);assert.equal(A.intentAllowed('brag','close','sad'),false);
 const data={frames:[{id:'k',intent:'ask',slots:['body']}],pieces:[{id:'tay',slot:'body',text:'tay',intent:['ask'],voice:'tay'},{id:'bac',slot:'body',text:'bac',intent:['ask'],voice:'bac'},{id:'me',slot:'body',text:'mẹ',intent:['ask'],npc:'me'},{id:'hot',slot:'body',text:'vui',intent:['ask'],emotion:['happy']}]};
 for(const n of R)for(let i=0;i<6;i++){const s=C.compose({...ctx({npc:n,data,seed:'v'+i,intents:['ask']})});if(!s.pieces.length)continue;const p=data.pieces.find(x=>x.id===s.pieces[0]);
  assert.ok(!p.voice||p.voice===n.voiceKey,n.id);assert.ok(!p.npc||p.npc===n.id);assert.notEqual(p.id,'hot','tâm trạng bình thường không dùng mảnh vui')}
 const hostile=C.compose(ctx({tier:'hostile'}));assert.ok(hostile.pieces.every(id=>C.TALK.pieces.find(p=>p.id===id).cold),hostile.text);
 assert.ok(!C.compose(ctx({npc:by('courier')})).text.includes('già rồi'));
});

test('dữ kiện: chỉ nhắc điều NPC được biết; chuyện bản thân chỉ của chính NPC',()=>{
 const hidden=F({knownBy:['veg']});assert.equal(C.compose(ctx({facts:[hidden],intents:['ask']})).intent,null);
 assert.equal(C.compose(ctx({facts:[F({knownBy:'present'})],intents:['ask']})).intent,null);assert.equal(C.compose(ctx({facts:[F({knownBy:'present'})],present:['landlord'],intents:['ask']})).intent,'ask');
 const sick={id:'s',topic:'self',sub:'sick',about:'veg',day:9,tone:'bad',private:0,knownBy:'all',vars:{}};
 assert.equal(A.factFits(sick,'complain','acquaint','landlord'),false);assert.equal(A.factFits(sick,'complain','acquaint','veg'),true);
});

test('bối cảnh: khuya chỉ nhắn tin từ Thân, người lớn tuổi không nhắn khuya; gọi điện từ Thân',()=>{
 const young=by('courier');
 assert.equal(C.compose(ctx({npc:young,minute:1350,channel:'face'})),null);assert.equal(C.compose(ctx({npc:young,minute:1350,channel:'text'})),null);
 assert.ok(C.compose(ctx({npc:young,minute:1350,channel:'text',tier:'close'})));assert.equal(C.compose(ctx({npc:by('neighbor'),minute:1350,channel:'text',tier:'bestie'})),null);
 assert.equal(C.compose(ctx({channel:'call'})),null);assert.ok(C.compose(ctx({npc:by('me'),channel:'call',tier:'stranger'})));
});

test('chống lặp: mảnh 14 ngày, khung 3 ngày, cùng ý định và chủ đề 2 ngày; vân tay tối đa 40 mã',()=>{
 const a=C.compose(ctx({intents:['ask']}));let recent=C.notePrints([],a.prints,10);
 const b=C.compose(ctx({intents:['ask'],recent}));assert.notEqual(b.intent,'ask','cùng ý định và chủ đề trong 2 ngày');
 const c=C.compose(ctx({intents:['ask'],recent,day:12}));assert.equal(c.intent,'ask');assert.ok(c.pieces.every(p=>!a.pieces.includes(p))||c.frame!==a.frame,'không lặp mảnh, khung');
 for(const id of a.pieces)assert.ok(!c.pieces.includes(id),'mảnh chưa đủ 14 ngày: '+id);
 const many=C.notePrints([],Array.from({length:60},(_,i)=>'p:x'+i),5);assert.equal(many.length,40);assert.equal(C.notePrints(many,['f:z'],20).length,1,'quá 14 ngày thì xoá');
});

test('nối mảnh: dấu phẩy, viết hoa sau dấu câu, thêm dấu chấm',()=>{
 assert.equal(C.joinParts(['chào em','ăn chưa']),'Chào em, ăn chưa?');assert.equal(C.joinParts(['có cần em chở đồ không','đi nha anh']),'Có cần em chở đồ không? Đi nha anh.');assert.equal(C.joinParts(['Ủa?','đi đâu']),'Ủa? Đi đâu.');assert.equal(C.joinParts(['','đi nha!']),'Đi nha!');
});
