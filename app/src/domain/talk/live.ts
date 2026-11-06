/** H5: nối bộ ghép câu vào game. Gom bối cảnh từ trạng thái game (dữ kiện, tâm trạng NPC, độ thân, vân tay) cho câu nói trực tiếp và tin nhắn, và bối cảnh cho lựa chọn trả lời. */
import type {GameState,PlaceId} from '../types';
import type {NpcProfile} from '../npc';
import {socialOf} from '../social';
import {clockOf,END} from '../time';
import {answerTo,compose,followUp,TALK,type Said,type TalkCtx} from './compose';
import {factsOf,witnesses} from './facts';
import {npcDay} from './npc-life';
import {tierOf} from './axes';
import {isTown} from '../town-data';
import {printsOf,talkOf} from './state';
import type {ReplyCtx} from './replies';
import type {After,Channel,Intent,PlayerTopic,Tier} from './types';

/** Người có mảnh riêng (đã đổ dữ liệu, Lô 1): chỉ những người này nói bằng bộ ghép, người khác giữ câu cũ tới Lô 2. */
const OWN=new Set(TALK.pieces.map(p=>p.npc).filter((x):x is string=>!!x));
export const hasOwnLines=(id:string)=>OWN.has(id)||isTown(id);
/** Độ thân dùng cho câu nói: người thân luôn là Tri kỷ (được hỏi chuyện riêng). */
export const tierFor=(s:GameState,npc:NpcProfile):Tier=>npc.family?'bestie':tierOf(socialOf(s).relations[npc.id]?.score??0);

type At={minute?:number;place?:PlaceId};
function ctxNow(s:GameState,npc:NpcProfile,channel:Channel,seed:string,o:At={}):TalkCtx{const c=clockOf(s),minute=o.minute??c.minute,place=o.place??(channel==='face'?c.location:undefined);
 return{npc,tier:tierFor(s,npc),mood:npcDay(s,npc.id)?.mood??'neutral',channel,minute,...(place?{place}:{}),day:s.day,seed,facts:factsOf(s),present:place?witnesses(s,s.day,minute,place):[],recent:printsOf(s,npc.id)}}
/** Ghép câu NPC nói lúc này (hoặc lúc `minute` cho tin nhắn hẹn giờ). */
export function sayNow(s:GameState,npc:NpcProfile,channel:Channel,seed:string,o:At&{intents?:readonly Intent[]}={}):Said|null{return compose({...ctxNow(s,npc,channel,seed,o),...(o.intents?{intents:o.intents}:{})})}
/** H6: NPC đáp tiếp lượt sau (dữ kiện của câu trước tìm lại theo mã, đã hết hạn thì bỏ). */
export function followNow(s:GameState,npc:NpcProfile,channel:Channel,seed:string,intent:Intent,after:After,factId?:string,o:At={}):Said|null{const c=ctxNow(s,npc,channel,seed,o),fact=factId?c.facts.find(f=>f.id===factId):undefined;return followUp(c,intent,after,fact)}
/** H6: NPC đáp chủ đề người chơi tự mở lời. */
export function answerNow(s:GameState,npc:NpcProfile,channel:Channel,seed:string,topic:PlayerTopic):Said|null{return answerTo(ctxNow(s,npc,channel,seed),topic)}

/** Bối cảnh lựa chọn trả lời từ trạng thái người chơi. */
export function replyCtxOf(s:GameState,npc:NpcProfile,intent:Intent,seed:string,gift?:[string,number],more:Pick<ReplyCtx,'mode'|'turn'|'skip'>={}):ReplyCtx{const c=clockOf(s),k=s.skills,cash=s.money;
 return{npc,intent,tier:tierFor(s,npc),day:s.day,seed,player:{energy:s.energy,stress:s.stress,mood:s.mood,money:cash,minute:c.minute,end:END,skills:{communication:k?.communication?.level??1,cooking:k?.cooking?.level??1,logic:k?.logic?.level??1}},log:talkOf(s).log,recent:printsOf(s,npc.id),...(gift?{gift}:{}),...more}}
