import type {SkillId} from './skill-xp';
/** Mini game "Săn lỗi": khi nhiệm vụ đạt 100% mà có lỗi, người chơi phải tìm đúng chỗ sai. Bài sinh từ seed nên tải lại vẫn ra đúng bài. */
export type BugKind='code'|'layout'|'choice';
export interface BugPuzzle{kind:BugKind;title:string;prompt:string;options:string[];answer:number;limitMs:number}
const CODE:{title:string;lines:string[];bug:number}[]=[
{title:'Tính tổng giỏ hàng',lines:['let total = 0','for (let i = 0; i <= items.length; i++) {','  total += items[i].price','}','return total'],bug:1},
{title:'Kiểm tra tuổi',lines:['function isAdult(age) {','  if (age = 18) {','    return true','  }','  return false','}'],bug:1},
{title:'Tìm số lớn nhất',lines:['let max = 0','for (const n of numbers) {','  if (n < max) max = n','}','return max'],bug:2},
{title:'Đếm từ trong câu',lines:['const words = text.split(" ")','let count = 0','for (const w of words) {','  count = count + w.length','}','return count'],bug:3},
{title:'Lấy phần tử cuối',lines:['function last(list) {','  if (list.length === 0) return null','  return list[list.length]','}'],bug:2},
{title:'Đăng nhập',lines:['if (user.password == null) {','  return "sai"','}','if (user.password !== input) {','  return "đúng"','}','return "sai"'],bug:4},
{title:'Chia trung bình',lines:['let sum = 0','for (const s of scores) sum += s','return sum / scores.length + 1'],bug:2},
{title:'Xóa phần tử trùng',lines:['const seen = new Set()','for (const x of list) {','  if (seen.has(x)) seen.add(x)','  else result.push(x)','}'],bug:2}];
const CHOICE:{title:string;prompt:string;options:string[];answer:number}[]=[
{title:'Khách đổi yêu cầu sát hạn',prompt:'Khách nhắn đổi hẳn giao diện khi còn một ngày. Bạn xử lý thế nào?',options:['Nhận hết và thức đêm làm','Trao đổi phạm vi, đề xuất phần quan trọng làm trước','Từ chối, không làm gì thêm'],answer:1},
{title:'Đồng nghiệp làm trễ',prompt:'Đồng nghiệp trễ phần việc và cả nhóm bị ảnh hưởng. Bạn làm gì trước?',options:['Báo thẳng với sếp ngay','Hỏi vướng mắc gì và hỗ trợ cụ thể','Tự làm lại phần của họ'],answer:1},
{title:'Báo cáo có số liệu sai',prompt:'Bạn phát hiện báo cáo đã gửi có một con số sai. Bạn nên:',options:['Im lặng, hy vọng không ai để ý','Báo ngay, gửi bản sửa kèm giải thích ngắn','Chờ đến khi có người hỏi'],answer:1},
{title:'Ước lượng thời gian',prompt:'Sếp hỏi bao lâu xong việc bạn chưa chắc. Cách trả lời tốt nhất:',options:['"Chắc nhanh thôi"','Đưa khoảng thời gian kèm rủi ro và mốc kiểm tra','"Không biết"'],answer:1},
{title:'Hiểu sai yêu cầu',prompt:'Làm được nửa chừng bạn nhận ra mình hiểu sai yêu cầu. Bạn nên:',options:['Làm tiếp cho xong rồi tính','Dừng lại, xác nhận lại yêu cầu rồi chỉnh hướng','Giấu và sửa lén sau'],answer:1}];
const rng=(seed:number)=>{let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}};
export function bugPuzzle(seed:number,skill:SkillId):BugPuzzle{const r=rng(seed*2654435761>>>0);
 if(skill==='programming'||skill==='logic'||skill==='cooking'){const c=CODE[Math.floor(r()*CODE.length)]!;return{kind:'code',title:c.title,prompt:'Chạm vào dòng có bug.',options:c.lines,answer:c.bug,limitMs:25000}}
 if(skill==='graphics'){const answer=Math.floor(r()*6);return{kind:'layout',title:'Khung nào bị lệch?',prompt:'Chạm vào khung đặt sai vị trí.',options:Array.from({length:6},(_,i)=>`Khung ${i+1}`),answer,limitMs:15000}}
 const c=CHOICE[Math.floor(r()*CHOICE.length)]!;return{kind:'choice',title:c.title,prompt:c.prompt,options:c.options,answer:c.answer,limitMs:30000}}
/** Logic càng cao càng được làm mờ bớt đáp án sai (tối đa 3). Không bao giờ ẩn đáp án đúng. */
export function hiddenOptions(p:BugPuzzle,logicLevel:number,seed:number){if(p.kind==='layout')return[];const n=Math.min(3,Math.max(0,Math.floor((logicLevel-1)/2)),p.options.length-2),r=rng(seed+7),pool=p.options.map((_,i)=>i).filter(i=>i!==p.answer),out:number[]=[];while(out.length<n&&pool.length)out.push(pool.splice(Math.floor(r()*pool.length),1)[0]!);return out.sort((a,b)=>a-b)}
/** Thưởng/phạt thời gian sửa (tỷ lệ giờ chuẩn, mục 12.2: 25–40%). */
export const REPAIR_FAST=.25,REPAIR_SLOW=.33,REPAIR_WRONG=.4;
export function repairFraction(p:BugPuzzle,choice:number,ms:number){if(choice!==p.answer)return{frac:REPAIR_WRONG,result:'wrong' as const};return ms<=p.limitMs/2?{frac:REPAIR_FAST,result:'fast' as const}:{frac:REPAIR_SLOW,result:'slow' as const}}
