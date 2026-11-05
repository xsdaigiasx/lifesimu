/** T16: hồ sơ NPC, pool thuộc tính, bộ sinh NPC theo seed và lịch hiện diện (kế hoạch mục 22–23, 23.1–23.3). */
import type {GameState,PlaceId} from './types';
import {dateAt} from './format';
import {hash} from './shift';
import poolData from './npc-pool.json';
import type {PoolData} from './pool-check';

/** Lịch: các ngày trong tuần (0 = Chủ nhật … 6 = Thứ bảy), giờ tính bằng phút trong ngày. */
export interface Slot{days:number[];from:number;to:number;place:PlaceId}
export interface NpcProfile{id:string;name:string;label:string;age:number;origin:string;role:string;traits:string[];quirk:string;goal:string;fear:string;voice:string;tone:string;schedule:Slot[];remote?:boolean;story?:boolean}
const WEEK=[0,1,2,3,4,5,6],WORK=[1,2,3,4,5],h=(t:string)=>{const [a,b]=t.split(':').map(Number);return a!*60+b!};
const at=(days:number[],from:string,to:string,place:PlaceId):Slot=>({days,from:h(from),to:h(to),place});

/** Dàn cố định 12 người (mục 23.1). story = có chuỗi sự kiện trong bản chơi thử (mục 23.3). */
export const CAST:NpcProfile[]=[
 {id:'ba-tu',name:'Bà Tư',label:'BT',age:62,origin:'Bến Tre',role:'Chủ trọ',traits:['kỹ tính','tốt bụng','hay càm ràm'],quirk:'Tưới cây lúc sáu giờ, nhớ ngày thu tiền từng phòng',goal:'Giữ khu trọ yên ổn',fear:'Con trai ở xa ít về',voice:'Miền Tây, gọi người trẻ là con',tone:'#f2dcc2',story:true,schedule:[at(WEEK,'07:00','08:30','home'),at(WEEK,'18:30','21:30','home')]},
 {id:'dev-an',name:'Minh An',label:'MA',age:26,origin:'Nam Định',role:'Lập trình viên',traits:['hay nói','nhiệt tình','hơi vội'],quirk:'Luôn có kẹo trong ngăn bàn',goal:'Lên Senior trong hai năm',fear:'Bị tụt lại phía sau',voice:'Miền Bắc, xưng mình',tone:'#cfe3d8',story:true,schedule:[at(WORK,'08:00','12:00','office'),at([1,3,5],'12:00','13:00','streetfood'),at(WORK,'13:00','17:00','office')]},
 {id:'dev-linh',name:'Thảo Linh',label:'TL',age:24,origin:'Huế',role:'Thiết kế giao diện',traits:['nhẹ nhàng','cầu toàn','ngại xung đột'],quirk:'Vẽ nguệch ngoạc khi nghe họp',goal:'Mở một studio nhỏ',fear:'Làm người khác thất vọng',voice:'Huế nhẹ',tone:'#f3d6cf',schedule:[at(WORK,'08:00','12:00','office'),at(WORK,'12:00','13:00','streetfood'),at(WORK,'13:00','17:00','office')]},
 {id:'dev-huy',name:'Gia Huy',label:'GH',age:29,origin:'Sài Gòn',role:'Kiểm thử phần mềm',traits:['thẳng thắn','hay đùa','dễ cáu'],quirk:'Đếm lỗi như sưu tầm',goal:'Được ghi nhận',fear:'Mẹ đang bệnh',voice:'Sài Gòn',tone:'#dcd6f0',schedule:[at(WORK,'08:00','17:00','office'),at([2,4,6],'18:30','20:00','park')]},
 {id:'dev-trang',name:'Thu Trang',label:'TT',age:33,origin:'Hà Nội',role:'Điều phối dự án',traits:['nghiêm','công bằng','ít khen'],quirk:'Dùng sổ tay giấy, không dùng ứng dụng',goal:'Đưa nhóm qua dự án lớn',fear:'Con nhỏ hay ốm',voice:'Miền Bắc gọn, xưng chị',tone:'#f2e2bd',story:true,schedule:[at(WORK,'07:45','17:30','office')]},
 {id:'co-hanh',name:'Cô Hạnh',label:'CH',age:48,origin:'Quảng Ngãi',role:'Bán rau ở chợ',traits:['nhanh nhảu','rộng rãi','hay mặc cả'],quirk:'Cho thêm hành lá cho khách quen',goal:'Nuôi con học đại học',fear:'Nợ vốn đầu mùa',voice:'Quảng Ngãi, xưng tui',tone:'#d9ecc8',story:true,schedule:[at(WEEK,'07:00','11:30','market')]},
 {id:'chu-sau',name:'Chú Sáu',label:'CS',age:67,origin:'Cần Thơ',role:'Hàng xóm về hưu',traits:['chậm rãi','hoài cổ','tự trọng cao'],quirk:'Mang theo chiếc radio nhỏ',goal:'Được người khác cần đến',fear:'Cô đơn',voice:'Miền Tây, kể chuyện dài',tone:'#e6dccb',story:true,schedule:[at(WEEK,'07:00','08:30','park'),at(WEEK,'15:00','17:00','home')]},
 {id:'tuan',name:'Tuấn',label:'Tu',age:22,origin:'Thanh Hoá',role:'Sinh viên chạy giao hàng',traits:['lạc quan','liều','hay quên'],quirk:'Xe máy cũ đặt tên Chiến Mã',goal:'Tốt nghiệp đúng hạn',fear:'Nợ học phí',voice:'Thanh Hoá, nói nhanh',tone:'#d6e6f2',schedule:[at(WORK,'07:00','08:30','bus'),at(WEEK,'21:00','23:30','home'),at([0,6],'19:00','20:30','streetfood')]},
 {id:'chi-mai',name:'Chị Mai',label:'CM',age:35,origin:'Quảng Nam',role:'Bán bánh mì vỉa hè',traits:['chịu khó','kiệm lời','giữ chữ tín'],quirk:'Nhớ khách quen thích ăn gì',goal:'Mở quán có mái che',fear:'Một mình nuôi con',voice:'Quảng Nam, ngắn gọn',tone:'#f4e0c9',schedule:[at([1,2,3,4,5,6],'07:00','13:30','streetfood')]},
 {id:'bs-quan',name:'Bác sĩ Quân',label:'BQ',age:41,origin:'Hải Phòng',role:'Bác sĩ',traits:['điềm đạm','thực tế','hơi khô'],quirk:'Nhắc uống nước trong mọi câu chuyện',goal:'Giảm ca trực',fear:'Bận đến mức xa gia đình',voice:'Miền Bắc chừng mực',tone:'#d3e7e6',schedule:[at(WORK,'07:30','16:30','hospital')]},
 {id:'bao-ngoc',name:'Bảo Ngọc',label:'BN',age:27,origin:'Đà Lạt',role:'Giao dịch viên ngân hàng',traits:['tham vọng','chu đáo','thích số liệu'],quirk:'Cắm hoa tươi ở quầy',goal:'Lên chuyên viên tín dụng',fear:'Khách nợ xấu',voice:'Đà Lạt, lịch sự',tone:'#efd9e6',schedule:[at(WORK,'08:00','16:30','bank'),at([6],'08:00','11:30','bank')]},
 {id:'me',name:'Mẹ',label:'Mẹ',age:50,origin:'quê nhà',role:'Mẹ ở quê',traits:['lo xa','thương con','giấu chuyện khó'],quirk:'Gửi đồ quê qua xe khách',goal:'Con ổn định',fear:'Ruộng mất mùa',voice:'Giọng quê',tone:'#f0e4cf',remote:true,story:true,schedule:[]},
];
/** Vai phụ cố định (NPC phụ theo mục 23): người bán ở quầy chợ. Không có chuỗi riêng trong bản chơi thử. */
export const EXTRAS:NpcProfile[]=[
 {id:'chu-luc',name:'Chú Lực',label:'CL',age:52,origin:'Nghệ An',role:'Bán thịt cá ở chợ',traits:['cau có','thật thà','cẩn thận'],quirk:'Mài dao trước khi chào khách',goal:'Trả hết nợ',fear:'Mất mối hàng',voice:'Nghệ An, nói to',tone:'#f1d2cc',schedule:[at(WEEK,'07:00','12:00','market')]},
 {id:'ba-nam',name:'Bà Năm',label:'BN',age:70,origin:'Bến Tre',role:'Bán tạp hoá ở chợ',traits:['hiền','hay hỏi han','tiết kiệm'],quirk:'Gói hàng bằng lá chuối',goal:'Được con cháu về thăm',fear:'Cô đơn',voice:'Miền Tây, chậm rãi',tone:'#f2e6c4',schedule:[at(WEEK,'07:00','18:00','market')]},
 {id:'lan',name:'Mai Lan',label:'ML',age:28,origin:'Đà Nẵng',role:'Lễ tân tòa nhà',traits:['vui vẻ','chu đáo','nhanh nhảu'],quirk:'Nhớ tên khách từ lần đầu gặp',goal:'Học xong lớp tiếng Anh buổi tối',fear:'Bị thay bằng máy quét thẻ',voice:'Đà Nẵng, nói nhanh',tone:'#e9cfc4',schedule:[at(WORK,'07:45','17:30','office')]},
 {id:'minh',name:'Đức Minh',label:'ĐM',age:45,origin:'Hà Nội',role:'Quản lý mặt bằng',traits:['cẩn thận','kiệm lời','giữ chữ tín'],quirk:'Luôn mang thước dây trong túi áo',goal:'Lấp đầy tầng còn trống',fear:'Khách thuê bỏ ngang hợp đồng',voice:'Miền Bắc chừng mực',tone:'#cfdde1',schedule:[at(WORK,'09:00','16:00','office')]},
 {id:'ha',name:'Ngọc Hà',label:'NH',age:31,origin:'Huế',role:'Điều phối tuyển dụng',traits:['tò mò','tốt bụng','cẩn thận'],quirk:'Đọc CV bằng bút đỏ',goal:'Ghép đúng người đúng việc',fear:'Giới thiệu nhầm người',voice:'Huế nhẹ',tone:'#dcd8e6',schedule:[at(WORK,'08:00','17:00','office')]},
 {id:'bao',name:'Quốc Bảo',label:'QB',age:34,origin:'Sài Gòn',role:'Kỹ thuật viên tòa nhà',traits:['thật thà','vội vàng','hay đùa'],quirk:'Đeo chùm chìa khoá kêu leng keng',goal:'Mở tiệm sửa máy riêng',fear:'Mất điện cả tòa nhà',voice:'Sài Gòn',tone:'#d6dfcc',schedule:[at(WORK,'08:00','17:00','office')]},
];
export const NPCS=[...CAST,...EXTRAS];
export const castById=(id:string)=>NPCS.find(n=>n.id===id);

