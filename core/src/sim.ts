/**
 * Mô phỏng không giao diện (T05): chạy N phút game với các bước (step) do hệ thống cung cấp.
 * Dùng cho test, cân bằng (3 persona x 12 tháng) và kiểm tra idempotent / tái hiện theo seed.
 */
import { DEFAULT_CONFIG, type EngineConfig } from './config';
import { advance, daysEntered, isFirstOfMonth, type GameTime } from './clock';
import { RngHub } from './rng';
import type { SaveV2 } from './save';

export interface SimEvents {
  time: GameTime;
  newDay: boolean;
  /** Các ngày mới vừa bước vào trong bước này (thường 0 hoặc 1). */
  daysEntered: number[];
  newMonth: boolean;
}

export interface SimContext {
  rng: RngHub;
  cfg: EngineConfig;
  events: SimEvents;
  /** Số thứ tự bước, bắt đầu từ 1. */
  stepIndex: number;
}

/** Một hệ thống nhận save, trả save mới. Không được tự đổi thời gian. */
export type SimStep = (save: SaveV2, ctx: SimContext) => SaveV2;

export interface RunSimOptions {
  minutes: number;
  stepMinutes?: number;
  steps: readonly SimStep[];
  cfg?: EngineConfig;
}

export function runSim(initial: SaveV2, opts: RunSimOptions): SaveV2 {
  const cfg = opts.cfg ?? DEFAULT_CONFIG;
  const stepMinutes = opts.stepMinutes ?? 30;
  if (!Number.isInteger(stepMinutes) || stepMinutes <= 0) throw new RangeError('stepMinutes phải là số nguyên > 0');
  if (!Number.isSafeInteger(opts.minutes) || opts.minutes < 0) throw new RangeError('minutes phải là số nguyên >= 0');

  const hub = new RngHub(initial.meta.seed, initial.rng);
  let save = initial;
  let remaining = opts.minutes;
  let stepIndex = 0;

  while (remaining > 0) {
    const chunk = Math.min(stepMinutes, remaining);
    const before: GameTime = { day: save.clock.day, minuteOfDay: save.clock.minuteOfDay };
    const after = advance(before, chunk);
    const entered = daysEntered(before, after);
    save = { ...save, clock: { ...save.clock, day: after.day, minuteOfDay: after.minuteOfDay } };
    stepIndex += 1;

    const events: SimEvents = {
      time: after,
      newDay: entered.length > 0,
      daysEntered: entered,
      newMonth: entered.some((day) => isFirstOfMonth(day, cfg.calendar)),
    };
    for (const step of opts.steps) save = step(save, { rng: hub, cfg, events, stepIndex });
    remaining -= chunk;
  }

  return { ...save, rng: hub.snapshot() };
}
