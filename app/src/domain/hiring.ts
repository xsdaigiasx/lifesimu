import type {GameResult,GameState} from './types';
import {activeLease,officeOf,SIZES} from './office';
import {skillsOf} from './work';
import {hash} from './shift';
import {generateNpc,mix} from './npc';
import {spendTime} from './time';
import {validWork,type WorkState} from './staff';

/** T44 (Kế hoạch mục 33, chủ dự án duyệt 05/11): ứng viên sinh theo seed, người chơi chỉ thấy bản khai cho tới khi phỏng vấn. */
export const HIRE_SKILLS=['programming','logic','graphics','management','communication'] as const;
export type HireSkill=typeof HIRE_SKILLS[number];
export const HIRE_SKILL_NAME:Record<HireSkill,string>={programming:'Lập trình',logic:'Logic',graphics:'Đồ họa',management:'Quản lý',communication:'Giao tiếp'};
const CRAFT:HireSkill[]=['programming','logic','graphics'];
export const PERSONALITIES=['Cầu toàn','Hay khoe','Ngại','Nóng tính','Hay giúp đỡ','Tham'] as const;
export type Personality=typeof PERSONALITIES[number];
export const MOTIVES=['Lương cao','Học hỏi','Ổn định'] as const;
/** Trình độ theo Lv (mục 33.3); lương cơ sở là đề xuất. */
export const LEVELS=[{name:'Thực tập',min:1,max:2,base:5_000_000,years:0},{name:'Junior',min:3,max:4,base:9_000_000,years:2},{name:'Middle',min:5,max:6,base:14_000_000,years:4},{name:'Senior',min:7,max:8,base:22_000_000,years:6},{name:'Chuyên gia',min:9,max:10,base:32_000_000,years:9}] as const;
export const levelOf=(lv:number)=>LEVELS.find(l=>lv>=l.min&&lv<=l.max)??LEVELS[0];
export const HIRING={postFee:500_000,postDays:28,batchDays:7,keepDays:14,seniorRep:60,expertRep:80,maxTests:2,refShare:30,errStart:3,errMin:.5,errQuestion:.7,errSoft:.5,
 times:{cv:10,tech:20,test:60,situation:20,motive:15,ref:15}} as const;
export type InterviewKind=keyof typeof HIRING.times;

export interface Candidate{id:string;seed:string;name:string;gender:'male'|'female';age:number;origin:string;
 /** Thật (ẩn khỏi giao diện). */
 skills:Record<HireSkill,number>;years:number;trust:number;risk:number;potential:number;personality:Personality;motive:typeof MOTIVES[number];
 /** Khai trong CV. */
 claim:Record<HireSkill,number>;claimYears:number;wage:number;fee:number;ref:boolean}
export interface Progress{cv?:1;sit?:1;mot?:1;ref?:1;q?:Partial<Record<HireSkill,number>>;test?:Partial<Record<HireSkill,1>>}
export interface HiringState{postedDay:number;rep:number;progress:Record<string,Progress>;gone:string[]}
export interface Employee{id:string;name:string;gender:'male'|'female';age:number;origin:string;hiredDay:number;wage:number;skills:Record<HireSkill,number>;years:number;trust:number;risk:number;potential:number;personality:Personality;motive:typeof MOTIVES[number];/** T45: chỉ số công việc; thiếu thì suy ra từ hồ sơ (save cũ). */work?:WorkState}

const rnd=(seed:string,salt:string,n:number)=>mix(hash(`${seed}:${salt}`))%n;
const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
const sumOf=(k:Record<HireSkill,number>)=>HIRE_SKILLS.reduce((a,id)=>a+k[id],0);

