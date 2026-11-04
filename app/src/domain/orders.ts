import type {GameState,GameResult} from './types';
import {PRODUCTS,lifeOf,BAG,bagItems,type ProductId} from './life';
import {HOME_ITEMS,HOME_TIERS,homeOf,homePrice,homeName,planHome,uidOf,type HomeId,type HomeTier} from './home';
import {post} from './money';
import {clockOf,spendTime} from './time';
import {residenceOf} from './housing';

/** T29: giỏ, đơn giao hôm sau, bán lại. Giá và số liệu đã duyệt 04/11. */
export const ORDER={fee:15000,resale:.55,maxLines:8,maxOrders:3,mallMinutes:10} as const;

export type Line={kind:'product';id:ProductId}|{kind:'home';id:HomeId;tier:HomeTier};
export interface Order{id:string;day:number;due:number;lines:Line[]}
export interface OrdersState{version:1;seq:number;list:Order[]}
/** Món đem bán: đồ TTTM theo mã, nội thất theo uid. */
export type Sale={kind:'product';id:ProductId}|{kind:'home';uid:string};
export type ShopAction={kind:'checkout';lines:Line[]}|{kind:'order';lines:Line[]}|{kind:'receive';id:string}|{kind:'cancel';id:string}|{kind:'sell';item:Sale};

const bad=(error:string):GameResult=>({ok:false,error});
const has=(o:object,k:unknown)=>typeof k==='string'&&Object.hasOwn(o,k);
const int=(v:unknown,min:number,max:number):v is number=>Number.isSafeInteger(v)&&Number(v)>=min&&Number(v)<=max;

export const ordersOf=(s:GameState):OrdersState=>s.orders??{version:1,seq:0,list:[]};
export const sameLine=(a:Line,b:Line)=>a.kind==='product'?b.kind==='product'&&a.id===b.id:b.kind==='home'&&a.id===b.id&&a.tier===b.tier;
export const lineName=(l:Line)=>l.kind==='product'?PRODUCTS[l.id].name:homeName(l.id,l.tier);
export const linePrice=(l:Line)=>l.kind==='product'?PRODUCTS[l.id].price:homePrice(l.id,l.tier);
export const resaleOf=(price:number)=>Math.floor(price*ORDER.resale);
export const validLine=(l:unknown):l is Line=>{const x=l as Line;return !!x&&typeof x==='object'&&(x.kind==='product'?has(PRODUCTS,x.id):x.kind==='home'&&has(HOME_ITEMS,x.id)&&has(HOME_TIERS,x.tier))};

/** Áp từng dòng lên bản sao, chưa trừ tiền. Một dòng sai thì cả lô bị từ chối. */
function applyLines(s:GameState,lines:unknown):{ok:true;state:GameState;total:number;prices:number[]}|{ok:false;error:string}{
 if(!Array.isArray(lines)||lines.length<1||lines.length>ORDER.maxLines)return bad('Giỏ hàng chưa hợp lệ.') as {ok:false;error:string};
 let state=s,total=0;const prices:number[]=[];
 for(const l of lines){
  if(!validLine(l))return bad('Món không hợp lệ.') as {ok:false;error:string};
  if(l.kind==='product'){
   const cur=lifeOf(state);if(cur.owned.includes(l.id))return bad('Đã có '+PRODUCTS[l.id].name.toLocaleLowerCase('vi')+'.') as {ok:false;error:string};
   state={...state,life:{...structuredClone(cur),owned:[...cur.owned,l.id]}};total+=PRODUCTS[l.id].price;prices.push(PRODUCTS[l.id].price);
  }else{
   const p=planHome(state,l.id,l.tier);if(!p.ok)return bad(p.error+' ('+homeName(l.id,l.tier)+')') as {ok:false;error:string};
   state=p.state;total+=p.price;prices.push(p.price);
  }
 }
 return{ok:true,state,total,prices};
}
const title=(lines:Line[])=>lines.length===1?'Mua '+lineName(lines[0]).toLocaleLowerCase('vi'):`Mua ${lines.length} món đồ`;

/** Tổng tạm tính cho giỏ ở trạng thái hiện tại (nâng cấp nội thất chỉ tính phần chênh). Null nếu giỏ không mua được. */
/** Giá thật từng dòng trong giỏ (nâng cấp nội thất chỉ tính phần chênh). Null nếu giỏ không mua được. */
export function cartPrices(s:GameState,lines:Line[]):number[]|null{const v=applyLines(s,lines);return v.ok?v.prices:null}
export function cartTotal(s:GameState,lines:Line[]):number|null{const v=applyLines(s,lines);return v.ok?v.total:null}

/** Mua trực tiếp ở TTTM: nhận đồ, trừ tiền, ghi sổ là một thao tác, không có phí giao. */
export function checkout(s:GameState,lines:Line[]):GameResult{
 if(clockOf(s).location!=='mall')return bad('Hãy đến đúng địa điểm.');
 const t=spendTime(s,ORDER.mallMinutes);if(!t.ok)return t;
 const v=applyLines(t.state,lines);if(!v.ok)return v;
 if(t.state.money<v.total)return bad('Chưa đủ tiền.');
 const n=structuredClone(v.state);
 if(post(n,{id:`shop:${n.day}:${n.txSeq??0}`,name:title(lines),amount:-v.total})!=='ok')return bad('Chưa đủ tiền.');
 return{ok:true,state:n};
}

