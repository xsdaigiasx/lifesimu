/** T28: điểm dùng của đồ trong phòng trọ: Nghỉ ở giường, Làm thêm online ở bàn laptop. */
import type {GameState,GameResult} from './types';
import {placedAt,BED_ENERGY} from './home';
import {machineMult,PLAY} from './computer';
import {lifeOf} from './life';
import {spendTime,clockOf} from './time';
import {post} from './money';
import {addWorkXp} from './study';
import {defaultSkills,type SkillId} from './skill-xp';

const clamp=(n:number)=>Math.min(100,Math.max(0,Math.round(n)));
export const NAP={minutes:60,energy:10,stress:3};
export const GIG={minutes:120,energy:12,stress:6,base:100000,perLevel:50000,xp:25};
const GIG_SKILLS:SkillId[]=['programming','graphics','logic'];

export function gigSkill(s:GameState):SkillId{const k={...defaultSkills(),...s.skills};return GIG_SKILLS.reduce((a,b)=>k[b].level>k[a].level?b:a)}
export function gigPay(s:GameState){const k={...defaultSkills(),...s.skills};return GIG.base+GIG.perLevel*k[gigSkill(s)].level}
export const napEnergy=(s:GameState)=>{const b=placedAt(s,'bed');return NAP.energy+(b?BED_ENERGY[b.tier??'basic']/2:0)};

function atHome(s:GameState){return clockOf(s).location==='home'}

export function napAtHome(s:GameState):GameResult{
 const bed=placedAt(s,'bed');if(!bed||!atHome(s))return{ok:false,error:'Cần giường trong phòng.'};
 const l=lifeOf(s);if(l.daily.nap===s.day)return{ok:false,error:'Hôm nay đã nghỉ trưa rồi.'};
 const t=spendTime(s,NAP.minutes);if(!t.ok)return t;const n=structuredClone(t.state),v=structuredClone(lifeOf(s));
 v.daily.nap=s.day;n.life=v;n.energy=clamp(n.energy+napEnergy(s));n.stress=clamp(n.stress-NAP.stress);return{ok:true,state:n}}

export function onlineGig(s:GameState):GameResult{
 const desk=placedAt(s,'desk');if(!desk||!atHome(s))return{ok:false,error:'Cần bàn laptop trong phòng.'};
 const l=lifeOf(s);if(l.daily.gig===s.day)return{ok:false,error:'Hôm nay đã làm thêm rồi.'};
 if(s.energy<GIG.energy+5)return{ok:false,error:'Mệt quá, nghỉ đã.'};
 const pay=Math.round(gigPay(s)*machineMult(s)/1000)*1000,skill=gigSkill(s);
 const t=spendTime(s,GIG.minutes);if(!t.ok)return t;let n=structuredClone(t.state);const v=structuredClone(lifeOf(s));
 v.daily.gig=s.day;n.life=v;n.energy=clamp(n.energy-GIG.energy);n.stress=clamp(n.stress+GIG.stress);
 if(post(n,{id:`gig:${s.day}`,name:'Làm thêm online',amount:pay})!=='ok')return{ok:false,error:'Không ghi được thu nhập.'};
 n=addWorkXp(n,skill,GIG.xp*machineMult(s));return{ok:true,state:n}}

/** T56: giải trí trên máy tính (xem video, chơi game nhẹ), một lần mỗi ngày. */
export function playAtHome(s:GameState):GameResult{
 const desk=placedAt(s,'desk');if(!desk||!atHome(s))return{ok:false,error:'Cần bàn laptop trong phòng.'};
 const l=lifeOf(s);if(l.daily.play===s.day)return{ok:false,error:'Hôm nay đã giải trí rồi.'};
 const t=spendTime(s,PLAY.minutes);if(!t.ok)return t;const n=structuredClone(t.state),v=structuredClone(lifeOf(s));
 v.daily.play=s.day;n.life=v;n.energy=clamp(n.energy-PLAY.energy);n.mood=clamp(n.mood+PLAY.mood);n.stress=clamp(n.stress-PLAY.stress);return{ok:true,state:n}}
