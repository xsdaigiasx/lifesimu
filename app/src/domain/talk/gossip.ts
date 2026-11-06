/** H7c: tin đồn, cảnh nhóm và kể lại tin (HOI-THOAI I.4b, gộp T63, phần sự kiện nhóm của T86). Chủ dự án duyệt 06/11:
 * - Cảnh nhóm khi có từ 2 NPC có quan hệ cùng chỗ, tối đa 1 cảnh mỗi ngày; người chơi đứng nghe (có thể nghe lỏm tin đồn) hoặc chen vào
 *   (bênh một bên thì người kia giảm thiện cảm chút, hoặc hoà giải).
 * - Tin đồn chỉ về NPC (không có tin về người chơi), đúng và sai khoảng 25% thổi phồng hoặc bịa, lấy từ biến cố và mạch chuyện thật,
 *   lan qua người quen; biết bằng nghe lỏm, nhóm chat (H7d), NPC kể.
 * - Người chơi kể lại tin được, kèm rủi ro: tin đúng thì người nghe thân hơn chút; tin sai hoặc chuyện riêng mà người trong cuộc biết thì giảm thiện cảm.
 * - Hệ quả nhẹ: chợ sắp tăng giá (giá thật tăng), ai sắp nghỉ, yếu dần.
 * Tin đồn tính lại từ seed thế giới và ngày, không lưu; save chỉ giữ tin người chơi đã nghe, đã kể và phần lệch quan hệ NPC với NPC. */
import type {GameState,GameResult} from '../types';
import {rosterOf,castById,mix,worldSeed,ageAt,roleDef,peopleHere,isNpcId,type NpcProfile} from '../npc';
import {hash} from '../shift';
import {clockOf,spendTime,END} from '../time';
import {adjustRelation,socialOf} from '../social';
import {recordJournal} from '../journal';
import {skillsOf} from '../work';
import {eventsBetween,SELLERS,EVENT_KINDS} from './npc-life';
import {priceWave,blocksNear,PRICE} from './price';
import {tieOf,tiesOf,between,callName,pairKey,TIE,type TieKind} from './ties';
import {RUMOR_TEXT,PRICE_THING,GOSSIP_OPEN,GOSSIP_REPLY,PRICE_OPEN,PRICE_REPLY,CHAT,SPAT,JUDGE,AFTER,TELL_REPLY,type GroupLine} from './group-data';

export const RUMOR={life:10,eventPct:40,bigPct:20,falsePct:5,block:10,hop1:1,hop2:3,falsePricePct:30,heardMax:30,toldMax:40,keep:14,retireLead:14} as const;
export const GROUP={pct:35,spatPct:30,gossipPct:60,mins:5,side:3,tie:6,calmTie:8,calmBase:30,calmPerLv:8,calmMax:90,find:{wrong:50,private:35},findHit:4} as const;
/** Bịa được những chuyện này (theo tuổi, người bán thì thêm chuyện buôn bán). */
const FALSE_POOL=['cold','backache','promotion','jobhunt','short','debt','buy','renovate','lost','scam','newjob'];
const FALSE_ITEMS=['xe máy mới','điện thoại mới','cái tivi mới'];

export type Truth='t'|'big'|'false';
/** Một tin đồn; mã tự chứa đủ dữ liệu: `về~đời~biến cố~ngày~đúng sai~món`. */
export interface Rumor{id:string;about:string;gen:number;ev:string;start:number;truth:Truth;item?:string}
export interface Heard{r:string;day:number;how:'over'|'npc'|'chat'}
export interface Told{r:string;to:string;day:number;/** ngày người trong cuộc biết chuyện (nếu có) */out?:number;done?:boolean}
export interface SceneLine{who:string;text:string}
export interface GroupScene{key:string;day:number;a:string;b:string;kind:'chat'|'gossip'|'spat'|'price';at:TieKind;rumor?:string;lines:SceneLine[]}
export interface GossipState{version:1;/** ngày có cảnh nhóm gần nhất */scene?:number;pending?:GroupScene;/** phần lệch quan hệ NPC với NPC */d?:Record<string,number>;heard:Heard[];told:Told[]}
export const gossipOf=(s:Pick<GameState,'gossip'>):GossipState=>s.gossip??{version:1,heard:[],told:[]};

