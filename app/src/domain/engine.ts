import {validMorning} from './morning';
import {validLife} from './life';
import {validRent} from './rent';
import {validHome} from './home';import {validOrders} from './orders';import {validBank} from './bank';import {validSide} from './side';import {validCompany} from './company';import {post,validTx} from './money';
import {validOfficeItems} from './office-items';
import {validSocial} from './social';
import {validSkills,validWork,SKILLS} from './work';import {validStudy} from './study';import {validStory} from './director';import {validInbox} from './inbox';import {validHousing} from './housing';import {MAX_LEVEL} from './skill-xp';
import {validJournal} from './journal';
import {validSummaryState} from './summary';
import {validateLayout} from './layout';
import {spendTime,validClock} from './time';
import {validOffice} from './office';
import {validFishing} from './fishing';
import {validRound} from './bau-cua';
import type {GameState,GameResult,ItemId,Item,DailyAction,EngineApi} from './types';
    'use strict';
    const COST = 90000, KEY = 'life-simulator-vi-v1';
    const ITEMS: Record<ItemId, Item> = { plant: { name: 'Cây trầu bà', price: 180000, bonus: 2, desc: 'Một chút xanh cho góc sống.', effect: 'Tâm trạng khi mua +2' }, lamp: { name: 'Đèn đọc sách', price: 350000, bonus: 3, desc: 'Ánh sáng ấm cho buổi tối.', effect: 'Tâm trạng khi mua +3' }, rug: { name: 'Thảm dệt nhỏ', price: 650000, bonus: 4, desc: 'Một căn phòng ấm cúng hơn.', effect: 'Tâm trạng khi mua +4' } };
    const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));
    function initial(): GameState { return { version: 1, day: 0, money: 5200000, energy: 85, fullness: 70, mood: 75, health: 90, stress: 20, xp: 0, owned: [], equipped: [], ledger: [], lastReport: null }; }
    function valid(s: unknown): s is GameState {
        const value = s as GameState;
        return validate(value);
    }
    function validate(s: GameState): boolean { if (!s || s.version !== 1)
        return false; for (const k of ['day', 'money', 'energy', 'mood', 'health', 'stress', 'xp'] as const)
        if (!Number.isSafeInteger(s[k]) || s[k] < 0)
            return false; if (s.day > 100000 || s.money > 1e12 || s.xp > 1e9)
        return false; for (const k of ['energy', 'mood', 'health', 'stress'] as const)
        if (s[k] > 100)
            return false; if (!Array.isArray(s.owned) || !Array.isArray(s.equipped) || !Array.isArray(s.ledger) || s.ledger.length > 100)
        return false; if (s.owned.some(k => !ITEMS[k]) || new Set(s.owned).size !== s.owned.length || s.equipped.some(k => !s.owned.includes(k)) || new Set(s.equipped).size !== s.equipped.length)
        return false; if(!validTx(s))return false;if(s.morning!==undefined&&!validMorning(s.morning,s.day))return false;if(s.orders!==undefined&&!validOrders(s.orders,s.day))return false;if(s.bank!==undefined&&!validBank(s.bank,s.day))return false;if(s.side!==undefined&&!validSide(s.side,s.day))return false;if(s.company!==undefined&&!validCompany(s.company,s.day))return false;if(s.coffee!==undefined&&!(Number.isSafeInteger(s.coffee.day)&&s.coffee.day>=0&&s.coffee.day<=s.day&&Number.isInteger(s.coffee.count)&&s.coffee.count>=0&&s.coffee.count<=2&&(s.coffee.crashAt===null||(Number.isInteger(s.coffee.crashAt)&&s.coffee.crashAt>=0&&s.coffee.crashAt<=3000))))return false;if(s.fullness!==undefined&&!(typeof s.fullness==='number'&&s.fullness>=0&&s.fullness<=100))return false;if(s.rent!==undefined&&!validRent(s.rent,s.day))return false;if(s.life!==undefined&&!validLife(s.life,s.day))return false;if(s.home!==undefined&&!validHome(s.home))return false;if(s.officeItems!==undefined&&!validOfficeItems(s.officeItems))return false;if(s.social!==undefined&&!validSocial(s.social,s.day))return false;if(s.skills!==undefined&&!validSkills(s.skills))return false;if(s.work!==undefined&&!validWork(s.work,s.day))return false;if(s.study!==undefined&&!validStudy(s.study,s.day))return false;if(s.story!==undefined&&!validStory(s.story,s.day))return false;if(s.inbox!==undefined&&!validInbox(s.inbox,s.day))return false;if(s.housing!==undefined&&!validHousing(s.housing,s.day))return false;if(s.work?.active&&(!s.clock||s.clock.location!=='office'||s.clock.minute!==s.work.active.started+s.work.active.minutes||s.office?.role!=='employee'||s.office.employerId!==s.work.active.companyId))return false;if(s.journal!==undefined&&!validJournal(s.journal,s.day))return false;if(s.summary!==undefined&&!validSummaryState(s.summary,s.day))return false;if(s.officeLayout!==undefined&&!validateLayout(s.officeLayout))return false;if(s.clock!==undefined&&!validClock(s.clock,s.day))return false; if(s.office!==undefined&&(!validOffice(s.office)||(s.office.application!=null&&s.office.application.submittedDay>s.day)))return false; if(s.fishing!==undefined&&!validFishing(s.fishing,s.day))return false; if (s.bauCuaLast !== undefined && (!validRound(s.bauCuaLast) || s.bauCuaLast.day > s.day)) return false; return s.ledger.every(x => x && typeof x.name === 'string' && x.name.length < 200 && Number.isSafeInteger(x.amount) && Number.isSafeInteger(x.day) && x.day >= 0 && x.day <= s.day); }
    function entry(s: GameState, name: string, amount: number): void { post(s, { name, amount }); }
    function buy(s: GameState, input: string): GameResult { const id = input as ItemId; if (!ITEMS[id])
        return { ok: false, error: 'Món đồ không hợp lệ.' }; if (s.owned.includes(id))
        return { ok: false, error: 'Bạn đã sở hữu món đồ này.' }; if (s.money < ITEMS[id].price)
        return { ok: false, error: 'Bạn chưa đủ tiền cho món đồ này.' }; const timed=spendTime(s,10);if(!timed.ok)return timed; const n = structuredClone(timed.state); entry(n, 'Mua ' + ITEMS[id].name, -ITEMS[id].price); n.owned.push(id); n.equipped.push(id); n.mood = clamp(n.mood + ITEMS[id].bonus); return { ok: true, state: n }; }
    function toggle(s: GameState, input: string): GameResult { const id = input as ItemId; if (!s.owned.includes(id))
        return { ok: false, error: 'Bạn chưa sở hữu món đồ này.' }; const timed=spendTime(s,5);if(!timed.ok)return timed;const n = structuredClone(timed.state); n.equipped = n.equipped.includes(id) ? n.equipped.filter(x => x !== id) : [...n.equipped, id]; return { ok: true, state: n }; }
    function advance(s: GameState, input: string): GameResult {
        const action = input as DailyAction;
        if (!['work', 'study', 'rest'].includes(action))
            return { ok: false, error: 'Hãy chọn hoạt động.' };
        const n = structuredClone(s);
        const efficiency = Math.max(.35, Math.min(1.15, .4 + s.energy / 200 + s.health / 500 - s.stress / 400));
        let earn = action === 'work' ? Math.round(450000 * efficiency / 1000) * 1000 : 0;
        let xp = action === 'study' ? Math.max(8, Math.round(25 * efficiency)) : action === 'work' ? Math.max(4, Math.round(10 * efficiency)) : 0;
        if (n.money + earn < COST)
            return { ok: false, error: 'Cần 90.000đ sinh hoạt. Hãy chọn làm việc để có thêm thu nhập.' };
        const before = n.money;
        n.day++;
        if (earn)
            entry(n, 'Thù lao công việc thử nghiệm', earn);
        entry(n, 'Ăn uống và sinh hoạt', -COST);
        n.xp += xp;
        if (action === 'work') {
            n.energy = clamp(n.energy - 14);
            n.stress = clamp(n.stress + 9);
            n.mood = clamp(n.mood - 3);
        }
        else if (action === 'study') {
            n.energy = clamp(n.energy - 8);
            n.stress = clamp(n.stress + 4);
            n.mood = clamp(n.mood + 1);
        }
        else {
            n.energy = clamp(n.energy + 30);
            n.stress = clamp(n.stress - 22);
            n.mood = clamp(n.mood + 12);
            n.health = clamp(n.health + 3);
        }
        if (n.energy < 25)
            n.health = clamp(n.health - 2);
        n.lastReport = { action, earn, cost: COST, xp, net: n.money - before, efficiency: Math.round(efficiency * 100), day: n.day };
        return { ok: true, state: n };
    }
    /** Save cũ dùng cấp nội bộ 1–50: đổi sang Lv 1–10 (cấp / 5), XP dư bỏ đi. */
    function migrateSkills(s: any): GameState | null { const k = s?.skills; if (!k || typeof k !== 'object' || validSkills(k)) return null; const out: any = {}; for (const id of Object.keys(SKILLS)) { const q = k[id]; if (q === undefined && id === 'cooking') continue; if (!q || !Number.isInteger(q.level) || q.level < 1 || q.level > 50) return null; out[id] = { level: Math.max(1, Math.min(MAX_LEVEL, Math.floor(q.level / 5))), xp: 0 }; } return { ...s, skills: out }; }
