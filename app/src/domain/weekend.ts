/** T31: ca làm thêm cuối tuần (chủ dự án duyệt 05/11): Thứ 7 và Chủ nhật, 4 giờ, 240.000đ, tốn năng lượng, mỗi ngày một ca, mở mọi lúc. */
import type {GameState,GameResult} from './types';
import {post,posted} from './money';
import {spendTime} from './time';
import {dateAt} from './format';

export const WEEKEND={minutes:240,pay:240000,energy:20,stress:5,minEnergy:25};
const clamp=(n:number)=>Math.min(100,Math.max(0,Math.round(n)));
export const isWeekend=(day:number)=>{const d=dateAt(day).getUTCDay();return d===0||d===6};
const shiftId=(day:number)=>`weekend:${day}`;
export const weekendDone=(s:GameState)=>posted(s,shiftId(s.day));

export function weekendJob(s:GameState):GameResult{
 if(!isWeekend(s.day))return{ok:false,error:'Ca làm thêm chỉ có Thứ 7 và Chủ nhật.'};
 if(weekendDone(s))return{ok:false,error:'Hôm nay đã làm một ca rồi.'};
 if(s.energy<WEEKEND.minEnergy)return{ok:false,error:'Mệt quá, nghỉ đã.'};
 const t=spendTime(s,WEEKEND.minutes);if(!t.ok)return t;
 const n=structuredClone(t.state);n.energy=clamp(n.energy-WEEKEND.energy);n.stress=clamp(n.stress+WEEKEND.stress);
 if(post(n,{id:shiftId(s.day),name:'Làm thêm cuối tuần',amount:WEEKEND.pay})!=='ok')return{ok:false,error:'Không ghi được thu nhập.'};
 return{ok:true,state:n}}
