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
