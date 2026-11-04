import type {GameState,GameResult} from './types';
import {clockOf,spendTime,END} from './time';
import {canEnterOffice} from './work';
import {officeOf} from './office';
import {recordJournal} from './journal';
export const COWORKERS=[{id:'dev-an',name:'Minh An',role:'Lập trình viên',line:'Lỗi khó thì chia nhỏ ra, cùng tìm nhé.'},{id:'dev-linh',name:'Thảo Linh',role:'Thiết kế giao diện',line:'Trưa nay ăn gì nhỉ?'},{id:'dev-huy',name:'Gia Huy',role:'Kiểm thử phần mềm',line:'Mình vừa tìm được một lỗi khá thú vị.'},{id:'dev-trang',name:'Thu Trang',role:'Điều phối dự án',line:'Nhớ để dành thời gian nghỉ trưa nhé.'}] as const;
export interface SocialState{relations:Record<string,{score:number;lastDay:number;minutes:number}>;chatMinutesDay:number;chatDay:number}
export const socialOf=(s:GameState):SocialState=>s.social??{relations:{},chatMinutesDay:0,chatDay:s.day};
export function validSocial(v:unknown,day:number):v is SocialState{if(!v||typeof v!=='object')return false;const q=v as SocialState;return Number.isInteger(q.chatDay)&&q.chatDay>=0&&q.chatDay<=day&&Number.isInteger(q.chatMinutesDay)&&q.chatMinutesDay>=0&&q.chatMinutesDay<=480&&!!q.relations&&typeof q.relations==='object'&&Object.entries(q.relations).every(([id,r])=>COWORKERS.some(p=>p.id===id)&&r&&Number.isInteger(r.score)&&r.score>=0&&r.score<=100&&Number.isInteger(r.lastDay)&&r.lastDay>=0&&r.lastDay<=day&&Number.isInteger(r.minutes)&&r.minutes>=0&&r.minutes<=1320)}
export function chatCoworker(s:GameState,id:string,minutes:5|15):GameResult{
 if(s.work?.active)return{ok:false,error:'Không trò chuyện trong ca làm.'};
 if(!canEnterOffice(s)||clockOf(s).minute+minutes>1020)return{ok:false,error:'Đã hết giờ ở công ty.'};
 const npc=COWORKERS.find(p=>p.id===id);if(!npc||![5,15].includes(minutes))return{ok:false,error:'Cuộc trò chuyện không hợp lệ.'};if(clockOf(s).location!=='office'||officeOf(s).role!=='employee')return{ok:false,error:'Hãy đến công ty.'};const c=clockOf(s),old=socialOf(s),rel=old.relations[id];if(rel&&rel.lastDay===s.day&&c.minute-rel.minutes<60)return{ok:false,error:'Đợi một lát rồi trò chuyện tiếp.'};if(c.minute+minutes>END)return{ok:false,error:'Đã muộn rồi.'};
 const r=spendTime(s,minutes);if(!r.ok)return r;let n=r.state;const dayMinutes=old.chatDay===s.day?old.chatMinutesDay:0;
 n.social={chatDay:s.day,chatMinutesDay:dayMinutes,relations:{...old.relations,[id]:{score:Math.min(100,(rel?.score??0)+(minutes===5?2:4)),lastDay:s.day,minutes:clockOf(n).minute}}};
 n=recordJournal(n,`chat:${s.day}:${c.minute}:${id}`,'Trò chuyện với '+npc.name,`Đã trò chuyện ${minutes} phút.`,id);return{ok:true,state:n};
}
/** Cộng hoặc trừ quan hệ với một đồng nghiệp (0–100), dùng cho điểm rẽ và thẻ Giúp đồng nghiệp. */
export function adjustRelation(s:GameState,id:string,delta:number):GameState{if(!COWORKERS.some(p=>p.id===id)||!delta)return s;const old=socialOf(s),rel=old.relations[id];return{...s,social:{...old,relations:{...old.relations,[id]:{score:Math.max(0,Math.min(100,(rel?.score??0)+delta)),lastDay:s.day,minutes:rel?.lastDay===s.day?rel.minutes:0}}}}}
