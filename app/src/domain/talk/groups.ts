/** H7d: nhóm chat Khu trọ, Đồng nghiệp, Gia đình (HOI-THOAI I.4b, phần nhóm chat khu trọ của T86). Chủ dự án duyệt 06/11:
 * - Thành viên theo nơi ở và chỗ làm: Khu trọ (chủ trọ, hàng xóm, sinh viên giao hàng, người thuê trọ ngẫu nhiên, có từ đầu),
 *   Đồng nghiệp (4 người ở công ty đang làm; vào khi nhận việc, rời khi nghỉ), Gia đình (Mẹ và em).
 * - Mỗi nhóm 0 đến 3 tin mỗi ngày, tổng tối đa 6; có chấm chưa đọc; tin nhắn không tốn giờ.
 * - Người chơi trả lời bằng lựa chọn, 1 lần mỗi nhóm mỗi ngày (cộng nhẹ quan hệ với người vừa nhắn).
 * - Nội dung: chuyện thường ngày, tin đồn (đọc là biết, `hear(...,'chat')`), thông báo việc có thật (tiền trọ, giá chợ, quà ở bến xe, sinh nhật),
 *   rủ cả nhóm (đến đúng giờ, đúng chỗ thì quan hệ với cả nhóm tăng nhẹ; nhận lời mà không đến thì người rủ giận nhẹ). */
import type {GameState,GameResult,PlaceId} from '../types';
import {rosterOf,coworkersOf,mix,worldSeed,isNpcId,castById,isBirthday,type NpcProfile} from '../npc';
import {hash} from '../shift';
import {dateAt} from '../format';
import {weatherOf} from '../weather';
import {clockOf,spendTime} from '../time';
import {adjustRelation} from '../social';
import {recordJournal} from '../journal';
import {readyParcels} from '../gifts';
import {livesInTro} from '../home';
import {archOf} from '../town-data';
import {eventsBetween} from './npc-life';
import {RUMOR_TEXT,PRICE_THING} from './group-data';
import {rumorsOn,knows,hear,parseRumor} from './gossip';
import {callName,between} from './ties';
import {GROUP_NAME,CHAT_DAY,CHAT_WEATHER,CHAT_SELF,CHAT_REPLY,CHAT_RUMOR,CHAT_PRICE,CHAT_NEWS,CHAT_INVITE,INVITE_PLACE,PLAYER_REPLY,type GroupId,type ChatLine,type PlayerReply} from './chat-data';

export const GROUPS:GroupId[]=['block','work','family'];
export const CHAT={perGroup:3,total:6,keepDays:7,keep:30,invitePct:15,early:30,late:60,attend:2,missed:-2,attendMins:60,from:420,to:1320} as const;
export type GKind='chat'|'self'|'reply'|'rumor'|'news'|'invite';
export interface GMsg{id:string;day:number;minute:number;/** mã NPC, hoặc 'me' là người chơi */from:string;text:string;kind:GKind;tone?:'good'|'bad'|'plain';rumor?:string;invite?:{place:PlaceId;day:number;minute:number}}
export interface GAppt{id:string;g:GroupId;day:number;minute:number;place:PlaceId;from:string;status:'set'|'done'|'missed'}
export interface ChatState{version:1;/** ngày đã sinh tin gần nhất */gen:number;msgs:Partial<Record<GroupId,GMsg[]>>;read:Partial<Record<GroupId,number>>;replied:Partial<Record<GroupId,number>>;appts:GAppt[]}
export const chatsOf=(s:Pick<GameState,'chats'>):ChatState=>s.chats??{version:1,gen:-1,msgs:{},read:{},replied:{},appts:[]};
const at=(day:number,minute:number)=>day*1440+minute;
const nowOf=(s:GameState)=>at(s.day,clockOf(s).minute);
const cap=(t:string)=>t.charAt(0).toLocaleUpperCase('vi')+t.slice(1);

