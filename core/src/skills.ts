/**
 * Kỹ năng và đường cong XP (giữ cách tính của bản build v0.35: cấp nội bộ 1..maxLevel,
 * XP cần để lên cấp n+1 = xpBase + xpStep * (n - 1)). Giao diện hiển thị Lv hiệu dụng
 * = cấp / 5 theo tài liệu Phần H mục 73; phần đó là việc của ticket T10.
 */
import { DEFAULT_CONFIG, type EngineConfig } from './config';

export interface SkillState {
  level: number;
  xp: number;
}

export function xpToNext(level: number, cfg: EngineConfig = DEFAULT_CONFIG): number {
  if (!Number.isInteger(level) || level < 1) throw new RangeError(`Cấp kỹ năng không hợp lệ: ${level}`);
  return cfg.skills.xpBase + cfg.skills.xpStep * (level - 1);
}

/** Cộng XP, tự lên cấp, dư XP chuyển sang cấp sau; ở cấp tối đa thì xp luôn là 0. */
export function addSkillXp(skill: SkillState, amount: number, cfg: EngineConfig = DEFAULT_CONFIG): SkillState {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError(`XP phải là số nguyên >= 0: ${amount}`);
  let { level, xp } = skill;
  if (level >= cfg.skills.maxLevel) return { level: cfg.skills.maxLevel, xp: 0 };
  xp += amount;
  while (level < cfg.skills.maxLevel && xp >= xpToNext(level, cfg)) {
    xp -= xpToNext(level, cfg);
    level += 1;
  }
  if (level >= cfg.skills.maxLevel) xp = 0;
  return { level, xp };
}

/** Lv hiệu dụng (1..10) dùng cho mọi công thức trong tài liệu thiết kế. */
export function effectiveLevel(level: number, cfg: EngineConfig = DEFAULT_CONFIG): number {
  return Math.min(10, Math.max(0, (level / cfg.skills.maxLevel) * 10));
}
