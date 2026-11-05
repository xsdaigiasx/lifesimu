import type {GameResult,GameState} from './types';
import {isWorkday,skillsOf} from './work';
import {spendTime} from './time';
import {recordJournal} from './journal';
import {hash} from './shift';
import {money} from './format';
import {officeOf} from './office';
import {LEVELS,staffOf,type Employee} from './hiring';
import {FX,errorOf,speedOf,workAt,type Job,type Trait,type WorkState} from './staff';

/** T46 (Kế hoạch mục 35, 35.1, 35.4; chủ dự án duyệt 05/11): dự án, giao việc, tiến độ tự chạy theo ngày làm việc,
 *  lỗi theo chỉ số nhân viên, điểm kiểm tra, kết quả 1–5 sao. Thưởng vào quỹ ngay (T47 đổi thành ứng trước, trả sau).
 *  Chưa có: dự đoán theo độ biết (T51), sự kiện giữa việc (T48), phối hợp theo quan hệ cặp (T48). */
export type CraftSkill='programming'|'logic'|'graphics';
export const CRAFTS:CraftSkill[]=['programming','logic','graphics'];
export const CRAFT_NAME:Record<CraftSkill,string>={programming:'Lập trình',logic:'Logic',graphics:'Đồ họa'};

export const PROJ={maxOffers:4,offerDays:7,maxActive:3,maxTeam:4,dayHours:6,grace:3,checkMinutes:45,maxChecks:2,checkErr:.8,latePct:4,lateMax:40,unitHours:4,
 repStart:50,repStars:{1:-6,2:-3,3:0,4:2,5:4} as Record<number,number>,repLate:-2,repCancel:-10,payStars:{1:.3,2:.6,3:.85,4:1,5:1.1} as Record<number,number>,
 loadMult:[1,1,.9,.75],fatigueBase:12,fatigueExtra:12,errMin:.03,errMax:.6,catchUp:30} as const;

export interface Offer{id:string;client:string;title:string;skill:CraftSkill;lv:number;hours:number;difficulty:number;picky:number;urgent:boolean;traits:Trait[];reward:number;days:number;opened:number;expires:number}
export interface Project extends Offer{accepted:number;due:number;team:string[];progress:number;checks:number;/** Tổng giờ nhân lỗi và tổng giờ đã làm để tính tỉ lệ lỗi thật. */ew:number;eh:number}
export interface Result{id:string;title:string;client:string;skill:CraftSkill;stars:number;errors:number;units:number;late:number;pay:number;reward:number;day:number;canceled?:boolean}
export interface ProjectsState{version:1;seq:number;last:number;offers:Offer[];active:Project[];done:Result[]}

const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
const CLIENTS=['Quán Hoa Sen','Tiệm Gốm Nhỏ','Cửa hàng Ba Miền','Phòng khám Minh An','Trường Mầm non Nắng','Công ty Vận tải Tân Phát','Nhà sách Đọc Chậm','Xưởng Mộc Hải'];
const TITLES:Record<CraftSkill,string[]>={programming:['Trang web giới thiệu','Công cụ quản lý đơn hàng','Ứng dụng đặt lịch','Hệ thống tồn kho'],logic:['Kiểm thử và sửa lỗi hệ thống','Phân tích quy trình bán hàng','Thiết kế luồng thanh toán','Đối soát số liệu'],graphics:['Bộ nhận diện thương hiệu','Thiết kế thực đơn và biển hiệu','Poster khai trương','Giao diện ứng dụng']};
const POOL={tech:['programming','programming','logic'],design:['graphics','graphics','logic']} as Record<string,CraftSkill[]>;

export const projectsOf=(s:GameState):ProjectsState=>s.company?.projects??{version:1,seq:0,last:(s.company?.founded??s.day)-1,offers:[],active:[],done:[]};
export const repOfCompany=(s:GameState)=>s.company?.rep??PROJ.repStart;
export const levelBase=(lv:number)=>LEVELS.find(l=>lv>=l.min&&lv<=l.max)?.base??LEVELS[0]!.base;
export const jobOf=(p:Offer):Job=>({skill:p.skill,lv:p.lv,traits:p.traits});
const staffById=(s:GameState,id:string)=>staffOf(s).find(e=>e.id===id);
/** Số việc đang giữ của một nhân viên. */
export const loadOf=(ps:ProjectsState,empId:string)=>ps.active.filter(p=>p.team.includes(empId)).length;
const loadFactor=(n:number)=>PROJ.loadMult[Math.min(n,PROJ.loadMult.length-1)]!;
/** Hệ số phối hợp nhóm: đông thì giảm, tăng theo Quản lý của chủ và tính cách hay giúp đỡ (0,85–1,15). */
export function coordOf(s:GameState,team:Employee[]){if(team.length<2)return 1;const mgmt=skillsOf(s).management.level;return clamp(1.03-.05*(team.length-1)+.012*mgmt+team.reduce((a,e)=>a+FX[e.personality].coop,0),.85,1.15)}

