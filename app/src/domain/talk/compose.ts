/** H1: ghép một câu NPC từ khung và mảnh (HOI-THOAI T.3). Thuần và tất định theo seed: cùng đầu vào cùng câu. */
import type {PlaceId} from '../types';
import type {NpcProfile} from '../npc';
import {hash} from '../shift';
import {agoText} from '../npc';
import type {Channel,Emotion,Fact,Frame,Intent,Piece,Slot,TalkData,Tier} from './types';
import {INTENTS} from './types';
import {channelAllowed,factFits,intentAllowed,privacyCap,tierRank,whenOf} from './axes';
import framesData from './data/frames.json';
import piecesData from './data/pieces.json';
import lo1Data from './data/lo1.json';

/** Kho khung và mảnh mặc định (kiểm bằng npm run talk:check). */
export const TALK:TalkData={frames:framesData as Frame[],pieces:[...piecesData,...lo1Data] as Piece[]};

/** Vân tay chống lặp (I.7): mảnh 14 ngày, khung 3 ngày, ý định cùng chủ đề 2 ngày. Chỉ lưu mã, không lưu câu. */
export interface Print{k:string;d:number}
export const PRINT_DAYS={p:14,f:3,t:2} as const;
export const PRINT_CAP=40;
const used=(recent:readonly Print[],k:string,day:number)=>{const w=PRINT_DAYS[k[0] as keyof typeof PRINT_DAYS]??14;return recent.some(x=>x.k===k&&day-x.d<w)};
/** Ghi thêm vân tay, bỏ mã quá 14 ngày, giữ tối đa 40 mã. */
export function notePrints(list:readonly Print[],keys:readonly string[],day:number):Print[]{return[...list.filter(x=>day-x.d<14&&!keys.includes(x.k)),...keys.map(k=>({k,d:day}))].slice(-PRINT_CAP)}

export interface TalkCtx{npc:NpcProfile;tier:Tier;mood:Emotion;channel:Channel;minute:number;place?:PlaceId;day:number;
 /** hạt giống của lượt nói (ví dụ ngày, giờ, mã NPC) */seed:string;
 facts:readonly Fact[];present?:readonly string[];recent?:readonly Print[];
 /** chỉ thử các ý định này (mặc định: mọi ý định) */intents?:readonly Intent[];data?:TalkData}
export interface Said{text:string;intent:Intent|null;fact?:Fact;frame?:string;pieces:string[];prints:string[];
 /** món NPC vừa hứa cho (từ mảnh có `gift`) */gift?:[string,number]}

/** Biến điền có sẵn ngoài dữ kiện: xưng hô, trợ từ, thời gian áng chừng. */
export const ADDRESS_VARS=['self','you','Self','You','p'] as const;
const PARTICLE:Record<string,string>={tay:'nghen',bac:'nhé',trung:'nghe',sg:'nha',que:'nghe'};
const cap=(x:string)=>x.charAt(0).toUpperCase()+x.slice(1);
const VAR=/\{([\p{L}_]+)\}/gu;
export const varsIn=(text:string)=>[...text.matchAll(VAR)].map(m=>m[1]!);

function pieceFits(p:Piece,slot:Slot,intent:Intent|null,fact:Fact|undefined,c:TalkCtx,vars:Record<string,unknown>){
 if(p.slot!==slot)return false;
 if(intent?(p.intent&&!p.intent.includes(intent)):!!p.intent)return false;
 if(p.topic&&!(fact&&(p.topic.includes(fact.sub)||p.topic.includes(fact.topic))))return false;
 if(p.emotion&&!p.emotion.includes(c.mood))return false;
 if(c.tier==='hostile'?!p.cold:p.cold)return false;
 if(p.minTier&&tierRank(c.tier)<tierRank(p.minTier))return false;
 if((p.privacy??0)>privacyCap(c.tier))return false;
 if(p.voice&&p.voice!==c.npc.voiceKey)return false;
 if(p.npc&&p.npc!==c.npc.id)return false;
 if(p.age&&(c.npc.age<p.age[0]||c.npc.age>p.age[1]))return false;
 if(p.where&&!(c.place&&p.where.includes(c.place)))return false;
 if(p.when&&!p.when.includes(whenOf(c.minute)))return false;
 if(p.channel&&!p.channel.includes(c.channel))return false;
 if(varsIn(p.text).some(v=>vars[v]===undefined))return false;
 return!used(c.recent??[],'p:'+p.id,c.day)}
