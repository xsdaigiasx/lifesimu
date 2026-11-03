/**
 * Sổ cái giao dịch idempotent (T03).
 * Mọi thay đổi tiền đều đi qua applyTx với một `txId` ổn định, nên reload,
 * bấm hai lần hay chạy lại hook theo ngày không thể trừ/thưởng trùng.
 * Hàm thuần: nhận state, trả state mới, không sửa state cũ.
 */

export interface Leg {
  account: string;
  /** Số nguyên khác 0 (đơn vị: đồng). Dương = cộng, âm = trừ. */
  delta: number;
}

export interface TxInput {
  txId: string;
  day: number;
  minuteOfDay?: number;
  kind: string;
  legs: Leg[];
  memo?: string;
}

export interface TxRecord {
  seq: number;
  txId: string;
  day: number;
  minuteOfDay: number;
  kind: string;
  legs: Leg[];
  memo: string;
  fingerprint: string;
}

export interface LedgerState {
  nextSeq: number;
  /** Số dư hiện tại của từng tài khoản, luôn >= 0. */
  balances: Record<string, number>;
  /** Số dư của các giao dịch đã được nén (xem compactLedger). */
  opening: Record<string, number>;
  entries: TxRecord[];
  /** txId -> dấu vân tay nội dung. Giữ lại cả khi nén để chống áp dụng lại. */
  seen: Record<string, string>;
}

export type ApplyResult =
  | { status: 'applied'; record: TxRecord }
  | { status: 'duplicate'; record: TxRecord | undefined }
  | { status: 'rejected'; code: 'invalid' | 'insufficient_funds' | 'txid_conflict'; message: string };

const TXID_RE = /^[A-Za-z0-9_.:-]{1,120}$/;
const KIND_RE = /^[a-z][a-z0-9_.-]{0,40}$/;
const ACCOUNT_RE = /^[a-z][a-z0-9_.-]{0,40}$/;
const MAX_LEGS = 8;

export function emptyLedger(): LedgerState {
  return { nextSeq: 1, balances: {}, opening: {}, entries: [], seen: {} };
}

export function balanceOf(state: LedgerState, account: string): number {
  return state.balances[account] ?? 0;
}

/** Tạo txId từ loại và các phần khoá; ném lỗi nếu có ký tự không hợp lệ. */
export function makeTxId(kind: string, ...parts: (string | number)[]): string {
  const segments = [kind, ...parts.map(String)];
  for (const segment of segments) {
    if (!/^[A-Za-z0-9_.-]+$/.test(segment)) throw new RangeError(`Thành phần txId không hợp lệ: "${segment}"`);
  }
  const id = segments.join(':');
  if (!TXID_RE.test(id)) throw new RangeError(`txId quá dài hoặc không hợp lệ: ${id}`);
  return id;
}

/** Quy ước đặt txId cho các giao dịch lặp lại, để mọi nơi dùng chung một cách. */
export const txIds = {
  opening: (): string => makeTxId('init', 'opening'),
  salary: (monthKey: string, employerId: string): string => makeTxId('salary', monthKey, employerId),
  rent: (monthKey: string, homeId: string): string => makeTxId('rent', monthKey, homeId),
  utilities: (monthKey: string, homeId: string): string => makeTxId('utilities', monthKey, homeId),
  loanPayment: (loanId: string, installment: number): string => makeTxId('loan', loanId, installment),
  purchase: (orderId: string): string => makeTxId('purchase', orderId),
  event: (day: number, eventId: string, step: number | string): string => makeTxId('event', day, eventId, step),
  migrate: (label: string): string => makeTxId('migrate', label),
};

export function fingerprintOf(kind: string, legs: readonly Leg[]): string {
  const sorted = legs
    .map((leg) => `${leg.account}:${leg.delta}`)
    .sort()
    .join(',');
  return `${kind}|${sorted}`;
}

function validateTx(tx: TxInput): string | undefined {
  if (!TXID_RE.test(tx.txId)) return 'txId không hợp lệ';
  if (!KIND_RE.test(tx.kind)) return 'kind không hợp lệ';
  if (!Number.isSafeInteger(tx.day) || tx.day < 0) return 'day không hợp lệ';
  const minute = tx.minuteOfDay ?? 0;
  if (!Number.isInteger(minute) || minute < 0 || minute >= 1440) return 'minuteOfDay không hợp lệ';
  if (tx.legs.length === 0 || tx.legs.length > MAX_LEGS) return `số chân giao dịch phải từ 1 đến ${MAX_LEGS}`;
  const accounts = new Set<string>();
  for (const leg of tx.legs) {
    if (!ACCOUNT_RE.test(leg.account)) return `tên tài khoản không hợp lệ: ${leg.account}`;
    if (!Number.isSafeInteger(leg.delta) || leg.delta === 0) return 'delta phải là số nguyên khác 0';
    if (accounts.has(leg.account)) return `tài khoản lặp trong một giao dịch: ${leg.account}`;
    accounts.add(leg.account);
  }
  if ((tx.memo ?? '').length > 200) return 'memo tối đa 200 ký tự';
  return undefined;
}

