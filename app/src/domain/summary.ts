import type {GameState} from './types';
import {dateAt} from './format';
import {skillsOf} from './work';
import {SKILLS} from './skill-xp';
import type {SkillId} from './skill-xp';
import {officeOf} from './office';
import {TIER_NAME,TIERS} from './career';
import type {Tier} from './career';
import {socialOf} from './social';
import {storyOf} from './director';
import {castById} from './npc';
import {staffOf} from './hiring';
import {projectsOf,repOfCompany} from './projects';
import {journalOf} from './journal';
import type {JournalEntry} from './journal';

/** T35: tổng kết năm và mục tiêu. Mọi con số và câu chữ lấy từ save và Nhật ký; không bịa. */
export const SUM={yearDays:365,keep:5,goalStreak:3,goalRep:60,goalStaff:2,people:3,marks:5,minRelation:10} as const;
export type SummaryKind='year'|'goal';
export interface SummaryPerson{id:string;score:number;/** Điều họ còn nhớ (từ ký ức thật). */memory?:string}
export interface SummaryMark{day:number;title:string}
export interface SummaryCompany{name:string;fund:number;rep:number;staff:number;done:number}
export interface Summary{id:string;kind:SummaryKind;day:number;money:number;skill:{id:SkillId;level:number};job:{role:'visitor'|'employee'|'owner';tier?:Tier;name?:string};company?:SummaryCompany;people:SummaryPerson[];marks:SummaryMark[]}
export interface SummaryState{version:1;list:Summary[];/** Năm đã tổng kết gần nhất (0 là chưa có). */year:number;/** Số tháng liền lãi ròng dương. */streak:number;/** Mốc quỹ đầu tháng và vốn chủ góp trong tháng. */snap?:{month:string;fund:number;inj:number};/** Ngày đã đạt mục tiêu. */goal?:number;/** Tổng kết chưa xem. */unseen?:string}

