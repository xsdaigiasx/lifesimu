const test=require('node:test'),assert=require('node:assert/strict');
const N=require('../.test-build/domain/npc');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');
const {talkTo,socialOf}=require('../.test-build/domain/social');const {dateAt}=require('../.test-build/domain/format');
const dayOf=dow=>{for(let d=0;d<14;d++)if(dateAt(d).getUTCDay()===dow)return d};
const at=(day,minute,location)=>{const s=engine.initial();return{...s,day,clock:{...clockOf(s),minute,location}}};

test('dàn theo vai: id không trùng, có chuỗi đúng vai, người thân chỉ liên lạc từ xa',()=>{
 const R=N.rosterOf({});assert.equal(R.length,N.NPC_IDS.length-6,'6 ô NPC ngẫu nhiên chưa có người');assert.equal(new Set(R.map(n=>n.id)).size,R.length);assert.equal(R.length,29);
 assert.deepEqual(R.filter(n=>n.story&&!n.arch).map(n=>n.id).sort(),['ant-dev','ant-pm','landlord','me','neighbor','sen-dev','sen-pm','veg']);
 for(const n of R){assert.deepEqual(N.profileProblems(n),[],n.id);assert.ok(n.remote||n.schedule.length>0,n.id);for(const s of n.schedule)assert.ok(s.from<s.to&&s.from>=420&&s.to<=1500,n.id)}
 for(const id of ['me','em'])for(const d of [0,1,2,3,4,5,6])for(let m=420;m<1500;m+=30)assert.ok(!N.presentAt(N.castById({},id),d,m,'home'));
 assert.equal(N.relationTier(0,'em'),'Gia đình');assert.equal(N.castById({},'me').name,'Mẹ');
});

test('H0: cùng seed cùng dàn; seed khác ra người khác; điều kiện theo vai',()=>{
 const a=N.rosterOf({seed:{world:'w1',life:'l1'}}),b=N.rosterOf({seed:{world:'w1',life:'l9'}}),c=N.rosterOf({seed:{world:'w2',life:'l1'}});
 assert.deepEqual(a.map(n=>n.name),b.map(n=>n.name),'đời chơi khác, cùng thế giới');assert.notDeepEqual(a.map(n=>n.name),c.map(n=>n.name));
 for(let i=0;i<200;i++){const R=N.buildRoster('s'+i),by=id=>R.find(n=>n.id===id);
  assert.equal(new Set(R.map(n=>n.name)).size,R.length,'tên hiển thị không trùng');assert.equal(new Set(R.map(n=>n.fullName)).size,R.length);
  assert.ok(by('landlord').age>=48&&by('neighbor').age>=62&&by('courier').age<=23&&by('doctor').age>=32&&by('me').gender==='female');
  assert.ok(by('doctor').name.startsWith('Bác sĩ '));assert.equal(by('em').fullName.split(' ')[0],by('me').fullName.split(' ')[0]);
  for(const n of R){assert.ok(n.label.length>=1&&n.label.length<=3,n.name);if(n.age<30)assert.ok(!['Cho con đi học','Con cái hư'].includes(n.goal)&&n.fear!=='Con cái hư')}}
 assert.ok(N.validSeed({world:'w',life:'l'})&&!N.validSeed({world:''})&&!N.validSeed(null));
 const s=N.newSeed(()=>0.5);assert.ok(N.validSeed(s));
});

test('H0: mỗi công ty có 4 đồng nghiệp riêng, chỉ gặp ở công ty đang làm',()=>{
 const base=engine.initial(),mon=dayOf(1),emp=c=>({...base,day:mon,clock:{...clockOf(base),minute:600,location:'office'},office:{role:'employee',employerId:c,met:[]}});
 assert.deepEqual(N.coworkersOf(emp('sen-code')).map(n=>n.id),['sen-dev','sen-design','sen-qa','sen-pm']);
 assert.deepEqual(N.coworkersOf(emp('an-nhien-tech')).map(n=>n.id),['ant-dev','ant-design','ant-qa','ant-pm']);
 const here=c=>N.peopleHere(emp(c)).map(n=>n.id);assert.ok(here('sen-code').includes('sen-dev')&&!here('sen-code').includes('ant-dev'));assert.ok(here('an-nhien-tech').includes('ant-pm')&&!here('an-nhien-tech').includes('sen-pm'));
 assert.ok(!N.peopleHere(at(mon,600,'office')).some(n=>n.company),'khách vãng lai không gặp đồng nghiệp');assert.ok(N.peopleHere(at(mon,600,'office')).some(n=>n.id==='reception'));
});

