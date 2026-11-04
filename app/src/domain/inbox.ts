/** T20: tin nhắn và cuộc gọi trên điện thoại (chốt 04/11).
 * Nhắn tin không tốn giờ; gọi điện tốn 15 phút. Mỗi ngày tối đa 2 tin từ NPC, không tính vào 3 lần bắt chuyện trực tiếp.
 * Nhận lời đi ăn qua tin nhắn thì có hẹn: đến đúng nơi đúng giờ mới diễn ra và cộng điểm; lỡ hẹn thì mất điểm và người đó nhớ. */
import type {GameState,GameResult,PlaceId} from './types';
import {castById,NPCS,presentAt,ADDRESS} from './npc';
import {VOICE} from './lines';
import {socialOf,adjustRelation} from './social';
import {clockOf,spendTime,END} from './time';
import {recordJournal} from './journal';
import {giftIngredient,nextMomRecipe,learnRecipe,RECIPES,type RecipeId} from './life';
import {addWorkXp} from './study';
import {places} from './places';
import {dateAt} from './format';
import {hash} from './shift';
import {storyOf} from './director';

export type MsgKind='mom-care'|'mom-gift'|'mom-recipe'|'invite'|'checkin'|'rent'|'missed'|'note';
export interface Msg{id:string;day:number;minute:number;from:'npc'|'me';text:string;kind:MsgKind;replies?:string[];answered?:number;read?:boolean;recipe?:RecipeId;appt?:{day:number;minute:number;place:PlaceId}}
export interface Queued extends Msg{npc:string}
export interface Appointment{id:string;npc:string;day:number;minute:number;place:PlaceId;status:'set'|'done'|'missed'}
export interface InboxState{version:1;seq:number;threads:Record<string,Msg[]>;queue:Queued[];appts:Appointment[];called:Record<string,number>;hello:Record<string,number>}
export const DAILY_MESSAGES=2,CALL_MINUTES=15,MISSED_PENALTY=-5,APPT_EARLY=30,APPT_LATE=60;
export const inboxOf=(s:GameState):InboxState=>s.inbox??{version:1,seq:0,threads:{},queue:[],appts:[],called:{},hello:{}};
const scoreOf=(s:GameState,id:string)=>socialOf(s).relations[id]?.score??0;
const placeName=(p:PlaceId)=>places.find(x=>x.id===p)?.name??p;
const hhmm=(m:number)=>`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`;
const MOM_RECIPE_TEXT:Record<RecipeId,string>={eggRice:'',canhChua:'Mẹ chỉ con nấu canh chua cá: nêm chua ngọt vừa miệng, bỏ rau sau cùng cho xanh.',porkRice:'Mẹ chỉ con cơm thịt rau: xào thịt trước, rau cho sau, đừng để nhừ.',fishRice:'Mẹ chỉ con kho cá: ướp nửa tiếng, kho lửa nhỏ cho thấm.',tofuRice:'Mẹ chỉ con món đậu rau: chiên đậu vàng rồi xào với rau.'};
const WEEKDAY=['Chủ nhật','thứ Hai','thứ Ba','thứ Tư','thứ Năm','thứ Sáu','thứ Bảy'];
const whenText=(today:number,day:number,minute:number)=>`${day===today?'hôm nay':day===today+1?'mai':WEEKDAY[dateAt(day).getUTCDay()]} lúc ${hhmm(minute)}`;


/** Lời nhắn theo vai vế và giọng: người lớn tuổi (bà, chú, cô) nói kiểu người lớn, người chơi đáp có "dạ, ạ"; bạn đồng trang lứa nói kiểu bạn bè. */
type Rank='elder'|'senior'|'peer'|'junior';
const PARTICLE:Record<string,string>={tay:'nghen',bac:'nhé',trung:'nghe',sg:'nha',que:'nghe'};
export function voiceFor(id:string){const a=ADDRESS[id],self=a?.self??'mình',you=a?.you??'bạn';
 const rank:Rank=!a||self==='mình'?'peer':['bà','chú','cô','bác','mẹ'].includes(self)?'elder':self==='em'?'junior':'senior';
 const call=self==='tôi'?'anh':self==='mình'?'bạn':self,me=you==='bạn'?'mình':you,cap=(x:string)=>x.charAt(0).toUpperCase()+x.slice(1);
 return{rank,self,you,call,me,Self:cap(self),Call:cap(call),Me:cap(me),p:PARTICLE[VOICE[id]??'sg']??'nha'}}
