/** T14: học tối, chứng chỉ và trần XP theo bậc nghề (kế hoạch mục 12.3 và 12.3b, chủ dự án chốt 04/11). */
import {fitMult} from './fitness';
import {hasRoom,atResidence,STUDY_FACTOR} from './housing';
import type {GameState,GameResult} from './types';
import {SKILLS,MAX_LEVEL,xpNeeded,defaultSkills,gainXp,type SkillId,type Skills} from './skill-xp';
import {placedAt} from './home';
import {machineMult} from './computer';
import {vitalFactor} from './vitals';
import {post} from './money';
import {clockOf,END} from './time';
import {recordJournal} from './journal';
import {money} from './format';
import type {Tier} from './career';

export type CourseId='basic'|'advanced'|'expert';
export type StudyMode=CourseId|'self';
export interface Course{name:string;from:number;to:number;xp:number;fee:number;cert:number}
export const COURSES:Record<CourseId,Course>={
 basic:{name:'Cơ bản',from:1,to:4,xp:70,fee:70000,cert:1},
 advanced:{name:'Nâng cao',from:4,to:7,xp:150,fee:130000,cert:2},
 expert:{name:'Chuyên sâu',from:7,to:10,xp:300,fee:220000,cert:3},
};
export const COURSE_IDS=Object.keys(COURSES) as CourseId[];
export const SELF_STUDY={name:'Tự học',xp:40,to:3};
export const CERT_SESSIONS=5,SESSION_MINUTES=120,SESSION_ENERGY=10,SESSION_STRESS=4,EVENING_START=1080,WEEK_FULL_SESSIONS=3;
/** Lv tối đa mà chứng chỉ cho phép lên bằng đi làm, theo chỉ số cert 0..3. */
export const CERT_CAP=[0,4,7,10];
/** Trần XP từ đi làm theo bậc: Thử việc Lv2, Junior Lv4, Middle Lv6, Senior Lv8, Lead Lv10. */
export const TIER_CAP:Record<Tier,number>={junior:4,middle:6,senior:8,lead:10};
export const PROBATION_CAP=2;

export interface StudyState{certs:string[];sessions:Record<string,number>;week:number;weekCount:number}
const certKey=(skill:SkillId,course:CourseId)=>`${skill}:${course}`;
export function studyOf(s:GameState):StudyState{return s.study??{certs:[],sessions:{},week:Math.floor(s.day/7),weekCount:0}}
const skillsOf=(s:GameState):Skills=>({...defaultSkills(),...s.skills});

export function validStudy(v:unknown,day:number):v is StudyState{if(!v||typeof v!=='object')return false;const t=v as StudyState;const key=(k:string)=>{const[a,b]=k.split(':');return Object.hasOwn(SKILLS,a!)&&COURSE_IDS.includes(b as CourseId)};
 return Array.isArray(t.certs)&&t.certs.length<=18&&new Set(t.certs).size===t.certs.length&&t.certs.every(k=>typeof k==='string'&&key(k))
 &&!!t.sessions&&typeof t.sessions==='object'&&Object.entries(t.sessions).every(([k,n])=>key(k)&&Number.isInteger(n)&&n>=0&&n<=1000)
 &&Number.isInteger(t.week)&&t.week>=0&&t.week<=Math.floor(day/7)&&Number.isInteger(t.weekCount)&&t.weekCount>=0&&t.weekCount<=7}

/** Chứng chỉ cao nhất của một kỹ năng: 0 chưa có, 1 Cơ bản, 2 Nâng cao, 3 Chuyên sâu. */
export function certLevel(s:GameState,skill:SkillId){const c=studyOf(s).certs;return COURSE_IDS.reduce((m,id)=>c.includes(certKey(skill,id))?Math.max(m,COURSES[id].cert):m,0)}
export function hasCert(s:GameState,skill:SkillId,course:CourseId){return studyOf(s).certs.includes(certKey(skill,course))}
export function sessionsOf(s:GameState,skill:SkillId,course:CourseId){return studyOf(s).sessions[certKey(skill,course)]??0}

/** Trần Lv mà XP đi làm được phép đẩy kỹ năng này lên. */
export function workCap(s:GameState,skill:SkillId){const o=s.office;const tier=o?.probation?PROBATION_CAP:TIER_CAP[o?.tier??'junior'];return Math.min(MAX_LEVEL,Math.max(tier,CERT_CAP[certLevel(s,skill)]!))}

