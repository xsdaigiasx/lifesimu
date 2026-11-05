/** T17 + T40: bộ điều phối sự kiện NPC, 8 mô-típ đầu, ký ức tối thiểu, móc tiếp nối, cho mượn tiền (chốt 04/11).
 * NPC tự bắt chuyện tối đa 3 lần mỗi ngày; người chơi chủ động không giới hạn, mỗi người cách nhau 60 phút.
 * Lựa chọn không ghi trước hệ quả; lựa chọn thiếu điều kiện hiện mờ. Nhắc chuyện cũ bằng thời gian áng chừng. */
import type {GameState,GameResult,PlaceId} from './types';
import {rosterOf,castById,presentAt,inReach,isNpcId,agoText,type NpcProfile} from './npc';
import {socialOf,adjustRelation,tierFloor,nearTier} from './social';
import {clockOf,spendTime,END} from './time';
import {post} from './money';
import {recordJournal} from './journal';
import {giftIngredient,learnRecipe,knowsRecipe,NPC_TEACHES,RECIPES,type IngredientId,type RecipeId} from './life';
import {addWorkXp} from './study';
import {SKILLS,type SkillId} from './skill-xp';
import {hash} from './shift';
import {weatherOf,OUTDOOR} from './weather';
import {dueAppointment,markAppointment,MOM_PARCEL} from './inbox';
import {sendParcel} from './gifts';
import {forgetMemories,reinforce,FORGET} from './talk/npc-life';
import {chooseLine,lineById,fill,intentsWithLines} from './lines';
import {hasOwnLines,sayNow,replyCtxOf} from './talk/live';
import {buildReplies,resolveReply,setPrint} from './talk/replies';
import {noteReplyFor,notePrintsFor} from './talk/state';
import {receiveGift,isGiftItem,GIFT_MAX,giftText} from './gifts';
import {INTENTS,type Intent} from './talk/types';
/** T41: ký ức nhẹ (dưới 4) mờ sau 30 ngày; ký ức nặng không quên. Từ H3 ký ức NPC quên theo `forgetMemories`; `alive` còn dùng cho ký ức nhân viên (hr.ts). */
export const FADE_DAYS=30,RECALL_GAP=7,HEARD_KEEP=16;
export const alive=(m:Memory,day:number)=>m.weight>=4||day-m.day<=FADE_DAYS;
const unpaidLoan=(s:GameState,npc:string)=>storyOf(s).loans.find(l=>l.npc===npc&&l.settled==='unpaid'&&!l.resolved);
const REFUSE=['refuse','dodge','decline','blunt'];
/** Mô-típ có chủ đích được ưu tiên khi quan hệ gần mốc bậc, và xác suất (phần trăm) ưu tiên. */
const NEAR_DEEP:MotifId[]=['favor','meal','recipe','private'],NEAR_BOOST=70;

export type MotifId='greet'|'favor'|'return'|'meal'|'private'|'loan'|'recipe'|'mom'|'debt';
export const NPC_DAILY_LIMIT=3,PLAYER_COOLDOWN=60,REPEAT_DAYS=14,LOAN_BASE_RISK=20;
export interface Memory{id:string;day:number;npc:string;motif:MotifId;topic:string;tag:string;weight:number;recalled?:number;/** H3: ngày trọng số đổi gần nhất (nhắc lại, giảm dần) */at?:number}
export interface Hook{npc:string;motif:MotifId;from:number;to:number;memory:string}
export interface Loan{id:string;npc:string;amount:number;due:number;repay:boolean;settled?:'paid'|'unpaid';/** đã xử lý xong khoản quỵt (xoá nợ, đòi, trả một nửa) */resolved?:boolean}
export interface PendingEvent{key:string;npc:string;motif:MotifId;variant:number;by:'npc'|'player';day:number;memory?:string;/** T18: câu thoại đã chọn và câu điểm nhấn kèm theo */line?:string;quirk?:string;
 /** H5: câu ghép từ bộ sinh hội thoại (người có mảnh riêng); trả lời bằng lựa chọn thái độ × hành động */talk?:TalkLine}
/** Câu ghép đã chốt lúc mở chuyện (lưu nguyên câu để giao diện và lựa chọn ổn định). */
export interface TalkLine{text:string;intent:Intent;prints:string[];gift?:[string,number]}
export interface LogEntry{day:number;npc:string;motif:MotifId;variant:number;by:'npc'|'player'}
export interface StoryState{version:1;seq:number;log:LogEntry[];memories:Memory[];hooks:Hook[];loans:Loan[];pending?:PendingEvent;/** T18: các câu gần nhất đã nói với từng người (gồm câu điểm nhấn) để không lặp trong 10 câu */heard?:Record<string,string[]>}
export const storyOf=(s:GameState):StoryState=>s.story??{version:1,seq:0,log:[],memories:[],hooks:[],loans:[]};