/** Đặt qua điện thoại: chưa trừ tiền, giao sớm nhất hôm sau, trả khi nhận. */
export function placeOrder(s:GameState,lines:Line[]):GameResult{
 const o=ordersOf(s);if(o.list.length>=ORDER.maxOrders)return bad(`Tối đa ${ORDER.maxOrders} đơn đang chờ.`);
 const v=applyLines(s,lines);if(!v.ok)return v;
 const id='o'+(o.seq+1);
 return{ok:true,state:{...s,orders:{version:1,seq:o.seq+1,list:[...o.list,{id,day:s.day,due:s.day+1,lines:structuredClone(lines)}]}}};
}

export function cancelOrder(s:GameState,id:string):GameResult{
 const o=ordersOf(s);if(!o.list.some(x=>x.id===id))return bad('Không tìm thấy đơn.');
 return{ok:true,state:{...s,orders:{...o,list:o.list.filter(x=>x.id!==id)}}};
}

/** Nhận hàng: kiểm lại từng món, trừ tiền cộng phí giao, bỏ đơn khỏi danh sách trong một lần. Không đủ tiền thì đơn còn nguyên. */
export function receiveOrder(s:GameState,id:string):GameResult{
 const o=ordersOf(s),order=o.list.find(x=>x.id===id);if(!order)return bad('Không tìm thấy đơn.');
 if(s.day<order.due)return bad('Đơn chưa giao tới.');
 if(clockOf(s).location!==residenceOf(s))return bad('Hãy về nhà để nhận hàng.');
 const v=applyLines(s,order.lines);if(!v.ok)return bad(v.error+'. Hãy huỷ đơn này.');
 const total=v.total+ORDER.fee;if(s.money<total)return bad('Chưa đủ tiền.');
 const n=structuredClone(v.state);n.orders={...o,list:o.list.filter(x=>x.id!==id)};
 if(post(n,{id:`order:${order.id}:${order.day}`,name:'Nhận đơn hàng',amount:-total})!=='ok')return bad('Chưa đủ tiền.');
 return{ok:true,state:n};
}

/** Giá bán lại của một món, hoặc lý do không bán được. */
export function saleOf(s:GameState,item:Sale):{ok:true;value:number;name:string}|{ok:false;error:string}{
 if(item.kind==='product'){
  if(!has(PRODUCTS,item.id))return{ok:false,error:'Món không hợp lệ.'};
  const l=lifeOf(s);if(!l.owned.includes(item.id))return{ok:false,error:'Chưa sở hữu món này.'};
  if(l.outfit===item.id||l.transport===item.id)return{ok:false,error:'Đang dùng, hãy đổi món khác trước.'};
  if(item.id==='backpack'&&bagItems(s).length>BAG.base)return{ok:false,error:'Hãy ăn bớt món trong túi trước.'};
  return{ok:true,value:resaleOf(PRODUCTS[item.id].price),name:PRODUCTS[item.id].name};
 }
 const it=homeOf(s).items.find(i=>uidOf(i)===item.uid);if(!it)return{ok:false,error:'Chưa sở hữu món này.'};
 if(it.placed)return{ok:false,error:'Hãy cất món này vào kho trước.'};
 if(it.id==='fridge')return{ok:false,error:'Tủ lạnh không bán lại.'};
 const tier=it.tier??'basic';
 return{ok:true,value:resaleOf(homePrice(it.id,tier)),name:homeName(it.id,tier)};
}

/** Bán lại ở TTTM. Chỉ bán đồ không đang dùng, giá 55%, nên mua bán vòng luôn lỗ. */
export function sellBack(s:GameState,item:Sale):GameResult{
 if(clockOf(s).location!=='mall')return bad('Hãy đến đúng địa điểm.');
 const q=saleOf(s,item);if(!q.ok)return bad(q.error);
 const t=spendTime(s,ORDER.mallMinutes);if(!t.ok)return t;
 const n=structuredClone(t.state);
 if(item.kind==='product')n.life={...structuredClone(lifeOf(n)),owned:lifeOf(n).owned.filter(x=>x!==item.id)};
 else n.home={grid:homeOf(n).grid??8,items:homeOf(n).items.filter(i=>uidOf(i)!==item.uid)} as GameState['home'];
 if(post(n,{id:`sell:${n.day}:${n.txSeq??0}`,name:'Bán lại '+q.name.toLocaleLowerCase('vi'),amount:q.value})!=='ok')return bad('Không bán được lúc này.');
 return{ok:true,state:n};
}

export function shopAction(s:GameState,a:ShopAction):GameResult{
 switch(a.kind){
  case'checkout':return checkout(s,a.lines);
  case'order':return placeOrder(s,a.lines);
  case'receive':return receiveOrder(s,a.id);
  case'cancel':return cancelOrder(s,a.id);
  case'sell':return sellBack(s,a.item);
 }
}

export function validOrders(v:unknown,day:number):v is OrdersState{
 const o=v as OrdersState;
 if(!o||typeof o!=='object'||o.version!==1||!int(o.seq,0,1e6)||!Array.isArray(o.list)||o.list.length>ORDER.maxOrders)return false;
 const ids=new Set<string>();
 for(const x of o.list){
  if(!x||typeof x.id!=='string'||!/^o\d{1,7}$/.test(x.id)||ids.has(x.id)||!int(x.day,0,day)||x.due!==x.day+1)return false;
  ids.add(x.id);
  if(!Array.isArray(x.lines)||x.lines.length<1||x.lines.length>ORDER.maxLines||!x.lines.every(validLine))return false;
 }
 return true;
}
