const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const SU=require('../.test-build/domain/summary');
const C=require('../.test-build/domain/company');
const {dateAt}=require('../.test-build/domain/format');
const emp=id=>({id,name:id,gender:'male',age:28,origin:'x',hiredDay:0,wage:14_000_000,skills:{programming:6,logic:5,graphics:4,management:1,communication:1},years:4,trust:70,risk:10,potential:50,personality:'Ngại',motive:'Học hỏi'});
const jr=(key,day,title)=>({id:`${day}:420:${key}`,key,day,minute:420,title,detail:'d'});
const st=(day,extra={})=>({...engine.initial(),day,...extra});

// 1. Mốc năm: chỉ khi qua đủ 365 ngày, mỗi năm một bản, chưa xem
let s=SU.settleSummary(st(364));assert.equal(s.summary,undefined,'chưa đủ năm thì không tạo gì');
s=SU.settleSummary(st(365,{money:7_000_000}));
assert.equal(s.summary.list.length,1);assert.equal(s.summary.list[0].id,'y1');assert.equal(s.summary.unseen,'y1');assert.equal(s.summary.list[0].money,7_000_000);
assert.equal(SU.settleSummary({...s,day:366}).summary,s.summary,'không lặp trong cùng năm');
assert.equal(SU.settleSummary(SU.markSeen({...s,day:730})).summary.list.map(x=>x.id).join(),'y1,y2');
assert.equal(SU.titleOf(s.summary.list[0]),'Năm thứ 1 đã qua');
assert(engine.valid(s)&&engine.parse(JSON.stringify(s)),'save có tổng kết hợp lệ');
// chỉ giữ 5 bản gần nhất
let q=st(365);for(let y=1;y<=7;y++){q=SU.markSeen(SU.settleSummary({...q,day:365*y}))}
assert.equal(q.summary.list.length,5);assert.equal(q.summary.list[0].id,'y3');assert.equal(q.summary.list[4].id,'y7');assert.equal(q.summary.unseen,undefined);assert(engine.valid(q));

// 2. Chỉ dùng dữ kiện thật: người đồng hành, ký ức, mốc từ Nhật ký
const base=st(400,{social:{relations:{'landlord':{score:45,lastDay:399,minutes:0},reception:{score:12,lastDay:390,minutes:0},leasing:{score:3,lastDay:1,minutes:0},nobody:{score:99,lastDay:1,minutes:0}},chatMinutesDay:0,chatDay:400},
 story:{version:1,seq:0,log:[],hooks:[],loans:[],memories:[{id:'m1',day:380,npc:'landlord',motif:'loan',topic:'chưa trả tiền mượn',tag:'unpaid',weight:3},{id:'m2',day:390,npc:'landlord',motif:'meal',topic:'lỡ hẹn đi ăn',tag:'missed',weight:2}]},
 journal:[jr('tier:x',300,'Lên Middle'),jr('move:5:tro',10,'Chuyển tới phòng trọ'),jr('move:9:villa',200,'Chuyển tới biệt thự'),jr('chat:1:2:3',20,'Trò chuyện'),jr('project:p1',250,'Dự án đầu')]});
const p=SU.peopleOf(base);
assert.deepEqual(p.map(x=>x.id),['landlord','reception'],'bỏ người dưới 10 điểm và người không có trong dàn nhân vật');
assert.equal(p[0].memory,'chưa trả tiền mượn','lấy ký ức nặng nhất');assert.equal(p[1].memory,undefined,'không có ký ức thì để trống, không bịa');
const marks=SU.marksOf(base.journal);
assert.deepEqual(marks.map(x=>x.title),['Chuyển tới phòng trọ','Dự án đầu','Lên Middle'],'mỗi loại lấy lần đầu, theo thời gian, bỏ chat');
assert.equal(SU.marksOf([]).length,0);
assert.equal(SU.makeSummary(st(10),'year','y1').company,undefined,'không có công ty thì không có thẻ công ty');

