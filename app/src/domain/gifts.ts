/** Quà tặng thật (chủ dự án chốt 05/11): câu NPC hứa cho đồ thì phải cho thật, quà Mẹ gửi xe khách phải ra bến xe lấy.
 * Món tặng được lấy từ danh mục đồ có trong game (`giftItems`), thêm loại đồ mới chỉ cần thêm một tuyến nhận ở `receiveGift`. */
import type {GameState,GameResult} from './types';
import {INGREDIENTS,giftIngredient,lifeOf,type IngredientId} from './life';
import {clockOf} from './time';
import {recordJournal} from './journal';
import {nameOf} from './npc';

/** Loại đồ tặng được và nơi nó về: nguyên liệu vào Tủ bếp. Thêm nguyên liệu mới vào INGREDIENTS là tặng được ngay. */
export type GiftKind='ingredient';
export interface GiftItem{kind:GiftKind;ref:string;name:string}
let items:Record<string,GiftItem>|null=null;
/** Danh mục đồ tặng được (tính khi cần để tránh vòng import với life.ts). */
export const giftItems=():Record<string,GiftItem>=>items??=Object.fromEntries(Object.entries(INGREDIENTS).map(([id,v])=>[id,{kind:'ingredient' as const,ref:id,name:v.name}]));
export const isGiftItem=(id:unknown):id is string=>typeof id==='string'&&Object.hasOwn(giftItems(),id);
export const GIFT_MAX=10;
/** Nhận một món quà vào đúng chỗ theo loại. */
export function receiveGift(s:GameState,item:string,qty:number):GameState{const g=giftItems()[item];if(!g||!Number.isInteger(qty)||qty<1)return s;
 switch(g.kind){case'ingredient':return giftIngredient(s,g.ref as IngredientId,Math.min(qty,GIFT_MAX))}}
export const giftText=(items:readonly [string,number][])=>items.map(([id,q])=>`${q} ${giftItems()[id]?.name.toLowerCase()??id}`).join(', ');

/** Kiện quà gửi xe khách: tới bến từ hôm sau, giữ 3 ngày; quá hạn thì người quen mang giùm nhưng hư mất một nửa. */
export interface Parcel{id:string;from:string;items:[string,number][];day:number;until:number}
export const PARCEL={arriveDays:1,keepDays:3,lostShare:.5,max:5} as const;
export const parcelsOf=(s:GameState):Parcel[]=>lifeOf(s).parcels??[];
export const readyParcels=(s:GameState)=>parcelsOf(s).filter(p=>p.day<=s.day&&s.day<=p.until);
export function sendParcel(s:GameState,from:string,items:[string,number][],id:string):GameState{const l=lifeOf(s);if(parcelsOf(s).some(p=>p.id===id)||parcelsOf(s).length>=PARCEL.max)return s;
 const day=s.day+PARCEL.arriveDays;return{...s,life:{...l,parcels:[...parcelsOf(s),{id,from,items:items.filter(([i,q])=>isGiftItem(i)&&q>0).map(([i,q])=>[i,Math.min(q,GIFT_MAX)] as [string,number]),day,until:day+PARCEL.keepDays-1}]}}}
/** Nhận mọi kiện đã tới khi đang ở trạm xe buýt. */
export function pickParcels(s:GameState):GameResult{if(clockOf(s).location!=='bus')return{ok:false,error:'Hãy ra trạm xe buýt để nhận quà.'};const ready=readyParcels(s);if(!ready.length)return{ok:false,error:'Chưa có quà nào tới bến.'};
 let n:GameState={...s,life:{...lifeOf(s),parcels:parcelsOf(s).filter(p=>!ready.includes(p))}};
 for(const p of ready){for(const [i,q] of p.items)n=receiveGift(n,i,q);n=recordJournal(n,`parcel:${p.id}`,`Nhận quà của ${nameOf(n,p.from)}`,`Ra bến xe nhận ${giftText(p.items)}.`,p.from)}
 return{ok:true,state:n}}
/** Qua ngày: kiện quá hạn được người quen mang giùm tới phòng, hư mất một nửa (làm tròn xuống). */
export function settleParcels(s:GameState):GameState{const late=parcelsOf(s).filter(p=>s.day>p.until);if(!late.length)return s;
 let n:GameState={...s,life:{...lifeOf(s),parcels:parcelsOf(s).filter(p=>!late.includes(p))}};
 for(const p of late){const kept=p.items.map(([i,q])=>[i,Math.floor(q*(1-PARCEL.lostShare))] as [string,number]).filter(([,q])=>q>0);for(const [i,q] of kept)n=receiveGift(n,i,q);
  n=recordJournal(n,`parcel-late:${p.id}`,`Quà của ${nameOf(n,p.from)} để lâu ở bến`,kept.length?`Người quen mang giùm tới phòng, còn ${giftText(kept)}.`:'Để lâu quá nên hư hết.',p.from)}
 return n}
export function validParcels(v:unknown,day:number):v is Parcel[]{return Array.isArray(v)&&v.length<=PARCEL.max&&v.every(p=>p&&typeof p.id==='string'&&p.id.length<80&&typeof p.from==='string'&&Array.isArray(p.items)&&p.items.length<=5&&p.items.every((x:unknown)=>Array.isArray(x)&&isGiftItem(x[0])&&Number.isInteger(x[1])&&x[1]>=1&&x[1]<=GIFT_MAX)&&Number.isInteger(p.day)&&p.day>=0&&p.day<=day+PARCEL.arriveDays&&Number.isInteger(p.until)&&p.until>=p.day&&p.until<=p.day+PARCEL.keepDays)}
