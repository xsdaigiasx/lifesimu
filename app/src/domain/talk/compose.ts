/** H1: ghép một câu NPC từ khung và mảnh (HOI-THOAI T.3). Thuần và tất định theo seed: cùng đầu vào cùng câu. */
import type {PlaceId} from '../types';
import type {NpcProfile} from '../npc';
import {hash} from '../shift';
import {agoText} from '../npc';
import type {After,Channel,Emotion,Fact,Frame,FrameMode,Intent,Piece,PlayerTopic,Slot,TalkData,Tier,TopicGroup} from './types';
import {INTENTS} from './types';
import {channelAllowed,factFits,intentAllowed,privacyCap,tierRank,whenOf} from './axes';
import {startThread,eventOf,type ThreadState} from './threads';
import framesData from './data/frames.json';
import piecesData from './data/pieces.json';
import lo1Data from './data/lo1.json';
import lo2Data from './data/lo2.json';
import lo3Data from './data/lo3.json';

/** Kho khung và mảnh mặc định (kiểm bằng npm run talk:check). */
export const TALK:TalkData={frames:framesData as Frame[],pieces:[...piecesData,...lo1Data,...lo2Data,...lo3Data] as Piece[]};

/** Vân tay chống lặp (I.7): mảnh 14 ngày, khung 3 ngày, ý định cùng chủ đề 2 ngày. Chỉ lưu mã, không lưu câu. */
export interface Print{k:string;d:number}
export const PRINT_DAYS={p:14,f:3,t:2} as const;
export const PRINT_CAP=80;
const used=(recent:readonly Print[],k:string,day:number)=>{const w=PRINT_DAYS[k[0] as keyof typeof PRINT_DAYS]??14;return recent.some(x=>x.k===k&&day-x.d<w)};
/** Ghi thêm vân tay, bỏ mã quá 14 ngày, giữ tối đa 40 mã. */
export function notePrints(list:readonly Print[],keys:readonly string[],day:number):Print[]{return[...list.filter(x=>day-x.d<14&&!keys.includes(x.k)),...keys.map(k=>({k,d:day}))].slice(-PRINT_CAP)}

export interface TalkCtx{npc:NpcProfile;tier:Tier;mood:Emotion;channel:Channel;minute:number;place?:PlaceId;day:number;
 /** hạt giống của lượt nói (ví dụ ngày, giờ, mã NPC) */seed:string;
 facts:readonly Fact[];present?:readonly string[];recent?:readonly Print[];
 /** chỉ thử các ý định này (mặc định: mọi ý định) */intents?:readonly Intent[];data?:TalkData;
 /** H6: chỉ dùng dữ kiện thuộc các nhóm chủ đề này */groups?:readonly TopicGroup[];
 /** H6: bắt buộc nhắc dữ kiện (không nói câu chung, không chào); không có thì trả null */needFact?:boolean}
export interface Said{thread?:ThreadState;text:string;intent:Intent|null;fact?:Fact;frame?:string;pieces:string[];prints:string[];
 /** món NPC vừa hứa cho (từ mảnh có `gift`) */gift?:[string,number];
 /** H6: câu đáp chủ đề người chơi mở bằng mảnh `answer` (lựa chọn trả lời dùng bộ khép chuyện) */mode?:'answer'}
/** H6: lượt đặc biệt (đáp tiếp hoặc đáp chủ đề). */
type Want={mode?:FrameMode;after?:After;answer?:PlayerTopic};

/** Biến điền có sẵn ngoài dữ kiện: xưng hô, trợ từ, thời gian áng chừng. */
export const ADDRESS_VARS=['self','you','Self','You','p'] as const;
const PARTICLE:Record<string,string>={tay:'nghen',bac:'nhé',trung:'nghe',sg:'nha',que:'nghe'};
const cap=(x:string)=>x.charAt(0).toUpperCase()+x.slice(1);
const VAR=/\{([\p{L}_]+)\}/gu;
export const varsIn=(text:string)=>[...text.matchAll(VAR)].map(m=>m[1]!);