const roll=(world:string,salt:string,n=100)=>mix(hash(`${world}:rumor:${salt}`))%n;
export const rumorId=(r:Omit<Rumor,'id'>)=>[r.about,r.gen,r.ev,r.start,r.truth,r.item??''].join('~');
export function parseRumor(id:string):Rumor|null{const p=id.split('~');if(p.length!==6)return null;const [about,g,ev,st,truth,item]=p as [string,string,string,string,string,string];const gen=Number(g),start=Number(st);
 if(!isNpcId(about)&&!(about in PRICE_THING)||!Number.isInteger(gen)||gen<0||!Number.isInteger(start)||!(ev==='price'||ev in RUMOR_TEXT)||!['t','big','false'].includes(truth))return null;
 return{id,about,gen,ev,start,truth:truth as Truth,...(item?{item}:{})}}
const make=(r:Omit<Rumor,'id'>):Rumor=>({...r,id:rumorId(r)});

function retireStart(n:NpcProfile,day:number){const at=roleDef(n.id)?.retire;if(at===undefined||n.age>=at)return null;for(let d=day;d<=day+RUMOR.retireLead;d++)if(ageAt(n.born,d)>=at)return d-RUMOR.retireLead;return null}
/** Các tin đang lan trong ngày (bắt đầu trong 10 ngày qua; tin yếu dần còn tới khi người đó đi; tin giá còn tới hết đợt). */
export function rumorsOn(s:GameState,day=s.day):Rumor[]{const w=worldSeed(s),out:Rumor[]=[],from=day-RUMOR.life;
 for(const n of rosterOf({...s,day})){if(n.remote||n.family)continue;
  for(const e of eventsBetween(w,n,from,day))if(e.start>=from&&e.start<=day&&e.kind in RUMOR_TEXT&&roll(w,`ev:${n.id}:${e.id}`)<RUMOR.eventPct)out.push(make({about:n.id,gen:n.gen,ev:e.kind,start:e.start,truth:RUMOR_TEXT[e.kind]!.big&&roll(w,`big:${n.id}:${e.id}`)<RUMOR.bigPct?'big':'t',...(e.vars.item?{item:e.vars.item}:{})}));
  for(let b=Math.floor(from/RUMOR.block)*RUMOR.block;b<=day;b+=RUMOR.block){const salt=`false:${n.id}:${n.gen}:${b}`;if(roll(w,salt)>=RUMOR.falsePct)continue;const start=b+roll(w,salt+':d',RUMOR.block);if(start<from||start>day)continue;
   const pool=[...FALSE_POOL.filter(k=>!(['promotion','jobhunt','newjob'].includes(k)&&(n.age<22||n.age>58||SELLERS.includes(n.id)))),...(SELLERS.includes(n.id)?['slow','brisk']:[])],ev=pool[roll(w,salt+':k',pool.length)]!;
   out.push(make({about:n.id,gen:n.gen,ev,start,truth:'false',...(ev==='buy'?{item:FALSE_ITEMS[roll(w,salt+':i',FALSE_ITEMS.length)]!}:{})}))}
  const rs=retireStart(n,day);if(rs!==null&&rs<=day)out.push(make({about:n.id,gen:n.gen,ev:'retire',start:rs,truth:'t'}));
  if(n.frail!==undefined&&day>=n.frail)out.push(make({about:n.id,gen:n.gen,ev:'frail',start:n.frail,truth:'t'}))}
 for(const b of blocksNear(day)){const p=priceWave(w,b);
  if(p){if(day>=p.from-PRICE.lead&&day<=p.to)out.push(make({about:p.seller,gen:0,ev:'price',start:p.from-PRICE.lead,truth:'t'}))}
  else if(roll(w,`fprice:${b}`)<RUMOR.falsePricePct){const start=b+8+roll(w,`fpd:${b}`,6);if(day>=start&&day<start+5)out.push(make({about:roll(w,`fpw:${b}`,2)?'meat':'veg',gen:0,ev:'price',start,truth:'false'}))}}
 return out}
