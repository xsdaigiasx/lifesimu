/** H7b: tuổi, sinh nhật, vòng đời và người nối tiếp của NPC (HOI-THOAI I.5c).
 * Chủ dự án duyệt 06/11: mất rất hiếm (gần như không trước 70, tăng dần từ 75, có dấu hiệu yếu dần trước);
 * con nối nghiệp sau 7 ngày, không có con thì người mới tới sau 14 ngày; quà sinh nhật chọn từ Túi và Tủ bếp;
 * sinh nhật người chơi rút theo seed đời chơi.
 * Mã vai luôn chỉ người đang giữ vai. Khi một người mất hoặc rời đi, dữ liệu gắn với họ (quan hệ, tin nhắn, ký ức)
 * được dọn khỏi mã vai; Nhật ký, tổng kết năm đổi sang mã lưu trữ `vai.đời` để còn đọc được tên. */
import type {GameState,GameResult} from './types';
import {ROLES,roleDef,rosterOf,personFor,pickHolder,setGoneLookup,worldSeed,ageAt,isBirthday,monthDay,isNpcId,mix,FAMILY_IDS,townOn,rosterK,type NpcProfile,type Holder,type HeirSeed,type RosterCycle,type Who} from './npc';
import {hash} from './shift';
import {TOWN_IDS,TOWN_PLACES,archOf} from './town-data';
import {dateAt} from './format';
import {recordJournal} from './journal';
import {socialOf,adjustRelation} from './social';
import {storyOf} from './director';
import {inboxOf,type Msg} from './inbox';
import {talkOf} from './talk/state';
import {clockOf,spendTime} from './time';
import {lifeOf,INGREDIENTS,EAT_OUT,RECIPES} from './life';

export interface Gone{/** mã lưu trữ `vai.đời` */id:string;role:string;h:Holder;day:number;why:'died'|'left';/** điểm quan hệ lúc ra đi */score:number;/** ngày người chơi đến viếng */visit?:number}
export interface CycleState extends RosterCycle{version:1;gone:Gone[];
 /** người chơi đã biết sinh nhật (từ bậc Thân, hoặc người thân) */known:string[];
 /** ngày gần nhất người chơi chúc hoặc tặng quà sinh nhật từng người */wished:Record<string,number>}
export const CYCLE={heirDays:7,newDays:14,heirAge:20,frailMin:20,frailSpan:21,holdMax:60,goneMax:60,
 /** quan hệ: chúc sinh nhật, tặng quà, quà hợp ý, quên sinh nhật Tri kỷ, con người thân bắt đầu ở Quen biết, cộng thêm nếu đã đến viếng */
 wish:4,gift:5,liked:9,forget:-4,heirStart:10,visited:5,knowAt:30,funeralDays:2,visitMinutes:60} as const;
export const cycleOf=(s:Pick<GameState,'cycle'>):CycleState=>s.cycle??{version:1,holders:{},vacant:{},frail:{},gone:[],known:[],wished:{}};

/** Xác suất mất mỗi năm theo tuổi: gần như không trước 70, tăng dần từ 75. */
export function yearlyRisk(age:number){return age<50?.0001:age<60?.0003:age<70?.001:age<75?.01:age<80?.04:age<85?.08:age<90?.15:.3}
const roll=(world:string,salt:string,n:number)=>mix(hash(`${world}:${salt}`))%n;
const archiveId=(role:string,gen:number)=>`${role}.${gen}`;
export const holderOf=(cy:CycleState,role:string):Holder=>cy.holders[role]??{gen:0,k:0,since:0};

setGoneLookup((s:Who,id:string)=>{const cy=(s as Pick<GameState,'cycle'>).cycle;const g=cy?.gone.find(x=>x.id===id);if(!g)return undefined;const p=personFor(worldSeed(s),g.role,g.h);
 return p?{...p,id,age:ageAt(p.born,g.day),gone:g.why,remote:true,schedule:[]}:undefined});