const fillV=(id:string,x:string)=>{const v=voiceFor(id) as unknown as Record<string,string>;return x.replace(/\{(self|you|call|me|Self|Call|Me|p)\}/g,(_,k:string)=>v[k]!)};
const say=(id:string,pick:Record<Rank,string>)=>fillV(id,pick[voiceFor(id).rank]);
const sayAll=(id:string,pick:Record<Rank,string[]>)=>pick[voiceFor(id).rank].map(x=>fillV(id,x));
const T={
 invite:(place:string,when:string):Record<Rank,string>=>({elder:`Mai ${when} ra ${place} ăn với {self} một bữa {p} {you}.`,senior:`Mai ${when} {you} rảnh không? {Self} mời {you} ra ${place} ăn {p}.`,peer:`Mai ${when} rảnh không? Đi ăn ở ${place} {p}.`,junior:`Mai ${when} {you} rảnh không? Đi ${place} ăn với em {p}.`}),
 inviteReplies:{elder:['Dạ, {me} tới ạ','Dạ mai {me} bận mất rồi'],senior:['Dạ, {me} tới ạ','Dạ mai {me} bận rồi'],peer:['Được, hẹn nha','Mai bận rồi'],junior:['Ừ, hẹn {you} nhé','Mai {me} bận rồi']} as Record<Rank,string[]>,
 yes:{elder:'Ừ, {self} chờ {p}.',senior:'Ok, mai gặp {you} {p}.',peer:'Ok, gặp nha!',junior:'Dạ, mai gặp {you}!'} as Record<Rank,string>,
 no:{elder:'Ừ, để bữa khác.',senior:'Ừ, để dịp khác {p}.',peer:'Tiếc ghê, để dịp khác.',junior:'Dạ, để dịp khác ạ.'} as Record<Rank,string>,
 checkin:{elder:'Lâu rồi không thấy {you} ghé, dạo này {you} khoẻ không?',senior:'Lâu không gặp, dạo này {you} ổn không?',peer:'Lâu quá không gặp, dạo này khoẻ không?',junior:'Lâu rồi không gặp {you}, dạo này {you} khoẻ không ạ?'} as Record<Rank,string>,
 checkinReplies:{elder:['Dạ {me} khoẻ ạ','Dạ, dạo này {me} bận quá'],senior:['Dạ {me} khoẻ ạ','Dạ, dạo này {me} bận quá'],peer:['Khoẻ, cảm ơn nha','Dạo này bận quá'],junior:['{Me} khoẻ, cảm ơn {you}','Dạo này {me} bận quá']} as Record<Rank,string[]>,
 fine:{elder:'Ừ, vậy là {self} yên tâm.',senior:'Vậy là tốt rồi.',peer:'Vậy là tốt rồi.',junior:'Dạ, vậy là tốt rồi.'} as Record<Rank,string>,
 hello:{elder:'Dạo này {call} khoẻ không ạ?',senior:'Dạo này {call} khoẻ không ạ?',peer:'Dạo này sao rồi?',junior:'Dạo này em sao rồi?'} as Record<Rank,string>,
 helloBack:{elder:['{Self} khoẻ, {you} lo ăn uống đi {p}.','Cũng thường, có {you} hỏi là vui rồi.','Khoẻ, rảnh thì ghé {self} chơi {p}.'],senior:['Ổn {you}, cảm ơn {p}.','Cũng bận, mà vẫn ổn.','Khoẻ, rảnh ghé chơi {p}.'],peer:['Ổn nè, cảm ơn nha.','Cũng bận, mà vẫn vui.','Khoẻ, rảnh ghé chơi.'],junior:['Dạ em ổn, cảm ơn {you}.','Em cũng bận, mà vui ạ.','Dạ khoẻ, rảnh {you} ghé chơi.']} as Record<Rank,string[]>,
 ask:(place:string,when:string):Record<Rank,string>=>({elder:`Mai ${when} {me} mời {call} ra ${place} ăn nhé ạ?`,senior:`Mai ${when} {me} mời {call} ra ${place} ăn nhé ạ?`,peer:`Mai ${when} đi ăn ở ${place} không?`,junior:`Mai ${when} đi ${place} ăn với {me} không?`}),
 missed:{elder:'Hôm qua {self} chờ {you} hoài mà không thấy.',senior:'Hôm qua {self} chờ mãi không thấy {you}.',peer:'Hôm qua chờ hoài không thấy đâu hết.',junior:'Hôm qua em chờ {you} mãi.'} as Record<Rank,string>,
};

