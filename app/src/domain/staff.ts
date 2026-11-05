import type {GameState} from './types';
import {HIRE_SKILLS,KNOW,levelOf,staffOf,type Employee,type HireSkill,type Personality} from './hiring';
import {hash} from './shift';

/** T45 (Kế hoạch mục 34, 35.1; chủ dự án duyệt 05/11): chỉ số công việc của nhân viên và hành vi theo tính cách.
 *  Chưa giao việc (T46), chưa trả lương (T47), chưa sự kiện nhân sự (T48): tải việc luôn 0, mệt chỉ hồi. */
export interface WorkState{morale:number;loyalty:number;fatigue:number;ambition:number;/** Ngày đã cập nhật tới. */day:number;/** T46: số lần làm tốt (3 sao trở lên) theo loại việc; mỗi 5 lần cộng 5% tốc độ, tối đa 20%. */exp?:Partial<Record<HireSkill,number>>;/** T48: nghỉ (ốm, phép) tới hết ngày này; không tính tiến độ dự án. */off?:number;/** T51: số dự án liên tiếp quá sức và quá dễ. */strain?:{over:number;easy:number}}

/** Tính chất việc (mục 35.1) để khớp tính cách. */
export type Trait='urgent'|'risky'|'routine'|'client'|'team'|'solo'|'reward'|'long'|'easy'|'hard'|'picky';
export interface Job{skill:HireSkill;lv:number;traits?:Trait[]}

export interface Fx{speed:number;err:number;fit:Trait[];unfit:Trait[];fitSpeed:number;reportDelay:number;conflict:number;raise:number;moonlight:number;overreach:number;coop:number;loadCap:number;ambition:number}
/** Hiệu ứng điển hình theo bảng mục 35.1; các số là đề xuất, chỉnh khi cân bằng (T50). */
export const FX:Record<Personality,Fx>={
 'Cầu toàn':{speed:.85,err:.7,fit:['risky'],unfit:['urgent'],fitSpeed:1.05,reportDelay:.1,conflict:.1,raise:.1,moonlight:0,overreach:0,coop:0,loadCap:2,ambition:55},
 'Hay khoe':{speed:1,err:1.15,fit:['easy'],unfit:['hard'],fitSpeed:1.08,reportDelay:.6,conflict:.15,raise:.2,moonlight:.05,overreach:.6,coop:0,loadCap:3,ambition:70},
 'Ngại':{speed:1,err:1,fit:['routine','solo'],unfit:['client'],fitSpeed:1.06,reportDelay:.8,conflict:.05,raise:.05,moonlight:0,overreach:0,coop:0,loadCap:2,ambition:30},
 'Nóng tính':{speed:1.1,err:1.1,fit:['urgent'],unfit:['picky'],fitSpeed:1.05,reportDelay:.3,conflict:.6,raise:.2,moonlight:.05,overreach:.1,coop:0,loadCap:2,ambition:50},
 'Hay giúp đỡ':{speed:1,err:1,fit:['team'],unfit:['solo','long'],fitSpeed:1.05,reportDelay:.2,conflict:.05,raise:.1,moonlight:0,overreach:.2,coop:.08,loadCap:3,ambition:40},
 'Tham':{speed:1,err:1,fit:['reward'],unfit:['long'],fitSpeed:1.1,reportDelay:.3,conflict:.2,raise:.7,moonlight:.3,overreach:.1,coop:0,loadCap:2,ambition:80},
};
export const STAFF={startMorale:65,fatigueRest:15,moraleRate:.12,loyaltyRate:.08,maxCatchUp:90,quitMorale:40,quitLoyalty:55} as const;
const LOYAL_START:Record<Employee['motive'],number>={'Ổn định':65,'Lương cao':50,'Học hỏi':55};

const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
const r1=(v:number)=>Math.round(v*10)/10;
const mainSkill=(e:Employee)=>Math.max(e.skills.programming,e.skills.logic,e.skills.graphics);

/** Lương hợp lý theo trình độ chính: dưới mức này thì tinh thần giảm. */
export const fairWage=(e:Employee)=>levelOf(mainSkill(e)).base;
export const wageRatio=(e:Employee)=>e.wage/Math.max(1,fairWage(e));