/** Sinh một ứng viên: cùng seed và uy tín cho cùng người. Senior cần uy tín 60, Chuyên gia cần 80. */
export function makeCandidate(seed:string,rep:number):Candidate{
 const r=(salt:string,n:number)=>rnd(seed,salt,n),base=generateNpc(seed);
 const roll=r('arch',100);let arch:'deep'|'all'|'grad'|'vet'=roll<25?'deep':roll<60?'all':roll<85?'grad':'vet';
 if((arch==='deep'||arch==='vet')&&rep<HIRING.seniorRep)arch='all';
 let L=arch==='deep'?7+r('L',4):arch==='vet'?7+r('L',3):arch==='grad'?1+r('L',4):3+r('L',4);
 if(L>=9&&rep<HIRING.expertRep)L=8;
 const main=CRAFT[r('main',3)]!,skills={programming:1,logic:1,graphics:1,management:1,communication:1} as Record<HireSkill,number>;
 for(const k of HIRE_SKILLS){if(k===main){skills[k]=L;continue}
  skills[k]=clamp(arch==='deep'||arch==='grad'?1+r(k,3):arch==='all'?L-1-r(k,3):k==='management'||k==='communication'?5+r(k,2):2+r(k,3),1,L)}
 for(let guard=0;sumOf(skills)>3*L+4&&guard<40;guard++){const top=HIRE_SKILLS.filter(k=>k!==main&&skills[k]>1).sort((a,b)=>skills[b]-skills[a])[0];if(!top)break;skills[top]--}
 const lvl=levelOf(L),years=Math.max(0,lvl.years+r('y',5)-2),high=r('risk',100)<25,risk=high?60+r('rv',36):5+r('rv',51),trust=clamp(100-risk+r('tn',21)-10,0,100);
 const personality=PERSONALITIES[r('p',6)]!,liar=personality==='Hay khoe'||trust<40,infl=liar?1+r('i',3):r('i2',5)===0?1:0;
 const claim={...skills};claim[main]=clamp(L+infl,1,10);for(const k of HIRE_SKILLS)if(k!==main)claim[k]=clamp(skills[k]+(liar?r(k+'c',infl+1):0),1,10);
 const claimYears=years+(liar?infl:0),cm=claim[main],cl=levelOf(cm),second=HIRE_SKILLS.filter(k=>k!==main&&claim[k]>=5).length;
 const neg=90+r('neg',21)+(personality==='Tham'?10:0),wage=Math.max(3_000_000,Math.round(cl.base*(1+.15*second)*clamp((claimYears+1)/(cl.years+1),.85,1.2)*neg/100/100_000)*100_000);
 return{id:`ung-${hash(seed).toString(36)}`,seed,name:base.name,gender:base.gender,age:21+years+r('age',4),origin:base.origin,skills,years,trust,risk,potential:arch==='grad'?60+r('pot',41):20+r('pot',61),personality,motive:MOTIVES[r('m',3)]!,
  claim,claimYears,wage,fee:cm>=7?Math.round(wage*.5/100_000)*100_000:0,ref:r('ref',100)<HIRING.refShare};
}

/** Lứa b có 3–5 hồ sơ; lứa mới mỗi 7 ngày, mỗi hồ sơ giữ 14 ngày. */
const batchSize=(h:HiringState,b:number)=>3+rnd(`lua:${h.postedDay}:${b}`,'n',3);
export const hiringOf=(s:GameState):HiringState|null=>s.company?.hiring??null;
export const staffOf=(s:GameState):Employee[]=>s.company?.staff??[];
export const capacityOf=(s:GameState)=>SIZES[officeOf(s).size].seats-1;
export const postActive=(s:GameState)=>{const h=hiringOf(s);return!!h&&s.day<h.postedDay+HIRING.postDays};
/** Danh sách ứng viên đang có mặt (tính từ seed, không lưu trong save). */
export function candidatesOf(s:GameState):Candidate[]{
 const h=hiringOf(s),c=s.company;if(!h||!c)return[];const out:Candidate[]=[],hired=new Set(staffOf(s).map(e=>e.id));
 for(let b=0;b<=Math.floor(HIRING.postDays/HIRING.batchDays);b++){const start=h.postedDay+b*HIRING.batchDays;if(s.day<start||s.day>=start+HIRING.keepDays)continue;
  for(let i=0;i<batchSize(h,b);i++){const cand=makeCandidate(`${c.founded}:${h.postedDay}:${b}:${i}`,h.rep);if(!h.gone.includes(cand.id)&&!hired.has(cand.id))out.push(cand)}}
 return out;
}
export const candidateById=(s:GameState,id:string)=>candidatesOf(s).find(c=>c.id===id)??null;