// ---------- Sinh nhật
/** Sinh nhật người chơi (mã tháng ngày) rút từ seed đời chơi, tránh 29/2. */
export function playerBirthday(s:Pick<GameState,'seed'>){const doy=mix(hash(`${s.seed?.life??'life'}:bday`))%365,d=new Date(Date.UTC(2027,0,1+doy));return d.getUTCMonth()*100+d.getUTCDate()}
export const isPlayerBirthday=(s:Pick<GameState,'seed'>,day:number)=>playerBirthday(s)===monthDay(day);
const scoreOf=(s:GameState,id:string)=>socialOf(s).relations[id]?.score??0;
export const knowsBirthday=(s:GameState,id:string)=>FAMILY_IDS.includes(id)||cycleOf(s).known.includes(id)||scoreOf(s,id)>=CYCLE.knowAt;
/** Sinh nhật người quen (người chơi đã biết) rơi vào ngày `day`. */
export const birthdaysOn=(s:GameState,day:number)=>rosterOf({...s,day}).filter(n=>isBirthday(n.born,day)&&knowsBirthday(s,n.id));
/** Sinh nhật đã biết trong tháng của ngày `day`: [ngày trong tháng, người]. */
export function birthdaysInMonth(s:GameState,day:number):{date:number;npc:NpcProfile}[]{const m=dateAt(day).getUTCMonth();return rosterOf(s).filter(n=>knowsBirthday(s,n.id)&&dateAt(n.born).getUTCMonth()===m).map(n=>({date:dateAt(n.born).getUTCDate(),npc:n})).sort((a,b)=>a.date-b.date)}
export const wishedToday=(s:GameState,id:string)=>cycleOf(s).wished[id]===s.day;

/** Món có thể tặng: món mang về trong Túi, nguyên liệu và món đã nấu trong Tủ bếp (không lấy đồ trong Tủ lạnh). */
export interface GiftOption{src:'bag'|'pantry'|'meal';id:string;name:string;taste:string}
export function giftOptions(s:GameState):GiftOption[]{const l=lifeOf(s),d=s.day;
 return[...(l.bag??[]).filter(b=>!b.cold&&b.expiresDay>d).map(b=>({src:'bag' as const,id:b.id,name:EAT_OUT[b.out].name,taste:b.out as string})),
  ...l.pantry.filter(p=>!p.cold&&p.expiresDay>d&&p.qty>0).map((p,i)=>({src:'pantry' as const,id:`${p.ingredient}:${i}`,name:`${INGREDIENTS[p.ingredient].name} (${p.qty})`,taste:p.ingredient as string})),
  ...l.meals.filter(m=>!m.cold&&m.expiresDay>d).map(m=>({src:'meal' as const,id:m.id,name:RECIPES[m.recipe].name,taste:'meal'}))]}
/** Tặng quà sinh nhật tận tay: chỉ đúng ngày, người đó đang ở đây, mỗi năm một lần. Quà hợp ý được nhiều điểm hơn. */
export function giveBirthdayGift(s:GameState,id:string,src:GiftOption['src'],itemId:string):GameResult&{liked?:boolean}{
 const npc=rosterOf(s).find(n=>n.id===id),c=clockOf(s);if(!npc||npc.remote)return{ok:false,error:'Không tìm thấy người này.'};
 if(!isBirthday(npc.born,s.day)||!knowsBirthday(s,id))return{ok:false,error:'Hôm nay không phải sinh nhật người này.'};
 if(wishedToday(s,id))return{ok:false,error:'Hôm nay đã chúc mừng rồi.'};
 const opt=giftOptions(s).find(o=>o.src===src&&o.id===itemId);if(!opt)return{ok:false,error:'Không tìm thấy món này.'};
 const r=spendTime(s,5);if(!r.ok)return r;let n=r.state;const l=structuredClone(lifeOf(n));
 if(src==='bag')l.bag=(l.bag??[]).filter(b=>b.id!==itemId);else if(src==='meal')l.meals=l.meals.filter(m=>m.id!==itemId);else{const i=Number(itemId.split(':')[1]),lots=l.pantry.filter(p=>!p.cold&&p.expiresDay>s.day&&p.qty>0),lot=lots[i];l.pantry=l.pantry.filter(p=>p!==lot)}
 n={...n,life:l};const liked=npc.likes.includes(opt.taste);
 n=adjustRelation(n,id,liked?CYCLE.liked:CYCLE.gift);n=wish(n,id);
 const st=storyOf(n);n={...n,story:{...st,memories:[...st.memories,{id:`m-bday-${id}-${s.day}`,day:s.day,npc:id,motif:'greet',topic:'quà sinh nhật',tag:'gift',weight:liked?5:4}]}};
 n=recordJournal(n,`bday-gift:${s.day}:${id}`,`Tặng quà sinh nhật ${npc.name}`,liked?`Tặng ${opt.name.toLowerCase()}, đúng món ${npc.self} thích.`:`Tặng ${opt.name.toLowerCase()}.`,id);void c;
 return{ok:true,state:n,liked}}
