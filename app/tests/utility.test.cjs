const assert = require('node:assert/strict');
const {engine} = require('../.test-build/domain/engine');
const {billOf, TRO_RATE, WATER, NET, rateFor} = require('../.test-build/domain/utility');
const {homeOf} = require('../.test-build/domain/home');
const {validRent} = require('../.test-build/domain/rent');

const g = engine.initial();
const base = billOf(g);
assert.equal(base.total, base.electricity.reduce((n, l) => n + l.amount, 0) + base.water + base.net);
assert.equal(base.water, WATER.tro); assert.equal(base.net, NET.tro);
for (const l of base.electricity) assert.ok(l.kwh > 0 && l.amount >= 0);

// Thêm tủ lạnh: có dòng riêng, 70 W × 24 h × 30 ngày = 50,4 kWh, tiền điện tăng đúng giá trọ.
const withFridge = {...g, home: {items: [...homeOf(g).items, {id: 'fridge', uid: 'f1', x: 0, y: 5, rotation: 0, placed: true}], grid: 8}};
const bf = billOf(withFridge), fr = bf.electricity.find(l => l.id === 'fridge');
assert.ok(fr, 'tủ lạnh có dòng điện'); assert.equal(fr.kwh, 50.4);
assert.ok(bf.total > base.total);
assert.equal(bf.electricity.reduce((n, l) => n + l.amount, 0), Math.round(rateFor('tro')(bf.kwh) / 1000) * 1000);
assert.equal(Math.round(bf.kwh * TRO_RATE / 1000) * 1000, bf.electricity.reduce((n, l) => n + l.amount, 0));

// Đồ chưa đặt (trong kho) không tốn điện.
const stored = {...withFridge, home: {grid: 8, items: withFridge.home.items.map(i => i.id === 'fridge' ? {...i, placed: false} : i)}};
assert.equal(billOf(stored).total, base.total);

// TV đã mua tốn điện (60 W × 4 h × 30 = 7,2 kWh).
const tv = {...g, life: {...(g.life ?? {version: 1, pantry: [], meals: [], savings: [], loan: null, conditions: [], owned: [], outfit: null, transport: null, daily: {}, lastMeal: null, settledDay: g.day}), owned: ['tv']}};
assert.equal(billOf(tv).electricity.find(l => l.id === 'tv').kwh, 7.2);

// Bậc thang: nhà riêng rẻ hơn trọ ở cùng số kWh, và tăng dần theo bậc.
const tier = rateFor('townhouse');
assert.equal(tier(50), 50 * 2000); assert.equal(tier(100), 50 * 2000 + 50 * 2500); assert.equal(tier(250), 50 * 2000 + 50 * 2500 + 100 * 3000 + 50 * 3500);
assert.ok(tier(60) < rateFor('tro')(60));

// Save: hoá đơn hỏng bị từ chối, hoá đơn đúng được nhận.
const ok = {bill: bf, billedMonth: '2026-11', owed: 0, dueDay: null, notice: null};
assert.ok(validRent(ok, 5)); assert.ok(validRent({...ok, bill: undefined}, 5));
assert.ok(!validRent({...ok, bill: {...bf, total: -1}}, 5)); assert.ok(!validRent({...ok, bill: {...bf, electricity: [{id: 1}]}}, 5));
console.log('utility ok');