/** Tin còn đúng người (người trong cuộc chưa đổi), để kể lại hay nhắc lại. */
export function liveRumor(s:GameState,id:string):Rumor|null{const r=parseRumor(id);if(!r)return null;if(r.ev==='price')return r;const n=castById(s,r.about);return n&&n.gen===r.gen?r:null}
/* tính lười: gossip nạp giữa vòng director, npc-life nên không đọc EVENT_KINDS lúc nạp module */
let TONE:Record<string,'good'|'bad'|'plain'>|null=null;
/** Tin vui hay buồn (bịa thì theo chuyện bịa ra; thổi phồng thì vẫn theo chuyện gốc). */
const toneOf=(r:Rumor)=>{TONE??=Object.fromEntries(EVENT_KINDS.map(k=>[k.id,k.tone]));return r.ev==='retire'?'plain':TONE[r.ev]??'plain'};
const isPrivate=(r:Rumor)=>r.ev!=='price'&&!!RUMOR_TEXT[r.ev]?.private;
/** Ai biết tin vào ngày đó: người quen của người trong cuộc từ hôm sau, người quen của họ từ ngày thứ 3; tin giá thì ai ở chợ, quán cũng biết. */
export function knows(s:GameState,r:Rumor,n:NpcProfile,day=s.day){if(n.id===r.about||n.remote||n.family)return false;
 if(r.ev==='price')return day>=r.start&&n.schedule.some(x=>x.place==='market'||x.place==='streetfood');
 const subj=castById(s,r.about);if(!subj)return false;const roster=rosterOf(s),near=tiesOf(s,subj,roster);
 if(near.some(t=>t.npc.id===n.id))return day>=r.start+RUMOR.hop1;
 return day>=r.start+RUMOR.hop2&&near.some(t=>!!tieOf(s,t.npc,n))}

/** Nội dung tin theo người nói (vai sắp nghỉ đổi chữ). */
function rumorText(r:Rumor){if(r.ev==='price')return PRICE_THING[r.about]!;if(r.ev==='retire'){return SELLERS.includes(r.about)?'sắp nghỉ bán rồi':r.about==='courier'?'sắp ra trường rồi':'sắp nghỉ hưu rồi'}const t=RUMOR_TEXT[r.ev]!;return(r.truth==='big'&&t.big?t.big:t.t).replace('{item}',r.item??'đồ mới')}
/** Người nói gọi người được nhắc tới: lớn hơn thì kèm danh xưng ("cô Ngân"), bằng hoặc nhỏ hơn thì gọi tên. */
const refTo=(sp:NpcProfile,c:NpcProfile)=>callName(sp,c);
/** Nhãn ngắn của tin cho danh sách Kể tin. */
export function rumorLabel(s:GameState,r:Rumor){if(r.ev==='price')return`${PRICE_THING[r.about]==='rau'?'Rau':'Thịt cá'} sắp lên giá`;const n=castById(s,r.about);return`${n?.name??''} ${rumorText(r)}`}

/** Viết hoa đầu câu và sau dấu chấm, hỏi, than (chỗ trống đại từ điền vào đầu câu). */
const cap=(t:string)=>(t.charAt(0).toLocaleUpperCase('vi')+t.slice(1)).replace(/([.?!]\s+)(\p{Ll})/gu,(_,p:string,c:string)=>p+c.toLocaleUpperCase('vi'));
/** Điền chỗ trống: A là người mở chuyện, B người đáp; `sp` là người đang nói (để điền {pS} {pY} {c}). Người nhỏ tuổi đáp thì thêm "Dạ,". */
function fill(text:string,a:NpcProfile,b:NpcProfile,sp:NpcProfile,x:{c?:NpcProfile;r?:string;thing?:string;da?:boolean}={}){/* câu mở bằng tiếng than thì không thêm "Dạ," */if(NO_DA.has(text))x={...x,da:false};const ab=between(a,b),ba=between(b,a);
 let t=text.replace(/\{aS\}/g,ab.self).replace(/\{aY\}/g,ab.you).replace(/\{bN\}/g,callName(a,b)).replace(/\{bS\}/g,ba.self).replace(/\{bY\}/g,ba.you).replace(/\{pS\}/g,sp.self).replace(/\{pY\}/g,sp.you).replace(/\{c\}/g,x.c?refTo(sp,x.c):'').replace(/\{r\}/g,x.r??'').replace(/\{thing\}/g,x.thing??'');
 if(x.da&&ba.junior&&!/^dạ/i.test(t))t='Dạ, '+t.charAt(0).toLocaleLowerCase('vi')+t.slice(1);return cap(t)}