/** Áp dụng một giao dịch nguyên tử (tất cả chân hoặc không chân nào). */
export function applyTx(state: LedgerState, tx: TxInput): { state: LedgerState; result: ApplyResult } {
  const problem = validateTx(tx);
  if (problem) return { state, result: { status: 'rejected', code: 'invalid', message: problem } };

  const fingerprint = fingerprintOf(tx.kind, tx.legs);
  const previous = state.seen[tx.txId];
  if (previous !== undefined) {
    if (previous !== fingerprint) {
      return {
        state,
        result: {
          status: 'rejected',
          code: 'txid_conflict',
          message: `txId "${tx.txId}" đã dùng cho một giao dịch có nội dung khác`,
        },
      };
    }
    const record = state.entries.find((entry) => entry.txId === tx.txId);
    return { state, result: { status: 'duplicate', record } };
  }

  const balances = { ...state.balances };
  for (const leg of tx.legs) {
    const next = (balances[leg.account] ?? 0) + leg.delta;
    if (!Number.isSafeInteger(next)) {
      return { state, result: { status: 'rejected', code: 'invalid', message: 'số dư vượt giới hạn số nguyên an toàn' } };
    }
    if (next < 0) {
      return {
        state,
        result: {
          status: 'rejected',
          code: 'insufficient_funds',
          message: `không đủ số dư ở tài khoản "${leg.account}" (hiện ${balances[leg.account] ?? 0}, cần thêm ${-leg.delta})`,
        },
      };
    }
    balances[leg.account] = next;
  }

  const record: TxRecord = {
    seq: state.nextSeq,
    txId: tx.txId,
    day: tx.day,
    minuteOfDay: tx.minuteOfDay ?? 0,
    kind: tx.kind,
    legs: tx.legs.map((leg) => ({ account: leg.account, delta: leg.delta })),
    memo: tx.memo ?? '',
    fingerprint,
  };
  return {
    state: {
      nextSeq: state.nextSeq + 1,
      balances,
      opening: state.opening,
      entries: [...state.entries, record],
      seen: { ...state.seen, [tx.txId]: fingerprint },
    },
    result: { status: 'applied', record },
  };
}

/** Áp dụng nhiều giao dịch nguyên tử: một giao dịch bị từ chối thì trả lại state ban đầu. */
export function applyTxs(
  state: LedgerState,
  txs: readonly TxInput[],
): { state: LedgerState; results: ApplyResult[]; ok: boolean } {
  let current = state;
  const results: ApplyResult[] = [];
  for (const tx of txs) {
    const step = applyTx(current, tx);
    results.push(step.result);
    if (step.result.status === 'rejected') return { state, results, ok: false };
    current = step.state;
  }
  return { state: current, results, ok: true };
}

/** Nén các bản ghi cũ để save không phình ra; vẫn giữ `seen` để chống trùng. */
export function compactLedger(state: LedgerState, keepFromDay: number): LedgerState {
  const keep: TxRecord[] = [];
  const opening = { ...state.opening };
  for (const entry of state.entries) {
    if (entry.day >= keepFromDay) {
      keep.push(entry);
      continue;
    }
    for (const leg of entry.legs) opening[leg.account] = (opening[leg.account] ?? 0) + leg.delta;
  }
  return { ...state, opening, entries: keep };
}

/** Kiểm tra tính nhất quán: số dư = số dư đầu + tổng các bản ghi còn giữ. */
export function verifyLedger(state: LedgerState): string[] {
  const problems: string[] = [];
  const sums: Record<string, number> = { ...state.opening };
  const seenSeq = new Set<number>();
  for (const entry of state.entries) {
    if (seenSeq.has(entry.seq)) problems.push(`seq lặp: ${entry.seq}`);
    seenSeq.add(entry.seq);
    if (state.seen[entry.txId] !== entry.fingerprint) problems.push(`txId "${entry.txId}" thiếu hoặc lệch trong seen`);
    for (const leg of entry.legs) sums[leg.account] = (sums[leg.account] ?? 0) + leg.delta;
  }
  const accounts = new Set([...Object.keys(sums), ...Object.keys(state.balances)]);
  for (const account of accounts) {
    const expected = sums[account] ?? 0;
    const actual = state.balances[account] ?? 0;
    if (expected !== actual) problems.push(`tài khoản "${account}": số dư ${actual} khác tổng bản ghi ${expected}`);
    if (actual < 0) problems.push(`tài khoản "${account}" âm: ${actual}`);
  }
  return problems;
}
