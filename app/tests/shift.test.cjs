const test=require('node:test'),assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');const {initialOffice}=require('../.test-build/domain/office');
const {clockOf}=require('../.test-build/domain/time');const W=require('../.test-build/domain/work');
const S=require('../.test-build/domain/shift');const {promotionGaps}=require('../.test-build/domain/career');
const lv=l=>({level:l,xp:0});
function emp(day=0,minute=480,prog=2){const s=engine.initial();return{...s,day,energy:95,mood:90,fullness:90,stress:5,skills:{programming:lv(prog),logic:lv(2),graphics:lv(2),management:lv(1),communication:lv(1),cooking:lv(1)},office:{...initialOffice(),role:'employee',employerId:'sen-code',tier:'junior',tierSince:0},work:W.workOf({...s,day}),clock:{...clockOf(s),minute,location:'office'}}}
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state),'state hợp lệ');return r.state};
const noTurn=s=>({...s,work:{...s.work,turn:{day:s.day,id:'coffee',slot:'pm',at:900,state:'done'}}});
const start=(s,kind)=>{const c=W.taskBoard(s).find(c=>c.kind===kind);assert.ok(c,'có thẻ '+kind);return ok(W.workAction(s,{kind:'start',taskId:c.taskId,card:kind}))};
const run=(s,limit=40)=>{let g=0;while(s.work.active&&g++<limit){if(s.work.bug)s=ok(W.fixBug(s,W.bugOf(s).puzzle.answer,1000));s=W.workTick(s,10)}return s};
const helpDay=()=>{for(let d=0;d<60;d++){if(W.taskBoard(emp(d)).some(c=>c.kind==='help'))return d}throw new Error('không có ngày có thẻ Giúp')};

test('bảng việc: 3 thẻ Chắc ăn, Thử sức, Gấp, đôi khi thêm Giúp; cố định theo ngày',()=>{
 const b=W.taskBoard(emp());assert.deepEqual(b.slice(0,3).map(c=>c.kind),['safe','stretch','urgent']);
 assert.deepEqual(W.taskBoard(emp()),b,'cùng ngày cùng bảng');assert.equal(new Set(b.map(c=>c.taskId)).size,b.length,'không trùng việc');
 const urgent=b.find(c=>c.kind==='urgent');assert.ok(urgent.bonus>=150000&&urgent.bonus<=300000);
 let help=0;for(let d=0;d<100;d++)if(W.taskBoard(emp(d)).some(c=>c.kind==='help'))help++;assert.ok(help>15&&help<60,'thẻ Giúp thỉnh thoảng mới có: '+help);
 const info=W.cardInfo(emp(),b[0]);assert.ok(info.title&&info.hours.startsWith('khoảng')&&/lỗi/.test(info.risk));
});

test('nhận thẻ: lưu loại việc, thẻ đã nhận bỏ khỏi bảng, việc dở thì không chọn lại',()=>{
 const s=start(emp(),'safe');assert.equal(s.work.assignment.kind,'safe');assert.ok(!W.taskBoard(s).some(c=>c.kind==='safe'));
 assert.equal(W.workAction(s,{kind:'start',taskId:'api',card:'stretch'}).ok,false);
 assert.equal(W.workAction(emp(),{kind:'start',taskId:'logs',card:'safe'}).ok,false,'thẻ phải có trên bảng');
});

test('việc Gấp xong kịp ca: thưởng vào lương ngày 1 và +đánh giá',()=>{
 let s=noTurn(start(emp(),'urgent'));const bonus=s.work.assignment.bonus,before=W.pendingWages(s);s=run(s);
 assert.equal(s.work.assignment.outcome,'done');assert.equal(S.ratingOf(s),54);assert.ok(engine.valid(s));
 assert.equal(W.pendingWages(s)-before>=bonus,true);assert.equal(s.work.periods[0].bonus,bonus);
 const back=engine.parse(JSON.stringify(s));assert.ok(back);assert.equal(back.work.periods[0].bonus,bonus);
});

test('việc Gấp rời ca giữa chừng thì tính trễ, trừ đánh giá, không thưởng',()=>{
 let s=noTurn(start(emp(),'urgent'));s=W.workTick(s,10);s=ok(W.workAction(s,{kind:'leave'}));
 assert.equal(s.work.assignment.outcome,'late');assert.equal(S.ratingOf(s),47);assert.equal(s.work.periods[0].bonus,undefined);
});

