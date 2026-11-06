/** H7a: mạch chuyện riêng của NPC ngẫu nhiên và trí nhớ về lần gặp trước (HOI-THOAI I.1d, Lô 3).
 * Tất định theo seed thế giới và người, không lưu save: mỗi người đi hết mạch này (3 đến 4 nhịp) thì nghỉ một quãng rồi sang mạch khác.
 * "Lần trước" lấy từ ngày tương tác gần nhất trong quan hệ (social.lastDay), nhịp chuyện hôm đó tính lại được từ seed. */
import type {GameState} from '../types';
import type {Fact} from './types';
import {rosterOf,mix,ageAt,type NpcProfile} from '../npc';
import {hash} from '../shift';
import {ARCS,archOf,arcSub,isTown,type Arc,type Beat} from '../town-data';
import {socialOf} from '../social';

export interface ArcBeat{arc:Arc;beat:Beat;start:number;end:number}
/** Quãng nghỉ giữa hai mạch, ngày bắt đầu mạch đầu sau khi tới, cửa sổ còn nhắc lần gặp trước. */
/** Nhắc lần gặp trước: chuyện đã sang nhịp mới thì từ 2 ngày; chỉ nhớ đã gặp hoặc chuyện còn dở thì từ 7 ngày (gặp thường xuyên không nhắc hoài). */
export const ARC={gap:[15,30] as [number,number],first:[0,3] as [number,number],metMin:2,metAgain:7,metMax:90} as const;
const key=(n:NpcProfile)=>`${n.fullName}:${n.born}`;
const roll=(world:string,n:NpcProfile,salt:string,m:number)=>mix(hash(`${world}:${key(n)}:${salt}`))%m;
const span=(world:string,n:NpcProfile,salt:string,r:readonly [number,number])=>r[0]+roll(world,n,salt,r[1]-r[0]+1);
const cache=new Map<string,ArcBeat[]>();
/** Mọi nhịp chuyện của người này từ ngày tới khu cho tới ngày `to` (gồm nhịp đang diễn ra). */
export function arcsOf(world:string,n:NpcProfile,to:number):ArcBeat[]{if(!n.arch)return[];const block=Math.floor(to/60)*60+59,k=`${world}:${key(n)}:${n.arch}:${block}`,hit=cache.get(k);if(hit)return hit;
 const out:ArcBeat[]=[];let t=(n.since??0)+span(world,n,'first',ARC.first),prev='',i=0;
 while(t<=block&&i<400){const age=ageAt(n.born,t),list=ARCS.filter(a=>a.arch.includes(n.arch!)&&(!a.age||(age>=a.age[0]&&age<=a.age[1]))&&a.id!==prev);if(!list.length)break;
  const arc=list[roll(world,n,`arc:${i}`,list.length)]!;
  for(const b of arc.beats){const beat=b.alt&&roll(world,n,`alt:${i}:${b.id}`,100)<b.alt[0]?b.alt[1] as Beat:b,len=span(world,n,`len:${i}:${beat.id}`,beat.dur);out.push({arc,beat,start:t,end:t+len});t+=len}
  t+=span(world,n,`gap:${i}`,ARC.gap);prev=arc.id;i++}
 if(cache.size>300)cache.clear();cache.set(k,out);return out}
/** Nhịp chuyện đang diễn ra ở ngày `day` (giữa hai mạch thì không có). */
export const beatOn=(world:string,n:NpcProfile,day:number)=>arcsOf(world,n,day).find(b=>b.start<=day&&day<b.end);
/** Ngày người chơi tương tác gần nhất trước hôm nay (nói chuyện, giúp, nhận quà...), không có thì -1. */
export function lastMet(s:GameState,id:string){const r=socialOf(s).relations[id];return r&&r.lastDay<s.day?r.lastDay:-1}

/** Dữ kiện của NPC ngẫu nhiên: nhịp chuyện đang diễn ra (chỉ chính họ biết) và lần gặp trước (I.1d: người lạ gặp lại nhớ lần trước).
 * Chuyện đã sang nhịp mới hoặc còn dở là chuyện của họ (nhóm self, để Khoe, Than); chỉ nhớ đã gặp, gặp lại sau khi chuyển đi là chuyện giữa hai người (nhóm player, để Hỏi). */
export function townFacts(s:GameState,day=s.day):Fact[]{const world=s.seed?.world??'next-day',out:Fact[]=[];
 for(const n of rosterOf(s)){if(!n.arch||!isTown(n.id))continue;const now=beatOn(world,n,day),a=archOf(n.arch)!;
  if(now)out.push({id:`arc:${key(n)}:${now.arc.id}:${now.beat.id}:${now.start}`,topic:'self',sub:arcSub(now.arc.id,now.beat.id),about:n.id,day:now.start,tone:now.beat.tone,private:now.beat.private??0,knownBy:[n.id],vars:{doing:now.beat.doing,now:now.beat.now,where:a.where}});
  const met=lastMet(s,n.id),back=s.cycle?.holders[n.id]?.r;
  if(back!==undefined&&met<back){out.push({id:`back:${key(n)}:${back}`,topic:'player',sub:'back',about:n.id,day:back,tone:'plain',private:0,knownBy:[n.id],vars:{where:a.where}});continue}
  if(met<0||day-met<ARC.metMin||day-met>ARC.metMax)continue;
  const then=beatOn(world,n,met),base={topic:'self' as const,about:n.id,day:met,tone:'plain' as const,private:0 as const,knownBy:[n.id]};
  const changed=!!then&&!!now&&!(then.arc.id===now.arc.id&&then.beat.id===now.beat.id);if(!changed&&day-met<ARC.metAgain)continue;
  if(then&&now&&!changed)out.push({...base,id:`met:${n.id}:${met}`,sub:'metsame',vars:{where:a.where,then:then.beat.doing}});
  else if(then&&now)out.push({...base,id:`met:${n.id}:${met}`,sub:'metnew',vars:{where:a.where,then:then.beat.doing,now:now.beat.now}});
  else out.push({...base,topic:'player',id:`met:${n.id}:${met}`,sub:'met',vars:{where:a.where}})}
 return out}
