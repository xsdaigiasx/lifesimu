/** T16, H0: hồ sơ NPC, pool thuộc tính, dàn NPC theo seed và lịch hiện diện (kế hoạch mục 22–23; HOI-THOAI I.1, T.6).
 * Vai cố định (mã vai không đổi giữa các đời chơi); con người trong vai rút từ pool theo seed thế giới. */
import type {GameState,PlaceId} from './types';
import {dateAt} from './format';
import {hash} from './shift';
import poolData from './npc-pool.json';
import type {PoolData} from './pool-check';
import type {Voice} from './lines';

/** Lịch: các ngày trong tuần (0 = Chủ nhật … 6 = Thứ bảy), giờ tính bằng phút trong ngày. */
export interface Slot{days:number[];from:number;to:number;place:PlaceId}
export interface NpcProfile{id:string;name:string;label:string;gender:'male'|'female';age:number;origin:string;role:string;traits:string[];quirk:string;goal:string;fear:string;
 /** mô tả giọng (hiện ở hồ sơ) và mã giọng cho thư viện câu */voice:string;voiceKey:Voice;
 /** NPC tự xưng và cách gọi người chơi */self:string;you:string;tone:string;schedule:Slot[];remote?:boolean;story?:boolean;family?:boolean;
 /** đồng nghiệp: mã công ty (`office.employerId`) */company?:string;
 /** đồng nghiệp: chỗ ngồi trong nhóm */desk?:Desk;
 /** họ tên đầy đủ (chặn trùng với ứng viên tuyển dụng) */fullName:string}
export type Desk='dev'|'design'|'qa'|'pm';
const WEEK=[0,1,2,3,4,5,6],WORK=[1,2,3,4,5],h=(t:string)=>{const [a,b]=t.split(':').map(Number);return a!*60+b!};
const at=(days:number[],from:string,to:string,place:PlaceId):Slot=>({days,from:h(from),to:h(to),place});

