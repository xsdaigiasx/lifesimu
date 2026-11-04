/**
 * Save có phiên bản và migration (T04).
 * - Phiên bản 1: định dạng của bản build v0.35 (khoá localStorage `life-simulator-vi-v1`).
 * - Phiên bản 2: định dạng của lõi engine mới (file này).
 * Migration là hàm thuần, chạy theo chuỗi 1 -> 2 -> ... -> hiện tại. Mọi dữ liệu mà
 * lõi chưa hiểu (công việc, văn phòng, quan hệ, nhật ký…) được giữ nguyên trong
 * `legacy` để không mất gì; từng ticket sau sẽ chuyển dần từng phần ra khỏi `legacy`.
 */
import { DEFAULT_CONFIG, type EngineConfig } from './config';
import { applyTx, emptyLedger, txIds, verifyLedger, type ApplyResult, type TxInput } from './ledger';
import { formatIssues, s, validate, type Infer, type Issue } from './schema';
import { addSkillXp, xpToNext } from './skills';

export const CURRENT_SAVE_VERSION = 2;
export const LEGACY_STORAGE_KEY = 'life-simulator-vi-v1';

const int32 = s.int({ min: -2147483648, max: 4294967295 });
const idString = s.str({ min: 1, max: 64, pattern: /^[A-Za-z0-9_.-]+$/ });

const rngStateSchema = s.obj({ a: int32, b: int32, c: int32, d: int32 });

const txRecordSchema = s.obj({
  seq: s.int({ min: 1 }),
  txId: s.str({ min: 1, max: 120 }),
  day: s.int({ min: 0 }),
  minuteOfDay: s.int({ min: 0, max: 1439 }),
  kind: s.str({ min: 1, max: 41 }),
  legs: s.arr(s.obj({ account: s.str({ min: 1, max: 41 }), delta: s.int() }), { min: 1, max: 8 }),
  memo: s.str({ max: 200 }),
  fingerprint: s.str({ max: 2000 }),
});

const ledgerSchema = s.obj({
  nextSeq: s.int({ min: 1 }),
  balances: s.rec(s.int({ min: 0 })),
  opening: s.rec(s.int({ min: 0 })),
  entries: s.arr(txRecordSchema),
  seen: s.rec(s.str({ max: 2000 })),
});

const vital = s.int({ min: 0, max: 100 });

export const saveV2Schema = s.obj({
  version: s.lit(2),
  meta: s.obj({
    playthroughId: idString,
    seed: s.str({ min: 1, max: 120 }),
    appVersion: s.str({ max: 40 }),
    migrations: s.arr(s.obj({ from: s.int({ min: 1 }), to: s.int({ min: 2 }), note: s.opt(s.str({ max: 300 })) }), {
      max: 50,
    }),
  }),
  clock: s.obj({
    day: s.int({ min: 0, max: 1_000_000 }),
    minuteOfDay: s.int({ min: 0, max: 1439 }),
    location: s.str({ min: 1, max: 40 }),
  }),
  rng: s.rec(rngStateSchema, { max: 64 }),
  ledger: ledgerSchema,
  /** `fullness` là chỉ số No (độ no), mới có từ v2. */
  vitals: s.obj({ energy: vital, fullness: vital, mood: vital, stress: vital, health: vital }),
  skills: s.rec(s.obj({ level: s.int({ min: 1, max: 200 }), xp: s.int({ min: 0 }) }), { max: 32 }),
  inventory: s.obj({ owned: s.arr(s.str({ max: 60 }), { max: 500 }), equipped: s.arr(s.str({ max: 60 }), { max: 500 }) }),
  flags: s.rec(s.union(s.bool(), s.num(), s.str({ max: 200 })), { max: 500 }),
  /** Dữ liệu của bản build cũ mà lõi chưa hiểu; được giữ nguyên, chuyển dần theo từng ticket. */
  legacy: s.rec(s.unknown(), { max: 64 }),
});

export type SaveV2 = Infer<typeof saveV2Schema>;
export type Save = SaveV2;

// ---------------------------------------------------------------------------
// Ván mới

export interface NewGameOptions {
  seed: string;
  playthroughId: string;
  appVersion?: string;
  config?: EngineConfig;
}