type Effect={debt?:'extend'|'half'|'forgive'|'demand';minutes?:number;money?:number;bonusMoney?:number;relation?:number;mood?:number;stress?:number;energy?:number;fullness?:number;xp?:[SkillId,number];learn?:RecipeId;gift?:[IngredientId,number];/** Mẹ gửi kiện quà ra bến xe */parcel?:boolean;loan?:number};
interface Option{label:string;tag:string;need?:[SkillId,number];needMoney?:number;effect:Effect;result:string}
interface Ctx{s:GameState;npc:NpcProfile;score:number;variant:number;memory?:Memory;self:string;you:string;Self:string;/** người chơi tự xưng */me:string}
interface Motif{id:MotifId;name:string;by:('npc'|'player')[];variants:number;eligible:(c:Omit<Ctx,'variant'>)=>boolean;line:(c:Ctx)=>string;options:(c:Ctx)=>Option[];memory?:(c:Ctx,tag:string)=>{topic:string;weight:number}|null;hook?:(c:Ctx,tag:string)=>{motif:MotifId;after:[number,number]}|null}
const cap=(t:string)=>t.charAt(0).toUpperCase()+t.slice(1);
const SELLER_GIFT:Record<string,IngredientId>={veg:'vegetable',meat:'pork',grocery:'egg',banhmi:'rice'};
const SELLERS=['veg','meat','grocery','banhmi'];
const LOAN_SIZES=[200000,500000,1000000];
const FAVORS=['xách đồ','trông quầy','sửa điện thoại'];
const hasMemory=(s:GameState,npc:string,min=2)=>storyOf(s).memories.some(m=>m.npc===npc&&m.weight>=min);
const recentlyDone=(s:GameState,npc:string,motif:MotifId,days=REPEAT_DAYS)=>storyOf(s).log.some(l=>l.npc===npc&&l.motif===motif&&s.day-l.day<days);
const minute=(s:GameState)=>clockOf(s).minute;