/** Định nghĩa vai: tuổi theo vai, giới nếu vai buộc, lịch, có mạch chuyện (story) hay không. */
interface RoleDef{id:string;role:string;age:[number,number];gender?:'male'|'female';schedule:Slot[];story?:boolean;remote?:boolean;family?:boolean;company?:string;desk?:Desk;title?:'doctor'}
const SERVICE:RoleDef[]=[
 {id:'landlord',role:'Chủ trọ',age:[48,70],story:true,schedule:[at(WEEK,'07:00','08:30','home'),at(WEEK,'18:30','21:30','home')]},
 {id:'neighbor',role:'Hàng xóm về hưu',age:[62,76],story:true,schedule:[at(WEEK,'07:00','08:30','park'),at(WEEK,'15:00','17:00','home')]},
 {id:'veg',role:'Bán rau ở chợ',age:[35,60],story:true,schedule:[at(WEEK,'07:00','11:30','market')]},
 {id:'meat',role:'Bán thịt cá ở chợ',age:[35,60],schedule:[at(WEEK,'07:00','12:00','market')]},
 {id:'grocery',role:'Bán tạp hoá ở chợ',age:[50,74],schedule:[at(WEEK,'07:00','18:00','market')]},
 {id:'banhmi',role:'Bán bánh mì vỉa hè',age:[25,50],schedule:[at([1,2,3,4,5,6],'07:00','13:30','streetfood')]},
 {id:'courier',role:'Sinh viên chạy giao hàng',age:[19,23],schedule:[at(WORK,'07:00','08:30','bus'),at(WEEK,'21:00','23:30','home'),at([0,6],'19:00','20:30','streetfood')]},
 {id:'doctor',role:'Bác sĩ',age:[32,58],title:'doctor',schedule:[at(WORK,'07:30','16:30','hospital')]},
 {id:'teller',role:'Giao dịch viên ngân hàng',age:[23,34],schedule:[at(WORK,'08:00','16:30','bank'),at([6],'08:00','11:30','bank')]},
 {id:'reception',role:'Lễ tân tòa nhà',age:[22,34],schedule:[at(WORK,'07:45','17:30','office')]},
 {id:'leasing',role:'Quản lý mặt bằng',age:[36,56],schedule:[at(WORK,'09:00','16:00','office')]},
 {id:'recruiter',role:'Điều phối tuyển dụng',age:[26,40],schedule:[at(WORK,'08:00','17:00','office')]},
 {id:'tech',role:'Kỹ thuật viên tòa nhà',age:[24,45],schedule:[at(WORK,'08:00','17:00','office')]},
];
const FAMILY:RoleDef[]=[
 {id:'me',role:'Mẹ ở quê',age:[46,54],gender:'female',story:true,remote:true,family:true,schedule:[]},
 {id:'em',role:'Em ở quê',age:[16,21],remote:true,family:true,schedule:[]},
];
/** Công ty có nhóm đồng nghiệp riêng: mã công ty và tiền tố mã vai. */
export const TEAMS:{company:string;prefix:string}[]=[{company:'sen-code',prefix:'sen'},{company:'an-nhien-tech',prefix:'ant'}];
const DESKS:{desk:Desk;role:string;age:[number,number];story?:boolean;lunch:number[]}[]=[
 {desk:'dev',role:'Lập trình viên',age:[23,30],story:true,lunch:[1,3,5]},
 {desk:'design',role:'Thiết kế giao diện',age:[22,29],lunch:WORK},
 {desk:'qa',role:'Kiểm thử phần mềm',age:[24,32],lunch:[]},
 {desk:'pm',role:'Điều phối dự án',age:[30,38],story:true,lunch:[]},
];
const deskSchedule=(d:typeof DESKS[number]):Slot[]=>d.desk==='pm'?[at(WORK,'07:45','17:30','office')]:d.desk==='qa'?[at(WORK,'08:00','17:00','office'),at([2,4,6],'18:30','20:00','park')]:[at(WORK,'08:00','12:00','office'),...(d.lunch.length?[at(d.lunch,'12:00','13:00','streetfood')]:[]),at(WORK,'13:00','17:00','office')];
const TEAM_ROLES:RoleDef[]=TEAMS.flatMap(t=>DESKS.map(d=>({id:`${t.prefix}-${d.desk}`,role:d.role,age:d.age,story:d.story,company:t.company,desk:d.desk,schedule:deskSchedule(d)})));
export const ROLES:RoleDef[]=[...SERVICE,...FAMILY,...TEAM_ROLES];
/** Mọi mã NPC hợp lệ (dùng cho bộ kiểm tra save, không cần seed). */
export const NPC_IDS:readonly string[]=ROLES.map(r=>r.id);
export const isNpcId=(id:unknown):id is string=>typeof id==='string'&&NPC_IDS.includes(id);
export const FAMILY_IDS=FAMILY.map(r=>r.id);
/** Người làm ở sảnh tòa nhà văn phòng. */
export const LOBBY=['reception','leasing','recruiter','tech'];