const wish=(s:GameState,id:string):GameState=>{const cy=cycleOf(s);return{...s,cycle:{...cy,wished:{...cy.wished,[id]:s.day}}}};
/** Nhắn chúc mừng sinh nhật (qua điện thoại), mỗi năm một lần, đúng ngày. */
export function wishBirthday(s:GameState,id:string):GameResult{const npc=rosterOf(s).find(n=>n.id===id);if(!npc)return{ok:false,error:'Không tìm thấy người này.'};
 if(!isBirthday(npc.born,s.day)||!knowsBirthday(s,id))return{ok:false,error:'Hôm nay không phải sinh nhật người này.'};if(wishedToday(s,id))return{ok:false,error:'Hôm nay đã chúc mừng rồi.'};
 const ib=inboxOf(s),seq=ib.seq+1,now=clockOf(s).minute,cap=(x:string)=>x.charAt(0).toUpperCase()+x.slice(1),fam=npc.family;
 const text=fam?(id==='me'?'Chúc mừng sinh nhật mẹ! Con thương mẹ nhiều.':`Sinh nhật vui vẻ nha ${npc.name}!`):`Chúc mừng sinh nhật ${npc.self}! Chúc ${npc.self} luôn khoẻ, vui.`;
 const back=id==='me'?'Mẹ cảm ơn con. Con nhớ giữ sức khoẻ nghe.':`${cap(npc.self)} cảm ơn ${npc.you} nhiều nha, nhớ tới ${npc.self} là vui rồi.`;
 const msgs:Msg[]=[{id:`m${seq}:me`,day:s.day,minute:now,from:'me',text,kind:'note',read:true},{id:`m${seq}:re`,day:s.day,minute:now,from:'npc',text:back,kind:'note',read:true}];
 let n:GameState={...s,inbox:{...ib,seq,threads:{...ib.threads,[id]:[...(ib.threads[id]??[]),...msgs].slice(-40)}}};
 n=adjustRelation(n,id,CYCLE.wish);n=wish(n,id);return{ok:true,state:recordJournal(n,`bday-wish:${s.day}:${id}`,`Chúc mừng sinh nhật ${npc.name}`,'Nhắn tin chúc mừng.',id)}}

/** Tin nhắn chúc sinh nhật người chơi: Mẹ và em luôn nhớ, người khác từ bậc Thân (tối đa 3). */
function playerBirthdayMessages(s:GameState):GameState{if(!isPlayerBirthday(s,s.day))return s;const ib=structuredClone(inboxOf(s)),day=s.day;
 const add=(npc:string,minute:number,text:string,replies:string[])=>{const id=`q${day}:${npc}:bday`;if(!ib.queue.some(q=>q.id===id))ib.queue.push({id,npc,day,minute,from:'npc',text,kind:'bday' as Msg['kind'],replies})};
 const live=rosterOf(s),h=(k:string)=>hash(`bday:${day}:${k}`);
 if(live.some(n=>n.id==='me'))add('me',450,['Sinh nhật vui vẻ nghe con. Mẹ nấu chè cúng ông bà rồi, con nhớ ăn bữa cho ngon.','Hôm nay sinh nhật con, mẹ chúc con mạnh khoẻ, làm ăn suôn sẻ.','Mẹ nhớ hôm nay ngày gì nha. Chúc mừng sinh nhật con trai của mẹ.'][h('me')%3]!,['Con cảm ơn mẹ','Mẹ nhớ giữ sức khoẻ nha']);
 const em=live.find(n=>n.id==='em');if(em)add('em',690,[`Sinh nhật vui vẻ nha ${em.you}! Nhớ bao em một bữa đó.`,`Chúc mừng sinh nhật ${em.you} hai! Già thêm một tuổi rồi nha.`][h('em')%2]!,['Cảm ơn em','Ừ, để anh bao']);
 const close=live.filter(n=>!n.family&&!n.remote&&scoreOf(s,n.id)>=CYCLE.knowAt).sort((a,b)=>scoreOf(s,b.id)-scoreOf(s,a.id)).slice(0,3);
 const cap=(x:string)=>x.charAt(0).toUpperCase()+x.slice(1);
 for(const n of close)add(n.id,600+h(n.id)%540,[`Nghe nói hôm nay sinh nhật ${n.you}. Chúc ${n.you} tuổi mới nhiều may mắn nha.`,`${cap(n.self)} chúc ${n.you} sinh nhật vui vẻ, mạnh khoẻ.`][h('v'+n.id)%2]!,['Cảm ơn nhiều nha','Hihi, cảm ơn']);
 return{...s,inbox:ib}}