/** Ai được gọi điện: Mẹ và người từ bậc Thân. */
export const canCall=(s:GameState,id:string)=>id==='me'||scoreOf(s,id)>=30;
/** Danh bạ: Mẹ và người từ Quen biết (đã cho số). */
export const contactsOf=(s:GameState)=>NPCS.filter(n=>n.id==='me'||scoreOf(s,n.id)>=10).sort((a,b)=>(a.id==='me'?-1:0)-(b.id==='me'?-1:0));
export function unreadCount(s:GameState,id?:string){const t=inboxOf(s).threads;return Object.entries(t).filter(([k])=>!id||k===id).reduce((n,[,msgs])=>n+msgs.filter(m=>m.from==='npc'&&!m.read).length,0)}

/** Lên lịch tin nhắn cho ngày mới (tối đa 2), chọn theo seed. */
function schedule(s:GameState,ib:InboxState):Queued[]{const out:Queued[]=[],day=s.day,mk=(npc:string,minute:number,kind:MsgKind,text:string,replies?:string[],appt?:Msg['appt'])=>out.push({id:`q${day}:${npc}:${kind}`,npc,day,minute,from:'npc',text,kind,...(replies?{replies}:{}),...(appt?{appt}:{})});
 const h=(k:string)=>hash(`inbox:${day}:${k}`);
 if(dateAt(day+2).getUTCDate()===1)mk('ba-tu',480,'rent','Còn hai ngày nữa tới hạn tiền trọ nghen con.',['Dạ con nhớ rồi','Bà cho con khất vài bữa']);
 const lastMom=Math.max(-9,...(ib.threads.me??[]).filter(m=>m.from==='npc').map(m=>m.day));if(day-lastMom>=2&&h('mom')%3!==0){const v=h('momv')%3,teach=nextMomRecipe(s);const kind:MsgKind=v===0?'mom-care':v===1?'mom-gift':teach?'mom-recipe':'mom-care';mk('me',1140+h('momt')%90,kind,kind==='mom-care'?'Con ăn uống đầy đủ không? Đừng thức khuya quá nghe.':kind==='mom-gift'?'Mẹ gửi con ít gạo, nhờ người quen mang tới phòng rồi đó.':MOM_RECIPE_TEXT[teach!],kind==='mom-recipe'?['Con ghi lại rồi','Để con thử nấu']:['Con khoẻ, mẹ yên tâm','Dạ con biết rồi']);if(kind==='mom-recipe')out[out.length-1]!.recipe=teach}
 const close=NPCS.filter(n=>n.story&&!n.remote&&scoreOf(s,n.id)>=30);const dow=dateAt(day).getUTCDay();
 for(const n of close.sort((a,b)=>h(a.id)-h(b.id))){if(out.length>=DAILY_MESSAGES)break;const rel=socialOf(s).relations[n.id]!;
  if((dow===5||dow===6)&&h('inv'+n.id)%3===0){const apDay=day+1,apMin=1110;mk(n.id,600+h('t'+n.id)%300,'invite',say(n.id,T.invite(placeName('streetfood'),hhmm(apMin))),sayAll(n.id,T.inviteReplies),{day:apDay,minute:apMin,place:'streetfood'});continue}
  if(day-rel.lastDay>=5&&h('chk'+n.id)%2===0)mk(n.id,720+h('c'+n.id)%360,'checkin',say(n.id,T.checkin),sayAll(n.id,T.checkinReplies))}
 return out.slice(0,DAILY_MESSAGES)}

