const test=require('node:test'),assert=require('node:assert/strict');
const H=require('../.test-build/domain/housing');const L=require('../.test-build/domain/life');const {engine}=require('../.test-build/domain/engine');const T=require('../.test-build/domain/time');const {settleRent}=require('../.test-build/domain/rent');const {dateAt}=require('../.test-build/domain/format');
const at=(location,extra={})=>{const s=engine.initial();return{...s,day:3,money:3e9,clock:{...T.clockOf(s),minute:600,location},...extra}};
const ok=r=>{assert.ok(r.ok,r.error);assert.ok(engine.valid(r.state),'state hợp lệ');assert.ok(engine.parse(JSON.stringify(r.state)));return r.state};
test('thuê nhà phố: phải đến xem, trả tháng đầu, chuyển nơi ở, mang giường theo',()=>{
 assert.equal(H.moveHouse(at('home'),'townhouse','rent').ok,false,'phải đến nơi');
 const s=at('apartments'),n=ok(H.moveHouse(s,'townhouse','rent'));assert.equal(n.money,s.money-6e6);assert.equal(H.residenceOf(n),'apartments');assert.equal(T.clockOf(n).minute,600+H.MOVE_MINUTES);
 {const f2=H.HOUSES.townhouse.floors[1],bed=H.layoutOf(n,'townhouse',2).find(p=>p.id==='bed');assert.ok(bed,'giường lên tầng 2');assert.equal(H.roomAt(f2,bed).id,'bedroom')}assert.equal(H.monthlyRent(n,1500000),6e6);
 const sl=ok(T.finishDay(n));assert.equal(T.clockOf(sl).location,'apartments','ngủ ở nhà mới');assert.ok(sl.energy>=n.energy);
 assert.equal(L.lifeAction({...n,clock:{...n.clock,location:'home'}},{kind:'tv'}).ok,false,'phòng trọ không còn là nhà');
 const back=ok(H.moveHouse({...n,clock:{...n.clock,location:'home'}},'tro','rent'));assert.equal(H.residenceOf(back),'home');assert.equal(back.money,n.money,'về trọ miễn phí');
});
test('mua biệt thự: không còn tiền nhà, có sân vườn và phòng giải trí',()=>{
 assert.equal(H.moveHouse(at('villa',{money:1e9}),'villa','own').ok,false,'thiếu tiền');assert.equal(H.moveHouse(at('villa'),'villa','rent').ok,false,'biệt thự không cho thuê');
 const n=ok(H.moveHouse(at('villa',{money:2e10}),'villa','own'));assert.ok(H.housingOf(n).owned.includes('villa'));assert.equal(H.monthlyRent(n,1500000),0);
 const g=ok(H.relaxAtHome(n,'garden'));assert.ok(g.mood>n.mood||n.mood===100);assert.equal(H.relaxAtHome(g,'garden').ok,false,'mỗi ngày một lần');ok(H.relaxAtHome(g,'fun'));
});
test('mặt bằng liền: đồ nằm gọn trong một phòng, không ở hành lang, không đặt hai tầng',()=>{
 const n=ok(H.moveHouse(at('apartments'),'townhouse','rent'));const f1=H.HOUSES.townhouse.floors[0];
 assert.equal(H.arrangeFloor(n,1,[{id:'desk',x:9,y:0,rotation:0}]).ok,false,'vắt qua hai phòng');
 assert.equal(H.arrangeFloor(n,1,[{id:'desk',x:2,y:10,rotation:0}]).ok,false,'hành lang');
 assert.equal(H.arrangeFloor(n,1,[{id:'desk',x:2,y:2,rotation:0}]).ok,false,'bàn đang ở tầng 2');
 const m=ok(H.arrangeFloor(n,2,H.layoutOf(n,'townhouse',2).filter(p=>p.id!=='desk')));assert.ok(H.storageOf(m,'townhouse').includes('desk'));
 const p=ok(H.arrangeFloor(m,1,[{id:'desk',x:11,y:1,rotation:90}]));assert.equal(H.roomAt(f1,H.layoutOf(p,'townhouse',1)[0]).id,'kitchen');
 assert.equal(H.arrangeFloor(p,2,[{id:'bed',x:11,y:1,rotation:0}]).ok,false,'giường ở phòng làm việc');
 for(const house of ['townhouse','villa'])for(const f of H.HOUSES[house].floors){for(const r of f.rooms){assert.ok(r.x+r.w<=f.w&&r.y+r.h<=f.h,r.id);for(const o of f.rooms)if(o!==r)assert.ok(r.x>=o.x+o.w||o.x>=r.x+r.w||r.y>=o.y+o.h||o.y>=r.y+r.h,`${r.id} chồng ${o.id}`)}}
 assert.equal(engine.valid({...p,housing:{...H.housingOf(p),house:'villa',tenure:'own'}}),false,'chưa mua mà ở');
});
test('bếp nấu nhanh hơn, tiền thuê tính theo nhà',()=>{
 let n=ok(H.moveHouse(at('apartments'),'townhouse','rent'));n={...n,life:{...L.lifeOf(n),pantry:[{ingredient:'rice',qty:3,boughtDay:n.day,expiresDay:n.day+5},{ingredient:'egg',qty:4,boughtDay:n.day,expiresDay:n.day+5}]}};
 const c=ok(L.lifeAction(n,{kind:'cook',id:'eggRice'}));assert.equal(T.clockOf(c).minute-T.clockOf(n).minute,Math.round(L.RECIPES.eggRice.minutes*H.COOK_FACTOR));
 let d=n.day;while(dateAt(d).getUTCDate()!==1)d++;const r=settleRent({...n,day:d,rent:{billedMonth:'x',owed:0,billOwed:0,dueDay:null,notice:null}});assert.ok(r.ledger.some(e=>e.name.startsWith('Tiền thuê nhà')&&e.amount===-6e6));
});