// ---------- Vòng đời
/** Chuỗi chuyện đang dở với người này thì chưa để họ mất (I.5c). */
export function busyWith(s:GameState,id:string){const st=storyOf(s),ib=inboxOf(s);return st.pending?.npc===id||st.hooks.some(h=>h.npc===id&&h.to>=s.day)||st.loans.some(l=>l.npc===id&&!l.settled)||ib.appts.some(a=>a.npc===id&&a.status==='set')}
/** Dọn dữ liệu gắn với mã vai của người vừa ra đi; Nhật ký và tổng kết đổi sang mã lưu trữ. */
export function archive(s:GameState,role:string,aid:string):GameState{let n:GameState={...s};
 if(n.social){const rel={...n.social.relations};delete rel[role];n.social={...n.social,relations:rel}}
 if(n.inbox){const ib=structuredClone(n.inbox);delete ib.threads[role];delete ib.called[role];delete ib.hello[role];ib.queue=ib.queue.filter(q=>q.npc!==role);ib.appts=ib.appts.filter(a=>a.npc!==role);n.inbox=ib}
 if(n.story){const st=structuredClone(n.story);st.memories=st.memories.filter(m=>m.npc!==role);st.log=st.log.filter(l=>l.npc!==role);st.hooks=st.hooks.filter(h=>h.npc!==role);st.loans=st.loans.filter(l=>l.npc!==role);if(st.pending?.npc===role)delete st.pending;if(st.heard)delete st.heard[role];n.story=st}
 if(n.talk){const t=talkOf(n),prints={...t.prints};delete prints[role];n.talk={...t,prints,log:t.log.filter(l=>l.n!==role)}}
 if(n.office?.met?.includes(role))n.office={...n.office,met:n.office.met.filter(x=>x!==role)};
 if(n.journal)n.journal=n.journal.map(e=>e.npcId===role?{...e,npcId:aid}:e);
 if(n.summary)n.summary={...n.summary,list:n.summary.list.map(x=>({...x,people:x.people.map(p=>p.id===role?{...p,id:aid}:p)}))};
 if(n.life?.parcels)n.life={...n.life,parcels:n.life.parcels.map(p=>p.from===role?{...p,from:aid}:p)};
 return n}
const LEFT_TEXT:Record<string,string>={'town':'chuyển đi nơi khác sống',courier:'ra trường, chuyển đi làm nơi khác',landlord:'giao khu trọ cho người khác',neighbor:'về quê sống với con cháu'};
/** Một người rời vai (mất hoặc nghỉ): lưu trữ, mở chỗ trống chờ con nối nghiệp (7 ngày) hoặc người mới (14 ngày). */
export function depart(s:GameState,p:NpcProfile,why:'died'|'left'):GameState{const cy=structuredClone(cycleOf(s)),role=p.id,h0=holderOf(cy,role),h:Holder=roleDef(role)?.town?{...h0,...(cy.holders[role]?{}:{k:rosterK(worldSeed(s),role)}),...(p.arch?{a:p.arch}:{})}:h0,aid=archiveId(role,h.gen),score=scoreOf(s,role),def=roleDef(role)!,day=s.day;
 const heir=!!def.heir&&p.kid!==undefined&&ageAt(p.kid,day)>=CYCLE.heirAge;
 cy.gone=[...cy.gone,{id:aid,role,h,day,why,score}].slice(-CYCLE.goneMax);delete cy.frail[role];delete cy.holders[role];cy.known=cy.known.filter(x=>x!==role);delete cy.wished[role];
 /* H7a: ô NPC ngẫu nhiên không chờ người thay; ô trống cho người mới tới theo nhịp sinh của town.ts */
 if(def.town){cy.town={...cy.town,on:townOn(cy).filter(x=>x!==role)};cy.holders={...cy.holders,[role]:h}}
 else cy.vacant={...cy.vacant,[role]:{from:day,until:day+(heir?CYCLE.heirDays:CYCLE.newDays),gen:h.gen,...(heir?{heir:true}:{})}};
 let n=archive({...s,cycle:cy},role,aid);
 const known=score>=10||s.office?.met?.includes(role);
 if(known)n=why==='died'?recordJournal(n,`gone-died:${aid}`,`Tin buồn: ${p.name} đã mất`,`${p.name} ra đi nhẹ nhàng ở tuổi ${p.age}. Mọi người quanh ${p.role.toLowerCase()} báo tin, đám tang làm trong ${CYCLE.funeralDays} ngày.`,aid)
  :recordJournal(n,`gone-left:${aid}`,`${p.name} đã rời đi`,`${p.name} ${LEFT_TEXT[def.town?'town':role]??'nghỉ hưu, về sống gần con cháu'}.`,aid);
 return n}