/** Lệch giờ nhỏ theo ngày và người (0–15 phút) để lịch không máy móc. */
const jitter=(id:string,day:number,salt:string)=>hash(`${id}:${day}:${salt}`)%16;
/** Có mặt ở nơi này vào lúc này không. */
export function presentAt(n:NpcProfile,day:number,minute:number,place:PlaceId){if(n.remote)return false;const dow=dateAt(day).getUTCDay();return n.schedule.some((s,i)=>s.place===place&&s.days.includes(dow)&&minute>=s.from+jitter(n.id,day,'a'+i)&&minute<s.to-jitter(n.id,day,'b'+i))}
/** Những người đang ở cùng nơi, cùng giờ với người chơi. */
export function peopleHere(s:GameState,place?:PlaceId){const loc=place??s.clock?.location??'home',minute=s.clock?.minute??420;return NPCS.filter(n=>presentAt(n,s.day,minute,loc))}

// ---------- Pool thuộc tính và bộ sinh NPC phụ (bản chơi thử: khoảng 40 tên, 10 điểm nhấn)
/** Bể thuộc tính nằm ở npc-pool.json; kiểm bằng npm run pool:check. */
export const POOL=poolData as unknown as PoolData;
/** Cặp tính cách xung khắc không được đi cùng nhau. */
export const TRAIT_CONFLICTS:[string,string][]=poolData.conflicts as [string,string][];
export interface PoolNpc{id:string;seed:string;name:string;gender:'male'|'female';age:number;origin:string;job:string;traits:string[];quirk:string;goal:string;fear:string}