function pieceFits(p:Piece,slot:Slot,intent:Intent|null,fact:Fact|undefined,c:TalkCtx,vars:Record<string,unknown>,w:Want={}){
 if(p.slot!==slot)return false;
 if(w.mode==='follow'?!(w.after&&p.after?.includes(w.after)):!!p.after)return false;
 if(w.mode==='answer'?!(w.answer&&p.answer?.includes(w.answer)):!!p.answer)return false;
 if(w.mode!=='answer'&&(intent?(p.intent&&!p.intent.includes(intent)):!!p.intent))return false;
 if(p.topic&&!(fact&&(p.topic.includes(fact.sub)||p.topic.includes(fact.topic))))return false;
 if(p.emotion&&!p.emotion.includes(c.mood))return false;
 if(c.tier==='hostile'?!p.cold:p.cold)return false;
 if(p.minTier&&tierRank(c.tier)<tierRank(p.minTier))return false;
 if((p.privacy??0)>privacyCap(c.tier))return false;
 if(p.voice&&p.voice!==c.npc.voiceKey)return false;
 if(p.npc&&p.npc!==c.npc.id)return false;
 if(p.arch&&!(c.npc.arch&&p.arch.includes(c.npc.arch)))return false;
 if(p.tone&&!(fact&&p.tone.includes(fact.tone)))return false;
 if(p.noArch&&c.npc.arch&&p.noArch.includes(c.npc.arch))return false;
 if(p.town!==undefined&&p.town!==!!c.npc.arch)return false;
 if(p.age&&(c.npc.age<p.age[0]||c.npc.age>p.age[1]))return false;
 if(p.where&&!(c.place&&p.where.includes(c.place)))return false;
 if(p.when&&!p.when.includes(whenOf(c.minute)))return false;
 if(p.channel&&!p.channel.includes(c.channel))return false;
 if(varsIn(p.text).some(v=>vars[v]===undefined)||p.needs?.some(v=>vars[v]===undefined))return false;
 return!used(c.recent??[],'p:'+p.id,c.day)}
/** Rút có trọng số theo seed; mảnh mang giọng hoặc riêng của NPC được nhân đôi. */
function pick<T extends {id:string;weight?:number}>(list:readonly T[],seed:string,boost:(x:T)=>number=()=>1){if(!list.length)return undefined;const w=list.map(x=>Math.max(0,(x.weight??1)*boost(x))),sum=w.reduce((a,b)=>a+b,0);if(sum<=0)return list[0];let r=hash(seed)%10000/10000*sum;for(let i=0;i<list.length;i++){r-=w[i]!;if(r<0)return list[i]}return list[list.length-1]}
/** Xáo theo seed (tất định). */
const order=<T,>(list:readonly T[],seed:string,key:(x:T)=>string)=>[...list].sort((a,b)=>hash(`${seed}:${key(a)}`)-hash(`${seed}:${key(b)}`));
/** H5: trọng số chọn ý định. Xin lỗi hiếm nếu không có chuyện thật để xin lỗi (lỡ hẹn, còn nợ, nói nặng). */
export const INTENT_WEIGHT:Record<Intent,number>={brag:1.2,complain:1,ask:1,invite:.7,request:1,news:.7,tease:1,apologize:.15};
/** Khoe, Nhờ chuyện của chính NPC: hôm NPC không có biến cố thì vẫn nói được bằng mảnh không gắn chủ đề (H5, tránh hiếm). */
const NO_FACT_OK:readonly Intent[]=['brag','request'];
export const FRESH_BOOST=20;
/** Mảnh nhắc đúng dữ kiện được ưu tiên hơn mảnh chung (câu bám chuyện thật, I.9). */
export const TOPIC_BOOST=6;
/** Ý định có chuyện thật để nói nhân trọng số này (06/11). */
export const FACT_BOOST=3;
const SORRY_SUBS=['missed','debt','harsh'];
/** H7a: dữ kiện lần gặp trước (town-data MET_SUBS), luôn thử trước khi chọn chuyện khác. */
const FIRST_SUBS:readonly string[]=['met','metsame','metnew','back'];
/** Xáo có trọng số theo seed (rút không hoàn lại, tất định). */
const weighted=<T,>(list:readonly T[],seed:string,key:(x:T)=>string,w:(x:T)=>number)=>list.map(x=>({x,k:-Math.log((hash(`${seed}:${key(x)}`)%9973+1)/9974)/Math.max(1e-6,w(x))})).sort((a,b)=>a.k-b.k).map(o=>o.x);