/** Các lát cắt tuỳ chọn của save, xếp từ ít giá trị tới nhiều giá trị. Khi save không hợp lệ (thường do bản cập nhật siết
 * điều kiện kiểm tra), bỏ một hoặc hai lát cắt hỏng để giữ phần còn lại của đời chơi thay vì về Ngày 1. */
export const OPTIONAL_SLICES = ['morning','summary','bauCuaLast','coffee','fullness','officeLayout','journal','fishing','story','inbox','study','side','orders','officeItems','home','social','work','clock','housing','rent','office','skills','company','bank','life','txIds','txSeq'] as const;
export type SliceKey = typeof OPTIONAL_SLICES[number];
export interface LoadedSave { state: GameState; dropped: SliceKey[]; }
const without = (s: any, keys: readonly string[]) => { const n = { ...s }; for (const k of keys) delete n[k]; return n; };
/** Sửa nhẹ phần lõi: bỏ dòng sổ cái lỗi hoặc quá hạn mức (sổ cái chỉ để xem). */
function tidyCore(s: any): any { if (!s || typeof s !== 'object' || !Array.isArray(s.ledger)) return s; const ledger = s.ledger.filter((x: any) => x && typeof x.name === 'string' && x.name.length < 200 && Number.isSafeInteger(x.amount) && Number.isSafeInteger(x.day) && x.day >= 0 && x.day <= s.day).slice(-100); return ledger.length === s.ledger.length ? s : { ...s, ledger }; }
/** Đọc save; nếu cần thì bỏ lát cắt hỏng. `dropped` rỗng nghĩa là đọc nguyên vẹn. */
export function loadSave(raw: string | null): LoadedSave | null { if (typeof raw !== 'string') return null; const ok = (x: unknown): x is GameState => { try { return valid(x); } catch { return false; } }; try {
    const s = JSON.parse(raw);
    if (ok(s)) return { state: s, dropped: [] };
    const m = migrateSkills(s);
    if (m && ok(m)) return { state: m, dropped: [] };
    const base = tidyCore(m ?? s); if (!base || typeof base !== 'object') return null;
    if (ok(base)) return { state: base, dropped: [] };
    const present = OPTIONAL_SLICES.filter(k => k in base);
    for (const k of present) { const n = without(base, [k]); if (ok(n)) return { state: n, dropped: [k] }; }
    for (let i = 0; i < present.length; i++) for (let j = i + 1; j < present.length; j++) { const n = without(base, [present[i], present[j]]); if (ok(n)) return { state: n, dropped: [present[i], present[j]] }; }
    return null;
} catch { return null; } }
    /** Đọc chặt: chỉ chấp nhận save nguyên vẹn (riêng Bản tin sáng hỏng thì được bỏ). Khi mở game dùng `loadSave` để cứu nhiều hơn. */
    function parse(raw: string | null): GameState | null { const r = loadSave(raw); return r && r.dropped.every(k => k === 'morning') ? r.state : null; }

export const engine: EngineApi = { KEY, COST, ITEMS, initial, valid, buy, toggle, advance, parse };
