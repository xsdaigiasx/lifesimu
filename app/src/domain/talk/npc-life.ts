/** H3: đời sống hằng ngày của NPC (HOI-THOAI I.5, I.5b, T.5).
 * Biến cố đời, cảm xúc ngày, hoạt động, mệt và đói đều tính từ seed thế giới và ngày, không lưu vào save
 * (cùng seed cùng đời sống). Chỉ ký ức có trọng số được lưu, và biết quên (`forgetMemories`). */
import type {GameState,PlaceId} from '../types';
import type {Fact,Emotion} from './types';
import {rosterOf,castById,mix,type NpcProfile} from '../npc';
import {hash} from '../shift';
import {dateAt} from '../format';
import {weatherOf} from '../weather';

export interface EventKind{id:string;name:string;sub:string;tone:'good'|'bad'|'plain';dur:[number,number];weight:number;
 age?:[number,number];roles?:string[];privacy:0|1|2|3;
 /** biến cố nối tiếp khi biến cố này kết thúc, kèm phần trăm xảy ra */next?:[string,number];
 /** không tự bắt đầu, chỉ nối tiếp */chained?:boolean;items?:string[]}
export const SELLERS=['veg','meat','grocery','banhmi'];
/** 30 loại biến cố đời NPC. */
export const EVENT_KINDS:EventKind[]=[
 {id:'cold',name:'cảm lạnh',sub:'sick',tone:'bad',dur:[2,5],weight:6,privacy:0},
 {id:'backache',name:'đau lưng',sub:'sick',tone:'bad',dur:[3,10],weight:5,age:[45,99],privacy:0},
 {id:'flu',name:'sốt',sub:'sick',tone:'bad',dur:[3,7],weight:3,privacy:1,next:['checkup',50]},
 {id:'checkup',name:'đi khám',sub:'sick',tone:'plain',dur:[1,2],weight:1,privacy:1,chained:true},
 {id:'promotion',name:'lên chức',sub:'promotion',tone:'good',dur:[3,7],weight:2,age:[24,58],privacy:0},
 {id:'bonus',name:'được thưởng',sub:'promotion',tone:'good',dur:[2,4],weight:3,age:[22,60],privacy:1},
 {id:'overtime',name:'tăng ca liên miên',sub:'work',tone:'bad',dur:[3,10],weight:4,age:[22,60],privacy:0},
 {id:'boss',name:'bất đồng với cấp trên',sub:'work',tone:'bad',dur:[2,6],weight:3,age:[22,60],privacy:1},
 {id:'jobhunt',name:'tìm việc mới',sub:'work',tone:'bad',dur:[5,15],weight:1,age:[22,55],privacy:1,next:['newjob',60]},
 {id:'newjob',name:'nhận việc mới',sub:'work',tone:'good',dur:[3,7],weight:1,privacy:0,chained:true},
 {id:'slow',name:'buôn bán ế',sub:'money',tone:'bad',dur:[3,10],weight:5,roles:SELLERS,privacy:0},
 {id:'brisk',name:'buôn bán đắt hàng',sub:'money',tone:'good',dur:[2,5],weight:4,roles:SELLERS,privacy:0},
 {id:'short',name:'hụt tiền',sub:'money',tone:'bad',dur:[3,10],weight:3,privacy:2},
 {id:'debt',name:'nợ nần',sub:'money',tone:'bad',dur:[7,20],weight:1,age:[25,99],privacy:2},
 {id:'buy',name:'mua đồ mới',sub:'buy',tone:'good',dur:[2,4],weight:3,privacy:0,items:['xe máy mới','cái tivi mới','điện thoại mới','bộ bàn ghế mới','nồi cơm điện mới']},
 {id:'kidexam',name:'con thi cử',sub:'family',tone:'bad',dur:[3,7],weight:2,age:[38,60],privacy:1,next:['kidpass',70]},
 {id:'kidpass',name:'con thi đậu',sub:'family',tone:'good',dur:[3,5],weight:1,privacy:0,chained:true},
 {id:'visit',name:'người nhà lên chơi',sub:'family',tone:'good',dur:[2,4],weight:3,privacy:0},
 {id:'relsick',name:'người nhà ốm',sub:'family',tone:'bad',dur:[4,10],weight:2,privacy:1},
 {id:'wedding',name:'đi đám cưới',sub:'family',tone:'good',dur:[2,5],weight:2,privacy:0},
 {id:'renovate',name:'sửa nhà',sub:'home',tone:'plain',dur:[3,7],weight:2,age:[30,99],privacy:0},
 {id:'exam',name:'thi cuối kỳ',sub:'study',tone:'bad',dur:[3,7],weight:4,age:[16,24],privacy:0,next:['exampass',65]},
 {id:'exampass',name:'qua môn',sub:'study',tone:'good',dur:[2,4],weight:1,privacy:0,chained:true},
 {id:'trip',name:'đi chơi xa',sub:'hobby',tone:'good',dur:[2,4],weight:2,privacy:0},
 {id:'hobby',name:'có thú vui mới',sub:'hobby',tone:'good',dur:[3,7],weight:3,privacy:0},
 {id:'lost',name:'làm mất đồ',sub:'money',tone:'bad',dur:[1,2],weight:3,privacy:0},
 {id:'scam',name:'suýt bị lừa',sub:'money',tone:'bad',dur:[2,5],weight:1,privacy:1},
 {id:'anniv',name:'ngày giỗ trong nhà',sub:'family',tone:'plain',dur:[1,2],weight:2,age:[30,99],privacy:0},
 {id:'lonely',name:'thấy cô đơn',sub:'mood',tone:'bad',dur:[3,7],weight:2,age:[55,99],privacy:2},
 {id:'pet',name:'thú nuôi ốm',sub:'hobby',tone:'bad',dur:[2,4],weight:2,privacy:0},
];
const KIND=Object.fromEntries(EVENT_KINDS.map(k=>[k.id,k])) as Record<string,EventKind>;
/** Phần trăm mỗi ngày một NPC bắt đầu biến cố mới (khoảng 3,5 biến cố mỗi tháng cả nối tiếp), tối đa 2 biến cố cùng lúc. */
export const LIFE={startPct:10,maxActive:2,maxDur:20} as const;
export interface NpcEvent{id:string;kind:string;start:number;end:number;tone:'good'|'bad'|'plain';vars:Record<string,string>}

