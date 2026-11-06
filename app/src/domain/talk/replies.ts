/** H4: lựa chọn trả lời của người chơi và hậu quả theo tính cách NPC (HOI-THOAI I.4).
 * Mỗi lượt 3 đến 4 lựa chọn ghép từ thái độ × hành động, hợp ý định của NPC. Không có câu "đúng cho mọi người":
 * độ hợp tính cách quyết định điểm, cùng thái độ lặp lại trong 7 ngày giảm hiệu quả, giúp mãi thì có giá. */
import type {NpcProfile} from '../npc';
import {hash} from '../shift';
import type {Intent,Tier} from './types';
import type {Print} from './compose';
import {tierRank} from './axes';

export type Attitude='warm'|'blunt'|'joke'|'cold'|'rude'|'dodge';
export type Action='help'|'refuse'|'ask'|'advise'|'accept'|'share'|'silent';
export const ATTITUDES:readonly Attitude[]=['warm','blunt','joke','cold','rude','dodge'];
export const ACTIONS:readonly Action[]=['help','refuse','ask','advise','accept','share','silent'];
export const ATTITUDE_NAME:Record<Attitude,string>={warm:'Ấm áp',blunt:'Thẳng thắn',joke:'Đùa',cold:'Lạnh nhạt',rude:'Khó chịu',dodge:'Né'};

