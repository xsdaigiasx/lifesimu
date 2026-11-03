/**
 * Bộ kiểm tra dữ liệu nhỏ, không phụ thuộc gói ngoài (T01).
 * Dùng cho: file số liệu (data/*.json), save, và dữ liệu nội dung về sau.
 */

export interface Issue {
  path: string;
  message: string;
}

export interface Schema<T> {
  /** Trường tuỳ chọn: được phép thiếu hoặc undefined. */
  readonly optional?: boolean;
  /** Chỉ để suy ra kiểu TypeScript, không dùng lúc chạy. */
  readonly _type?: T;
  check(value: unknown, path: string, issues: Issue[]): void;
}

export type Infer<S> = S extends Schema<infer T> ? T : never;

export type ValidateResult<T> = { ok: true; value: T } | { ok: false; issues: Issue[] };

const add = (issues: Issue[], path: string, message: string): void => {
  issues.push({ path: path === '' ? '(gốc)' : path, message });
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const joinKey = (path: string, key: string): string => (path === '' ? key : `${path}.${key}`);

function unknownValue(): Schema<unknown> {
  return { check() {} };
}

function bool(): Schema<boolean> {
  return {
    check(v, path, issues) {
      if (typeof v !== 'boolean') add(issues, path, 'phải là true hoặc false');
    },
  };
}

function num(opts: { min?: number; max?: number } = {}): Schema<number> {
  return {
    check(v, path, issues) {
      if (typeof v !== 'number' || !Number.isFinite(v)) return add(issues, path, 'phải là số hữu hạn');
      if (opts.min !== undefined && v < opts.min) add(issues, path, `phải >= ${opts.min}`);
      if (opts.max !== undefined && v > opts.max) add(issues, path, `phải <= ${opts.max}`);
    },
  };
}

function int(opts: { min?: number; max?: number } = {}): Schema<number> {
  return {
    check(v, path, issues) {
      if (typeof v !== 'number' || !Number.isSafeInteger(v)) return add(issues, path, 'phải là số nguyên');
      if (opts.min !== undefined && v < opts.min) add(issues, path, `phải >= ${opts.min}`);
      if (opts.max !== undefined && v > opts.max) add(issues, path, `phải <= ${opts.max}`);
    },
  };
}

function str(opts: { min?: number; max?: number; pattern?: RegExp } = {}): Schema<string> {
  return {
    check(v, path, issues) {
      if (typeof v !== 'string') return add(issues, path, 'phải là chuỗi');
      if (opts.min !== undefined && v.length < opts.min) add(issues, path, `độ dài phải >= ${opts.min}`);
      if (opts.max !== undefined && v.length > opts.max) add(issues, path, `độ dài phải <= ${opts.max}`);
      if (opts.pattern && !opts.pattern.test(v)) add(issues, path, `không đúng định dạng ${String(opts.pattern)}`);
    },
  };
}

function lit<const T extends readonly (string | number | boolean)[]>(...values: T): Schema<T[number]> {
  return {
    check(v, path, issues) {
      if (!values.includes(v as T[number])) add(issues, path, `phải là một trong: ${values.map(String).join(', ')}`);
    },
  };
}

function opt<T>(inner: Schema<T>): Schema<T | undefined> {
  return {
    optional: true,
    check(v, path, issues) {
      if (v !== undefined) inner.check(v, path, issues);
    },
  };
}

function arr<T>(item: Schema<T>, opts: { min?: number; max?: number } = {}): Schema<T[]> {
  return {
    check(v, path, issues) {
      if (!Array.isArray(v)) return add(issues, path, 'phải là mảng');
      if (opts.min !== undefined && v.length < opts.min) add(issues, path, `cần ít nhất ${opts.min} phần tử`);
      if (opts.max !== undefined && v.length > opts.max) add(issues, path, `tối đa ${opts.max} phần tử`);
      v.forEach((el, i) => item.check(el, `${path}[${i}]`, issues));
    },
  };
}

function rec<T>(value: Schema<T>, opts: { keyPattern?: RegExp; max?: number } = {}): Schema<Record<string, T>> {
  return {
    check(v, path, issues) {
      if (!isPlainObject(v)) return add(issues, path, 'phải là object');
      const keys = Object.keys(v);
      if (opts.max !== undefined && keys.length > opts.max) add(issues, path, `tối đa ${opts.max} khoá`);
      for (const key of keys) {
        if (opts.keyPattern && !opts.keyPattern.test(key)) add(issues, joinKey(path, key), 'tên khoá không hợp lệ');
        value.check(v[key], joinKey(path, key), issues);
      }
    },
  };
}

function obj<Shape extends Record<string, Schema<unknown>>>(
  shape: Shape,
  opts: { passthrough?: boolean } = {},
): Schema<{ [K in keyof Shape]: Infer<Shape[K]> }> {
  return {
    check(v, path, issues) {
      if (!isPlainObject(v)) return add(issues, path, 'phải là object');
      for (const key of Object.keys(shape)) {
        const sub = shape[key] as Schema<unknown>;
        const present = Object.hasOwn(v, key) && v[key] !== undefined;
        if (!present) {
          if (!sub.optional) add(issues, joinKey(path, key), 'bắt buộc phải có');
          continue;
        }
        sub.check(v[key], joinKey(path, key), issues);
      }
      if (!opts.passthrough) {
        for (const key of Object.keys(v)) {
          if (!Object.hasOwn(shape, key)) add(issues, joinKey(path, key), 'trường không được phép');
        }
      }
    },
  };
}

function union<T extends readonly Schema<unknown>[]>(...options: T): Schema<Infer<T[number]>> {
  return {
    check(v, path, issues) {
      for (const option of options) {
        const local: Issue[] = [];
        option.check(v, path, local);
        if (local.length === 0) return;
      }
      add(issues, path, 'không khớp kiểu nào được phép');
    },
  };
}

/** Các hàm dựng schema. */
export const s = { unknown: unknownValue, bool, num, int, str, lit, opt, arr, rec, obj, union };

export function validate<T>(schema: Schema<T>, value: unknown): ValidateResult<T> {
  const issues: Issue[] = [];
  schema.check(value, '', issues);
  return issues.length === 0 ? { ok: true, value: value as T } : { ok: false, issues };
}

export function formatIssues(issues: readonly Issue[], limit = 10): string {
  const shown = issues.slice(0, limit).map((i) => `${i.path}: ${i.message}`);
  const rest = issues.length - shown.length;
  return rest > 0 ? `${shown.join('; ')}; (còn ${rest} lỗi nữa)` : shown.join('; ');
}
