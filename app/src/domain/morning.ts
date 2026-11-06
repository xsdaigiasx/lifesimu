/** T75: Bản tin sáng. Hộp thoại tự mở một lần mỗi ngày game sau khi dậy; xem lại ở app Tin tức. */
import {birthdaysOn,isPlayerBirthday,funeralsOf} from './lifecycle';
import type {GameState} from './types';
import {weatherOf,forecastOf,WEATHER_LABEL,type Weather} from './weather';
import {inboxOf,unreadCount} from './inbox';
import {castById,nameOf} from './npc';
import {readyParcels} from './gifts';
import {places} from './places';
import {isWorkday,holidayName} from './work';
import {officeOf} from './office';
import {rentOf} from './rent';
import {projectsOf} from './projects';
import {dateAt,money} from './format';
import {journalOf} from './journal';
import {post} from './money';
import {SKILLS,defaultSkills,type SkillId} from './skill-xp';
import {bankOf,owedOf} from './bank';
import {fundOf} from './company';
import {financeOf} from './finance';
import {hrOf} from './hr';
import {staffOf} from './hiring';
import {payslipsOf} from './payslip';
import {monthKey} from './rent';

export type GoalId='task'|'study'|'chat'|'recipe'|'side'|'project';
export interface Line{icon:string;text:string}
export interface MorningState{seen:number;/** Mục tiêu tuần đang chạy: ngày thứ Hai và ba mục tiêu. */week?:{start:number;ids:GoalId[]};/** Mốc đầu tháng để làm báo cáo tháng. */month?:{key:string;worth:number;lv:Partial<Record<SkillId,number>>};/** Phần tổng kết tuần và tháng đã chốt của ngày `day`, để xem lại trong Tin tức. */recap?:{day:number;lines:Line[]};/** Sự kiện đáng nhớ (mỗi ngày tối đa một) để nhắc lại sau một năm. */memories?:{day:number;text:string}[]}
export const MEMORY={keep:400,maxList:40,span:1};
const MEMORABLE=(e:{key:string;title:string})=>/^(tier|probation|move|story|recipe|side-done|gone-died):/.test(e.key)||(e.key.startsWith('project:')&&e.title==='Dự án hoàn thành');
export const WEEKLY={money:200000,mood:10};
const GOALS:Record<GoalId,{text:string;target:number;ok:(s:GameState)=>boolean;hit:(e:{key:string;title:string})=>boolean}>={
 task:{text:'Làm 3 đầu việc ở công ty',target:3,ok:s=>officeOf(s).role==='employee',hit:e=>e.key.startsWith('task:')&&e.key.endsWith(':ok')},
 study:{text:'Học 2 buổi',target:2,ok:()=>true,hit:e=>e.key.startsWith('study:')},
 chat:{text:'Trò chuyện hoặc gọi điện 3 lần',target:3,ok:()=>true,hit:e=>e.key.startsWith('chat:')||e.key.startsWith('call:')},
 recipe:{text:'Học một món mới',target:1,ok:()=>true,hit:e=>e.key.startsWith('recipe:')},
 side:{text:'Xong một đơn tay trái',target:1,ok:s=>!!s.side,hit:e=>e.key.startsWith('side-done:')},
 project:{text:'Giao một dự án cho khách',target:1,ok:s=>!!s.company,hit:e=>e.key.startsWith('project:')&&e.title==='Dự án hoàn thành'}};