/** Một cách trả lời có thể có: thái độ, hành động, câu (chỗ trống {call}{Call} gọi NPC, {me}{Me} người chơi tự xưng), chi phí, điều kiện. */
interface Template{a:Attitude;x:Action;text:string;minutes?:number;energy?:number;money?:number;need?:['communication'|'cooking'|'logic',number];minTier?:Tier}
/** Hành động hợp với ý định của NPC (NPC Rủ thì có Nhận lời và Từ chối; NPC Than thì có Giúp, Khuyên, Hỏi thêm). */
const BY_INTENT:Record<Intent,Template[]>={
 complain:[{a:'warm',x:'help',text:'{Call} nghỉ đi, để {me} giúp một tay',minutes:15,energy:5},{a:'blunt',x:'advise',text:'{Call} đi khám thử đi, để lâu không tốt',need:['communication',2]},{a:'warm',x:'ask',text:'Vậy hả {call}, bị lâu chưa'},{a:'joke',x:'ask',text:'Chắc tại trời đó {call}, kể {me} nghe coi',minTier:'close'},{a:'dodge',x:'silent',text:'Dạ... {me} đang vội'},{a:'cold',x:'silent',text:'Ừ'}],
 request:[{a:'warm',x:'help',text:'Được, để {me} làm cho',minutes:15,energy:5},{a:'blunt',x:'refuse',text:'Lần này {me} không giúp được, {call} thông cảm'},{a:'warm',x:'ask',text:'{Call} cần gấp không, để {me} tính'},{a:'dodge',x:'refuse',text:'Để bữa khác nha {call}'},{a:'rude',x:'refuse',text:'Sao cứ nhờ {me} hoài vậy'}],
 invite:[{a:'warm',x:'accept',text:'Đi chứ, {me} đi với {call}'},{a:'blunt',x:'refuse',text:'Bữa đó {me} bận rồi'},{a:'warm',x:'ask',text:'Mấy giờ vậy {call}'},{a:'joke',x:'accept',text:'{Call} bao thì {me} đi liền',minTier:'close'},{a:'dodge',x:'refuse',text:'Để {me} coi lại lịch đã'}],
 ask:[{a:'warm',x:'share',text:'Dạ cũng ổn, cảm ơn {call} hỏi thăm'},{a:'blunt',x:'share',text:'Thật ra dạo này {me} cũng hơi mệt'},{a:'warm',x:'ask',text:'Còn {call} dạo này sao rồi'},{a:'joke',x:'share',text:'Vẫn sống khoẻ, {call} yên tâm',minTier:'acquaint'},{a:'dodge',x:'silent',text:'Dạ cũng bình thường'},{a:'cold',x:'silent',text:'Cũng vậy thôi'}],
 brag:[{a:'warm',x:'ask',text:'Hay quá, kể {me} nghe đi {call}'},{a:'joke',x:'ask',text:'Vậy là có người khao rồi nha'},{a:'blunt',x:'advise',text:'Mừng cho {call}, nhớ để dành nha'},{a:'cold',x:'silent',text:'Vậy hả'},{a:'rude',x:'silent',text:'Khoe hoài'}],
 news:[{a:'warm',x:'ask',text:'Thật hả {call}, rồi sao nữa'},{a:'blunt',x:'share',text:'{Me} cũng nghe rồi'},{a:'joke',x:'ask',text:'{Call} biết nhiều chuyện ghê',minTier:'acquaint'},{a:'dodge',x:'silent',text:'Dạ, {me} đi trước nha'}],
 tease:[{a:'joke',x:'share',text:'Thì {call} cũng vậy chứ ai'},{a:'warm',x:'share',text:'Đúng là vậy thiệt, hì'},{a:'blunt',x:'share',text:'{Call} đừng trêu {me} nữa'},{a:'rude',x:'silent',text:'Không vui đâu'}],
 apologize:[{a:'warm',x:'accept',text:'Không sao đâu {call}, chuyện nhỏ mà'},{a:'blunt',x:'accept',text:'Lần sau {call} nhớ báo trước nha'},{a:'cold',x:'silent',text:'Ừ, biết rồi'},{a:'rude',x:'refuse',text:'{Me} không quên dễ vậy đâu'}],
};
/** H6: bộ khép chuyện cho câu NPC đáp chủ đề người chơi mở (Nhờ việc, hỏi mua bán, câu đáp chung): mọi lựa chọn là việc nhẹ. */
const ANSWER:Template[]=[{a:'warm',x:'accept',text:'Dạ, {me} cảm ơn {call} nhiều'},{a:'warm',x:'share',text:'Vậy thì tốt rồi {call}'},{a:'joke',x:'share',text:'{Call} nói vậy là {me} yên tâm rồi',minTier:'acquaint'},{a:'blunt',x:'share',text:'Để {me} tính thêm đã'},{a:'dodge',x:'silent',text:'Dạ'},{a:'cold',x:'silent',text:'Ừ'}];
/** Việc nhẹ chỉ đưa quan hệ tới 29 điểm (#240); Giúp, Nhận lời là việc có chủ đích. */
export const LIGHT:readonly Action[]=['ask','share','silent','advise'];
const BASE:Record<Action,number>={help:4,accept:3,ask:2,share:2,advise:2,refuse:0,silent:0};
/** Độ hợp thái độ với tính cách (cộng vào điểm). Người tự trọng không thích bị thương hại, người cau có quý thẳng thắn, người vui vẻ thích đùa. */
const FIT:Record<Attitude,Record<string,number>>={
 warm:{'dễ xúc động':2,'tốt bụng':1,'hay nói':1,'tự trọng':-1,'kiệm lời':-1},
 blunt:{'cau có':2,'cẩn thận':1,'tự trọng':1,'dễ xúc động':-2,'hay nói':-1},
 joke:{'vui vẻ':2,'hay nói':1,'tò mò':1,'cau có':-2,'tự trọng':-1,'cẩn thận':-1},
 cold:{'kiệm lời':1,'hay nói':-2,'dễ xúc động':-2,'tốt bụng':-1},
 rude:{'cau có':-1,'dễ xúc động':-2,'tự trọng':-2},
 dodge:{'kiệm lời':1,'hay nói':-1,'dễ xúc động':-1},
};
const BASE_ATT:Record<Attitude,number>={warm:1,blunt:0,joke:0,cold:-2,rude:-4,dodge:-1};
/** Lặp cùng thái độ với cùng NPC trong 7 ngày: lần 2 còn 60%, lần 3 trở đi 30% (chỉ phần cộng). */
export const REPEAT=[1,.6,.3] as const,REPEAT_DAYS=7,HELP_LIMIT=3,HELP_DAYS=14;

