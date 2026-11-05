const assert=require('node:assert/strict');
const {homeOf,saveHome,buyHome,uidOf,placedAt,homeName,homePrice,HOME_ITEMS}=require('../.test-build/domain/home');
const {watchTv,TV_USE}=require('../.test-build/domain/home-use');
const {billOf}=require('../.test-build/domain/utility');
const {PRODUCTS,lifeOf}=require('../.test-build/domain/life');
const {engine}=require('../.test-build/domain/engine');
let s={...engine.initial(),money:50000000,energy:40,stress:50,mood:50};
// TV là đồ nội thất 2x1, ba mẫu, mua rồi đặt vào phòng
assert.equal(HOME_ITEMS.tv.w,2);assert.equal(HOME_ITEMS.tv.h,1);
assert.equal(homeName('tv','premium'),'TV 55 inch kèm kệ gỗ');assert.equal(homePrice('tv','basic'),3200000);
// chưa có TV thì không xem được
assert(!watchTv(s).ok);
const bought=buyHome(s,'tv','basic');assert(bought.ok,bought.error);
// mua xong nằm trong kho, chưa đặt: vẫn chưa xem được, chưa tốn điện
const inStore=bought.state;assert(!placedAt(inStore,'tv'));assert(!watchTv(inStore).ok);
const bill0=billOf(inStore);assert(!bill0.electricity.some(l=>l.id==='tv'));
// đặt vào phòng rồi xem được, một lần mỗi ngày
const tv=homeOf(inStore).items.find(i=>i.id==='tv');
const placed=saveHome(inStore,homeOf(inStore).items.map(i=>i.id==='tv'?{...i,x:3,y:6,placed:true}:i));assert(placed.ok,placed.error);
const w=watchTv(placed.state);assert(w.ok,w.error);
assert(w.state.energy>placed.state.energy);
assert(w.state.mood>placed.state.mood);assert(w.state.stress<placed.state.stress);
assert(!watchTv(w.state).ok,'một lần mỗi ngày');
assert(billOf(placed.state).electricity.some(l=>l.id==='tv'),'TV đang đặt tính điện');
assert(engine.valid(w.state));assert(engine.parse(JSON.stringify(w.state)));
// cất vào kho thì không xem được
const stored=saveHome(placed.state,homeOf(placed.state).items.map(i=>i.id==='tv'?{...i,placed:false}:i));assert(stored.ok);assert(!watchTv(stored.state).ok);
// save cũ có TV trong life.owned: hiện thành đồ trong kho, không trùng
const old={...s,life:{...lifeOf(s),owned:['tv']}};assert(engine.valid(old));
const items=homeOf(old).items.filter(i=>i.id==='tv');assert.equal(items.length,1);assert.equal(items[0].placed,false);
const oldPlaced=saveHome(old,homeOf(old).items.map(i=>i.id==='tv'?{...i,x:3,y:6,placed:true}:i));assert(oldPlaced.ok,oldPlaced.error);
assert.equal(homeOf(oldPlaced.state).items.filter(i=>i.id==='tv').length,1);assert(watchTv(oldPlaced.state).ok);
// sản phẩm TV cũ không còn bán ở mục Điện tử
assert.equal(PRODUCTS.tv.category,'legacy');
console.log('tv ok');
