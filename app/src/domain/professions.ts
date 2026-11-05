/** T72: khung nghề dạng dữ liệu. Một gói là toàn bộ số liệu của một nghề; thêm nghề mới chủ yếu là thêm một gói,
 * không sửa engine. Hiện chỉ có gói Công nghệ, lấy đúng số liệu đang dùng. Mã đọc bậc, lương, kỹ năng nghề qua gói này. */
import type {SkillId} from './skill-xp';
import type {GameState} from './types';

export type Tier='junior'|'middle'|'senior'|'lead';
export const TIER_ORDER:Tier[]=['junior','middle','senior','lead'];
/** Loại vòng lặp công việc: mỗi loại viết code một lần, nhiều nghề dùng chung. `ready` là đã có mã chạy. */
export type LoopKind='shift'|'service'|'trip'|'harvest'|'project';
export const LOOPS:Record<LoopKind,{name:string;unit:string;ready:boolean}>={
 shift:{name:'Nhiệm vụ theo ca',unit:'ca',ready:true},
 service:{name:'Ca phục vụ',unit:'ca bán',ready:false},
 trip:{name:'Chuyến',unit:'chuyến',ready:false},
 harvest:{name:'Vụ mùa',unit:'vụ',ready:false},
 project:{name:'Dự án',unit:'dự án',ready:true}};
export interface Profession{
 id:string;name:string;
 /** Vòng lặp hằng ngày của người đi làm. */loop:LoopKind;
 /** Kỹ năng làm nghề: dùng cho việc làm thêm, dự án, tuyển người, điều kiện mở công ty. */craft:SkillId[];
 /** Bậc nghề và lương bậc (thang mục 12.4); lương thật = lương bậc × hệ số công ty. */tiers:Record<Tier,{name:string;salary:number}>;
 companyFactor:Record<string,number>;
 /** Mã nhiệm vụ trong ca (kiểm tra với danh sách nhiệm vụ của game). */taskIds:string[];
 /** Đích kinh doanh khi mở công ty. */goal:{industry:string;name:string;loop:LoopKind}}

export const TECH:Profession={
 id:'tech',name:'Công nghệ',loop:'shift',
 craft:['programming','logic','graphics'],
 tiers:{junior:{name:'Junior',salary:9000000},middle:{name:'Middle',salary:14000000},senior:{name:'Senior',salary:22000000},lead:{name:'Lead',salary:32000000}},
 companyFactor:{'sen-code':1,'an-nhien-tech':1.2},
 taskIds:['null-data','test-form','layout','api','logs','planning','request'],
 goal:{industry:'tech',name:'Công ty phần mềm',loop:'project'}};

export const PROFESSIONS:Profession[]=[TECH];
export const professionById=(id:string)=>PROFESSIONS.find(p=>p.id===id);
/** Nghề hiện tại của người chơi. Mới có một nghề; về sau đọc từ hồ sơ đời. */
export const professionOf=(_s?:GameState):Profession=>TECH;

/** Kiểm tra cấu trúc một gói nghề; `known` là các mã có thật trong game (kỹ năng, nhiệm vụ, công ty). */
export function checkProfession(p:Profession,known:{skills:string[];tasks:string[];companies:string[]}):string[]{
 const bad:string[]=[],str=(v:unknown)=>typeof v==='string'&&v.length>0;
 if(!str(p.id)||!/^[a-z-]+$/.test(p.id))bad.push('id');
 if(!str(p.name))bad.push('name');
 if(!(p.loop in LOOPS))bad.push('loop');
 if(!Array.isArray(p.craft)||!p.craft.length||new Set(p.craft).size!==p.craft.length||p.craft.some(k=>!known.skills.includes(k)))bad.push('craft');
 let last=0;for(const t of TIER_ORDER){const x=p.tiers?.[t];if(!x||!str(x.name)||!Number.isInteger(x.salary)||x.salary<=last){bad.push(`tiers.${t}`);break}last=x.salary}
 for(const [id,f] of Object.entries(p.companyFactor??{}))if(!known.companies.includes(id)||!(f>0&&f<=3))bad.push(`companyFactor.${id}`);
 if(!Array.isArray(p.taskIds)||!p.taskIds.length||p.taskIds.some(t=>!known.tasks.includes(t)))bad.push('taskIds');
 if(!p.goal||!str(p.goal.industry)||!str(p.goal.name)||!(p.goal.loop in LOOPS))bad.push('goal');
 return bad}