export function newGame(opts: NewGameOptions): SaveV2 {
  const cfg = opts.config ?? DEFAULT_CONFIG;
  const skills: SaveV2['skills'] = {};
  for (const id of cfg.skills.ids) skills[id] = { level: cfg.skills.initialLevels[id] ?? 1, xp: 0 };

  let ledger = emptyLedger();
  if (cfg.economy.startMoney > 0) {
    ledger = applyTx(ledger, {
      txId: txIds.opening(),
      day: 0,
      kind: 'init',
      legs: [{ account: 'wallet', delta: cfg.economy.startMoney }],
      memo: 'Số tiền ban đầu',
    }).state;
  }

  const save: SaveV2 = {
    version: 2,
    meta: { playthroughId: opts.playthroughId, seed: opts.seed, appVersion: opts.appVersion ?? '0.36.0-core', migrations: [] },
    clock: { day: 0, minuteOfDay: cfg.clock.defaultStartMinute, location: 'home' },
    rng: {},
    ledger,
    vitals: { ...cfg.vitals.initial },
    skills,
    inventory: { owned: [], equipped: [] },
    flags: {},
    legacy: {},
  };
  return assertValidSave(save, cfg);
}

// ---------------------------------------------------------------------------
// Kiểm tra save

export function checkSaveInvariants(save: SaveV2, cfg: EngineConfig = DEFAULT_CONFIG): Issue[] {
  const issues: Issue[] = [];
  const bad = (path: string, message: string): void => void issues.push({ path, message });

  for (const id of cfg.skills.ids) {
    const skill = save.skills[id];
    if (!skill) {
      bad(`skills.${id}`, 'thiếu kỹ năng');
      continue;
    }
    if (skill.level > cfg.skills.maxLevel) bad(`skills.${id}.level`, `vượt cấp tối đa ${cfg.skills.maxLevel}`);
    else if (skill.level === cfg.skills.maxLevel ? skill.xp !== 0 : skill.xp >= xpToNext(skill.level, cfg)) {
      bad(`skills.${id}.xp`, 'XP không khớp với cấp (ở cấp tối đa phải bằng 0, còn lại phải nhỏ hơn XP lên cấp)');
    }
  }
  for (const [name, value] of Object.entries(save.vitals)) {
    if (value > cfg.vitals.max) bad(`vitals.${name}`, 'vượt giá trị tối đa');
  }
  const { owned, equipped } = save.inventory;
  if (new Set(owned).size !== owned.length) bad('inventory.owned', 'có món bị lặp');
  if (new Set(equipped).size !== equipped.length) bad('inventory.equipped', 'có món bị lặp');
  for (const item of equipped) if (!owned.includes(item)) bad('inventory.equipped', `"${item}" chưa sở hữu`);
  for (const problem of verifyLedger(save.ledger)) bad('ledger', problem);
  return issues;
}

export function assertValidSave(value: unknown, cfg: EngineConfig = DEFAULT_CONFIG): SaveV2 {
  const shape = validate(saveV2Schema, value);
  if (!shape.ok) throw new Error(`Save không hợp lệ: ${formatIssues(shape.issues)}`);
  const issues = checkSaveInvariants(shape.value, cfg);
  if (issues.length > 0) throw new Error(`Save không nhất quán: ${formatIssues(issues)}`);
  return shape.value;
}

export function serializeSave(save: SaveV2, cfg: EngineConfig = DEFAULT_CONFIG): string {
  return JSON.stringify(assertValidSave(save, cfg));
}

// ---------------------------------------------------------------------------
// Thao tác tiện lợi trên save

/** Áp dụng một giao dịch tiền vào save (idempotent theo txId). */
export function applySaveTx(save: SaveV2, tx: TxInput): { save: SaveV2; result: ApplyResult } {
  const { state, result } = applyTx(save.ledger, tx);
  return { save: result.status === 'applied' ? { ...save, ledger: state } : save, result };
}

export function walletBalance(save: SaveV2): number {
  return save.ledger.balances['wallet'] ?? 0;
}

export function gainSkillXp(save: SaveV2, skillId: string, amount: number, cfg: EngineConfig = DEFAULT_CONFIG): SaveV2 {
  const current = save.skills[skillId];
  if (!current) throw new RangeError(`Kỹ năng không tồn tại: ${skillId}`);
  return { ...save, skills: { ...save.skills, [skillId]: addSkillXp(current, amount, cfg) } };
}

// ---------------------------------------------------------------------------
// Migration