/** Thành viên hiện tại của nhóm. */
export function membersOf(s:GameState,g:GroupId):NpcProfile[]{const r=rosterOf(s);
 if(g==='family')return r.filter(n=>n.family);
 if(g==='work')return s.office?.role==='employee'&&s.office.employerId?coworkersOf(s):[];
 return r.filter(n=>['landlord','neighbor','courier'].includes(n.id)||(!!n.arch&&archOf(n.arch)?.place==='home'))}

type Draft=Omit<GMsg,'id'|'minute'|'day'>;
/** Tin trong ngày của một nhóm (tất định theo seed thế giới, nhóm, ngày). */
function draftDay(s:GameState,g:GroupId,members:NpcProfile[]):Draft[]{if(members.length<1)return[];const w=worldSeed(s),d=s.day,h=(x:string)=>mix(hash(`${w}:chat:${g}:${d}:${x}`)),pick=<T,>(l:readonly T[],x:string)=>l[h(x)%l.length]!;
 const r0=h('n')%100,n=r0<25?0:r0<60?1:r0<85?2:3;if(!n)return[];
 const others=(sp:NpcProfile)=>members.filter(m=>m.id!==sp.id&&(g!=='family'||!m.remote||true));
 /* người đáp gọi người vừa nhắn; trong nhà: em gọi mẹ, mẹ gọi con */
 const callOf=(sp:NpcProfile,to:NpcProfile)=>to.id==='me'?'mẹ':sp.id==='me'?'con':between(sp,to).you,daOf=(sp:NpcProfile,to:NpcProfile)=>sp.id!=='me'&&(to.id==='me'||between(sp,to).junior);
 const say=(sp:NpcProfile,line:ChatLine,x:{c?:NpcProfile;r?:string;thing?:string;when?:string;Place?:string;to?:NpcProfile}={})=>{const t=cap(line.text.replace(/\{y\}/g,x.to?callOf(sp,x.to):'').replace(/  +/g,' ').replace(/\{self\}/g,sp.self).replace(/\{c\}/g,x.c?callName(sp,x.c):'').replace(/\{r\}/g,x.r??'').replace(/\{thing\}/g,x.thing??'').replace(/\{when\}/g,x.when??'').replace(/\{Place\}/g,x.Place??''));return x.to&&daOf(sp,x.to)?'Dạ, '+t.charAt(0).toLocaleLowerCase('vi')+t.slice(1):t};
 const fits=(l:ChatLine,sp:NpcProfile)=>(!l.g||l.g.includes(g))&&(!l.who||l.who.includes(sp.id));
 const out:Draft[]=[],date=dateAt(d),dom=date.getUTCDate(),dow=date.getUTCDay(),ids=new Set(members.map(m=>m.id));
 /* 1. thông báo việc có thật */
 const lm=members.find(m=>m.id==='landlord');if(g==='block'&&lm&&dom>=28&&livesInTro(s))out.push({from:lm.id,kind:'news',text:say(lm,pick(CHAT_NEWS.rent,'rent'))});
 const mom=members.find(m=>m.id==='me');if(g==='family'&&mom&&readyParcels(s).some(p=>p.day===d&&p.from==='me'))out.push({from:mom.id,kind:'news',text:say(mom,CHAT_NEWS.parcel[0])});
 const bday=members.find(m=>isBirthday(m.born,d+1));if(bday&&g!=='family'){const sp=others(bday)[h('bs')%Math.max(1,others(bday).length)];if(sp)out.push({from:sp.id,kind:'news',text:say(sp,CHAT_NEWS.bday[0],{c:bday})})}
 const pm=members.find(m=>m.desk==='pm');if(g==='work'&&pm){if(dow===0)out.push({from:pm.id,kind:'news',text:say(pm,CHAT_NEWS.monday[0])});else if(dom>=26&&dow>=1&&dow<=5&&h('me')%3===0)out.push({from:pm.id,kind:'news',text:say(pm,CHAT_NEWS.monthEnd[0])})}
 /* 2. tin giá chợ (khu trọ), tin đồn về người ngoài nhóm */
 const rumors=rumorsOn(s);
 if(g==='block'){const pr=rumors.find(r=>r.ev==='price'&&d-r.start<=1);const sp=pr&&members.filter(m=>m.id!=='landlord')[h('ps')%Math.max(1,members.length-1)];if(pr&&sp)out.push({from:sp.id,kind:'rumor',rumor:pr.id,text:say(sp,pick(CHAT_PRICE,'pp'),{thing:PRICE_THING[pr.about]})})}
 if(g!=='family'){const opts=rumors.filter(r=>r.ev!=='price'&&!ids.has(r.about)).flatMap(r=>members.filter(m=>knows(s,r,m)).map(m=>({r,m})));if(opts.length&&h('rm')%100<60){const {r,m}=pick(opts,'ro'),c=castById(s,r.about);if(c){const t=RUMOR_TEXT[r.ev]!;out.push({from:m.id,kind:'rumor',rumor:r.id,text:say(m,pick(CHAT_RUMOR,'rt'),{c,r:r.ev==='retire'?'sắp nghỉ rồi':(r.truth==='big'&&t.big?t.big:t.t).replace('{item}',r.item??'đồ mới')})})}}}
 /* 3. chuyện của chính thành viên (vui, buồn), có người đáp */
 const selfOpts=members.flatMap(m=>eventsBetween(w,m,d-2,d).filter(e=>e.start>=d-2&&e.end>=d&&RUMOR_TEXT[e.kind]&&!RUMOR_TEXT[e.kind]!.private&&e.tone!=='plain'&&e.kind!=='frail').map(e=>({m,e})));
 if(selfOpts.length&&h('se')%100<70){const {m,e}=pick(selfOpts,'sp'),tone=e.tone as 'good'|'bad',line=pick(CHAT_SELF.filter(l=>l.tone===tone),'sl');out.push({from:m.id,kind:'self',tone,text:say(m,line,{r:RUMOR_TEXT[e.kind]!.t.replace('{item}',e.vars.item??'đồ mới')})});
  const rp=others(m);if(rp.length){const sp=pick(rp,'rp');out.push({from:sp.id,kind:'reply',tone,text:say(sp,pick(CHAT_REPLY[tone],'rl'),{to:m})})}}
 /* 4. rủ cả nhóm */
 const inv=INVITE_PLACE[g].filter(p=>p.days==='today'?(g!=='work'||(dow>=1&&dow<=5)):dow===6);if(inv.length&&h('iv')%100<CHAT.invitePct){const p=pick(inv,'ip'),sp=pick(members,'is');out.push({from:sp.id,kind:'invite',invite:{place:p.place,day:p.days==='today'?d:d+1,minute:p.minute},text:say(sp,pick(CHAT_INVITE,'il'),{when:p.days==='today'?(p.minute>=1080?'tối nay':'trưa nay'):'sáng mai',Place:p.name})})}
 /* 5. thời tiết, chuyện thường ngày */
 const wx=weatherOf(d),wl=wx==='mild'?[]:CHAT_WEATHER[wx];if(wl.length&&h('wx')%2===0){const sp=pick(members,'ws');out.push({from:sp.id,kind:'chat',tone:'plain',text:say(sp,pick(wl,'wl'))})}
 for(let k=0;k<3;k++){const sp=pick(members,`ds${k}`),list=CHAT_DAY.filter(l=>fits(l,sp));if(list.length)out.push({from:sp.id,kind:'chat',tone:'plain',text:say(sp,pick(list,`dl${k}`))})}
 /* lấy n tin đầu, giữ cặp chuyện riêng và câu đáp đi liền */
 const sel:Draft[]=[];for(const x of out){if(sel.length>=n)break;if(sel.some(y=>y.text===x.text))continue;if(x.kind==='reply'&&sel.at(-1)?.kind!=='self')continue;sel.push(x)}return sel}