/** Sai số hiện tại của một kỹ năng: 3, trừ 0,5 mỗi 2 Lv (Giao tiếp + Quản lý) của chủ, trừ 0,7 mỗi câu hỏi, bài test đưa về mức tối thiểu. */
export function errOf(s:GameState,p:Progress|undefined,k:HireSkill){
 if(p?.test?.[k])return HIRING.errMin;const sk=skillsOf(s),soft=Math.floor((sk.communication.level+sk.management.level)/2)*HIRING.errSoft;
 return Math.max(HIRING.errMin,HIRING.errStart-soft-HIRING.errQuestion*(p?.q?.[k]??0));
}
export const testsDone=(p?:Progress)=>Object.keys(p?.test??{}).length;
const HINT:Record<Personality,string>={'Cầu toàn':'Nói nhỏ nhẹ, cẩn trọng','Ngại':'Nói nhỏ nhẹ, cẩn trọng','Hay khoe':'Kể nhiều về thành tích','Tham':'Kể nhiều về thành tích','Nóng tính':'Nói nhanh, nhiệt tình','Hay giúp đỡ':'Nói nhanh, nhiệt tình'};
export interface Warn{kind:'ref'|'hint';/** ref: 0 thấp, 1 vừa, 2 cao. hint: 1 có dấu hiệu. */level:0|1|2}
function warnOf(c:Candidate,p:Progress|undefined):Warn|null{
 if(p?.ref&&c.ref){const band=c.risk>=60?2:c.risk>=30?1:0,exact=rnd(c.seed,'racc',100)<85;return{kind:'ref',level:(exact?band:clamp(band+(rnd(c.seed,'rdir',2)?1:-1),0,2)) as 0|1|2}}
 if(p?.sit&&p?.mot){const roll=rnd(c.seed,'warn',100);return{kind:'hint',level:(c.risk>=60?roll<65:roll<10)?1:0}}
 return null;
}
/** Bản người chơi được thấy: không chứa kỹ năng thật, độ trung thực, rủi ro hay tiềm năng. */
export interface CandidateView{id:string;name:string;gender:'male'|'female';age:number;origin:string;years:number;main:HireSkill;level:string;wage:number;fee:number;hasRef:boolean;
 skills:Record<HireSkill,{claim:number;est:{lo:number;hi:number}|null}>;flags:HireSkill[]|null;hint:string;personality:Personality|null;motive:string|null;warn:Warn|null;tests:number;done:{cv:boolean;sit:boolean;mot:boolean;ref:boolean}}
export function viewOf(s:GameState,c:Candidate):CandidateView{
 const p=hiringOf(s)?.progress[c.id],main=CRAFT.reduce((a,k)=>c.claim[k]>c.claim[a]?k:a,CRAFT[0]!);
 const skills={} as CandidateView['skills'];
 for(const k of HIRE_SKILLS){const asked=!!(p?.test?.[k]||p?.q?.[k]);let est=null;
  if(asked){const e=errOf(s,p,k),center=c.skills[k]+(c.claim[k]-c.skills[k])*clamp((e-HIRING.errMin)/(HIRING.errStart-HIRING.errMin),0,1);est={lo:clamp(Math.round(center-e),1,10),hi:clamp(Math.round(center+e),1,10)}}
  skills[k]={claim:c.claim[k],est}}
 return{id:c.id,name:c.name,gender:c.gender,age:c.age,origin:c.origin,years:c.claimYears,main,level:levelOf(c.claim[main]).name,wage:c.wage,fee:c.fee,hasRef:c.ref,skills,
  flags:p?.cv?HIRE_SKILLS.filter(k=>c.claim[k]-c.skills[k]>=2):null,hint:HINT[c.personality],personality:p?.sit?c.personality:null,motive:p?.mot?c.motive:null,warn:warnOf(c,p),tests:testsDone(p),
  done:{cv:!!p?.cv,sit:!!p?.sit,mot:!!p?.mot,ref:!!p?.ref}};
}

