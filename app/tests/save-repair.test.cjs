const test=require('node:test'),assert=require('node:assert/strict');
const {engine,loadSave,OPTIONAL_SLICES}=require('../.test-build/domain/engine');
const {officeAction,initialOffice,validOffice,PROBATION_DAYS}=require('../.test-build/domain/office.js');
const {repairNotice}=require('../.test-build/domain/autosave');
const good=r=>{assert.ok(r.ok,r.error);return r.state};
const hired=(day=5)=>{const application={companyId:'sen-code',status:'passed',submittedDay:day-2,interviewDay:day-1,startDay:day,answers:[0,1,2],questions:['machines','race','months'],cv:'a'.repeat(30)};return good(officeAction({...engine.initial(),day,office:{...initialOffice(),application}},{kind:'acceptOffer'}))};
const base=()=>({...hired(5),day:20,money:3_000_000});

test('thử việc dài hơn số hiện tại (save cũ 60 ngày) vẫn hợp lệ',()=>{const s=hired(5);const pr={start:5,end:65,workDays:40};assert.ok(validOffice({...s.office,probation:pr}));assert.ok(engine.valid({...s,day:30,office:{...s.office,probation:pr}}));assert.equal(validOffice({...s.office,probation:{start:5,end:5,workDays:0}}),false);assert.equal(validOffice({...s.office,probation:{start:5,end:5+PROBATION_DAYS,workDays:PROBATION_DAYS+1}}),false)});
test('save nguyên vẹn: không bỏ gì',()=>{const s=base();const r=loadSave(JSON.stringify(s));assert.deepEqual(r.dropped,[]);assert.equal(r.state.money,3_000_000);assert.deepEqual(engine.parse(JSON.stringify(s)),s)});
test('engine.parse vẫn chặt, chỉ loadSave bỏ lát cắt',()=>{const s={...base(),bank:{hỏng:1}};assert.equal(engine.parse(JSON.stringify(s)),null);assert.ok(engine.parse(JSON.stringify({...base(),morning:{hỏng:1}})))});
test('một lát cắt hỏng: bỏ riêng nó, giữ phần còn lại',()=>{for(const k of ['morning','bank','summary','orders']){const s={...base(),[k]:{hỏng:true}};const r=loadSave(JSON.stringify(s));assert.ok(r,k);assert.deepEqual(r.dropped,[k]);assert.equal(r.state.money,3_000_000);assert.equal(r.state.office.role,'employee');assert.ok(engine.valid(r.state))}});
test('validator ném lỗi không làm mất cả save',()=>{const s={...base(),bank:'hỏng'};const r=loadSave(JSON.stringify(s));assert.ok(r);assert.equal(r.state.day,20)});
test('hai lát cắt hỏng: bỏ cả hai',()=>{const s={...base(),morning:{hỏng:1},orders:{hỏng:1}};const r=loadSave(JSON.stringify(s));assert.deepEqual([...r.dropped].sort(),['morning','orders'])});
test('ba lát cắt hỏng hoặc phần lõi hỏng: không đọc được',()=>{assert.equal(loadSave(JSON.stringify({...base(),morning:1,orders:1,summary:1})),null);assert.equal(loadSave(JSON.stringify({...base(),money:-5})),null);assert.equal(loadSave('{hỏng'),null);assert.equal(loadSave(null),null)});
test('sổ cái lỗi được dọn, không bỏ lát cắt',()=>{const s=base();s.ledger=[...s.ledger,{name:'x',amount:1,day:999},...Array.from({length:120},(_,i)=>({name:'a'+i,amount:1,day:1}))];const r=loadSave(JSON.stringify(s));assert.deepEqual(r.dropped,[]);assert.equal(r.state.ledger.length,100);assert.ok(r.state.ledger.every(x=>x.day<=20))});
test('danh sách lát cắt khớp kiểu GameState',()=>{assert.ok(!OPTIONAL_SLICES.includes('money'));assert.equal(new Set(OPTIONAL_SLICES).size,OPTIONAL_SLICES.length)});
test('câu báo',()=>{assert.match(repairNotice({recovered:null,dropped:['bank'],lost:false}),/ngân hàng/);assert.match(repairNotice({recovered:6,dropped:[],lost:false}),/ngày 7/);assert.match(repairNotice({recovered:null,dropped:[],lost:true}),/Cài đặt/);assert.equal(repairNotice({recovered:null,dropped:[],lost:false}),'')});
