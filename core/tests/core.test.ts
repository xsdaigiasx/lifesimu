import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Rng,
  RngHub,
  advance,
  dateOfDay,
  daysEntered,
  formatDateVi,
  formatTime,
  isFirstOfMonth,
  applyTx,
  applyTxs,
  emptyLedger,
  compactLedger,
  verifyLedger,
  txIds,
  DEFAULT_CONFIG,
  parseConfig,
  addSkillXp,
  xpToNext,
  effectiveLevel,
  newGame,
  parseSave,
  serializeSave,
  applySaveTx,
  walletBalance,
  gainSkillXp,
  runSim,
  CURRENT_SAVE_VERSION,
  s,
  validate,
  type SaveV2,
  type SimContext,
} from '../src/index';

// ---------- T01: schema và cấu hình

test('T01: schema bắt trường thiếu, thừa, sai kiểu', () => {
  const sch = s.obj({ a: s.int({ min: 0 }), b: s.opt(s.str()) });
  assert.equal(validate(sch, { a: 1 }).ok, true);
  const bad = validate(sch, { a: -1, c: 2 });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.equal(bad.issues.length, 2);
  assert.equal(validate(sch, {}).ok, false);
});

test('T01: cấu hình sai bị từ chối', () => {
  const cfg = structuredClone(DEFAULT_CONFIG) as { clock: { shifts: unknown[] } };
  cfg.clock.shifts = [{ id: 'x', start: 600, end: 500 }];
  assert.throws(() => parseConfig(cfg), /không nhất quán/);
  assert.throws(() => parseConfig({}), /không hợp lệ/);
});

// ---------- T02: RNG và đồng hồ

test('T02: cùng seed cho cùng dãy; khôi phục trạng thái tiếp tục đúng', () => {
  const a = Rng.fromSeed('abc');
  const b = Rng.fromSeed('abc');
  const seqA = Array.from({ length: 50 }, () => a.next());
  const seqB = Array.from({ length: 50 }, () => b.next());
  assert.deepEqual(seqA, seqB);
  const snap = a.snapshot();
  const x = a.int(1, 100);
  assert.equal(new Rng(snap).int(1, 100), x);
  assert.notEqual(Rng.fromSeed('abd').next(), Rng.fromSeed('abc').next());
});

test('T02: các dòng RNG độc lập với thứ tự gọi', () => {
  const h1 = new RngHub('s');
  h1.stream('npc').next();
  const w1 = h1.stream('work').next();
  const h2 = new RngHub('s');
  const w2 = h2.stream('work').next();
  assert.equal(w1, w2);
});

test('T02: phân bố RNG hợp lý', () => {
  const r = Rng.fromSeed('dist');
  const counts = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 60000; i++) counts[r.int(0, 5)]! += 1;
  for (const c of counts) assert.ok(c > 9000 && c < 11000, `phân bố lệch: ${counts.join(',')}`);
});

test('T02: đồng hồ và lịch', () => {
  assert.deepEqual(advance({ day: 0, minuteOfDay: 1400 }, 100), { day: 1, minuteOfDay: 60 });
  assert.deepEqual(daysEntered({ day: 0, minuteOfDay: 0 }, { day: 2, minuteOfDay: 5 }), [1, 2]);
  const cal = { startDate: '2026-11-02' };
  assert.equal(dateOfDay(0, cal).weekday, 1); // 2/11/2026 là Thứ Hai
  assert.equal(formatDateVi(4, cal), 'Thứ Sáu, 06 tháng 11');
  assert.equal(isFirstOfMonth(29, cal), true); // 1/12/2026
  assert.equal(dateOfDay(29, cal).monthKey, '2026-12');
  assert.equal(formatTime(1200), '20:00');
  assert.throws(() => advance({ day: 0, minuteOfDay: 0 }, -1));
  assert.throws(() => dateOfDay(0, { startDate: '2026-02-30' }));
});

// ---------- T03: sổ cái

test('T03: giao dịch idempotent theo txId', () => {
  let l = emptyLedger();
  const tx = {
    txId: txIds.salary('2026-12', 'acme'),
    day: 29,
    kind: 'salary',
    legs: [{ account: 'wallet', delta: 9_000_000 }],
  };
  const r1 = applyTx(l, tx);
  l = r1.state;
  const r2 = applyTx(l, tx);
  assert.equal(r1.result.status, 'applied');
  assert.equal(r2.result.status, 'duplicate');
  assert.equal(r2.state.balances['wallet'], 9_000_000);
  assert.equal(r2.state, l); // bản trùng không tạo state mới
});