test('thẻ Giúp: tăng quan hệ với đồng nghiệp đó, XP còn một nửa',()=>{
 const d=helpDay();let s=noTurn(start(emp(d),'help'));const npc=s.work.assignment.npcId;s=run(s);
 assert.ok((s.social.relations[npc]?.score??0)>=S.HELP_RELATION);assert.ok(engine.valid(s));
});

test('điểm rẽ: mỗi ngày làm có một lần, dừng đồng hồ tới khi trả lời',()=>{
 let s=start(emp(),'safe');const tw=s.work.turn;assert.ok(tw&&tw.state==='waiting');assert.ok(tw.at>=540&&tw.at<=990);
 if(tw.slot==='pm'){s={...s,work:{...s.work,turn:{...tw,slot:'am',at:540}}}}
 let g=0;while(s.work.turn.state!=='open'&&g++<60){if(s.work.bug)s=ok(W.fixBug(s,W.bugOf(s).puzzle.answer,1000));s=W.workTick(s,10)}
 assert.equal(s.work.turn.state,'open');const at=clockOf(s).minute;assert.equal(at,s.work.turn.at);
 assert.equal(W.workTick(s,10),s,'đồng hồ dừng');assert.equal(W.workAction(s,{kind:'leave'}).ok,false);
 const o=W.openTurn(s);assert.ok(o.options.length>=2);const pick=o.options.findIndex(x=>!x.locked);
 s=ok(W.workAction(s,{kind:'turn',choice:pick}));assert.equal(s.work.turn.state,'done');assert.ok(s.journal.some(j=>j.id===`turn:${s.day}`||JSON.stringify(j).includes(`turn:${s.day}`)));
 assert.equal(W.workAction(s,{kind:'turn',choice:0}).ok,false,'chỉ trả lời một lần');
 assert.ok(W.workTick(s,10)!==s,'chạy tiếp sau khi trả lời');
});

test('lựa chọn thiếu kỹ năng bị khoá; điểm rẽ không lặp ngày liền trước',()=>{
 const ev=S.TURNS.find(e=>e.options.some(o=>o.need));const i=ev.options.findIndex(o=>o.need);
 let s=start(emp(),'safe');s={...s,work:{...s.work,turn:{day:0,id:ev.id,slot:'am',at:clockOf(s).minute,state:'open'}}};assert.ok(engine.valid(s));
 assert.equal(W.openTurn(s).options[i].locked,true);assert.equal(W.workAction(s,{kind:'turn',choice:i}).ok,false);
 for(let d=1;d<40;d++){const a=S.pickTurn(d,'sen-code','hotfix');assert.notEqual(a.id,'hotfix')}
});

test('save: dữ liệu ca hợp lệ được nhận, dữ liệu sai bị từ chối',()=>{
 const s=start(emp(),'urgent');assert.ok(engine.valid(s));
 assert.equal(engine.valid({...s,work:{...s.work,rating:120}}),false);
 assert.equal(engine.valid({...s,work:{...s.work,turn:{...s.work.turn,id:'khong-co'}}}),false);
 assert.equal(engine.valid({...s,work:{...s.work,assignment:{...s.work.assignment,kind:'boss'}}}),false);
 assert.equal(engine.valid({...s,work:{...s.work,taken:{day:0,kinds:['safe','safe']}}}),false);
});

test('việc chưa bắt đầu bị bỏ khi hết ca để ca chiều chọn lại từ bảng',()=>{
 let s=noTurn(start(emp(0,480,4),'safe'));s=run(s,60);assert.equal(s.work.active,null);
 assert.ok(W.needsChoice(s)||s.work.task.elapsed>0||s.work.bug,'chưa có việc dở thì được chọn lại');
});

test('đánh giá cao rút ngắn thời gian lên Middle',()=>{
 assert.equal(S.middleDays(50),180);assert.equal(S.middleDays(70),140);assert.equal(S.middleDays(100),120);assert.equal(S.middleDays(undefined),180);
 const f={main:5,cert:2,communication:1,management:1,daysInTier:150,attendance:.95};
 assert.equal(promotionGaps('middle',f).length,1);assert.deepEqual(promotionGaps('middle',{...f,rating:70}),[]);
});
