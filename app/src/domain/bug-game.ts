import type {SkillId} from './skill-xp';
/** Mini game "Nối dây" (thay Săn lỗi, chủ dự án chốt 04/11): khi nhiệm vụ có sự cố, nối các đầu dây cùng màu. Bài sinh từ seed nên tải lại vẫn ra đúng bài; không cần biết lập trình. */
export type BugKind='wires';
/** `options` là màu cột phải theo thứ tự đã xáo, cột trái luôn theo WIRE_COLORS. `answer` chỉ là mốc đúng/sai cho fixBug. */
export interface BugPuzzle{kind:BugKind;title:string;prompt:string;options:string[];answer:number;limitMs:number}
export const WIRE_COLORS=['red','blue','green','yellow','purple'] as const;
export const WIRE_MISTAKES=3;
const rng=(seed:number)=>{let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}};
export function bugPuzzle(seed:number,_skill?:SkillId):BugPuzzle{const r=rng(seed*2654435761>>>0),n=3+Math.floor(r()*3),left=WIRE_COLORS.slice(0,n) as string[];let right=[...left];
 for(let tries=0;tries<20;tries++){for(let i=right.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[right[i],right[j]]=[right[j]!,right[i]!]}if(right.some((c,i)=>c!==left[i]))break}
 return{kind:'wires',title:'Nối dây',prompt:'Nối các đầu cùng màu.',options:right,answer:0,limitMs:6000*n}}
/** Không còn đáp án để làm mờ; giữ hàm cho nơi gọi cũ. */
export function hiddenOptions(_p:BugPuzzle,_logicLevel:number,_seed:number):number[]{return[]}
/** Thưởng/phạt thời gian sửa (tỷ lệ giờ chuẩn, mục 12.2: 25–40%). Sai nghĩa là nối nhầm đủ WIRE_MISTAKES lần. */
export const REPAIR_FAST=.25,REPAIR_SLOW=.33,REPAIR_WRONG=.4;
export function repairFraction(p:BugPuzzle,choice:number,ms:number){if(choice!==p.answer)return{frac:REPAIR_WRONG,result:'wrong' as const};return ms<=p.limitMs/2?{frac:REPAIR_FAST,result:'fast' as const}:{frac:REPAIR_SLOW,result:'slow' as const}}
