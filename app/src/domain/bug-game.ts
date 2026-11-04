import type {SkillId} from './skill-xp';
/** Mini game sự cố theo nhóm kỹ năng (chủ dự án chốt 04/11): mỗi nhóm 2–3 trò, chọn theo seed, không cần biết lập trình. Bài sinh từ seed nên tải lại vẫn ra đúng bài. */
export type BugKind='wires'|'order'|'sequence'|'diff'|'missing'|'color'|'assign'|'situation'|'match'|'memory'|'rhythm';
/** `options`: lựa chọn hiển thị (luôn từ 3 trở lên). `answer`: chỉ số "đúng" để fixBug so sánh, thắng thì gửi `answer`, thua gửi chỉ số khác. `data`: dữ liệu riêng từng trò. */
export interface BugPuzzle{kind:BugKind;title:string;prompt:string;options:string[];answer:number;limitMs:number;data?:string[]}
export const WIRE_COLORS=['red','blue','green','yellow','purple'] as const;
export const WIRE_MISTAKES=3;
/** Trò chọn một đáp án: sai là thua ngay. */
export const SINGLE_CHOICE:readonly BugKind[]=['sequence','diff','missing','color','situation'];
export const GAMES_BY_SKILL:Record<SkillId,BugKind[]>={programming:['wires','order','sequence'],logic:['wires','order','sequence'],graphics:['diff','missing','color'],management:['order','assign'],communication:['situation','match'],cooking:['memory','rhythm']};
const SITUATIONS:{title:string;prompt:string;good:string;bad:[string,string]}[]=[
{title:'Khách đổi yêu cầu sát hạn',prompt:'Khách nhắn đổi hẳn giao diện khi còn một ngày. Bạn xử lý thế nào?',good:'Trao đổi phạm vi, đề xuất phần quan trọng làm trước',bad:['Nhận hết và thức đêm làm','Từ chối, không làm gì thêm']},
{title:'Đồng nghiệp làm trễ',prompt:'Đồng nghiệp trễ phần việc và cả nhóm bị ảnh hưởng. Bạn làm gì trước?',good:'Hỏi vướng mắc gì và hỗ trợ cụ thể',bad:['Báo thẳng với sếp ngay','Tự làm lại phần của họ']},
{title:'Báo cáo có số liệu sai',prompt:'Bạn phát hiện báo cáo đã gửi có một con số sai. Bạn nên:',good:'Báo ngay, gửi bản sửa kèm giải thích ngắn',bad:['Im lặng, hy vọng không ai để ý','Chờ đến khi có người hỏi']},
{title:'Ước lượng thời gian',prompt:'Sếp hỏi bao lâu xong việc bạn chưa chắc. Cách trả lời tốt nhất:',good:'Đưa khoảng thời gian kèm rủi ro và mốc kiểm tra',bad:['"Chắc nhanh thôi"','"Không biết"']},
{title:'Hiểu sai yêu cầu',prompt:'Làm được nửa chừng bạn nhận ra mình hiểu sai yêu cầu. Bạn nên:',good:'Dừng lại, xác nhận lại yêu cầu rồi chỉnh hướng',bad:['Làm tiếp cho xong rồi tính','Giấu và sửa lén sau']},
{title:'Khách phàn nàn',prompt:'Khách gọi phàn nàn về sản phẩm. Câu mở đầu tốt nhất:',good:'Cảm ơn anh đã báo, em ghi lại và xử lý ngay ạ',bad:['Chuyện đó đâu phải lỗi bên em','Anh bình tĩnh đi ạ']},
{title:'Họp kéo dài',prompt:'Cuộc họp đã quá giờ nhưng chưa chốt được việc. Bạn nên:',good:'Đề nghị chốt việc, người phụ trách và hạn rồi kết thúc',bad:['Ngồi im chờ họp xong','Rời họp không báo']},
{title:'Nhận việc ngoài khả năng',prompt:'Sếp giao việc bạn chưa từng làm. Bạn nên:',good:'Nói rõ phần chưa chắc và xin hướng dẫn sớm',bad:['Nhận và tự mò đến phút cuối','Từ chối thẳng']}];
const MATCHES:{left:string;right:string}[]=[{left:'Khách đang giận',right:'Em xin lỗi, em xử lý ngay ạ'},{left:'Sếp đang bận',right:'Em báo ngắn hai ý chính ạ'},{left:'Đồng nghiệp mới',right:'Cứ hỏi, mình chỉ cho'},{left:'Bạn thân',right:'Cuối tuần đi cà phê nhé'},{left:'Nhà tuyển dụng',right:'Em cảm ơn, em rất mong cơ hội này'},{left:'Người lớn tuổi',right:'Dạ, để cháu giúp ạ'}];
const ASSIGNS:{left:string;right:string}[]=[{left:'An giỏi lập trình',right:'Viết chức năng mới'},{left:'Bình giỏi thiết kế',right:'Vẽ giao diện'},{left:'Chi giỏi kiểm thử',right:'Tìm lỗi trước khi giao'},{left:'Dũng giỏi viết',right:'Soạn hướng dẫn'},{left:'Hà giỏi nói chuyện',right:'Làm việc với khách'},{left:'Khoa giỏi số liệu',right:'Làm báo cáo'}];
const JOBS=['Sửa lỗi thanh toán','Chuẩn bị họp khách','Dọn tài liệu cũ','Cập nhật báo cáo','Trả lời email','Kiểm tra bản phát hành'],DEADLINES=['Hôm nay','Ngày mai','Cuối tuần','Tuần sau'];
const FLAVORS=['Hành','Tiêu','Ớt','Rau thơm'];
const rng=(seed:number)=>{let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}};
function shuffle<T>(a:T[],r:()=>number){const o=[...a];for(let i=o.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[o[i],o[j]]=[o[j]!,o[i]!]}return o}
const hsl=(h:number,s:number,l:number)=>`hsl(${Math.round(((h%360)+360)%360)} ${s}% ${l}%)`;
export function bugPuzzle(seed:number,skill:SkillId='programming'):BugPuzzle{const r=rng(seed*2654435761>>>0),list=GAMES_BY_SKILL[skill]??GAMES_BY_SKILL.programming,kind=list[Math.floor(r()*list.length)]!;
 switch(kind){
 case'wires':{const n=3+Math.floor(r()*3),left=WIRE_COLORS.slice(0,n) as string[];let right=[...left];for(let t=0;t<20;t++){right=shuffle(left,r);if(right.some((c,i)=>c!==left[i]))break}return{kind,title:'Nối dây',prompt:'Nối các đầu cùng màu.',options:right,answer:0,limitMs:6000*n}}
 case'order':{if(skill==='management'){const jobs=shuffle(JOBS,r).slice(0,4),ranks=shuffle([0,1,2,3],r),cards=jobs.map((j,i)=>`${j}, ${DEADLINES[ranks[i]!]}`);return{kind,title:'Xếp ưu tiên',prompt:'Chạm lần lượt từ việc gấp nhất đến ít gấp nhất.',options:cards,answer:0,limitMs:20000,data:ranks.map(String)}}
  const nums=shuffle(Array.from({length:30},(_,i)=>i+1),r).slice(0,5);return{kind,title:'Xếp thứ tự số',prompt:'Chạm các số theo thứ tự từ nhỏ đến lớn.',options:nums.map(String),answer:0,limitMs:12000,data:nums.map(String)}}
 case'sequence':{const a=1+Math.floor(r()*8),d=2+Math.floor(r()*7),dbl=r()<.35,t=(i:number)=>dbl?a*2**i:a+d*i,ans=t(4),opts=new Set<number>([ans]);while(opts.size<4){const off=(1+Math.floor(r()*5))*(r()<.5?-1:1),v=ans+off;if(v>0)opts.add(v)}const o=shuffle([...opts],r);return{kind,title:'Chuỗi quy luật',prompt:`Số tiếp theo là gì: ${[0,1,2,3].map(t).join(', ')}, ?`,options:o.map(String),answer:o.indexOf(ans),limitMs:15000}}
 case'diff':{const h=Math.floor(r()*360),odd=Math.floor(r()*16),sign=r()<.5?-1:1,cells=Array.from({length:16},(_,i)=>i===odd?hsl(h,55,52+sign*11):hsl(h,55,52));return{kind,title:'Tìm khác biệt',prompt:'Chạm vào ô có màu hơi khác.',options:cells,answer:odd,limitMs:15000}}
 case'missing':{const hue=shuffle([0,70,140,210,280],r).slice(0,4).map(h=>hsl(h,60,58)),grid=Array.from({length:9},(_,i)=>hue[(Math.floor(i/3)+(i%3))%3]!),ans=hue[(2+2)%3]!,opts=shuffle([hue[0]!,hue[1]!,hue[2]!,hue[3]!],r);return{kind,title:'Mảnh còn thiếu',prompt:'Mỗi hàng và cột lặp theo quy luật. Chọn ô còn thiếu.',options:opts,answer:opts.indexOf(ans),limitMs:15000,data:grid.map((c,i)=>i===8?'':c)}}
 case'color':{const h=Math.floor(r()*360),target=hsl(h,62,56),offs=shuffle([-34,-22,22,34],r).slice(0,3),o=shuffle([target,...offs.map(x=>hsl(h+x,62,56))],r);return{kind,title:'Phối màu',prompt:'Chọn ô giống màu mẫu.',options:o,answer:o.indexOf(target),limitMs:12000,data:[target]}}
 case'assign':case'match':{const src=shuffle(kind==='assign'?ASSIGNS:MATCHES,r).slice(0,3+Math.floor(r()*2)),right=shuffle(src.map(p=>p.right),r);return{kind,title:kind==='assign'?'Chia người vào việc':'Ghép lời đúng người',prompt:kind==='assign'?'Nối mỗi người với việc hợp nhất.':'Nối mỗi người với lời đáp hợp nhất.',options:right,answer:0,limitMs:20000,data:[...src.map(p=>p.left),...src.map(p=>p.right)]}}
 case'situation':{const s=SITUATIONS[Math.floor(r()*SITUATIONS.length)]!,o=shuffle([s.good,...s.bad],r);return{kind,title:s.title,prompt:s.prompt,options:o,answer:o.indexOf(s.good),limitMs:20000}}
 case'memory':{const len=4+Math.floor(r()*2),seq=Array.from({length:len},()=>String(Math.floor(r()*4)));return{kind,title:'Nhớ thứ tự gia vị',prompt:'Xem thứ tự sáng lên, rồi chạm lại đúng thứ tự.',options:FLAVORS,answer:0,limitMs:20000,data:seq}}
 default:{const width=18+Math.floor(r()*8),start=20+Math.floor(r()*(60-width)),speed=1400+Math.floor(r()*600);return{kind:'rhythm',title:'Bấm đúng nhịp',prompt:'Chạm khi vạch chạy vào vùng xanh, 3 lần.',options:['Nhịp 1','Nhịp 2','Nhịp 3'],answer:0,limitMs:20000,data:[String(start),String(width),String(speed)]}}}}
/** Không còn đáp án để làm mờ; giữ hàm cho nơi gọi cũ. */
export function hiddenOptions(_p:BugPuzzle,_logicLevel:number,_seed:number):number[]{return[]}
/** Thưởng/phạt thời gian sửa (tỷ lệ giờ chuẩn, mục 12.2: 25–40%). */
export const REPAIR_FAST=.25,REPAIR_SLOW=.33,REPAIR_WRONG=.4;
export function repairFraction(p:BugPuzzle,choice:number,ms:number){if(choice!==p.answer)return{frac:REPAIR_WRONG,result:'wrong' as const};return ms<=p.limitMs/2?{frac:REPAIR_FAST,result:'fast' as const}:{frac:REPAIR_SLOW,result:'slow' as const}}
