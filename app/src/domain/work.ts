import {fullnessOf,vitalFactor,drainFullness,applyCoffeeCrash} from './vitals';
import type {GameState,GameResult} from './types';
import {post} from './money';
import {clockOf,END,seedUnit} from './time';
import {officeOf,PROBATION_PASS_DAYS,PROBATION_SALARY,RETRY_AFTER_FAIL} from './office';
import {dateAt,money} from './format';
import {recordJournal} from './journal';
import {tierSalary,nextTier,promotionGaps,TIER_NAME,type Tier,type TierFacts} from './career';
import {bugPuzzle,repairFraction} from './bug-game';
import {SKILLS,xpNeeded,defaultSkills,gainXp,MAX_LEVEL,type SkillId,type Skills} from './skill-xp';
import {addWorkXp,certLevel} from './study';
import {hash,pickTurn,turnOf,ratingOf,urgentBonus,CARD_NAME,HELP_CHANCE,URGENT_RATING,LATE_RATING,HELP_RELATION,TURNS,type CardKind,type TaskCard} from './shift';
import {COWORKERS,adjustRelation} from './social';
import holidays from './calendar-2026.json';
export {SKILLS,xpNeeded} from './skill-xp';
export type {SkillId,Skill,Skills} from './skill-xp';
export function skillsOf(s:GameState):Skills{return{...defaultSkills(),...s.skills}}
export function validSkills(v:unknown):v is Skills{if(!v||typeof v!=='object')return false;return Object.keys(SKILLS).every(k=>{const q=(v as Partial<Skills>)[k as SkillId];if(q===undefined)return k==='cooking';return!!q&&Number.isInteger(q.level)&&q.level>=1&&q.level<=MAX_LEVEL&&Number.isInteger(q.xp)&&q.xp>=0&&(q.level===MAX_LEVEL?q.xp===0:q.xp<xpNeeded(q.level))})}
export function addSkillXp(s:GameState,id:SkillId,xp:number):GameState{if(skillsOf(s)[id].level>=MAX_LEVEL)return s;return{...s,skills:gainXp(skillsOf(s),id,xp)}}
export const TASKS=[
{id:'null-data',name:'Sửa lỗi dữ liệu rỗng',skill:'programming',secondary:'logic',level:1,minutes:60,error:5,xp:12},
{id:'test-form',name:'Kiểm tra biểu mẫu',skill:'logic',secondary:'programming',level:2,minutes:90,error:8,xp:18},
{id:'layout',name:'Căn bố cục giao diện',skill:'graphics',secondary:'programming',level:2,minutes:120,error:12,xp:22},
{id:'api',name:'Xử lý dữ liệu API',skill:'programming',secondary:'logic',level:3,minutes:120,error:15,xp:24},
{id:'logs',name:'Tìm nguyên nhân qua log',skill:'logic',secondary:'programming',level:4,minutes:180,error:20,xp:30},
{id:'planning',name:'Ước lượng đầu việc',skill:'management',secondary:'communication',level:2,minutes:60,error:10,xp:16},
{id:'request',name:'Làm rõ yêu cầu',skill:'communication',secondary:'management',level:1,minutes:60,error:5,xp:12}
] as const;
export type TaskId=typeof TASKS[number]['id'];
export interface PendingTask {id:TaskId;elapsed:number;required:number;attempt:number;errorPct:number;roll:number;serial:number}
export interface WorkRun {day:number;slot:'am'|'pm'|'ot';end:number;started:number;minutes:number;paused:boolean;companyId:string}
export interface WagePeriod {key:string;companyId:string;month:string;salary:number;minutes:number;paid:boolean;amount:number;bonus?:number}
export interface Assignment {day:number;id:TaskId;companyId:string;kind?:CardKind;deadline?:number;bonus?:number;npcId?:string;outcome?:'done'|'late'}
export interface ShiftTurn {day:number;id:string;slot:'am'|'pm';at:number;state:'waiting'|'open'|'done'}
export interface WorkState {bug?:{serial:number;attempt:number;seed:number};assignment?:Assignment;rating?:number;turn?:ShiftTurn;taken?:{day:number;kinds:CardKind[]};version:1;seed:number;trackingDay:number;serial:number;active:WorkRun|null;task:PendingTask|null;finished:string[];periods:WagePeriod[];holidayDays:number[];lastResult:string}
const integer=(v:unknown,min:number,max:number):v is number=>Number.isSafeInteger(v)&&Number(v)>=min&&Number(v)<=max;
export function validWork(v:unknown,day:number):v is WorkState{if(!v||typeof v!=='object')return false;const w=v as WorkState;if(w.version!==1||!integer(w.seed,0,4294967295)||!integer(w.trackingDay,0,day)||!integer(w.serial,0,1e9)||typeof w.lastResult!=='string'||w.lastResult.length>250||!Array.isArray(w.finished)||w.finished.length>500||new Set(w.finished).size!==w.finished.length||!w.finished.every(x=>typeof x==='string'&&/^\d+:(am|pm|ot)$/.test(x)&&Number(x.split(':')[0])<=day)||!Array.isArray(w.holidayDays)||w.holidayDays.length>400||!w.holidayDays.every(d=>integer(d,0,day))||!Array.isArray(w.periods)||w.periods.length>1000)return false;
 if(w.bug!==undefined&&!(w.bug&&integer(w.bug.attempt,1,2)&&integer(w.bug.seed,0,4294967295)&&w.task&&w.task.serial===w.bug.serial))return false;
 if(w.assignment&&(!integer(w.assignment.day,0,day)||!TASKS.some(t=>t.id===w.assignment!.id)||!['sen-code','an-nhien-tech'].includes(w.assignment.companyId)))return false;
 if(!validShiftExtras(w,day))return false;
 if(!w.periods.every(p=>p&&['sen-code','an-nhien-tech'].includes(p.companyId)&&p.key===p.companyId+':'+p.month&&/^\d{4}-\d{2}$/.test(p.month)&&integer(p.salary,0,1e9)&&integer(p.minutes,0,31*600)&&typeof p.paid==='boolean'&&integer(p.amount,0,1e12)&&(p.bonus===undefined||integer(p.bonus,0,1e9)))||new Set(w.periods.map(p=>p.key)).size!==w.periods.length)return false;
 if(w.task){const t=w.task;if(!TASKS.some(x=>x.id===t.id)||!integer(t.elapsed,0,t.required)||!integer(t.required,1,1000)||!integer(t.attempt,0,2)||!integer(t.serial,0,w.serial)||!Number.isFinite(t.roll)||t.roll<0||t.roll>=100||!Number.isFinite(t.errorPct)||t.errorPct<1||t.errorPct>70)return false;}
 if(w.active){const a=w.active;if(!w.task||a.day!==day||!['am','pm','ot'].includes(a.slot)||a.end!==(a.slot==='am'?720:a.slot==='ot'?1140:1020)||!integer(a.started,a.slot==='am'?480:a.slot==='ot'?1020:780,a.end-1)||!integer(a.minutes,0,a.end-a.started)||typeof a.paused!=='boolean'||!['sen-code','an-nhien-tech'].includes(a.companyId))return false;}
 return true;
}
export function workOf(s:GameState):WorkState{return s.work??{version:1,seed:0,trackingDay:s.day,serial:0,active:null,task:null,finished:clockOf(s).lastWorkDay===s.day?[`${s.day}:am`,`${s.day}:pm`]:[],periods:[],holidayDays:[],lastResult:''}}
const monthOf=(day:number)=>dateAt(day).toISOString().slice(0,7);
export const salaryFor=(id:string,probation=false,tier:Tier='junior')=>tierSalary(id,tier,probation,PROBATION_SALARY);
export function holidayName(day:number){const iso=dateAt(day).toISOString().slice(0,10);if(iso.startsWith('2026'))return holidays.holidayDates.find(h=>h.date===iso)?.name??null;const key=iso.slice(5);return ({'01-01':'Tết Dương lịch','04-30':'Ngày Chiến thắng','05-01':'Quốc tế Lao động','09-01':'Quốc khánh','09-02':'Quốc khánh','11-24':'Ngày Văn hóa Việt Nam'} as Record<string,string>)[key]??null;}
export function isWorkday(day:number){const dow=dateAt(day).getUTCDay();return dow!==0&&dow!==6&&!holidayName(day)}
export function standardMinutes(month:string){const[y,m]=month.split('-').map(Number);let count=0;for(let d=1;d<=31;d++){const dt=new Date(Date.UTC(y!,m!-1,d));if(dt.getUTCMonth()!==m!-1)break;if(dt.getUTCDay()!==0&&dt.getUTCDay()!==6)count++}return count*480;}
function periodOf(s:GameState,companyId:string){const w=s.work!,month=monthOf(s.day),key=companyId+':'+month;let p=w.periods.find(p=>p.key===key);if(!p){p={key,companyId,month,salary:salaryFor(companyId,!!officeOf(s).probation,officeOf(s).tier),minutes:0,paid:false,amount:0};w.periods.push(p)}return p}
/** Thưởng cộng vào lương kỳ này, trả ngày 1 cùng lương. */
function addBonus(s:GameState,companyId:string,amount:number){const p=periodOf(s,companyId);if(!p.paid&&amount>0)p.bonus=(p.bonus??0)+amount}
function credit(s:GameState,companyId:string,minutes:number){const w=s.work!,month=monthOf(s.day),key=companyId+':'+month;let p=w.periods.find(p=>p.key===key);if(!p){p={key,companyId,month,salary:salaryFor(companyId,!!officeOf(s).probation,officeOf(s).tier),minutes:0,paid:false,amount:0};w.periods.push(p)}if(!p.paid)p.minutes=Math.min(standardMinutes(month),p.minutes+minutes);}
/** T12 (mục 12.2): d = Lv kỹ năng − Lv yêu cầu. Tốc độ s = clamp(1 + 0,12 d; 0,5; 1,6). */
export const skillSpeed=(d:number)=>Math.max(.5,Math.min(1.6,1+.12*d));
/** Tỷ lệ lỗi (%) = clamp(lỗi nền của việc − 5% × d + 30% × (1 − m) − 2% mỗi bậc máy; 3%; 60%). Căng thẳng, ngủ thiếu đã nằm trong m. */
export function errorChance(s:GameState,id:TaskId){const t=TASKS.find(t=>t.id===id)!;const d=skillsOf(s)[t.skill].level-t.level,device=officeOf(s).workComputer;return Math.max(3,Math.min(60,t.error-5*d+30*(1-vitalFactor(s))-(device-1)*2));}
/** XP = H × 8 × (1 + 0,25 × max(0, Lvyc − Lv)); việc quá dễ (d ≥ 3) chỉ nhận một nửa. */
export function taskXp(t:{minutes:number;level:number},level:number){const d=level-t.level,base=t.minutes/60*8*(1+.25*Math.max(0,-d));return Math.max(1,Math.round(d>=3?base/2:base))}
function roll(serial:number,day:number,id:string,seed=0){let n=2166136261;for(const c of `${seed}:${serial}:${day}:${id}`){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return(n>>>0)/4294967296*100;}
function makeTask(s:GameState,id:TaskId){const w=s.work!,t=TASKS.find(t=>t.id===id)!;w.serial++;const level=skillsOf(s)[t.skill].level,speed=skillSpeed(level-t.level)*vitalFactor(s)/(1-(officeOf(s).workComputer-1)*.04);return{id,elapsed:0,required:Math.max(15,Math.round(t.minutes/speed)),attempt:0,errorPct:errorChance(s,id),roll:roll(w.serial,s.day,id,w.seed),serial:w.serial};}
export function shiftInfo(s:GameState){const w=workOf(s),m=clockOf(s).minute;if(w.active)return{slot:w.active.slot,start:w.active.started,end:w.active.end,key:`${s.day}:${w.active.slot}`};const am=!w.finished.includes(`${s.day}:am`)&&m<720,slot=am?'am':'pm',start=am?480:780,end=am?720:1020;return{slot:slot as 'am'|'pm',start,end,key:`${s.day}:${slot}`};}
/** Assigned once per day/company; current save keeps it stable across reloads and shifts. */
export function dailyTask(s:GameState){const w=workOf(s),companyId=officeOf(s).employerId??'sen-code';if(w.assignment?.day===s.day&&w.assignment.companyId===companyId)return TASKS.find(t=>t.id===w.assignment!.id)!;if(!w.assignment&&w.task&&w.trackingDay===s.day)return TASKS.find(t=>t.id===w.task!.id)!;const skills=skillsOf(s),pool=TASKS.filter(t=>['programming','logic','graphics'].includes(t.skill)&&t.level<=skills[t.skill].level+1);let hash=w.seed;for(const c of `${s.day}:${companyId}`)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;return pool[hash%pool.length]!;}
/** No overtime has been scheduled in this phase, so employee access ends at 17:00. */
export function canEnterOffice(s:GameState){return officeOf(s).role!=='employee'||(isWorkday(s.day)&&(clockOf(s).minute<1020||!!s.work?.active&&s.work.active.slot==='ot'));}
export function overtimeOffered(s:GameState){const w=workOf(s);return !!w.seed&&isWorkday(s.day)&&w.finished.includes(`${s.day}:pm`)&&!w.finished.includes(`${s.day}:ot`)&&((Math.imul(w.seed,31)+s.day*17)>>>0)%100<30;}
export function lunchBreak(s:GameState):GameResult{const c=clockOf(s);if(c.location!=='office'||c.minute<720||c.minute>=780||s.work?.active)return{ok:false,error:'Chưa đến giờ nghỉ trưa.'};if(s.money<30000)return{ok:false,error:'Cần 30.000đ ăn trưa.'};const n:GameState={...s,fullness:Math.min(100,fullnessOf(s)+35),energy:Math.min(100,s.energy+20),stress:Math.max(0,s.stress-10),clock:{...c,minute:780}};if(post(n,{id:`lunch:${s.day}`,name:'Cơm trưa văn phòng',amount:-30000})!=='ok')return{ok:false,error:'Cần 30.000đ ăn trưa.'};return{ok:true,state:n}}
export type WorkAction={kind:'overtime'}|{kind:'start';taskId:TaskId;card?:CardKind}|{kind:'turn';choice:number}|{kind:'pause'}|{kind:'resume'}|{kind:'leave'};
export function workAction(s:GameState,a:WorkAction):GameResult{const o=officeOf(s);if(o.role!=='employee'||!o.employerId)return{ok:false,error:'Cần nhận việc trước.'};if(clockOf(s).location!=='office')return{ok:false,error:'Hãy đến văn phòng.'};let n=structuredClone(s);n.work=structuredClone(workOf(s));n.skills=structuredClone(skillsOf(s));const w=n.work;
 if(a.kind==='overtime'){if(!overtimeOffered(s)||clockOf(s).minute!==1020||w.active||s.energy<18)return{ok:false,error:'Chưa thể tăng ca.'};const t=dailyTask(s);w.task=w.task??makeTask(n,t.id);w.active={day:s.day,slot:'ot',end:1140,started:1020,minutes:0,paused:false,companyId:o.employerId};return{ok:true,state:n};}
 if(a.kind==='turn')return resolveTurn(s,n,a.choice);
 if(a.kind==='start'){if(!canEnterOffice(s))return{ok:false,error:'Công ty đã hết giờ làm. Hãy quay lại ngày làm việc tiếp theo.'};if(w.trackingDay!==s.day){w.task=null;w.trackingDay=s.day;}if(a.card&&w.task)return{ok:false,error:'Hãy làm tiếp việc đang dở.'};const card=a.card?taskBoard(s).find(c=>c.kind===a.card&&c.taskId===a.taskId):undefined;if(a.card&&!card)return{ok:false,error:'Đầu việc không còn trên bảng.'};const assigned=card?TASKS.find(t=>t.id===card.taskId)!:dailyTask(s);if(!w.seed)w.seed=1+Math.floor(seedUnit(s.day,s.money)*4294967294);if(w.active)return{ok:false,error:'Ca làm đang diễn ra.'};if(!isWorkday(s.day))return{ok:false,error:holidayName(s.day)??'Hôm nay là ngày nghỉ.'};const slot=shiftInfo(s);if(w.finished.includes(slot.key)||clockOf(s).minute>=slot.end)return{ok:false,error:'Đã hết ca làm hôm nay.'};if(s.energy<18)return{ok:false,error:'Cần ít nhất 18 năng lượng.'};if(!TASKS.some(t=>t.id===a.taskId))return{ok:false,error:'Đầu việc không hợp lệ.'};const start=Math.max(slot.start,clockOf(s).minute);if(card){closeUrgent(w,Infinity);w.assignment={day:s.day,id:card.taskId,companyId:o.employerId,kind:card.kind,...(card.kind==='urgent'?{deadline:slot.end,bonus:card.bonus}:{}),...(card.npcId?{npcId:card.npcId}:{})};w.taken={day:s.day,kinds:[...(w.taken?.day===s.day?w.taken.kinds:[]),card.kind]};}else if(!(w.assignment?.day===s.day&&w.assignment.companyId===o.employerId))w.assignment={day:s.day,id:assigned.id,companyId:o.employerId};scheduleTurn(w,s.day,o.employerId,slot.slot==='am'?'am':'pm',start,slot.end);n.clock={...clockOf(n),minute:start};w.task=w.task??makeTask(n,assigned.id);w.active={day:s.day,slot:slot.slot,end:slot.end,started:start,minutes:0,paused:false,companyId:o.employerId};n=recordJournal(n,`shift-start:${s.day}:${slot.slot}`,'Bắt đầu ca '+(slot.slot==='am'?'sáng':'chiều'),TASKS.find(t=>t.id===w.task!.id)!.name);}
 else {if(!w.active)return{ok:false,error:'Chưa có ca đang chạy.'};if(a.kind==='leave'&&w.bug)return{ok:false,error:'Hãy sửa bug trước khi rời ca.'};if(a.kind==='leave'&&w.turn?.state==='open'&&w.turn.day===s.day)return{ok:false,error:'Hãy trả lời trước đã.'};if(a.kind==='pause')w.active.paused=true;else if(a.kind==='resume')w.active.paused=false;else{w.finished=[...w.finished,`${s.day}:${w.active.slot}`].slice(-500);w.lastResult='Đã dừng ca. Phần việc được giữ lại.';closeUrgent(w,Infinity);w.active=null;n=recordJournal(n,`shift-leave:${s.day}:${s.clock?.minute}`,'Rời ca làm','Đã ghi nhận thời gian làm thực tế.');}}
 return{ok:true,state:n};}
export function workTick(s:GameState,minutes=4):GameState{const active=s.work?.active;if(!active||active.paused||s.work?.bug||(s.work?.turn?.state==='open'&&s.work.turn.day===s.day)||!integer(minutes,1,60))return s;let n=structuredClone(s);const w=n.work!,a=w.active!;if(officeOf(n).role!=='employee'||officeOf(n).employerId!==a.companyId)return{...n,work:{...w,active:null}};let step=Math.min(minutes,a.end-clockOf(n).minute);if(step<=0)return s;let trigger=false;{const tw=w.turn;if(tw&&tw.day===s.day&&tw.state==='waiting'&&tw.slot===a.slot){const left=tw.at-clockOf(n).minute;if(left<=0){tw.state='open';return n}if(left<=step){step=left;trigger=true}}}
 const old=a.minutes;a.minutes+=step;n.clock={...clockOf(n),minute:clockOf(n).minute+step,lastWorkDay:s.day};{const q=applyCoffeeCrash(n,clockOf(n).minute);n.energy=q.energy;if(q.coffee)n.coffee=q.coffee}n.fullness=drainFullness(n,step).fullness;n.energy=Math.max(0,n.energy-(Math.floor(a.minutes*18/240)-Math.floor(old*18/240)));n.stress=Math.min(100,n.stress+Math.floor(a.minutes*10/240)-Math.floor(old*10/240));credit(n,a.companyId,step);
 let remaining=step;while(remaining>0&&w.task){const task=w.task,t=TASKS.find(t=>t.id===task.id)!,used=Math.min(remaining,task.required-task.elapsed);task.elapsed+=used;remaining-=used;if(task.elapsed<task.required)break;
 const success=task.roll>=task.errorPct;
 if(success){if(task.attempt===0){{const as=w.assignment,help=as?.kind==='help'&&as.day===s.day&&as.id===t.id,gain=Math.floor(taskXp(t,skillsOf(n)[t.skill].level)/(help?2:1));n=addWorkXp(n,t.skill,gain);n=addWorkXp(n,t.secondary,Math.floor(gain/2));if(help&&as.npcId)n=adjustRelation(n,as.npcId,HELP_RELATION)}}w.lastResult=`${t.name}: đã hoàn thành${task.attempt?' sửa lỗi':''}.`;{const as=w.assignment;if(as?.kind==='urgent'&&as.day===s.day&&as.id===t.id&&!as.outcome&&clockOf(n).minute<=(as.deadline??0)){as.outcome='done';addBonus(n,as.companyId,as.bonus??0);w.rating=clampRating(ratingOf(n)+URGENT_RATING);w.lastResult=`${t.name}: xong kịp hạn, thưởng ${money(as.bonus??0)} vào lương.`}}w.task=null;}
 else if(task.attempt<2){w.bug={serial:task.serial,attempt:task.attempt+1,seed:(Math.imul(task.serial,2654435761)^Math.imul(w.seed+task.attempt,40503))>>>0};w.lastResult=`${t.name}: phát hiện bug, hãy tìm và sửa.`;remaining=0;}
 else{w.lastResult=`${t.name}: chuyển kiểm tra thêm.`;w.task=null;}
 n=recordJournal(n,`task:${task.serial}:${task.attempt}:${success?'ok':'error'}`,success?'Hoàn thành đầu việc':'Kiểm tra công việc',w.lastResult);if(!w.task&&remaining>0)w.task=makeTask({...n,work:w},t.id);
 }
 if(!w.task&&n.clock!.minute<a.end)w.task=makeTask({...n,work:w},s.work!.task!.id);
 n.work=w;
 if(n.clock!.minute>=a.end){closeUrgent(w,n.clock!.minute);if(w.task&&!w.bug&&w.task.elapsed===0&&w.task.attempt===0)w.task=null;if(w.bug&&w.task){const tk=w.task,bt=TASKS.find(x=>x.id===tk.id)!;tk.attempt=w.bug.attempt;tk.elapsed=0;tk.required=Math.max(15,Math.round(bt.minutes*.33));tk.errorPct=Math.max(1,tk.errorPct*.5);tk.roll=roll(tk.serial*10+tk.attempt,n.day,tk.id,w.seed);delete w.bug;w.lastResult=`${bt.name}: hết ca, bug được sửa ở ca sau.`;}w.finished=[...w.finished,`${s.day}:${a.slot}`].slice(-500);w.active=null;n=recordJournal(n,`shift-end:${s.day}:${a.slot}`,'Kết thúc ca '+(a.slot==='am'?'sáng':'chiều'),`${a.minutes} phút làm việc được ghi nhận.`);}
 if(trigger&&w.turn?.state==='waiting')w.turn.state='open';
 return n;
}
export function pendingWages(s:GameState){return workOf(s).periods.filter(p=>!p.paid).reduce((sum,p)=>sum+Math.round(p.salary*p.minutes/standardMinutes(p.month))+(p.bonus??0),0)}
export function settleNewDay(previous:GameState,next:GameState):GameState{let n=structuredClone(next);n.work=structuredClone(next.work??workOf(previous));const w=n.work,o=officeOf(previous),date=dateAt(previous.day);if(o.role==='employee'&&o.employerId&&holidayName(previous.day)&&date.getUTCDay()!==0&&date.getUTCDay()!==6&&!w.holidayDays.includes(previous.day)){const temp={...n,day:previous.day,work:w};credit(temp,o.employerId,480);w.holidayDays=[...w.holidayDays,previous.day].slice(-400)}{const po=n.office;if(po?.role==='employee'&&po.probation){const pr=po.probation;if(w.finished.some(k=>k.startsWith(previous.day+':')))pr.workDays++;if(n.day>=pr.end){const ok=pr.workDays>=PROBATION_PASS_DAYS;delete po.probation;if(ok){n=recordJournal(n,`probation:${pr.start}`,'Qua thử việc',`Bạn đi làm ${pr.workDays} ngày và trở thành nhân viên chính thức, lương đủ 100%.`)}else{po.role='visitor';po.employerId=null;po.application=null;delete po.tier;delete po.tierSince;po.retryDay=n.day+RETRY_AFTER_FAIL;n.mood=Math.max(0,n.mood-10);n.stress=Math.min(100,n.stress+8);n=recordJournal(n,`probation:${pr.start}`,'Không qua thử việc',`Bạn chỉ đi làm ${pr.workDays}/${PROBATION_PASS_DAYS} ngày cần thiết nên công ty chấm dứt hợp đồng. Bạn có thể nộp hồ sơ lại sau ${RETRY_AFTER_FAIL} ngày.`)}}}}w.finished=w.finished.filter(k=>Number(k.split(':')[0])>=next.day-30);w.periods=w.periods.filter(p=>!p.paid||p.month>=monthOf(next.day-366));
 if(dateAt(next.day).getUTCDate()===1){for(const p of w.periods){if(p.paid||p.month>=monthOf(next.day))continue;const amount=Math.round(p.salary*p.minutes/standardMinutes(p.month))+(p.bonus??0);if(post(n,{id:`salary:${p.key}`,name:`Lương tháng ${p.month}`,amount})!=='ok')continue;p.paid=true;p.amount=amount;n=recordJournal(n,`salary:${p.key}`,'Nhận lương',`${p.month}: ${money(amount)}`);}}
 if(dateAt(next.day).getUTCDate()===1){const po=n.office;if(po?.role==='employee'&&po.employerId&&!po.probation){const cur=po.tier??'junior',to=nextTier(cur);if(to){const f=tierFacts(n);if(f&&promotionGaps(to,f).length===0){po.tier=to;po.tierSince=next.day;n=recordJournal(n,`tier:${next.day}`,'Thăng bậc',`Bạn lên bậc ${TIER_NAME[to]}, lương tháng từ nay ${money(salaryFor(po.employerId,false,to))}.`)}}}}
 return n;
}
export {studySkill} from './study';

/** Mini game sửa bug: trả lời đúng và nhanh thì sửa nhanh (25% giờ chuẩn), chậm 33%, sai 40% (mục 12.2). */
export function bugOf(s:GameState){const w=s.work;if(!w?.bug||!w.task)return null;const t=TASKS.find(t=>t.id===w.task!.id)!;return{task:t,seed:w.bug.seed,attempt:w.bug.attempt,puzzle:bugPuzzle(w.bug.seed,t.skill)}}
export function fixBug(s:GameState,choice:number,ms:number):GameResult{const b=bugOf(s);if(!b)return{ok:false,error:'Không có bug cần sửa.'};if(!Number.isInteger(choice)||choice<0||choice>=b.puzzle.options.length||!Number.isFinite(ms)||ms<0)return{ok:false,error:'Lựa chọn không hợp lệ.'};
 const n=structuredClone(s),w=n.work!,task=w.task!,{frac,result}=repairFraction(b.puzzle,choice,Math.min(ms,600000));
 task.attempt=w.bug!.attempt;task.elapsed=0;task.required=Math.max(15,Math.round(b.task.minutes*frac));task.errorPct=Math.max(1,task.errorPct*.5);task.roll=roll(task.serial*10+task.attempt,n.day,task.id,w.seed);delete w.bug;
 n.stress=Math.min(100,n.stress+(result==='wrong'?5:3));
 const text=result==='wrong'?'Sửa sai chỗ, tốn thêm thời gian':result==='fast'?'Tìm ra bug nhanh':'Tìm ra bug';w.lastResult=`${b.task.name}: ${text}, cần ${task.required} phút để sửa.`;
 return{ok:true,state:recordJournal(n,`bug:${task.serial}:${task.attempt}`,'Sửa bug',w.lastResult)}}

/** Chấm công tháng trước (phút làm / phút chuẩn) và các số liệu xét lên bậc. */
export function attendanceOf(s:GameState,month:string){const p=workOf(s).periods.find(p=>officeOf(s).employerId&&p.key===officeOf(s).employerId+':'+month);return p?Math.min(1,p.minutes/standardMinutes(month)):0}
export function tierFacts(s:GameState):TierFacts|null{const o=officeOf(s);if(o.role!=='employee'||!o.employerId)return null;const k=skillsOf(s),prev=monthOf(s.day-1);return{rating:ratingOf(s),main:k.programming.level,cert:certLevel(s,'programming'),communication:k.communication.level,management:k.management.level,daysInTier:s.day-(o.tierSince??0),attendance:attendanceOf(s,prev)}}

const clampRating=(v:number)=>Math.max(0,Math.min(100,Math.round(v)));
/** Việc gấp chưa xong khi qua hạn (hoặc khi rời ca, đổi việc) thì tính trễ và trừ đánh giá. */
function closeUrgent(w:WorkState,now:number){const as=w.assignment;if(as?.kind==='urgent'&&!as.outcome&&now>=(as.deadline??0)){as.outcome='late';w.rating=clampRating((w.rating??50)+LATE_RATING);w.lastResult='Việc gấp không xong kịp hạn.'}}
/** Hẹn điểm rẽ của ngày: một lần mỗi ngày làm, rơi vào ca sáng hoặc chiều theo seed. */
function scheduleTurn(w:WorkState,day:number,companyId:string,slot:'am'|'pm',start:number,end:number){if(w.turn?.day!==day){const ev=pickTurn(day,companyId,w.turn?.id),h=hash(`turnslot:${day}:${companyId}`),pick:'am'|'pm'=slot==='pm'||h%2===0?slot:'pm',[lo,hi]=pick==='am'?[540,690]:[840,990];w.turn={day,id:ev.id,slot:pick,at:lo+h%(hi-lo),state:'waiting'}}const tw=w.turn!;if(tw.state==='waiting'&&tw.slot===slot&&tw.at<start+20){if(start+20<=end-15)tw.at=start+20;else if(slot==='am'){tw.slot='pm';tw.at=840+hash(`turnslot:${day}:${companyId}`)%150}else tw.state='done'}}
/** Bảng việc trong ngày: Chắc ăn, Thử sức, Gấp, đôi khi Giúp đồng nghiệp. Theo seed nên mở lại game vẫn ra đúng bảng; thẻ đã nhận trong ngày bị bỏ khỏi bảng. */
export function taskBoard(s:GameState):TaskCard[]{const companyId=officeOf(s).employerId??'sen-code',k=skillsOf(s),seed=hash(`board:${s.day}:${companyId}`);
 const main=TASKS.filter(t=>['programming','logic','graphics'].includes(t.skill)),gap=(t:typeof TASKS[number])=>t.level-k[t.skill].level;
 const byLevel=[...main].sort((a,b)=>gap(a)-gap(b));
 const used:TaskId[]=[],pick=(list:readonly typeof TASKS[number][],fallback:readonly typeof TASKS[number][],salt:string)=>{const free=(l:readonly typeof TASKS[number][])=>l.filter(t=>!used.includes(t.id)),from=[free(list),free(fallback),free(byLevel),list.length?list:fallback].find(l=>l.length)!;const t=from[hash(`${seed}:${salt}`)%from.length]!;used.push(t.id);return t};
 const safe=pick(main.filter(t=>gap(t)<=-1),main.filter(t=>gap(t)<=0),'safe'),stretch=pick(main.filter(t=>gap(t)>=1&&gap(t)<=2),byLevel.slice(-2),'stretch'),urgent=pick(main.filter(t=>gap(t)<=0),byLevel.slice(0,3),'urgent');
 const cards:TaskCard[]=[{kind:'safe',taskId:safe.id},{kind:'stretch',taskId:stretch.id},{kind:'urgent',taskId:urgent.id,bonus:urgentBonus(urgent.level)}];
 if(hash(`${seed}:help`)%100<HELP_CHANCE){const t=pick(TASKS.filter(t=>t.skill==='management'||t.skill==='communication'),TASKS,'helpTask'),npc=COWORKERS[hash(`${seed}:npc`)%COWORKERS.length]!;cards.push({kind:'help',taskId:t.id,npcId:npc.id})}
 const taken=s.work?.taken?.day===s.day?s.work.taken.kinds:[];return cards.filter(c=>!taken.includes(c.kind))}
/** Chữ mô tả trên thẻ (không ghi phần trăm). */
export function cardInfo(s:GameState,c:TaskCard){const t=TASKS.find(x=>x.id===c.taskId)!,lv=skillsOf(s)[t.skill].level,speed=skillSpeed(lv-t.level)*vitalFactor(s),hours=Math.max(.5,Math.round(t.minutes/speed/30)/2),err=errorChance(s,t.id),xp=taskXp(t,lv)/(t.minutes/60);
 return{title:t.name,kind:CARD_NAME[c.kind],skill:`${SKILLS[t.skill]} Lv${t.level}`,hours:`khoảng ${String(hours).replace('.',',')} giờ`,risk:err<=10?'Ít lỗi':err<=20?'Lỗi vừa':'Dễ lỗi',xp:c.kind==='help'?'XP thấp':xp>=10?'XP cao':xp>=8?'XP vừa':'XP thấp',bonus:c.bonus,npc:c.npcId?COWORKERS.find(p=>p.id===c.npcId)?.name:undefined}}
/** Cần chọn việc từ bảng khi chưa có việc đang dở trong ngày. */
export const needsChoice=(s:GameState)=>!s.work?.task||s.work.trackingDay!==s.day;
export function openTurn(s:GameState){const tw=s.work?.turn;if(!tw||tw.state!=='open'||tw.day!==s.day)return null;const ev=turnOf(tw.id);if(!ev)return null;const k=skillsOf(s);return{event:ev,npc:COWORKERS.find(p=>p.id===ev.npc)!,options:ev.options.map(o=>({label:o.label,locked:!!o.need&&k[o.need[0]].level<o.need[1],need:o.need?`${SKILLS[o.need[0]]} Lv${o.need[1]}`:undefined}))}}
function resolveTurn(s:GameState,draft:GameState,choice:number):GameResult{let n=draft;const w=n.work!,tw=w.turn,ev=tw&&tw.state==='open'&&tw.day===s.day?turnOf(tw.id):undefined;if(!tw||!ev)return{ok:false,error:'Không có tình huống cần trả lời.'};const op=Number.isInteger(choice)?ev.options[choice]:undefined;if(!op)return{ok:false,error:'Lựa chọn không hợp lệ.'};
 if(op.need&&skillsOf(s)[op.need[0]].level<op.need[1])return{ok:false,error:`Cần ${SKILLS[op.need[0]]} Lv${op.need[1]}.`};const e=op.effect,clamp=(v:number)=>Math.max(0,Math.min(100,v));
 if(e.money&&post(n,{id:`turn:${s.day}`,name:'Chi tiêu ở công ty',amount:e.money})!=='ok')return{ok:false,error:'Không đủ tiền.'};
 if(e.progress&&w.task)w.task.elapsed=Math.max(0,Math.min(w.task.required-1,w.task.elapsed+e.progress));
 if(e.mood)n.mood=clamp(n.mood+e.mood);if(e.stress)n.stress=clamp(n.stress+e.stress);if(e.energy)n.energy=clamp(n.energy+e.energy);
 if(e.rating)w.rating=clampRating((w.rating??50)+e.rating);if(e.bonus&&w.active)addBonus(n,w.active.companyId,e.bonus);
 if(e.relation)n=adjustRelation(n,e.relation[0],e.relation[1]);if(e.xp)n=addWorkXp(n,e.xp[0],e.xp[1]);
 tw.state='done';w.lastResult=op.result;n=recordJournal(n,`turn:${s.day}`,COWORKERS.find(p=>p.id===ev.npc)?.name??'Ở công ty',`${op.label}. ${op.result}`,ev.npc);return{ok:true,state:n}}
function validShiftExtras(w:WorkState,day:number){const as=w.assignment,kinds=Object.keys(CARD_NAME);
 if(w.rating!==undefined&&!integer(w.rating,0,100))return false;
 if(as&&((as.kind!==undefined&&!kinds.includes(as.kind))||(as.deadline!==undefined&&!integer(as.deadline,480,1140))||(as.bonus!==undefined&&!integer(as.bonus,0,300000))||(as.npcId!==undefined&&!COWORKERS.some(p=>p.id===as.npcId))||(as.outcome!==undefined&&!['done','late'].includes(as.outcome))))return false;
 if(w.turn!==undefined){const tw=w.turn;if(!tw||!integer(tw.day,0,day)||!TURNS.some(e=>e.id===tw.id)||!['am','pm'].includes(tw.slot)||!integer(tw.at,480,1020)||!['waiting','open','done'].includes(tw.state))return false}
 if(w.taken!==undefined&&!(w.taken&&integer(w.taken.day,0,day)&&Array.isArray(w.taken.kinds)&&w.taken.kinds.length<=4&&new Set(w.taken.kinds).size===w.taken.kinds.length&&w.taken.kinds.every(k=>kinds.includes(k))))return false;
 return true}