const NO_DA=new Set(GOSSIP_REPLY.filter(l=>l.noDa).map(l=>l.text));
/** Câu mở hợp biến cố; câu đáp hợp tin vui, buồn. */
const openFor=(r:Rumor)=>GOSSIP_OPEN.filter(l=>!l.need||l.need.includes(r.ev));
const replyFor=(r:Rumor)=>{const t=toneOf(r);return GOSSIP_REPLY.filter(l=>!l.tone||l.tone===t)};
const pick=<T,>(list:readonly T[],salt:string)=>list[mix(hash(salt))%list.length]!;

/** Chọn cảnh nhóm ở chỗ người chơi đang đứng (null khi không đủ người có quan hệ). */
export function pickScene(s:GameState,salt:string):GroupScene|null{const here=peopleHere(s).filter(n=>!n.remote&&!n.family);if(here.length<2)return null;const ids=new Set(here.map(n=>n.id));
 const pairs:{a:NpcProfile;b:NpcProfile;kind:TieKind;rival:boolean}[]=[];for(const a of here)for(const b of here)if(a.id!==b.id){const t=tieOf(s,a,b);if(t)pairs.push({a,b,kind:t.kind,rival:t.rival})}if(!pairs.length)return null;
 const key=`${s.day}:${salt}`,h=(x:string)=>mix(hash(`${key}:${x}`));
 const spatFits=(z:typeof SPAT[number],a:NpcProfile,b:NpcProfile)=>z.need==='sellers'?SELLERS.includes(a.id)&&SELLERS.includes(b.id):z.need==='sellerA'?SELLERS.includes(a.id):true;
 const rivals=pairs.filter(p=>p.rival&&SPAT.some(z=>z.at===p.kind&&spatFits(z,p.a,p.b)));
 if(rivals.length&&h('spat')%100<GROUP.spatPct){const p=pick(rivals,`${key}:rp`),z=pick(SPAT.filter(x=>x.at===p.kind&&spatFits(x,p.a,p.b)),`${key}:sz`);
  return{key,day:s.day,a:p.a.id,b:p.b.id,kind:'spat',at:p.kind,lines:[{who:p.a.id,text:fill(z.open,p.a,p.b,p.a)},{who:p.b.id,text:fill(z.reply,p.a,p.b,p.b,{da:true})},{who:p.a.id,text:fill(pick(JUDGE,`${key}:j`).text,p.a,p.b,p.a)}]}}
 const friendly=pairs.filter(p=>!p.rival),list=rumorsOn(s);
 if(friendly.length&&h('gossip')%100<GROUP.gossipPct){const opts=friendly.flatMap(p=>list.filter(r=>(r.ev==='price'||!ids.has(r.about)&&r.about!==p.b.id)&&knows(s,r,p.a)).map(r=>({p,r})));
  if(opts.length){const {p,r}=pick(opts,`${key}:go`);
   if(r.ev==='price')return{key,day:s.day,a:p.a.id,b:p.b.id,kind:'price',at:p.kind,rumor:r.id,lines:[{who:p.a.id,text:fill(pick(PRICE_OPEN,`${key}:po`).text,p.a,p.b,p.a,{thing:rumorText(r)})},{who:p.b.id,text:fill(pick(PRICE_REPLY,`${key}:pr`).text,p.a,p.b,p.b,{da:true})}]};
   const c=castById(s,r.about)!;return{key,day:s.day,a:p.a.id,b:p.b.id,kind:'gossip',at:p.kind,rumor:r.id,lines:[{who:p.a.id,text:fill(pick(openFor(r),`${key}:o`).text,p.a,p.b,p.a,{c,r:rumorText(r)})},{who:p.b.id,text:fill(pick(replyFor(r),`${key}:r`).text,p.a,p.b,p.b,{da:true,c})}]}}}
 if(!friendly.length)return null;const p=pick(friendly,`${key}:cp`),ev=eventsBetween(worldSeed(s),p.b,s.day-3,s.day).find(e=>e.end>=s.day&&RUMOR_TEXT[e.kind]&&!RUMOR_TEXT[e.kind]!.private&&e.kind!=='frail');
 const chats=CHAT.filter(c=>c.tone?!!ev&&c.tone===(ev.tone==='good'?'good':'bad'):true),z=pick(chats,`${key}:c`);
 return{key,day:s.day,a:p.a.id,b:p.b.id,kind:'chat',at:p.kind,lines:[{who:p.a.id,text:fill(z.open,p.a,p.b,p.a,{r:ev?RUMOR_TEXT[ev.kind]!.t.replace('{item}',ev.vars.item??'đồ mới'):''})},{who:p.b.id,text:fill(pick(z.reply,`${key}:cr`),p.a,p.b,p.b,{da:true})}]}}

