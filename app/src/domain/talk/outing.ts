/** #357: lời rủ thành hẹn thật. Câu rủ mang kế hoạch (lúc nào, ở đâu, làm gì); nhận lời thì NPC chốt giờ và có hẹn,
 * tới giờ tới chỗ thì đi cùng: chào hỏi, làm việc đó, chào về (đoạn tự diễn ngắn). Chủ dự án 06/11: NPC nói mình bao thì
 * NPC trả, người chơi nói mình bao thì người chơi trả, còn lại ai nấy trả; rủ cả nhóm cũng chỉ người rủ đi. */
import type {PlaceId} from '../types';
import type {NpcProfile} from '../npc';
import {hash} from '../shift';
import {dateAt} from '../format';
import {places} from '../places';
import {playerAddress} from './replies';
import {speaksUp,type SceneLine} from './interlude';

export type OutAct='eat'|'drink'|'run'|'walk'|'chess'|'visit'|'sport'|'out'|'fish'|'show';
export const OUT_ACTS:readonly OutAct[]=['eat','drink','run','walk','chess','visit','sport','out','fish','show'];
export type PlanAt='now'|'noon'|'afternoon'|'afterwork'|'evening'|'tmr-morning'|'tmr-afternoon'|'weekend'|'sun'|'thu-evening';
export const PLAN_ATS:readonly PlanAt[]=['now','noon','afternoon','afterwork','evening','tmr-morning','tmr-afternoon','weekend','sun','thu-evening'];
/** Kế hoạch gắn trên mảnh câu rủ. `place` thiếu thì ở ngay chỗ đang đứng; `pay: 'npc'` khi câu rủ là NPC mời. */
export interface Plan{at:PlanAt;act:OutAct;place?:PlaceId;pay?:'npc'}
export type Pay='npc'|'me'|'each';
export const PAYS:readonly Pay[]=['npc','me','each'];

/** Giờ hẹn (phút trong ngày) và cách tính ngày. dow: 0 Chủ nhật ... 6 Thứ bảy. */
const AT:Record<Exclude<PlanAt,'now'>,{min:number;day:(day:number,dow:number,minute:number)=>number}>={
 noon:{min:720,day:d=>d},afternoon:{min:960,day:d=>d},afterwork:{min:1050,day:d=>d},evening:{min:1140,day:d=>d},
 'tmr-morning':{min:450,day:d=>d+1},'tmr-afternoon':{min:960,day:d=>d+1},
 /* cuối tuần: thứ bảy 16:00; đang thứ bảy thì hôm nay (qua giờ thì chủ nhật), đang chủ nhật thì hôm nay (qua giờ thì thứ bảy tới) */
 weekend:{min:960,day:(d,w,m)=>w===6?(m+30<=960?d:d+1):w===0?(m+30<=960?d:d+6):d+(6-w)},sun:{min:480,day:(d,w,m)=>w===0&&m+30<=480?d:d+((7-w)%7||7)},'thu-evening':{min:1140,day:(d,w,m)=>d+((4-w+7)%7||(m<1080?0:7))}};
const dowOf=(day:number)=>dateAt(day).getUTCDay();
/** Ngày, giờ hẹn từ kế hoạch; giờ trong hôm nay đã qua (còn dưới 30 phút) thì dời sang mai. */
export function whenOf(plan:Plan,day:number,minute:number):{day:number;minute:number}{if(plan.at==='now')return{day,minute};const a=AT[plan.at];let d=a.day(day,dowOf(day),minute);if(d===day&&minute+30>a.min)d=day+1;/* "mai" dời qua mốc tuần thì vẫn là ngày kế */return{day:d,minute:a.min}}
const CLOCK:Record<number,string>={450:'7 rưỡi sáng',480:'8 giờ sáng',720:'12 giờ trưa',960:'4 giờ chiều',1050:'5 rưỡi chiều',1140:'7 giờ tối'};
const DOW=['chủ nhật','thứ hai','thứ ba','thứ tư','thứ năm','thứ sáu','thứ bảy'];
/** "4 giờ chiều nay", "7 rưỡi sáng mai", "4 giờ chiều thứ bảy". */
export function timeText(at:{day:number;minute:number},today:number){const c=CLOCK[at.minute]??`${Math.floor(at.minute/60)} giờ`;return`${c} ${at.day===today?'nay':at.day===today+1?'mai':DOW[dowOf(at.day)]}`}
const lower=(x:string)=>x.charAt(0).toLowerCase()+x.slice(1);
/** "ở quán ăn vỉa hè", "ở nhà cô" (qua nhà). */
export function whereText(act:OutAct,place:PlaceId,npc:NpcProfile){if(act==='visit')return`ở nhà ${npc.self==='mình'?'mình':npc.self}`;const p=places.find(x=>x.id===place);return`ở ${lower(p?.name??'chỗ cũ')}`}