export type HiringAction={kind:'post'}|{kind:'interview';id:string;what:InterviewKind;skill?:HireSkill}|{kind:'hire';id:string}|{kind:'decline';id:string};
export function hiringAction(s:GameState,a:HiringAction):GameResult{
 const fail=(error:string):GameResult=>({ok:false,error}),o=officeOf(s);
 if(!s.company||o.role!=='owner')return fail('Chỉ chủ công ty mới tuyển người.');if(!activeLease(s))return fail('Hãy thuê văn phòng trước khi tuyển người.');
 let n=structuredClone(s);const co=n.company!;
 if(a.kind==='post'){
  if(postActive(s))return fail('Tin tuyển dụng vẫn đang đăng.');if(co.fund<HIRING.postFee)return fail('Quỹ công ty không đủ để đăng tin.');
  co.fund-=HIRING.postFee;co.hiring={postedDay:s.day,rep:s.company?.rep??50,progress:{},gone:co.hiring?.gone??[]};return{ok:true,state:n};
 }
 const cand=candidateById(s,a.id);if(!cand)return fail('Hồ sơ này không còn.');
 const h=co.hiring!;
 if(a.kind==='decline'){h.gone=[...h.gone,cand.id].slice(-200);delete h.progress[cand.id];return{ok:true,state:n}}
 if(a.kind==='hire'){
  if(staffOf(s).some(e=>e.id===cand.id))return fail('Người này đã được tuyển.');
  if(staffOf(s).length>=capacityOf(s))return fail('Văn phòng hết chỗ ngồi.');if(co.fund<cand.fee)return fail('Quỹ công ty không đủ phí tuyển.');
  co.fund-=cand.fee;co.staff=[...staffOf(s),{id:cand.id,name:cand.name,gender:cand.gender,age:cand.age,origin:cand.origin,hiredDay:s.day,wage:cand.wage,skills:cand.skills,years:cand.years,trust:cand.trust,risk:cand.risk,potential:cand.potential,personality:cand.personality,motive:cand.motive}];
  delete h.progress[cand.id];return{ok:true,state:n};
 }
 if(!(a.what in HIRING.times))return fail('Hành động phỏng vấn không hợp lệ.');
 const needSkill=a.what==='tech'||a.what==='test';if(needSkill&&(!a.skill||!HIRE_SKILLS.includes(a.skill)))return fail('Hãy chọn kỹ năng cần hỏi.');
 const p=h.progress[cand.id]??={};
 if(a.what==='ref'&&!cand.ref)return fail('Ứng viên này không có người giới thiệu.');
 if(a.what==='cv'&&p.cv||a.what==='situation'&&p.sit||a.what==='motive'&&p.mot||a.what==='ref'&&p.ref)return fail('Bạn đã làm bước này rồi.');
 if(a.what==='test'&&p.test?.[a.skill!])return fail('Đã làm bài test kỹ năng này.');
 const t=spendTime(n,HIRING.times[a.what],'office');if(!t.ok)return t;n=t.state;const c2=n.company!,h2=c2.hiring!,p2=h2.progress[cand.id]??={};
 if(a.what==='test'&&testsDone(p)>=HIRING.maxTests){h2.gone=[...h2.gone,cand.id].slice(-200);delete h2.progress[cand.id];return{ok:true,state:n}}
 if(a.what==='cv')p2.cv=1;else if(a.what==='situation')p2.sit=1;else if(a.what==='motive')p2.mot=1;else if(a.what==='ref')p2.ref=1;
 else if(a.what==='tech')p2.q={...p2.q,[a.skill!]:(p2.q?.[a.skill!]??0)+1};
 else p2.test={...p2.test,[a.skill!]:1};
 return{ok:true,state:n};
}

const SK=(v:unknown):v is Record<HireSkill,number>=>!!v&&typeof v==='object'&&HIRE_SKILLS.every(k=>Number.isInteger((v as Record<string,number>)[k])&&(v as Record<string,number>)[k]!>=1&&(v as Record<string,number>)[k]!<=10);
export function validHiring(v:unknown,day:number):v is HiringState{
 if(!v||typeof v!=='object')return false;const h=v as HiringState;
 if(!Number.isInteger(h.postedDay)||h.postedDay<0||h.postedDay>day||!Number.isFinite(h.rep)||!Array.isArray(h.gone)||h.gone.length>200||!h.gone.every(x=>typeof x==='string'&&x.length<40))return false;
 if(!h.progress||typeof h.progress!=='object')return false;const ids=Object.keys(h.progress);if(ids.length>60)return false;
 return ids.every(id=>{const p=h.progress[id] as Progress;if(!p||typeof p!=='object')return false;
  const q=p.q??{},t=p.test??{};return Object.keys(q).every(k=>HIRE_SKILLS.includes(k as HireSkill)&&Number.isInteger((q as Record<string,number>)[k])&&(q as Record<string,number>)[k]!>=0&&(q as Record<string,number>)[k]!<=20)&&Object.keys(t).every(k=>HIRE_SKILLS.includes(k as HireSkill))});
}
export function validStaff(v:unknown,day:number,cap:number):v is Employee[]{
 if(!Array.isArray(v)||v.length>cap)return false;const seen=new Set<string>();
 return v.every((e:Employee)=>{if(!e||typeof e!=='object'||typeof e.id!=='string'||seen.has(e.id))return false;seen.add(e.id);
  return typeof e.name==='string'&&e.name.length<60&&(e.gender==='male'||e.gender==='female')&&Number.isInteger(e.hiredDay)&&e.hiredDay>=0&&e.hiredDay<=day&&Number.isInteger(e.wage)&&e.wage>=0&&e.wage<=1e8&&SK(e.skills)
   &&[e.age,e.years,e.trust,e.risk,e.potential].every(x=>Number.isFinite(x)&&x>=0&&x<=200)&&PERSONALITIES.includes(e.personality)&&MOTIVES.includes(e.motive)&&(e.work===undefined||validWork(e.work,day))});
}