export const MOTIFS:Motif[]=[
 {id:'greet',name:'Hỏi thăm',by:['npc','player'],variants:3,eligible:c=>!c.npc.remote,
  line:c=>[`${cap(c.self)} chào ${c.you}. Dạo này ${c.you} khoẻ không?`,`Ủa ${c.you} ra đây hả, hôm nay có gì vui không?`,`Trời hôm nay dễ chịu ghê. ${cap(c.you)} ăn gì chưa?`][c.variant]!,
  options:c=>[{label:'Hỏi thăm lại',tag:'warm',effect:{minutes:5,relation:3},result:`${c.npc.name} vui hẳn, kể vài chuyện vặt.`},{label:'Kể chuyện của mình',tag:'share',effect:{minutes:10,relation:2,mood:2},result:'Kể xong thấy nhẹ người.'},{label:'Chào nhanh rồi đi',tag:'brief',effect:{relation:1},result:'Hai người chào nhau rồi ai lo việc nấy.'}]},
 {id:'favor',name:'Nhờ giúp',by:['npc'],variants:3,eligible:c=>!c.npc.remote&&!!c.npc.story&&!recentlyDone(c.s,c.npc.id,'favor'),
  line:c=>[`${cap(c.you)} ơi, phụ ${c.self} xách mấy túi này một đoạn với, nặng quá.`,`Trông giúp ${c.self} chỗ này một lát nha, ${c.self} chạy đi có việc.`,`Cái điện thoại của ${c.self} cứ treo hoài, ${c.you} biết sửa không?`][c.variant]!,
  options:c=>c.variant===2?[{label:'Để xem thử',tag:'help',need:['programming',2],effect:{minutes:20,relation:5,xp:['programming',10]},result:'Máy chạy lại ngon lành.'},{label:'Chỉ cách khởi động lại',tag:'partial',effect:{minutes:5,relation:2},result:'Tạm ổn, chắc vài hôm lại treo.'},{label:`${cap(c.me)} không rành lắm`,tag:'refuse',effect:{},result:`${c.npc.name} gật đầu, cất máy đi.`}]
   :[{label:'Giúp tới nơi',tag:'help',effect:{minutes:c.variant===1?30:20,relation:5,energy:-5},result:`${c.npc.name} cảm ơn mãi.`},{label:'Giúp một lát thôi',tag:'partial',effect:{minutes:10,relation:2},result:'Giúp được một phần, phần còn lại họ tự lo.'},{label:'Đang vội, xin lỗi',tag:'refuse',effect:{},result:`${c.npc.name} bảo không sao.`},{label:'Giả vờ không nghe',tag:'dodge',effect:{relation:-2},result:`${c.npc.name} nhìn theo, không nói gì.`}],
  memory:(c,tag)=>({topic:FAVORS[c.variant]!,weight:tag==='dodge'?3:tag==='refuse'?2:3}),hook:()=>({motif:'return',after:[3,15]})},
 {id:'return',name:'Gặp lại',by:['npc','player'],variants:1,eligible:c=>!c.npc.remote&&storyOf(c.s).hooks.some(h=>h.npc===c.npc.id&&h.motif==='return'&&c.s.day>=h.from&&c.s.day<=h.to),
  line:c=>{const m=c.memory,ago=m?agoText(c.s.day-m.day):'hôm trước';return m&&(m.tag==='help'||m.tag==='partial')?`${cap(ago)} ${c.you} ${m.topic} giúp ${c.self}, ${c.self} vẫn nhớ đó. Cầm chút quà nè.`:`${cap(ago)} ${c.self} nhờ mà ${c.you} bận. Thôi không sao, ${c.self} không để bụng đâu.`},
  options:c=>{const good=c.memory&&(c.memory.tag==='help'||c.memory.tag==='partial'),g=SELLER_GIFT[c.npc.id];return good?[{label:'Nhận và cảm ơn',tag:'accept',effect:{relation:4,...(g?{gift:[g,2] as [IngredientId,number]}:{mood:6})},result:g?'Bạn nhận quà, kho có thêm đồ tươi.':'Một lời cảm ơn làm bạn vui cả buổi.'},{label:'Khiêm tốn từ chối quà',tag:'humble',effect:{relation:2},result:`${c.npc.name} cười, bảo lần sau nhất định phải nhận.`},{label:'Hẹn lần sau giúp tiếp',tag:'promise',effect:{relation:3},result:'Hai người hẹn nhau như người quen lâu năm.'}]
   :[{label:`Xin lỗi, lần này để ${c.me} giúp`,tag:'amend',effect:{minutes:15,relation:3},result:`${c.npc.name} vui ra mặt.`},{label:'Giải thích hôm đó bận thật',tag:'explain',effect:{relation:1},result:'Không khí dịu đi một chút.'},{label:'Cười trừ',tag:'shrug',effect:{relation:-1},result:'Câu chuyện dừng ở đó.'}]},
  memory:()=>({topic:'gặp lại',weight:1})},
 {id:'meal',name:'Rủ đi ăn',by:['npc','player'],variants:2,eligible:c=>!c.npc.remote&&c.score>=10&&((minute(c.s)>=660&&minute(c.s)<=810)||(minute(c.s)>=1080&&minute(c.s)<=1230)),
  line:c=>[`Đi ăn với ${c.self} không? Quán đầu hẻm ngon lắm.`,`Tới giờ ăn rồi, ${c.you} đi chung với ${c.self} cho vui.`][c.variant]!,
  options:c=>[{label:'Đi luôn',tag:'go',needMoney:40000,effect:{minutes:45,money:-40000,relation:5,mood:5,fullness:40},result:'Bữa ăn vui, nói đủ chuyện trên trời dưới đất.'},{label:`Để ${c.me} mời`,tag:'treat',needMoney:80000,effect:{minutes:45,money:-80000,relation:5,mood:6,fullness:40},result:`${c.npc.name} ngại nhưng vui lắm.`},{label:'Hẹn hôm khác',tag:'later',effect:{},result:'Hẹn lần sau.'},{label:`${cap(c.me)} ăn rồi`,tag:'refuse',effect:{relation:-1},result:`${c.npc.name} đi một mình.`}],
  memory:(c,tag)=>tag==='go'||tag==='treat'?{topic:'đi ăn chung',weight:2}:null},
 {id:'private',name:'Chuyện riêng',by:['npc','player'],variants:1,eligible:c=>!c.npc.remote&&!!c.npc.story&&c.score>=30&&hasMemory(c.s,c.npc.id)&&!recentlyDone(c.s,c.npc.id,'private'),
  line:c=>`Nói thật với ${c.you}, dạo này ${c.self} cứ lo chuyện ${c.npc.fear.toLowerCase()}.`,
  options:c=>[{label:'Ngồi lắng nghe',tag:'listen',effect:{minutes:30,relation:5},result:`${c.npc.name} nói xong thấy nhẹ lòng.`},{label:'Khuyên vài câu',tag:'advise',need:['communication',3],effect:{minutes:20,relation:5,mood:2},result:'Lời khuyên trúng chỗ, hai người thân hơn hẳn.'},{label:'Pha trò cho vui',tag:'joke',effect:{relation:2},result:`${c.npc.name} bật cười, nhưng vẫn còn tư lự.`},{label:'Đổi chủ đề',tag:'avoid',effect:{relation:-2},result:'Câu chuyện chùng xuống.'}],
  memory:(c,tag)=>tag==='avoid'?null:{topic:'chuyện riêng',weight:4}},
 {id:'loan',name:'Mượn tiền',by:['npc'],variants:3,eligible:c=>!c.npc.remote&&!!c.npc.story&&c.score>=10&&!recentlyDone(c.s,c.npc.id,'loan',21)&&!storyOf(c.s).loans.some(l=>l.npc===c.npc.id&&!l.settled),
  line:c=>`${cap(c.you)} ơi, ${c.self} đang kẹt chút tiền, cho ${c.self} mượn ${(LOAN_SIZES[c.variant]!/1000).toLocaleString('vi-VN')} nghìn được không? Ít bữa ${c.self} gửi lại.`,
  options:c=>{const a=LOAN_SIZES[c.variant]!;return[{label:'Cho mượn đủ',tag:'full',needMoney:a,effect:{money:-a,loan:a,relation:4},result:`${c.npc.name} cảm ơn rối rít, hẹn sẽ trả sớm.`},{label:'Cho mượn một nửa',tag:'half',needMoney:a/2,effect:{money:-a/2,loan:a/2,relation:2},result:'Đỡ được phần nào.'},{label:'Từ chối khéo',tag:'decline',effect:{},result:`${c.npc.name} bảo không sao, để hỏi người khác.`},{label:'Từ chối thẳng',tag:'blunt',effect:{relation:-3},result:'Không khí hơi gượng.'}]},
  memory:(c,tag)=>({topic:'mượn tiền',weight:tag==='full'||tag==='half'?3:2})},
 {id:'recipe',name:'Dạy nấu ăn',by:['npc'],variants:1,eligible:c=>(!!NPC_TEACHES[c.npc.id]&&c.score>=10||c.npc.id==='me')&&!recentlyDone(c.s,c.npc.id,'recipe'),
  line:c=>c.npc.id==='me'?'Mẹ chỉ con cách kho cá cho đậm nha, nhớ ghi lại kẻo quên.':`Món này dễ lắm, để ${c.self} chỉ ${c.you} cách nấu cho ngon.`,
  options:c=>[{label:'Ghi lại cẩn thận',tag:'learn',effect:{minutes:15,xp:['cooking',30],relation:3,...(NPC_TEACHES[c.npc.id]&&!knowsRecipe(c.s,NPC_TEACHES[c.npc.id]!)?{learn:NPC_TEACHES[c.npc.id]}:{}),...(c.npc.id==='veg'?{gift:['vegetable',1] as [IngredientId,number]}:{})},result:NPC_TEACHES[c.npc.id]&&!knowsRecipe(c.s,NPC_TEACHES[c.npc.id]!)?`Sổ công thức có thêm món ${RECIPES[NPC_TEACHES[c.npc.id]!].name}.`:'Sổ tay có thêm một mẹo nấu ăn.'},{label:'Nghe qua thôi',tag:'skim',effect:{minutes:5,xp:['cooking',10],relation:1},result:'Nhớ được đại khái.'},{label:'Để hôm khác',tag:'later',effect:{},result:'Hẹn lần sau học.'}],
  memory:(c,tag)=>tag==='learn'?{topic:'dạy nấu ăn',weight:2}:null},
 {id:'mom',name:'Tin nhắn của Mẹ',by:['npc'],variants:3,eligible:c=>c.npc.id==='me'&&minute(c.s)>=1080&&!recentlyDone(c.s,'me','mom',3),
  line:c=>[`Con ơi, ăn uống đầy đủ không? Đừng thức khuya quá nghe.`,`Mẹ gửi xe khách cho con ít gạo với trứng, mai ra bến xe lấy nha.`,`Ở quê mấy bữa nay mưa suốt. Con trên đó ổn không?`][c.variant]!,
  options:c=>{const gift=c.variant===1?{parcel:true}:{};return[{label:'Gọi lại cho mẹ',tag:'call',effect:{minutes:15,mood:5,stress:-4,relation:4,...gift},result:'Nghe giọng mẹ, bao mệt mỏi như vơi bớt.'},{label:'Nhắn trả lời',tag:'text',effect:{mood:2,relation:2,...gift},result:'Mẹ thả tim tin nhắn.'},{label:'Để lát nữa',tag:'later',effect:{...gift},result:'Tin nhắn nằm đó chưa trả lời.'}]},
  memory:(c,tag)=>tag==='later'?{topic:'chưa trả lời mẹ',weight:2}:null},
 {id:'debt',name:'Khất nợ',by:['npc','player'],variants:1,eligible:c=>!c.npc.remote&&!!unpaidLoan(c.s,c.npc.id)&&!recentlyDone(c.s,c.npc.id,'debt',5),
  line:c=>`Tiền mượn bữa trước, ${c.self} chưa xoay kịp. ${cap(c.you)} cho ${c.self} khất thêm ít bữa được không?`,
  options:c=>[{label:'Cho khất thêm',tag:'extend',effect:{debt:'extend',relation:2},result:`${c.npc.name} cảm ơn, hứa lần này trả đúng hẹn.`},{label:'Bảo trả trước một nửa',tag:'half',effect:{debt:'half'},result:'Nhận lại được một nửa, phần còn lại coi như xong.'},{label:'Thôi, coi như giúp',tag:'forgive',effect:{debt:'forgive',relation:5},result:`${c.npc.name} rưng rưng, nói sẽ không quên.`},{label:'Đòi cho bằng được',tag:'demand',effect:{debt:'demand',relation:-5},result:'Không khí căng thẳng.'}],
  memory:(c,tag)=>tag==='forgive'?{topic:'được xoá nợ',weight:4}:tag==='demand'?{topic:'bị đòi nợ',weight:3}:null},
];
export const motifOf=(id:MotifId)=>MOTIFS.find(m=>m.id===id)!;

