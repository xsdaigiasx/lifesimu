/** T10: sáu kỹ năng và đường cong XP (workflow mục 12.1, 69). Cấp nội bộ 1–50; Lv hiệu dụng = cấp / 5 (tối đa 10). */
export const SKILLS={programming:'Lập trình',logic:'Logic',graphics:'Đồ họa',management:'Quản lý',communication:'Giao tiếp',cooking:'Nấu ăn'} as const;
export type SkillId=keyof typeof SKILLS;
export interface Skill{level:number;xp:number}
export type Skills=Record<SkillId,Skill>;
export const XP_BASE=80,MAX_LEVEL=50;
/** XP để lên từ Lv hiệu dụng n sang n+1: 80 × n^1,6 (làm tròn), trải đều trên 5 cấp nội bộ. */
export const lvXp=(n:number)=>Math.round(XP_BASE*Math.pow(n,1.6));
/** XP cần để lên từ cấp nội bộ `level` sang cấp kế (cộng dồn đúng bảng mục 12.1 tại mỗi bội số của 5). */
export function xpNeeded(level:number){const n=Math.max(1,Math.min(9,Math.floor(level/5))),k=Math.max(0,level-5*n);return Math.round(lvXp(n)*(k+1)/5)-Math.round(lvXp(n)*k/5)}
export const effectiveLevel=(level:number)=>Math.min(10,level/5);
export const defaultSkills=():Skills=>({programming:{level:3,xp:0},logic:{level:3,xp:0},graphics:{level:1,xp:0},management:{level:1,xp:0},communication:{level:1,xp:0},cooking:{level:1,xp:0}});
/** Cộng XP, trả bản sao đã lên cấp. */
export function gainXp(skills:Skills,id:SkillId,xp:number):Skills{const out=structuredClone(skills),q=out[id];if(q.level>=MAX_LEVEL||!(xp>0))return out;q.xp+=xp;while(q.level<MAX_LEVEL&&q.xp>=xpNeeded(q.level)){q.xp-=xpNeeded(q.level);q.level++}if(q.level>=MAX_LEVEL)q.xp=0;return out}