/** Chuyển tin đã tới giờ vào hộp thư. Trả về tên người vừa nhắn để báo ngắn. */
export function deliverDue(s:GameState):{state:GameState;from:string[]}{const ib=inboxOf(s),now=clockOf(s).minute,due=ib.queue.filter(q=>q.day<s.day||(q.day===s.day&&q.minute<=now));if(!due.length)return{state:s,from:[]};
 const threads={...ib.threads};for(const q of due){const {npc,...m}=q;threads[npc]=[...(threads[npc]??[]),{...m,id:`m${ib.seq}:${q.id}`}].slice(-40)}
 return{state:{...s,inbox:{...ib,threads,queue:ib.queue.filter(q=>!due.includes(q))}},from:[...new Set(due.map(q=>castById(q.npc)?.name??''))]}}

export function markRead(s:GameState,id:string):GameState{const ib=inboxOf(s),t=ib.threads[id];if(!t||!t.some(m=>!m.read))return s;return{...s,inbox:{...ib,threads:{...ib.threads,[id]:t.map(m=>({...m,read:true}))}}}}

/** Trả lời một tin. Nhận lời đi ăn thì có hẹn. */
export function replyMessage(s:GameState,id:string,msgId:string,choice:number):GameResult{const ib=inboxOf(s),t=ib.threads[id],m=t?.find(x=>x.id===msgId);if(!m||m.from!=='npc'||!m.replies||m.answered!==undefined)return{ok:false,error:'Tin này không cần trả lời.'};const label=m.replies[choice];if(label===undefined)return{ok:false,error:'Lựa chọn không hợp lệ.'};const npc=castById(id)!;
 let n:GameState=s,answer='';const seq=ib.seq+1,appts=[...ib.appts];
 if(m.kind==='invite'){if(choice===0&&m.appt){appts.push({id:`a${seq}`,npc:id,day:m.appt.day,minute:m.appt.minute,place:m.appt.place,status:'set'});answer=say(id,T.yes);n=adjustRelation(n,id,1)}else{answer=say(id,T.no)}}
 else if(m.kind==='rent'){answer=choice===0?'Ừ, giỏi lắm.':'Thôi được, nhưng đừng trễ quá nghen.';n=adjustRelation(n,id,choice===0?1:-1)}
 else if(m.kind==='mom-gift'){n=giftIngredient(n,'rice',3);answer='Nhớ ra bến lấy sớm kẻo người ta đợi.';n=adjustRelation(n,id,2);n={...n,mood:Math.min(100,n.mood+3)}}
 else if(m.kind==='mom-recipe'){if(m.recipe&&RECIPES[m.recipe])n=learnRecipe(n,m.recipe);n=addWorkXp(n,'cooking',choice===0?20:10);answer='Nấu được thì chụp hình cho mẹ coi.';n=adjustRelation(n,id,2)}
 else{answer=id==='me'?'Ừ, mẹ thương.':say(id,T.fine);n=adjustRelation(n,id,2);n={...n,mood:Math.min(100,n.mood+2)}}
 const nm=inboxOf(n),now=clockOf(s).minute;const thread=[...(nm.threads[id]??[])].map(x=>x.id===msgId?{...x,answered:choice,read:true}:x);thread.push({id:`m${seq}:me`,day:s.day,minute:now,from:'me',text:label,kind:'note',read:true},{id:`m${seq}:re`,day:s.day,minute:now,from:'npc',text:answer,kind:'note',read:true});
 n={...n,inbox:{...nm,seq,appts,threads:{...nm.threads,[id]:thread.slice(-40)}}};
 if(m.kind==='invite'&&choice===0&&m.appt)n=recordJournal(n,`appt:a${seq}`,`Hẹn đi ăn với ${npc.name}`,`${placeName(m.appt.place)}, ${whenText(s.day,m.appt.day,m.appt.minute)}.`,id);return{ok:true,state:n}}