function ctxFor(s:GameState,npc:NpcProfile,variant=0,memory?:Memory):Ctx{const a={self:npc.self,you:npc.you};return{s,npc,score:socialOf(s).relations[npc.id]?.score??0,variant,memory,self:a.self,you:a.you,Self:cap(a.self),me:a.you==='bạn'?'mình':a.you}}
function memoryForHook(s:GameState,npc:string):Memory|undefined{const st=storyOf(s),h=st.hooks.find(h=>h.npc===npc&&h.motif==='return'&&s.day>=h.from&&s.day<=h.to);return h?st.memories.find(m=>m.id===h.memory):undefined}
const npcCount=(s:GameState)=>storyOf(s).log.filter(l=>l.day===s.day&&l.by==='npc').length;

/** Chọn mô-típ cho một người theo seed; ưu tiên gặp lại khi có móc tới hạn. */
function pickMotif(s:GameState,npc:NpcProfile,by:'npc'|'player',salt:string):{motif:Motif;variant:number;memory?:Memory}|null{const base=ctxFor(s,npc);
 const due=MOTIFS.find(m=>m.id==='return'&&m.by.includes(by)&&m.eligible(base));if(due)return{motif:due,variant:0,memory:memoryForHook(s,npc.id)};
 const list=MOTIFS.filter(m=>m.id!=='return'&&m.by.includes(by)&&m.eligible(base)&&!(by==='npc'&&m.id==='meal'&&recentlyDone(s,npc.id,'meal')));if(!list.length)return null;
 const prefer=by==='player'?(list.filter(m=>m.id==='debt').length?list.filter(m=>m.id==='debt'):list.filter(m=>m.id==='private')):[];const base0=prefer.length?prefer:by==='player'?list.filter(m=>m.id==='greet'):list;/* gần mốc Thân, Tri kỷ: NPC dễ tự bắt chuyện bằng việc có chủ đích */const deep=by==='npc'&&nearTier(base.score)?list.filter(m=>NEAR_DEEP.includes(m.id)):[];const pool=deep.length&&hash(`near:${salt}:${s.day}:${npc.id}`)%100<NEAR_BOOST?deep:base0;if(!pool.length)return null;
 const h=hash(`${salt}:${s.day}:${npc.id}`),motif=pool[h%pool.length]!;const last=storyOf(s).log.filter(l=>l.npc===npc.id&&l.motif===motif.id).pop();let variant=(h>>>8)%motif.variants;if(last&&motif.variants>1&&last.variant===variant)variant=(variant+1)%motif.variants;return{motif,variant}}

