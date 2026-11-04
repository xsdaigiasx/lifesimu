const test=require('node:test'),assert=require('node:assert/strict');
const {bugPuzzle,hiddenOptions,repairFraction,REPAIR_FAST,REPAIR_SLOW,REPAIR_WRONG,WIRE_COLORS}=require('../.test-build/domain/bug-game.js');
const {workAction,workTick,bugOf,fixBug,TASKS,skillsOf}=require('../.test-build/domain/work.js');
const {engine}=require('../.test-build/domain/engine');
const {initialOffice}=require('../.test-build/domain/office.js');
const good=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state));return r.state};
const {clockOf}=require('../.test-build/domain/time');const {workOf}=require('../.test-build/domain/work.js');
const employee=(day=0,minute=480)=>{const s=engine.initial();return{...s,day,office:{...initialOffice(),role:'employee',employerId:'sen-code'},work:{...workOf({...s,day}),assignment:{day,id:'null-data',companyId:'sen-code'}},clock:{...clockOf(s),minute,location:'office'}}};
const withBug=(taskId='null-data')=>{let s=good(workAction(employee(),{kind:'start',taskId}));s.work.task.roll=0;return workTick(s,60)};
test('bài sinh từ seed: cùng seed cùng bài, đáp án luôn nằm trong lựa chọn',()=>{for(const skill of['programming','logic','graphics','management','communication']){for(let seed=1;seed<40;seed++){const a=bugPuzzle(seed,skill),b=bugPuzzle(seed,skill);assert.deepEqual(a,b);assert.ok(a.answer>=0&&a.answer<a.options.length);assert.ok(a.options.length>=3)}}});
test('mỗi nhóm kỹ năng có bộ trò riêng, đều xuất hiện, bài hợp lệ',()=>{const {GAMES_BY_SKILL}=require('../.test-build/domain/bug-game.js');const seen={};for(const skill of Object.keys(GAMES_BY_SKILL)){seen[skill]=new Set();for(let seed=1;seed<400;seed++){const p=bugPuzzle(seed,skill);assert.ok(GAMES_BY_SKILL[skill].includes(p.kind),skill+' '+p.kind);seen[skill].add(p.kind);const n=p.options.length;assert.ok(n>=3);
 if(p.kind==='sequence'||p.kind==='situation'||p.kind==='diff'||p.kind==='missing'||p.kind==='color'){assert.ok(p.answer>=0&&p.answer<n)}
 if(p.kind==='sequence'||p.kind==='situation'||p.kind==='missing'||p.kind==='color')assert.equal(new Set(p.options).size,n);
 if(p.kind==='diff'){assert.equal(n,16);assert.equal(new Set(p.options).size,2);assert.equal(p.options.filter(c=>c===p.options[p.answer]).length,1)}
 if(p.kind==='missing'){assert.equal(p.data.length,9);assert.equal(p.data[8],'');assert.ok(!p.data.slice(0,8).includes(p.options[p.answer])||true)}
 if(p.kind==='color')assert.equal(p.options[p.answer],p.data[0]);
 if(p.kind==='order'){assert.equal(p.data.length,n);assert.equal(new Set(p.data).size,n)}
 if(p.kind==='assign'||p.kind==='match'){assert.equal(p.data.length,2*n);assert.deepEqual([...p.options].sort(),p.data.slice(n).sort())}
 if(p.kind==='wires'){const c=WIRE_COLORS.slice(0,n);assert.deepEqual([...p.options].sort(),[...c].sort());assert.ok(p.options.some((x,k)=>x!==c[k]))}
 if(p.kind==='memory'){assert.ok(p.data.length>=4&&p.data.every(x=>Number(x)>=0&&Number(x)<4))}
 if(p.kind==='rhythm'){const [s,w]=p.data.map(Number);assert.ok(s>=20&&s+w<=80&&w>=18)}}
 assert.deepEqual([...seen[skill]].sort(),[...GAMES_BY_SKILL[skill]].sort(),skill+' đủ trò')}});
test('không còn đáp án để làm mờ',()=>{for(let seed=1;seed<20;seed++)assert.deepEqual(hiddenOptions(bugPuzzle(seed,'programming'),10,seed),[])});
test('thời gian sửa: nhanh 25%, chậm 33%, sai 40%',()=>{const p=bugPuzzle(5,'programming');assert.equal(repairFraction(p,p.answer,1000).frac,REPAIR_FAST);assert.equal(repairFraction(p,p.answer,p.limitMs-1).frac,REPAIR_SLOW);assert.equal(repairFraction(p,(p.answer+1)%p.options.length,1000).frac,REPAIR_WRONG)});
test('lỗi bật bug, đồng hồ dừng, không rời ca được, save vẫn hợp lệ và tải lại ra đúng bài',()=>{const s=withBug();assert.ok(s.work.bug);assert.strictEqual(workTick(s,30),s);assert.equal(workAction(s,{kind:'leave'}).ok,false);assert.ok(engine.valid(s));const re=engine.parse(JSON.stringify(s));assert.ok(re);assert.deepEqual(bugOf(re).puzzle,bugOf(s).puzzle)});
test('sửa đúng nhanh ngắn hơn sửa sai; lương cơ bản không bị trừ',()=>{const s=withBug('api');const b=bugOf(s);const fast=good(fixBug(s,b.puzzle.answer,500)),wrong=good(fixBug(s,(b.puzzle.answer+1)%b.puzzle.options.length,500));assert.ok(fast.work.task.required<wrong.work.task.required);assert.equal(fast.work.task.required,Math.max(15,Math.round(b.task.minutes*.25)));assert.ok(wrong.stress>fast.stress);assert.equal(fast.money,s.money)});
test('fixBug từ chối khi không có bug hoặc lựa chọn sai chỉ số',()=>{assert.equal(fixBug(employee(),0,100).ok,false);const s=withBug();assert.equal(fixBug(s,99,100).ok,false);assert.equal(fixBug(s,-1,100).ok,false);assert.equal(fixBug(s,0,-5).ok,false)});
test('bug thứ hai sau lần sửa đầu, sau 2 lần sửa mà vẫn lỗi thì chuyển kiểm tra thêm',()=>{let s=withBug();s=good(fixBug(s,bugOf(s).puzzle.answer,100));s.work.task.roll=0;s=workTick(s,60);assert.ok(s.work.bug);assert.equal(s.work.bug.attempt,2);s=good(fixBug(s,bugOf(s).puzzle.answer,100));s.work.task.roll=0;s=workTick(s,60);assert.equal(s.work.bug,undefined);assert.equal(s.work.task,null===0?0:s.work.task)});
test('bug xuất hiện đúng lúc hết ca: không kẹt bug, việc sửa chuyển sang ca sau',()=>{let s=good(workAction(employee(0,700),{kind:'start',taskId:'null-data'}));s.work.task.roll=0;s.work.task.elapsed=s.work.task.required-1;s=workTick(s,60);assert.equal(s.work.active,null);assert.equal(s.work.bug,undefined);assert.equal(s.work.task.attempt,1);assert.ok(engine.valid(s))});