/** Dự án mới theo seed: cùng ngày cho cùng dự án, tải lại không đổi. */
function newOffer(s:GameState,ps:ProjectsState,day:number):Offer|null{
 const co=s.company!;if(ps.offers.length>=PROJ.maxOffers)return null;
 if(hash(`proj:${day}:roll`)%100>=30+(co.rep??PROJ.repStart)*.3)return null;
 const pool=POOL[officeOf(s).industry]??CRAFTS,skill=pool[hash(`proj:${day}:skill`)%pool.length]!;
 const best=Math.max(2,...staffOf(s).map(e=>e.skills[skill])),lv=1+hash(`proj:${day}:lv`)%Math.min(8,best+1);
 const difficulty=1+hash(`proj:${day}:diff`)%5,hours=clamp(Math.round((12+difficulty*6+lv*3+hash(`proj:${day}:h`)%8)/2)*2,12,96);
 const urgent=hash(`proj:${day}:urg`)%4===0,picky=hash(`proj:${day}:pk`)%5===0?2:hash(`proj:${day}:pk2`)%3===0?1:0;
 const traits:Trait[]=[];if(urgent)traits.push('urgent');if(hours>=56)traits.push('long');if(difficulty>=4)traits.push('hard');if(difficulty<=1)traits.push('easy');if(picky===2)traits.push('picky');
 const k=hash(`proj:${day}:tr`)%5;if(k===0)traits.push('client');if(k===1)traits.push('reward');if(k===2)traits.push('routine');if(k===3)traits.push('risky');if(hash(`proj:${day}:tm`)%4===0)traits.push('team');
 const perHour=levelBase(lv)/176,bonus=traits.includes('reward')?1.15:1,reward=Math.round(hours*perHour*(1.35+.08*difficulty)*bonus/100_000)*100_000;
 const days=Math.ceil(Math.ceil(hours/PROJ.dayHours)*7/5*(urgent?1.05:1.6))+1;
 return{id:`p${ps.seq}`,client:CLIENTS[hash(`proj:${day}:cl`)%CLIENTS.length]!,title:TITLES[skill][hash(`proj:${day}:ti`)%TITLES[skill].length]!,skill,lv,hours,difficulty,picky,urgent,traits,reward,days,opened:day,expires:day+PROJ.offerDays}}

/** Tiến độ và lỗi ước tính theo đội hiện tại (chủ chỉ thấy sau khi kiểm tra). */
export function forecast(s:GameState,p:Project){
 const team=p.team.map(id=>staffById(s,id)).filter((e):e is Employee=>!!e),ps=projectsOf(s),coord=coordOf(s,team);
 const rate=team.reduce((a,e)=>{const n=Math.max(1,loadOf(ps,e.id));return a+PROJ.dayHours/n*loadFactor(n)*speedOf(e,s.day,jobOf(p))},0)*coord;
 let left=p.hours-p.progress,d=s.day,onTrack=left<=0;
 if(rate>0)for(let i=0;i<400&&left>0&&d<=p.due;i++){d++;if(isWorkday(d))left-=rate}
 if(rate>0&&left<=0&&d<=p.due)onTrack=true;
 const err=team.length?team.reduce((a,e)=>a+errorOf(e,s.day,jobOf(p)),0)/team.length*(1+.1*(p.difficulty-2)):0;
 return{rate:Math.round(rate*10)/10,onTrack,errRate:Math.round(clamp(err*PROJ.checkErr**p.checks,PROJ.errMin,PROJ.errMax)*100)/100}}

export type ProjectAction={kind:'projAccept';id:string}|{kind:'projDecline';id:string}|{kind:'projAssign';id:string;emp:string}|{kind:'projUnassign';id:string;emp:string}|{kind:'projCheck';id:string};
const fail=(error:string):GameResult=>({ok:false,error});
function withProjects(s:GameState,edit:(ps:ProjectsState,n:GameState)=>string|void):GameResult{
 if(!s.company)return fail('Bạn chưa có công ty.');
 const n=structuredClone(s);const ps=structuredClone(projectsOf(s));const err=edit(ps,n);if(err)return fail(err);
 n.company!.projects=ps;return{ok:true,state:n}}