/** Ý định câu thoại của một mô-típ (T18). */
function intentOf(m:MotifId,variant:number,npc:string,memory?:Memory){switch(m){case'greet':return memory?`${REFUSE.includes(memory.tag)?'cb-refuse':'cb'}:${memory.topic}`:'greet';case'favor':return`favor${variant}`;case'return':return memory&&!REFUSE.includes(memory.tag)?'return-good':'return-bad';case'recipe':return`recipe:${npc}`;case'mom':return`mom${variant}`;default:return m}}
/** Ký ức để nhắc khi hỏi thăm (T41): nặng nhất, còn nhớ, chưa nhắc trong 7 ngày; mỗi lần gặp tối đa một lần. */
function callbackMemory(s:GameState,npc:string){const hooked=new Set(storyOf(s).hooks.map(h=>h.memory));return storyOf(s).memories.filter(m=>m.npc===npc&&!hooked.has(m.id)&&m.weight>=2&&s.day-m.day>=1&&(m.recalled===undefined||s.day-m.recalled>=RECALL_GAP)&&intentsWithLines.has(`${REFUSE.includes(m.tag)?'cb-refuse':'cb'}:${m.topic}`)).sort((a,b)=>b.weight-a.weight||b.day-a.day)[0]}
function open(s:GameState,npc:NpcProfile,pick:{motif:Motif;variant:number;memory?:Memory},by:'npc'|'player'):GameState{const st=storyOf(s),seq=st.seq+1,key=`${s.day}:${seq}`,heard=st.heard?.[npc.id]??[],score=socialOf(s).relations[npc.id]?.score??0,voice=npc.voiceKey;
 let memory=pick.memory??(pick.motif.id==='greet'?callbackMemory(s,npc.id):undefined);let line=chooseLine(intentOf(pick.motif.id,pick.variant,npc.id,memory),voice,score,heard,hash(`line:${key}:${npc.id}`));
 /* gần mốc bậc: chào hỏi thường đổi thành câu than nhẹ (mỗi câu một lần trong 16 câu gần nhất) */
 if(pick.motif.id==='greet'&&!memory&&nearTier(score)){const h=chooseLine(`hint:${npc.fear}`,voice,score,heard,hash(`hint:${key}:${npc.id}`));if(h&&!heard.includes(h.id))line=h}
 if(!pick.memory&&memory&&line&&heard.includes(line.id)){memory=undefined;line=chooseLine('greet',voice,score,heard,hash(`line:${key}:${npc.id}`))}
 const quirk=pick.motif.id==='greet'&&!memory&&hash(`quirk:${key}`)%100<30?(chooseLine(`quirk:${npc.id}`,voice,score,heard,hash(`q:${key}`))??chooseLine(`quirk:${npc.quirk}`,voice,score,heard,hash(`q:${key}`))):undefined;
 /* H5: hỏi thăm thường của người có mảnh riêng thì ghép câu theo dữ kiện thật; câu gợi ý gần mốc và câu nhắc ký ức giữ như cũ */
 const hinted=!!line&&line.id.startsWith('hint:');let talk:TalkLine|undefined;
 if(pick.motif.id==='greet'&&!memory&&!hinted&&hasOwnLines(npc.id)){const said=sayNow(s,npc,'face',`talk:${key}:${npc.id}`);if(said?.intent)talk={text:said.text,intent:said.intent,prints:said.prints,...(said.gift?{gift:said.gift}:{})}}
 return{...s,story:{...st,seq,pending:{key,npc:npc.id,motif:pick.motif.id,variant:pick.variant,by,day:s.day,...(memory?{memory:memory.id}:{}),...(talk?{talk}:{}),...(line&&!talk?{line:line.id}:{}),...(quirk&&!talk?{quirk:quirk.id}:{})},log:[...st.log,{day:s.day,npc:npc.id,motif:pick.motif.id,variant:pick.variant,by}].slice(-300)}}}

/** NPC tự bắt chuyện khi người chơi đến nơi hoặc vừa làm xong việc (tối đa 3 lần mỗi ngày). */
export function maybeStart(s:GameState,trigger:string):GameState{{const ap=dueAppointment(s);if(ap&&!storyOf(s).pending&&!s.work?.active){const npc=castById(s,ap.npc);if(npc)return open(markAppointment(s,ap.id,'done'),npc,{motif:motifOf('meal'),variant:0},'player')}}const st=storyOf(s);if(st.pending||s.work?.active||s.fishing?.atLake||s.office?.application?.status==='interview'||npcCount(s)>=NPC_DAILY_LIMIT)return s;const c=clockOf(s);if(c.minute+30>END)return s;if(weatherOf(s.day)==='storm'&&OUTDOOR.includes(c.location))return s;
 const here=rosterOf(s).filter(n=>n.story&&presentAt(n,s.day,c.minute,c.location)&&inReach(s,n,c.location)),candidates=[...here];const roll=hash(`start:${s.day}:${c.minute}:${c.location}:${trigger}:${st.seq}`)%100;
 const due=here.find(n=>pickMotif(s,n,'npc','due')?.motif.id==='return');if(due){const p=pickMotif(s,due,'npc','due')!;return open(s,due,p,'npc')}
 const near=here.some(n=>nearTier(socialOf(s).relations[n.id]?.score??0));if(roll>=(near?65:40))return s;const order=[...candidates].sort((a,b)=>hash(`${s.day}:${a.id}:${roll}`)-hash(`${s.day}:${b.id}:${roll}`));
 for(const n of order){const p=pickMotif(s,n,'npc',`npc:${trigger}:${c.minute}`);if(p)return open(s,n,p,'npc')}return s}

