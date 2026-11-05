/** T32: khách tay trái và dự án riêng buổi tối (chủ dự án duyệt 05/11).
 * Cần bàn làm việc mẫu cao đặt trong phòng. Tối đa 2 đơn mở, hạn 7 ngày, 4 buổi tối (2 giờ) xong một đơn, trả 2 đến 5 triệu theo Lv.
 * Nộp trễ trả 70%; quá hạn 3 ngày thì huỷ. Uy tín tay trái 0–100 (khởi đầu 50) quyết định số đơn xuất hiện; T33 dùng làm điều kiện mở công ty. */
import {fitMult} from './fitness';
import type {GameState,GameResult} from './types';
import {placedAt} from './home';
import {clockOf,spendTime} from './time';
import {post} from './money';
import {addWorkXp} from './study';
import {defaultSkills,type SkillId} from './skill-xp';
import {recordJournal} from './journal';
import {hash} from './shift';

export type SideKind='programming'|'graphics'|'logic';
export interface SideOrder{id:string;kind:SideKind;title:string;minLevel:number;pay:number;opened:number;due:number;sessions:number}
export interface SideState{version:1;rep:number;seq:number;last:number;orders:SideOrder[]}
export const SIDE={maxOrders:2,days:7,grace:3,sessions:4,minutes:120,energy:10,stress:3,minEnergy:20,eveningFrom:1080,xp:20,latePct:70,repStart:50,repOnTime:5,repLate:-5,repCancel:-10,payBase:2000000,payStep:750000,maxLevel:5};
export const KINDS:SideKind[]=['programming','graphics','logic'];
const TITLES:Record<SideKind,string[]>={programming:['Trang giới thiệu cho quán cà phê','Công cụ nhập liệu cho cửa hàng nhỏ','Ứng dụng đặt lịch cho tiệm cắt tóc'],graphics:['Bộ nhận diện cho quán ăn','Banner khai trương tiệm hoa','Menu in cho quán trà'],logic:['Bảng tính tồn kho cho tạp hoá','Quy trình chấm công cho xưởng nhỏ','Tính giá vốn cho tiệm bánh']};
const clamp=(n:number)=>Math.min(100,Math.max(0,Math.round(n)));
export const sideOf=(s:GameState):SideState=>s.side??{version:1,rep:SIDE.repStart,seq:0,last:-1,orders:[]};
export const repOf=(s:GameState)=>sideOf(s).rep;
export const payFor=(minLevel:number)=>SIDE.payBase+SIDE.payStep*(minLevel-1);
const levelOf=(s:GameState,k:SideKind)=>({...defaultSkills(),...s.skills})[k as SkillId].level;
/** Có bàn làm việc mẫu cao đặt trong phòng thì mới nhận và làm đơn. */
export const hasProDesk=(s:GameState)=>placedAt(s,'desk')?.tier==='premium';
/** Số ngày còn tới hạn (âm là đã trễ). */
export const daysLeft=(s:GameState,o:SideOrder)=>o.due-s.day;

/** Đơn mới mỗi ngày: xác suất 20% cộng 0,4% mỗi điểm uy tín; chọn theo seed để tải lại không đổi. */
function newOrder(s:GameState,side:SideState):SideOrder|null{
 if(!hasProDesk(s)||side.orders.length>=SIDE.maxOrders)return null;
 const chance=20+side.rep*0.4;if(hash(`side:${s.day}:roll`)%100>=chance)return null;
 const kind=KINDS[hash(`side:${s.day}:kind`)%KINDS.length]!,top=Math.min(SIDE.maxLevel,levelOf(s,kind)),minLevel=1+hash(`side:${s.day}:lv`)%top;
 const titles=TITLES[kind];return{id:`s${side.seq}`,kind,title:titles[hash(`side:${s.day}:title`)%titles.length]!,minLevel,pay:payFor(minLevel),opened:s.day,due:s.day+SIDE.days,sessions:0}}

