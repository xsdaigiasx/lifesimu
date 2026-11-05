/** Tự sao lưu: mỗi ngày game chép bản lưu vào một trong ba ô xoay vòng. Nếu bản lưu chính không đọc được
 * (lỗi sau cập nhật, dữ liệu hỏng) thì khôi phục từ ô mới nhất đọc được thay vì về Ngày 1. */
import type {GameState} from './types';
import type {StorageLike} from './reset';

export const AUTO_SLOTS=3;
export const autoKey=(slot:number)=>`life-simulator-vi-auto${slot}-v1`;
export const AUTO_KEYS=Array.from({length:AUTO_SLOTS},(_,i)=>autoKey(i));
const LAST_KEY='life-simulator-vi-autoday-v1';

/** Gọi mỗi lần lưu: chỉ ghi khi sang ngày game mới (mỗi ngày một lần). */
export function snapshotDay(st:StorageLike,state:GameState):boolean{
 try{if(st.getItem(LAST_KEY)===String(state.day))return false;st.setItem(autoKey(state.day%AUTO_SLOTS),JSON.stringify(state));st.setItem(LAST_KEY,String(state.day));return true}catch{return false}}
/** Tìm bản sao lưu đọc được có ngày lớn nhất. `parse` là engine.parse. */
export function recoverAuto(st:StorageLike,parse:(raw:string|null)=>GameState|null):GameState|null{
 let best:GameState|null=null;
 for(const k of AUTO_KEYS){try{const s=parse(st.getItem(k));if(s&&(!best||s.day>best.day))best=s}catch{/* bỏ ô hỏng */}}
 return best}
/** Xoá khi bắt đầu đời mới hoặc nhập save, để không khôi phục nhầm đời cũ. */
export function clearAuto(st:StorageLike){for(const k of [...AUTO_KEYS,LAST_KEY]){try{st.removeItem(k)}catch{/* bỏ qua */}}}
/** Bản lưu không đọc được (hoặc phải bỏ bớt phần hỏng) được giữ nguyên văn ở đây để còn gửi đi tìm lỗi. */
export const UNREADABLE_KEY='life-simulator-vi-unreadable-v1';
const SLICE_NAME:Record<string,string>={morning:'bản tin sáng',summary:'tổng kết năm',bauCuaLast:'ván bầu cua',coffee:'cà phê',fullness:'độ no',officeLayout:'bố trí văn phòng',journal:'nhật ký',fishing:'câu cá',story:'cốt truyện',inbox:'tin nhắn',study:'khoá học',side:'việc tay trái',orders:'đơn hàng',officeItems:'đồ văn phòng',home:'đồ trong nhà',social:'quan hệ',work:'ca làm',clock:'giờ và vị trí',housing:'nhà ở',rent:'tiền trọ',office:'việc làm',skills:'kỹ năng',company:'công ty',bank:'ngân hàng',life:'đời sống',txIds:'mã giao dịch',txSeq:'mã giao dịch'};
/** Câu báo cho người chơi sau khi mở game, hoặc chuỗi rỗng nếu save đọc bình thường. */
export function repairNotice(r:{recovered:number|null;dropped:readonly string[];lost:boolean}):string{
 if(r.dropped.length){const names=[...new Set(r.dropped.map(k=>SLICE_NAME[k]??k))].join(' và ');return `Bản lưu có phần bị lỗi nên đã đặt lại ${names}. Phần còn lại giữ nguyên.`}
 if(r.recovered!==null)return `Bản lưu chính bị lỗi. Đã khôi phục bản tự lưu ngày ${r.recovered+1}.`;
 if(r.lost)return 'Không đọc được bản lưu cũ. Bản gốc vẫn được giữ, có thể xuất ở Điện thoại, Cài đặt.';
 return '';
}