const roll=(world:string,npc:string,salt:string,n:number)=>mix(hash(`${world}:${npc}:${salt}`))%n;
const fits=(k:EventKind,n:NpcProfile)=>!(k.age&&(n.age<k.age[0]||n.age>k.age[1]))&&!(k.roles&&!k.roles.includes(n.id));
/** Biến cố bắt đầu đúng ngày `day` (nếu có), xét giới hạn số biến cố đang diễn ra. */
function startOn(world:string,n:NpcProfile,day:number,active:readonly NpcEvent[]):NpcEvent|null{
 if(active.length>=LIFE.maxActive||roll(world,n.id,`start:${day}`,100)>=LIFE.startPct)return null;
 const list=EVENT_KINDS.filter(k=>!k.chained&&fits(k,n)&&!active.some(a=>a.kind===k.id)),sum=list.reduce((t,k)=>t+k.weight*(n.fear==='Bị lừa'&&k.id==='scam'?3:1),0);if(!sum)return null;
 let r=roll(world,n.id,`kind:${day}`,sum),pick=list[0]!;for(const k of list){r-=k.weight*(n.fear==='Bị lừa'&&k.id==='scam'?3:1);if(r<0){pick=k;break}}
 return make(world,n,pick,day)}
function make(world:string,n:NpcProfile,k:EventKind,day:number):NpcEvent{const len=k.dur[0]+roll(world,n.id,`len:${k.id}:${day}`,k.dur[1]-k.dur[0]+1);
 return{id:`${n.id}:${k.id}:${day}`,kind:k.id,start:day,end:day+len,tone:k.tone,vars:{event:k.name,...(k.items?{item:k.items[roll(world,n.id,`item:${day}`,k.items.length)]!}:{})}}}