const hash=(x:string)=>{let h=0;for(const c of x)h=(h*31+c.charCodeAt(0))>>>0;return h};
export const weekStart=(day:number)=>day-((dateAt(day).getUTCDay()+6)%7);
export const pickGoals=(s:GameState,start:number):GoalId[]=>(Object.keys(GOALS) as GoalId[]).filter(id=>GOALS[id].ok(s)).sort((a,b)=>hash(`${start}:${a}`)-hash(`${start}:${b}`)).slice(0,3);
export function goalProgress(s:GameState,id:GoalId,start:number){const g=GOALS[id];return Math.min(g.target,journalOf(s).filter(e=>e.day>=start&&e.day<start+7&&g.hit(e)).length)}
/** Tài sản ròng: tiền mặt, tiết kiệm, quỹ công ty trừ nợ ngân hàng. */
export const worthOf=(s:GameState)=>s.money+(s.life?.savings??[]).reduce((t,x)=>t+x.principal,0)+fundOf(s)-owedOf(bankOf(s));
const levelsOf=(s:GameState)=>{const k={...defaultSkills(),...s.skills};return Object.fromEntries((Object.keys(SKILLS) as SkillId[]).map(id=>[id,k[id].level])) as Record<SkillId,number>};
export interface Morning{
 weekend:Line[];
 ago:Line[];
 recap:Line[];
 goals:{id:GoalId;text:string;count:number;target:number}[];
 night:Line[];
 weather:{today:Weather;tomorrow:Weather};
 hood:string;
 unread:{count:number;names:string[]};
 agenda:Line[];
}
const HOOD=[
 'Quán cà phê đầu hẻm mở sớm, mùi cà phê thơm cả ngõ.',
 'Chợ dân sinh hôm nay đông người đi sớm.',
 'Có người hàng xóm vừa chuyển đồ vào dãy trọ cuối hẻm.',
 'Công viên sáng nay nhiều người tập thể dục.',
 'Xe buýt đầu ngày chạy đúng giờ, hành khách thưa thớt.',
 'Bà bán xôi đầu ngõ nói hôm nay hết hàng sớm.',
 'Tiếng rao hàng vang khắp khu phố từ sáu giờ.'
];
const WEATHER_NEWS:Record<Weather,string>={sunny:'Trời nắng đẹp, phố đông từ sớm.',mild:'Trời râm mát, đi bộ rất dễ chịu.',rain:'Trời mưa, nhớ mang ô khi ra ngoài.',storm:'Có bão, công viên đóng cửa, hạn chế ra đường.'};

export const morningDue=(s:GameState)=>s.day>=1&&(s.morning?.seen??0)<s.day;
function recapLines(s:GameState):Line[]{
 const out:Line[]=[],m=s.morning;
 if(m?.week&&m.week.start<weekStart(s.day)&&m.week.ids.length){const w=m.week,done=w.ids.filter(id=>goalProgress(s,id,w.start)>=GOALS[id].target).length;
  out.push({icon:'heart',text:done===w.ids.length?`Tuần trước xong ${done}/${w.ids.length} mục tiêu: +${money(WEEKLY.money)} và +${WEEKLY.mood} tinh thần`:`Tuần trước xong ${done}/${w.ids.length} mục tiêu`})}
 if(m?.month&&m.month.key!==monthKey(s.day)){const mo=m.month,d=worthOf(s)-mo.worth,lv=levelsOf(s);
  out.push({icon:'chart',text:`Tháng ${Number(mo.key.slice(5))}: tài sản ${d>=0?'tăng':'giảm'} ${money(Math.abs(d))}`});
  const up=(Object.keys(SKILLS) as SkillId[]).filter(id=>lv[id]>(mo.lv[id]??lv[id])).map(id=>`${SKILLS[id]} Lv ${lv[id]}`);
  if(up.length)out.push({icon:'bolt',text:`Kỹ năng lên cấp: ${up.join(', ')}`});
  const days=payslipsOf(s).find(x=>x.month===mo.key)?.days;if(days)out.push({icon:'briefcase',text:`Đi làm ${days} ngày`})}
 return out}
