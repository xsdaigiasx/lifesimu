/** T13: bậc nghề và lương (workflow mục 12.4). Lương = lương bậc × hệ số công ty. Chứng chỉ và trần XP theo bậc thuộc T14. */
export type Tier='junior'|'middle'|'senior'|'lead';
export const TIERS:Tier[]=['junior','middle','senior','lead'];
export const TIER_NAME:Record<Tier,string>={junior:'Junior',middle:'Middle',senior:'Senior',lead:'Lead'};
export const TIER_SALARY:Record<Tier,number>={junior:9000000,middle:14000000,senior:22000000,lead:32000000};
export const COMPANY_FACTOR:Record<string,number>={'sen-code':1,'an-nhien-tech':1.2};
export const MIDDLE_MIN_DAYS=180,MIDDLE_MIN_ATTENDANCE=.9;
export const isTier=(v:unknown):v is Tier=>typeof v==='string'&&(TIERS as string[]).includes(v);
export const tierSalary=(companyId:string,tier:Tier,probation:boolean,probationRate:number)=>Math.round(TIER_SALARY[tier]*(COMPANY_FACTOR[companyId]??1)*(probation?probationRate:1));
export const nextTier=(t:Tier):Tier|null=>TIERS[TIERS.indexOf(t)+1]??null;
export interface TierFacts{main:number;communication:number;management:number;daysInTier:number;attendance:number}
/** Điều kiện lên bậc kế; trả danh sách điều kiện còn thiếu (rỗng = đủ). */
export function promotionGaps(to:Tier,f:TierFacts):string[]{const g:string[]=[];
 if(to==='middle'){if(f.main<5)g.push('Kỹ năng chính Lv5');if(f.daysInTier<MIDDLE_MIN_DAYS)g.push(`Đủ 6 tháng ở bậc Junior (còn ${MIDDLE_MIN_DAYS-f.daysInTier} ngày)`);if(f.attendance<MIDDLE_MIN_ATTENDANCE)g.push('Chấm công tháng trước từ 90%')}
 if(to==='senior'){if(f.main<7)g.push('Kỹ năng chính Lv7');if(f.communication<4)g.push('Giao tiếp Lv4')}
 if(to==='lead'){if(f.main<8)g.push('Kỹ năng chính Lv8');if(f.management<5)g.push('Quản lý Lv5')}
 return g}