/** Nối các mảnh: dấu phẩy giữa mảnh, mảnh đã có dấu câu thì cách bằng khoảng trắng và viết hoa đầu mảnh sau. */
/** Mảnh kết bằng từ hỏi thì đặt dấu hỏi để phần sau viết hoa thành câu mới. */
export const QUESTION=/(?:^|[\s,])(không|hông|hả|chưa|sao rồi|gì|nhỉ|à|chứ|được không)$/u;
/** Trợ từ cuối câu: hai mảnh liền nhau cùng kết bằng trợ từ thì bỏ trợ từ của mảnh trước ("ăn chè với cô nha, đi nha" thành "ăn chè với cô, đi nha"). */
const PARTICLE_END=/\s(nha|nhé|nghe|nghen)$/u;
export function joinParts(parts:readonly string[]){let out='';for(const raw of parts){let p=raw.trim();if(!p)continue;if(out&&PARTICLE_END.test(p)&&PARTICLE_END.test(out))out=out.replace(PARTICLE_END,'');if(!out)out=cap(p);else if(/[.?!]$/.test(out))out+=' '+cap(p);else out+=', '+p;if(QUESTION.test(out))out+='?'}return out&&!/[.?!]$/.test(out)?out+'.':out}

function varsFor(c:TalkCtx,fact?:Fact):Record<string,string|number>{const n=c.npc;return{...(fact?.vars??{}),...(fact?{when:agoText(c.day-fact.day)}:{}),self:n.self,you:n.you,Self:cap(n.self),You:cap(n.you),p:PARTICLE[n.voiceKey]??'nha'}}
const fill=(text:string,vars:Record<string,string|number>)=>text.replace(VAR,(_,k:string)=>String(vars[k]));

function tryFrame(c:TalkCtx,data:TalkData,frame:Frame,intent:Intent|null,fact:Fact|undefined,w:Want={}):Said|null{
 const vars=varsFor(c,fact),parts:string[]=[],ids:string[]=[];
 let topical=false;
 for(const raw of frame.slots){const optional=raw.endsWith('?'),slot=raw.replace('?','') as Slot;
  /* câu gọn (H6): mảnh tuỳ chọn bỏ khi câu đã đủ 3 phần hoặc dài; câu nhắc chuyện cụ thể đã mang cảm xúc nên bỏ ô cảm xúc */
  if(optional&&(parts.length>=3||joinParts(parts).length>=LONG||(slot==='feel'&&topical)))continue;
  const cand=data.pieces.filter(p=>pieceFits(p,slot,intent,fact,c,vars,w)),p=pick(cand,`${c.seed}:${frame.id}:${slot}`,x=>(x.npc||x.arch||x.voice?2:1)*(x.topic?TOPIC_BOOST:1));
  if(!p){if(optional)continue;return null}if(slot==='body'&&p.topic)topical=true;parts.push(fill(p.text,vars));ids.push(p.id)}
 const text=joinParts(parts);if(!text)return null;
 const used=ids.map(id=>data.pieces.find(p=>p.id===id)!),gift=used.map(p=>p.gift).find(Boolean);
 /* câu đáp chủ đề: ý định lấy từ mảnh đầu có ghi (để chọn bộ trả lời), không có thì Kể tin */
 const said:Intent=intent??used.flatMap(p=>p.intent??[])[0]??'news';
 const tag=w.mode==='follow'?`t:${said}:${w.after}`:`t:${said}:${fact?.sub??'-'}`;
 return{...(gift?{gift}:{}),...(w.mode==='answer'&&!used.some(p=>p.intent)?{mode:'answer' as const}:{}),text,intent:said,fact,frame:frame.id,pieces:ids,prints:[...ids.map(id=>'p:'+id),'f:'+frame.id,tag]}}

/** Câu từ 60 ký tự thì không thêm mảnh tuỳ chọn (tránh câu dài lê thê). */
export const LONG=60;
/** Câu chào ngắn theo giọng khi không ghép được gì (mảnh `open` không gắn ý định). */
export function greeting(c:TalkCtx,data:TalkData=c.data??TALK):Said{const vars=varsFor(c),p=pick(data.pieces.filter(x=>pieceFits(x,'open',null,undefined,c,vars)),`${c.seed}:hi`,x=>(x.npc||x.voice?2:1)*(x.topic?TOPIC_BOOST:1));
 return p?{text:joinParts([fill(p.text,vars)]),intent:null,pieces:[p.id],prints:['p:'+p.id]}:{text:joinParts([fill('Chào {you}',vars)]),intent:null,pieces:[],prints:[]}}