export function markMorningSeen(s:GameState):GameState{
 if(s.morning?.seen===s.day)return s;
 const lines=recapLines(s),m=s.morning,ws=weekStart(s.day);let n=s;
 if(m?.week&&m.week.start<ws&&m.week.ids.length&&m.week.ids.every(id=>goalProgress(s,id,m.week!.start)>=GOALS[id].target)){const c=structuredClone(s);if(post(c,{id:`weekly:${m.week.start}`,name:'Thưởng mục tiêu tuần',amount:WEEKLY.money})==='ok'){c.mood=Math.min(100,c.mood+WEEKLY.mood);n=c}}
 const week=m?.week&&m.week.start===ws?m.week:{start:ws,ids:pickGoals(s,ws)},k=monthKey(s.day),month=m?.month&&m.month.key===k?m.month:{key:k,worth:worthOf(n),lv:levelsOf(n)};
 const memories=[...(m?.memories??[])];
 for(const e of [...journalOf(s)].reverse())if(e.day>=(m?.seen??0)&&e.day<s.day&&MEMORABLE(e)&&!memories.some(x=>x.day===e.day))memories.push({day:e.day,text:e.title});
 const kept=memories.filter(x=>x.day>=s.day-MEMORY.keep).slice(-MEMORY.maxList);
 return{...n,morning:{seen:s.day,week,month,recap:{day:s.day,lines},memories:kept}}}
export function validMorning(v:unknown,day:number):v is MorningState{
 if(!v||typeof v!=='object')return false;const m=v as MorningState,int=(x:unknown,lo:number,hi:number)=>Number.isInteger(x)&&(x as number)>=lo&&(x as number)<=hi;
 if(!int(m.seen,0,day))return false;
 if(m.week!==undefined&&(!m.week||!int(m.week.start,0,day)||!Array.isArray(m.week.ids)||m.week.ids.length>3||m.week.ids.some(id=>!(id in GOALS))))return false;
 if(m.month!==undefined&&(!m.month||typeof m.month.key!=='string'||!/^\d{4}-\d{2}$/.test(m.month.key)||!Number.isFinite(m.month.worth)||!m.month.lv||typeof m.month.lv!=='object'))return false;
 if(m.recap!==undefined&&(!m.recap||!int(m.recap.day,0,day)||!Array.isArray(m.recap.lines)||m.recap.lines.length>10||m.recap.lines.some(l=>!l||typeof l.icon!=='string'||typeof l.text!=='string'||l.text.length>200)))return false;
 if(m.memories!==undefined&&(!Array.isArray(m.memories)||m.memories.length>MEMORY.maxList||m.memories.some(x=>!x||!int(x.day,0,day)||typeof x.text!=='string'||x.text.length===0||x.text.length>100)))return false;
 return true}

