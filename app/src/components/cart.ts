import {useSyncExternalStore} from 'react';
import {ORDER,sameLine,type Line} from '../domain/orders';

/** Giỏ hàng dùng chung cho TTTM và điện thoại. Chỉ giữ trong phiên chơi, không ghi vào save. */
let lines:Line[]=[];
const subs=new Set<()=>void>(),emit=()=>subs.forEach(f=>f());
export const cart={
 get:()=>lines,
 has:(l:Line)=>lines.some(x=>sameLine(x,l)),
 /** Thêm hoặc bỏ một món. Đồ nâng cấp được (không xếp chồng) chỉ giữ một cấp trong giỏ. Trả về false khi giỏ đã đầy. */
 toggle(l:Line,stack=true){
  if(lines.some(x=>sameLine(x,l))){lines=lines.filter(x=>!sameLine(x,l));emit();return true}
  if(lines.length>=ORDER.maxLines)return false;
  lines=[...(l.kind==='home'&&!stack?lines.filter(x=>!(x.kind==='home'&&x.id===l.id)):lines),l];emit();return true;
 },
 clear(){if(lines.length){lines=[];emit()}},
};
export const useCart=()=>useSyncExternalStore(f=>{subs.add(f);return()=>{subs.delete(f)}},cart.get);