// ---------- Pool thuộc tính
/** Bể thuộc tính nằm ở npc-pool.json; kiểm bằng npm run pool:check. */
export const POOL=poolData as unknown as PoolData;
/** Cặp tính cách xung khắc không được đi cùng nhau. */
export const TRAIT_CONFLICTS:[string,string][]=poolData.conflicts as [string,string][];
export interface PoolNpc{id:string;seed:string;name:string;gender:'male'|'female';age:number;origin:string;job:string;traits:string[];quirk:string;goal:string;fear:string}
/** Trộn bit (murmur3 fmix) để các trường rút từ seed gần giống nhau không tương quan. */
export const mix=(x:number)=>{x^=x>>>16;x=Math.imul(x,0x85ebca6b);x^=x>>>13;x=Math.imul(x,0xc2b2ae35);x^=x>>>16;return x>>>0};
const roller=(seed:string)=>{const r=(salt:string,n:number)=>mix(hash(`${seed}:${salt}`))%n;return{r,pick:<T,>(list:readonly T[],salt:string)=>list[r(salt,list.length)]!}};
function drawTraits(pick:<T>(l:readonly T[],s:string)=>T){const traits:string[]=[];for(let i=0;traits.length<3&&i<40;i++){const t=pick(POOL.traits,'t'+i);if(!traits.includes(t)&&!TRAIT_CONFLICTS.some(([a,b])=>(a===t&&traits.includes(b))||(b===t&&traits.includes(a))))traits.push(t)}return traits}
/** Sinh một NPC phụ theo seed: cùng seed cho cùng người; luôn thoả ràng buộc tuổi và nghề, tính cách không xung khắc. */
export function generateNpc(seed:string):PoolNpc{const {r,pick}=roller(seed);
 const gender=r('g',2)===0?'male':'female',job=pick(POOL.job,'job'),age=job.min+r('age',job.max-job.min+1);
 return{id:`pool-${hash(seed).toString(36)}`,seed,name:`${pick(POOL.family,'f')} ${pick(gender==='male'?POOL.male:POOL.female,'n')}`,gender,age,origin:pick(POOL.origin,'o'),job:job.name,traits:drawTraits(pick),quirk:pick(POOL.quirk,'q'),goal:pick(POOL.goal,'goal'),fear:pick(POOL.fear,'fear')}}
/** Kiểm tra ràng buộc của một hồ sơ (dùng cho cả dữ liệu nhập tay về sau). */
export function profileProblems(p:{age:number;job?:string;traits:string[]}){const out:string[]=[];const job=POOL.job.find(j=>j.name===p.job);if(job&&(p.age<job.min||p.age>job.max))out.push(`tuổi ${p.age} không hợp nghề ${p.job}`);for(const [a,b] of TRAIT_CONFLICTS)if(p.traits.includes(a)&&p.traits.includes(b))out.push(`tính cách xung khắc: ${a} và ${b}`);if(new Set(p.traits).size!==p.traits.length)out.push('tính cách bị lặp');return out}

// ---------- Dàn NPC theo seed
/** Giọng theo quê (vùng trong pool). */
const REGION:Record<string,[Voice,string]>={'Hà Nội':['bac','Miền Bắc'],'Nam Định':['bac','Miền Bắc'],'Thanh Hoá':['trung','Thanh Hoá'],'Nghệ An':['trung','Nghệ An'],'Huế':['trung','Huế nhẹ'],'Đà Nẵng':['trung','Đà Nẵng'],'Quảng Nam':['trung','Quảng Nam'],'Sài Gòn':['sg','Sài Gòn'],'Cần Thơ':['tay','Miền Tây'],'Bến Tre':['tay','Miền Tây']};
const TONES=['#f2dcc2','#cfe3d8','#f3d6cf','#dcd6f0','#f2e2bd','#d9ecc8','#e6dccb','#d6e6f2','#f4e0c9','#d3e7e6','#efd9e6','#f1d2cc','#f2e6c4','#e9cfc4','#cfdde1','#dcd8e6','#d6dfcc','#f0e4cf'];
const lastWord=(n:string)=>n.split(' ').pop()!;
/** Tên hiển thị theo tuổi và vai: người lớn tuổi có danh xưng (Bà, Ông, Cô, Chú), bác sĩ có chức danh. */
function displayName(def:RoleDef,given:string,gender:'male'|'female',age:number){const g=lastWord(given),m=gender==='male';
 if(def.id==='me')return'Mẹ';if(def.id==='em')return g;if(def.title==='doctor')return`Bác sĩ ${g}`;
 if(age>=60)return`${m?'Ông':'Bà'} ${g}`;if(age>=40)return`${m?'Chú':'Cô'} ${g}`;
 const first=given.split(' ')[0]!;return['Thị','Văn','Anh'].includes(first)?(age>=28?`${m?'Anh':'Chị'} ${g}`:g):given}
