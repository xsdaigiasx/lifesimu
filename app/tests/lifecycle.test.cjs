const test=require('node:test'),assert=require('node:assert/strict');
const B=p=>require('../.test-build/domain/'+p);
const {engine}=B('engine'),N=B('npc'),L=B('lifecycle'),{socialOf}=B('social'),{storyOf}=B('director'),{inboxOf}=B('inbox');
const base=(over={})=>({...engine.initial(),seed:{world:'cyc',life:'cyc'},...over});

test('tuổi tính theo lịch: dàn gốc giữ tuổi ở ngày 0, tăng đúng ngày sinh nhật',()=>{
 const s=base(),r0=N.rosterOf(s);
 for(const n of r0){assert.equal(N.ageAt(n.born,0),n.age);assert.notEqual(N.monthDay(n.born),129,'không sinh 29/2')}
 const n=r0.find(x=>x.id==='landlord');let d=1;while(!N.isBirthday(n.born,d))d++;
 assert.equal(N.castById({...s,day:d-1},'landlord').age,n.age);assert.equal(N.castById({...s,day:d},'landlord').age,n.age+1);
 assert.deepEqual(N.buildRoster('cyc').map(x=>x.name),N.buildRoster('cyc').map(x=>x.name),'tất định');
});

test('người yếu dần: vắng mặt nhiều hơn, có dấu hiệu sức khoẻ yếu; mất sau 20 đến 40 ngày, chờ chuyện dở xong',()=>{
 let s=base({day:10,social:{relations:{neighbor:{score:40,lastDay:10,minutes:0}},chatMinutesDay:0,chatDay:10}});
 s={...s,cycle:{...L.cycleOf(s),frail:{neighbor:10}}};
 const n=N.castById(s,'neighbor');assert.equal(n.frail,10);
 const Lf=B('talk/npc-life');assert.ok(Lf.eventsOn('cyc',n,15).some(e=>e.kind==='frail'));
 // đang có hẹn với người đó thì chưa mất
 s={...s,day:51,inbox:{...inboxOf(s),appts:[{id:'a1',npc:'neighbor',day:52,minute:1110,place:'streetfood',status:'set'}]}};
 assert.ok(N.castById(L.settleCycle(s),'neighbor'),'đang có hẹn thì chưa mất');
 s={...s,inbox:undefined};const n2=L.settleCycle(s);
 assert.equal(N.castById(n2,'neighbor'),undefined,'đã mất');
 const g=L.cycleOf(n2).gone[0];assert.equal(g.id,'neighbor.0');assert.equal(g.why,'died');assert.equal(g.score,40);
 assert.equal(socialOf(n2).relations.neighbor,undefined,'quan hệ không chuyển sang người mới');
 assert.equal(N.personById(n2,'neighbor.0').name,n.name,'Nhật ký vẫn đọc được tên');
 assert.ok(n2.journal.some(e=>e.key==='gone-died:neighbor.0'&&e.npcId==='neighbor.0'));
 assert.equal(L.funeralsOf(n2).length,1);
 // không có người nối nghiệp: 14 ngày sau có người mới, hồ sơ khác
 let x=n2;for(let d=52;d<=65;d++)x=L.settleCycle({...x,day:d});
 const nn=N.castById(x,'neighbor');assert.ok(nn);assert.equal(nn.gen,1);assert.notEqual(nn.fullName,n.fullName);assert.ok(nn.age>=62&&nn.age<=76);
 assert.ok(engine.parse(JSON.stringify(x)),'save hợp lệ');
});

test('con nối nghiệp sau 7 ngày, mang họ và quê của cha mẹ, nhớ mang máng người chơi',()=>{
 const R=N.buildRoster('cyc');let world='cyc',p=R.find(n=>n.id==='landlord');
 for(let i=0;!(p.kid!==undefined);i++){world='cyc'+i;p=N.buildRoster(world).find(n=>n.id==='landlord')}
 const day=Math.max(1,p.kid+21*366);
 let s={...engine.initial(),seed:{world,life:world},day,social:{relations:{landlord:{score:45,lastDay:day,minutes:0}},chatMinutesDay:0,chatDay:day}};
 s={...s,cycle:{...L.cycleOf(s),frail:{landlord:day-60}}};s=L.settleCycle(s);
 assert.equal(L.cycleOf(s).vacant.landlord.heir,true);assert.equal(L.cycleOf(s).vacant.landlord.until,day+7);
 s=L.visitFuneral({...s,clock:{...B('time').clockOf(s),minute:600}},'landlord.0').state;
 for(let d=day+1;d<=day+7;d++)s=L.settleCycle({...s,day:d});
 const h=N.castById(s,'landlord');assert.ok(h);assert.equal(h.fullName.split(' ')[0],p.fullName.split(' ')[0]);assert.equal(h.origin,p.origin);assert.ok(h.traits.includes(p.traits[0]));
 assert.equal(socialOf(s).relations.landlord.score,15,'Quen biết 10 cộng 5 vì đã đến viếng');
 assert.ok(engine.parse(JSON.stringify(s)));
});