/** Rút có trọng số theo seed; mảnh mang giọng hoặc riêng của NPC được nhân đôi. */
function pick<T extends {id:string;weight?:number}>(list:readonly T[],seed:string,boost:(x:T)=>number=()=>1){if(!list.length)return undefined;const w=list.map(x=>Math.max(0,(x.weight??1)*boost(x))),sum=w.reduce((a,b)=>a+b,0);if(sum<=0)return list[0];let r=hash(seed)%10000/10000*sum;for(let i=0;i<list.length;i++){r-=w[i]!;if(r<0)return list[i]}return list[list.length-1]}
/** Xáo theo seed (tất định). */
const order=<T,>(list:readonly T[],seed:string,key:(x:T)=>string)=>[...list].sort((a,b)=>hash(`${seed}:${key(a)}`)-hash(`${seed}:${key(b)}`));

/** Nối các mảnh: dấu phẩy giữa mảnh, mảnh đã có dấu câu thì cách bằng khoảng trắng và viết hoa đầu mảnh sau. */
export function joinParts(parts:readonly string[]){let out='';for(const raw of parts){const p=raw.trim();if(!p)continue;if(!out)out=cap(p);else if(/[.?!]$/.test(out))out+=' '+cap(p);else out+=', '+p}return out&&!/[.?!]$/.test(out)?out+'.':out}

function varsFor(c:TalkCtx,fact?:Fact):Record<string,string|number>{const n=c.npc;return{...(fact?.vars??{}),...(fact?{when:agoText(c.day-fact.day)}:{}),self:n.self,you:n.you,Self:cap(n.self),You:cap(n.you),p:PARTICLE[n.voiceKey]??'nha'}}
const fill=(text:string,vars:Record<string,string|number>)=>text.replace(VAR,(_,k:string)=>String(vars[k]));

function tryFrame(c:TalkCtx,data:TalkData,frame:Frame,intent:Intent,fact:Fact|undefined):Said|null{
 const vars=varsFor(c,fact),parts:string[]=[],ids:string[]=[];
 for(const raw of frame.slots){const optional=raw.endsWith('?'),slot=raw.replace('?','') as Slot;
  const cand=data.pieces.filter(p=>pieceFits(p,slot,intent,fact,c,vars)),p=pick(cand,`${c.seed}:${frame.id}:${slot}`,x=>x.npc||x.voice?2:1);
  if(!p){if(optional)continue;return null}parts.push(fill(p.text,vars));ids.push(p.id)}
 const text=joinParts(parts);if(!text)return null;
 const gift=ids.map(id=>data.pieces.find(p=>p.id===id)?.gift).find(Boolean);
 return{...(gift?{gift}:{}),text,intent,fact,frame:frame.id,pieces:ids,prints:[...ids.map(id=>'p:'+id),'f:'+frame.id,`t:${intent}:${fact?.sub??'-'}`]}}

/** Câu chào ngắn theo giọng khi không ghép được gì (mảnh `open` không gắn ý định). */
export function greeting(c:TalkCtx,data:TalkData=c.data??TALK):Said{const vars=varsFor(c),p=pick(data.pieces.filter(x=>pieceFits(x,'open',null,undefined,c,vars)),`${c.seed}:hi`,x=>x.npc||x.voice?2:1);
 return p?{text:joinParts([fill(p.text,vars)]),intent:null,pieces:[p.id],prints:['p:'+p.id]}:{text:joinParts([fill('Chào {you}',vars)]),intent:null,pieces:[],prints:[]}}

/** Ghép một câu cho NPC (trục 6 → 4, 5 → 3 → 1 → 2 → khung và mảnh). Trả về null nếu bối cảnh không cho nói. */
export function compose(c:TalkCtx):Said|null{const data=c.data??TALK,when=whenOf(c.minute);
 if(!channelAllowed(c.channel,when,c.tier,c.npc.age,!!c.npc.family))return null;
 const intents=order((c.intents??INTENTS).filter(i=>intentAllowed(i,c.tier,c.mood)),`${c.seed}:intent`,i=>i);
 for(const intent of intents){
  const facts=order(c.facts.filter(f=>factFits(f,intent,c.tier,c.npc.id,c.present??[])&&!used(c.recent??[],`t:${intent}:${f.sub}`,c.day)),`${c.seed}:fact:${intent}`,f=>f.id);
  for(const fact of facts){
   const frames=order(data.frames.filter(f=>f.intent===intent&&(!f.channel||f.channel.includes(c.channel))&&!used(c.recent??[],'f:'+f.id,c.day)),`${c.seed}:frame:${fact.id}`,f=>f.id);
   for(const frame of frames){const said=tryFrame(c,data,frame,intent,fact);if(said)return said}}}
 return greeting(c,data)}
