import type {GameState} from './types';
import type {Employee} from './hiring';
import type {HrState} from './hr';
import {workAt,type WorkState} from './staff';

/** T51 (Kế hoạch mục 35.4; chủ dự án duyệt 05/11): cập nhật sau việc. Ghi ký ức vừa sức, quá sức, được khen, bị chê;
 *  giao quá sức 3 dự án liên tiếp thì kiệt sức, quá dễ 3 dự án liên tiếp thì người tham vọng cao chán. Các số là đề xuất, chỉnh ở T50. */
export const STRAIN={over:3,easy:3,easyGap:3,overFatigue:30,overMorale:-15,overOff:2,easyMorale:-10,easyLoyalty:-5,easyAmbition:60,burnHook:[1,6],boredHook:[7,20]} as const;
const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));

export interface Done{id:string;title:string;skill:'programming'|'logic'|'graphics';lv:number;stars:number}
/** Mức vừa sức của một việc với một người: chênh lệch Lv kỹ năng so với yêu cầu. */
export const gapOf=(e:Employee,skill:Done['skill'],lv:number)=>e.skills[skill]-lv;
export const fitOf=(gap:number)=>gap<0?'over':gap>=STRAIN.easyGap?'easy':'fit';

/** Áp sau một dự án xong cho cả đội. Sửa `n.company.hr` (ký ức, móc) và trả trạng thái việc mới qua `set`; trả các dòng nhật ký. */
export function afterProject(n:GameState,d:Done,team:Employee[],get:(e:Employee)=>WorkState,set:(id:string,w:WorkState)=>void,day:number):[string,string,string][]{
 const c=n.company!,h:HrState=c.hr??={version:1,last:day-1,seq:0,pending:[],log:[],memories:[],hooks:[]},notes:[string,string,string][]=[];
 for(const e of team){
  const w=get(e),gap=gapOf(e,d.skill,d.lv),fit=fitOf(gap),s=w.strain??{over:0,easy:0};
  let over=fit==='over'?s.over+1:0,easy=fit==='easy'?s.easy+1:0,topic='',tag='',weight=2;
  if(fit==='over'){topic='sếp giao việc quá sức với em';tag='over';weight=3}
  else if(fit==='easy'){topic='sếp toàn giao việc quá dễ cho em';tag='easy'}
  else if(d.stars>=4){topic='sếp giao việc vừa sức và khen em';tag='fit'}
  if(d.stars>=4&&fit==='over'){topic='sếp giao việc quá sức nhưng cuối cùng cũng khen em';tag='over'}
  if(d.stars<=2){topic='sếp trách em khi dự án không tốt';tag='blamed';weight=3}
  let mem='';
  if(topic){mem=`m${h.seq++}`;h.memories=[{id:mem,day,emp:e.id,motif:'work' as const,topic,tag,weight},...h.memories].slice(0,60)}
  let nw:WorkState={...w};
  if(over>=STRAIN.over){over=0;nw={...nw,fatigue:clamp(nw.fatigue+STRAIN.overFatigue,0,100),morale:clamp(nw.morale+STRAIN.overMorale,0,100),off:Math.max(nw.off??0,day+STRAIN.overOff)};
   if(h.hooks.length<24)h.hooks.push({emp:e.id,motif:'sick',from:day+STRAIN.burnHook[0],to:day+STRAIN.burnHook[1],memory:mem});
   notes.push([`strain:${e.id}:${day}`,`${e.name} kiệt sức`,`${e.name} kiệt sức sau ${STRAIN.over} dự án quá sức liên tiếp và nghỉ ${STRAIN.overOff} ngày.`])}
  if(easy>=STRAIN.easy&&nw.ambition>=STRAIN.easyAmbition){easy=0;nw={...nw,morale:clamp(nw.morale+STRAIN.easyMorale,0,100),loyalty:clamp(nw.loyalty+STRAIN.easyLoyalty,0,100)};
   if(h.hooks.length<24)h.hooks.push({emp:e.id,motif:'poach',from:day+STRAIN.boredHook[0],to:day+STRAIN.boredHook[1],memory:mem});
   notes.push([`bored:${e.id}:${day}`,`${e.name} chán việc`,`${e.name} chán vì ${STRAIN.easy} dự án liên tiếp quá dễ, tinh thần và gắn bó giảm.`])}
  set(e.id,{...nw,strain:{over,easy}})}
 return notes}