export interface ReplyLog{d:number;n:string;a:Attitude;x:Action}
export interface PlayerNow{energy:number;stress:number;mood:number;money:number;minute:number;end:number;skills:Partial<Record<'communication'|'cooking'|'logic',number>>}
export interface ReplyCtx{npc:NpcProfile;intent:Intent;tier:Tier;day:number;seed:string;player:PlayerNow;log:readonly ReplyLog[];recent?:readonly Print[];
 /** NPC vừa hứa cho đồ: luôn có Nhận và Từ chối khéo */gift?:[string,number];
 /** H6: câu NPC đáp chủ đề người chơi mở: dùng bộ khép chuyện */mode?:'answer';
 /** H6: lượt thứ mấy của cuộc nói chuyện (từ 1) */turn?:number;
 /** H6: lựa chọn đã chọn ở lượt trước (không lặp lại; đã Hỏi thêm hay Giúp thì không hỏi, giúp lần nữa) */skip?:readonly string[]}
export interface ReplyOption{id:string;attitude:Attitude;action:Action;label:string;minutes:number;energy:number;money:number;
 /** thiếu kỹ năng, năng lượng, tiền hoặc giờ: hiện mờ */locked:boolean;need?:string}

const cap=(x:string)=>x.charAt(0).toUpperCase()+x.slice(1);
/** Người chơi gọi NPC và tự xưng (theo cách NPC xưng hô với người chơi). */
export function playerAddress(n:NpcProfile){const call=n.self==='mình'?'bạn':n.self==='tôi'?(n.role==='Bác sĩ'?'bác sĩ':'anh'):n.self,me=n.you==='bạn'?'mình':n.you;return{call,me}}
const fill=(t:string,n:NpcProfile)=>{const {call,me}=playerAddress(n);return t.replace(/\{(call|Call|me|Me)\}/g,(_,k:string)=>k==='call'?call:k==='Call'?cap(call):k==='me'?me:cap(me))};
const optId=(i:Intent,t:Template)=>`${i}:${t.a}:${t.x}`;
/** H6: lượt 2, 3 chỉ mở khi lựa chọn trước là Hỏi thêm, Giúp hoặc Kể chuyện mình; tối đa 3 lượt. */
export const MAX_TURNS=3,CONTINUE:readonly Action[]=['ask','help','share'];
/** H6: phần cộng quan hệ từ lượt 2 trở đi còn một nửa (nói dài không thành cách cày điểm). */
export const LATER_TURN=.5;
const SKILL_NAME={communication:'Giao tiếp',cooking:'Nấu ăn',logic:'Logic'} as const;

