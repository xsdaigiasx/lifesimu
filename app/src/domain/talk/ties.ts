/** H7c: quan hệ NPC với NPC (HOI-THOAI I.4b, gộp T63). Chủ dự án duyệt 06/11: quan hệ ẩn, chỉ lộ qua câu nói, không hiện trong hồ sơ.
 * Phần gốc tính từ seed thế giới, tính cách và nơi lui tới chung, không lưu; chỉ phần lệch do cảnh nhóm (người chơi bênh, hoà giải) lưu ở `gossip.d`. */
import type {GameState,PlaceId} from '../types';
import {rosterOf,mix,worldSeed,type NpcProfile} from '../npc';
import {hash} from '../shift';
import {SELLERS} from './npc-life';

export type TieKind='work'|'block'|'market'|'eat'|'park';
export interface Tie{kind:TieKind;score:number;rival:boolean}
const PLACE_KIND:Partial<Record<PlaceId,TieKind>>={home:'block',market:'market',streetfood:'eat',park:'park',office:'work'};
/** Điểm gốc −20 đến 49 theo seed; tính cách cộng trừ; hai người bán cùng chợ dễ cạnh tranh. Dưới −5 là đang khó chịu nhau. */
export const TIE={min:-50,max:80,rival:-5,traitUp:['vui vẻ','hay nói','tốt bụng','hào phóng'],traitDown:['cau có','keo kiệt','vội vàng'],seller:-10} as const;
export const pairKey=(a:string,b:string)=>a<b?`${a}|${b}`:`${b}|${a}`;

function sharedKind(a:NpcProfile,b:NpcProfile):TieKind|null{
 if(a.remote||b.remote||a.family||b.family)return null;
 if(a.company||b.company)return a.company&&a.company===b.company?'work':null;
 const pa=new Set(a.schedule.map(x=>x.place));for(const k of ['home','market','streetfood','park','office'] as PlaceId[])if(pa.has(k)&&b.schedule.some(x=>x.place===k))return PLACE_KIND[k]!;return null}
function baseScore(world:string,a:NpcProfile,b:NpcProfile){const t=[...a.traits,...b.traits];let v=mix(hash(`${world}:tie:${pairKey(a.id,b.id)}:${a.fullName}:${b.fullName}`))%70-20;
 v+=t.filter(x=>(TIE.traitUp as readonly string[]).includes(x)).length*4-t.filter(x=>(TIE.traitDown as readonly string[]).includes(x)).length*5;
 if(SELLERS.includes(a.id)&&SELLERS.includes(b.id))v+=TIE.seller;return v}
export const deltaOf=(s:Pick<GameState,'gossip'>,a:string,b:string)=>s.gossip?.d?.[pairKey(a,b)]??0;
/** Quan hệ giữa hai người đang giữ vai, hoặc null khi họ không có nơi lui tới chung. */
export function tieOf(s:GameState,a:NpcProfile,b:NpcProfile):Tie|null{if(a.id===b.id)return null;const kind=sharedKind(a,b);if(!kind)return null;
 const score=Math.max(TIE.min,Math.min(TIE.max,baseScore(worldSeed(s),a,b)+deltaOf(s,a.id,b.id)));return{kind,score,rival:score<TIE.rival}}
/** Những người có quan hệ với một người (để tin đồn lan theo cạnh). */
export function tiesOf(s:GameState,n:NpcProfile,roster=rosterOf(s)):{npc:NpcProfile;tie:Tie}[]{return roster.flatMap(o=>{const t=tieOf(s,n,o);return t?[{npc:o,tie:t}]:[]})}

/** Xưng hô giữa hai NPC theo chênh tuổi: `self` A tự xưng, `you` A gọi B (Nam Bộ, nói thường). */
export function between(a:NpcProfile,b:NpcProfile):{self:string;you:string;older:boolean;junior:boolean}{const d=b.age-a.age,bm=b.gender==='male',am=a.gender==='male';
 if(d>=20)return{self:'cháu',you:b.age>=60?(bm?'ông':'bà'):(bm?'chú':'cô'),older:false,junior:true};
 if(d>=6)return{self:'em',you:bm?'anh':'chị',older:false,junior:true};
 if(d>-6)return a.age<40?{self:'tui',you:bm?'ông':'bà',older:false,junior:false}:{self:'tôi',you:bm?'anh':'chị',older:false,junior:false};
 if(d>-20)return{self:am?'anh':'chị',you:'em',older:true,junior:false};
 return{self:a.age>=60?(am?'ông':'bà'):(am?'chú':'cô'),you:'cháu',older:true,junior:false}}
/** Tên gọi: chữ cuối họ tên. */
export const givenOf=(n:NpcProfile)=>n.fullName.trim().split(/\s+/).pop()!;
/** A gọi B: "chị Hoa", "chú Vinh"; người nhỏ hơn hoặc bằng vai trẻ thì gọi trống tên. */
export function callName(a:NpcProfile,b:NpcProfile){const x=between(a,b);return x.older||x.self==='tui'?givenOf(b):`${x.you} ${givenOf(b)}`}