/** Qua ngày: sinh tin cho ngày mới (mỗi nhóm tối đa 3, tổng tối đa 6), dọn tin cũ, hẹn nhóm lỡ thì người rủ giận nhẹ. */
export function settleChats(s:GameState):GameState{const c0=chatsOf(s);if(c0.gen===s.day)return s;let n=s;const c:ChatState=structuredClone(c0),w=worldSeed(s);
 for(const a of c.appts)if(a.status==='set'&&a.day<s.day){a.status='missed';if(castById(n,a.from))n=adjustRelation(n,a.from,CHAT.missed,false)}
 c.appts=c.appts.filter(a=>s.day-a.day<=CHAT.keepDays);
 let total=0;for(const g of GROUPS){const list=(c.msgs[g]??[]).filter(m=>s.day-m.day<CHAT.keepDays);const ms=membersOf(s,g);const drafts=draftDay(s,g,ms).slice(0,Math.min(CHAT.perGroup,CHAT.total-total));total+=drafts.length;
  const mins=drafts.map((_,i)=>CHAT.from+mix(hash(`${w}:chatmin:${g}:${s.day}:${i}`))%(CHAT.to-CHAT.from)).sort((a,b)=>a-b);
  drafts.forEach((x,i)=>{const minute=x.kind==='reply'&&i>0?Math.min(CHAT.to,mins[i-1]!+5+mix(hash(`${w}:rmin:${g}:${s.day}:${i}`))%40):x.kind==='invite'&&x.invite&&x.invite.day===s.day?Math.min(mins[i]!,x.invite.minute-90):mins[i]!;mins[i]=minute;list.push({...x,id:`${g}:${s.day}:${i}`,day:s.day,minute})});
  list.sort((a,b)=>at(a.day,a.minute)-at(b.day,b.minute));c.msgs[g]=list.slice(-CHAT.keep)}
 c.gen=s.day;return{...n,chats:c}}

