const test=require('node:test'),assert=require('node:assert/strict');
const N=require('../.test-build/domain/npc'),L=require('../.test-build/domain/lifecycle'),W=require('../.test-build/domain/town'),T=require('../.test-build/domain/town-data'),A=require('../.test-build/domain/talk/arcs'),V=require('../.test-build/domain/talk/live'),{engine}=require('../.test-build/domain/engine');
const base=(w='town-t')=>({...engine.initial(),seed:{world:w,life:w}});
const town=s=>N.rosterOf(s).filter(n=>n.arch);

test('H7a: đầu đời có 6 NPC ngẫu nhiên đúng nơi, cùng seed cùng người, tên không trùng dàn',()=>{
 const s=base(),R=N.rosterOf(s),t=town(s);assert.equal(t.length,6);
 assert.deepEqual(t.map(n=>T.archOf(n.arch).place),['home','home','market','streetfood','park','park']);
 assert.equal(new Set(R.map(n=>n.name)).size,R.length);assert.equal(new Set(R.map(n=>n.fullName)).size,R.length);
 for(const n of t){const a=T.archOf(n.arch);assert.ok(n.age>=a.age[0]&&n.age<=a.age[1],n.name);assert.equal(n.role,a.role);assert.ok(n.schedule.every(x=>x.place===a.place));assert.ok(n.story)}
 assert.deepEqual(town(base()).map(n=>n.name),t.map(n=>n.name));assert.notDeepEqual(town(base('khac')).map(n=>n.name),t.map(n=>n.name));
 assert.ok(V.hasOwnLines('town-a')&&V.hasOwnLines('town-l'));
});

test('H7a: người mới chỉ tới ở nơi hay lui tới, tối đa 12, cách nhau từ 4 ngày; lâu không gặp mà chưa quen thì chuyển đi',()=>{
 let s=base('town-come');const seen=[];
 for(let d=1;d<=400;d++){s={...s,day:d};s=N.markBeen(s,'market');const before=N.townOn(L.cycleOf(s));s=W.settleTown(L.settleCycle(s));const cy=L.cycleOf(s),on=N.townOn(cy);
  assert.ok(on.length<=12);for(const id of on.filter(x=>!before.includes(x))){seen.push(d);assert.ok(['home','market'].includes(T.archOf(cy.holders[id].a).place),'chỉ khu trọ và chợ')}
  // người chơi quen người ở chợ (quan hệ 12), không gặp ai khác
  const rel={};for(const n of town(s))if(n.arch==='shopper')rel[n.id]={score:12,lastDay:d,minutes:0};s={...s,social:{relations:rel,chatMinutesDay:0,chatDay:d}}}
 assert.ok(seen.length>=3,'có người mới tới');for(let i=1;i<seen.length;i++)assert.ok(seen[i]-seen[i-1]>=4);
 const t=town(s);assert.ok(t.every(n=>['home','market'].includes(T.archOf(n.arch).place)),'người ở quán, công viên đã chuyển đi');
 assert.ok(L.cycleOf(s).gone.some(g=>g.why==='left'&&T.isTown(g.role)));
 assert.ok(engine.parse(JSON.stringify(s)),'save hợp lệ');
});

test('H7a: người lạ gặp lại nhớ lần trước; chuyện sang nhịp mới thì kể tiếp',()=>{
 let s={...base('town-met'),day:20};const n=town(s).find(x=>x.arch==='tenant'),w='town-met';
 const met=d=>({...s,social:{relations:{[n.id]:{score:3,lastDay:d,minutes:5}},chatMinutesDay:0,chatDay:s.day}});
 assert.equal(A.townFacts(met(19)).filter(f=>f.about===n.id&&['met','metsame','metnew'].includes(f.sub)).length,0,'hôm qua mới gặp thì không nhắc');
 // tìm một ngày cách lần gặp 10 ngày mà chuyện đã sang nhịp khác
 let day=-1,last=-1;for(let d=15;d<200&&day<0;d++){const a=A.beatOn(w,n,d),b=A.beatOn(w,n,d+10);if(a&&b&&a.beat.id!==b.beat.id){last=d;day=d+10}}
 assert.ok(day>0);s={...s,day};const st={...met(last),clock:{...s.clock,minute:n.schedule[0].from+20,location:'home'}};
 const f=A.townFacts(st).find(x=>x.about===n.id&&x.sub==='metnew');assert.ok(f,'có dữ kiện chuyện mới');assert.equal(f.vars.then,A.beatOn(w,n,last).beat.doing);
 const said=V.sayNow(st,N.castById(st,n.id),'face','t1');assert.equal(said.fact.sub,'metnew');assert.ok(said.text.includes(f.vars.then)&&said.text.includes(f.vars.now),said.text);
});

test('H7a: người đã chuyển đi có thể quay lại, vẫn là người đó, nhận ra người chơi',()=>{
 let s=base('town-back');const first=town(s).find(n=>n.id==='town-c');
 s=L.depart({...s,day:5},N.castById({...s,day:5},'town-c'),'left');assert.ok(!N.townOn(L.cycleOf(s)).includes('town-c'));
 const g=L.cycleOf(s).gone.find(x=>x.role==='town-c');assert.equal(N.personById(s,g.id).fullName,first.fullName);
 // dựng người quay lại vào ô khác như settleTown làm
 const cy=L.cycleOf(s),h={...g.h,gen:1,o:'town-c:0',r:60};s={...s,day:60,cycle:{...cy,holders:{...cy.holders,'town-g':h},town:{...cy.town,on:[...N.townOn(cy),'town-g']}}};
 const back=N.castById(s,'town-g');assert.equal(back.fullName,first.fullName);assert.equal(back.born,first.born);
 assert.ok(A.townFacts(s).some(f=>f.about==='town-g'&&f.sub==='back'));assert.ok(engine.parse(JSON.stringify(s)));
});

test('H7a: kiểm save vòng đời phần NPC ngẫu nhiên',()=>{
 const cy={version:1,holders:{},vacant:{},frail:{},gone:[],known:[],wished:{}};
 assert.ok(L.validCycle({...cy,town:{on:['town-a','town-h'],been:{market:3},last:2}},5));
 for(const bad of [{on:['town-z']},{on:['town-a','town-a']},{on:[],been:{office:1}},{on:[],last:9}])assert.ok(!L.validCycle({...cy,town:bad},5),JSON.stringify(bad));
 assert.ok(!L.validCycle({...cy,holders:{'town-a':{gen:1,k:0,since:0,a:'pilot'}}},5));
 assert.ok(L.validCycle({...cy,holders:{'town-a':{gen:1,k:0,since:0,a:'chess',o:'town-c:0',r:3}}},5));
});