/** Xưng hô với người chơi (khoảng 23 tuổi) theo tuổi và giới của NPC. */
function addressFor(def:RoleDef,gender:'male'|'female',age:number):{self:string;you:string}{const m=gender==='male';
 if(def.id==='me')return{self:'mẹ',you:'con'};if(def.id==='em')return{self:'em',you:'anh'};if(def.title==='doctor')return{self:'tôi',you:'em'};
 if(age>=60)return{self:m?'ông':'bà',you:'con'};if(age>=40)return{self:m?'chú':'cô',you:'cháu'};if(age>=28)return{self:m?'anh':'chị',you:'em'};if(age>=23)return{self:'mình',you:'bạn'};return{self:'em',you:'anh'}}
const initials=(name:string)=>{if(name==='Mẹ')return'Mẹ';const w=name.split(' ');return(w.length>1?w[0]![0]!+w[w.length-1]![0]!:w[0]!.slice(0,2)).toUpperCase()};

/** Seed của save; save chưa có seed (bản cũ) dùng seed mặc định. */
export interface SeedState{world:string;life:string}
export const DEFAULT_WORLD='next-day';
export const worldSeed=(s:Pick<GameState,'seed'>)=>s.seed?.world??DEFAULT_WORLD;
export const validSeed=(v:unknown):v is SeedState=>!!v&&typeof v==='object'&&['world','life'].every(k=>{const x=(v as Record<string,unknown>)[k];return typeof x==='string'&&x.length>0&&x.length<=40});
/** Tạo seed mới cho một đời chơi từ hàm ngẫu nhiên do ứng dụng truyền vào. */
export const newSeed=(rand:()=>number):SeedState=>{const t=()=>Math.floor(rand()*2**32).toString(36);return{world:`w${t()}${t()}`,life:`l${t()}${t()}`}};

/** Mục tiêu, nỗi lo về con cái chỉ rút cho người từ 30 tuổi. */
const KID_GOALS=['Cho con đi học','Con cái hư'];
const rosterCache=new Map<string,NpcProfile[]>();
/** Dựng dàn NPC từ seed thế giới: cùng seed cùng dàn; tên hiển thị và họ tên không trùng nhau. */
export function buildRoster(world:string):NpcProfile[]{const hit=rosterCache.get(world);if(hit)return hit;
 const out:NpcProfile[]=[],names=new Set<string>(),givens=new Set<string>(),full=new Set<string>();let mom:NpcProfile|undefined;
 for(const def of ROLES){let p:NpcProfile|undefined;
  for(let k=0;k<30&&!p;k++){const {r,pick}=roller(`${world}:${def.id}:${k}`);
   const gender=def.gender??(r('g',2)===0?'male':'female'),age=def.age[0]+r('age',def.age[1]-def.age[0]+1),given=pick(gender==='male'?POOL.male:POOL.female,'n');
   const family=def.family&&mom?mom.fullName.split(' ')[0]!:pick(POOL.family,'f'),fullName=`${family} ${given}`,name=displayName(def,given,gender,age);
   if(names.has(name)||givens.has(lastWord(given))||full.has(fullName))continue;
   const origin=def.family&&mom?mom.origin:pick(POOL.origin,'o'),[voiceKey,voice]=def.id==='me'?(['que','Giọng quê'] as [Voice,string]):REGION[origin]??['que','Giọng quê'],a=addressFor(def,gender,age);
   p={id:def.id,name,label:initials(name),gender,age,origin:def.family?'quê nhà':origin,role:def.id==='em'?(gender==='male'?'Em trai':'Em gái'):def.role,traits:drawTraits(pick),quirk:pick(POOL.quirk,'q'),goal:pick(age<30?POOL.goal.filter(g=>!KID_GOALS.includes(g)):POOL.goal,'goal'),fear:pick(age<30?POOL.fear.filter(g=>!KID_GOALS.includes(g)):POOL.fear,'fear'),voice,voiceKey,self:a.self,you:a.you,tone:TONES[r('tone',TONES.length)]!,schedule:def.schedule,fullName,
    ...(def.remote?{remote:true}:{}),...(def.story?{story:true}:{}),...(def.family?{family:true}:{}),...(def.company?{company:def.company,desk:def.desk}:{})}}
  if(!p)throw new Error(`Không dựng được NPC cho vai ${def.id}`);
  if(def.id==='me')mom=p;names.add(p.name);givens.add(lastWord(p.fullName));full.add(p.fullName);out.push(p)}
 if(rosterCache.size>8)rosterCache.clear();rosterCache.set(world,out);return out}