test('nghỉ hưu, ra trường: rời vai đúng tuổi, có người thay',()=>{
 const n=N.buildRoster('cyc').find(x=>x.id==='courier');let d=1;while(N.ageAt(n.born,d)<24)d++;
 let s=base({day:d});s=L.settleCycle(s);assert.equal(N.castById(s,'courier'),undefined);assert.equal(L.cycleOf(s).gone[0].why,'left');
 for(let x=d+1;x<=d+14;x++)s=L.settleCycle({...s,day:x});assert.ok(N.castById(s,'courier').age<24);
});

test('sinh nhật: biết từ bậc Thân, chúc và tặng quà mỗi năm một lần, quà hợp ý nhiều điểm hơn; quên sinh nhật Tri kỷ bị trừ',()=>{
 const n=N.buildRoster('cyc').find(x=>x.id==='veg');let d=1;while(!N.isBirthday(n.born,d))d++;
 const pres=n.schedule[0];let day=d;
 const rel=score=>({social:{relations:{veg:{score,lastDay:day-1,minutes:0}},chatMinutesDay:0,chatDay:day}});
 let s=base({day,...rel(20)});assert.equal(L.knowsBirthday(s,'veg'),false);assert.equal(L.wishBirthday(s,'veg').ok,false);
 s=base({day,...rel(35)});assert.ok(L.birthdaysOn(s,day).some(x=>x.id==='veg'));
 const w=L.wishBirthday(s,'veg');assert.ok(w.ok);assert.ok(socialOf(w.state).relations.veg.score>35);assert.equal(L.wishBirthday(w.state,'veg').ok,false,'mỗi năm một lần');
 // quà từ Tủ bếp: món hợp ý
 const life={...s.life??engine.initial().life};
 const {lifeOf}=B('life');const l=structuredClone(lifeOf(s));l.pantry=[{ingredient:'egg',qty:6,boughtDay:day,expiresDay:day+5},{ingredient:'rice',qty:2,boughtDay:day,expiresDay:day+30}];void life;
 s={...s,life:l,clock:{...B('time').clockOf(s),location:pres.place,minute:pres.from+30}};
 const opts=L.giftOptions(s);assert.equal(opts.length,2);
 assert.ok(N.presentAt(N.castById(s,'veg'),day,pres.from+30,pres.place),'đang ở quầy');const g=L.giveBirthdayGift(s,'veg','pantry',opts[0].id);{assert.ok(g.ok,g.error);assert.equal(lifeOf(g.state).pantry.length,1);assert.ok(storyOf(g.state).memories.some(m=>m.topic==='quà sinh nhật'))}
 // quên sinh nhật Tri kỷ
 let t=base({day:d+1,social:{relations:{veg:{score:65,lastDay:d,minutes:0}},chatMinutesDay:0,chatDay:d+1}});t=L.settleCycle(t);
 assert.ok(socialOf(t).relations.veg.score<65);
});

test('sinh nhật người chơi rút theo seed đời chơi: Mẹ, em và người thân nhắn chúc',()=>{
 const s0=base();let d=1;while(!L.isPlayerBirthday(s0,d))d++;assert.ok(d<=366);
 assert.notEqual(L.playerBirthday({seed:{world:'a',life:'x1'}}),L.playerBirthday({seed:{world:'a',life:'x2'}})||'khác seed có thể trùng');
 const s=L.settleCycle(base({day:d,social:{relations:{landlord:{score:40,lastDay:d,minutes:0}},chatMinutesDay:0,chatDay:d}}));
 const q=inboxOf(s).queue.filter(m=>m.kind==='bday').map(m=>m.npc);assert.ok(q.includes('me'));assert.ok(q.includes('em'));assert.ok(q.includes('landlord'));
});

test('lát cắt vòng đời hỏng thì bị bỏ, save vẫn mở được',()=>{
 const s=base({day:5,cycle:{version:1,holders:{landlord:{gen:-1,k:0,since:0}},vacant:{},frail:{},gone:[],known:[],wished:{}}});
 const r=engine.parse(JSON.stringify(s));assert.ok(r===null||r.cycle===undefined);
 assert.equal(L.validCycle(L.cycleOf(base()),0),true);
});