/** Trạng thái người chơi: mệt hoặc căng thẳng cao thì Ấm áp tốn thêm năng lượng, Khó chịu dễ xuất hiện; tâm trạng tốt mới có Đùa (trừ khi NPC đang trêu). */
const GIFT_OPTS:Template[]=[{a:'warm',x:'accept',text:'Dạ, {me} cảm ơn {call} nhiều'},{a:'blunt',x:'refuse',text:'Thôi {call} để bán đi, {me} còn'}];
export function buildReplies(c:ReplyCtx):ReplyOption[]{if(c.gift){const rest=buildReplies({...c,gift:undefined}).filter(o=>o.action!=='accept'&&o.action!=='refuse').slice(0,2);return[...GIFT_OPTS.map(t=>({id:`gift:${t.a}:${t.x}`,attitude:t.a,action:t.x,label:fill(t.text,c.npc),minutes:0,energy:0,money:0,locked:false})),...rest]}const p=c.player,worn=p.energy<25||p.stress>=70,happy=p.mood>=60;
 const sk=new Set(c.skip??[]),skAct=new Set<string>([...sk].map(x=>x.split(':')[2]??'').filter(a=>a==='ask'||a==='help'));
 let pool=(c.mode==='answer'?ANSWER:BY_INTENT[c.intent]).filter(t=>!sk.has(optId(c.intent,t))&&!skAct.has(t.x)).filter(t=>!t.minTier||tierRank(c.tier)>=tierRank(t.minTier)).filter(t=>t.a!=='joke'||happy||c.intent==='tease').filter(t=>t.a!=='rude'||worn||c.tier==='hostile');
 if(c.tier==='hostile')pool=pool.filter(t=>t.a!=='warm'||t.x!=='help');
 const rank=(t:Template)=>hash(`${c.seed}:${optId(c.intent,t)}`)%1000;
 // luôn có một lựa chọn tích cực và một lựa chọn không tích cực, phần còn lại rút theo seed
 const pos=pool.filter(t=>['warm','joke'].includes(t.a)).sort((a,b)=>rank(a)-rank(b)),neg=pool.filter(t=>['cold','rude','dodge','blunt'].includes(t.a)).sort((a,b)=>rank(a)-rank(b));
 const want=pool.length>=4&&hash(`${c.seed}:n`)%2?4:3,pick=(skip:readonly string[])=>{const out:Template[]=[];for(const t of[pos[0],neg[0],...[...pool].sort((a,b)=>rank(a)-rank(b))])if(t&&out.length<want&&!out.includes(t)&&!skip.includes(optId(c.intent,t)))out.push(t);return out};
 let chosen=pick([]);const key=(ts:Template[])=>`r:${c.npc.id}:${ts.map(t=>optId(c.intent,t)).sort().join('|')}`;
 if((c.recent??[]).some(r=>r.k===key(chosen)&&c.day-r.d<REPEAT_DAYS)){const alt=pick([optId(c.intent,chosen[chosen.length-1]!)]);if(alt.length>=3)chosen=alt}
 return chosen.map(t=>{const energy=(t.energy??0)+(worn&&t.a==='warm'&&t.x==='help'?5:0),minutes=t.minutes??5,money=t.money??0,lacks=t.need&&(p.skills[t.need[0]]??1)<t.need[1];
  const locked=!!lacks||p.energy<energy||p.money<money||p.minute+minutes>p.end;
  return{id:optId(c.intent,t),attitude:t.a,action:t.x,label:fill(t.text,c.npc),minutes,energy,money,locked,...(lacks?{need:`${SKILL_NAME[t.need![0]]} Lv${t.need![1]}`}:{})}})}
/** Vân tay bộ lựa chọn để không lặp nguyên bộ với cùng NPC trong 7 ngày. */
export const setPrint=(npc:string,opts:readonly ReplyOption[])=>`r:${npc}:${opts.map(o=>o.id).sort().join('|')}`;

export interface ReplyResult{/** món nhận thật (gọi receiveGift) */gift?:[string,number];relation:number;light:boolean;memory?:{topic:string;tag:string;weight:number};minutes:number;energy:number;/** tiền phải trả (domain money xử lý) */fee:number;
 /** NPC quen dựa dẫm (nhờ nhiều hơn) sau nhiều lần được giúp */reliant:boolean}