/** Ghép một câu cho NPC (trục 6 → 4, 5 → 3 → 1 → 2 → khung và mảnh). Trả về null nếu bối cảnh không cho nói. */
export function compose(c:TalkCtx):Said|null{const data=c.data??TALK,when=whenOf(c.minute);
 if(!channelAllowed(c.channel,when,c.tier,c.npc.age,!!c.npc.family))return null;
 const sorry=(c.groups?c.facts.filter(f=>c.groups!.includes(f.topic)):c.facts).some(f=>SORRY_SUBS.includes(f.sub)&&factFits(f,'apologize',c.tier,c.npc.id,c.present??[]));
 /* ý định chưa nói với người này trong 14 ngày được ưu tiên gấp đôi (đa dạng, I.9) */const said14=new Set((c.recent??[]).filter(x=>x.k.startsWith('t:')&&c.day-x.d<14).map(x=>x.k.split(':')[1]));
 const facts0=c.groups?c.facts.filter(f=>c.groups!.includes(f.topic)):c.facts;
 /* 06/11: ý định đang có chuyện thật để nói được ưu tiên (FACT_BOOST), để câu nhắc chuyện thật không tuỳ vào may rủi rút ý định */const hasFact=(i:Intent)=>facts0.some(f=>factFits(f,i,c.tier,c.npc.id,c.present??[])&&!used(c.recent??[],`t:${i}:${f.sub}`,c.day));
 const intents=weighted((c.intents??INTENTS).filter(i=>intentAllowed(i,c.tier,c.mood)),`${c.seed}:intent`,i=>i,i=>(i==='apologize'&&sorry?1.5:INTENT_WEIGHT[i])*(said14.has(i)?1:FRESH_BOOST)*(hasFact(i)?FACT_BOOST:1));
 /* H7a: người lạ gặp lại nhớ lần trước: dữ kiện lần gặp trước của chính NPC này được thử trước (bỏ câu mở lời kiểu gặp lần đầu) */
 for(const fact of facts0.filter(f=>FIRST_SUBS.includes(f.sub)&&f.about===c.npc.id)){const only={...data,pieces:data.pieces.filter(p=>(p.slot!=='body'||!!p.topic?.includes(fact.sub))&&!(p.slot==='open'&&p.arch))};for(const intent of intents){if(!factFits(fact,intent,c.tier,c.npc.id,c.present??[])||used(c.recent??[],`t:${intent}:${fact.sub}`,c.day))continue;
  for(const frame of order(data.frames.filter(f=>f.intent===intent&&(!f.channel||f.channel.includes(c.channel))&&!used(c.recent??[],'f:'+f.id,c.day)),`${c.seed}:frame:${fact.id}`,f=>f.id)){const said=tryFrame(c,only,frame,intent,fact);if(said&&said.pieces.some(id=>data.pieces.find(p=>p.id===id)?.topic?.includes(fact.sub)))return said}}}
 for(const intent of intents){
  const facts=order(facts0.filter(f=>factFits(f,intent,c.tier,c.npc.id,c.present??[])&&!used(c.recent??[],`t:${intent}:${f.sub}`,c.day)),`${c.seed}:fact:${intent}`,f=>f.id);
  for(const fact of facts){
   if(!c.data&&c.tier!=='hostile'){
    const tagged=startThread(fact,intent,c.npc,c.day,c.seed,(c.recent??[]).filter(x=>c.day-x.d<14).map(x=>x.k));
    if(tagged)return{...tagged,intent,fact,pieces:[],frame:'thread:'+tagged.thread.topic};
   }
   // Có biến cố cụ thể: không dùng câu khẳng định từ nhãn rộng money/family/work.
   if(!c.data&&eventOf(fact))continue;
   const frames=order(data.frames.filter(f=>f.intent===intent&&(!f.channel||f.channel.includes(c.channel))&&!used(c.recent??[],'f:'+f.id,c.day)),`${c.seed}:frame:${fact.id}`,f=>f.id);
   for(const frame of frames){const said=tryFrame(c,data,frame,intent,fact);if(said&&(!c.needFact||said.pieces.some(id=>data.pieces.find(p=>p.id===id)?.topic)))return said}}
  if(!c.needFact&&!facts0.some(f=>eventOf(f)&&f.about===c.npc.id)&&NO_FACT_OK.includes(intent)&&!used(c.recent??[],`t:${intent}:-`,c.day))for(const frame of order(data.frames.filter(f=>f.intent===intent&&(!f.channel||f.channel.includes(c.channel))&&!used(c.recent??[],'f:'+f.id,c.day)),`${c.seed}:frame:-`,f=>f.id)){const said=tryFrame(c,data,frame,intent,undefined);if(said)return said}}
 if(!c.data){const f=facts0.find(f=>eventOf(f)&&f.topic==='self'&&f.about===c.npc.id&&f.vars.event&&intents.some(i=>factFits(f,i,c.tier,c.npc.id,c.present??[])&&(f.tone==='good'?i==='brag':i==='complain')));
  if(f&&c.tier!=='hostile'){const intent=f.tone==='good'?'brag':'complain',key=`p:event:${f.id}`;if(!used(c.recent??[],key,c.day))return{text:joinParts([`${c.npc.self} đang có chuyện ${f.vars.event}`]),intent,fact:f,pieces:[],prints:[key,`t:${intent}:${f.sub}`]}}}
 return c.needFact?null:greeting(c,data)}