export function projectAction(s:GameState,a:ProjectAction):GameResult{
 return withProjects(s,(ps,n)=>{
  const offer=ps.offers.find(o=>o.id===a.id),proj=ps.active.find(p=>p.id===a.id);
  if(a.kind==='projAccept'){if(!offer)return'Dự án này không còn.';if(!staffOf(s).length)return'Cần có nhân viên trước khi nhận dự án.';if(ps.active.length>=PROJ.maxActive)return`Đang làm tối đa ${PROJ.maxActive} dự án.`;
   ps.offers=ps.offers.filter(o=>o.id!==a.id);ps.active.push({...offer,accepted:s.day,due:s.day+offer.days,team:[],progress:0,checks:0,ew:0,eh:0});return}
  if(a.kind==='projDecline'){if(!offer)return'Dự án này không còn.';ps.offers=ps.offers.filter(o=>o.id!==a.id);return}
  if(!proj)return'Dự án này không còn.';
  if(a.kind==='projAssign'){const e=staffById(s,a.emp);if(!e)return'Không có nhân viên này.';if(proj.team.includes(e.id))return'Đã giao cho người này.';if(proj.team.length>=PROJ.maxTeam)return`Mỗi dự án tối đa ${PROJ.maxTeam} người.`;
   if(loadOf(ps,e.id)>=FX[e.personality].loadCap)return`${e.name} đã nhận đủ việc.`;proj.team.push(e.id);return}
  if(a.kind==='projUnassign'){if(!proj.team.includes(a.emp))return'Người này chưa được giao.';proj.team=proj.team.filter(id=>id!==a.emp);return}
  if(a.kind==='projCheck'){if(proj.checks>=PROJ.maxChecks)return'Đã kiểm tra đủ số lần cho dự án này.';const t=spendTime(n,PROJ.checkMinutes);if(!t.ok)return t.error;Object.assign(n,t.state);proj.checks++;return}
  return'Thao tác không hợp lệ.'})}

const starsOf=(p:Project,rate:number,day:number)=>{
 const units=Math.ceil(p.hours/PROJ.unitHours);let errors=0;for(let i=0;i<units;i++)if(hash(`${p.id}:err:${i}`)%1000<rate*1000)errors++;
 const ratio=errors/units,late=Math.max(0,day-p.due);let stars=5-Math.floor(ratio/.1);
 if(p.picky===2&&ratio>.1)stars--;if(p.picky===1&&ratio>.2)stars--;if(late>0)stars--;
 return{stars:clamp(stars,1,5),errors,units,late}};

/** Qua ngày: dự án mới, tiến độ T2–T6, hoàn thành, huỷ khi quá hạn. Tối đa 30 ngày bù, idempotent theo `last`. */
export function settleProjects(next:GameState):GameState{
 const co=next.company;if(!co)return next;
 const ps0=projectsOf(next);if(ps0.last>=next.day)return next;
 const n=structuredClone(next);const ps=structuredClone(ps0);const staff=n.company!.staff??[];
 const work=new Map<string,WorkState>(),touch=(e:Employee,day:number)=>{let w=work.get(e.id);if(!w){w=workAt(e,day);work.set(e.id,w)}return w};
 const from=Math.max(ps.last+1,next.day-PROJ.catchUp+1);
 for(let d=from;d<=next.day;d++){
  ps.offers=ps.offers.filter(o=>o.expires>=d);
  const offer=newOffer(n,ps,d);if(offer){ps.offers.push(offer);ps.seq++}
  if(isWorkday(d)){
   for(const p of [...ps.active]){
    const team=p.team.map(id=>staff.find(e=>e.id===id)).filter((e):e is Employee=>!!e);
    const coord=coordOf(n,team);let sum=0;
    for(const e of team){const load=Math.max(1,loadOf(ps,e.id)),w=touch(e,d),h=PROJ.dayHours/load*loadFactor(load)*speedOf({...e,work:w},d,jobOf(p));
     sum+=h;p.eh+=h;p.ew+=h*errorOf({...e,work:w},d,jobOf(p))*(load>=3?1.25:1)}
    p.progress=Math.round((p.progress+sum*coord)*10)/10;
   }
   for(const e of staff){const load=loadOf(ps,e.id);if(load>0){const w=touch(e,d);work.set(e.id,{...w,fatigue:Math.min(100,w.fatigue+PROJ.fatigueBase+PROJ.fatigueExtra*(load-1))})}}
  }
  for(const p of [...ps.active]){
   const team=p.team.map(id=>staff.find(e=>e.id===id)).filter((e):e is Employee=>!!e);
   if(p.progress>=p.hours){
    const rate=clamp((p.eh>0?p.ew/p.eh:.2)*(1+.1*(p.difficulty-2))*PROJ.checkErr**p.checks,PROJ.errMin,PROJ.errMax),r=starsOf(p,rate,d);
    const pay=Math.round(p.reward*PROJ.payStars[r.stars]!*(1-Math.min(PROJ.lateMax,PROJ.latePct*r.late)/100)/1000)*1000;
    n.company!.fund+=pay;n.company!.rep=clamp((n.company!.rep??PROJ.repStart)+PROJ.repStars[r.stars]!+(r.late>0?PROJ.repLate:0),0,100);
    for(const e of team){const w=touch(e,d),exp={...(w.exp??{})};if(r.stars>=3)exp[p.skill]=(exp[p.skill]??0)+1;
     work.set(e.id,{...w,morale:clamp(w.morale+(r.stars>=4?3:r.stars<=2?-5:0)-(r.late>0?2:0),0,100),exp})}
    ps.active=ps.active.filter(x=>x.id!==p.id);ps.done=[{id:p.id,title:p.title,client:p.client,skill:p.skill,stars:r.stars,errors:r.errors,units:r.units,late:r.late,pay,reward:p.reward,day:d},...ps.done].slice(0,8);
   }else if(d>p.due+PROJ.grace){
    n.company!.rep=clamp((n.company!.rep??PROJ.repStart)+PROJ.repCancel,0,100);
    for(const e of team){const w=touch(e,d);work.set(e.id,{...w,morale:clamp(w.morale-5,0,100)})}
    ps.active=ps.active.filter(x=>x.id!==p.id);ps.done=[{id:p.id,title:p.title,client:p.client,skill:p.skill,stars:0,errors:0,units:0,late:d-p.due,pay:0,reward:p.reward,day:d,canceled:true},...ps.done].slice(0,8);
   }
  }
 }
 ps.last=next.day;
 n.company!.projects=ps;
 n.company!.staff=staff.map(e=>{const w=work.get(e.id);return w?{...e,work:{...w,day:Math.max(w.day,next.day)}}:e});
 let out=n;
 for(const r of ps.done.filter(x=>x.day>ps0.last&&!ps0.done.some(y=>y.id===x.id))){
  out=recordJournal(out,`project:${r.id}`,r.canceled?'Khách huỷ dự án':'Dự án hoàn thành',r.canceled?`${r.title} (${r.client}): quá hạn.`:`${r.title} (${r.client}): ${r.stars} sao, nhận ${money(r.pay)}.`)}
 return out}

