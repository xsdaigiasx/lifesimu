/** T10: sáu kỹ năng, Lv 1–10 và đường cong XP (workflow mục 12.1, 69). */
export const SKILLS={programming:'Lập trình',logic:'Logic',graphics:'Đồ họa',management:'Quản lý',communication:'Giao tiếp',cooking:'Nấu ăn'} as const;
export type SkillId=keyof typeof SKILLS;
export interface Skill{level:number;xp:number}
export type Skills=Record<SkillId,Skill>;
export const XP_BASE=80,MAX_LEVEL=10;
/** XP để lên từ Lv n sang n+1: 80 × n^1,6 (làm tròn). Lv 10 là tối đa. */
export const xpNeeded=(level:number)=>Math.round(XP_BASE*Math.pow(Math.max(1,Math.min(MAX_LEVEL-1,level)),1.6));
export const defaultSkills=():Skills=>({programming:{level:1,xp:0},logic:{level:1,xp:0},graphics:{level:1,xp:0},management:{level:1,xp:0},communication:{level:1,xp:0},cooking:{level:1,xp:0}});
/** Cộng XP, trả bản sao đã lên Lv. */
export function gainXp(skills:Skills,id:SkillId,xp:number):Skills{const out=structuredClone(skills),q=out[id];if(q.level>=MAX_LEVEL||!(xp>0))return out;q.xp+=xp;while(q.level<MAX_LEVEL&&q.xp>=xpNeeded(q.level)){q.xp-=xpNeeded(q.level);q.level++}if(q.level>=MAX_LEVEL)q.xp=0;return out}