/** Trộn bit (murmur3 fmix) để các trường rút từ seed gần giống nhau không tương quan. */
export const mix=(x:number)=>{x^=x>>>16;x=Math.imul(x,0x85ebca6b);x^=x>>>13;x=Math.imul(x,0xc2b2ae35);x^=x>>>16;return x>>>0};
/** Sinh một NPC phụ theo seed: cùng seed cho cùng người; luôn thoả ràng buộc tuổi và nghề, tính cách không xung khắc. */
export function generateNpc(seed:string):PoolNpc{const r=(salt:string,n:number)=>mix(hash(`${seed}:${salt}`))%n,pick=<T,>(list:readonly T[],salt:string)=>list[r(salt,list.length)]!;
 const gender=r('g',2)===0?'male':'female',job=pick(POOL.job,'job'),age=job.min+r('age',job.max-job.min+1);
 const traits:string[]=[];for(let i=0;traits.length<3&&i<40;i++){const t=pick(POOL.traits,'t'+i);if(!traits.includes(t)&&!TRAIT_CONFLICTS.some(([a,b])=>(a===t&&traits.includes(b))||(b===t&&traits.includes(a))))traits.push(t)}
 return{id:`pool-${hash(seed).toString(36)}`,seed,name:`${pick(POOL.family,'f')} ${pick(gender==='male'?POOL.male:POOL.female,'n')}`,gender,age,origin:pick(POOL.origin,'o'),job:job.name,traits,quirk:pick(POOL.quirk,'q'),goal:pick(POOL.goal,'goal'),fear:pick(POOL.fear,'fear')}}
