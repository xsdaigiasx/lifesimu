/** H7a: NPC ngẫu nhiên tới và đi (HOI-THOAI I.1d). Chủ dự án duyệt 06/11:
 * bắt đầu 6 người (2 ở khu trọ, 1 ở chợ, 1 ở quán, 2 ở công viên), tối đa 12 cùng lúc;
 * người mới chỉ tới ở nơi người chơi lui tới trong 7 ngày qua (khu trọ luôn tính), tối đa 2 người mỗi tuần;
 * 30 ngày không gặp mà chưa tới Quen biết thì chuyển đi (người đã quen ở lại); khoảng 5% người đã chuyển đi quay lại. */
import type {GameState} from './types';
import {rosterOf,pickHolder,worldSeed,townOn,mix,type Holder} from './npc';
import {TOWN_IDS,TOWN_START,TOWN_PLACES,ARCHES,archOf,isTown} from './town-data';
import {cycleOf,depart,busyWith,type CycleState} from './lifecycle';
import {socialOf} from './social';
import {hash} from './shift';

/** Cách nhau ít nhất 4 ngày (nên tối đa 2 người trong 7 ngày); phần trăm mỗi ngày có người tới theo số người đang có (dưới 6 người thì bù nhanh, từ 6 thì chừng 4 đến 6 người mỗi năm). */
export const TOWN={gap:4,beenDays:7,leaveDays:30,stayScore:10,backPct:5,backAfter:30,pct:(on:number)=>on<6?15:on<9?1.5:1} as const;
type Town={on:string[];been?:Partial<Record<string,number>>;last?:number};
const roll=(world:string,salt:string,n:number)=>mix(hash(`${world}:town:${salt}`))%n;
const townOf=(cy:CycleState):Town=>({on:[...TOWN_START],been:{},...cy.town});
/** Danh tính gốc của một người đã đi (để người quay lại vẫn là người đó). */
const idOf=(role:string,h:Holder)=>h.o??`${role}:${h.gen}`;

/** Qua ngày (sau settleCycle): người lâu không gặp chuyển đi, rồi có thể có một người mới tới hoặc người cũ quay lại. */
export function settleTown(s:GameState):GameState{const world=worldSeed(s),day=s.day;let n=s;
 if(!cycleOf(n).town){const cy=cycleOf(n);n={...n,cycle:{...cy,town:townOf(cy)}}}
 // chuyển đi: 30 ngày không gặp, chưa tới Quen biết, không còn chuyện dở
 for(const p of rosterOf(n)){if(!isTown(p.id))continue;const rel=socialOf(n).relations[p.id],h=cycleOf(n).holders[p.id];
  const seen=Math.max(p.since??0,rel?.lastDay??-1,h?.r??-1);if(day-seen>=TOWN.leaveDays&&(rel?.score??0)<TOWN.stayScore&&!busyWith(n,p.id))n=depart(n,p,'left')}
 // người tới
 const cy=cycleOf(n),t=townOf(cy),on=townOn(cy),free=TOWN_IDS.filter(x=>!on.includes(x));
 if(!free.length||day-(t.last??-99)<TOWN.gap||roll(world,`come:${day}`,1000)>=TOWN.pct(on.length)*10)return n;
 const places=TOWN_PLACES.filter(p=>p==='home'||(t.been?.[p]??-99)>=day-TOWN.beenDays),slot=free[0]!,gen=(cy.holders[slot]?.gen??0)+1;
 let h:Holder|undefined;
 if(roll(world,`back:${day}`,100)<TOWN.backPct){const here=new Set(on.map(id=>idOf(id,cy.holders[id]??{gen:0,k:0,since:0})));
  const cand=cy.gone.filter(g=>isTown(g.role)&&g.why==='left'&&day-g.day>=TOWN.backAfter&&!here.has(idOf(g.role,g.h))&&places.includes(archOf(g.h.a)?.place??'home'));
  const g=cand[roll(world,`who:${day}`,Math.max(1,cand.length))];if(g)h={...g.h,gen,o:idOf(g.role,g.h),r:day}}
 if(!h){const place=places[roll(world,`place:${day}`,places.length)]!,list=ARCHES.filter(a=>a.place===place),arch=list[roll(world,`arch:${day}`,list.length)]!;
  h=pickHolder(world,slot,gen,day,rosterOf(n),undefined,arch.id)}
 return{...n,cycle:{...cy,holders:{...cy.holders,[slot]:h},town:{...t,on:[...on,slot],last:day}}}}
