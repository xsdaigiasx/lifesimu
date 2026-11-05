/** T60: Thể lực (0 đến 100, dài hạn), khác Sức khoẻ (hiện tại). Tăng khi rèn luyện ở công viên, mất dần khi bỏ tập quá lâu.
 * Thể lực cao giảm tới 20% năng lượng hao (rảnh, đi làm, học, làm thêm) và giúp ngủ hồi thêm tới 10%. Giao diện chỉ hiện chữ mức, không số. */
import type {GameState} from './types';
export const FIT={start:0,max:100,gain:{exercise:4,stretch:2,walk:1} as Record<string,number>,dailyCap:5,idleGrace:3,decayPerDay:1,energyCut:.2,sleepBoost:.1,
 levels:[[0,'Yếu'],[20,'Trung bình'],[40,'Khá'],[65,'Tốt'],[85,'Rất tốt']] as [number,string][]};
/** value: điểm tại ngày `at`; last: ngày tập gần nhất; gainDay và gained: phần đã cộng trong ngày (trần mỗi ngày). */
export interface FitState{value:number;at:number;last:number;gainDay:number;gained:number}
export function validFit(v:unknown,day:number):v is FitState{if(!v||typeof v!=='object')return false;const f=v as FitState,i=(x:unknown,max:number)=>Number.isInteger(x)&&(x as number)>=0&&(x as number)<=max;return i(f.value,FIT.max)&&i(f.at,day)&&i(f.last,day)&&i(f.gainDay,day)&&i(f.gained,FIT.dailyCap)}
/** Điểm Thể lực tại một ngày: bỏ tập quá `idleGrace` ngày thì mất `decayPerDay` mỗi ngày. */
export function fitValue(s:GameState,day=s.day):number{const f=s.life?.fit;if(!f)return FIT.start;return Math.max(0,f.value-FIT.decayPerDay*Math.max(0,day-Math.max(f.at,f.last+FIT.idleGrace)))}
export const fitLevel=(s:GameState)=>{const v=fitValue(s);return FIT.levels.filter(([min])=>v>=min).pop()![1]};
/** Hệ số nhân năng lượng hao (1 là không giảm). */
export const fitMult=(s:GameState)=>1-FIT.energyCut*fitValue(s)/FIT.max;
export const sleepMult=(s:GameState)=>1+FIT.sleepBoost*fitValue(s)/FIT.max;
/** Trạng thái Thể lực mới sau một buổi tập; null nếu hoạt động không cộng Thể lực. */
export function trainFit(s:GameState,activity:string):FitState|null{const g=FIT.gain[activity];if(!g)return null;const f=s.life?.fit,already=f&&f.gainDay===s.day?f.gained:0,add=Math.max(0,Math.min(g,FIT.dailyCap-already));
 return{value:Math.min(FIT.max,fitValue(s)+add),at:s.day,last:s.day,gainDay:s.day,gained:already+add}}