/** Chi phí và tác dụng mỗi việc (tiền là một phần, người chơi bao thì gấp đôi, NPC bao thì 0). */
export const OUT:Record<OutAct,{minutes:number;price:number;fullness?:number;energy?:number;mood:number;topic:string}>={
 eat:{minutes:45,price:40000,fullness:40,mood:5,topic:'đi ăn chung'},drink:{minutes:30,price:20000,fullness:5,mood:4,topic:'đi uống nước chung'},
 run:{minutes:40,price:0,energy:12,mood:5,topic:'chạy bộ cùng'},walk:{minutes:30,price:0,energy:4,mood:5,topic:'đi dạo cùng'},
 chess:{minutes:45,price:0,mood:4,topic:'đánh cờ chung'},visit:{minutes:45,price:0,fullness:15,mood:5,topic:'qua nhà chơi'},
 sport:{minutes:60,price:0,energy:15,mood:6,topic:'chơi thể thao chung'},out:{minutes:90,price:50000,mood:8,topic:'đi chơi chung'},
 fish:{minutes:120,price:0,energy:5,mood:7,topic:'đi câu cá chung'},show:{minutes:60,price:30000,mood:6,topic:'đi chơi chung'}};
/** Cộng quan hệ khi đi cùng (việc có chủ đích, như Giúp) và trọng số ký ức. */
export const OUT_RELATION=4,OUT_WEIGHT=3;
export const priceFor=(act:OutAct,pay:Pay)=>pay==='npc'?0:pay==='me'?OUT[act].price*2:OUT[act].price;

const fillNpc=(t:string,n:NpcProfile)=>t.replace(/\{(self|you|You|Self|name)\}/g,(_,k:string)=>k==='name'?n.name:k==='self'?n.self:k==='you'?n.you:k==='You'?cap(n.you):cap(n.self));
const fillMe=(t:string,n:NpcProfile)=>{const {call,me}=playerAddress(n);return t.replace(/\{(call|me)\}/g,(_,k:string)=>k==='call'?call:me)};
const cap=(x:string)=>x.charAt(0).toUpperCase()+x.slice(1);
const pick=<T>(xs:readonly T[],seed:string)=>xs[hash(seed)%xs.length]!;

/** Lúc nhận lời: NPC chốt giờ, người chơi đáp. */
export function confirmLines(n:NpcProfile,said:string,act:OutAct,place:PlaceId,at:{day:number;minute:number},today:number,seed:string):SceneLine[]{
 const when=timeText(at,today),where=whereText(act,place,n),up=speaksUp(n),go=act==='visit'?'qua':'ra';
 const npc=fillNpc(pick([`Vậy ${when} ${where} nha {you}.`,`Chốt ${when} ${where} nha {you}.`],`${seed}:c`),n);
 const me=fillMe(up?pick([`Dạ, tới giờ {me} ${go} nha {call}.`,`Dạ, ${when} {me} ${go} nha {call}.`],`${seed}:b`):pick(['Ừ, tới giờ gặp nha {call}.',`Ừ, ${when} nha {call}.`],`${seed}:b`),n);
 return[{who:'me',text:said},{who:'npc',text:npc},{who:'me',text:me}]}
/** NPC trả lời "Mấy giờ vậy": nói giờ, chỗ, hỏi lại có đi không. */
export const askBackText=(n:NpcProfile,act:OutAct,place:PlaceId,at:{day:number;minute:number},today:number)=>cap(`${timeText(at,today)} ${whereText(act,place,n)} đó, ${n.you} đi không?`);

/** Câu NPC chào khi người chơi tới chỗ hẹn và nút đi cùng. */
const HELLO:Record<OutAct,string[]>={eat:['{You} tới rồi hả, ngồi đi, gọi món luôn nha.','Ngồi đi {you}, {self} chờ nãy giờ.'],drink:['{You} tới rồi hả, ngồi đi, uống gì gọi luôn.','Ngồi đi {you}, ở đây nước ngon lắm.'],
 run:['Tới rồi hả, khởi động chút rồi chạy nha {you}.'],fish:['Tới rồi hả, {self} mang sẵn cần cho {you} rồi.'],show:['Tới rồi hả, vô coi thôi {you}.'],walk:['Tới rồi hả, đi thôi {you}.'],chess:['Ngồi xuống đi {you}, {self} bày cờ rồi.'],visit:['Vô nhà đi {you}, {self} dọn sẵn rồi.'],sport:['Tới rồi hả, vô làm vài trận nha {you}.'],out:['Tới rồi hả, đi thôi {you}.']};
