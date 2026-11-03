import {spendTime} from './time';
import {post} from './money';
import type {GameState} from './types';
export const FACES = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'] as const;
export type Face = typeof FACES[number];
export type Bets = Record<Face, number>;
export type Dice = [Face, Face, Face];
export interface BauCuaRound {dice: Dice; bets: Bets; stake: number; payout: number; day: number}
export const LABELS: Record<Face, string> = {bau:'Bầu', cua:'Cua', tom:'Tôm', ca:'Cá', ga:'Gà', nai:'Nai'};
export const emptyBets = (): Bets => ({bau:0, cua:0, tom:0, ca:0, ga:0, nai:0});
export const totalBets = (bets: Bets): number => FACES.reduce((sum, face) => sum + bets[face], 0);
const validBets = (value: unknown): value is Bets => typeof value === 'object' && value !== null && FACES.every(face => Number.isSafeInteger((value as Bets)[face]) && (value as Bets)[face] >= 0 && (value as Bets)[face] % 10000 === 0);
const validDice = (value: unknown): value is Dice => Array.isArray(value) && value.length === 3 && value.every(face => FACES.includes(face));
export function payoutFor(bets: Bets, dice: Dice): number {
 return FACES.reduce((sum, face) => {const count = dice.filter(die => die === face).length; return sum + (count ? bets[face] * (count + 1) : 0)}, 0);
}
export function validRound(value: unknown): value is BauCuaRound {
 if (!value || typeof value !== 'object') return false;
 const round = value as BauCuaRound;
 return validDice(round.dice) && validBets(round.bets) && Number.isSafeInteger(round.stake) && round.stake > 0 && round.stake <= 1e12 && round.stake === totalBets(round.bets) && Number.isSafeInteger(round.payout) && round.payout <= 4e12 && round.payout === payoutFor(round.bets, round.dice) && Number.isSafeInteger(round.day) && round.day >= 0 && round.day <= 100000;
}
// Rejection sampling keeps all six faces equally likely.
export function rollDice(): Dice {
 const die = (): Face => {const bytes = new Uint8Array(1); do {crypto.getRandomValues(bytes)} while (bytes[0] >= 252); return FACES[bytes[0] % 6]};
 return [die(), die(), die()];
}
export type RoundResult = {ok:true; state:GameState; round:BauCuaRound} | {ok:false; error:string};
export function playBauCua(state: GameState, bets: Bets, roll: () => Dice = rollDice): RoundResult {
 if (!validBets(bets)) return {ok:false, error:'Mức cược phải là bội số của 10.000đ.'};
 const stake = totalBets(bets);
 if (!Number.isSafeInteger(stake) || stake <= 0) return {ok:false, error:'Hãy đặt ít nhất một cửa.'};
 if (stake > state.money) return {ok:false, error:'Số dư không đủ cho lượt cược này.'};
 // Even the largest possible payout must fit the save format.
 if (state.money + 3 * stake > 1e12) return {ok:false, error:'Mức cược vượt giới hạn số dư của game.'};
 const timed=spendTime(state,5);if(!timed.ok)return timed;
 let dice: Dice;
 try {dice = roll()} catch {return {ok:false, error:'Chưa xóc được xúc xắc. Hãy thử lại.'}}
 if (!validDice(dice)) return {ok:false, error:'Kết quả xúc xắc không hợp lệ.'};
 const payout = payoutFor(bets, dice), round:BauCuaRound = {dice:[...dice], bets:{...bets}, stake, payout, day:state.day};
 const n:GameState={...timed.state, bauCuaLast:round};
 if (post(n,{name:'Bầu cua Tiền cược', amount:-stake})!=='ok') return {ok:false, error:'Số dư không đủ cho lượt cược này.'};
 if (payout && post(n,{name:'Bầu cua Hoàn cược và tiền thắng', amount:payout})!=='ok') return {ok:false, error:'Mức cược vượt giới hạn số dư của game.'};
 return {ok:true, round, state:n};
}