/** Người chơi nhắn trước: hỏi thăm (mỗi người mỗi ngày một lần) hoặc rủ đi ăn tối mai. */
export function sendMessage(s:GameState,id:string,kind:'hello'|'invite'):GameResult{const npc=castById(id);if(!npc||!(id==='me'||scoreOf(s,id)>=10))return{ok:false,error:'Chưa có số của người này.'};const ib=inboxOf(s),seq=ib.seq+1,now=clockOf(s).minute,day=s.day;let n:GameState=s;const appts=[...ib.appts];let text:string,answer:string;
 if(kind==='hello'){if(ib.hello[id]===day)return{ok:false,error:'Hôm nay đã nhắn hỏi thăm rồi.'};text=id==='me'?'Dạo này mẹ khoẻ không?':say(id,T.hello);answer=id==='me'?'Mẹ khoẻ, con lo ăn uống đi.':sayAll(id,T.helloBack)[hash(`hi:${day}:${id}`)%3]!;n=adjustRelation(n,id,1)}
 else{if(id==='me')return{ok:false,error:'Mẹ ở quê xa.'};if(appts.some(a=>a.npc===id&&a.status==='set'))return{ok:false,error:'Đã có hẹn với người này rồi.'};text=say(id,T.ask(placeName('streetfood'),hhmm(1110)));const yes=hash(`inv:${day}:${id}`)%100<70;answer=yes?say(id,T.yes):say(id,T.no);if(yes)appts.push({id:`a${seq}`,npc:id,day:day+1,minute:1110,place:'streetfood',status:'set'})}
 const thread=[...(ib.threads[id]??[]),{id:`m${seq}:me`,day,minute:now,from:'me' as const,text,kind:'note' as const,read:true},{id:`m${seq}:re`,day,minute:now,from:'npc' as const,text:answer,kind:'note' as const,read:true}];
 n={...n,inbox:{...inboxOf(n),seq,appts,threads:{...inboxOf(n).threads,[id]:thread.slice(-40)},hello:kind==='hello'?{...ib.hello,[id]:day}:ib.hello}};
 if(appts.length>ib.appts.length)n=recordJournal(n,`appt:a${seq}`,`Hẹn đi ăn với ${npc.name}`,`${placeName('streetfood')}, mai lúc ${hhmm(1110)}.`,id);return{ok:true,state:n}}

/** Gọi điện: Mẹ hoặc người từ bậc Thân; 15 phút; mỗi người mỗi ngày một cuộc. */
export function callNpc(s:GameState,id:string):GameResult{const npc=castById(id);if(!npc||!canCall(s,id))return{ok:false,error:'Cần thân hơn mới gọi điện được.'};const ib=inboxOf(s);if(ib.called[id]===s.day)return{ok:false,error:'Hôm nay đã gọi rồi.'};if(clockOf(s).minute+CALL_MINUTES>END)return{ok:false,error:'Khuya quá rồi.'};
 const r=spendTime(s,CALL_MINUTES);if(!r.ok)return r;let n=adjustRelation(r.state,id,4);n={...n,mood:Math.min(100,n.mood+3),stress:Math.max(0,n.stress-(id==='me'?4:2)),inbox:{...inboxOf(n),called:{...ib.called,[id]:s.day}}};
 return{ok:true,state:recordJournal(n,`call:${s.day}:${id}`,`Gọi điện cho ${npc.name}`,id==='me'?'Nghe giọng mẹ, thấy nhẹ lòng.':'Nói chuyện một lúc, vui hẳn.',id)}}

/** Hẹn đang tới giờ ở nơi người chơi đang đứng (sớm 30 phút đến trễ 60 phút). */
export function dueAppointment(s:GameState){const c=clockOf(s);return inboxOf(s).appts.find(a=>a.status==='set'&&a.day===s.day&&a.place===c.location&&c.minute>=a.minute-APPT_EARLY&&c.minute<=a.minute+APPT_LATE)}
export function markAppointment(s:GameState,apptId:string,status:'done'|'missed'):GameState{const ib=inboxOf(s);return{...s,inbox:{...ib,appts:ib.appts.map(a=>a.id===apptId?{...a,status}:a)}}}