test('T03: không cho âm, xung đột txId, giao dịch nhóm nguyên tử', () => {
  const l = applyTx(emptyLedger(), { txId: 'a', day: 0, kind: 'init', legs: [{ account: 'wallet', delta: 100 }] }).state;
  const neg = applyTx(l, { txId: 'b', day: 0, kind: 'buy', legs: [{ account: 'wallet', delta: -200 }] });
  assert.equal(neg.result.status, 'rejected');
  if (neg.result.status === 'rejected') assert.equal(neg.result.code, 'insufficient_funds');
  const conflict = applyTx(l, { txId: 'a', day: 0, kind: 'init', legs: [{ account: 'wallet', delta: 999 }] });
  assert.equal(conflict.result.status, 'rejected');
  if (conflict.result.status === 'rejected') assert.equal(conflict.result.code, 'txid_conflict');
  const batch = applyTxs(l, [
    { txId: 'c', day: 0, kind: 'buy', legs: [{ account: 'wallet', delta: -50 }] },
    { txId: 'd', day: 0, kind: 'buy', legs: [{ account: 'wallet', delta: -60 }] },
  ]);
  assert.equal(batch.ok, false);
  assert.equal(batch.state.balances['wallet'], 100);
  assert.equal(batch.state.seen['c'], undefined);
});

test('T03: chuyển tiền giữa hai tài khoản trong một giao dịch', () => {
  let l = applyTx(emptyLedger(), { txId: 'a', day: 0, kind: 'init', legs: [{ account: 'wallet', delta: 1000 }] }).state;
  l = applyTx(l, {
    txId: 'dep',
    day: 1,
    kind: 'deposit',
    legs: [
      { account: 'wallet', delta: -400 },
      { account: 'savings', delta: 400 },
    ],
  }).state;
  assert.equal(l.balances['wallet'], 600);
  assert.equal(l.balances['savings'], 400);
  assert.deepEqual(verifyLedger(l), []);
});

test('T03: nén sổ cái vẫn nhất quán và vẫn chống trùng', () => {
  let l = emptyLedger();
  for (let d = 0; d < 10; d++) {
    l = applyTx(l, { txId: `t${d}`, day: d, kind: 'gain', legs: [{ account: 'wallet', delta: 10 }] }).state;
  }
  const c = compactLedger(l, 7);
  assert.equal(c.entries.length, 3);
  assert.deepEqual(verifyLedger(c), []);
  const again = applyTx(c, { txId: 't0', day: 0, kind: 'gain', legs: [{ account: 'wallet', delta: 10 }] });
  assert.equal(again.result.status, 'duplicate');
});

// ---------- Kỹ năng

test('Kỹ năng: lên cấp đúng, trần 50, Lv hiệu dụng', () => {
  assert.equal(xpToNext(1), 100);
  assert.deepEqual(addSkillXp({ level: 1, xp: 0 }, 230), { level: 3, xp: 5 });
  assert.deepEqual(addSkillXp({ level: 49, xp: 0 }, 1e9), { level: 50, xp: 0 });
  assert.equal(effectiveLevel(25), 5);
  assert.equal(effectiveLevel(50), 10);
});

// ---------- T04: save và migration

const v1Sample = (): Record<string, unknown> => ({
  version: 1,
  day: 4,
  money: 470000,
  energy: 60,
  mood: 70,
  health: 88,
  stress: 30,
  xp: 120,
  owned: ['plant'],
  equipped: ['plant'],
  ledger: [{ name: 'Lương', amount: 100000, day: 3 }],
  lastReport: null,
  skills: {
    programming: { level: 4, xp: 30 },
    logic: { level: 3, xp: 0 },
    graphics: { level: 1, xp: 0 },
    management: { level: 1, xp: 0 },
    communication: { level: 1, xp: 0 },
  },
  clock: { minute: 1200, location: 'home', lastWorkDay: 4, lastStudyDay: -1, lastRestDay: 3 },
  social: { anything: [1, 2, 3] },
});

test('T04: ván mới hợp lệ và tuần tự hoá rồi đọc lại y hệt', () => {
  const g = newGame({ seed: 'seed-1', playthroughId: 'p1' });
  assert.equal(g.version, CURRENT_SAVE_VERSION);
  assert.equal(walletBalance(g), DEFAULT_CONFIG.economy.startMoney);
  const back = parseSave(serializeSave(g));
  assert.equal(back.ok, true);
  if (back.ok) {
    assert.deepEqual(back.save, g);
    assert.equal(back.migratedFrom, null);
  }
});

test('T04: migration save v1 (v0.35) giữ tiền, chỉ số, kỹ năng, dữ liệu cũ; không bịa', () => {
  const r = parseSave(JSON.stringify(v1Sample()));
  assert.equal(r.ok, true, r.ok ? '' : r.error);
  if (!r.ok) return;
  const sv = r.save;
  assert.equal(r.migratedFrom, 1);
  assert.equal(walletBalance(sv), 470000);
  assert.equal(sv.clock.day, 4);
  assert.equal(sv.clock.minuteOfDay, 1200);
  assert.equal(sv.vitals.energy, 60);
  assert.equal(sv.vitals.stress, 30);
  assert.equal(sv.vitals.fullness, DEFAULT_CONFIG.vitals.initial.fullness);
  assert.deepEqual(sv.skills['programming'], { level: 4, xp: 30 });
  assert.deepEqual(sv.skills['cooking'], { level: 1, xp: 0 });
  assert.deepEqual(sv.legacy['social'], { anything: [1, 2, 3] });
  assert.deepEqual(sv.legacy['ledgerDisplay'], [{ name: 'Lương', amount: 100000, day: 3 }]);
  assert.deepEqual(sv.inventory.equipped, ['plant']);
  // migration thuần và tất định: chạy lại cho cùng kết quả
  const again = parseSave(JSON.stringify(v1Sample()));
  assert.ok(again.ok);
  if (again.ok) assert.deepEqual(again.save, sv);
});

