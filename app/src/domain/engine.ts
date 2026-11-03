import {validLife} from './life';
import {validRent} from './rent';
import {validHome} from './home';
import {validOfficeItems} from './office-items';
import {validSocial} from './social';
import {validSkills,validWork} from './work';
import {validJournal} from './journal';
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
    function initial(): GameState { return { version: 1, day: 0, money: 5200000, energy: 85, mood: 75, health: 90, stress: 20, xp: 0, owned: [], equipped: [], ledger: [], lastReport: null }; }
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
        return false; if(s.rent!==undefined&&!validRent(s.rent,s.day))return false;if(s.life!==undefined&&!validLife(s.life,s.day))return false;if(s.home!==undefined&&!validHome(s.home))return false;if(s.officeItems!==undefined&&!validOfficeItems(s.officeItems))return false;if(s.social!==undefined&&!validSocial(s.social,s.day))return false;if(s.skills!==undefined&&!validSkills(s.skills))return false;if(s.work!==undefined&&!validWork(s.work,s.day))return false;if(s.work?.active&&(!s.clock||s.clock.location!=='office'||s.clock.minute!==s.work.active.started+s.work.active.minutes||s.office?.role!=='employee'||s.office.employerId!==s.work.active.companyId))return false;if(s.journal!==undefined&&!validJournal(s.journal,s.day))return false;if(s.officeLayout!==undefined&&!validateLayout(s.officeLayout))return false;if(s.clock!==undefined&&!validClock(s.clock,s.day))return false; if(s.office!==undefined&&(!validOffice(s.office)||(s.office.application!=null&&s.office.application.submittedDay>s.day)))return false; if(s.fishing!==undefined&&!validFishing(s.fishing,s.day))return false; if (s.bauCuaLast !== undefined && (!validRound(s.bauCuaLast) || s.bauCuaLast.day > s.day)) return false; return s.ledger.every(x => x && typeof x.name === 'string' && x.name.length < 200 && Number.isSafeInteger(x.amount) && Number.isSafeInteger(x.day) && x.day >= 0 && x.day <= s.day); }
    function entry(s: GameState, name: string, amount: number): void { s.money += amount; s.ledger.unshift({ name, amount, day: s.day }); s.ledger = s.ledger.slice(0, 100); }
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
    function parse(raw: string | null): GameState | null { if (typeof raw !== 'string')
        return null; try {
        const s = JSON.parse(raw);
        return valid(s) ? s : null;
    }
    catch {
        return null;
    } }

export const engine: EngineApi = { KEY, COST, ITEMS, initial, valid, buy, toggle, advance, parse };