const validOffer=(o:unknown):o is Offer=>{if(!o||typeof o!=='object')return false;const x=o as Offer;
 return typeof x.id==='string'&&x.id.length<12&&typeof x.client==='string'&&x.client.length<60&&typeof x.title==='string'&&x.title.length<80&&CRAFTS.includes(x.skill)
  &&[x.lv,x.hours,x.difficulty,x.picky,x.reward,x.days,x.opened,x.expires].every(Number.isInteger)&&x.lv>=1&&x.lv<=10&&x.hours>=1&&x.hours<=200&&x.difficulty>=1&&x.difficulty<=5&&x.picky>=0&&x.picky<=2&&x.reward>=0&&x.reward<=1e9&&x.days>=1&&x.days<=120
  &&typeof x.urgent==='boolean'&&Array.isArray(x.traits)&&x.traits.length<=8&&x.traits.every(t=>typeof t==='string'&&t.length<12)};
const validProject=(day:number)=>(p:unknown):p is Project=>{if(!validOffer(p))return false;const x=p as Project;
 return Number.isInteger(x.accepted)&&x.accepted>=0&&x.accepted<=day&&Number.isInteger(x.due)&&x.due>=x.accepted&&Array.isArray(x.team)&&x.team.length<=PROJ.maxTeam&&new Set(x.team).size===x.team.length&&x.team.every(id=>typeof id==='string'&&id.length<40)
  &&Number.isFinite(x.progress)&&x.progress>=0&&x.progress<=1000&&Number.isInteger(x.checks)&&x.checks>=0&&x.checks<=PROJ.maxChecks&&Number.isFinite(x.ew)&&x.ew>=0&&Number.isFinite(x.eh)&&x.eh>=0};
const validResult=(r:unknown):r is Result=>{if(!r||typeof r!=='object')return false;const x=r as Result;
 return typeof x.id==='string'&&typeof x.title==='string'&&x.title.length<80&&typeof x.client==='string'&&CRAFTS.includes(x.skill)&&[x.stars,x.errors,x.units,x.late,x.pay,x.reward,x.day].every(Number.isInteger)&&x.stars>=0&&x.stars<=5&&x.pay>=0&&x.pay<=1e9&&x.day>=0};
export function validProjects(v:unknown,day:number):v is ProjectsState{
 if(!v||typeof v!=='object')return false;const p=v as ProjectsState;
 return p.version===1&&Number.isInteger(p.seq)&&p.seq>=0&&Number.isInteger(p.last)&&p.last>=-1&&p.last<=day&&Array.isArray(p.offers)&&p.offers.length<=PROJ.maxOffers+2&&p.offers.every(validOffer)
  &&Array.isArray(p.active)&&p.active.length<=PROJ.maxActive&&p.active.every(validProject(day))&&Array.isArray(p.done)&&p.done.length<=8&&p.done.every(validResult)}