test('H0: không còn tên NPC viết cứng trong mã nguồn',()=>{
 const fs=require('node:fs'),path=require('node:path'),files=[];const walk=d=>{for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(f))files.push(p)}};walk(path.join(__dirname,'..','src'));
 const OLD=/\b(ba-tu|dev-an|dev-linh|dev-huy|dev-trang|co-hanh|chu-sau|chi-mai|bs-quan|bao-ngoc|chu-luc|ba-nam)\b|Bà Tư|Thảo Linh|Gia Huy|Thu Trang|Cô Hạnh|Chú Sáu|Chị Mai|Bác sĩ Quân|Bảo Ngọc|Chú Lực|Bà Năm|Mai Lan|Đức Minh|Ngọc Hà|Quốc Bảo|chị Trang/;
 for(const f of files){const src=fs.readFileSync(f,'utf8');assert.ok(!OLD.test(src),`${path.relative(process.cwd(),f)}: ${src.match(OLD)?.[0]}`)}
 const names=[...N.POOL.male,...N.POOL.female];for(const f of files){if(f.endsWith('npc.ts'))continue;const src=fs.readFileSync(f,'utf8');for(const n of names)for(const fam of N.POOL.family)assert.ok(!src.includes(`${fam} ${n}`),`${f}: ${fam} ${n}`)}
});

test('chỉ gặp khi cùng nơi, cùng giờ',()=>{
 const mon=dayOf(1),sun=dayOf(0);
 assert.ok(N.peopleHere(at(mon,600,'market')).some(n=>n.id==='veg'),'Cô Hạnh ở chợ buổi sáng');
 assert.ok(!N.peopleHere(at(mon,900,'market')).some(n=>n.id==='veg'),'chiều không còn ở chợ');
 assert.ok(N.peopleHere(at(mon,600,'bank')).some(n=>n.id==='teller'));assert.ok(!N.peopleHere(at(sun,600,'bank')).some(n=>n.id==='teller'),'Chủ nhật ngân hàng nghỉ');
 assert.ok(N.peopleHere(at(mon,1200,'home')).some(n=>n.id==='landlord'),'tối gặp Bà Tư ở khu trọ');
 assert.ok(!N.peopleHere(at(mon,600,'hospital')).some(n=>n.id==='veg'));
 for(const n of N.rosterOf({}))for(let d=0;d<7;d++)for(let m=420;m<1500;m+=10){const places=['home','office','market','bank','hospital','park','streetfood','bus'].filter(p=>N.presentAt(n,d,m,p));assert.ok(places.length<=1,`${n.id} ở hai nơi cùng lúc`)}
});

test('lịch lệch nhẹ theo ngày nhưng cố định khi mở lại',()=>{
 const a=N.castById({},'veg');const edges=new Set();for(let d=0;d<14;d++){let m=420;while(m<700&&!N.presentAt(a,d,m,'market'))m++;edges.add(m);assert.equal(N.presentAt(a,d,m,'market'),N.presentAt(a,d,m,'market'))}
 assert.ok(edges.size>1,'giờ đến chợ không giống hệt nhau mỗi ngày');for(const e of edges)assert.ok(e>=420&&e<=435);
});

test('bộ sinh NPC: cùng seed cùng người; luôn hợp ràng buộc tuổi nghề, tính cách',()=>{
 assert.deepEqual(N.generateNpc('abc'),N.generateNpc('abc'));assert.notDeepEqual(N.generateNpc('abc'),N.generateNpc('abd'));
 const names=new Set();for(let i=0;i<1000;i++){const p=N.generateNpc('s'+i);assert.deepEqual(N.profileProblems(p),[],JSON.stringify(p));assert.equal(p.traits.length,3);names.add(p.name)}
 assert.ok(names.size>150,'tên đủ đa dạng: '+names.size);
 assert.ok(N.profileProblems({age:19,job:'Trưởng phòng',traits:['vui vẻ']}).length>0);assert.ok(N.profileProblems({age:40,traits:['hào phóng','keo kiệt']}).length>0);
});

test('chào hỏi chỉ khi người đó đang ở đây; cộng quan hệ, cách nhau 60 phút',()=>{
 const mon=dayOf(1);let s=at(mon,600,'market');const r=talkTo(s,'veg',5);assert.ok(r.ok,r.error);s=r.state;assert.ok(engine.valid(s));
 assert.equal(socialOf(s).relations['veg'].score,2);assert.equal(clockOf(s).minute,605);assert.equal(talkTo(s,'veg',5).ok,false,'chưa đủ 60 phút');
 assert.equal(talkTo(at(mon,600,'market'),'teller',5).ok,false,'không có mặt thì không gặp');assert.equal(talkTo(at(mon,600,'market'),'me',5).ok,false);
 assert.equal(N.relationTier(9),'Xa lạ');assert.equal(N.relationTier(10),'Quen biết');assert.equal(N.relationTier(30),'Thân');assert.equal(N.relationTier(60),'Tri kỷ');
});

test('chợ chia quầy: mỗi món ở đúng một quầy, người bán có lịch ở chợ',()=>{
 const {STALLS,INGREDIENTS}=require('../.test-build/domain/life');
 const items=STALLS.flatMap(s=>s.items);assert.deepEqual([...items].sort(),Object.keys(INGREDIENTS).sort());
 for(const s of STALLS){const n=N.castById({},s.seller);assert.ok(n&&n.schedule.some(x=>x.place==='market'),s.id);assert.deepEqual(N.profileProblems(n),[])}
 assert.ok(N.peopleHere(at(dayOf(1),600,'market')).some(n=>n.id==='meat'));
});