export interface MigrationContext {
  /** Save v1 không có ID lượt chơi; nếu không truyền thì dùng "legacy-v1". */
  playthroughId?: string;
  /** Save v1 không có seed; nếu không truyền thì dùng "legacy:<playthroughId>". */
  seed?: string;
  config?: EngineConfig;
}

const legacyV1Schema = s.obj({
  version: s.lit(1),
  day: s.int({ min: 0, max: 100_000 }),
  money: s.int({ min: 0 }),
  energy: vital,
  mood: vital,
  health: vital,
  stress: vital,
  xp: s.int({ min: 0 }),
  owned: s.arr(s.str({ max: 60 })),
  equipped: s.arr(s.str({ max: 60 })),
  ledger: s.arr(s.obj({ name: s.str({ max: 200 }), amount: s.int(), day: s.int({ min: 0 }) }), { max: 100 }),
  lastReport: s.opt(s.unknown()),
  life: s.opt(s.unknown()),
  home: s.opt(s.unknown()),
  officeItems: s.opt(s.unknown()),
  social: s.opt(s.unknown()),
  work: s.opt(s.unknown()),
  journal: s.opt(s.unknown()),
  officeLayout: s.opt(s.unknown()),
  office: s.opt(s.unknown()),
  fishing: s.opt(s.unknown()),
  bauCuaLast: s.opt(s.unknown()),
  skills: s.opt(s.rec(s.obj({ level: s.int({ min: 1, max: 50 }), xp: s.int({ min: 0 }) }))), // hệ cũ 1–50
  clock: s.opt(
    s.obj({
      minute: s.int({ min: 420, max: 1320 }),
      location: s.str({ min: 1, max: 40 }),
      lastWorkDay: s.int({ min: -1 }),
      lastStudyDay: s.int({ min: -1 }),
      lastRestDay: s.int({ min: -1 }),
    }),
  ),
});

type LegacyV1 = Infer<typeof legacyV1Schema>;

const LEGACY_PASSTHROUGH_KEYS = [
  'lastReport',
  'life',
  'home',
  'officeItems',
  'social',
  'work',
  'journal',
  'officeLayout',
  'office',
  'fishing',
  'bauCuaLast',
] as const;

export class MigrationError extends Error {
  constructor(
    message: string,
    readonly issues: Issue[] = [],
  ) {
    super(message);
    this.name = 'MigrationError';
  }
}

export function migrateV1ToV2(old: unknown, ctx: MigrationContext = {}): SaveV2 {
  const cfg = ctx.config ?? DEFAULT_CONFIG;
  const shape = validate(legacyV1Schema, old);
  if (!shape.ok) throw new MigrationError(`Save v1 không hợp lệ: ${formatIssues(shape.issues)}`, shape.issues);
  const v1: LegacyV1 = shape.value;

  const equippedMissing = v1.equipped.filter((item) => !v1.owned.includes(item));
  if (
    equippedMissing.length > 0 ||
    new Set(v1.owned).size !== v1.owned.length ||
    new Set(v1.equipped).size !== v1.equipped.length
  ) {
    throw new MigrationError('Save v1 không nhất quán: danh sách đồ sở hữu hoặc đang dùng sai');
  }

  const playthroughId = ctx.playthroughId ?? 'legacy-v1';
  const seed = ctx.seed ?? `legacy:${playthroughId}`;

  // Tiền: chuyển số dư cũ thành giao dịch mở đầu có mã cố định (idempotent nếu chạy lại).
  let ledger = emptyLedger();
  if (v1.money > 0) {
    ledger = applyTx(ledger, {
      txId: txIds.migrate('v1-opening'),
      day: v1.day,
      kind: 'migration',
      legs: [{ account: 'wallet', delta: v1.money }],
      memo: 'Số dư chuyển từ save v1',
    }).state;
  }

  // Kỹ năng: giữ nguyên cấp và XP; thêm kỹ năng mới (nấu ăn) ở cấp đầu; chuẩn hoá XP dư.
  const skills: SaveV2['skills'] = {};
  for (const id of cfg.skills.ids) {
    const fromV1 = v1.skills?.[id];
    // Save v1 dùng cấp 1–50; quy về Lv 1–10 (cấp / 5, làm tròn, tối thiểu 1) và bỏ XP lẻ của hệ cũ.
    const level = fromV1 ? Math.max(1, Math.round(fromV1.level / 5)) : (cfg.skills.initialLevels[id] ?? 1);
    skills[id] = { level: Math.min(level, cfg.skills.maxLevel), xp: 0 };
  }

  // Giữ nguyên mọi phần lõi chưa hiểu, kể cả kỹ năng lạ không có trong cấu hình mới.
  const legacy: Record<string, unknown> = { xp: v1.xp, ledgerDisplay: v1.ledger };
  for (const key of LEGACY_PASSTHROUGH_KEYS) if (v1[key] !== undefined) legacy[key] = v1[key];
  if (v1.clock) {
    legacy['clockExtras'] = {
      lastWorkDay: v1.clock.lastWorkDay,
      lastStudyDay: v1.clock.lastStudyDay,
      lastRestDay: v1.clock.lastRestDay,
    };
  }
  const unknownSkills = Object.fromEntries(Object.entries(v1.skills ?? {}).filter(([id]) => !cfg.skills.ids.includes(id)));
  if (Object.keys(unknownSkills).length > 0) legacy['unknownSkills'] = unknownSkills;

  return {
    version: 2,
    meta: {
      playthroughId,
      seed,
      appVersion: '0.36.0-core',
      migrations: [
        { from: 1, to: 2, note: `chỉ số No (fullness) đặt mặc định ${cfg.vitals.initial.fullness}; kỹ năng mới đặt cấp đầu` },
      ],
    },
    clock: {
      day: v1.day,
      minuteOfDay: v1.clock?.minute ?? cfg.clock.defaultStartMinute,
      location: v1.clock?.location ?? 'home',
    },
    rng: {},
    ledger,
    vitals: { energy: v1.energy, fullness: cfg.vitals.initial.fullness, mood: v1.mood, stress: v1.stress, health: v1.health },
    skills,
    inventory: { owned: [...v1.owned], equipped: [...v1.equipped] },
    flags: {},
    legacy,
  };
}

