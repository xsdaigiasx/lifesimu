/** #354 đoạn tự diễn: người chơi chọn câu kéo dài chuyện thì không bấm thêm lượt, mà hiện câu mình vừa nói,
 * một câu dẫn chung chung kiểu kể chuyện (đổi theo chỗ và việc), NPC chốt một câu, người chơi chào một câu.
 * Giọng người chơi "Dạ" với người lớn, "Ừ" với người cùng tuổi hoặc nhỏ hơn; câu ngắn để danh xưng cuối câu. */
import type {PlaceId} from '../types';
import type {NpcProfile} from '../npc';
import {hash} from '../shift';
import {playerAddress} from './replies';
import {SELLERS} from './npc-life';
import type {Channel,Intent,Tier} from './types';

export type SceneWho='me'|'npc'|'narr';
export interface SceneLine{who:SceneWho;text:string}
export type SceneKind='talk'|'help'|'invite'|'forgive';
/** Phút đoạn tự diễn tốn (ngoài 5 phút của câu vừa chọn). */
export const SCENE_MINUTES=10;

/** Loại việc của câu dẫn: chạy bộ thì câu chào mới được "mai chạy tiếp". */
type Lead={text:string;run?:true;from?:number;to?:number;seller?:true;buyer?:true};
const L=(text:string,o:Omit<Lead,'text'>={}):Lead=>({text,...o});
const PARK=[L('Hai người chạy bộ cùng nhau một hồi.',{run:true,to:600}),L('Hai người chạy bộ cùng nhau một hồi.',{run:true,from:1020}),L('Hai người đi dạo quanh hồ một vòng.'),L('Hai người ngồi ghế đá nói chuyện một hồi.')];
const EAT=[L('Hai người ngồi ăn, nói chuyện rôm rả một hồi.'),L('Hai người ngồi lại thêm một lúc tới khi ly trà đá cạn.')];
const HOME=[L('Hai người ngồi trước hiên nói chuyện một hồi.'),L('Hai người ngồi trước hiên hóng gió tới lúc đèn đường bật.',{from:1050,to:1140}),L('Hai người ngồi trước hiên hóng gió một hồi.',{from:1140})];
const LEADS:Partial<Record<PlaceId,Lead[]>>={park:PARK,lake:PARK,streetfood:EAT,restaurant:EAT,home:HOME,apartments:HOME,villa:HOME,
 market:[L('Hai người đứng bên sạp nói chuyện qua lại một hồi.',{seller:true}),L('{Name} vừa bán vừa nói chuyện với bạn một lúc.',{seller:true}),L('Hai người đứng giữa chợ nói chuyện một hồi.',{buyer:true})],
 office:[L('Giờ nghỉ, hai người đứng ở góc pha nước nói chuyện một hồi.'),L('Hai người ra hành lang nói chuyện một lúc cho đỡ mỏi mắt.')]};
const ANY=[L('Hai người đứng nói chuyện một hồi.')];

/** Câu chốt của NPC ({self} NPC tự xưng, {you} NPC gọi người chơi). */
const CLOSE_BY_KIND:Record<Exclude<SceneKind,'talk'>,string[]>={help:['Có {you} phụ đỡ ghê.','Nhờ {you} mà xong sớm ghê.'],invite:['Vậy nha, tới bữa {self} kêu {you}.','Vậy là có người đi chung rồi.'],forgive:['Nói ra được vậy {self} nhẹ người ghê.','Vậy là hết khúc mắc rồi nha.']};
const CLOSE_BY_INTENT:Partial<Record<Intent,string[]>>={complain:['Kể ra được nhẹ lòng hẳn, cảm ơn {you} nha.','Có người nghe {self} than là đỡ rồi.'],brag:['Có người nghe {self} khoe là vui rồi.','Kể cho {you} nghe mà {self} vui lây.']};
const CLOSE_BY_TIER:Record<Tier,string[]>={hostile:['Thôi vậy nha.'],stranger:['Nói chuyện với {you} cũng vui.','Gặp {you} nói chuyện cũng vui.'],acquaint:['Nói chuyện với {you} vui ghê.','Có {you} nói chuyện vui hẳn.'],close:['Có {you} nói chuyện đỡ buồn ghê.','Nói chuyện với {you} hoài không chán.'],bestie:['Lâu rồi mới nói chuyện đã vậy.','Nói với {you} chuyện gì cũng thấy nhẹ.']};
/** Đuôi câu chốt theo người và chỗ (chỉ thêm khi câu chốt ngắn, không phải chuyện giúp hay làm lành). */
const TAIL={seller:'thôi {self} bán tiếp',old:'thôi {self} về nghỉ',office:'thôi vô làm tiếp'};