/** Tin đã tới (giờ gửi đã qua). */
export function visibleMsgs(s:GameState,g:GroupId):GMsg[]{const now=nowOf(s);return(chatsOf(s).msgs[g]??[]).filter(m=>at(m.day,m.minute)<=now)}
export function groupUnread(s:GameState,g:GroupId){const r=chatsOf(s).read[g]??-1;return visibleMsgs(s,g).filter(m=>m.from!=='me'&&at(m.day,m.minute)>r).length}
/** Nhóm người chơi đang ở (có thành viên). */
export const myGroups=(s:GameState)=>GROUPS.filter(g=>membersOf(s,g).length>0);
/** Mở nhóm: đánh dấu đã đọc; tin đồn trong nhóm người chơi biết từ lúc đọc. */
export function readGroup(s:GameState,g:GroupId):GameState{const vis=visibleMsgs(s,g);if(!vis.length)return s;let n=s;for(const m of vis)if(m.rumor&&parseRumor(m.rumor))n=hear(n,m.rumor,'chat');const c=chatsOf(n);return{...n,chats:{...c,read:{...c.read,[g]:nowOf(s)}}}}

/** Lựa chọn trả lời tin mới nhất của nhóm trong hôm nay (1 lần mỗi nhóm mỗi ngày). */
export function groupReplies(s:GameState,g:GroupId):{to:GMsg;options:PlayerReply[]}|null{const c=chatsOf(s);if(c.replied[g]===s.day)return null;const last=[...visibleMsgs(s,g)].reverse().find(m=>m.day===s.day&&m.from!=='me');if(!last)return null;
 const k:keyof typeof PLAYER_REPLY=g==='family'?'family':last.kind==='invite'?(last.invite&&at(last.invite.day,last.invite.minute)>nowOf(s)?'invite':'chat'):last.kind==='rumor'?'rumor':last.kind==='news'?'news':last.tone==='good'?'good':last.tone==='bad'?'bad':'chat';
 return{to:last,options:PLAYER_REPLY[k]}}
