/** T28: điểm dùng của đồ trong phòng trọ: Nghỉ ở giường, Làm thêm online ở bàn laptop. */
import type {GameState,GameResult} from './types';
import {placedAt,livesInTro,homeOf,BED_ENERGY} from './home';
import {atResidence,layoutOf} from './housing';
import {placedDevices} from './utility';
import {machineMult,PLAY} from './computer';
import {lifeOf} from './life';
import {spendTime} from './time';
import {post} from './money';
import {addWorkXp} from './study';
import {defaultSkills,type SkillId} from './skill-xp';

const clamp=(n:number)=>Math.min(100,Math.max(0,Math.round(n)));
export const NAP={minutes:60,energy:10,stress:3};
export const GIG={minutes:120,energy:12,stress:6,base:100000,perLevel:50000,xp:25};
const GIG_SKILLS:SkillId[]=['programming','graphics','logic'];

export function gigSkill(s:GameState):SkillId{const k={...defaultSkills(),...s.skills};return GIG_SKILLS.reduce((a,b)=>k[b].level>k[a].level?b:a)}
export function gigPay(s:GameState){const k={...defaultSkills(),...s.skills};return GIG.base+GIG.perLevel*k[gigSkill(s)].level}
/** Phòng trọ: đồ phải đặt trong phòng; nhà phố và biệt thự: đồ phải có trong bố cục các tầng (T76). */
export function hasSpot(s:GameState,id:'bed'|'desk'){if(livesInTro(s))return !!placedAt(s,id);const h=s.housing!.house;return([1,2] as const).some(f=>layoutOf(s,h,f).some(i=>i.id===id))}
const bedTier=(s:GameState)=>homeOf(s).items.find(i=>i.id==='bed')?.tier??'basic';
export const napEnergy=(s:GameState)=>NAP.energy+(hasSpot(s,'bed')?BED_ENERGY[bedTier(s)]/2:0);

const atHome=atResidence;

export function napAtHome(s:GameState):GameResult{
 if(!hasSpot(s,'bed')||!atHome(s))return{ok:false,error:'Cần giường trong nhà.'};
 const l=lifeOf(s);if(l.daily.nap===s.day)return{ok:false,error:'Hôm nay đã nghỉ trưa rồi.'};
 const t=spendTime(s,NAP.minutes);if(!t.ok)return t;const n=structuredClone(t.state),v=structuredClone(lifeOf(s));
 v.daily.nap=s.day;n.life=v;n.energy=clamp(n.energy+napEnergy(s));n.stress=clamp(n.stress-NAP.stress);return{ok:true,state:n}}

export function onlineGig(s:GameState):GameResult{
 if(!hasSpot(s,'desk')||!atHome(s))return{ok:false,error:'Cần bàn làm việc trong nhà.'};
 const l=lifeOf(s);if(l.daily.gig===s.day)return{ok:false,error:'Hôm nay đã làm thêm rồi.'};
 if(s.energy<GIG.energy+5)return{ok:false,error:'Mệt quá, nghỉ đã.'};
 const pay=Math.round(gigPay(s)*machineMult(s)/1000)*1000,skill=gigSkill(s);
 const t=spendTime(s,GIG.minutes);if(!t.ok)return t;let n=structuredClone(t.state);const v=structuredClone(lifeOf(s));
 v.daily.gig=s.day;n.life=v;n.energy=clamp(n.energy-GIG.energy);n.stress=clamp(n.stress+GIG.stress);
 if(post(n,{id:`gig:${s.day}`,name:'Làm thêm online',amount:pay})!=='ok')return{ok:false,error:'Không ghi được thu nhập.'};
 n=addWorkXp(n,skill,GIG.xp*machineMult(s));return{ok:true,state:n}}

/** T56: giải trí trên máy tính (xem video, chơi game nhẹ), một lần mỗi ngày. */
export function playAtHome(s:GameState):GameResult{
 if(!hasSpot(s,'desk')||!atHome(s))return{ok:false,error:'Cần bàn làm việc trong nhà.'};
 const l=lifeOf(s);if(l.daily.play===s.day)return{ok:false,error:'Hôm nay đã giải trí rồi.'};
 const t=spendTime(s,PLAY.minutes);if(!t.ok)return t;const n=structuredClone(t.state),v=structuredClone(lifeOf(s));
 v.daily.play=s.day;n.life=v;n.energy=clamp(n.energy-PLAY.energy);n.mood=clamp(n.mood+PLAY.mood);n.stress=clamp(n.stress-PLAY.stress);return{ok:true,state:n}}

/** Xem TV (TV đặt trong nhà đang ở): mỗi ngày một lần, độc lập với Giải trí ở bàn laptop. */
export const TV_USE={minutes:30,energy:8,mood:6,stress:10};
export function watchTv(s:GameState):GameResult{
 if(!atResidence(s)||!placedDevices(s).some(d=>d.id==='tv'))return{ok:false,error:'Cần TV đặt trong nhà.'};
 const l=lifeOf(s);if(l.daily.tv===s.day)return{ok:false,error:'Hôm nay đã xem TV rồi.'};
 const t=spendTime(s,TV_USE.minutes);if(!t.ok)return t;const n=structuredClone(t.state),v=structuredClone(lifeOf(s));
 v.daily.tv=s.day;n.life=v;n.energy=clamp(n.energy+TV_USE.energy);n.mood=clamp(n.mood+TV_USE.mood);n.stress=clamp(n.stress-TV_USE.stress);return{ok:true,state:n}}
