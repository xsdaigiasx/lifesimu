/** H7c: đợt tăng giá chợ (hệ quả nhẹ của tin đồn đúng: tin lan trước 3 ngày, người chơi mua trước được). Tách riêng để `life.ts` dùng không vòng phụ thuộc. */
import type {GameState} from '../types';
import {mix,worldSeed} from '../npc';
import {hash} from '../shift';

/** Khối 20 ngày, 45% có một đợt 4 ngày tăng 20% cho quầy rau hoặc quầy thịt cá. */
export const PRICE={block:20,pct:45,days:4,lead:3,up:.2} as const;
const roll=(world:string,salt:string,n=100)=>mix(hash(`${world}:rumor:${salt}`))%n;
export function priceWave(world:string,block:number):{seller:'veg'|'meat';from:number;to:number}|null{if(roll(world,`price:${block}`)>=PRICE.pct)return null;const from=block+8+roll(world,`pfrom:${block}`,6);return{seller:roll(world,`pwho:${block}`,2)?'meat':'veg',from,to:from+PRICE.days-1}}
export const blocksNear=(day:number)=>{const b=Math.floor(day/PRICE.block)*PRICE.block;return[b,b-PRICE.block]};
/** Hôm nay món của quầy này có đang lên giá không. */
export function priceUp(s:Pick<GameState,'seed'>,seller:string,day:number){const w=worldSeed(s);return blocksNear(day).some(b=>{const p=priceWave(w,b);return!!p&&p.seller===seller&&day>=p.from&&day<=p.to})}