export function replyGroup(s:GameState,g:GroupId,optId:string):GameResult{const r=groupReplies(s,g);if(!r)return{ok:false,error:'Hôm nay đã trả lời nhóm này rồi.'};const o=r.options.find(x=>x.id===optId);if(!o)return{ok:false,error:'Lựa chọn không hợp lệ.'};
 let n=readGroup(s,g);const c=structuredClone(chatsOf(n)),minute=clockOf(n).minute,list=c.msgs[g]??[];list.push({id:`${g}:${s.day}:me`,day:s.day,minute,from:'me',text:o.text,kind:'chat'});c.msgs[g]=list.slice(-CHAT.keep);c.replied[g]=s.day;
 if(o.go&&r.to.invite)c.appts=[...c.appts.filter(a=>!(a.g===g&&a.day===r.to.invite!.day)),{id:`${g}:${r.to.invite.day}`,g,day:r.to.invite.day,minute:r.to.invite.minute,place:r.to.invite.place,from:r.to.from,status:'set'}];
 n={...n,chats:c};if(o.rel&&castById(n,r.to.from))n=adjustRelation(n,r.to.from,o.rel,true,true);return{ok:true,state:n}}
/** Hẹn nhóm đang tới giờ ở chỗ người chơi vừa tới. */
export function dueGroupAppt(s:GameState){const cl=clockOf(s);return chatsOf(s).appts.find(a=>a.status==='set'&&a.day===s.day&&a.place===cl.location&&cl.minute>=a.minute-CHAT.early&&cl.minute<=a.minute+CHAT.late)}
/** Tới đúng hẹn nhóm: ngồi chung 60 phút, quan hệ với cả nhóm tăng nhẹ. */
export function attendGroup(s:GameState):GameResult&{text?:string}{const a=dueGroupAppt(s);if(!a)return{ok:false,error:'Không có hẹn nhóm ở đây.'};const t=spendTime(s,CHAT.attendMins);if(!t.ok)return t;let n=t.state;
 for(const m of membersOf(n,a.g))n=adjustRelation(n,m.id,CHAT.attend,true,true);const c=chatsOf(n);n={...n,chats:{...c,appts:c.appts.map(x=>x.id===a.id?{...x,status:'done' as const}:x)}};
 n=recordJournal(n,`chatappt:${a.id}`,'Đi chung với nhóm',`Bạn đi chơi cùng nhóm ${GROUP_NAME[a.g]}.`,a.from);return{ok:true,state:n,text:`Ngồi chơi với nhóm ${GROUP_NAME[a.g]} một tiếng.`}}

export function validChats(v:unknown,day:number):v is ChatState{if(!v||typeof v!=='object')return false;const c=v as ChatState,int=(x:unknown,lo=0,hi=day+1)=>Number.isInteger(x)&&(x as number)>=lo&&(x as number)<=hi;
 if(c.version!==1||!int(c.gen,-1,day)||!c.msgs||typeof c.msgs!=='object'||!c.read||!c.replied||!Array.isArray(c.appts)||c.appts.length>30)return false;
 for(const [g,list] of Object.entries(c.msgs)){if(!GROUPS.includes(g as GroupId)||!Array.isArray(list)||list.length>CHAT.keep)return false;
  if(!list.every(m=>m&&typeof m.id==='string'&&int(m.day,0,day)&&int(m.minute,0,1500)&&(m.from==='me'||isNpcId(m.from))&&typeof m.text==='string'&&m.text.length<200&&['chat','self','reply','rumor','news','invite'].includes(m.kind)&&(m.rumor===undefined||!!parseRumor(m.rumor))&&(m.invite===undefined||int(m.invite.day,0,day+1)&&int(m.invite.minute,0,1500))))return false}
 for(const o of [c.read,c.replied])for(const [g,x] of Object.entries(o))if(!GROUPS.includes(g as GroupId)||!int(x,-1,at(day+1,0)))return false;
 return c.appts.every(a=>a&&GROUPS.includes(a.g)&&int(a.day,0,day+1)&&int(a.minute,0,1500)&&isNpcId(a.from)&&['set','done','missed'].includes(a.status))}