const GO:Record<OutAct,string>={fish:'Ngồi câu',show:'Vô coi',eat:'Ngồi xuống ăn',drink:'Ngồi xuống uống',run:'Chạy thôi',walk:'Đi thôi',chess:'Ngồi đánh một ván',visit:'Vô nhà',sport:'Vô chơi',out:'Đi thôi'};
export const helloText=(n:NpcProfile,act:OutAct,seed:string)=>fillNpc(pick(HELLO[act],seed),n);
export const goLabel=(act:OutAct)=>GO[act];
export const skipLabel=(n:NpcProfile)=>fillMe('Xin lỗi, {me} có việc phải đi',n);

/** Đoạn đi cùng: câu dẫn (kèm ai trả tiền), câu chốt của NPC, câu chào về. */
const LEAD:Record<OutAct,string[]>={eat:['Hai người ngồi ăn, nói chuyện một hồi.','Hai người vừa ăn vừa kể chuyện, chẳng mấy chốc hết tô.'],drink:['Hai người ngồi uống nước, nói chuyện một hồi.','Hai người ngồi nhâm nhi ly nước, ngó người qua lại.'],
 run:['Hai người chạy mấy vòng, mồ hôi nhễ nhại.'],walk:['Hai người đi dạo một vòng, vừa đi vừa nói chuyện.'],chess:['Hai người đánh mấy ván cờ, thắng thua qua lại.'],
 visit:['{name} mời bạn ăn uống, hai người ngồi nói chuyện một hồi.'],sport:['Hai người chơi một trận ra trò.'],out:['Hai người đi chơi một vòng, nói đủ thứ chuyện.'],
 fish:['Hai người ngồi câu cá bên hồ một buổi, cá cắn lai rai.'],show:['Hai người đi coi triển lãm, đứng ngắm từng bức một hồi.']};
/** Đi chơi theo chỗ: trung tâm thương mại là coi phim, chợ là chợ đêm. */
const OUT_AT:Partial<Record<PlaceId,string>>={mall:'Hai người đi coi phim, ra về còn bàn tán mãi.',market:'Hai người đi dạo chợ đêm, ăn vặt lai rai.'};
const PAID:Record<Pay,string>={npc:' {name} giành trả tiền.',me:' Bạn trả tiền cả hai phần.',each:' Xong rồi ai nấy trả phần mình.'};
const CLOSE:Record<OutAct,string[]>={eat:['Ăn với {you} vui ghê.','Bữa nay ăn ngon miệng hẳn.'],drink:['Ngồi với {you} vui ghê.','Bữa nay ngồi nói chuyện đã ghê.'],run:['Chạy với {you} đã ghê.'],walk:['Đi với {you} vui ghê.'],chess:['{You} đánh cờ cũng khá đó.'],fish:['Bữa nay câu được mấy con, vui ghê.','Ngồi câu với {you} mà quên giờ.'],show:['Coi với {you} vui ghê.'],visit:['Có {you} ghé chơi nhà vui hẳn.'],sport:['{You} chơi được đó.'],out:['Đi với {you} vui ghê.']};
export function outingLines(n:NpcProfile,act:OutAct,pay:Pay,seed:string,place?:PlaceId):SceneLine[]{const up=speaksUp(n),paid=OUT[act].price>0&&act!=='visit';
 const lead=fillNpc((act==='out'&&place&&OUT_AT[place]?OUT_AT[place]!:pick(LEAD[act],`${seed}:l`))+(paid?PAID[pay]:''),n),close=fillNpc(pick(CLOSE[act],`${seed}:c`),n);
 const bye=fillMe(pay==='npc'&&paid||act==='visit'?(up?'Dạ, {me} cảm ơn {call} nha.':'Ừ, cảm ơn nha {call}.'):up?pick(['Dạ, bữa nào mình đi nữa nha {call}.','Dạ, {me} về nha {call}.'],`${seed}:b`):pick(['Ừ, bữa nào đi nữa nha {call}.','Ừ, {me} về nha {call}.'],`${seed}:b`),n);
 return[{who:'narr',text:lead},{who:'npc',text:close},{who:'me',text:bye}]}
