const assert=require('node:assert/strict');
const {engine}=require('../.test-build/domain/engine');
const {homeOf,saveHome}=require('../.test-build/domain/home');
const {sideOf,settleSide,sideWork,hasProDesk,SIDE,payFor}=require('../.test-build/domain/side');
const base=engine.initial();
assert(!hasProDesk(base));
// không có bàn cao cấp: không có đơn
let none=base;for(let d=1;d<=60;d++)none=settleSide({...none,day:base.day+d});
assert.equal(sideOf(none).orders.length,0);
// có bàn cao cấp: đơn xuất hiện, tối đa 2
const pro=saveHome(base,homeOf(base).items.map(i=>i.id==='desk'?{...i,tier:'premium'}:i));assert(pro.ok,pro.error);
let s={...pro.state,money:0,energy:90};assert(hasProDesk(s));
let day=s.day;for(let d=1;d<=40&&sideOf(s).orders.length<1;d++){day=base.day+d;s=settleSide({...s,day})}
assert(sideOf(s).orders.length>=1,'có đơn');for(let d=1;d<=40;d++)s=settleSide({...s,day:day+d});
assert(sideOf(s).orders.length<=SIDE.maxOrders);
assert(engine.valid(s));assert(engine.parse(JSON.stringify(s)));
// làm đơn: 4 buổi tối, nhận tiền, uy tín tăng
let w={...pro.state,money:0,energy:90,day:100};w=settleSide({...w,day:100});let t=100;while(sideOf(w).orders.length===0){t++;w=settleSide({...w,day:t})}
const o=sideOf(w).orders[0];assert(o.pay>=2000000&&o.pay<=5000000);assert.equal(o.pay,payFor(o.minLevel));
const at=(x,minute,day)=>({...x,day,clock:{...(x.clock??{lastWorkDay:-1,lastStudyDay:-1,lastRestDay:-1}),minute,location:'home'}});
assert(!sideWork(at(w,600,t),o.id).ok,'ban ngày chưa làm được');
// 4 buổi tối liên tiếp trước hạn: nhận tiền, uy tín +5
let x=w;for(let i=0;i<SIDE.sessions;i++){const r=sideWork(at({...x,energy:90},1140,t+i),o.id);assert(r.ok,r.error);x=r.state;if(i===0)assert(!sideWork(x,o.id).ok,'một buổi mỗi ngày')}
assert.equal(x.money,o.pay);assert.equal(sideOf(x).rep,55);assert(!sideOf(x).orders.some(a=>a.id===o.id));
assert(engine.valid(x));assert(engine.parse(JSON.stringify(x)));
// nộp trễ (sau hạn): trả 70%, uy tín -5
let y=w;for(let i=0;i<SIDE.sessions;i++){const r=sideWork(at({...y,energy:90},1140,o.due+1+i),o.id);assert(r.ok,r.error);y=r.state}
assert.equal(y.money,Math.round(o.pay*0.7));assert.equal(sideOf(y).rep,45);
// quá hạn 3 ngày: huỷ, uy tín -10
const dead=settleSide({...w,day:o.due+SIDE.grace+1});assert(!sideOf(dead).orders.some(a=>a.id===o.id));assert.equal(sideOf(dead).rep,40);
console.log('side ok');