const lifeCache=new Map<string,NpcEvent[]>();
/** Mọi biến cố của một NPC có ngày bắt đầu trong [from, to], kể cả biến cố nối tiếp. Tất định theo seed. */
export function eventsBetween(world:string,n:NpcProfile,from:number,to:number):NpcEvent[]{
 const key=`${world}:${n.id}:${from}:${to}`,hit=lifeCache.get(key);if(hit)return hit;
 const out:NpcEvent[]=[];const chain:NpcEvent[]=[];
 for(let d=Math.max(0,from-LIFE.maxDur*2);d<=to;d++){
  for(const e of out.concat(chain).filter(e=>e.end===d)){const k=KIND[e.kind]!;if(k.next&&roll(world,n.id,`next:${e.id}`,100)<k.next[1]){const c=make(world,n,KIND[k.next[0]]!,d);chain.push(c)}}
  const active=[...out,...chain].filter(e=>e.start<=d&&d<e.end),e=startOn(world,n,d,active);if(e)out.push(e)}
 const all=[...out,...chain].filter(e=>e.start>=from&&e.start<=to).sort((a,b)=>a.start-b.start||a.id.localeCompare(b.id));
 if(lifeCache.size>400)lifeCache.clear();lifeCache.set(key,all);return all}
/** Biến cố đang diễn ra của NPC vào ngày `day`. */
export function eventsOn(world:string,n:NpcProfile,day:number){const block=Math.floor(day/30)*30;return eventsBetween(world,n,block-LIFE.maxDur*2,block+29).filter(e=>e.start<=day&&day<e.end)}

/** Cảm xúc ngày (giữ nguyên trong ngày): theo biến cố đang diễn ra, tính cách và thời tiết. */
export function moodOf(world:string,n:NpcProfile,day:number):Emotion{const ev=eventsOn(world,n,day),bad=ev.filter(e=>e.tone==='bad').length,good=ev.filter(e=>e.tone==='good').length;
 const r=roll(world,n.id,`mood:${day}`,100),t=n.traits,wet=['rain','storm'].includes(weatherOf(day));
 if(bad){const sick=ev.some(e=>KIND[e.kind]!.sub==='sick'||e.kind==='overtime');return sick?(r<70?'tired':'sad'):t.includes('cau có')&&r<50?'annoyed':r<55?'sad':r<80?'tired':'annoyed'}
 if(good)return r<55?'happy':'excited';
 if(wet&&r<30)return'tired';const cheer=t.includes('vui vẻ')?25:0,grump=t.includes('cau có')?15:0;
 return r<15+cheer?'happy':r<20+cheer?'excited':r>=95-grump?'annoyed':'neutral'}

/** Giai đoạn đời theo tuổi (I.5c). */
export const stageOf=(age:number)=>age<22?'study':age>60?'retired':'work';
const ACT:Record<string,string>={market:'bán hàng ở chợ',streetfood:'ở quán ăn',office:'làm việc',bank:'làm ở ngân hàng',hospital:'khám bệnh',park:'tập thể dục',home:'ở khu trọ',bus:'chạy xe giao hàng'};
/** Hoạt động lúc `minute` (lịch hiện diện trước, rồi lịch mẫu theo giai đoạn đời và thứ trong tuần). */
export function activityOf(n:NpcProfile,day:number,minute:number):{label:string;place:PlaceId|'away';sleeping:boolean}{
 const m=((minute%1440)+1440)%1440,dow=dateAt(day).getUTCDay(),slot=n.schedule.find(s=>s.days.includes(dow)&&m>=s.from&&m<s.to);
 if(slot)return{label:n.id==='banhmi'&&slot.place==='streetfood'?'bán bánh mì':n.id==='landlord'&&slot.place==='home'?'trông khu trọ':ACT[slot.place]??'ở ngoài',place:slot.place,sleeping:false};
 const st=stageOf(n.age),wake=st==='retired'?300:st==='study'?420:360,bed=st==='retired'?1290:st==='study'?1410:1350;
 if(m<wake||m>=bed)return{label:'đang ngủ',place:'away',sleeping:true};
 if((m>=690&&m<780)||(m>=1110&&m<1200))return{label:'ăn cơm',place:'away',sleeping:false};
 const weekend=dow===0||dow===6;
 return{label:st==='study'?(weekend?'đi chơi với bạn':'đi học'):st==='retired'?(m<660?'đi dạo':'uống trà ở nhà'):(weekend?'ở nhà nghỉ ngơi':m<1050?'đi làm':'ở nhà'),place:'away',sleeping:false}}