/** T48: điểm thân với chủ 0–100 (mặc định theo độ tin cậy), bậc Bất hoà, Quen biết, Thân, Tri kỷ. */
/** T51: độ biết hiện tại; thiếu (save cũ) tính là khởi đầu. */
export const knowOf=(e:Employee)=>e.know??KNOW.start;
const round1=(v:number)=>Math.round(v*10)/10;
/** Cộng độ biết (kẹp 0–100, làm tròn 0,1). */
export const withKnow=(e:Employee,delta:number):Employee=>({...e,know:clamp(round1(knowOf(e)+delta),0,100)});
export const bondOf=(e:Employee)=>e.bond??Math.round(20+e.trust/10);
export const bondTier=(b:number)=>b>=60?'Tri kỷ':b>=30?'Thân':b>=15?'Quen biết':'Bất hoà';
/** Bất hoà làm cầm chừng, Tri kỷ làm hăng hơn. */
export const bondMult=(b:number)=>b>=60?1.05:b<15?.9:1;
/** T51: độ biết tăng nhanh hơn khi thân hơn (Thân ×1,2, Tri kỷ ×1,5). */
export const knowGain=(e:Employee,base:number)=>base*(bondOf(e)>=60?KNOW.bondHigh:bondOf(e)>=30?KNOW.bondMid:1);
/** Chỉ số ban đầu lúc thuê, không cần lưu: suy ra từ hồ sơ. */
export function initialWork(e:Employee):WorkState{return{morale:STAFF.startMorale,loyalty:LOYAL_START[e.motive],fatigue:0,ambition:clamp(FX[e.personality].ambition+(hash(`amb:${e.id}`)%11)-5,0,100),day:e.hiredDay}}

/** Một ngày trôi qua: tinh thần và gắn bó bám theo mục tiêu (lương so với mức hợp lý, động cơ, thâm niên), mệt hồi. */
function step(w:WorkState,e:Employee,day:number):WorkState{
 const ratio=wageRatio(e),pay=clamp((ratio-1)*60,-30,25)*(e.motive==='Lương cao'?1.5:1),tenure=Math.min(15,(day-e.hiredDay)/30*3);
 const moraleGoal=clamp(60+pay+(e.motive==='Ổn định'?5:0),0,100);
 const morale=w.morale+(moraleGoal-w.morale)*STAFF.moraleRate;
 const loyaltyGoal=clamp(45+(morale-50)*.6+tenure+(e.motive==='Ổn định'?5:0),0,100);
 const loyalty=w.loyalty+(loyaltyGoal-w.loyalty)*STAFF.loyaltyRate;
 const grows=e.personality==='Tham'||e.personality==='Hay khoe';
 return{morale:r1(clamp(morale,0,100)),loyalty:r1(clamp(loyalty,0,100)),fatigue:Math.max(0,w.fatigue-STAFF.fatigueRest),ambition:r1(clamp(w.ambition+(grows?.3:0),0,100)),day,...(w.exp?{exp:w.exp}:{}),...(w.off!==undefined?{off:w.off}:{})}}

/** Chỉ số tại một ngày (dẫn xuất từ bản đã lưu, không ghi vào save). */
export function workAt(e:Employee,day:number):WorkState{
 let w=e.work??initialWork(e);if(day<=w.day)return w;const end=Math.min(day,w.day+STAFF.maxCatchUp);
 for(let d=w.day+1;d<=end;d++)w=step(w,e,d);return w.day===day?w:{...w,day}}

/** Ghi chỉ số đã cập nhật vào save (gọi mỗi khi qua ngày). */
export function settleStaff(next:GameState):GameState{
 const staff=staffOf(next);if(!staff.length||!next.company)return next;
 let changed=false;const out=staff.map(e=>{const w=workAt(e,next.day);if(e.work&&e.work.day===w.day)return e;changed=true;return{...e,work:w}});
 return changed?{...next,company:{...next.company,staff:out}}:next}