/** Người chơi chủ động nói chuyện hoặc rủ đi ăn với người đang ở đây. */
export function startTalk(s:GameState,id:string,kind:'talk'|'meal'='talk'):GameResult{const npc=castById(s,id),c=clockOf(s);if(!npc||npc.remote)return{ok:false,error:'Không tìm thấy người này.'};if(storyOf(s).pending)return{ok:false,error:'Hãy trả lời câu chuyện đang dở.'};if(s.work?.active)return{ok:false,error:'Không trò chuyện trong ca làm.'};
 if(!presentAt(npc,s.day,c.minute,c.location)||!inReach(s,npc,c.location))return{ok:false,error:`${npc.name} không còn ở đây.`};const rel=socialOf(s).relations[id];if(rel&&rel.lastDay===s.day&&c.minute-rel.minutes<PLAYER_COOLDOWN)return{ok:false,error:'Đợi một lát rồi nói chuyện tiếp.'};if(c.minute+15>END)return{ok:false,error:'Đã muộn rồi.'};
 if(kind==='meal'){const m=motifOf('meal');if(!m.eligible(ctxFor(s,npc)))return{ok:false,error:(socialOf(s).relations[id]?.score??0)<10?'Cần quen biết hơn mới rủ đi ăn.':'Chưa tới giờ ăn.'};return{ok:true,state:open(s,npc,{motif:m,variant:0},'player')}}
 const p=pickMotif(s,npc,'player',`player:${c.minute}`);if(!p)return{ok:false,error:'Lúc này không tiện nói chuyện.'};return{ok:true,state:open(s,npc,p,'player')}}

/** Dữ liệu để giao diện hiện câu chuyện đang mở. Lựa chọn không kèm hệ quả. */
export function openEvent(s:GameState){const p=storyOf(s).pending;if(!p)return null;const npc=castById(s,p.npc),m=motifOf(p.motif);if(!npc)return null;
 if(p.talk){const opts=buildReplies(replyCtxOf(s,npc,p.talk.intent,p.key,p.talk.gift));return{npc,motif:'Trò chuyện',line:p.talk.text,recall:undefined as string|undefined,options:opts.map(o=>({label:o.label,locked:o.locked,need:o.locked?o.need??(s.money<o.money?'Không đủ tiền':s.energy<o.energy?'Không đủ sức':'Không đủ giờ'):undefined}))}}const mem=p.memory?storyOf(s).memories.find(x=>x.id===p.memory):undefined,c=ctxFor(s,npc,p.variant,mem),k=s.skills;
 const loan=unpaidLoan(s,npc.id)??storyOf(s).loans.slice().reverse().find(l=>l.npc===npc.id),text=(id?:string)=>{const l=id?lineById(id):undefined;return l?fill(l.text,{self:c.self,you:c.you,ago:mem?agoText(s.day-mem.day):'hôm trước',topic:mem?.topic,fear:npc.fear.toLowerCase(),amount:`${((p.motif==='loan'?[200000,500000,1000000][p.variant]:loan?.amount)??0)/1000} nghìn`}):undefined};
 return{npc,motif:m.name,line:[text(p.line)??m.line(c),text(p.quirk)].filter(Boolean).join(' '),recall:mem?`${cap(agoText(s.day-mem.day))}: ${mem.topic}`:undefined,options:m.options(c).map(o=>{const lack=o.need&&(k?.[o.need[0]]?.level??1)<o.need[1],poor=o.needMoney!==undefined&&s.money<o.needMoney;return{label:o.label,locked:!!(lack||poor),need:lack?`${SKILLS[o.need![0]]} Lv${o.need![1]}`:poor?'Không đủ tiền':undefined}})}}

