const assert=require('node:assert/strict');
const {specOf,foodSpec,deliveryFee,bodyOf,DELIVERY}=require('../.test-build/domain/specs');
const {PRODUCTS,INGREDIENTS}=require('../.test-build/domain/life');
const {HOME_ITEMS,HOME_TIERS}=require('../.test-build/domain/home');
const p=id=>({kind:'product',id}),h=(id,tier='basic')=>({kind:'home',id,tier});
// mọi món đều có thông số và bảng thông tin đủ dòng
for(const id of Object.keys(PRODUCTS)){const s=specOf(p(id));assert(s.rows.length>=4,id);assert(s.rows.every(r=>r.icon&&r.label&&r.value),id);const b=bodyOf(p(id));assert(b.kg>0&&b.cm.every(v=>v>0),id)}
for(const id of Object.keys(HOME_ITEMS))for(const t of Object.keys(HOME_TIERS)){const s=specOf(h(id,t));assert.equal(s.kind,'furniture');assert(s.rows.some(r=>r.label==='Kích thước')&&s.rows.some(r=>r.label==='Cân nặng'))}
for(const id of Object.keys(INGREDIENTS)){const s=foodSpec(id);assert.equal(s.kind,'food');assert(s.rows.some(r=>r.label==='Hạn dùng'))}
// mỗi loại một bộ dòng riêng
assert(specOf(p('tv')).rows.some(r=>r.label==='Điện năng'));
assert(specOf(p('motorbike')).rows.some(r=>r.label==='Tốc độ'));
assert(!specOf(p('casual')).rows.some(r=>r.label==='Điện năng'));
assert(specOf(h('fridge')).rows.some(r=>r.label==='Điện năng'));
assert(!specOf(h('bed')).rows.some(r=>r.label==='Điện năng'));
// phí giao: trong khoảng, nặng và cồng kềnh đắt hơn, không dòng thì 0
assert.equal(deliveryFee([]),0);
assert.equal(deliveryFee([p('coat')]),DELIVERY.min);
assert(deliveryFee([h('wardrobe')])>deliveryFee([h('plant')]));
assert(deliveryFee([p('motorbike')])>deliveryFee([p('tv')]));
assert(deliveryFee([p('scooter'),p('motorbike'),h('wardrobe'),h('bed')])<=DELIVERY.max);
assert(deliveryFee([h('bed','premium')])>=deliveryFee([h('bed','basic')]));
assert.equal(deliveryFee([p('tv')])%1000,0);
console.log('specs ok');
