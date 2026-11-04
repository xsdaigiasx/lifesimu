const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const {homeOf,saveHome,uidOf,homePrice}=require('../.test-build/domain/home');
const {lifeOf,PRODUCTS}=require('../.test-build/domain/life');
const {ORDER,checkout,placeOrder,cancelOrder,receiveOrder,sellBack,saleOf,cartTotal,ordersOf,resaleOf}=require('../.test-build/domain/orders');
const {residenceOf}=require('../.test-build/domain/housing');
const {clockOf}=require('../.test-build/domain/time');
const at=(s,location)=>({...s,clock:{...clockOf(s),location}});
const orig=clockOf(engine.initial()).location,back=st=>({...st,clock:{...clockOf(st),location:orig}});
const base=()=>({...engine.initial(),money:30000000});
const hLine=(id,tier='basic')=>({kind:'home',id,tier}),pLine=id=>({kind:'product',id});

// Mua trực tiếp ở TTTM: gộp nhiều món, một lần trừ tiền, có chi phí giờ, không phí giao
let s=at(base(),'mall');
const lines=[pLine('headphones'),pLine('casual'),hLine('plant','comfort')];
const total=cartTotal(s,lines);assert(total>0);
const c=checkout(s,lines);assert(c.ok,c.error);
assert.equal(c.state.money,s.money-total);
assert(lifeOf(c.state).owned.includes('headphones')&&lifeOf(c.state).owned.includes('casual'));
assert(homeOf(c.state).items.some(i=>i.id==='plant'&&i.tier==='comfort'));
assert(engine.valid(back(c.state))&&engine.parse(JSON.stringify(back(c.state))));
// không ở TTTM thì không mua; sai một món thì cả lô bị từ chối, tiền và đồ nguyên vẹn
assert(!checkout(at(s,'home'),lines).ok);
const poor=checkout({...s,money:total-1},lines);assert(!poor.ok);
const dup=checkout(c.state,[pLine('tv'),pLine('headphones')]);assert(!dup.ok);
assert(!checkout(s,[]).ok);assert(!checkout(s,[pLine('nope')]).ok);

// Đặt qua điện thoại: chưa trừ tiền, giao hôm sau, trả khi nhận kèm phí giao
let p=base();const o=placeOrder(p,[pLine('tv'),hLine('rug','basic')]);assert(o.ok,o.error);
assert.equal(o.state.money,p.money);assert.equal(ordersOf(o.state).list.length,1);
const id=ordersOf(o.state).list[0].id;
assert(!receiveOrder(o.state,id).ok);// chưa tới ngày
const next={...o.state,day:o.state.day+1};
assert(!receiveOrder(at(next,'mall'),id).ok);// phải ở nhà
const home=at(next,residenceOf(next));
const sum=cartTotal(home,[pLine('tv'),hLine('rug','basic')]);
const r=receiveOrder(home,id);assert(r.ok,r.error);
assert.equal(r.state.money,home.money-sum-ORDER.fee);
assert.equal(ordersOf(r.state).list.length,0);
assert(lifeOf(r.state).owned.includes('tv'));
assert(!receiveOrder(r.state,id).ok);// không nhận trùng
assert(engine.valid(r.state)&&engine.parse(JSON.stringify(r.state)));
// không đủ tiền thì đơn còn nguyên, tiền không âm
const broke=receiveOrder({...home,money:sum+ORDER.fee-1},id);assert(!broke.ok);
// huỷ đơn, trần số đơn
assert.equal(ordersOf(cancelOrder(o.state,id).state).list.length,0);
let many=base();for(let k=0;k<ORDER.maxOrders;k++)many=placeOrder(many,[pLine(k?'headphones':'tv')]).state;
assert(!placeOrder(many,[pLine('casual')]).ok);
// đơn hỏng trong save bị từ chối
assert(!engine.valid({...o.state,orders:{version:1,seq:1,list:[{id:'o1',day:o.state.day,due:o.state.day+5,lines:[pLine('tv')]}]}}));
assert(!engine.valid({...o.state,orders:{version:1,seq:1,list:[{id:'o1',day:o.state.day,due:o.state.day+1,lines:[pLine('khongco')]}]}}));

// Bán lại: 55% giá, không bán đồ đang dùng, không bán đồ đang đặt trong phòng; mua bán vòng luôn lỗ
let m=at(c.state,'mall');
const q=saleOf(m,{kind:'product',id:'headphones'});assert(q.ok);assert.equal(q.value,resaleOf(PRODUCTS.headphones.price));
assert.equal(resaleOf(100000),55000);
const sold=sellBack(m,{kind:'product',id:'headphones'});assert(sold.ok,sold.error);
assert(!lifeOf(sold.state).owned.includes('headphones'));assert.equal(sold.state.money,m.money+q.value);
assert(sold.state.money-(m.money)<PRODUCTS.headphones.price);
// mua lại và bán lại cùng món nhiều lần vẫn được (mã giao dịch không trùng)
let loop=at({...base()},'mall');const start=loop.money;
for(let k=0;k<3;k++){loop=checkout(loop,[pLine('headphones')]).state;loop=sellBack(loop,{kind:'product',id:'headphones'}).state}
assert(loop.money<start);assert(!lifeOf(loop).owned.includes('headphones'));
// đồ đang mặc không bán được
const worn=at({...c.state,life:{...lifeOf(c.state),outfit:'casual'}},'mall');
assert(!sellBack(worn,{kind:'product',id:'casual'}).ok);
// nội thất: chưa đặt thì bán được; đã đặt vào phòng thì phải cất vào kho trước
const plant=homeOf(m).items.find(i=>i.id==='plant'),uid=uidOf(plant);
const sp=sellBack(m,{kind:'home',uid});assert(sp.ok,sp.error);
assert.equal(sp.state.money,m.money+resaleOf(homePrice('plant','comfort')));
assert(!homeOf(sp.state).items.some(i=>uidOf(i)===uid));
const placed=saveHome(at(c.state,'home'),homeOf(c.state).items.map(i=>i.id==='plant'?{...i,x:5,y:4,placed:true}:i));assert(placed.ok,placed.error);
assert(!sellBack(at(placed.state,'mall'),{kind:'home',uid}).ok);
assert.equal(s.money,30000000);
console.log('orders ok');
