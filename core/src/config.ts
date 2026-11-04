/**
 * Số liệu cân bằng nằm trong data/config.json (không hard-code trong engine hay giao diện).
 * File này khai báo schema và nạp cấu hình đã kiểm tra.
 */
import rawConfig from '../data/config.json';
import { s, validate, formatIssues, type Infer } from './schema';

const configSchema = s.obj({
  calendar: s.obj({ startDate: s.str({ pattern: /^\d{4}-\d{2}-\d{2}$/ }) }),
  clock: s.obj({
    dayStartMinute: s.int({ min: 0, max: 1439 }),
    dayEndMinute: s.int({ min: 1, max: 1440 }),
    defaultStartMinute: s.int({ min: 0, max: 1439 }),
    shifts: s.arr(
      s.obj({
        id: s.str({ min: 1, max: 40 }),
        start: s.int({ min: 0, max: 1439 }),
        end: s.int({ min: 1, max: 1440 }),
      }),
      { max: 8 },
    ),
    paydayDayOfMonth: s.int({ min: 1, max: 28 }),
  }),
  economy: s.obj({ startMoney: s.int({ min: 0 }) }),
  vitals: s.obj({
    max: s.int({ min: 1, max: 1000 }),
    initial: s.obj({
      energy: s.int({ min: 0 }),
      fullness: s.int({ min: 0 }),
      mood: s.int({ min: 0 }),
      stress: s.int({ min: 0 }),
      health: s.int({ min: 0 }),
    }),
  }),
  skills: s.obj({
    maxLevel: s.int({ min: 2, max: 200 }),
    xpBase: s.int({ min: 1 }),
    xpExponent: s.num({ min: 0, max: 5 }),
    ids: s.arr(s.str({ min: 1, max: 40 }), { min: 1, max: 32 }),
    initialLevels: s.rec(s.int({ min: 1 })),
  }),
});

export type EngineConfig = Infer<typeof configSchema>;

export function parseConfig(raw: unknown): EngineConfig {
  const result = validate(configSchema, raw);
  if (!result.ok) throw new Error(`Cấu hình không hợp lệ: ${formatIssues(result.issues)}`);
  const cfg = result.value;
  const problems: string[] = [];

  const sorted = [...cfg.clock.shifts].sort((a, b) => a.start - b.start);
  sorted.forEach((shift, i) => {
    if (shift.end <= shift.start) problems.push(`ca "${shift.id}" kết thúc không sau giờ bắt đầu`);
    const next = sorted[i + 1];
    if (next && shift.end > next.start) problems.push(`ca "${shift.id}" chồng lên ca "${next.id}"`);
  });
  if (cfg.clock.dayEndMinute <= cfg.clock.dayStartMinute) problems.push('dayEndMinute phải sau dayStartMinute');
  if (new Set(cfg.skills.ids).size !== cfg.skills.ids.length) problems.push('skills.ids bị lặp');
  for (const id of cfg.skills.ids) {
    const level = cfg.skills.initialLevels[id];
    if (level === undefined) problems.push(`thiếu initialLevels cho kỹ năng "${id}"`);
    else if (level > cfg.skills.maxLevel) problems.push(`initialLevels.${id} vượt maxLevel`);
  }
  for (const [name, value] of Object.entries(cfg.vitals.initial)) {
    if (value > cfg.vitals.max) problems.push(`vitals.initial.${name} vượt vitals.max`);
  }
  if (problems.length > 0) throw new Error(`Cấu hình không nhất quán: ${problems.join('; ')}`);
  return cfg;
}

export const DEFAULT_CONFIG: EngineConfig = parseConfig(rawConfig);