/** Cộng XP nhưng không cho vượt Lv cap; chạm trần thì dừng ở thanh gần đầy, phần dư bỏ. */
export function addCappedXp(s:GameState,skill:SkillId,xp:number,cap:number):GameState{const k=skillsOf(s),q=k[skill];if(q.level>=cap||!(xp>0))return s;let out=gainXp(k,skill,Math.round(xp));if(out[skill].level>cap)out={...out,[skill]:{level:cap,xp:xpNeeded(cap)-1}};return{...s,skills:out}}
export function addWorkXp(s:GameState,skill:SkillId,xp:number){return addCappedXp(s,skill,xp,workCap(s,skill))}

export type StudyCheck={ok:true;xp:number;fee:number;cap:number;title:string}|{ok:false;error:string};
/** Kiểm tra một buổi học và tính XP, học phí (giao diện dùng để hiện trước). */
export function studyQuote(s:GameState,skill:SkillId,mode:StudyMode):StudyCheck{
 if(!Object.hasOwn(SKILLS,skill)||!(mode==='self'||COURSE_IDS.includes(mode)))return{ok:false,error:'Buổi học không hợp lệ.'};
 const c=clockOf(s),lv=skillsOf(s)[skill].level,st=studyOf(s);
 const course=mode==='self'?null:COURSES[mode],cap=course?course.to:SELF_STUDY.to,fee=course?course.fee:0;
 if(s.work?.active||s.office?.application?.status==='interview'||s.fishing?.atLake)return{ok:false,error:'Hãy hoàn thành hoạt động hiện tại.'};
 if(course&&lv<course.from)return{ok:false,error:`Khoá ${course.name} cần ${SKILLS[skill]} từ Lv${course.from}.`};
 if(lv>=cap)return{ok:false,error:course?`Khoá ${course.name} chỉ dạy tới Lv${cap}.`:`Tự học chỉ lên được tới Lv${cap}.`};
 if(mode==='expert'&&(s.office?.role!=='employee'||s.office.probation||(s.office.tier??'junior')==='junior'))return{ok:false,error:'Khoá Chuyên sâu cần đang làm từ bậc Middle.'};
 if(c.lastStudyDay===s.day)return{ok:false,error:'Hôm nay bạn đã học rồi.'};
 if(c.minute<EVENING_START)return{ok:false,error:'Lớp tối bắt đầu từ 18:00.'};
 if(c.minute+SESSION_MINUTES>END)return{ok:false,error:'Không đủ thời gian cho buổi học 2 giờ.'};
 if(s.energy<SESSION_ENERGY)return{ok:false,error:'Không đủ năng lượng để học.'};
 if(s.money<fee)return{ok:false,error:`Cần ${money(fee)} học phí.`};
 const count=st.week===Math.floor(s.day/7)?st.weekCount:0,base=course?course.xp:Math.round(SELF_STUDY.xp*(hasRoom(s,'study')&&atResidence(s)?STUDY_FACTOR:1)*(atResidence(s)?placedAt(s,'desk')?machineMult(s):1:1));
 const xp=Math.max(1,Math.round(base*vitalFactor(s)*(count>=WEEK_FULL_SESSIONS?.5:1)));
 return{ok:true,xp,fee,cap,title:course?`Khoá ${course.name} ${SKILLS[skill]}`:`Tự học ${SKILLS[skill]}`}}

export function studySkill(s:GameState,skill:SkillId,mode:StudyMode):GameResult{const q=studyQuote(s,skill,mode);if(!q.ok)return q;
 const c=clockOf(s),week=Math.floor(s.day/7),old=studyOf(s);let n=structuredClone(s);
 if(q.fee>0&&post(n,{name:`Học phí ${q.title}`,amount:-q.fee})!=='ok')return{ok:false,error:`Cần ${money(q.fee)} học phí.`};
 n.clock={...c,minute:c.minute+SESSION_MINUTES,lastStudyDay:s.day};n.energy=Math.max(0,n.energy-Math.round(SESSION_ENERGY*fitMult(n)));n.stress=Math.min(100,n.stress+SESSION_STRESS);
 const st:StudyState={certs:[...old.certs],sessions:{...old.sessions},week,weekCount:(old.week===week?old.weekCount:0)+1};
 const before=skillsOf(n)[skill].level;n=addCappedXp(n,skill,q.xp,q.cap);const after=skillsOf(n)[skill].level;
 let note=`2 giờ, +${q.xp} XP${after>before?`, lên Lv${after}`:''}.`;
 if(mode!=='self'){const k=certKey(skill,mode),done=(st.sessions[k]??0)+1;st.sessions[k]=done;if(done>=CERT_SESSIONS&&!st.certs.includes(k)){st.certs.push(k);note+=` Nhận chứng chỉ ${COURSES[mode].name} ${SKILLS[skill]}.`}}
 n.study=st;n=recordJournal(n,`study:${s.day}`,q.title,note);return{ok:true,state:n}}