/** Người nối tiếp vào vai: con nối nghiệp (mang họ, quê, một nét tính cách của cha mẹ, nhớ mang máng người chơi) hoặc người mới. */
function arrive(s:GameState,role:string):GameState{const cy=structuredClone(cycleOf(s)),v=cy.vacant[role]!,world=worldSeed(s),day=s.day;
 const last=[...cy.gone].reverse().find(g=>g.role===role),parent=last?personFor(world,role,last.h):undefined;
 const p:HeirSeed|undefined=v.heir&&parent&&parent.kid!==undefined?{fam:parent.fullName.split(' ')[0]!,origin:parent.origin,trait:parent.traits[0]!,born:parent.kid}:undefined;
 const h=pickHolder(world,role,v.gen+1,day,rosterOf(s),p);
 delete cy.vacant[role];cy.holders={...cy.holders,[role]:h};
 let n:GameState={...s,cycle:cy};const who=rosterOf(n).find(x=>x.id===role);
 if(who&&p&&last&&last.score>=CYCLE.knowAt){{const so=socialOf(n);n={...n,social:{...so,relations:{...so.relations,[role]:{score:CYCLE.heirStart+(last.visit!==undefined?CYCLE.visited:0),lastDay:day,minutes:0}}}}}
  n=recordJournal(n,`heir:${role}:${h.gen}`,`${who.name} nối nghiệp ${parent?.name??''}`,`${who.name} là con của ${parent?.name??''}, giờ ${who.role.toLowerCase()}. Nghe ${parent?.name??''} hay nhắc tới bạn.`,role)}
 return n}

/** Qua ngày (chạy sau settleStory): biết sinh nhật mới, quên sinh nhật Tri kỷ, yếu dần, mất, nghỉ, người nối tiếp, tin chúc sinh nhật người chơi. */
export function settleCycle(s:GameState):GameState{const world=worldSeed(s),day=s.day;let n=s;
 // biết sinh nhật từ bậc Thân, biết rồi thì nhớ luôn
 {const cy=cycleOf(n),add=rosterOf(n).filter(p=>!p.family&&scoreOf(n,p.id)>=CYCLE.knowAt&&!cy.known.includes(p.id)).map(p=>p.id);if(add.length)n={...n,cycle:{...cy,known:[...cy.known,...add]}}}
 // hôm qua sinh nhật người Tri kỷ mà không chúc
 for(const p of rosterOf({...n,day:day-1}))if(!p.family&&isBirthday(p.born,day-1)&&scoreOf(n,p.id)>=60&&knowsBirthday(n,p.id)&&cycleOf(n).wished[p.id]!==day-1){
  n=adjustRelation(n,p.id,CYCLE.forget,false);const st=storyOf(n);n={...n,story:{...st,memories:[...st.memories,{id:`m-bday-miss-${p.id}-${day}`,day:day-1,npc:p.id,motif:'greet',topic:'quên sinh nhật',tag:'missed',weight:3}]}}}
 // vòng đời của người đang giữ vai (Mẹ và em chỉ già đi)
 for(const p of rosterOf(n)){if(p.family)continue;const def=roleDef(p.id)!,cy=cycleOf(n),frail=cy.frail[p.id];
  if(frail!==undefined){const due=frail+CYCLE.frailMin+roll(world,`frail:${p.id}:${p.gen}`,CYCLE.frailSpan);if(day>=due&&(!busyWith(n,p.id)||day>=due+CYCLE.holdMax))n=depart(n,p,'died');continue}
  if(def.retire!==undefined&&p.age>=def.retire&&!busyWith(n,p.id)){n=depart(n,p,'left');continue}
  if(roll(world,`death:${p.id}:${p.gen}:${day}`,1_000_000)<yearlyRisk(p.age)/365*1_000_000)n={...n,cycle:{...cy,frail:{...cy.frail,[p.id]:day}}}}
 // chỗ trống tới hạn thì có người tới
 for(const role of Object.keys(cycleOf(n).vacant))if(day>=cycleOf(n).vacant[role]!.until)n=arrive(n,role);
 return playerBirthdayMessages(n)}

