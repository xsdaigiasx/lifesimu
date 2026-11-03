import {dateAt} from './format';
import type {GameState} from './types';
/** Tiền trọ: 1.500.000đ mỗi tháng, tính vào ngày 1; thiếu tiền được gia hạn 3 ngày, sau đó tâm trạng và căng thẳng xấu đi mỗi ngày cho đến khi trả đủ. */
export const RENT=1500000,GRACE_DAYS=3;
export type RentNoticeKind='first'|'paid'|'due'|'late';
export interface RentNotice{kind:RentNoticeKind;month:string;amount:number;day:number;daysLeft:number}
export interface RentState{billedMonth:string;owed:number;dueDay:number|null;notice:RentNotice|null}
export const monthKey=(day:number)=>{const d=dateAt(day);return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`};
export const monthLabel=(key:string)=>{const[y,m]=key.split('-');return `${Number(m)}/${y}`};
export const rentOf=(s:GameState):RentState=>s.rent??{billedMonth:'',owed:0,dueDay:null,notice:null};
const int=(n:unknown,lo:number,hi:number)=>Number.isInteger(n)&&(n as number)>=lo&&(n as number)<=hi;
export function validRent(v:unknown,day:number):v is RentState{if(!v||typeof v!=='object')return false;const r=v as RentState;if(typeof r.billedMonth!=='string'||!(r.billedMonth===''||/^\d{4}-\d{2}$/.test(r.billedMonth))||!int(r.owed,0,1e9)||!(r.dueDay===null||int(r.dueDay,0,day+GRACE_DAYS+1)))return false;if(r.notice===null)return true;const n=r.notice;return !!n&&['first','paid','due','late'].includes(n.kind)&&/^\d{4}-\d{2}$/.test(n.month)&&int(n.amount,0,1e9)&&int(n.day,0,day)&&int(n.daysLeft,0,GRACE_DAYS)}
const charge=(s:GameState,amount:number,label:string)=>{s.money-=amount;s.ledger=[{name:label,amount:-amount,day:s.day},...s.ledger].slice(0,100)};
/** Sau phần mở đầu: trả tháng đầu tiên ngay và hiện rõ cho người chơi. */
export function startRent(s:GameState):GameState{if(s.rent)return s;const key=monthKey(s.day),n=structuredClone(s);if(n.money>=RENT){charge(n,RENT,`Tiền trọ tháng ${monthLabel(key)}`);n.rent={billedMonth:key,owed:0,dueDay:null,notice:{kind:'first',month:key,amount:RENT,day:n.day,daysLeft:0}}}else n.rent={billedMonth:key,owed:RENT,dueDay:n.day+GRACE_DAYS,notice:{kind:'due',month:key,amount:RENT,day:n.day,daysLeft:GRACE_DAYS}};return n}
/** Gọi một lần mỗi sáng sau khi đã sang ngày mới (sau khi lương ngày 1 đã vào ví). */
export function settleRent(s:GameState):GameState{const key=monthKey(s.day);if(!s.rent){return{...s,rent:{billedMonth:key,owed:0,dueDay:null,notice:null}}}const n=structuredClone(s),r=n.rent!;if(r.billedMonth!==key){r.billedMonth=key;r.owed+=RENT;r.dueDay=n.day+GRACE_DAYS}r.notice=null;if(r.owed>0){if(n.money>=r.owed){const amount=r.owed;charge(n,amount,`Tiền trọ tháng ${monthLabel(key)}`);r.owed=0;r.dueDay=null;r.notice={kind:'paid',month:key,amount,day:n.day,daysLeft:0}}else{const left=(r.dueDay??n.day)-n.day;if(left>=0)r.notice={kind:'due',month:key,amount:r.owed,day:n.day,daysLeft:Math.min(GRACE_DAYS,left)};else{n.mood=Math.max(0,n.mood-8);n.stress=Math.min(100,n.stress+8);r.notice={kind:'late',month:key,amount:r.owed,day:n.day,daysLeft:0}}}}return n}