/** Khi người chơi tới nơi: có thể mở một cảnh nhóm (tối đa 1 mỗi ngày). */
export function maybeGroup(s:GameState,trigger:string):GameState{const g=gossipOf(s);if(g.pending||g.scene===s.day||s.story?.pending||s.work?.active)return s;const c=clockOf(s);if(c.minute+30>END)return s;
 if(mix(hash(`${worldSeed(s)}:group:${s.day}:${c.minute}:${c.location}:${trigger}`))%100>=GROUP.pct)return s;const sc=pickScene(s,`${c.location}:${c.minute}:${trigger}`);return sc?{...s,gossip:{...g,scene:s.day,pending:sc}}:s}

export type GroupChoice='join'|'listen'|'ask'|'brush'|'sideA'|'sideB'|'calm';
export function groupChoices(s:GameState,sc:GroupScene):{id:GroupChoice;label:string}[]{const a=castById(s,sc.a),b=castById(s,sc.b);
 if(sc.kind==='spat')return[{id:'sideA',label:`Bênh ${a?.name??''}`},{id:'sideB',label:`Bênh ${b?.name??''}`},{id:'calm',label:'Hoà giải'},{id:'listen',label:'Đứng nghe'}];
 if(sc.kind==='gossip')return[{id:'ask',label:'Hỏi thêm'},{id:'listen',label:'Đứng nghe'},{id:'brush',label:'Gạt đi'}];
 return[{id:'join',label:'Góp chuyện'},{id:'listen',label:'Đứng nghe'}]}
