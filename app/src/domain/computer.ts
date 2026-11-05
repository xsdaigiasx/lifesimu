/** T56 (chủ dự án duyệt 05/11): cấu hình máy tính quyết định tốc độ làm thêm, học và tiền điện.
 * Máy khởi đầu là laptop cũ; mua thêm máy tầm trung hoặc máy mạnh ở TTTM (mục Điện tử), máy tốt nhất đang có được dùng. */
import type {GameState} from './types';

export type MachineId='old'|'mid'|'pro';
/** `mult` nhân tiền và XP khi làm thêm, XP khi học; `watt` là công suất khi dùng (máy cũ hao điện hơn máy tầm trung). */
export const MACHINES:Record<MachineId,{name:string;mult:number;watt:number}>={
 old:{name:'Laptop cũ',mult:.9,watt:65},
 mid:{name:'Laptop tầm trung',mult:1,watt:50},
 pro:{name:'Laptop mạnh',mult:1.15,watt:100}};
export const machineOf=(s:GameState):MachineId=>{const o=(s.life?.owned??[]) as readonly string[];return o.includes('laptopPro')?'pro':o.includes('laptopMid')?'mid':'old'};
export const machineMult=(s:GameState)=>MACHINES[machineOf(s)].mult;
/** Giải trí trên máy: một lần mỗi ngày, tinh thần có trần. */
export const PLAY={minutes:60,energy:3,mood:8,stress:8};
