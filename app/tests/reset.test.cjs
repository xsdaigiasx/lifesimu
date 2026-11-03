const assert = require('node:assert/strict');
const {engine} = require('../.test-build/domain/engine');
const {PROFILE_KEY} = require('../.test-build/domain/profile');
const {SAVE_KEYS, BACKUP_KEY, BACKUP_DAYS, DAY_MS, archiveCurrent, resetLife, backupInfo, restoreBackup} = require('../.test-build/domain/reset');
const mk = (init = {}) => { const m = new Map(Object.entries(init)); return {m, getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); }}; };
assert.equal(SAVE_KEYS[0], engine.KEY); assert.equal(SAVE_KEYS[2], PROFILE_KEY);
const life = (name, day, money) => ({[engine.KEY]: JSON.stringify({...engine.initial(), day, money}), [SAVE_KEYS[1]]: '{"phone":1}', [PROFILE_KEY]: JSON.stringify({name, gender: 'male', complete: true})});
const T = 1e12;
// Xoá: ba khoá biến mất, bản sao lưu có đủ thông tin.
let st = mk(life('Lâm', 40, 7777777));
assert.ok(resetLife(st, T)); for (const k of SAVE_KEYS) assert.equal(st.getItem(k), null);
let info = backupInfo(st, T + DAY_MS); assert.equal(info.name, 'Lâm'); assert.equal(info.day, 40); assert.equal(info.money, 7777777); assert.equal(info.daysLeft, BACKUP_DAYS - 1);
// Quá 7 ngày: tự dọn.
assert.equal(backupInfo(st, T + BACKUP_DAYS * DAY_MS + 1), null); assert.equal(st.getItem(BACKUP_KEY), null);
// Khôi phục khi không có đời hiện tại: trả lại nguyên vẹn, bỏ ô sao lưu.
st = mk(life('Lâm', 40, 7777777)); resetLife(st, T);
assert.ok(restoreBackup(st, T + 1000)); assert.equal(JSON.parse(st.getItem(engine.KEY)).money, 7777777); assert.equal(st.getItem(BACKUP_KEY), null); assert.equal(st.getItem(SAVE_KEYS[1]), '{"phone":1}');
// Khôi phục khi đang có đời mới: đổi chỗ, không bên nào mất.
st = mk(life('Lâm', 40, 7777777)); resetLife(st, T); for (const [k, v] of Object.entries(life('Nam', 3, 4200000))) st.setItem(k, v);
assert.ok(restoreBackup(st, T + 1000)); assert.equal(JSON.parse(st.getItem(PROFILE_KEY)).name, 'Lâm');
info = backupInfo(st, T + 1000); assert.equal(info.name, 'Nam'); assert.equal(info.money, 4200000);
// Khôi phục lần nữa đổi lại.
assert.ok(restoreBackup(st, T + 2000)); assert.equal(JSON.parse(st.getItem(PROFILE_KEY)).name, 'Nam');
// Không có gì để xoá / không có sao lưu / dữ liệu sao lưu hỏng.
st = mk(); assert.ok(resetLife(st, T)); assert.equal(backupInfo(st, T), null); assert.ok(!restoreBackup(st, T));
st = mk({[BACKUP_KEY]: '{bad'}); assert.equal(backupInfo(st, T), null); assert.ok(!restoreBackup(st, T));
// Sao lưu thất bại thì KHÔNG xoá.
st = mk(life('Lâm', 1, 5)); const bad = {...st, setItem: () => { throw new Error('đầy bộ nhớ'); }};
assert.ok(!resetLife(bad, T)); assert.ok(st.getItem(engine.KEY) !== null && st.getItem(PROFILE_KEY) !== null);
// Đời mới sau khi xoá bắt đầu sạch.
st = mk(life('Lâm', 40, 7777777)); resetLife(st, T); assert.equal(engine.parse(st.getItem(engine.KEY)), null);
console.log('PASS: đời mới — xoá có sao lưu 7 ngày, tự dọn, khôi phục đổi chỗ, lỗi ghi thì không xoá.');
