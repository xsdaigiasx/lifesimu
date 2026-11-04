import type {GameState,GameResult} from './types';
import {clockOf,spendTime,END} from './time';
import {canEnterOffice} from './work';
import {officeOf} from './office';
import {recordJournal} from './journal';
import {NPCS,castById,presentAt} from './npc';
export const COWORKERS=[{id:'dev-an',name:'Minh An',role:'Lập trình viên',line:'Lỗi khó thì chia nhỏ ra, cùng tìm nhé.'},{id:'dev-linh',name:'Thảo Linh',role:'Thiết kế giao diện',line:'Trưa nay ăn gì nhỉ?'},{id:'dev-huy',name:'Gia Huy',role:'Kiểm thử phần mềm',line:'Mình vừa tìm được một lỗi khá thú vị.'},{id:'dev-trang',name:'Thu Trang',role:'Điều phối dự án',line:'Nhớ để dành thời gian nghỉ trưa nhé.'}] as const;
export interface SocialState{relations:Record<string,{score:number;lastDay:number;minutes:number}>;chatMinutesDay:number;chatDay:number;/** T40: điểm đã cộng trong ngày theo người */gain?:{day:number;by:Record<string,number>};/** T40: điểm cao nhất từng đạt, làm sàn hao mòn theo bậc */peak?:Record<string,number>}
/** T40: mỗi người cộng tối đa 5 điểm mỗi ngày. */
export const DAILY_GAIN=5;
export const tierFloor=(score:number)=>score>=60?60:score>=30?30:score>=10?10:0;
export const socialOf=(s:GameState):SocialState=>s.social??{relations:{},chatMinutesDay:0,chatDay:s.day};
export function validSocial(v:unknown,day:number):v is SocialState{if(!v||typeof v!=='object')return false;const q=v as SocialState;return Number.isInteger(q.chatDay)&&q.chatDay>=0&&q.chatDay<=day&&Number.isInteger(q.chatMinutesDay)&&q.chatMinutesDay>=0&&q.chatMinutesDay<=480&&!!q.relations&&typeof q.relations==='object'&&Object.entries(q.relations).every(([id,r])=>NPCS.some(p=>p.id===id)&&r&&Number.isInteger(r.score)&&r.score>=0&&r.score<=100&&Number.isInteger(r.lastDay)&&r.lastDay>=0&&r.lastDay<=day&&Number.isInteger(r.minutes)&&r.minutes>=0&&r.minutes<=1320)&&(q.gain===undefined||(Number.isInteger(q.gain.day)&&q.gain.day<=day&&!!q.gain.by&&Object.entries(q.gain.by).every(([id,v])=>NPCS.some(p=>p.id===id)&&Number.isInteger(v)&&v>=0&&v<=DAILY_GAIN)))&&(q.peak===undefined||Object.entries(q.peak).every(([id,v])=>NPCS.some(p=>p.id===id)&&Number.isInteger(v)&&v>=0&&v<=100))}
export function chatCoworker(s:GameState,id:string,minutes:5|15):GameResult{
 if(s.work?.active)return{ok:false,error:'Không trò chuyện trong ca làm.'};
 if(!canEnterOffice(s)||clockOf(s).minute+minutes>1020)return{ok:false,error:'Đã hết giờ ở công ty.'};
 const npc=COWORKERS.find(p=>p.id===id);if(!npc||![5,15].includes(minutes))return{ok:false,error:'Cuộc trò chuyện không hợp lệ.'};if(clockOf(s).location!=='office'||officeOf(s).role!=='employee')return{ok:false,error:'Hãy đến công ty.'};const c=clockOf(s),old=socialOf(s),rel=old.relations[id];if(rel&&rel.lastDay===s.day&&c.minute-rel.minutes<60)return{ok:false,error:'Đợi một lát rồi trò chuyện tiếp.'};if(c.minute+minutes>END)return{ok:false,error:'Đã muộn rồi.'};
 const r=spendTime(s,minutes);if(!r.ok)return r;let n=r.state;const dayMinutes=old.chatDay===s.day?old.chatMinutesDay:0;
 n.social={...socialOf(n),chatDay:s.day,chatMinutesDay:dayMinutes};n=adjustRelation(n,id,minutes===5?2:4);
 n=recordJournal(n,`chat:${s.day}:${c.minute}:${id}`,'Trò chuyện với '+npc.name,`Đã trò chuyện ${minutes} phút.`,id);return{ok:true,state:n};
}
/** Cộng hoặc trừ quan hệ với một đồng nghiệp (0–100), dùng cho điểm rẽ và thẻ Giúp đồng nghiệp. */
/** Cộng hoặc trừ quan hệ (0–100). Phần cộng bị chặn ở 5 điểm mỗi người mỗi ngày (T40); cập nhật điểm cao nhất. */
export function adjustRelation(s:GameState,id:string,delta:number,touch=true):GameState{if(!NPCS.some(p=>p.id===id)||(!delta&&!touch))return s;const old=socialOf(s),rel=old.relations[id],gain=old.gain?.day===s.day?old.gain.by:{},used=gain[id]??0,applied=delta>0?Math.min(delta,DAILY_GAIN-used):delta;const score=Math.max(0,Math.min(100,(rel?.score??0)+applied)),minute=s.clock?.minute??420;
 return{...s,social:{...old,gain:{day:s.day,by:{...gain,[id]:used+Math.max(0,applied)}},peak:{...old.peak,[id]:Math.max(old.peak?.[id]??0,score)},relations:{...old.relations,[id]:{score,lastDay:touch?s.day:(rel?.lastDay??s.day),minutes:touch?minute:(rel?.minutes??0)}}}}}
/** T16: chào hỏi hoặc trò chuyện với người đang ở cùng nơi, cùng giờ. Cộng quan hệ nhẹ, cách nhau ít nhất 60 phút với cùng người. */
export function talkTo(s:GameState,id:string,minutes:5|15):GameResult{const npc=castById(id),c=clockOf(s);if(!npc||![5,15].includes(minutes))return{ok:false,error:'Không tìm thấy người này.'};
 if(s.work?.active)return{ok:false,error:'Không trò chuyện trong ca làm.'};if(!presentAt(npc,s.day,c.minute,c.location))return{ok:false,error:`${npc.name} không còn ở đây.`};
 const old=socialOf(s),rel=old.relations[id];if(rel&&rel.lastDay===s.day&&c.minute-rel.minutes<60)return{ok:false,error:'Đợi một lát rồi trò chuyện tiếp.'};if(c.minute+minutes>END)return{ok:false,error:'Đã muộn rồi.'};
 const r=spendTime(s,minutes);if(!r.ok)return r;let n=r.state;
 n.social={...socialOf(n),chatDay:s.day,chatMinutesDay:old.chatDay===s.day?old.chatMinutesDay:0};n=adjustRelation(n,id,minutes===5?2:4);
 n=recordJournal(n,`chat:${s.day}:${c.minute}:${id}`,(minutes===5?'Chào hỏi ':'Trò chuyện với ')+npc.name,minutes===5?'Hỏi thăm vài câu.':`Đã trò chuyện ${minutes} phút.`,id);return{ok:true,state:n}}
