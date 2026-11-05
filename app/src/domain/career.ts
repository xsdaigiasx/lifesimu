/** T13: bậc nghề và lương (workflow mục 12.4). Lương = lương bậc × hệ số công ty. Chứng chỉ kỹ năng chính (T14): Middle và Senior cần Nâng cao, Lead cần Chuyên sâu. */
import {middleDays} from './shift';
import {TECH,TIER_ORDER,type Tier} from './professions';
export type {Tier};
export const TIERS:Tier[]=TIER_ORDER;
/** Bậc, lương và hệ số công ty lấy từ gói nghề (professions.ts). */
export const TIER_NAME=Object.fromEntries(TIER_ORDER.map(t=>[t,TECH.tiers[t].name])) as Record<Tier,string>;
export const TIER_SALARY=Object.fromEntries(TIER_ORDER.map(t=>[t,TECH.tiers[t].salary])) as Record<Tier,number>;
export const COMPANY_FACTOR:Record<string,number>=TECH.companyFactor;
export const MIDDLE_MIN_DAYS=180,MIDDLE_MIN_ATTENDANCE=.9;
export const isTier=(v:unknown):v is Tier=>typeof v==='string'&&(TIERS as string[]).includes(v);
export const tierSalary=(companyId:string,tier:Tier,probation:boolean,probationRate:number)=>Math.round(TIER_SALARY[tier]*(COMPANY_FACTOR[companyId]??1)*(probation?probationRate:1));
export const nextTier=(t:Tier):Tier|null=>TIERS[TIERS.indexOf(t)+1]??null;
export interface TierFacts{/** điểm đánh giá 0–100, mặc định 50 */rating?:number;main:number;/** chứng chỉ cao nhất của kỹ năng chính: 0–3 */cert:number;communication:number;management:number;daysInTier:number;attendance:number}
/** Điều kiện lên bậc kế; trả danh sách điều kiện còn thiếu (rỗng = đủ). */
export function promotionGaps(to:Tier,f:TierFacts):string[]{const g:string[]=[];
 if(to==='middle'){if(f.main<5)g.push('Kỹ năng chính Lv5');if(f.cert<2)g.push('Chứng chỉ Nâng cao');{const need=middleDays(f.rating);if(f.daysInTier<need)g.push(`Đủ ${need} ngày ở bậc Junior (còn ${need-f.daysInTier} ngày)`)}if(f.attendance<MIDDLE_MIN_ATTENDANCE)g.push('Chấm công tháng trước từ 90%')}
 if(to==='senior'){if(f.main<7)g.push('Kỹ năng chính Lv7');if(f.cert<2)g.push('Chứng chỉ Nâng cao');if(f.communication<4)g.push('Giao tiếp Lv4')}
 if(to==='lead'){if(f.main<8)g.push('Kỹ năng chính Lv8');if(f.cert<3)g.push('Chứng chỉ Chuyên sâu');if(f.management<5)g.push('Quản lý Lv5')}
 return g}