/** Kiểm tra ràng buộc của một hồ sơ (dùng cho cả dữ liệu nhập tay về sau). */
export function profileProblems(p:{age:number;job?:string;traits:string[]}){const out:string[]=[];const job=POOL.job.find(j=>j.name===p.job);if(job&&(p.age<job.min||p.age>job.max))out.push(`tuổi ${p.age} không hợp nghề ${p.job}`);for(const [a,b] of TRAIT_CONFLICTS)if(p.traits.includes(a)&&p.traits.includes(b))out.push(`tính cách xung khắc: ${a} và ${b}`);if(new Set(p.traits).size!==p.traits.length)out.push('tính cách bị lặp');return out}

/** Bậc quan hệ (mục 24). Bất hoà làm ở T40. */
export function relationTier(score:number,id?:string){if(id==='me')return'Gia đình';return score>=60?'Tri kỷ':score>=30?'Thân':score>=10?'Quen biết':'Xa lạ'}
/** Người làm ở sảnh tòa nhà văn phòng (trước đây là STAFF trong office.ts, giữ nguyên id để save cũ không mất người quen). */
export const LOBBY=['lan','minh','ha','bao'];

/** Cách xưng hô khi NPC nói với người chơi: self là NPC tự xưng, you là gọi người chơi. */
export const ADDRESS:Record<string,{self:string;you:string}>={'ba-tu':{self:'bà',you:'con'},'chu-sau':{self:'chú',you:'con'},'co-hanh':{self:'cô',you:'con'},'chu-luc':{self:'chú',you:'cháu'},'ba-nam':{self:'bà',you:'con'},me:{self:'mẹ',you:'con'},'bs-quan':{self:'tôi',you:'em'},'dev-trang':{self:'chị',you:'em'},'dev-huy':{self:'anh',you:'em'},'dev-an':{self:'mình',you:'bạn'},'dev-linh':{self:'mình',you:'bạn'},'bao-ngoc':{self:'chị',you:'em'},tuan:{self:'em',you:'anh'},'chi-mai':{self:'chị',you:'em'},lan:{self:'chị',you:'em'},minh:{self:'chú',you:'cháu'},ha:{self:'chị',you:'em'},bao:{self:'anh',you:'em'}};
export const addressOf=(id:string)=>ADDRESS[id]??{self:'tôi',you:'bạn'};
/** Nhắc thời gian áng chừng, không ghi ngày cụ thể (chốt 04/11). */
export function agoText(days:number){return days<=0?'lúc nãy':days===1?'hôm qua':days<=4?'mấy hôm trước':days<=10?'tuần trước':days<=24?'mấy tuần trước':days<=45?'tháng trước':'hồi trước'}
