const assert = require('node:assert/strict');
const {engine} = require('../.test-build/domain/engine');
const {finishDay} = require('../.test-build/domain/time');
const {RENT, UTILITY, GRACE_DAYS, startRent, settleRent, monthKey, validRent} = require('../.test-build/domain/rent');

const sleepTo = (s, days) => { for (let i = 0; i < days; i++) { const r = finishDay(s); assert.ok(r.ok, r.error); s = r.state; assert.ok(engine.valid(s), 'save hợp lệ ngày ' + s.day); } return s; };

// Mở đầu: trả tháng đầu và hiện rõ.
const g0 = engine.initial();
const g = startRent(g0);
assert.equal(g.money, g0.money - RENT - UTILITY); assert.equal(g.rent.notice.kind, 'first'); assert.equal(g.rent.owed, 0);
assert.equal(g.ledger[0].amount, -UTILITY); assert.equal(g.ledger[1].amount, -RENT); assert.equal(g.rent.notice.amount, RENT + UTILITY); assert.equal(startRent(g), g, 'không trả lại hai lần'); assert.ok(engine.valid(g));

// Không còn trừ 90.000đ mỗi ngày.
const d1 = sleepTo(g, 1); assert.equal(d1.money, g.money); assert.equal(d1.rent.notice, null);

// Ngày 1 tháng 12 (ngày game 29): tự trả khi đủ tiền, không trả trước đó.
assert.equal(monthKey(28), '2026-11'); assert.equal(monthKey(29), '2026-12');
const rich = {...g, money: 6000000};
const dec1 = sleepTo(rich, 29);
assert.equal(dec1.day, 29); assert.equal(dec1.money, 6000000 - RENT - UTILITY); assert.equal(dec1.rent.notice.kind, 'paid'); assert.equal(dec1.rent.billedMonth, '2026-12');
const next = sleepTo(dec1, 1); assert.equal(next.rent.notice, null); assert.equal(next.money, dec1.money);

// Thiếu tiền: gia hạn 3 ngày, báo còn bao nhiêu ngày, sau đó phạt tinh thần mỗi ngày.
const poor = {...g, money: 100000, mood: 75, stress: 20};
let s = sleepTo(poor, 29);
assert.equal(s.rent.owed, RENT); assert.equal(s.rent.billOwed, UTILITY); assert.equal(s.rent.notice.amount, RENT + UTILITY); assert.equal(s.rent.notice.kind, 'due'); assert.equal(s.rent.notice.daysLeft, GRACE_DAYS); assert.equal(s.money, 100000);
s = sleepTo(s, GRACE_DAYS); assert.equal(s.rent.notice.kind, 'due'); assert.equal(s.rent.notice.daysLeft, 0);
const m0 = s.mood; s = sleepTo(s, 1); assert.equal(s.rent.notice.kind, 'late'); assert.ok(s.mood < Math.min(100, m0 + 8), 'quá hạn thì tâm trạng giảm so với ngủ bình thường');
// Có tiền lại: tự trả hết nợ, không âm.
s = {...s, money: 2000000}; s = sleepTo(s, 1); assert.equal(s.rent.owed, 0); assert.equal(s.rent.billOwed, 0); assert.equal(s.rent.notice.kind, 'paid'); assert.equal(s.money, 2000000 - RENT - UTILITY);

// Save cũ không có rent: không bị tính tiền ngay, tháng sau mới tính.
const old = {...g0, money: 3000000}; delete old.rent;
const o1 = sleepTo(old, 1); assert.equal(o1.money, 3000000); assert.ok(o1.rent && o1.rent.owed === 0);
// Kiểm tra dữ liệu hỏng bị từ chối.
assert.ok(!validRent({billedMonth: 'x', owed: 0, dueDay: null, notice: null}, 5)); assert.ok(!validRent({billedMonth: '2026-11', owed: -1, dueDay: null, notice: null}, 5)); assert.ok(!engine.valid({...g, rent: {billedMonth: '2026-11', owed: 0, dueDay: null, notice: {kind: 'zzz', month: '2026-11', amount: 0, day: 0, daysLeft: 0}}}));
// Mô phỏng 2 năm ở mức tiền vừa đủ: luôn hợp lệ, không âm.
let y = {...g, money: 30000000}; y = sleepTo(y, 400); assert.ok(y.money >= 0);
// Mỗi kỳ trừ đúng một lần, mỗi khoản có mã riêng; áp lại cùng ngày không trừ thêm.
const once = settleRent(dec1); assert.equal(once.money, dec1.money);
const ids = dec1.txIds || []; assert.ok(ids.some(i => i.startsWith('rent:2026-12')) && ids.some(i => i.startsWith('bill:2026-12')));
console.log('PASS: tiền trọ — trả tháng đầu, ngày 1 tự trả, gia hạn 3 ngày, quá hạn, trả bù, save cũ, 400 ngày hợp lệ.');
