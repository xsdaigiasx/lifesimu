/**
 * Kỹ năng Lv 1–10 (chủ dự án chốt 04/11, bỏ hệ cấp nội bộ 1–50).
 * XP để lên từ Lv n sang n+1 = xpBase × n^xpExponent, làm tròn (mặc định 80 × n^1,6),
 * khớp `app/src/domain/skill-xp.ts`.
 */
import { DEFAULT_CONFIG, type EngineConfig } from './config';

export interface SkillState {
  level: number;
  xp: number;
}

export function xpToNext(level: number, cfg: EngineConfig = DEFAULT_CONFIG): number {
  if (!Number.isInteger(level) || level < 1) throw new RangeError(`Cấp kỹ năng không hợp lệ: ${level}`);
  return Math.round(cfg.skills.xpBase * Math.pow(level, cfg.skills.xpExponent));
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

/** Lv dùng cho công thức trong tài liệu thiết kế; với hệ 1–10 thì chính là cấp. */
export function effectiveLevel(level: number, cfg: EngineConfig = DEFAULT_CONFIG): number {
  return Math.min(cfg.skills.maxLevel, Math.max(0, level));
}
