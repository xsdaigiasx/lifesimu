const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../.test-build/domain/time');const {MODES}=require('../.test-build/domain/travel');const F=require('../.test-build/domain/fitness');const {engine}=require('../.test-build/domain/engine');const {lifeOf}=require('../.test-build/domain/life');
const base=(extra={})=>({...engine.initial(),day:10,energy:80,money:2_000_000,clock:{...T.clockOf(engine.initial()),location:'home',minute:600},...extra});
const IDS=['home','office','market','mall','bank','hospital','bus','park','streetfood','restaurant','apartments','villa'];
const far=(()=>{let best=null;for(const a of IDS)for(const b of IDS)if(a<b){const m=T.route(a,b).meters;if(!best||m>best.m)best={a,b,m}}return best})();
test('hệ số: đi bộ 3, xe đạp 1,5, các xe khác không tốn sức',()=>{assert.equal(MODES.walk.energyPerKm,3);assert.equal(MODES.bicycle.energyPerKm,1.5);for(const m of ['bus','motorbike','taxi'])assert.equal(MODES[m].energyPerKm,0)});
test('đi bộ tốn năng lượng theo quãng đường, xe buýt và taxi không',()=>{
 assert.ok(far.m>=1000,'cần một cặp nơi xa ít nhất 1 km để thử: '+far.m);
 const s=base({clock:{...base().clock,location:far.a}});const opts=T.travelOptions(s,far.a,far.b),walk=opts.find(o=>o.mode==='walk');
 assert.equal(walk.energy,Math.round(far.m/1000*3));
 const r=T.goTo(s,far.b,'walk');assert.ok(r.ok,r.error);assert.equal(r.state.energy,80-walk.energy);
 const rb=T.goTo(s,far.b,'bus');assert.ok(rb.ok);assert.equal(rb.state.energy,80,'xe buýt không tốn sức');
 const rt=T.goTo(s,far.b,'taxi');assert.ok(rt.ok);assert.equal(rt.state.energy,80);
});
test('Thể lực cao giảm hao khi đi bộ',()=>{
 const s=base({clock:{...base().clock,location:far.a}}),fit={...s,life:{...lifeOf(s),fit:{value:100,at:10,last:10,gainDay:0,gained:0}}};
 const e=x=>T.travelOptions(x,far.a,far.b).find(o=>o.mode==='walk').energy;assert.ok(e(fit)<e(s),`${e(fit)} < ${e(s)}`);
});
test('chuyến đi bộ từ 1 km cộng Thể lực nhẹ, chuyến xe thì không; chung trần mỗi ngày',()=>{
 const s=base({clock:{...base().clock,location:far.a}});
 const r=T.goTo(s,far.b,'walk');assert.ok(r.ok);assert.equal(F.fitValue(r.state),1);
 const rb=T.goTo(s,far.b,'bus');assert.ok(rb.ok);assert.equal(F.fitValue(rb.state),0);
 let n=s;for(let i=0;i<8;i++){const a=T.goTo({...n,clock:{...n.clock,location:far.a,minute:600}},far.b,'walk');assert.ok(a.ok);n=a.state}
 assert.ok(F.fitValue(n)<=5,'trần +5 mỗi ngày: '+F.fitValue(n));
});
test('lưu và nạp lại giữ hợp lệ',()=>{const s=base({clock:{...base().clock,location:far.a}}),r=T.goTo(s,far.b,'walk');assert.ok(r.ok);assert.ok(engine.valid(r.state));assert.ok(engine.parse(JSON.stringify(r.state)))});