/** Đám tang người quen trong 2 ngày sau khi mất: người chơi có thể đến viếng (60 phút). */
export const funeralsOf=(s:GameState)=>cycleOf(s).gone.filter(g=>g.why==='died'&&g.score>=10&&s.day-g.day<CYCLE.funeralDays);
export function visitFuneral(s:GameState,aid:string):GameResult{const cy=cycleOf(s),g=funeralsOf(s).find(x=>x.id===aid);if(!g)return{ok:false,error:'Không còn đám tang này.'};if(g.visit!==undefined)return{ok:false,error:'Bạn đã đến viếng rồi.'};
 const c=clockOf(s);if(c.minute<420||c.minute>1200)return{ok:false,error:'Hãy đến viếng trong khoảng 7:00 tới 20:00.'};
 const r=spendTime(s,CYCLE.visitMinutes);if(!r.ok)return r;const p=personFor(worldSeed(s),g.role,g.h);
 const n:GameState={...r.state,cycle:{...cycleOf(r.state),gone:cy.gone.map(x=>x.id===aid?{...x,visit:s.day}:x)},mood:Math.max(0,r.state.mood-3)};
 return{ok:true,state:recordJournal(n,`funeral:${aid}`,`Viếng ${p?.name??''}`,'Thắp nén nhang, chia buồn cùng gia đình.',aid)}}

export function validCycle(v:unknown,day:number):v is CycleState{if(!v||typeof v!=='object')return false;const c=v as CycleState,int=(x:unknown,lo=-40000,hi=day+30)=>Number.isInteger(x)&&(x as number)>=lo&&(x as number)<=hi;
 const role=(k:string)=>!!roleDef(k);
 const holder=(h:Holder)=>!!h&&int(h.gen,0,999)&&int(h.k,0,80)&&int(h.since,0,day)&&(h.a===undefined||!!archOf(h.a))&&(h.o===undefined||(typeof h.o==='string'&&/^town-[a-l]:\d{1,3}$/.test(h.o)))&&(h.r===undefined||int(h.r,0,day))&&(h.p===undefined||(typeof h.p.fam==='string'&&h.p.fam.length<20&&typeof h.p.origin==='string'&&h.p.origin.length<30&&typeof h.p.trait==='string'&&h.p.trait.length<30&&int(h.p.born)));
 if(c.version!==1||!c.holders||typeof c.holders!=='object'||!c.vacant||typeof c.vacant!=='object'||!c.frail||typeof c.frail!=='object'||!Array.isArray(c.gone)||c.gone.length>CYCLE.goneMax||!Array.isArray(c.known)||c.known.length>ROLES.length||!c.wished||typeof c.wished!=='object')return false;
 if(!Object.entries(c.holders).every(([k,h])=>role(k)&&holder(h)))return false;
 if(!Object.entries(c.vacant).every(([k,x])=>role(k)&&!!x&&int(x.from,0,day)&&int(x.until,x.from,x.from+60)&&int(x.gen,0,999)&&(x.heir===undefined||x.heir===true)))return false;
 if(!Object.entries(c.frail).every(([k,d])=>role(k)&&int(d,0,day)))return false;
 if(!c.gone.every(g=>g&&isNpcId(g.id)&&g.id.includes('.')&&role(g.role)&&holder(g.h)&&int(g.day,0,day)&&['died','left'].includes(g.why)&&int(g.score,-1000,100000)&&(g.visit===undefined||int(g.visit,g.day,day))))return false;
 if(c.town!==undefined&&!(c.town&&Array.isArray(c.town.on)&&c.town.on.length<=TOWN_IDS.length&&new Set(c.town.on).size===c.town.on.length&&c.town.on.every(x=>TOWN_IDS.includes(x))&&(c.town.last===undefined||int(c.town.last,0,day))&&(c.town.been===undefined||(!!c.town.been&&typeof c.town.been==='object'&&Object.entries(c.town.been).every(([k,d])=>TOWN_PLACES.includes(k as never)&&int(d,0,day))))))return false;
 return c.known.every(k=>role(k))&&Object.entries(c.wished).every(([k,d])=>role(k)&&int(d,0,day))}
