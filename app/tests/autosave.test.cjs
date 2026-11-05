const assert = require('node:assert/strict');
const {engine} = require('../.test-build/domain/engine');
const {AUTO_KEYS, autoKey, snapshotDay, recoverAuto, clearAuto} = require('../.test-build/domain/autosave');
const {resetLife} = require('../.test-build/domain/reset');
const mk = (init = {}) => { const m = new Map(Object.entries(init)); return {m, getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); }}; };
const at = (day, money = 1) => ({...engine.initial(), day, money});
const st = mk();
// Mỗi ngày game ghi một lần
assert.ok(snapshotDay(st, at(5))); assert.equal(snapshotDay(st, at(5, 99)), false);
assert.ok(snapshotDay(st, at(6))); assert.ok(snapshotDay(st, at(7)));
assert.equal(AUTO_KEYS.length, 3);
assert.equal(recoverAuto(st, engine.parse).day, 7);
// Ngày 8 ghi đè ô của ngày 5 (xoay vòng)
assert.ok(snapshotDay(st, at(8))); assert.equal(recoverAuto(st, engine.parse).day, 8);
assert.equal(JSON.parse(st.getItem(autoKey(8 % 3))).day, 8);
// Ô mới nhất hỏng thì lấy ô tốt kế tiếp
st.setItem(autoKey(8 % 3), '{hỏng'); assert.equal(recoverAuto(st, engine.parse).day, 7);
// Không có gì thì null
assert.equal(recoverAuto(mk(), engine.parse), null);
// Xoá sạch
clearAuto(st); assert.equal(recoverAuto(st, engine.parse), null);
// Bắt đầu đời mới xoá luôn bản tự sao lưu
const s2 = mk({[engine.KEY]: JSON.stringify(at(3))}); snapshotDay(s2, at(3)); assert.ok(recoverAuto(s2, engine.parse));
resetLife(s2, 1e12); assert.equal(recoverAuto(s2, engine.parse), null);
console.log('autosave ok');