/** Hậu quả: điểm quan hệ theo độ hợp tính cách, giảm khi lặp thái độ, ký ức nếu đủ trọng số. Không hiện cho người chơi trước. */
export function resolveReply(c:ReplyCtx,o:ReplyOption):ReplyResult{const t=c.npc.traits;
 let fit=BASE_ATT[o.attitude]+t.reduce((a,x)=>a+(FIT[o.attitude][x]??0),0);
 if(o.attitude==='warm'&&o.action==='help'&&t.includes('tự trọng'))fit-=2;// không thích bị thương hại
 if(o.attitude==='joke'&&c.intent==='brag')fit+=1;// người khoe thích được trêu
 if(o.attitude==='blunt'&&o.action==='refuse'&&t.includes('cẩn thận'))fit+=1;// từ chối thẳng được tôn trọng hơn né
 const recentSame=c.log.filter(l=>l.n===c.npc.id&&l.a===o.attitude&&c.day-l.d<REPEAT_DAYS).length,helps=c.log.filter(l=>l.n===c.npc.id&&l.x==='help'&&c.day-l.d<HELP_DAYS).length;
 let gain=BASE[o.action]+fit;if(gain>0)gain=Math.round(gain*REPEAT[Math.min(recentSame,2)]!*((c.turn??1)>1?LATER_TURN:1)*10)/10;
 const reliant=o.action==='help'&&helps>=HELP_LIMIT-1;if(reliant&&gain>0&&t.includes('keo kiệt'))gain=Math.round(gain*.5*10)/10;// quen được giúp, lợi dụng
 const relation=Math.max(-6,Math.min(6,Math.round(gain)));
 const memory=o.action==='help'?{topic:'được giúp',tag:'help',weight:3}:o.attitude==='rude'?{topic:'bị nói nặng',tag:'rude',weight:3}:o.action==='refuse'&&c.intent==='request'&&tierRank(c.tier)>=3?{topic:'bị từ chối giúp',tag:'refuse',weight:2}:o.attitude==='dodge'&&c.intent==='complain'&&tierRank(c.tier)>=3?{topic:'bận không hỏi han',tag:'dodge',weight:2}:c.intent==='apologize'&&o.action==='accept'?{topic:'được bỏ qua',tag:'forgive',weight:3}:undefined;
 return{...(c.gift&&o.action==='accept'&&o.id.startsWith('gift:')?{gift:c.gift}:{}),relation,light:c.mode==='answer'||LIGHT.includes(o.action)||o.attitude==='joke',...(memory?{memory}:{}),minutes:o.minutes,energy:o.energy,fee:o.money,reliant}}

/** Ghi lựa chọn vào nhật ký trả lời (giữ 30 ngày, tối đa 300 dòng). */
export function noteReply(log:readonly ReplyLog[],r:ReplyLog):ReplyLog[]{return[...log.filter(l=>r.d-l.d<30),r].slice(-300)}
/** Thói quen của người chơi (cơ chế thói quen tích luỹ): thái độ chiếm từ một nửa trong ít nhất 6 lần trả lời gần đây. */
export function habitOf(log:readonly ReplyLog[],day:number):Attitude|null{const l=log.filter(x=>day-x.d<30);if(l.length<6)return null;const n:Record<string,number>={};for(const x of l)n[x.a]=(n[x.a]??0)+1;const [a,k]=Object.entries(n).sort((x,y)=>y[1]-x[1])[0]!;return k*2>=l.length?a as Attitude:null}
/** NPC nhận xét thói quen của người chơi (từ Quen biết). */
export const HABIT_LINE:Record<Attitude,string>={warm:'Dạo này {you} hiền ghê.',blunt:'{You} nói chuyện thẳng ghê.',joke:'{You} lúc nào cũng giỡn được.',cold:'Dạo này {you} ít nói hẳn.',rude:'Dạo này {you} cộc tính quá.',dodge:'Dạo này {you} toàn né {self}.'};
const ATT=new Set<string>(ATTITUDES),ACT=new Set<string>(ACTIONS);
export const validReplyLog=(v:unknown,day:number):v is ReplyLog[]=>Array.isArray(v)&&v.length<=300&&v.every(x=>x&&Number.isInteger(x.d)&&x.d>=0&&x.d<=day&&typeof x.n==='string'&&x.n.length<40&&ATT.has(x.a)&&ACT.has(x.x));
