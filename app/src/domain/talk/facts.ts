/** H2: gom dữ kiện có thật từ trạng thái game (HOI-THOAI I.3 trục 2, T.1) kèm ai được biết.
 * Không lưu: tính lại mỗi lần cần. NPC chỉ biết điều tận mắt thấy (cùng nơi, cùng giờ theo lịch), điều thuộc phận sự
 * (chủ trọ biết tiền trọ, ngân hàng biết khoản vay, đồng nghiệp biết chuyện công ty), hoặc người chơi đã kể
 * (người thân biết chuyện lớn khi người chơi đã gọi hoặc nhắn sau chuyện đó). */
import type {GameState,PlaceId} from '../types';
import type {Fact} from './types';
import {rosterOf,presentAt,inReach,coworkersOf,LOBBY,FAMILY_IDS} from '../npc';
import {journalOf,type JournalEntry} from '../journal';
import {lifeOf,CONDITIONS,RECIPES} from '../life';
import {officeOf,COMPANIES} from '../office';
import {TIER_NAME} from '../career';
import {bankOf,owedOf} from '../bank';
import {rentOf} from '../rent';
import {storyOf} from '../director';
import {inboxOf} from '../inbox';
import {weatherOf,forecastOf,type Weather} from '../weather';
import {holidayName} from '../work';
import {fitValue} from '../fitness';
import {dateAt} from '../format';
import {npcFacts} from './npc-life';

/** Các loại dữ kiện (25). */
export const FACT_SUBS=['food','eatout','cook','home','job','probation','tier','salary','money','loan','sick','tired','study','recipe','company','project','side','rent','missed','debt','fit','weather','forecast','holiday','weekend'] as const;
export type FactSub=typeof FACT_SUBS[number];
/** Số ngày dữ kiện còn được nhắc. */
export const FACT_DAYS={food:1,cook:2,home:14,job:14,probation:14,tier:14,salary:3,study:3,recipe:14,company:30,project:7,side:7,missed:14} as const;
export const LOW_CASH=200000,TIRED=25,FIT_GOOD=60;
const WEATHER_WORD:Record<Weather,string>={sunny:'nắng',mild:'râm mát',rain:'mưa',storm:'bão'};

/** Những người có mặt ở nơi này lúc đó (tận mắt thấy). */
export function witnesses(s:GameState,day:number,minute:number,place:PlaceId):string[]{return rosterOf(s).filter(n=>presentAt(n,day,minute,place)&&inReach(s,n,place)).map(n=>n.id)}
/** Ngày gần nhất người chơi chủ động liên lạc (gọi, nhắn hỏi thăm, nhắn trong cuộc trò chuyện) với một người. */
export function lastContact(s:GameState,id:string):number{const ib=inboxOf(s);return Math.max(-1,ib.called[id]??-1,ib.hello[id]??-1,...(ib.threads[id]??[]).filter(m=>m.from==='me').map(m=>m.day))}
/** Người thân biết chuyện từ ngày `day` nếu người chơi đã liên lạc với họ từ hôm đó. */
export const familyTold=(s:GameState,day:number)=>FAMILY_IDS.filter(id=>lastContact(s,id)>=day);
/** Người ở khu trọ (có lịch ở nơi ở): chủ trọ, hàng xóm, người thuê cùng dãy. */
export const neighborsOf=(s:GameState)=>rosterOf(s).filter(n=>n.schedule.some(x=>x.place==='home')).map(n=>n.id);
const uniq=(a:string[])=>[...new Set(a)];
const recent=(e:JournalEntry,s:GameState,days:number)=>s.day-e.day<days;
const last=(s:GameState,prefix:string,days:number)=>{const j=journalOf(s);for(let i=j.length-1;i>=0;i--){const e=j[i]!;if(e.key.startsWith(prefix)&&recent(e,s,days))return e}return undefined};

