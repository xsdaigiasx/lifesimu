/**
 * Ngẫu nhiên có seed, lưu và khôi phục được trạng thái (T02).
 * Thuật toán sfc32 (nhanh, chất lượng tốt cho game), seed bằng xmur3.
 * Mỗi hệ thống dùng một "dòng" riêng (RngHub.stream) để thứ tự gọi
 * giữa các hệ thống không làm lệch kết quả của nhau.
 */

export interface RngState {
  a: number;
  b: number;
  c: number;
  d: number;
}

function xmur3(text: string): () => number {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(state: RngState) {
    this.a = state.a | 0;
    this.b = state.b | 0;
    this.c = state.c | 0;
    this.d = state.d | 0;
  }

  static fromSeed(seed: string): Rng {
    const next = xmur3(seed);
    const rng = new Rng({ a: next(), b: next(), c: next(), d: next() });
    for (let i = 0; i < 15; i++) rng.next();
    return rng;
  }

  /** Số thực trong [0, 1). */
  next(): number {
    const t = (((this.a + this.b) | 0) + this.d) | 0;
    this.d = (this.d + 1) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + t) | 0;
    return (t >>> 0) / 4294967296;
  }

  /** Số nguyên trong [min, max], gồm cả hai đầu. */
  int(min: number, max: number): number {
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max < min) {
      throw new RangeError(`Rng.int: khoảng không hợp lệ [${min}, ${max}]`);
    }
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(probability: number): boolean {
    if (!(probability >= 0 && probability <= 1)) throw new RangeError(`Rng.chance: xác suất ngoài [0,1]: ${probability}`);
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError('Rng.pick: mảng rỗng');
    return items[this.int(0, items.length - 1)] as T;
  }

  weighted<T>(items: readonly { item: T; weight: number }[]): T {
    let total = 0;
    for (const { weight } of items) {
      if (!(weight >= 0) || !Number.isFinite(weight)) throw new RangeError('Rng.weighted: trọng số không hợp lệ');
      total += weight;
    }
    if (total <= 0) throw new RangeError('Rng.weighted: tổng trọng số phải > 0');
    let roll = this.next() * total;
    for (const { item, weight } of items) {
      if (roll < weight) return item;
      roll -= weight;
    }
    return (items[items.length - 1] as { item: T }).item;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
  }

  snapshot(): RngState {
    return { a: this.a, b: this.b, c: this.c, d: this.d };
  }
}

/** Tập hợp các dòng ngẫu nhiên độc lập, sinh từ một seed gốc. */
export class RngHub {
  private readonly streams = new Map<string, Rng>();

  constructor(
    readonly rootSeed: string,
    saved: Readonly<Record<string, RngState>> = {},
  ) {
    for (const [name, state] of Object.entries(saved)) this.streams.set(name, new Rng(state));
  }

  stream(name: string): Rng {
    let rng = this.streams.get(name);
    if (!rng) {
      rng = Rng.fromSeed(`${this.rootSeed}::${name}`);
      this.streams.set(name, rng);
    }
    return rng;
  }

  snapshot(): Record<string, RngState> {
    const out: Record<string, RngState> = {};
    for (const name of [...this.streams.keys()].sort()) out[name] = (this.streams.get(name) as Rng).snapshot();
    return out;
  }
}
