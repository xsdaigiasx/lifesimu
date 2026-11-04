const test=require('node:test'),assert=require('node:assert/strict');
const H=require('../.test-build/domain/housing');const L=require('../.test-build/domain/life');const {engine}=require('../.test-build/domain/engine');const T=require('../.test-build/domain/time');const {settleRent}=require('../.test-build/domain/rent');const {dateAt}=require('../.test-build/domain/format');
const at=(location,extra={})=>{const s=engine.initial();return{...s,day:3,money:3e9,clock:{...T.clockOf(s),minute:600,location},...extra}};
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state),'state hợp lệ');assert.ok(engine.parse(JSON.stringify(r.state)));return r.state};
test('thuê nhà phố: phải đến xem, trả tháng đầu, chuyển nơi ở, mang giường theo',()=>{
 assert.equal(H.moveHouse(at('home'),'townhouse','rent').ok,false,'phải đến nơi');
 const s=at('apartments'),n=ok(H.moveHouse(s,'townhouse','rent'));assert.equal(n.money,s.money-6e6);assert.equal(H.residenceOf(n),'apartments');assert.equal(T.clockOf(n).minute,600+H.MOVE_MINUTES);
 assert.ok(H.layoutOf(n,'townhouse','bedroom').some(p=>p.id==='bed'),'giường vào phòng ngủ');assert.equal(H.monthlyRent(n,1500000),6e6);
 const sl=ok(T.finishDay(n));assert.equal(T.clockOf(sl).location,'apartments','ngủ ở nhà mới');assert.ok(sl.energy>=n.energy);
 assert.equal(L.lifeAction({...n,clock:{...n.clock,location:'home'}},{kind:'tv'}).ok,false,'phòng trọ không còn là nhà');
 const back=ok(H.moveHouse({...n,clock:{...n.clock,location:'home'}},'tro','rent'));assert.equal(H.residenceOf(back),'home');assert.equal(back.money,n.money,'về trọ miễn phí');
});
test('mua biệt thự: không còn tiền nhà, có sân vườn và phòng giải trí',()=>{
 assert.equal(H.moveHouse(at('villa',{money:1e9}),'villa','own').ok,false,'thiếu tiền');assert.equal(H.moveHouse(at('villa'),'villa','rent').ok,false,'biệt thự không cho thuê');
 const n=ok(H.moveHouse(at('villa',{money:2e10}),'villa','own'));assert.ok(H.housingOf(n).owned.includes('villa'));assert.equal(H.monthlyRent(n,1500000),0);
 const g=ok(H.relaxAtHome(n,'garden'));assert.ok(g.mood>n.mood||n.mood===100);assert.equal(H.relaxAtHome(g,'garden').ok,false,'mỗi ngày một lần');ok(H.relaxAtHome(g,'fun'));
});
test('sắp xếp phòng: trong phòng, không chồng, không đặt hai nơi',()=>{
 const n=ok(H.moveHouse(at('apartments'),'townhouse','rent'));
 assert.equal(H.arrangeRoom(n,'living',[{id:'desk',x:9,y:9,rotation:0}]).ok,false,'ngoài phòng');
 assert.equal(H.arrangeRoom(n,'living',[{id:'bed',x:0,y:0,rotation:0}]).ok,false,'giường đang ở phòng ngủ');
 const before=H.layoutOf(n,'townhouse','study');const m=ok(H.arrangeRoom(n,'study',[]));assert.ok(H.storageOf(m,'townhouse').length>=H.storageOf(n,'townhouse').length+before.length);
 const p=ok(H.arrangeRoom(m,'living',[{id:'desk',x:2,y:2,rotation:90}]));assert.deepEqual(H.layoutOf(p,'townhouse','living')[0],{id:'desk',x:2,y:2,rotation:90});
 assert.equal(engine.valid({...p,housing:{...H.housingOf(p),house:'villa',tenure:'own'}}),false,'chưa mua mà ở');
});
test('bếp nấu nhanh hơn, tiền thuê tính theo nhà',()=>{
 let n=ok(H.moveHouse(at('apartments'),'townhouse','rent'));n={...n,life:{...L.lifeOf(n),pantry:[{ingredient:'rice',qty:3,boughtDay:n.day,expiresDay:n.day+5},{ingredient:'egg',qty:4,boughtDay:n.day,expiresDay:n.day+5}]}};
 const c=ok(L.lifeAction(n,{kind:'cook',id:'eggRice'}));assert.equal(T.clockOf(c).minute-T.clockOf(n).minute,Math.round(L.RECIPES.eggRice.minutes*H.COOK_FACTOR));
 let d=n.day;while(dateAt(d).getUTCDate()!==1)d++;const r=settleRent({...n,day:d,rent:{billedMonth:'x',owed:0,billOwed:0,dueDay:null,notice:null}});assert.ok(r.ledger.some(e=>e.name.startsWith('Tiền thuê nhà')&&e.amount===-6e6));
});