/** H6: NPC đáp tiếp sau lựa chọn của người chơi (Hỏi thêm, Giúp, Kể chuyện mình) ở lượt 2, 3; hoặc đáp tin nhắn trả lời. Dùng khung `follow`, mảnh có `after`; mảnh có chủ đề chỉ khi còn dữ kiện của câu trước. */
export function followUp(c:TalkCtx,intent:Intent,after:After,fact?:Fact):Said|null{const data0=c.data??TALK;
 /* 06/11: có câu nối riêng cho ý định này (theo lựa chọn vừa rồi) thì bỏ câu nối dùng chung ("từ từ mà tính" lọt vào lúc đang trêu) */
 const own=data0.pieces.some(p=>p.after?.includes(after)&&p.intent?.includes(intent)),data=own?{...data0,pieces:data0.pieces.filter(p=>!(p.after?.includes(after)&&!p.intent))}:data0;
 if(!channelAllowed(c.channel,whenOf(c.minute),c.tier,c.npc.age,!!c.npc.family))return null;
 for(const frame of order(data.frames.filter(f=>f.mode==='follow'&&(!f.channel||f.channel.includes(c.channel))),`${c.seed}:follow`,f=>f.id)){const said=tryFrame(c,data,frame,intent,fact,{mode:'follow',after});if(said)return{...said,text:dropStacked(said.text)}}
 return null}
/** Câu nối lượt sau: gộp chữ đệm chồng nhau ("Thì đó, ừ," thành "Thì đó,"; "Ờ, ừ," thành "Ờ,"). */
export const dropStacked=(t:string)=>t.replace(/^((?:Thì đó|Thì vậy đó|Ờ|Ừ|Ừa|Ờ thì)),\s+(?:ừ|ờ|ừa),\s+/u,'$1, ')

/** H6: NPC đáp chủ đề người chơi tự mở lời. Hỏi thăm: chuyện của NPC hoặc chuyện chung; Hỏi chuyện của họ: chỉ biến cố đang có của NPC; Kể chuyện mình: NPC hỏi, trêu về chuyện của người chơi; Nhờ việc, hỏi mua bán: mảnh `answer`. Không ghép được thì dùng mảnh `answer` của chủ đề đó. */
export const TOPIC_INTENTS:Record<PlayerTopic,{intents:Intent[];groups:TopicGroup[]}|null>={health:{intents:['complain','brag','news'],groups:['self','world']},theirs:{intents:['complain','brag','request'],groups:['self']},mine:{intents:['ask','tease'],groups:['player']},favor:null};
export function answerTo(c:TalkCtx,topic:PlayerTopic):Said|null{const data=c.data??TALK,t=TOPIC_INTENTS[topic];
 if(!channelAllowed(c.channel,whenOf(c.minute),c.tier,c.npc.age,!!c.npc.family))return null;
 /* câu đáp chủ đề do người chơi chọn: vân tay ý định ghi `u:` để không tính là NPC đã tự nói ý định đó (ưu tiên ý định mới vẫn chạy) */
 if(t){const said=compose({...c,intents:t.intents,groups:t.groups,needFact:true});if(said?.intent)return{...said,prints:said.prints.map(k=>k.startsWith('t:')?'u'+k.slice(1):k)}}
 for(const frame of order(data.frames.filter(f=>f.mode==='answer'&&(!f.channel||f.channel.includes(c.channel))),`${c.seed}:answer`,f=>f.id)){const said=tryFrame(c,data,frame,null,undefined,{mode:'answer',answer:topic});if(said)return said}
 return null}
