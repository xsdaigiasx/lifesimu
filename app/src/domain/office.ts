import {canEnterOffice} from './work';
import {post} from './money';
import type {GameState,GameResult} from './types';
import {spendTime,clockOf,HALF_DAY} from './time';
export const SIZES={small:{name:'Nhỏ',area:40,seats:6,rent:1200000},medium:{name:'Vừa',area:85,seats:12,rent:2400000},large:{name:'Lớn',area:160,seats:24,rent:4200000}} as const;
export type OfficeSize=keyof typeof SIZES;
export const INDUSTRIES={tech:{name:'Công nghệ',desc:'Phát triển phần mềm và sản phẩm số.',color:'#507e87'},design:{name:'Thiết kế',desc:'Thiết kế hình ảnh, thương hiệu và nội dung.',color:'#b98460'},trade:{name:'Thương mại',desc:'Kinh doanh, đơn hàng và chăm sóc khách hàng.',color:'#6f8b60'},accounting:{name:'Kế toán',desc:'Sổ sách, báo cáo và dịch vụ tài chính.',color:'#87819a'}} as const;
export type Industry=keyof typeof INDUSTRIES;
export const COMPANIES=[{id:'sen-code',name:'Sen Code',industry:'tech',size:'small',floor:'Tầng 2 Phòng 201'},{id:'an-nhien-tech',name:'An Nhiên Tech',industry:'tech',size:'large',floor:'Tầng 6 Toàn tầng'},{id:'net-studio',name:'Nét Studio',industry:'design',size:'small',floor:'Tầng 2 Phòng 202'},{id:'moc-creative',name:'Mộc Creative',industry:'design',size:'medium',floor:'Tầng 3 Phòng 301'},{id:'song-viet',name:'Sông Việt',industry:'trade',size:'large',floor:'Tầng 5 Toàn tầng'},{id:'can-bang',name:'Cân Bằng',industry:'accounting',size:'medium',floor:'Tầng 4 Phòng 401'}] as const;
export const STAFF=[{id:'lan',name:'Mai Lan',role:'Lễ tân tòa nhà',initial:'L',color:'#ad7d69',line:'Chào bạn! Bảng tuyển dụng ở bên cạnh, ghế chờ ở phía trong.'},{id:'minh',name:'Đức Minh',role:'Quản lý mặt bằng',initial:'M',color:'#6c8790',line:'Tôi có mặt bằng từ 40 đến 160 m². Bạn muốn xem chỗ nào?'},{id:'ha',name:'Ngọc Hà',role:'Điều phối tuyển dụng',initial:'H',color:'#8c86a0',line:'Bạn mang CV chứ? Các công ty công nghệ đang nhận hồ sơ.'},{id:'bao',name:'Quốc Bảo',role:'Kỹ thuật viên',initial:'B',color:'#778a68',line:'Nhân viên sửa góc làm việc cá nhân, còn thiết bị chung do chủ công ty quản lý.'}] as const;
export const DECOR={plant:{name:'Chậu cây',price:120000},lamp:{name:'Đèn bàn',price:180000},coffee:{name:'Góc cà phê',price:450000}} as const;
export type DecorId=keyof typeof DECOR;
export interface Application{companyId:string;status:'pending'|'interview'|'passed'|'failed'|'hired';submittedDay:number;interviewDay:number;startDay:number;answers:number[];questions:string[];cv:string}
export const QUESTIONS=[
{id:'machines',text:'5 máy xử lý 5 tác vụ trong 5 phút. 100 máy như vậy xử lý 100 tác vụ trong bao lâu?',options:['5 phút','100 phút','500 phút'],answer:0,why:'Mỗi máy xử lý một tác vụ trong 5 phút; các máy chạy song song.'},
{id:'race',text:'Bạn vượt người đang đứng thứ hai trong một cuộc đua. Bạn đứng thứ mấy?',options:['Thứ nhất','Thứ hai','Thứ ba'],answer:1,why:'Bạn chiếm vị trí thứ hai của người vừa bị vượt.'},
{id:'months',text:'Có bao nhiêu tháng trong năm có ít nhất 28 ngày?',options:['1 tháng','11 tháng','12 tháng'],answer:2,why:'Cả 12 tháng đều có ít nhất 28 ngày.'},
{id:'pills',text:'Uống 3 viên, mỗi viên cách nhau 30 phút; viên đầu uống ngay. Bao lâu thì uống xong?',options:['30 phút','60 phút','90 phút'],answer:1,why:'Các mốc là phút 0, 30 và 60.'},
{id:'code',text:'Hai người sửa cùng một lỗi. Cách nào tránh ghi đè công việc của nhau?',options:['Cùng sửa thẳng một bản rồi lưu liên tục','Dùng nhánh riêng, trao đổi và kiểm tra trước khi gộp','Xóa bản của người kia'],answer:1,why:'Nhánh riêng và trao đổi giúp phối hợp, kiểm tra thay đổi trước khi gộp.'}
] as const;
export const questionFor=(id:string)=>QUESTIONS.find(q=>q.id===id)!;
export function validApplication(v:unknown):v is Application{if(!v||typeof v!=='object')return false;const a=v as Application;const c=COMPANIES.find(c=>c.id===a.companyId);return !!c&&c.industry==='tech'&&['pending','interview','passed','failed','hired'].includes(a.status)&&Number.isInteger(a.submittedDay)&&a.submittedDay>=0&&a.submittedDay<=100000&&a.interviewDay===a.submittedDay+1&&a.startDay===a.interviewDay+1&&typeof a.cv==='string'&&a.cv.length>=20&&a.cv.length<=600&&Array.isArray(a.questions)&&a.questions.length===3&&new Set(a.questions).size===3&&a.questions.every(id=>QUESTIONS.some(q=>q.id===id))&&Array.isArray(a.answers)&&a.answers.length<=3&&a.answers.every(n=>Number.isInteger(n)&&n>=0&&n<3)&&(a.status==='pending'?a.answers.length===0:a.status==='interview'?a.answers.length<3:a.answers.length===3)&&(a.status==='passed'||a.status==='hired'?a.answers.every((n,i)=>n===questionFor(a.questions[i]!).answer):a.status==='failed'?a.answers.some((n,i)=>n!==questionFor(a.questions[i]!).answer):true)}
export interface OfficeState{application?:Application|null;role:'visitor'|'employee'|'owner';employerId:string|null;industry:Industry;size:OfficeSize;name:string;leaseUntil:number;workComputer:number;computers:number;printer:number;employeeDecor:Partial<Record<DecorId,number|null>>;ownerDecor:Partial<Record<DecorId,number|null>>;met:string[]}
export function initialOffice():OfficeState{return{role:'visitor',employerId:null,industry:'tech',size:'small',name:'Công ty của tôi',leaseUntil:0,workComputer:1,computers:1,printer:0,employeeDecor:{},ownerDecor:{},met:[]}}
export const officeOf=(s:GameState)=>s.office??initialOffice();
export const activeLease=(s:GameState)=>officeOf(s).role==='owner'&&officeOf(s).leaseUntil>s.day;
export function validOffice(value:unknown):value is OfficeState{
 if(!value||typeof value!=='object')return false;const o=value as OfficeState;
 const level=(v:number,min:number,max:number)=>Number.isInteger(v)&&v>=min&&v<=max;
 const decor=(v:OfficeState['ownerDecor'])=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.entries(v).every(([id,slot])=>Object.hasOwn(DECOR,id)&&(slot===null||level(slot!,0,2)))&&new Set(Object.values(v).filter(v=>v!==null)).size===Object.values(v).filter(v=>v!==null).length;
 return (o.application==null||validApplication(o.application))&&['visitor','employee','owner'].includes(o.role)&&(o.employerId===null||COMPANIES.some(c=>c.id===o.employerId))&&(o.role!=='employee'||o.employerId!==null)&&Object.hasOwn(INDUSTRIES,o.industry)&&Object.hasOwn(SIZES,o.size)&&typeof o.name==='string'&&o.name.trim().length>0&&o.name.length<=32&&level(o.leaseUntil,0,100007)&&level(o.workComputer,1,3)&&level(o.computers,1,3)&&level(o.printer,0,2)&&decor(o.employeeDecor)&&!Object.hasOwn(o.employeeDecor,'coffee')&&decor(o.ownerDecor)&&Array.isArray(o.met)&&o.met.length<=STAFF.length&&new Set(o.met).size===o.met.length&&o.met.every(id=>STAFF.some(n=>n.id===id));
}
export type OfficeAction={kind:'apply';id:string;cv:string}|{kind:'startInterview'}|{kind:'answer';choice:number}|{kind:'acceptOffer'}|{kind:'cancelApplication'}|{kind:'shift'}|{kind:'endLease'}|{kind:'leave'}|{kind:'rent';size:OfficeSize;industry:Industry;name:string}|{kind:'renew'}|{kind:'upgrade';item:'computer'|'printer'}|{kind:'buyDecor';id:DecorId}|{kind:'place';id:DecorId;slot:number|null}|{kind:'meet';id:string};
export function officeAction(s:GameState,a:OfficeAction):GameResult{
 if(s.fishing?.atLake)return{ok:false,error:'Hãy về thành phố để tới văn phòng.'};
 let n=structuredClone(s);const o=n.office=structuredClone(officeOf(s));
 const fail=(error:string):GameResult=>({ok:false,error});
 if(o.application?.status==='interview'&&a.kind!=='answer')return fail('Hãy trả lời hết câu hỏi trong buổi phỏng vấn.');
 const pay=(amount:number,label:string)=>amount<=0||post(n,{name:label,amount:-amount})==='ok';
 if(o.role==='employee'&&!canEnterOffice(s))return fail('Công ty đã hết giờ làm.');if(o.role==='employee'&&['upgrade','buyDecor','place','rent','renew'].includes(a.kind))return fail('Thiết bị công ty do công ty quản lý.');
 if(a.kind==='meet'){if(!STAFF.some(p=>p.id===a.id))return fail('Không tìm thấy nhân vật.');if(o.met.includes(a.id))return fail('Bạn đã làm quen với người này.');o.met.push(a.id)}
 else if(a.kind==='apply'){
  if(o.role!=='visitor')return fail('Bạn đang có văn phòng.');const c=COMPANIES.find(c=>c.id===a.id);if(!c||c.industry!=='tech')return fail('Bạn chỉ có bằng IT. Chứng chỉ ngành khác sẽ mở sau.');
  if(o.application&&['pending','interview','passed'].includes(o.application.status)&&!(o.application.status==='pending'&&s.day>o.application.interviewDay))return fail('Bạn đang có hồ sơ chờ xử lý.');
  if(o.application&&o.application.status==='failed'&&s.day<=o.application.interviewDay)return fail('Bạn có thể nộp lại CV từ ngày mai.');
  if(typeof a.cv!=='string'||a.cv.trim().length<20||a.cv.trim().length>600)return fail('CV cần 20–600 ký tự giới thiệu.');
  const r=spendTime(n,15);if(!r.ok)return r;n=r.state;n.office=o;
  o.application={companyId:c.id,status:'pending',submittedDay:s.day,interviewDay:s.day+1,startDay:s.day+2,answers:[],questions:[0,1,2].map(i=>QUESTIONS[(s.day+i+(c.id==='sen-code'?0:2))%QUESTIONS.length]!.id),cv:a.cv.trim()};
 }else if(a.kind==='cancelApplication'){if(o.application?.status==='interview')return fail('Hãy hoàn thành phỏng vấn trước.');o.application=null}
 else if(a.kind==='startInterview'){
  const app=o.application;if(!app||app.status!=='pending'||o.role!=='visitor')return fail('Bạn chưa có lịch phỏng vấn.');
  if(s.day!==app.interviewDay)return fail(s.day<app.interviewDay?'Buổi phỏng vấn diễn ra vào ngày mai.':'Bạn đã lỡ hẹn. Hãy nộp CV lại.');
  if(clockOf(s).location!=='office')return fail('Hãy đến khu văn phòng để phỏng vấn.');
  const r=spendTime(n,HALF_DAY);if(!r.ok)return r;n=r.state;n.office=o;app.status='interview';
 }else if(a.kind==='answer'){
  const app=o.application;if(!app||app.status!=='interview'||!Number.isInteger(a.choice)||a.choice<0||a.choice>2)return fail('Câu trả lời không hợp lệ.');
  app.answers.push(a.choice);if(app.answers.length===3)app.status=app.answers.every((n,i)=>n===questionFor(app.questions[i]!).answer)?'passed':'failed';
 }else if(a.kind==='acceptOffer'){
  const app=o.application;if(!app||app.status!=='passed'||o.role!=='visitor')return fail('Bạn chưa có thư nhận việc.');if(s.day<app.startDay)return fail('Bạn bắt đầu đi làm từ ngày mai.');o.role='employee';o.employerId=app.companyId;app.status='hired';
 }else if(a.kind==='shift'){return fail('Hãy chọn công việc để bắt đầu ca.');
 } else if(a.kind==='endLease'){if(o.role!=='owner')return fail('Bạn không có hợp đồng thuê.');o.role='visitor';o.leaseUntil=s.day;o.employerId=null}
 else if(a.kind==='leave'){if(o.role!=='employee')return fail('Bạn không ở vai nhân viên.');o.role='visitor';o.employerId=null;o.application=null}
 else if(a.kind==='rent'){
  if(o.role!=='visitor')return fail('Bạn đang có văn phòng.');if(o.application&&['pending','interview','passed'].includes(o.application.status))return fail('Hãy hủy hồ sơ tuyển dụng trước khi thuê.');
  if(!Object.hasOwn(SIZES,a.size)||!Object.hasOwn(INDUSTRIES,a.industry)||typeof a.name!=='string'||!a.name.trim()||a.name.trim().length>32)return fail('Hãy chọn ngành, diện tích và tên công ty tối đa 32 ký tự.');
  if(!pay(SIZES[a.size].rent,`Thuê văn phòng ${SIZES[a.size].area} m² 7 ngày`))return fail('Chưa đủ tiền trả kỳ thuê 7 ngày.');o.role='owner';o.size=a.size;o.industry=a.industry;o.name=a.name.trim();o.leaseUntil=s.day+7;
 }
 else if(a.kind==='renew'){
  if(o.role!=='owner'||activeLease(s))return fail('Chỉ gia hạn khi hợp đồng đã hết hạn.');
  if(!pay(SIZES[o.size].rent,'Gia hạn văn phòng 7 ngày'))return fail('Chưa đủ tiền gia hạn.');o.leaseUntil=s.day+7;
 }
 else{
  if(o.role==='visitor')return fail('Hãy nhận chỗ làm hoặc thuê văn phòng trước.');
  if(o.role==='owner'&&!activeLease(s))return fail('Hợp đồng đã hết hạn. Hãy gia hạn để sửa văn phòng.');
  if(a.kind==='upgrade'){
   if(!['computer','printer'].includes(a.item))return fail('Thiết bị không hợp lệ.');
   if(a.item==='printer'&&o.role!=='owner')return fail('Máy in chung do chủ công ty quản lý.');
   const key=a.item==='printer'?'printer':o.role==='employee'?'workComputer':'computers',max=a.item==='printer'?2:3;
   if(o[key]>=max)return fail('Thiết bị đã ở mức cao nhất.');
   const price=upgradePrice(s,a.item);if(!pay(price,a.item==='printer'?'Văn phòng Nâng cấp máy in':o.role==='employee'?'Góc làm việc Nâng cấp máy tính':'Văn phòng Nâng cấp dàn máy tính'))return fail('Chưa đủ tiền nâng cấp.');o[key]++;
  }else{
   if(!Object.hasOwn(DECOR,a.id)||(o.role==='employee'&&a.id==='coffee'))return fail('Bạn không thể sửa hạng mục này.');
   const decor=o.role==='employee'?o.employeeDecor:o.ownerDecor;
   if(a.kind==='buyDecor'){if(Object.hasOwn(decor,a.id))return fail('Bạn đã có món đồ này.');if(!pay(DECOR[a.id].price,'Văn phòng '+DECOR[a.id].name))return fail('Chưa đủ tiền mua đồ.');decor[a.id]=null}
   else if(a.kind==='place'){if(!Object.hasOwn(decor,a.id))return fail('Hãy mua đồ trước.');if(a.slot!==null&&(!Number.isInteger(a.slot)||a.slot<0||a.slot>2))return fail('Vị trí không hợp lệ.');if(a.slot!==null&&Object.entries(decor).some(([id,slot])=>id!==a.id&&slot===a.slot))return fail('Vị trí này đang có đồ. Hãy cất món đó trước.');decor[a.id]=a.slot}
  }
 }
 const duration=['meet','place','leave','acceptOffer','endLease'].includes(a.kind)?5:a.kind==='rent'||a.kind==='renew'||a.kind==='upgrade'?30:a.kind==='buyDecor'?10:0;
 if(duration){const r=spendTime(n,duration);if(!r.ok)return r;n=r.state}
 return{ok:true,state:n};
}
export function upgradePrice(s:GameState,item:'computer'|'printer'){const o=officeOf(s);return item==='printer'?[350000,750000,0][o.printer]!:([0,450000,900000,0][o.role==='employee'?o.workComputer:o.computers]!*(o.role==='owner'?SIZES[o.size].seats:1))}