/** Hệ số kinh nghiệm cùng loại việc (mục 35.1): +5% mỗi 5 lần, tối đa +20%. */
export const expMult=(w:WorkState,skill:HireSkill)=>1+Math.min(.2,.05*Math.floor((w.exp?.[skill]??0)/5));
/** Hệ số tốc độ theo tinh thần (mục 35.1). */
export const moraleMult=(m:number)=>m>=70?1.1:m>=40?1:m>=20?.85:.6;
const has=(list:Trait[]|undefined,t:Trait[])=>!!list&&t.some(x=>list.includes(x));

export function speedOf(e:Employee,day:number,job?:Job){
 const w=workAt(e,day),fx=FX[e.personality],d=job?e.skills[job.skill]-job.lv:0;
 let s=clamp(1+.12*d,.5,1.6)*moraleMult(w.morale)*fx.speed*bondMult(bondOf(e))*(job?expMult(w,job.skill):1);
 if(has(job?.traits,fx.fit))s*=fx.fitSpeed;if(has(job?.traits,fx.unfit))s*=2-fx.fitSpeed;
 return r1(s*100)/100}
export function errorOf(e:Employee,day:number,job?:Job){
 const w=workAt(e,day),fx=FX[e.personality],d=job?e.skills[job.skill]-job.lv:0;
 let p=Math.max(.02,.2-.05*d)*fx.err+(w.fatigue>50?.005*(w.fatigue-50):0);
 if(has(job?.traits,fx.unfit))p+=.03;
 return Math.round(clamp(p,.01,.9)*1000)/1000}

/** Nguy cơ xin nghỉ 0–1: thấp khi gắn bó cao; tăng khi tinh thần thấp, lương dưới mức hợp lý (nặng với người Tham). */
export function quitRisk(e:Employee,day:number){
 const w=workAt(e,day),ratio=wageRatio(e),under=ratio<.9?(.9-ratio)*(e.personality==='Tham'?1.5:1):0;
 return Math.round(clamp((STAFF.quitLoyalty-w.loyalty)/100+(STAFF.quitMorale-w.morale)/150+under+(bondOf(e)<15?.1:bondOf(e)>=60?-.05:0),0,1)*100)/100}
/** Khả năng xin tăng lương 0–1 (T48 dùng để phát sự kiện). */
export function raiseChance(e:Employee,day:number){
 const w=workAt(e,day),fx=FX[e.personality],gap=Math.max(0,1.05-wageRatio(e));
 return Math.round(clamp(fx.raise*(gap*2+.1)+(w.ambition/100)*.1*fx.raise,0,1)*100)/100}

/** Hành vi theo tính cách, tổng hợp để mô phỏng và hiển thị. */
export function behaviorOf(e:Employee,day:number,job?:Job){const fx=FX[e.personality];
 return{speed:speedOf(e,day,job),error:errorOf(e,day,job),quitRisk:quitRisk(e,day),raiseChance:raiseChance(e,day),reportDelay:fx.reportDelay,conflict:fx.conflict,moonlight:fx.moonlight,overreach:fx.overreach,coop:fx.coop,loadCap:fx.loadCap}}

export function validWork(v:unknown,day:number):v is WorkState{
 if(!v||typeof v!=='object')return false;const w=v as WorkState;
 return [w.morale,w.loyalty,w.fatigue,w.ambition].every(x=>Number.isFinite(x)&&x>=0&&x<=100)&&Number.isInteger(w.day)&&w.day>=0&&w.day<=day&&(w.off===undefined||Number.isInteger(w.off)&&w.off>=0&&w.off<=1e6)&&(w.strain===undefined||!!w.strain&&Number.isInteger(w.strain.over)&&w.strain.over>=0&&w.strain.over<=99&&Number.isInteger(w.strain.easy)&&w.strain.easy>=0&&w.strain.easy<=99)&&(w.exp===undefined||typeof w.exp==='object'&&w.exp!==null&&Object.entries(w.exp).every(([k,n])=>HIRE_SKILLS.includes(k as HireSkill)&&Number.isInteger(n)&&n>=0&&n<=9999))}

