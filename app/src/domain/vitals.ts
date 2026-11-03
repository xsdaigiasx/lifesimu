import type {GameState} from './types';
/** T06: chỉ số No, hệ số thể trạng m và cảnh báo sớm (workflow mục 11, 68, 73). Số liệu là đề xuất, chỉnh ở đây. */
export const VITALS={fullStart:70,awakeDrainPerHour:5,sleepDrainPerHour:2,sleepHours:8,mFull:60,mFloor:20,mMin:.5,sickHealth:40,stressHigh:70,stressBurnout:85,warn:{low:40,soon:60,stress:60,health:50}} as const;
export const clampVital=(n:number)=>Math.max(0,Math.min(100,n));
const round1=(n:number)=>Math.round(n*10)/10;
export const fullnessOf=(s:GameState)=>s.fullness??VITALS.fullStart;
/** Đói dần theo thời gian thức; trả về state mới (không sửa bản gốc). */
export function drainFullness(s:GameState,minutes:number):GameState{if(minutes<=0)return s;return{...s,fullness:round1(clampVital(fullnessOf(s)-minutes*VITALS.awakeDrainPerHour/60))}}
/** Ngủ đủ đêm: mất No theo giờ ngủ (sửa trực tiếp bản sao n). */
export function drainSleep(n:GameState){n.fullness=round1(clampVital(fullnessOf(n)-VITALS.sleepHours*VITALS.sleepDrainPerHour))}
export function eatFullness(n:GameState,amount:number){n.fullness=round1(clampVital(fullnessOf(n)+amount))}
/** Hệ số thể trạng m: 1,0 khi chăm đủ; chỉ phạt khi lơ là. */
export function vitalFactor(s:GameState){const x=Math.min(s.energy,fullnessOf(s),s.mood);let m=x>=VITALS.mFull?1:x>=VITALS.mFloor?.7+.3*(x-VITALS.mFloor)/(VITALS.mFull-VITALS.mFloor):VITALS.mMin;if(s.health<VITALS.sickHealth||s.life?.conditions?.length)m*=.8;if(s.stress>=VITALS.stressBurnout)m*=.8;else if(s.stress>=VITALS.stressHigh)m*=.9;return Math.round(m*1000)/1000}
export type WarnLevel='soon'|'low';
export interface VitalWarning{key:'energy'|'fullness'|'mood'|'stress'|'health';level:WarnLevel;text:string}
/** Cảnh báo sớm: hiện trước khi chạm ngưỡng phạt (m bắt đầu giảm dưới 60). */
export function vitalWarnings(s:GameState):VitalWarning[]{const w:VitalWarning[]=[],{low,soon}=VITALS.warn;const lack=(key:'energy'|'fullness'|'mood',v:number,name:string,hint:string)=>{if(v<low)w.push({key,level:'low',text:`${name} rất thấp: ${hint}`});else if(v<soon)w.push({key,level:'soon',text:`${name} sắp thấp: ${hint}`})};
lack('fullness',fullnessOf(s),'Bạn đang đói','hãy ăn sớm');lack('energy',s.energy,'Năng lượng','hãy nghỉ hoặc ngủ');lack('mood',s.mood,'Tinh thần','hãy thư giãn hoặc gặp bạn');
if(s.stress>=VITALS.stressHigh)w.push({key:'stress',level:'low',text:'Căng thẳng cao: làm việc kém hiệu quả, hãy nghỉ ngơi'});else if(s.stress>=VITALS.warn.stress)w.push({key:'stress',level:'soon',text:'Căng thẳng đang dâng: nên nghỉ sớm'});
if(s.health<VITALS.sickHealth)w.push({key:'health',level:'low',text:'Sức khỏe yếu: hiệu suất giảm, nên đi khám'});else if(s.health<VITALS.warn.health)w.push({key:'health',level:'soon',text:'Sức khỏe đang xuống: giữ ăn ngủ đều'});
return w}
/** Cuối ngày: có chỉ số rơi dưới mức sàn thì Sức khỏe −3 (mục 11.1). */
export const dailyHealthPenalty=(s:GameState)=>Math.min(s.energy,fullnessOf(s),s.mood)<VITALS.mFloor?3:0;
/** T07: thời gian trôi hao Năng lượng 2,5/giờ (ca làm và học đã tự tính riêng); ngủ +10/giờ; nghỉ ngồi +3/giờ. */
export const REST={idleEnergyPerHour:2.5,sleepEnergyPerHour:10,sitEnergyPerHour:3,fullBlock:90} as const;
/** Số nguyên, cố định theo đồng hồ (không cần lưu phần lẻ): mỗi mốc 24 phút hao 1 năng lượng. */
export const drainIdleEnergy=(s:GameState,from:number,to:number):GameState=>{const lost=Math.floor(to*REST.idleEnergyPerHour/60)-Math.floor(from*REST.idleEnergyPerHour/60);return lost<=0?s:{...s,energy:Math.max(0,s.energy-lost)}};
/** Số phút ngủ thật nếu đi ngủ lúc `minute` (tính từ 00:00 hôm nay) đến lúc dậy 07:00 hôm sau. */
export const sleepMinutes=(minute:number,wake:number)=>Math.max(0,1440+wake-minute);
export const sleepEnergy=(minutes:number)=>Math.round(minutes/60*REST.sleepEnergyPerHour);
