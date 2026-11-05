const assert = require('node:assert/strict');
const {engine} = require('../.test-build/domain/engine');
const {MACHINES, machineOf, machineMult} = require('../.test-build/domain/computer');
const {onlineGig, playAtHome, gigPay} = require('../.test-build/domain/home-use');
const {billOf} = require('../.test-build/domain/utility');
const {lifeAction, lifeOf, PRODUCTS} = require('../.test-build/domain/life');
const {clockOf} = require('../.test-build/domain/time');

const base = () => { const g = engine.initial(); return {...g, day: 6, energy: 100, money: 2e7, clock: {...clockOf(g), location: 'home', minute: 480}}; };
const withMachine = id => { const s = base(); return {...s, life: {...lifeOf(s), owned: id ? [id] : []}}; };

assert.equal(machineOf(base()), 'old'); assert.equal(machineMult(base()), .9);
assert.equal(machineOf(withMachine('laptopMid')), 'mid'); assert.equal(machineOf(withMachine('laptopPro')), 'pro');
assert.equal(machineOf({...base(), life: {...lifeOf(base()), owned: ['laptopMid', 'laptopPro']}}), 'pro', 'máy tốt nhất được dùng');

// Làm thêm: máy mạnh trả nhiều hơn máy cũ, cùng thời gian.
const earn = id => { const s = withMachine(id), r = onlineGig(s); assert.ok(r.ok, r.error); return r.state.money - s.money; };
const old = earn(null), mid = earn('laptopMid'), pro = earn('laptopPro');
assert.ok(old < mid && mid < pro, `${old} ${mid} ${pro}`);
assert.equal(mid, Math.round(gigPay(withMachine('laptopMid')) / 1000) * 1000);

// Điện: máy mạnh hao nhiều hơn, máy cũ hao hơn máy tầm trung.
const kwh = id => billOf(withMachine(id)).electricity.find(l => l.id === 'desk').kwh;
assert.ok(kwh('laptopMid') < kwh(null) && kwh(null) < kwh('laptopPro'));

// Giải trí: một lần mỗi ngày, tăng tinh thần, giảm căng thẳng.
const s0 = {...base(), mood: 50, stress: 50}, p = playAtHome(s0);
assert.ok(p.ok, p.error); assert.ok(p.state.mood > 50 && p.state.stress < 50);
assert.equal(playAtHome(p.state).ok, false, 'một lần mỗi ngày');
assert.ok(engine.valid(p.state)); assert.ok(engine.parse(JSON.stringify(p.state)));

// Mua ở TTTM: có thể mua máy mạnh khi đã có máy tầm trung.
const mall = {...withMachine('laptopMid'), clock: {...clockOf(base()), location: 'mall', minute: 600}};
const buy = lifeAction(mall, {kind: 'product', id: 'laptopPro'}); assert.ok(buy.ok, buy.error);
assert.equal(machineOf(buy.state), 'pro'); assert.equal(buy.state.money, mall.money - PRODUCTS.laptopPro.price);
console.log('computer ok');