/** Trả lời câu chuyện: áp hệ quả, ghi ký ức, móc tiếp nối, khoản cho mượn và Nhật ký. */
export function answerEvent(s:GameState,choice:number):GameResult&{text?:string}{const st=storyOf(s),p=st.pending;if(!p)return{ok:false,error:'Không có câu chuyện nào đang mở.'};if(p.talk)return answerTalk(s,p,p.talk,choice);const npc=castById(s,p.npc)!,m=motifOf(p.motif),mem=p.memory?st.memories.find(x=>x.id===p.memory):undefined,c=ctxFor(s,npc,p.variant,mem),o=Number.isInteger(choice)?m.options(c)[choice]:undefined;if(!o)return{ok:false,error:'Lựa chọn không hợp lệ.'};
 if(o.need&&(s.skills?.[o.need[0]]?.level??1)<o.need[1])return{ok:false,error:`Cần ${SKILLS[o.need[0]]} Lv${o.need[1]}.`};if(o.needMoney!==undefined&&s.money<o.needMoney)return{ok:false,error:'Không đủ tiền.'};
 let n:GameState=structuredClone(s);const e=o.effect,clamp=(v:number)=>Math.max(0,Math.min(100,v));
 if(e.minutes&&clockOf(n).minute+e.minutes<END){const r=spendTime(n,e.minutes);if(r.ok)n=r.state}
 if(e.money&&post(n,{id:`story:${p.key}`,name:e.loan?`Cho ${npc.name} mượn`:`Chi cùng ${npc.name}`,amount:e.money})!=='ok')return{ok:false,error:'Không đủ tiền.'};
 if(e.mood)n.mood=clamp(n.mood+e.mood);if(e.stress)n.stress=clamp(n.stress+e.stress);if(e.energy)n.energy=clamp(n.energy+e.energy);if(e.fullness)n.fullness=clamp((n.fullness??70)+e.fullness);
 if(e.relation)n=adjustRelation(n,npc.id,e.relation,true,m.id==='greet');else n=adjustRelation(n,npc.id,0);if(e.xp)n=addWorkXp(n,e.xp[0],e.xp[1]);if(e.gift)n=giftIngredient(n,e.gift[0],e.gift[1]);if(e.parcel)n=sendParcel(n,npc.id,MOM_PARCEL,`story:${p.key}`);if(e.learn)n=learnRecipe(n,e.learn,npc.id,npc.name);
 const ns:StoryState=structuredClone(storyOf(n));delete ns.pending;{const h=ns.heard?.[npc.id]??[];ns.heard={...ns.heard,[npc.id]:[...h,...[p.line,p.quirk].filter((x):x is string=>!!x)].slice(-HEARD_KEEP)}}
 if(e.debt){const l=ns.loans.find(x=>x.npc===npc.id&&x.settled==='unpaid'&&!x.resolved);if(l){if(e.debt==='extend'){delete l.settled;l.due=s.day+7;l.repay=hash(`extend:${p.key}`)%100>=30}else{l.resolved=true;const back=e.debt==='half'?Math.floor(l.amount/2):e.debt==='demand'&&hash(`demand:${p.key}`)%2===0?l.amount:0;if(back)post(n,{id:`debt-back:${l.id}:${p.key}`,name:`${npc.name} trả nợ`,amount:back})}}}
 if(mem){ns.memories=ns.memories.map(y=>y.id===mem.id?reinforce(y,s.day):y);ns.hooks=ns.hooks.filter(h=>!(h.npc===npc.id&&h.memory===mem.id))}
 const mm=m.memory?.(c,o.tag);let memId:string|undefined;if(mm&&mm.weight>=FORGET.minWeight){memId=`m${ns.seq}`;ns.memories=[...ns.memories,{id:memId,day:s.day,npc:npc.id,motif:m.id,topic:mm.topic,tag:o.tag,weight:mm.weight}];if(ns.memories.length>200){const drop=ns.memories.filter(x=>x.weight<4).sort((a,b)=>a.weight-b.weight||a.day-b.day)[0];if(drop)ns.memories=ns.memories.filter(x=>x!==drop)}}
 const hk=memId&&m.hook?.(c,o.tag);if(hk&&memId){const span=hk.after[1]-hk.after[0],from=s.day+hk.after[0]+hash(`hook:${p.key}`)%(span+1);ns.hooks=[...ns.hooks,{npc:npc.id,motif:hk.motif,from,to:from+10,memory:memId}]}
 if(e.loan){const risky=['liều','hay quên','vội vàng'].filter(t=>npc.traits.includes(t)).length,safe=['giữ chữ tín','thật thà','cẩn thận'].filter(t=>npc.traits.includes(t)).length,risk=Math.max(5,Math.min(40,LOAN_BASE_RISK+15*risky-15*safe));ns.loans=[...ns.loans,{id:`loan${ns.seq}`,npc:npc.id,amount:e.loan,due:s.day+7+hash(`due:${p.key}`)%8,repay:hash(`repay:${p.key}`)%100>=risk}]}
 if(e.bonusMoney)post(n,{id:`story-gift:${p.key}`,name:`Quà của ${npc.name}`,amount:e.bonusMoney});
 n={...n,story:ns};n=recordJournal(n,`story:${p.key}`,`${npc.name}: ${m.name}`,`${o.label}. ${o.result}`,npc.id);return{ok:true,state:n,text:o.result}}

/** H5: trả lời câu ghép bằng một lựa chọn thái độ × hành động; hậu quả theo tính cách NPC (resolveReply), không hiện trước. */
function answerTalk(s:GameState,p:PendingEvent,t:TalkLine,choice:number):GameResult&{text?:string}{const npc=castById(s,p.npc);if(!npc)return{ok:false,error:'Không tìm thấy người này.'};
 const rc=replyCtxOf(s,npc,t.intent,p.key,t.gift),opts=buildReplies(rc),o=Number.isInteger(choice)?opts[choice]:undefined;if(!o)return{ok:false,error:'Lựa chọn không hợp lệ.'};if(o.locked)return{ok:false,error:o.need?`Cần ${o.need}.`:'Lúc này chưa làm được.'};
 const r=resolveReply(rc,o);let n:GameState=structuredClone(s);
 if(r.minutes&&clockOf(n).minute+r.minutes<END){const x=spendTime(n,r.minutes);if(x.ok)n=x.state}
 if(r.fee&&post(n,{id:`talk:${p.key}`,name:`Chi cùng ${npc.name}`,amount:-r.fee})!=='ok')return{ok:false,error:'Không đủ tiền.'};
 if(r.energy)n.energy=Math.max(0,n.energy-r.energy);
 n=adjustRelation(n,npc.id,r.relation,true,r.light);if(r.gift)n=receiveGift(n,r.gift[0],r.gift[1]);
 const ns:StoryState=structuredClone(storyOf(n));delete ns.pending;
 if(r.memory&&r.memory.weight>=FORGET.minWeight){ns.memories=[...ns.memories,{id:`m${ns.seq}`,day:s.day,npc:npc.id,motif:'greet',topic:r.memory.topic,tag:r.memory.tag,weight:r.memory.weight}];if(ns.memories.length>200){const drop=ns.memories.filter(x=>x.weight<4).sort((a,b)=>a.weight-b.weight||a.day-b.day)[0];if(drop)ns.memories=ns.memories.filter(x=>x!==drop)}}
 n={...n,story:ns};n=noteReplyFor(n,{d:s.day,n:npc.id,a:o.attitude,x:o.action});n=notePrintsFor(n,npc.id,[...t.prints,setPrint(npc.id,opts)]);
 const text=r.gift?`Nhận ${giftText([r.gift])} của ${npc.name}.`:r.relation>=3?`${npc.name} vui hẳn.`:r.relation>0?`${npc.name} gật gù.`:r.relation<0?`${npc.name} hơi phật ý.`:'Hai người chào nhau rồi ai lo việc nấy.';
 n=recordJournal(n,`story:${p.key}`,`${npc.name}: Trò chuyện`,`${o.label}. ${text}`,npc.id);return{ok:true,state:n,text}}