/** Mệt và đói (0 đến 100) lúc `minute`: mệt tăng từ lúc dậy, đói tăng sau mỗi bữa (7:00, 12:00, 19:00). */
export function needsOf(n:NpcProfile,day:number,minute:number){const st=stageOf(n.age),wake=st==='retired'?300:st==='study'?420:360,m=minute%1440;
 const awake=Math.max(0,m-wake);void day;
 const fatigue=Math.min(100,Math.round(awake/9*(st==='retired'?1.2:1))),meals=[420,720,1140].filter(x=>x<=m),since=meals.length?m-meals[meals.length-1]!:m+300;
 return{fatigue,hunger:Math.min(100,Math.round(since/3))}}

/** Biến cố đang diễn ra của cả dàn thành dữ kiện "bản thân" (chỉ chính NPC biết; người khác nghe kể ở H7). */
export function npcFacts(s:GameState,day=s.day):Fact[]{const w=s.seed?.world??'next-day';return rosterOf(s).flatMap(n=>eventsOn(w,n,day).map(e=>{const k=KIND[e.kind]!;return{id:`npc:${e.id}`,topic:'self' as const,sub:k.sub,about:n.id,day:e.start,tone:e.tone,private:k.privacy,knownBy:[n.id],vars:e.vars}}))}
/** Đời sống hôm nay của một NPC. */
export function npcDay(s:GameState,id:string,day=s.day){const n=castById(s,id);if(!n)return null;const w=s.seed?.world??'next-day';return{mood:moodOf(w,n,day),events:eventsOn(w,n,day)}}

// ---------- Ký ức và quên (T.5)
export interface Mem{id:string;day:number;npc:string;tag:string;weight:number;recalled?:number;
 /** ngày gần nhất trọng số đổi (nhắc lại, giảm dần) */at?:number}
export const FORGET={minWeight:2,every:30,heavyEvery:60,perNpc:12,total:200,kindFaster:.67,grudgeSlower:1.5} as const;
const BAD_TAGS=['refuse','dodge','decline','blunt','unpaid','missed','demand','avoid','later'];
/** Chu kỳ giảm trọng số: 30 ngày, trọng số 5 thì 60 ngày; người tốt bụng hay hào phóng quên lỗi nhanh hơn, người cau có nhớ lỗi lâu hơn. */
export function forgetEvery(m:Mem,traits:readonly string[]=[]){let d:number=m.weight>=5?FORGET.heavyEvery:FORGET.every;if(BAD_TAGS.includes(m.tag)){if(traits.includes('tốt bụng')||traits.includes('hào phóng'))d*=FORGET.kindFaster;if(traits.includes('cau có'))d*=FORGET.grudgeSlower}return Math.round(d)}
/** Qua ngày: ký ức lâu không nhắc giảm 1 trọng số mỗi chu kỳ, dưới 2 thì xoá; mỗi NPC giữ tối đa 12, tổng tối đa 200 (bỏ nhẹ nhất, cũ nhất). Ký ức đang gắn móc nối tiếp thì giữ. */
export function forgetMemories<T extends Mem>(list:readonly T[],day:number,traitsOf:(npc:string)=>readonly string[],keep:(m:T)=>boolean=()=>false):T[]{
 let out=list.map(m=>{const last=Math.max(m.at??m.day,m.recalled??0);return day-last>=forgetEvery(m,traitsOf(m.npc))?{...m,weight:m.weight-1,at:day}:m}).filter(m=>m.weight>=FORGET.minWeight||keep(m));
 const byNpc=new Map<string,T[]>();for(const m of out)byNpc.set(m.npc,[...(byNpc.get(m.npc)??[]),m]);
 const drop=new Set<string>();const lightest=(a:T[])=>[...a].filter(m=>!keep(m)).sort((x,y)=>x.weight-y.weight||x.day-y.day);
 for(const ms of byNpc.values())for(const m of lightest(ms).slice(0,Math.max(0,ms.length-FORGET.perNpc)))drop.add(m.id);
 out=out.filter(m=>!drop.has(m.id));for(const m of lightest(out).slice(0,Math.max(0,out.length-FORGET.total)))drop.add(m.id);
 return out.filter(m=>!drop.has(m.id))}
/** Nhắc lại hoặc làm việc liên quan: trọng số +1 (tối đa 5). */
export const reinforce=<T extends Mem>(m:T,day:number):T=>({...m,weight:Math.min(5,m.weight+1),at:day,recalled:day});