/** Câu chào của người chơi ({call} người chơi gọi NPC, {me} người chơi tự xưng). */
const BYE_UP={talk:['Dạ, {me} đi nha {call}.','Dạ, {me} về trước nha {call}.'],run:['Dạ, mai chạy tiếp nha {call}.'],help:['Dạ, có gì {call} cứ kêu {me}.'],invite:['Dạ, tới bữa {call} kêu {me} nha.'],forgive:['Dạ, vậy {me} yên tâm rồi {call}.'],old:['Dạ, giữ sức khoẻ nha {call}.','Dạ, {me} chào {call}.'],call:['Dạ, {me} cúp máy nha {call}.']};
const BYE_PEER={talk:['Ừ, {me} đi nha {call}.','Ừ, mai gặp nha {call}.'],run:['Ừ, mai chạy tiếp nha {call}.'],help:['Ừ, có gì cứ kêu {me} nha {call}.'],invite:['Ừ, tới bữa nhắn {me} nha {call}.'],forgive:['Ừ, vậy là xong nha {call}.'],old:[] as string[],call:['Ừ, {me} cúp máy nha {call}.']};
const MOM={close:['Thôi con nghỉ đi, nhớ ăn uống đàng hoàng nghe.','Nghe giọng con là mẹ yên tâm rồi.'],bye:['Dạ, con nhớ rồi, mẹ ngủ sớm nha.','Dạ, con cúp máy nha mẹ.']};

const cap=(x:string)=>x.charAt(0).toUpperCase()+x.slice(1);
/** Người chơi nói "Dạ" (người lớn hơn) hay "Ừ" (cùng tuổi, nhỏ hơn). */
export const speaksUp=(n:NpcProfile)=>!['mình','em'].includes(n.self);
const pick=<T>(xs:readonly T[],seed:string,k:string)=>xs[hash(`${seed}:${k}`)%xs.length]!;

export interface SceneIn{npc:NpcProfile;kind:SceneKind;intent:Intent;tier:Tier;channel:Channel;place?:PlaceId;minute:number;seed:string;/** câu người chơi vừa chọn (mở đầu đoạn) */said:string}
/** Ghép đoạn tự diễn: câu người chơi vừa nói, câu dẫn, câu chốt của NPC, câu chào. */
export function sceneOf(c:SceneIn):SceneLine[]{const n=c.npc,{call,me}=playerAddress(n),up=speaksUp(n),old=n.age>=60,seller=SELLERS.includes(n.id),mom=n.self==='mẹ';
 const fillNpc=(t:string)=>t.replace(/\{(self|you|Self|You)\}/g,(_,k:string)=>{const v=k.toLowerCase()==='self'?n.self:n.you;return k[0]==='S'||k[0]==='Y'?cap(v):v});
 const fillMe=(t:string)=>t.replace(/\{(call|Call|me|Me)\}/g,(_,k:string)=>{const v=k.toLowerCase()==='call'?call:me;return k[0]==='C'||k[0]==='M'?cap(v):v});
 /* câu dẫn */
 let lead:Lead;
 if(c.channel==='call')lead=L(mom?'Hai mẹ con nói chuyện điện thoại một hồi.':n.family?'Hai anh em nói chuyện điện thoại một hồi.':'Hai người nói chuyện điện thoại một hồi.');
 else if(c.kind==='help')lead=L(seller&&c.place==='market'?'Bạn phụ {who} dọn hàng, hai người vừa làm vừa nói chuyện.':'Bạn phụ {who} một tay, hai người vừa làm vừa nói chuyện.');
 else if(c.kind==='forgive')lead=L('Hai người nói chuyện lại với nhau, chuyện cũ coi như bỏ qua.');
 else if(c.kind==='invite')lead=L('Hai người bàn chuyện đi chơi một hồi.');
 else{const all=(c.place&&LEADS[c.place])||ANY,fit=all.filter(l=>(l.from===undefined||c.minute>=l.from)&&(l.to===undefined||c.minute<l.to)&&(!l.seller||seller)&&(!l.buyer||!seller));lead=pick(fit.length?fit:ANY,c.seed,'lead')}
 /* người chơi gọi NPC bằng danh xưng; bạn cùng tuổi thì gọi tên trong câu dẫn */
 const who=call==='bạn'?n.name:call,leadText=lead.text.replace('{who}',who).replace('{Name}',n.name);
 /* câu chốt */
 let close:string;
 if(mom)close=pick(MOM.close,c.seed,'close');
 else{const base=c.kind!=='talk'?CLOSE_BY_KIND[c.kind]:CLOSE_BY_INTENT[c.intent]&&hash(`${c.seed}:ci`)%2?CLOSE_BY_INTENT[c.intent]!:CLOSE_BY_TIER[c.tier];close=fillNpc(pick(base,c.seed,'close'));
  const tail=c.kind==='talk'&&c.channel==='face'&&CLOSE_BY_TIER[c.tier].includes(pick(base,c.seed,'close'))?(seller&&c.place==='market'?TAIL.seller:old?TAIL.old:c.place==='office'?TAIL.office:undefined):undefined;
  if(tail)close=close.replace(/\.$/,`, ${fillNpc(tail)}.`)}
 /* câu chào */
 let bye:string;
 if(mom)bye=pick(MOM.bye,c.seed,'bye');
 else{const B=up?BYE_UP:BYE_PEER,set=c.channel==='call'?B.call:c.kind!=='talk'?B[c.kind]:lead.run?B.run:old&&up&&hash(`${c.seed}:old`)%2?B.old:B.talk;bye=fillMe(pick(set,c.seed,'bye'))}
 return[{who:'me',text:c.said},{who:'narr',text:leadText},{who:'npc',text:close},{who:'me',text:bye}]}
