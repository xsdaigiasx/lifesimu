const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../.test-build/domain/journal-view');const {engine}=require('../.test-build/domain/engine');const {clockOf}=require('../.test-build/domain/time');
const D=require('../.test-build/domain/director');const {recordJournal,journalOf}=require('../.test-build/domain/journal');
const base=()=>{const s=engine.initial();return{...s,day:20,clock:{...clockOf(s),minute:1140,location:'home'}}};

test('Nhật ký chia tab theo loại; nhóm theo ngày áng chừng, không ghi ngày tháng',()=>{
 const e=(key,npcId)=>({id:key,key,day:0,minute:600,title:'x',detail:'y',...(npcId?{npcId}:{})});
 assert.equal(V.journalTab(e('story:1:2','landlord')),'story');assert.equal(V.journalTab(e('tier:5')),'story');assert.equal(V.journalTab(e('task:3:0:ok')),'work');assert.equal(V.journalTab(e('salary:x')),'work');assert.equal(V.journalTab(e('cook:1')),'life');
 assert.equal(V.dayLabel(20,20),'Hôm nay');assert.equal(V.dayLabel(19,20),'Hôm qua');assert.match(V.dayLabel(16,20),/^Thứ|^Chủ nhật/);assert.equal(V.dayLabel(12,20),'Tuần trước');
 for(let d=0;d<=20;d++)assert.doesNotMatch(V.dayLabel(d,20),/\d+\/\d+|\d{4}/);
 const g=V.groupByDay([{...e('a'),day:20},{...e('b'),day:20,minute:700},{...e('c'),day:19}],20);assert.deepEqual(g.map(x=>x.label),['Hôm nay','Hôm qua']);assert.equal(g[0].items[0].id,'b','mới nhất lên đầu');
});

test('Nhật ký không ghi trùng một sự kiện; đọc không đổi trạng thái',()=>{
 let s=base();s=recordJournal(s,'story:20:1','Bà Tư: Hỏi thăm','a','landlord');const once=journalOf(s).length;s=recordJournal(s,'story:20:1','Bà Tư: Hỏi thăm','a','landlord');assert.equal(journalOf(s).length,once);
 const snap=JSON.stringify(s);V.groupByDay(journalOf(s),s.day);V.profileOf(s,'landlord');assert.equal(JSON.stringify(s),snap);
});

test('hồ sơ chỉ hiện điều đã biết: Xa lạ không lộ quê, mục tiêu, nỗi lo, nơi hay gặp',()=>{
 let s=base();s={...s,social:{relations:{'landlord':{score:5,lastDay:20,minutes:0}},chatMinutesDay:0,chatDay:20}};
 let p=V.profileOf(s,'landlord');assert.deepEqual(p.facts,[]);assert.deepEqual(p.places,[]);assert.equal(p.progress.next,'Quen biết');assert.equal(p.progress.pct,50);
 s={...s,social:{...s.social,relations:{'landlord':{score:35,lastDay:20,minutes:0}}}};p=V.profileOf(s,'landlord');const keys=p.facts.map(f=>f[0]);
 assert.ok(keys.includes('Quê')&&keys.includes('Mong muốn'));assert.ok(!keys.includes('Đang lo'),'chưa nghe chuyện riêng thì chưa biết nỗi lo');assert.ok(p.places.some(x=>/Khu nhà trọ/.test(x)));
 s={...s,story:{...D.storyOf(s),memories:[{id:'m1',day:13,npc:'landlord',motif:'favor',topic:'xách đồ',tag:'help',weight:3},{id:'m2',day:18,npc:'landlord',motif:'private',topic:'chuyện riêng',tag:'listen',weight:4}]}};
 p=V.profileOf(s,'landlord');assert.ok(p.facts.some(f=>f[0]==='Đang lo'));{const nm=require('../.test-build/domain/npc').nameOf(s,'landlord');assert.deepEqual(p.shared.map(x=>x.text),[`Nghe ${nm} kể chuyện riêng`,`Giúp ${nm} xách đồ`])}assert.equal(p.shared[1].when,'tuần trước');
});

test('khoản đang cho mượn hiện trong hồ sơ, quá hẹn được đánh dấu',()=>{
 const s={...base(),social:{relations:{'landlord':{score:15,lastDay:20,minutes:0}},chatMinutesDay:0,chatDay:20},story:{...D.storyOf(base()),loans:[{id:'l',npc:'landlord',amount:200000,due:25,repay:true},{id:'k',npc:'landlord',amount:100000,due:10,repay:false,settled:'unpaid'}]}};
 const p=V.profileOf(s,'landlord');assert.equal(p.loans.length,2);assert.equal(p.loans[0].days,5);assert.equal(p.loans[1].late,true);
});
