import packs from './office-packs.json';
import type {GameResult,GameState} from './types';
import {officeOf,activeLease,type OfficeSize} from './office';
import {clockOf,spendTime} from './time';
import {recordJournal} from './journal';
export interface PackItem{id:string;name:string;filename:string;category:string;sprite_width:number;sprite_height:number;anchor_point:{x:number;y:number}}
export interface OfficePack{width:number;height:number;background:string;items:PackItem[]}
export type OfficeItems=Partial<Record<OfficeSize,string[]>>;
export const officePack=(size:OfficeSize):OfficePack=>packs[size];
const prices:Record<string,number>={furniture:350000,electronics:900000,appliances:650000,storage:550000,office_gear:450000,plants:180000,decor:150000,lighting:280000,ceo_furniture:2400000,security:1800000,conference:1300000,tech:2100000,workstation:1600000,leisure:950000,ceo_suite:2800000,pantry:1100000,workspace:1900000};
/** Launch balance prices; source packs provide imagery, not game economy values. */
export const shopItems=(size:OfficeSize)=>officePack(size).items.map(item=>({...item,price:prices[item.category]??350000}));
export const OWNER_STARTER_IDS=['executive_desk','executive_chair','workstation_pair'] as const;
export const officeItemStarter=(id:string)=>OWNER_STARTER_IDS.some(v=>v===id);
export const officeItemOwned=(s:GameState,id:string)=>officeItemStarter(id)||(s.officeItems?.[officeOf(s).size]?.includes(id)??false);
export function validOfficeItems(v:unknown):v is OfficeItems{if(!v||typeof v!=='object'||Array.isArray(v))return false;return Object.entries(v).every(([size,ids])=>Object.hasOwn(packs,size)&&Array.isArray(ids)&&ids.length<=officePack(size as OfficeSize).items.length&&new Set(ids).size===ids.length&&ids.every(id=>typeof id==='string'&&officePack(size as OfficeSize).items.some(item=>item.id===id)))}
export function buyOfficeItem(s:GameState,id:string):GameResult{const o=officeOf(s);if(o.role!=='owner')return{ok:false,error:'Chỉ chủ công ty được mua nội thất.'};if(!activeLease(s))return{ok:false,error:'Cần hợp đồng thuê còn hạn.'};if(clockOf(s).location!=='office')return{ok:false,error:'Hãy đến công ty.'};const item=shopItems(o.size).find(item=>item.id===id);if(!item)return{ok:false,error:'Không tìm thấy đồ trong văn phòng này.'};if(officeItemOwned(s,id))return{ok:false,error:'Bạn đã mua món đồ này.'};if(s.money<item.price)return{ok:false,error:'Chưa đủ tiền.'};const timed=spendTime(s,10);if(!timed.ok)return timed;let n=timed.state;n={...n,money:n.money-item.price,officeItems:{...n.officeItems,[o.size]:[...(n.officeItems?.[o.size]??[]),id]},ledger:[{name:'Nội thất: '+item.name,amount:-item.price,day:s.day},...n.ledger].slice(0,100)};n=recordJournal(n,`office-item:${o.size}:${id}`,'Mua nội thất công ty',item.name);return{ok:true,state:n};}