export const summaryOf=(s:GameState):SummaryState=>s.summary??{version:1,list:[],year:0,streak:0};
const int=(v:unknown,lo:number,hi:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=lo&&v<=hi;
const str=(v:unknown,max:number)=>typeof v==='string'&&v.length>0&&v.length<=max;
const SKILL_IDS=Object.keys(SKILLS);

export function validSummary(v:unknown,day:number):v is Summary{
 if(!v||typeof v!=='object')return false;const m=v as Summary;
 if(!str(m.id,20)||(m.kind!=='year'&&m.kind!=='goal')||!int(m.day,0,day)||!int(m.money,-1e10,1e10))return false;
 if(!m.skill||!SKILL_IDS.includes(m.skill.id)||!int(m.skill.level,1,10))return false;
 const j=m.job;if(!j||!['visitor','employee','owner'].includes(j.role)||(j.tier!==undefined&&!TIERS.includes(j.tier))||(j.name!==undefined&&!str(j.name,60)))return false;
 const c=m.company;if(c!==undefined&&(!c||!str(c.name,60)||!int(c.fund,0,1e9)||!int(c.rep,0,100)||!int(c.staff,0,100)||!int(c.done,0,100000)))return false;
 if(!Array.isArray(m.people)||m.people.length>SUM.people||!m.people.every(p=>p&&typeof p==='object'&&str(p.id,80)&&int(p.score,0,100000)&&(p.memory===undefined||str(p.memory,120))))return false;
 return Array.isArray(m.marks)&&m.marks.length<=SUM.marks&&m.marks.every(k=>k&&typeof k==='object'&&int(k.day,0,day)&&str(k.title,100));
}
export function validSummaryState(v:unknown,day:number):v is SummaryState{
 if(!v||typeof v!=='object')return false;const q=v as SummaryState;
 if(q.version!==1||!Array.isArray(q.list)||q.list.length>SUM.keep||!q.list.every(x=>validSummary(x,day)))return false;
 const ids=new Set(q.list.map(x=>x.id));if(ids.size!==q.list.length)return false;
 if(!int(q.year,0,300)||!int(q.streak,0,1200))return false;
 if(q.snap!==undefined&&(!q.snap||!/^\d{4}-\d{2}$/.test(q.snap.month)||!int(q.snap.fund,0,1e9)||!int(q.snap.inj,0,1e10)))return false;
 if(q.goal!==undefined&&!int(q.goal,0,day))return false;
 return q.unseen===undefined||ids.has(q.unseen);
}

/** Mốc nổi bật: lần đầu của từng loại việc trong Nhật ký còn giữ, theo thứ tự thời gian. */
const MARKS:[string,string][]=[['move:','nhà'],['probation:','việc'],['tier:','bậc'],['office:','văn phòng'],['project:','dự án'],['invest:','vốn'],['meet:','người']];
export function marksOf(log:readonly JournalEntry[]):SummaryMark[]{
 const asc=[...log].sort((a,b)=>a.day-b.day||a.minute-b.minute),out:SummaryMark[]=[];
 for(const[p]of MARKS){const e=asc.find(x=>x.key.startsWith(p));if(e)out.push({day:e.day,title:e.title})}
 return out.sort((a,b)=>a.day-b.day).slice(0,SUM.marks);
}
export function peopleOf(s:GameState):SummaryPerson[]{
 const rel=socialOf(s).relations,mem=storyOf(s).memories;
 return Object.entries(rel).filter(([id,r])=>castById(s,id)&&r.score>=SUM.minRelation).sort((a,b)=>b[1].score-a[1].score||a[0].localeCompare(b[0])).slice(0,SUM.people).map(([id,r])=>{
  const m=mem.filter(x=>x.npc===id&&x.topic).sort((a,b)=>b.weight-a.weight||b.day-a.day)[0];
  return{id,score:r.score,...(m?{memory:m.topic.slice(0,120)}:{})};
 });
}
export function companyFacts(s:GameState):SummaryCompany|undefined{
 const c=s.company;if(!c)return undefined;
 return{name:officeOf(s).name||'Công ty',fund:c.fund,rep:repOfCompany(s),staff:staffOf(s).length,done:projectsOf(s).done.filter(r=>!r.canceled).length};
}
export function makeSummary(s:GameState,kind:SummaryKind,id:string):Summary{
 const k=skillsOf(s),best=(Object.keys(k) as SkillId[]).reduce((a,b)=>k[b].level>k[a].level?b:a),o=officeOf(s),company=companyFacts(s),cash=s.money;
 return{id,kind,day:s.day,money:cash,skill:{id:best,level:k[best].level},job:{role:o.role,...(o.role==='employee'?{tier:o.tier??'junior'}:{}),...(o.role==='owner'&&o.name?{name:o.name.slice(0,60)}:{})},...(company?{company}:{}),people:peopleOf(s),marks:marksOf(journalOf(s))};
}
export function titleOf(m:Summary){return m.kind==='goal'?'Công ty đã đứng vững':`Năm thứ ${m.id.slice(1)} đã qua`}
export const jobText=(m:Summary)=>m.job.role==='owner'?`Chủ công ty ${m.job.name??''}`.trim():m.job.role==='employee'?`Nhân viên ${TIER_NAME[m.job.tier??'junior']}`:'Chưa có việc cố định';
export const skillText=(m:Summary)=>`${SKILLS[m.skill.id]} Lv ${m.skill.level}`;

/** Ghi vốn chủ góp để không tính vào lãi ròng của tháng. */
export function noteInvest(s:GameState,amount:number):GameState{
 const q=summaryOf(s);if(!q.snap)return s;
 return{...s,summary:{...q,snap:{...q.snap,inj:q.snap.inj+amount}}};
}
const monthKey=(day:number)=>dateAt(day).toISOString().slice(0,7);

/** Chạy mỗi lần qua ngày mới: theo dõi lãi ròng từng tháng, tạo tổng kết năm và tổng kết mục tiêu. */
export function settleSummary(s:GameState):GameState{
 let q=summaryOf(s);const before=q;
 const co=s.company;
 if(co&&dateAt(s.day).getUTCDate()===1&&q.snap?.month!==monthKey(s.day)){
  if(q.snap)q={...q,streak:co.fund-q.snap.fund-q.snap.inj>0?q.streak+1:0};
  q={...q,snap:{month:monthKey(s.day),fund:co.fund,inj:0}};
 }else if(co&&!q.snap)q={...q,snap:{month:monthKey(s.day),fund:co.fund,inj:0}};
 const add=(m:Summary)=>{q={...q,list:[...q.list,m].slice(-SUM.keep),unseen:m.id}};
 const year=Math.floor(s.day/SUM.yearDays);
 if(year>q.year){q={...q,year};add(makeSummary(s,'year',`y${year}`))}
 if(co&&q.goal===undefined&&q.streak>=SUM.goalStreak&&repOfCompany(s)>=SUM.goalRep&&staffOf(s).length>=SUM.goalStaff){q={...q,goal:s.day};add(makeSummary(s,'goal',`g${s.day}`))}
 return q===before?s:{...s,summary:q};
}
export function markSeen(s:GameState):GameState{const q=summaryOf(s);if(!q.unseen)return s;const{unseen:_,...rest}=q;return{...s,summary:rest}}