const heardWith=(g:GossipState,r:string,day:number,how:Heard['how']):GossipState=>g.heard.some(h=>h.r===r)?g:{...g,heard:[...g.heard,{r,day,how}].slice(-RUMOR.heardMax)};
const nudge=(g:GossipState,a:string,b:string,d:number):GossipState=>{const k=pairKey(a,b),v=Math.max(TIE.min,Math.min(TIE.max,(g.d?.[k]??0)+d));return{...g,d:{...g.d,[k]:v}}};
/** Người chơi chọn trong cảnh nhóm. Trả các câu đáp sau lựa chọn để hộp thoại hiện. */
export function answerGroup(s:GameState,choice:GroupChoice):GameResult&{lines?:SceneLine[]}{const g=gossipOf(s),sc=g.pending;if(!sc)return{ok:false,error:'Không có cảnh nào đang mở.'};
 if(!groupChoices(s,sc).some(c=>c.id===choice))return{ok:false,error:'Lựa chọn không hợp lệ.'};const a=castById(s,sc.a),b=castById(s,sc.b);
 const t=spendTime(s,GROUP.mins);if(!t.ok)return t;let n=t.state,gg:GossipState={...gossipOf(n)};delete gg.pending;const out:SceneLine[]=[],key=sc.key;
 const say=(who:NpcProfile,list:readonly GroupLine[],salt:string)=>out.push({who:who.id,text:fill(pick(list,`${key}:${salt}`).text,a!,b!,who)});
 if(!a||!b){return{ok:true,state:{...n,gossip:gg}}}
 switch(choice){
  case'listen':if(sc.rumor&&(sc.kind==='gossip'||sc.kind==='price'))gg=heardWith(gg,sc.rumor,s.day,'over');break;
  case'join':n=adjustRelation(adjustRelation(n,a.id,1,true,true),b.id,1,true,true);break;
  case'ask':if(sc.rumor)gg=heardWith(gg,sc.rumor,s.day,'over');n=adjustRelation(n,a.id,1,true,true);break;
  case'brush':n=adjustRelation(adjustRelation(n,a.id,-1),b.id,1,true,true);say(a,AFTER.brush,'b');break;
  case'sideA':case'sideB':{const [w,l]=choice==='sideA'?[a,b]:[b,a];n=adjustRelation(adjustRelation(n,w.id,GROUP.side,true,true),l.id,-GROUP.side);gg=nudge(gg,a.id,b.id,-GROUP.tie);say(w,AFTER.won,'w');say(l,AFTER.lost,'l');
   n=recordJournal(n,`group:${key}`,'Cảnh cãi nhau',`Bạn bênh ${w.name} trước mặt ${l.name}.`,w.id);break}
  case'calm':{const lv=skillsOf(n).communication.level,ok=mix(hash(`${key}:calm`))%100<Math.min(GROUP.calmMax,GROUP.calmBase+GROUP.calmPerLv*lv);
   if(ok){n=adjustRelation(adjustRelation(n,a.id,2,true,true),b.id,2,true,true);gg=nudge(gg,a.id,b.id,GROUP.calmTie);say(a,AFTER.calm,'c');n=recordJournal(n,`group:${key}`,'Hoà giải',`Bạn giúp ${a.name} và ${b.name} làm lành.`,a.id)}
   else{n=adjustRelation(adjustRelation(n,a.id,-1),b.id,-1);say(a,AFTER.snub,'s')}break}}
 return{ok:true,state:{...n,gossip:gg},lines:out}}

/** Tin người chơi kể lại được cho người này: đã nghe trong 14 ngày, không phải chuyện của chính họ, chưa kể với họ. */
export function tellables(s:GameState,to:string):Rumor[]{const g=gossipOf(s);return g.heard.filter(h=>s.day-h.day<=RUMOR.keep&&!g.told.some(t=>t.r===h.r&&t.to===to)).map(h=>liveRumor(s,h.r)).filter((r):r is Rumor=>!!r&&r.about!==to)}
/** Kể lại tin cho người đang ở đây (5 phút). Tin đúng: người nghe thân hơn chút. Tin sai, thổi phồng hoặc chuyện riêng: người trong cuộc có thể biết sau 1 đến 3 ngày. */
export function tellRumor(s:GameState,to:string,rid:string):GameResult&{text?:string}{const n0=castById(s,to);if(!n0||!peopleHere(s).some(p=>p.id===to))return{ok:false,error:'Người này không ở đây.'};
 if((socialOf(s).relations[to]?.score??0)<10)return{ok:false,error:'Chưa đủ quen để kể chuyện.'};const r=tellables(s,to).find(x=>x.id===rid);if(!r)return{ok:false,error:'Không còn tin này.'};
 const t=spendTime(s,GROUP.mins);if(!t.ok)return t;let n=t.state;const g=gossipOf(n),w=worldSeed(s),subj=r.ev==='price'?null:castById(s,r.about);
 const risky=r.truth!=='t'||isPrivate(r),pct=r.truth!=='t'?GROUP.find.wrong:GROUP.find.private,found=!!subj&&risky&&!!tieOf(s,n0,subj)&&roll(w,`find:${rid}:${to}:${s.day}`)<pct;
 if(!risky)n=adjustRelation(n,to,r.ev==='price'?1:2,true,true);
 const told:Told={r:rid,to,day:s.day,...(found?{out:s.day+1+roll(w,`out:${rid}:${to}`,3)}:{})};
 const text=fill(pick(TELL_REPLY.filter(x=>risky?x.mood!=='warm':x.mood!=='cold'),`tell:${rid}:${to}`).text,n0,n0,n0);
 return{ok:true,state:{...n,gossip:{...g,told:[...g.told,told].slice(-RUMOR.toldMax)}},text}}

