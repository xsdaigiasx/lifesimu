const test=require('node:test'),assert=require('node:assert/strict');
const N=require('../.test-build/domain/npc');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');
const {talkTo,socialOf}=require('../.test-build/domain/social');const {dateAt}=require('../.test-build/domain/format');
const dayOf=dow=>{for(let d=0;d<14;d++)if(dateAt(d).getUTCDay()===dow)return d};
const at=(day,minute,location)=>{const s=engine.initial();return{...s,day,clock:{...clockOf(s),minute,location}}};

test('dàn cố định 12 người, id không trùng, 6 người có chuỗi, Mẹ chỉ liên lạc từ xa',()=>{
 assert.equal(N.CAST.length,12);assert.equal(new Set(N.CAST.map(n=>n.id)).size,12);
 assert.deepEqual(N.CAST.filter(n=>n.story).map(n=>n.id).sort(),['ba-tu','chu-sau','co-hanh','dev-an','dev-trang','me']);
 for(const n of N.CAST){assert.deepEqual(N.profileProblems(n),[],n.id);assert.ok(n.remote||n.schedule.length>0,n.id);for(const s of n.schedule)assert.ok(s.from<s.to&&s.from>=420&&s.to<=1500,n.id)}
 for(const d of [0,1,2,3,4,5,6])for(let m=420;m<1500;m+=30)assert.ok(!N.presentAt(N.castById('me'),d,m,'home'));
});

test('chỉ gặp khi cùng nơi, cùng giờ',()=>{
 const mon=dayOf(1),sun=dayOf(0);
 assert.ok(N.peopleHere(at(mon,600,'market')).some(n=>n.id==='co-hanh'),'Cô Hạnh ở chợ buổi sáng');
 assert.ok(!N.peopleHere(at(mon,900,'market')).some(n=>n.id==='co-hanh'),'chiều không còn ở chợ');
 assert.ok(N.peopleHere(at(mon,600,'bank')).some(n=>n.id==='bao-ngoc'));assert.ok(!N.peopleHere(at(sun,600,'bank')).some(n=>n.id==='bao-ngoc'),'Chủ nhật ngân hàng nghỉ');
 assert.ok(N.peopleHere(at(mon,1200,'home')).some(n=>n.id==='ba-tu'),'tối gặp Bà Tư ở khu trọ');
 assert.ok(!N.peopleHere(at(mon,600,'hospital')).some(n=>n.id==='co-hanh'));
 for(const n of N.CAST)for(let d=0;d<7;d++)for(let m=420;m<1500;m+=10){const places=['home','office','market','bank','hospital','park','streetfood','bus'].filter(p=>N.presentAt(n,d,m,p));assert.ok(places.length<=1,`${n.id} ở hai nơi cùng lúc`)}
});

test('lịch lệch nhẹ theo ngày nhưng cố định khi mở lại',()=>{
 const a=N.castById('co-hanh');const edges=new Set();for(let d=0;d<14;d++){let m=420;while(m<700&&!N.presentAt(a,d,m,'market'))m++;edges.add(m);assert.equal(N.presentAt(a,d,m,'market'),N.presentAt(a,d,m,'market'))}
 assert.ok(edges.size>1,'giờ đến chợ không giống hệt nhau mỗi ngày');for(const e of edges)assert.ok(e>=420&&e<=435);
});

test('bộ sinh NPC: cùng seed cùng người; luôn hợp ràng buộc tuổi nghề, tính cách',()=>{
 assert.deepEqual(N.generateNpc('abc'),N.generateNpc('abc'));assert.notDeepEqual(N.generateNpc('abc'),N.generateNpc('abd'));
 const names=new Set();for(let i=0;i<1000;i++){const p=N.generateNpc('s'+i);assert.deepEqual(N.profileProblems(p),[],JSON.stringify(p));assert.equal(p.traits.length,3);names.add(p.name)}
 assert.ok(names.size>150,'tên đủ đa dạng: '+names.size);
 assert.ok(N.profileProblems({age:19,job:'Trưởng phòng',traits:['vui vẻ']}).length>0);assert.ok(N.profileProblems({age:40,traits:['hào phóng','keo kiệt']}).length>0);
});

test('chào hỏi chỉ khi người đó đang ở đây; cộng quan hệ, cách nhau 60 phút',()=>{
 const mon=dayOf(1);let s=at(mon,600,'market');const r=talkTo(s,'co-hanh',5);assert.ok(r.ok,r.error);s=r.state;assert.ok(engine.valid(s));
 assert.equal(socialOf(s).relations['co-hanh'].score,2);assert.equal(clockOf(s).minute,605);assert.equal(talkTo(s,'co-hanh',5).ok,false,'chưa đủ 60 phút');
 assert.equal(talkTo(at(mon,600,'market'),'bao-ngoc',5).ok,false,'không có mặt thì không gặp');assert.equal(talkTo(at(mon,600,'market'),'me',5).ok,false);
 assert.equal(N.relationTier(9),'Xa lạ');assert.equal(N.relationTier(10),'Quen biết');assert.equal(N.relationTier(30),'Thân');assert.equal(N.relationTier(60),'Tri kỷ');
});

test('chợ chia quầy: mỗi món ở đúng một quầy, người bán có lịch ở chợ',()=>{
 const {STALLS,INGREDIENTS}=require('../.test-build/domain/life');
 const items=STALLS.flatMap(s=>s.items);assert.deepEqual([...items].sort(),Object.keys(INGREDIENTS).sort());
 for(const s of STALLS){const n=N.castById(s.seller);assert.ok(n&&n.schedule.some(x=>x.place==='market'),s.id);assert.deepEqual(N.profileProblems(n),[])}
 assert.ok(N.peopleHere(at(dayOf(1),600,'market')).some(n=>n.id==='chu-luc'));
});
