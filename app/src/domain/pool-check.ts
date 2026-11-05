/** T42: kiểm tra dữ liệu bể thuộc tính NPC (npc-pool.json). Chỉ kiểm cấu trúc và trùng lặp. */
export interface JobSpec{name:string;min:number;max:number}
export interface PoolData{family:string[];male:string[];female:string[];origin:string[];job:JobSpec[];traits:string[];quirk:string[];goal:string[];fear:string[];conflicts:[string,string][]}
export const TEXT_LISTS=['family','male','female','origin','traits','quirk','goal','fear'] as const;
const KEYS=[...TEXT_LISTS,'job','conflicts'];
const norm=(s:string)=>s.trim().toLowerCase().replace(/\s+/g,' ');
/** Trả về danh sách lỗi (rỗng nghĩa là dữ liệu hợp lệ). */
export function poolProblems(raw:unknown):string[]{
 const out:string[]=[];if(!raw||typeof raw!=='object'||Array.isArray(raw))return['dữ liệu phải là một đối tượng'];
 const p=raw as Record<string,unknown>;
 for(const k of Object.keys(p))if(!KEYS.includes(k))out.push(`trường lạ: ${k}`);
 const texts:Record<string,string[]>={};
 for(const k of TEXT_LISTS){const v=p[k];if(!Array.isArray(v)||!v.length){out.push(`${k}: thiếu hoặc rỗng`);continue}
  const seen=new Set<string>(),ok:string[]=[];
  v.forEach((x,i)=>{if(typeof x!=='string'||!x.trim()){out.push(`${k}[${i}]: phải là chữ không rỗng`);return}
   if(x!==x.trim()||/\s{2,}/.test(x))out.push(`${k}[${i}]: thừa khoảng trắng ("${x}")`);
   const n=norm(x);if(seen.has(n))out.push(`${k}: trùng mục "${x}"`);seen.add(n);ok.push(x)});
  texts[k]=ok}
 const male=texts.male??[],female=texts.female??[];const fem=new Set(female.map(norm));for(const m of male)if(fem.has(norm(m)))out.push(`tên "${m}" có ở cả male và female`);
 const jobs=p.job;
 if(!Array.isArray(jobs)||!jobs.length)out.push('job: thiếu hoặc rỗng');else{const seen=new Set<string>();
  jobs.forEach((j,i)=>{const o=j as Partial<JobSpec>|null;if(!o||typeof o!=='object'||typeof o.name!=='string'||!o.name.trim()){out.push(`job[${i}]: thiếu tên`);return}
   const n=norm(o.name);if(seen.has(n))out.push(`job: trùng nghề "${o.name}"`);seen.add(n);
   if(!Number.isInteger(o.min)||!Number.isInteger(o.max)){out.push(`job ${o.name}: min và max phải là số nguyên`);return}
   if(o.min!<16||o.max!>100||o.min!>o.max!)out.push(`job ${o.name}: khoảng tuổi ${o.min}-${o.max} không hợp lệ (16 đến 100, min không vượt max)`)})}
 const traits=texts.traits??[];const tset=new Set(traits.map(norm));
 const conf=p.conflicts;
 if(!Array.isArray(conf))out.push('conflicts: phải là danh sách cặp');else{const seen=new Set<string>();
  conf.forEach((c,i)=>{if(!Array.isArray(c)||c.length!==2||typeof c[0]!=='string'||typeof c[1]!=='string'){out.push(`conflicts[${i}]: phải là cặp hai chữ`);return}
   const [a,b]=c;if(norm(a)===norm(b))out.push(`conflicts[${i}]: hai tính cách giống nhau ("${a}")`);
   for(const t of c)if(!tset.has(norm(t)))out.push(`conflicts[${i}]: "${t}" không có trong traits`);
   const key=[norm(a),norm(b)].sort().join('|');if(seen.has(key))out.push(`conflicts: trùng cặp ${a} và ${b}`);seen.add(key)})}
 if(traits.length<6)out.push(`traits: cần ít nhất 6 mục để chọn 3 tính cách không xung khắc (đang có ${traits.length})`);
 return out}