/** Dàn NPC của save này. */
export const rosterOf=(s:Pick<GameState,'seed'>)=>buildRoster(worldSeed(s));
export const castById=(s:Pick<GameState,'seed'>,id:string)=>rosterOf(s).find(n=>n.id===id);
/** Tên hiển thị của một NPC, rơi về mã nếu không có. */
export const nameOf=(s:Pick<GameState,'seed'>,id:string)=>castById(s,id)?.name??id;
/** Mã vai đồng nghiệp ở công ty đang làm (mặc định Sen Code). */
export const teamPrefix=(companyId:string|null|undefined)=>(TEAMS.find(t=>t.company===companyId)??TEAMS[0]!).prefix;
export const coworkerId=(companyId:string|null|undefined,desk:Desk)=>`${teamPrefix(companyId)}-${desk}`;
export const coworkersOf=(s:GameState)=>{const p=teamPrefix(s.office?.employerId);return rosterOf(s).filter(n=>n.id.startsWith(p+'-')&&n.desk)};

/** Lệch giờ nhỏ theo ngày và người (0–15 phút) để lịch không máy móc. */
const jitter=(id:string,day:number,salt:string)=>hash(`${id}:${day}:${salt}`)%16;
/** Có mặt ở nơi này vào lúc này không (theo lịch). */
export function presentAt(n:NpcProfile,day:number,minute:number,place:PlaceId){if(n.remote)return false;const dow=dateAt(day).getUTCDay();return n.schedule.some((s,i)=>s.place===place&&s.days.includes(dow)&&minute>=s.from+jitter(n.id,day,'a'+i)&&minute<s.to-jitter(n.id,day,'b'+i))}
/** Đồng nghiệp chỉ ở văn phòng công ty của họ: người chơi phải đang làm ở đó. */
export const inReach=(s:GameState,n:NpcProfile,place:PlaceId)=>!(n.company&&place==='office'&&(s.office?.role!=='employee'||s.office?.employerId!==n.company));
/** Những người đang ở cùng nơi, cùng giờ với người chơi. */
export function peopleHere(s:GameState,place?:PlaceId){const loc=place??s.clock?.location??'home',minute=s.clock?.minute??420;return rosterOf(s).filter(n=>presentAt(n,s.day,minute,loc)&&inReach(s,n,loc))}

/** Bậc quan hệ (mục 24). Người thân luôn là Gia đình. */
export function relationTier(score:number,id?:string){if(id&&FAMILY_IDS.includes(id))return'Gia đình';return score>=60?'Tri kỷ':score>=30?'Thân':score>=10?'Quen biết':'Xa lạ'}
export const addressOf=(s:Pick<GameState,'seed'>,id:string)=>{const n=castById(s,id);return n?{self:n.self,you:n.you}:{self:'tôi',you:'bạn'}};
/** Nhắc thời gian áng chừng, không ghi ngày cụ thể (chốt 04/11). */
export function agoText(days:number){return days<=0?'lúc nãy':days===1?'hôm qua':days<=4?'mấy hôm trước':days<=10?'tuần trước':days<=24?'mấy tuần trước':days<=45?'tháng trước':'hồi trước'}