export function factsOf(s:GameState):Fact[]{const out:Fact[]=[],day=s.day,o=officeOf(s),team=coworkersOf(s).map(n=>n.id),life=lifeOf(s);
 const add=(f:Omit<Fact,'about'|'private'|'tone'>&Partial<Pick<Fact,'about'|'private'|'tone'>>)=>{if(Array.isArray(f.knownBy)&&!f.knownBy.length)return;out.push({about:'player',private:0,tone:'plain',...f,knownBy:Array.isArray(f.knownBy)?uniq(f.knownBy):f.knownBy})};
 // Ăn uống
 const ate=life.ate??[],meal=ate[ate.length-1];
 if(meal&&day-meal.d<FACT_DAYS.food)add({id:`food:${meal.d}:${meal.m}`,topic:'player',sub:'food',day:meal.d,knownBy:witnesses(s,meal.d,meal.m,meal.p),vars:{dish:meal.n.toLowerCase(),place:meal.p}});
 {const days=new Set(ate.filter(a=>a.out&&day-a.d<3).map(a=>a.d));if(days.size>=3)add({id:`eatout:${day}`,topic:'player',sub:'eatout',day,private:1,knownBy:[...familyTold(s,day-2),...witnesses(s,day,clockMinute(s),s.clock?.location??'home')],vars:{}})}
 {const c=[...ate].reverse().find(a=>!a.out&&day-a.d<FACT_DAYS.cook);if(c)add({id:`cook:${c.d}:${c.m}`,topic:'player',sub:'cook',day:c.d,tone:'good',knownBy:[...witnesses(s,c.d,c.m,'home'),...familyTold(s,c.d)],vars:{dish:c.n.toLowerCase()}})}
 // Nhà ở, việc làm (người thân biết khi đã được kể)
 {const e=last(s,'move:',FACT_DAYS.home);if(e)add({id:e.key,topic:'player',sub:'home',day:e.day,tone:'good',knownBy:[...neighborsOf(s),...familyTold(s,e.day)],vars:{place:e.title.replace(/^Chuyển tới /,'')}})}
 {const e=last(s,'office:acceptOffer:',FACT_DAYS.job),company=COMPANIES.find(c=>c.id===o.employerId)?.name;if(e&&company)add({id:e.key,topic:'player',sub:'job',day:e.day,tone:'good',knownBy:[...team,...familyTold(s,e.day),'recruiter'],vars:{place:company}})}
 {const e=last(s,'probation:',FACT_DAYS.probation);if(e)add({id:e.key,topic:'player',sub:'probation',day:e.day,tone:e.title.startsWith('Qua')?'good':'bad',private:e.title.startsWith('Qua')?0:2,knownBy:[...team,...familyTold(s,e.day)],vars:{}})}
 {const e=last(s,'tier:',FACT_DAYS.tier);if(e&&o.tier)add({id:e.key,topic:'player',sub:'tier',day:e.day,tone:'good',knownBy:[...team,...familyTold(s,e.day)],vars:{event:TIER_NAME[o.tier]}})}
 {const e=last(s,'salary:',FACT_DAYS.salary),m=e?.detail.match(/[\d.]+(?=đ)/);if(e)add({id:e.key,topic:'player',sub:'salary',day:e.day,tone:'good',private:2,knownBy:familyTold(s,e.day),vars:m?{amount:m[0]+'đ'}:{}})}
 {const e=last(s,'study:',FACT_DAYS.study);if(e)add({id:e.key,topic:'player',sub:'study',day:e.day,tone:'good',knownBy:[...team,...familyTold(s,e.day)],vars:{}})}
 {const r=Object.entries(life.learned??{}).filter(([,v])=>v&&day-v.day<FACT_DAYS.recipe).sort((a,b)=>b[1]!.day-a[1]!.day)[0];if(r){const [id,v]=r as [keyof typeof RECIPES,{by:string;day:number}];add({id:`recipe:${id}`,topic:'player',sub:'recipe',day:v.day,tone:'good',knownBy:[v.by,...familyTold(s,v.day)],vars:{dish:RECIPES[id].name.toLowerCase()}})}}
 {const e=last(s,'office:found:',FACT_DAYS.company);if(e)add({id:e.key,topic:'player',sub:'company',day:e.day,tone:'good',knownBy:[...LOBBY,...familyTold(s,e.day)],vars:{place:o.name}})}
 {const e=last(s,'project:',FACT_DAYS.project);if(e)add({id:e.key,topic:'player',sub:'project',day:e.day,tone:e.title.includes('huỷ')?'bad':'good',private:1,knownBy:[...LOBBY,...familyTold(s,e.day)],vars:{}})}
 {const e=last(s,'side-done:',FACT_DAYS.side);if(e)add({id:e.key,topic:'player',sub:'side',day:e.day,tone:'good',private:1,knownBy:familyTold(s,e.day),vars:{}})}
 // Tiền bạc (riêng tư)
 if(s.money<LOW_CASH)add({id:`money:${day}`,topic:'player',sub:'money',day,tone:'bad',private:2,knownBy:[...(rentOf(s).owed>0?['landlord']:[]),...familyTold(s,day-3)],vars:{}});
 {const owed=owedOf(bankOf(s));if(owed>0)add({id:'loan',topic:'player',sub:'loan',day,tone:'plain',private:2,knownBy:['teller'],vars:{amount:fmt(owed)}})}
 {const r=rentOf(s),due=r.dueDay;if((s.housing?.house??'tro')==='tro'&&(r.owed>0||(due!==null&&due-day<=3&&due>=day)))add({id:`rent:${r.billedMonth}`,topic:'player',sub:'rent',day,tone:r.owed>0?'bad':'plain',private:1,knownBy:['landlord'],vars:{amount:fmt(r.owed||0)}})}
 // Sức khoẻ: người đang ở cùng chỗ thấy; bác sĩ biết bệnh đã khám
 {const c=life.conditions.find(x=>!x.treatedDay);if(c)add({id:`sick:${c.id}:${c.sinceDay}`,topic:'player',sub:'sick',day:c.sinceDay,tone:'bad',private:1,knownBy:'present',vars:{event:CONDITIONS[c.id].name.toLowerCase()}});if(c?.diagnosed)add({id:`sick-dr:${c.id}:${c.sinceDay}`,topic:'player',sub:'sick',day:c.sinceDay,tone:'bad',private:1,knownBy:['doctor'],vars:{event:CONDITIONS[c.id].name.toLowerCase()}})}
 if(s.energy<TIRED)add({id:`tired:${day}`,topic:'player',sub:'tired',day,tone:'bad',knownBy:'present',vars:{}});
 if(fitValue(s)>=FIT_GOOD)add({id:`fit:${day}`,topic:'player',sub:'fit',day,tone:'good',knownBy:'present',vars:{}});
 // Quan hệ với từng NPC: lỡ hẹn, NPC còn nợ người chơi
 for(const e of journalOf(s))if(e.key.startsWith('appt-missed:')&&e.npcId&&day-e.day<FACT_DAYS.missed)add({id:e.key,topic:'player',sub:'missed',day:e.day,tone:'bad',private:1,knownBy:[e.npcId],vars:{}});
 for(const l of storyOf(s).loans)if(l.settled!=='paid'&&!l.resolved)add({id:`debt:${l.id}`,topic:'player',sub:'debt',day:l.due,tone:'bad',private:1,knownBy:[l.npc],vars:{amount:fmt(l.amount)}});
 // Ngoài đời: ai cũng biết
 const world=(sub:FactSub,vars:Record<string,string>,tone:Fact['tone']='plain')=>add({id:`${sub}:${day}`,topic:'world',sub,about:'world',day,tone,knownBy:'all',vars});
 {const w=weatherOf(day);world('weather',{weather:WEATHER_WORD[w]},w==='storm'||w==='rain'?'bad':'good')}
 {const w=forecastOf(day);world('forecast',{weather:WEATHER_WORD[w]},w==='storm'||w==='rain'?'bad':'good')}
 for(let k=0;k<=3;k++){const h=holidayName(day+k);if(h){world('holiday',{holiday:h},'good');break}}
 {const dow=dateAt(day).getUTCDay();if(dow===5||dow===6)world('weekend',{},'good')}
 out.push(...npcFacts(s));
 return out}
const clockMinute=(s:GameState)=>s.clock?.minute??420;
const fmt=(n:number)=>`${Math.round(n/1000).toLocaleString('vi-VN')} nghìn`;