/** Qua ngày: đơn quá hạn 3 ngày thì huỷ, mất uy tín; có thể xuất hiện đơn mới. */
export function settleSide(next:GameState):GameState{
 const side=structuredClone(sideOf(next));let n=next,changed=false;
 for(const o of [...side.orders])if(n.day>o.due+SIDE.grace){side.orders=side.orders.filter(x=>x.id!==o.id);side.rep=clamp(side.rep+SIDE.repCancel);changed=true;n=recordJournal(n,`side-cancel:${o.id}`,'Khách huỷ đơn',`${o.title}: quá hạn, khách tìm người khác.`)}
 const fresh=newOrder(n,side);if(fresh){side.orders.push(fresh);side.seq++;changed=true}
 return changed||n.side?{...n,side}:n}

/** Một buổi tối làm đơn: sau 18:00, tại phòng có bàn mẫu cao, mỗi ngày một buổi. Đủ buổi thì nộp và nhận tiền. */
export function sideWork(s:GameState,id:string):GameResult{
 const side=structuredClone(sideOf(s)),o=side.orders.find(x=>x.id===id);if(!o)return{ok:false,error:'Không còn đơn này.'};
 const c=clockOf(s);if(c.location!=='home'||!hasProDesk(s))return{ok:false,error:'Cần bàn làm việc cao cấp trong phòng.'};
 if(c.minute<SIDE.eveningFrom)return{ok:false,error:'Dự án riêng làm buổi tối, sau 18:00.'};
 if(side.last===s.day)return{ok:false,error:'Hôm nay đã làm một buổi rồi.'};
 if(levelOf(s,o.kind)<o.minLevel)return{ok:false,error:`Cần ${o.kind==='programming'?'Lập trình':o.kind==='graphics'?'Đồ họa':'Logic'} Lv${o.minLevel}.`};
 if(s.energy<SIDE.minEnergy)return{ok:false,error:'Mệt quá, nghỉ đã.'};
 const t=spendTime(s,SIDE.minutes);if(!t.ok)return t;let n=structuredClone(t.state);
 n.energy=clamp(n.energy-Math.round(SIDE.energy*fitMult(n)));n.stress=clamp(n.stress+SIDE.stress);n=addWorkXp(n,o.kind as SkillId,SIDE.xp);
 o.sessions++;side.last=s.day;
 if(o.sessions>=SIDE.sessions){
  const late=s.day>o.due,pay=late?Math.round(o.pay*SIDE.latePct/100):o.pay;
  if(post(n,{id:`side:${o.id}`,name:`Khách tay trái: ${o.title}`,amount:pay})!=='ok')return{ok:false,error:'Không ghi được thu nhập.'};
  side.orders=side.orders.filter(x=>x.id!==o.id);side.rep=clamp(side.rep+(late?SIDE.repLate:SIDE.repOnTime));
  n=recordJournal(n,`side-done:${o.id}`,late?'Nộp trễ cho khách':'Xong đơn tay trái',`${o.title}: nhận ${pay.toLocaleString('vi-VN')}đ${late?' (trễ hạn, trả 70%)':''}.`)}
 n.side=side;return{ok:true,state:n}}

export function validSide(v:unknown,day:number):v is SideState{
 if(!v||typeof v!=='object')return false;const b=v as SideState,int=(x:unknown,lo:number,hi:number)=>Number.isInteger(x)&&(x as number)>=lo&&(x as number)<=hi;
 if(b.version!==1||!int(b.rep,0,100)||!int(b.seq,0,100000)||!int(b.last,-1,day)||!Array.isArray(b.orders)||b.orders.length>SIDE.maxOrders)return false;
 return b.orders.every(o=>o&&typeof o.id==='string'&&o.id.length<20&&KINDS.includes(o.kind)&&typeof o.title==='string'&&o.title.length<80&&int(o.minLevel,1,SIDE.maxLevel)&&int(o.pay,0,10000000)&&int(o.opened,0,day)&&int(o.due,0,day+SIDE.days)&&int(o.sessions,0,SIDE.sessions-1))}