test('T04: save v1 tối thiểu (chưa có kỹ năng, đồng hồ) vẫn chuyển được', () => {
  const minimal = { version: 1, day: 0, money: 0, energy: 85, mood: 75, health: 90, stress: 20, xp: 0, owned: [], equipped: [], ledger: [] };
  const r = parseSave(minimal);
  assert.equal(r.ok, true, r.ok ? '' : r.error);
  if (r.ok) {
    assert.equal(walletBalance(r.save), 0);
    assert.equal(r.save.clock.minuteOfDay, DEFAULT_CONFIG.clock.defaultStartMinute);
  }
});

test('T04: save hỏng, quá mới hoặc bị sửa tay bị từ chối an toàn, không ném lỗi', () => {
  assert.equal(parseSave('{không phải json').ok, false);
  assert.equal(parseSave({ version: 99 }).ok, false);
  assert.equal(parseSave(null).ok, false);
  const bad = v1Sample();
  bad['equipped'] = ['lamp'];
  assert.equal(parseSave(bad).ok, false);
  const g = structuredClone(newGame({ seed: 's', playthroughId: 'p' })) as SaveV2;
  g.ledger.balances['wallet'] = (g.ledger.balances['wallet'] ?? 0) + 1; // sửa tay số dư
  assert.equal(parseSave(g).ok, false);
});

test('T04: thao tác trên save', () => {
  let g = newGame({ seed: 's', playthroughId: 'p' });
  const buy = { txId: 'buy:1', day: 0, kind: 'purchase', legs: [{ account: 'wallet', delta: -200000 }] };
  g = applySaveTx(g, buy).save;
  g = applySaveTx(g, buy).save;
  assert.equal(walletBalance(g), DEFAULT_CONFIG.economy.startMoney - 200000);
  g = gainSkillXp(g, 'cooking', 150);
  assert.deepEqual(g.skills['cooking'], { level: 2, xp: 50 });
  assert.throws(() => gainSkillXp(g, 'flying', 1));
});

// ---------- T05: mô phỏng

test('T05: mô phỏng 365 ngày tất định theo seed; lương trả đúng một lần mỗi tháng', () => {
  const salaryStep = (save: SaveV2, ctx: SimContext): SaveV2 => {
    let out = save;
    for (const day of ctx.events.daysEntered) {
      const d = dateOfDay(day, ctx.cfg.calendar);
      if (d.dayOfMonth !== ctx.cfg.clock.paydayDayOfMonth) continue;
      // gọi hai lần cố ý: sổ cái phải chặn lần hai
      for (let i = 0; i < 2; i++) {
        out = applySaveTx(out, {
          txId: txIds.salary(d.monthKey, 'acme'),
          day,
          kind: 'salary',
          legs: [{ account: 'wallet', delta: 9_000_000 }],
        }).save;
      }
    }
    return out;
  };
  const noiseStep = (save: SaveV2, ctx: SimContext): SaveV2 => {
    if (!ctx.events.newDay) return save;
    const bonus = ctx.rng.stream('noise').int(0, 3);
    if (bonus === 0) return save;
    const day = ctx.events.time.day;
    return applySaveTx(save, { txId: `noise:${day}`, day, kind: 'gift', legs: [{ account: 'wallet', delta: bonus }] }).save;
  };
  const run = (): SaveV2 =>
    runSim(newGame({ seed: 'sim', playthroughId: 'p' }), {
      minutes: 365 * 1440,
      stepMinutes: 60,
      steps: [salaryStep, noiseStep],
    });
  const a = run();
  const b = run();
  assert.deepEqual(a, b);
  assert.equal(a.clock.day, 365);
  assert.equal(a.ledger.entries.filter((e) => e.kind === 'salary').length, 12);
  assert.deepEqual(verifyLedger(a.ledger), []);
  assert.equal(parseSave(serializeSave(a)).ok, true);
});

test('T05: chạy tiếp từ save giữa chừng cho cùng kết quả như chạy liền', () => {
  const step = (save: SaveV2, ctx: SimContext): SaveV2 => {
    if (!ctx.events.newDay) return save;
    const day = ctx.events.time.day;
    const amt = ctx.rng.stream('x').int(1, 1000);
    return applySaveTx(save, { txId: `x:${day}`, day, kind: 'gift', legs: [{ account: 'wallet', delta: amt }] }).save;
  };
  const start = newGame({ seed: 'resume', playthroughId: 'p' });
  const whole = runSim(start, { minutes: 20 * 1440, steps: [step] });
  const half = runSim(start, { minutes: 10 * 1440, steps: [step] });
  const reloaded = parseSave(serializeSave(half));
  assert.ok(reloaded.ok);
  if (!reloaded.ok) return;
  const rest = runSim(reloaded.save, { minutes: 10 * 1440, steps: [step] });
  assert.deepEqual(rest, whole);
});
