/**
 * Đồng hồ và lịch của game (T02).
 * Đồng hồ game là NGUỒN THỜI GIAN DUY NHẤT: không dùng giờ thật cho tiến độ,
 * hạn dùng, lương hay lãi. Ngày 0 là ngày bắt đầu (hiển thị là "Ngày 1").
 */

export const MINUTES_PER_DAY = 1440;

export interface GameTime {
  /** Chỉ số ngày bắt đầu từ 0. */
  day: number;
  /** Phút trong ngày, 0..1439. */
  minuteOfDay: number;
}

export interface CalendarConfig {
  /** Ngày dương lịch của ngày 0, dạng YYYY-MM-DD. */
  startDate: string;
}

export interface CalendarDate {
  year: number;
  month: number;
  dayOfMonth: number;
  /** 1 = Thứ Hai ... 7 = Chủ nhật. */
  weekday: number;
  /** Dạng YYYY-MM, dùng làm khoá cho lương, tiền thuê hằng tháng. */
  monthKey: string;
}

export interface Shift {
  id: string;
  start: number;
  end: number;
}

const WEEKDAY_VI = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'] as const;
const MS_PER_DAY = 86_400_000;

export function assertTime(t: GameTime): void {
  if (!Number.isSafeInteger(t.day) || t.day < 0) throw new RangeError(`GameTime.day không hợp lệ: ${t.day}`);
  if (!Number.isInteger(t.minuteOfDay) || t.minuteOfDay < 0 || t.minuteOfDay >= MINUTES_PER_DAY) {
    throw new RangeError(`GameTime.minuteOfDay không hợp lệ: ${t.minuteOfDay}`);
  }
}

export function absoluteMinutes(t: GameTime): number {
  assertTime(t);
  return t.day * MINUTES_PER_DAY + t.minuteOfDay;
}

export function fromAbsolute(total: number): GameTime {
  if (!Number.isSafeInteger(total) || total < 0) throw new RangeError(`Số phút tuyệt đối không hợp lệ: ${total}`);
  return { day: Math.floor(total / MINUTES_PER_DAY), minuteOfDay: total % MINUTES_PER_DAY };
}

/** Tiến thời gian lên một số phút nguyên không âm. */
export function advance(t: GameTime, minutes: number): GameTime {
  if (!Number.isSafeInteger(minutes) || minutes < 0) throw new RangeError(`Số phút phải là số nguyên >= 0: ${minutes}`);
  return fromAbsolute(absoluteMinutes(t) + minutes);
}

export function compareTime(a: GameTime, b: GameTime): number {
  return absoluteMinutes(a) - absoluteMinutes(b);
}

/** Các ngày mới được bước vào khi đi từ `from` tới `to` (không gồm ngày của `from`). */
export function daysEntered(from: GameTime, to: GameTime): number[] {
  if (compareTime(to, from) < 0) throw new RangeError('daysEntered: `to` phải không sớm hơn `from`');
  const out: number[] = [];
  for (let day = from.day + 1; day <= to.day; day++) out.push(day);
  return out;
}

function parseStartDate(startDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate);
  if (!match) throw new RangeError(`startDate phải dạng YYYY-MM-DD: ${startDate}`);
  const [year, month, dom] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const ms = Date.UTC(year, month - 1, dom);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== dom) {
    throw new RangeError(`startDate không phải ngày hợp lệ: ${startDate}`);
  }
  return ms;
}

export function dateOfDay(day: number, cfg: CalendarConfig): CalendarDate {
  if (!Number.isSafeInteger(day) || day < 0) throw new RangeError(`Ngày không hợp lệ: ${day}`);
  const date = new Date(parseStartDate(cfg.startDate) + day * MS_PER_DAY);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return {
    year,
    month,
    dayOfMonth: date.getUTCDate(),
    weekday: ((date.getUTCDay() + 6) % 7) + 1,
    monthKey: `${year}-${String(month).padStart(2, '0')}`,
  };
}

export function isFirstOfMonth(day: number, cfg: CalendarConfig): boolean {
  return dateOfDay(day, cfg).dayOfMonth === 1;
}

export function isWeekend(day: number, cfg: CalendarConfig): boolean {
  return dateOfDay(day, cfg).weekday >= 6;
}

export function formatTime(minuteOfDay: number): string {
  if (!Number.isInteger(minuteOfDay) || minuteOfDay < 0 || minuteOfDay >= MINUTES_PER_DAY) {
    throw new RangeError(`Phút trong ngày không hợp lệ: ${minuteOfDay}`);
  }
  const h = Math.floor(minuteOfDay / 60);
  const m = minuteOfDay % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Ví dụ: "Thứ Sáu, 06 tháng 11". */
export function formatDateVi(day: number, cfg: CalendarConfig): string {
  const d = dateOfDay(day, cfg);
  return `${WEEKDAY_VI[d.weekday - 1]}, ${String(d.dayOfMonth).padStart(2, '0')} tháng ${String(d.month).padStart(2, '0')}`;
}

export function shiftAt(shifts: readonly Shift[], minuteOfDay: number): Shift | undefined {
  return shifts.find((shift) => minuteOfDay >= shift.start && minuteOfDay < shift.end);
}