type Migrator = (old: unknown, ctx: MigrationContext) => unknown;

/** MIGRATIONS[n] biến save phiên bản n thành phiên bản n + 1. */
const MIGRATIONS: Readonly<Record<number, Migrator>> = {
  1: (old, ctx) => migrateV1ToV2(old, ctx),
};

export type LoadResult =
  | { ok: true; save: SaveV2; migratedFrom: number | null }
  | { ok: false; error: string; issues: Issue[] };

function readVersion(value: unknown): number | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const version = (value as { version?: unknown }).version;
  return typeof version === 'number' && Number.isInteger(version) ? version : undefined;
}

/** Đọc save từ chuỗi JSON hoặc object; tự migration lên phiên bản hiện tại. Không bao giờ ném lỗi. */
export function parseSave(raw: unknown, ctx: MigrationContext = {}): LoadResult {
  const cfg = ctx.config ?? DEFAULT_CONFIG;
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return { ok: false, error: 'Save không phải JSON hợp lệ', issues: [] };
    }
  }

  const version = readVersion(value);
  if (version === undefined) return { ok: false, error: 'Không nhận ra phiên bản save', issues: [] };
  if (version > CURRENT_SAVE_VERSION) {
    return { ok: false, error: `Save phiên bản ${version} mới hơn bản game này (${CURRENT_SAVE_VERSION})`, issues: [] };
  }
  if (version < 1) return { ok: false, error: `Phiên bản save không được hỗ trợ: ${version}`, issues: [] };

  let migratedFrom: number | null = null;
  try {
    for (let v = version; v < CURRENT_SAVE_VERSION; v++) {
      const migrate = MIGRATIONS[v];
      if (!migrate) return { ok: false, error: `Thiếu migration từ phiên bản ${v}`, issues: [] };
      value = migrate(value, ctx);
      migratedFrom ??= version;
    }
  } catch (error) {
    if (error instanceof MigrationError) return { ok: false, error: error.message, issues: error.issues };
    return { ok: false, error: `Migration lỗi: ${error instanceof Error ? error.message : String(error)}`, issues: [] };
  }

  const shape = validate(saveV2Schema, value);
  if (!shape.ok) return { ok: false, error: `Save không hợp lệ: ${formatIssues(shape.issues)}`, issues: shape.issues };
  const issues = checkSaveInvariants(shape.value, cfg);
  if (issues.length > 0) return { ok: false, error: `Save không nhất quán: ${formatIssues(issues)}`, issues };
  return { ok: true, save: shape.value, migratedFrom };
}