// 3. Theo dõi lãi ròng, vốn chủ góp không tính; mục tiêu cần cả ba điều kiện
const fm=n=>{let d=0;while(dateAt(d).toISOString().slice(0,7)!==n||dateAt(d).getUTCDate()!==1)d++;return d};
const comp=(fund,rep,n)=>({version:1,founded:0,fund,rep,staff:Array.from({length:n},(_,i)=>emp('e'+i))});
const owner={...require('../.test-build/domain/office').initialOffice(),role:'owner',size:'small',name:'Sen',leaseUntil:9999};
const d1=fm('2027-01'),d2=fm('2027-02'),d3=fm('2027-03'),d4=fm('2027-04');
let g=st(d1-1,{company:comp(50_000_000,70,2),office:owner});
g=SU.settleSummary({...g,day:d1});assert.equal(g.summary.snap.month,'2027-01');assert.equal(g.summary.streak,0);
g={...g,company:{...g.company,fund:g.company.fund+4_000_000}};g=SU.settleSummary({...g,day:d2});assert.equal(g.summary.streak,1,'lãi 4tr');
// góp vốn 10tr: quỹ tăng nhưng không phải lãi
g=SU.noteInvest({...g,company:{...g.company,fund:g.company.fund+10_000_000}},10_000_000);
g=SU.settleSummary({...g,day:d3});assert.equal(g.summary.streak,0,'chỉ có vốn góp, không có lãi: reset');
assert.equal(g.summary.goal,undefined);
let h=st(d1,{company:comp(50_000_000,70,2),office:owner,summary:{version:1,list:[],year:1,streak:2,snap:{month:'2027-01',fund:50_000_000,inj:0}}});
h={...h,company:{...h.company,fund:52_000_000}};h=SU.settleSummary({...h,day:d2});
assert.equal(h.summary.streak,3);assert.equal(h.summary.goal,d2);assert.equal(h.summary.list[0].kind,'goal');assert.equal(SU.titleOf(h.summary.list[0]),'Công ty đã đứng vững');assert.equal(h.summary.list[0].company.staff,2);
assert(engine.valid(h),'save mục tiêu hợp lệ');
assert.equal(SU.settleSummary({...h,day:d3,summary:{...h.summary,unseen:undefined}}).summary.list.length,1,'đạt đích chỉ một lần');
// thiếu uy tín hoặc nhân sự thì chưa đạt
for(const [rep,n] of [[59,2],[70,1]]){let x=st(d1,{company:comp(50_000_000,rep,n),office:owner,summary:{version:1,list:[],year:1,streak:2,snap:{month:'2027-01',fund:50_000_000,inj:0}}});x={...x,company:{...x.company,fund:52_000_000}};x=SU.settleSummary({...x,day:d2});assert.equal(x.summary.goal,undefined,`rep ${rep} staff ${n}`)}
// góp vốn qua investFund cập nhật inj
const inv=C.investFund({...st(d1+3,{company:comp(1_000_000,50,0),office:owner,money:20_000_000,summary:{version:1,list:[],year:1,streak:0,snap:{month:'2027-01',fund:1_000_000,inj:0}}}),clock:{minute:600,location:'office',lastWorkDay:-1,lastStudyDay:-1,lastRestDay:-1}},5_000_000);
assert(inv.ok,inv.error);assert.equal(inv.state.summary.snap.inj,5_000_000);

// 4. Validator từ chối dữ liệu sai
const good=SU.makeSummary(st(400),'year','y1');
const bad=[{...good,id:''},{...good,kind:'x'},{...good,skill:{id:'zzz',level:1}},{...good,skill:{id:'logic',level:11}},{...good,day:401},{...good,people:[{id:'a',score:-1}]},{...good,marks:Array(6).fill({day:1,title:'t'})},{...good,job:{role:'boss'}},{...good,company:{name:'a',fund:-1,rep:50,staff:0,done:0}}];
for(const [i,m] of bad.entries())assert(!SU.validSummary(m,400),'bản hỏng '+i);
assert(SU.validSummary(good,400));
const vs=x=>SU.validSummaryState(x,400);
assert(vs({version:1,list:[good],year:1,streak:0})&&!vs({version:1,list:[good,good],year:1,streak:0})&&!vs({version:1,list:[good],year:1,streak:0,unseen:'zz'})&&!vs({version:1,list:[],year:1,streak:-1})&&!vs({version:1,list:Array.from({length:6},(_,i)=>({...good,id:'y'+i})),year:1,streak:0}));
assert(!engine.valid({...st(400),summary:{version:1,list:[],year:999,streak:0}}));
console.log('summary ok');