export function morningOf(s:GameState):Morning{
 const today=weatherOf(s.day),tomorrow=forecastOf(s.day);
 const hood=today==='storm'||today==='rain'?WEATHER_NEWS[today]:HOOD[s.day%HOOD.length];
 const ib=inboxOf(s),names=Object.entries(ib.threads).filter(([,m])=>m.some(x=>x.from==='npc'&&!x.read)).map(([id])=>castById(s,id)?.name??id);
 const agenda:Line[]=[],hol=holidayName(s.day),dow=dateAt(s.day).getUTCDay();
 const o=officeOf(s);
 if(hol)agenda.push({icon:'calendar',text:`Nghỉ lễ: ${hol}`});
 else if(dow===0||dow===6)agenda.push({icon:'calendar',text:'Cuối tuần, công ty nghỉ'});
 if(o.role==='employee'&&isWorkday(s.day))agenda.push({icon:'briefcase',text:'Hôm nay đi làm'});
 const a=o.application;
 if(a?.status==='interview'||(a?.status==='pending'&&a.interviewDay===s.day))agenda.push({icon:'briefcase',text:'Hôm nay có buổi phỏng vấn'});
 if(a?.status==='passed'&&a.startDay===s.day)agenda.push({icon:'briefcase',text:'Hôm nay nhận việc'});
 for(const p of readyParcels(s))agenda.push({icon:'box',text:`Quà của ${nameOf(s,p.from)} ở bến xe, còn ${p.until-s.day+1} ngày`});
 for(const p of ib.appts.filter(x=>x.status==='set'&&x.day===s.day).sort((x,y)=>x.minute-y.minute)){
  const h=String(Math.floor(p.minute/60)).padStart(2,'0'),m=String(p.minute%60).padStart(2,'0');
  agenda.push({icon:'people',text:`${h}:${m} Hẹn ${castById(s,p.npc)?.name??p.npc} tại ${places.find(x=>x.id===p.place)?.name??p.place}`})}
 if(isPlayerBirthday(s,s.day))agenda.push({icon:'heart',text:'Hôm nay là sinh nhật bạn'});
 for(const n of birthdaysOn(s,s.day))agenda.push({icon:'heart',text:`Hôm nay sinh nhật ${n.name}`});
 for(const n of birthdaysOn(s,s.day+1))agenda.push({icon:'heart',text:`Mai sinh nhật ${n.name}`});
 for(const g of funeralsOf(s))if(g.visit===undefined)agenda.push({icon:'people',text:`Đám tang ${nameOf(s,g.id)}, có thể đến viếng`});
 const r=rentOf(s);
 if(r.dueDay!==null&&r.dueDay!==undefined&&r.owed>0&&r.dueDay-s.day<=1)agenda.push({icon:'home',text:r.dueDay<=s.day?'Tiền trọ đang đến hạn':'Mai đến hạn tiền trọ'});
 for(const p of projectsOf(s).active.filter(x=>x.due-s.day<=1))agenda.push({icon:'note',text:`${p.title} ${p.due<=s.day?'hết hạn hôm nay':'hết hạn ngày mai'}`});
 const ws=weekStart(s.day),ids=s.morning?.week&&s.morning.week.start===ws?s.morning.week.ids:pickGoals(s,ws);
 const goals=ids.map(id=>({id,text:GOALS[id].text,count:goalProgress(s,id,ws),target:GOALS[id].target}));
 const recap=s.morning?.recap?.day===s.day?s.morning.recap.lines:recapLines(s);
 const night:Line[]=[];
 if(s.company){
  for(const l of financeOf(s).log.filter(x=>x.day>=s.day-1).slice(0,3))night.push({icon:'coin',text:`${l.label} ${l.amount>=0?'+':'-'}${money(Math.abs(l.amount))}`});
  const hr=hrOf(s).pending.length;if(hr)night.push({icon:'people',text:`${hr} việc nhân sự đang chờ bạn`});
  for(const p of projectsOf(s).active.filter(x=>x.due-s.day>1).slice(0,2))night.push({icon:'note',text:`${p.title} còn ${p.due-s.day} ngày`});
  if(!night.length&&staffOf(s).length)night.push({icon:'briefcase',text:'Công ty vận hành yên ổn qua đêm'})}
 const weekend:Line[]=[];
 if(dow===5){const sat=weatherOf(s.day+1),sun=weatherOf(s.day+2),fine=(w:Weather)=>w==='sunny'||w==='mild';
  weekend.push(fine(sat)||fine(sun)?{icon:'sun',text:'Cuối tuần có ngày đẹp trời, hợp đi công viên hoặc hẹn bạn'}:{icon:'rain',text:'Cuối tuần mưa hoặc bão, hợp ở nhà nấu ăn và nghỉ ngơi'});
  if(s.money<500000)weekend.push({icon:'coin',text:'Tiền đang ít, có thể làm thêm cuối tuần'});
  if(unreadCount(s)>0)weekend.push({icon:'message',text:'Còn tin nhắn chưa đọc, trả lời trước cuối tuần'})}
 const ago:Line[]=(s.morning?.memories??[]).filter(x=>Math.abs(x.day-(s.day-365))<=MEMORY.span).map(x=>({icon:'note',text:`Năm ngoái ngày này: ${x.text}`}));
 return{weather:{today,tomorrow},hood,unread:{count:unreadCount(s),names},agenda,goals,recap,night,weekend,ago};
}
export {WEATHER_LABEL};