/** Qua ngày: người trong cuộc biết chuyện người chơi kể thì giận; dọn tin cũ; cảnh nhóm chưa trả lời thì bỏ. */
export function settleGossip(s:GameState):GameState{const g0=s.gossip;if(!g0)return s;let n=s,g:GossipState={...g0};if(g.pending&&g.pending.day<s.day)delete g.pending;
 g.told=g.told.map(t=>{if(t.done||t.out===undefined||t.out>s.day)return t;const r=parseRumor(t.r),subj=r?castById(n,r.about):undefined;if(subj&&r&&subj.gen===r.gen){n=adjustRelation(n,subj.id,-GROUP.findHit,false);if(r.truth!=='t')n=adjustRelation(n,t.to,-1,false);n=recordJournal(n,`told:${t.r}:${t.to}`,'Lời ra tiếng vào',`${subj.name} biết bạn kể chuyện của mình.`,subj.id)}return{...t,done:true}}).filter(t=>s.day-t.day<=30);
 g.heard=g.heard.filter(h=>s.day-h.day<=RUMOR.keep*2);return{...n,gossip:g}}

/** Người chơi đã biết tin này chưa (để NPC không kể lại tin đã kể). */
export const heardIt=(s:GameState,rid:string)=>gossipOf(s).heard.some(h=>h.r===rid);
/** Ghi tin người chơi biết qua đường khác (NPC kể, nhóm chat). */
export function hear(s:GameState,rid:string,how:Heard['how']):GameState{return{...s,gossip:heardWith(gossipOf(s),rid,s.day,how)}}
/** NPC kể tin cho người chơi khi nói chuyện riêng (từ Quen biết): câu kể và mã tin, hoặc null. Người chơi đứng vào chỗ B. */
export function npcTells(s:GameState,npc:NpcProfile,salt:string):{text:string;rumor:string}|null{const list=rumorsOn(s).filter(r=>r.about!==npc.id&&!heardIt(s,r.id)&&knows(s,r,npc));if(!list.length)return null;const r=pick(list,`ntell:${salt}`),c=r.ev==='price'?undefined:castById(s,r.about);
 const t=pick(r.ev==='price'?PRICE_OPEN:openFor(r),`nt:${salt}`).text.replace(/\{aS\}/g,npc.self).replace(/\{bN\}|\{bY\}|\{aY\}/g,npc.you).replace(/\{c\}/g,c?refTo(npc,c):'').replace(/\{r\}/g,rumorText(r)).replace(/\{thing\}/g,rumorText(r));
 return{text:cap(t),rumor:r.id}}

export function validGossip(v:unknown,day:number):v is GossipState{if(!v||typeof v!=='object')return false;const g=v as GossipState,int=(x:unknown,lo=0,hi=day)=>Number.isInteger(x)&&(x as number)>=lo&&(x as number)<=hi;
 if(g.version!==1||!Array.isArray(g.heard)||!Array.isArray(g.told)||g.heard.length>RUMOR.heardMax||g.told.length>RUMOR.toldMax)return false;if(g.scene!==undefined&&!int(g.scene))return false;
 if(g.d!==undefined&&(typeof g.d!=='object'||Object.entries(g.d).some(([k,x])=>{const [a,b]=k.split('|');return!a||!b||!isNpcId(a)||!isNpcId(b)||!int(x,TIE.min,TIE.max)})))return false;
 if(!g.heard.every(h=>h&&parseRumor(h.r)&&int(h.day)&&['over','npc','chat'].includes(h.how)))return false;
 if(!g.told.every(t=>t&&parseRumor(t.r)&&isNpcId(t.to)&&int(t.day)&&(t.out===undefined||int(t.out,0,day+3))&&(t.done===undefined||typeof t.done==='boolean')))return false;
 if(g.pending){const p=g.pending;if(typeof p.key!=='string'||!int(p.day)||!isNpcId(p.a)||!isNpcId(p.b)||!['chat','gossip','spat','price'].includes(p.kind)||!Array.isArray(p.lines)||p.lines.length>4||!p.lines.every(l=>l&&isNpcId(l.who)&&typeof l.text==='string'&&l.text.length<200)||(p.rumor!==undefined&&!parseRumor(p.rumor)))return false}
 return true}