/** Qua ngày: hẹn lỡ thì trừ điểm, ghi nhớ và người đó nhắn trách; tin chưa trả lời quá một ngày thì thôi chờ (Mẹ nhớ); lên lịch tin của ngày mới. */
export function settleInbox(next:GameState):GameState{let n=next;const ib=structuredClone(inboxOf(n));
 for(const a of ib.appts){if(a.status!=='set'||a.day>=n.day)continue;a.status='missed';const npc=castById(a.npc);n=adjustRelation(n,a.npc,MISSED_PENALTY,false);const st=storyOf(n);n={...n,story:{...st,memories:[...st.memories,{id:`m-miss-${a.id}`,day:a.day,npc:a.npc,motif:'meal',topic:'lỡ hẹn đi ăn',tag:'missed',weight:3}]}};ib.queue.push({id:`q${n.day}:${a.npc}:missed`,npc:a.npc,day:n.day,minute:480,from:'npc',text:say(a.npc,T.missed),kind:'missed'});n=recordJournal(n,`appt-missed:${a.id}`,`Lỡ hẹn với ${npc?.name??''}`,'Không đến chỗ hẹn đi ăn.',a.npc)}
 for(const [id,t] of Object.entries(ib.threads))for(const m of t)if(m.from==='npc'&&m.replies&&m.answered===undefined&&n.day-m.day>=2){m.answered=-1;if(id==='me'){const st=storyOf(n);if(!st.memories.some(x=>x.topic==='chưa trả lời mẹ'&&x.recalled===undefined))n={...n,story:{...st,memories:[...st.memories,{id:`m-mom-${m.id}`,day:n.day,npc:'me',motif:'mom',topic:'chưa trả lời mẹ',tag:'later',weight:2}]}}}}
 ib.appts=ib.appts.filter(a=>n.day-a.day<=30);const fresh=schedule(n,ib).filter(q=>!ib.queue.some(x=>x.id===q.id));ib.queue=[...ib.queue,...fresh].filter(q=>n.day-q.day<=3);return{...n,inbox:ib}}

export function validInbox(v:unknown,day:number):v is InboxState{if(!v||typeof v!=='object')return false;const b=v as InboxState,id=(x:unknown)=>typeof x==='string'&&NPCS.some(n=>n.id===x),d=(x:unknown,max=day+2)=>Number.isInteger(x)&&(x as number)>=0&&(x as number)<=max,msg=(m:Msg)=>m&&typeof m.id==='string'&&d(m.day)&&Number.isInteger(m.minute)&&['npc','me'].includes(m.from)&&typeof m.text==='string'&&m.text.length<300&&(m.replies===undefined||(Array.isArray(m.replies)&&m.replies.length<=4))&&(m.answered===undefined||Number.isInteger(m.answered))&&(m.recipe===undefined||Object.hasOwn(RECIPES,m.recipe));
 if(b.version!==1||!Number.isInteger(b.seq)||!b.threads||typeof b.threads!=='object'||!Array.isArray(b.queue)||b.queue.length>20||!Array.isArray(b.appts)||b.appts.length>60)return false;
 if(!Object.entries(b.threads).every(([k,t])=>id(k)&&Array.isArray(t)&&t.length<=40&&t.every(msg)))return false;if(!b.queue.every(q=>id(q.npc)&&msg(q)))return false;
 if(!b.appts.every(a=>a&&typeof a.id==='string'&&id(a.npc)&&d(a.day)&&Number.isInteger(a.minute)&&typeof a.place==='string'&&['set','done','missed'].includes(a.status)))return false;
 return!!b.called&&!!b.hello&&Object.entries({...b.called,...b.hello}).every(([k,v])=>id(k)&&d(v,day))}
export const presentFor=(s:GameState,id:string)=>{const n=castById(id);return!!n&&presentAt(n,s.day,clockOf(s).minute,clockOf(s).location)};