/** Qua ngày: trả hoặc quỵt nợ khi tới hạn, hao mòn quan hệ khi lâu không gặp (có sàn theo bậc đã đạt), dọn dữ liệu cũ. */
export function settleStory(prev:GameState,next:GameState):GameState{let n=next;const st=structuredClone(storyOf(n));
 for(const l of st.loans){if(l.settled||n.day<l.due)continue;const npc=castById(n,l.npc)!;if(l.repay){l.settled='paid';post(n,{id:`loan-back:${l.id}`,name:`${npc.name} trả tiền mượn`,amount:l.amount});n=adjustRelation(n,l.npc,3,false);n=recordJournal(n,`loan-back:${l.id}`,`${npc.name} trả tiền`,`${npc.name} trả lại ${(l.amount/1000).toLocaleString('vi-VN')} nghìn như đã hẹn.`,l.npc)}else{l.settled='unpaid';st.memories.push({id:`m-loan-${l.id}`,day:n.day,npc:l.npc,motif:'loan',topic:'chưa trả tiền mượn',tag:'unpaid',weight:3});n=recordJournal(n,`loan-late:${l.id}`,`${npc.name} chưa trả tiền`,`Đã quá hẹn mà ${npc.name} chưa trả khoản mượn.`,l.npc)}}
 const rel=socialOf(n).relations,peak=socialOf(n).peak??{};for(const [id,r] of Object.entries(rel)){const away=n.day-r.lastDay;if(away>0&&away%7===0){const floor=tierFloor(peak[id]??r.score);if(r.score>floor)n=adjustRelation(n,id,-1,false)}}
 st.log=st.log.filter(l=>n.day-l.day<=60);st.memories=forgetMemories(st.memories,n.day,id=>castById(n,id)?.traits??[],m=>st.hooks.some(h=>h.memory===m.id));st.hooks=st.hooks.filter(h=>h.to>=n.day);st.loans=st.loans.filter(l=>!l.settled||n.day-l.due<=60);
 void prev;delete st.pending;return{...n,story:st}}

const MOTIF_IDS=MOTIFS.map(m=>m.id) as string[];
const validTalkLine=(t:TalkLine)=>!!t&&typeof t.text==='string'&&t.text.length>0&&t.text.length<400&&INTENTS.includes(t.intent)&&Array.isArray(t.prints)&&t.prints.length<=12&&t.prints.every(x=>typeof x==='string'&&x.length<200)&&(t.gift===undefined||(Array.isArray(t.gift)&&isGiftItem(t.gift[0])&&Number.isInteger(t.gift[1])&&t.gift[1]>=1&&t.gift[1]<=GIFT_MAX));
export function validStory(v:unknown,day:number):v is StoryState{if(!v||typeof v!=='object')return false;const s=v as StoryState,id=isNpcId,d=(x:unknown,max=day+40)=>Number.isInteger(x)&&(x as number)>=0&&(x as number)<=max;
 if(s.version!==1||!Number.isInteger(s.seq)||s.seq<0||!Array.isArray(s.log)||s.log.length>300||!Array.isArray(s.memories)||s.memories.length>220||!Array.isArray(s.hooks)||s.hooks.length>100||!Array.isArray(s.loans)||s.loans.length>100)return false;
 if(!s.log.every(l=>l&&d(l.day,day)&&id(l.npc)&&MOTIF_IDS.includes(l.motif)&&Number.isInteger(l.variant)&&['npc','player'].includes(l.by)))return false;
 if(!s.memories.every(m=>m&&typeof m.id==='string'&&d(m.day,day)&&id(m.npc)&&MOTIF_IDS.includes(m.motif)&&typeof m.topic==='string'&&m.topic.length<80&&typeof m.tag==='string'&&Number.isInteger(m.weight)&&m.weight>=1&&m.weight<=5&&(m.at===undefined||d(m.at,day))))return false;
 if(!s.hooks.every(h=>h&&id(h.npc)&&MOTIF_IDS.includes(h.motif)&&d(h.from)&&d(h.to)&&h.from<=h.to&&typeof h.memory==='string'))return false;
 if(!s.loans.every(l=>l&&typeof l.id==='string'&&id(l.npc)&&Number.isSafeInteger(l.amount)&&l.amount>0&&l.amount<=1e7&&d(l.due)&&typeof l.repay==='boolean'&&(l.settled===undefined||['paid','unpaid'].includes(l.settled))&&(l.resolved===undefined||typeof l.resolved==='boolean')))return false;
 if(s.heard!==undefined&&!(s.heard&&typeof s.heard==='object'&&Object.entries(s.heard).every(([k,v])=>id(k)&&Array.isArray(v)&&v.length<=HEARD_KEEP&&v.every(x=>typeof x==='string'&&!!lineById(x)))))return false;
 if(s.pending!==undefined){const p=s.pending;if(!p||typeof p.key!=='string'||(p.line!==undefined&&!lineById(p.line))||(p.quirk!==undefined&&!lineById(p.quirk))||(p.talk!==undefined&&!validTalkLine(p.talk))||!id(p.npc)||!MOTIF_IDS.includes(p.motif)||!Number.isInteger(p.variant)||p.variant<0||p.variant>=motifOf(p.motif).variants||!['npc','player'].includes(p.by)||!d(p.day,day))return false}
 return true}
export const placeHasStory=(s:GameState,place:PlaceId)=>rosterOf(s).some(n=>n.story&&presentAt(n,s.day,clockOf(s).minute,place)&&inReach(s,n,place));
/** Rủ đi ăn được không lúc này (cho giao diện làm mờ nút). */
export function mealOpen(s:GameState,id:string){const npc=castById(s,id);return!!npc&&motifOf('meal').eligible(ctxFor(s,npc))}
