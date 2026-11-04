import type {GameState} from '../domain/types';
import {PRODUCTS,lifeOf,type ProductId} from '../domain/life';
import {HOME_ITEMS,HOME_MAX,HOME_TIERS,homePrice,homeName,homeOf,type HomeId,type HomeTier} from '../domain/home';
import {cartTotal,cartPrices,linePrice,lineName,sameLine,type Line} from '../domain/orders';
import {money} from '../domain/format';
import Icon from './Icon';
import HomeArt from './HomeArt';
import {productArt} from './NpcFace';
import {spriteFor} from './furniture-art';
import {cart,useCart} from './cart';
import {specOf} from '../domain/specs';
import {InfoButton} from './ShopInfo';

/** Ảnh nhỏ của một dòng trong giỏ. */
export function LineArt({line}:{line:Line}){
 if(line.kind==='product')return <img src={productArt(line.id)} alt="" loading="lazy" decoding="async"/>;
 const sp=spriteFor(line.id,line.tier);return sp?<img src={sp.f} alt="" loading="lazy"/>:<HomeArt id={line.id}/>;
}

/** Lưới thẻ nội thất ba mẫu mỗi loại, dùng ở TTTM và điện thoại. Bấm giá để thêm hoặc bỏ khỏi giỏ. */
export function HomeCards({state,ids,tone,onFull}:{state:GameState;ids:HomeId[];tone?:string;onFull:()=>void}){
 const items=useCart(),owned=homeOf(state).items;
 return <>{ids.flatMap(id=>(Object.keys(HOME_TIERS) as HomeTier[]).map(tier=>{
  const item=HOME_ITEMS[id],stack=HOME_MAX[id]>1,full=stack&&owned.filter(i=>i.id===id).length>=HOME_MAX[id],old=stack?undefined:owned.find(i=>i.id===id),oldTier=old?.tier??'basic',current=!!old&&oldTier===tier,better=!!old&&HOME_TIERS[oldTier].comfort>HOME_TIERS[tier].comfort,price=homePrice(id,tier)-(old?homePrice(id,oldTier):0),line:Line={kind:'home',id,tier},inCart=items.some(x=>x.kind==='home'&&x.id===id&&x.tier===tier),name=homeName(id,tier);
  const blocked=current||better||full;
  return <article key={id+tier} className="market-item" data-product={id}>
   <span className="market-item-art" style={tone?{background:tone}:undefined}><LineArt line={line}/><InfoButton spec={specOf(line)}/></span><strong>{name}</strong>
   <span className="market-item-facts">{id!=='painting'&&id!=='lamp'&&<span title="Kích thước"><Icon name="grid"/>{(item.w/2).toLocaleString('vi-VN')}×{(item.h/2).toLocaleString('vi-VN')} m</span>}{HOME_TIERS[tier].comfort>0&&<span title="Bớt căng thẳng mỗi đêm"><Icon name="moon"/>−{HOME_TIERS[tier].comfort}/đêm</span>}</span>
   <button type="button" aria-pressed={inCart} disabled={blocked} onClick={()=>{if(!cart.toggle(line,stack))onFull()}}>{current?'Đang dùng':full?'Đã đủ':better?'Có tốt hơn':inCart?'Trong giỏ':money(price)}</button>
  </article>}))}</>;
}

/** Danh sách giỏ: ảnh, tên, giá, nút bỏ; cuối là tổng và nút chốt. `fee` > 0 là phí giao cho đơn đặt qua điện thoại. */
export function CartPanel({state,fee=0,go,onGo,note}:{state:GameState;fee?:number;go:string;onGo:()=>void;note?:string}){
 const lines=useCart(),prices=cartPrices(state,lines),sum=cartTotal(state,lines),total=sum===null?null:sum+(lines.length?fee:0);
 if(!lines.length)return <p className="pb-empty">Giỏ trống</p>;
 return <div className="cart-panel"><div className="cart-lines">{lines.map((l,k)=><article key={l.kind+':'+l.id+(l.kind==='home'?l.tier:'')} className="cart-line"><span className="cart-art"><LineArt line={l}/></span><span className="cart-name">{lineName(l)}</span><span className="cart-price">{money(prices?.[k]??linePrice(l))}</span><button className="cart-remove" aria-label={'Bỏ '+lineName(l)} onClick={()=>cart.toggle(l)}><Icon name="close"/></button></article>)}</div>
  {fee>0&&<span className="cart-row"><span><Icon name="bus"/>Phí giao</span><strong>{money(fee)}</strong></span>}
  <span className="cart-row"><span><Icon name="coin"/>Tổng</span><strong>{total===null?'Không mua được':money(total)}</strong></span>
  {note&&<p className="market-note" role="status">{note}</p>}
  <button className="primary wide" disabled={total===null||state.money<(total??0)&&fee===0} onClick={onGo}>{go}</button></div>;
}

/** Nút giỏ ở đầu khu: biểu tượng túi kèm số món. */
export function CartButton({onOpen}:{onOpen:()=>void}){
 const lines=useCart();
 return <button className="cart-chip" aria-label={`Giỏ hàng ${lines.length} món`} onClick={onOpen}><Icon name="bag"/>{lines.length}</button>;
}

/** Hiệu quả ghi rõ đơn vị: tinh thần mỗi ngày, đi nhanh hơn bao nhiêu. */
export const FACT:Record<ProductId,[string,string]>={casual:['smile','+2/ngày'],officeWear:['smile','+2/ngày'],coat:['smile','+2/ngày'],headphones:['bell','Nghe nhạc'],tv:['play','Xem TV'],bicycle:['bus','Nhanh 40%'],motorbike:['bus','Nhanh 65%'],scooter:['bus','Nhanh 70%'],backpack:['bag','Túi 8 món']};
export const FULL='Giỏ chỉ chứa tối đa 8 món.';
/** Mọi loại nội thất, đèn và tủ lạnh xếp cuối. */
export const HOME_IDS=[...(Object.keys(HOME_ITEMS) as HomeId[]).filter(id=>id!=='lamp'&&id!=='fridge'),'lamp','fridge'] as HomeId[];

/** Lưới thẻ đồ TTTM theo nhóm (thời trang, điện tử, xe, ba lô). Món đã có thì Mặc, Dùng hoặc Đã có. */
export function ProductCards({state,category,tone,onFull,onEquip}:{state:GameState;category:string;tone?:string;onFull:()=>void;onEquip:(id:ProductId,category:'clothing'|'transport')=>void}){
 const items=useCart(),l=lifeOf(state);
 return <>{(Object.keys(PRODUCTS) as ProductId[]).filter(id=>PRODUCTS[id].category===category).map(id=>{
  const p=PRODUCTS[id],has=l.owned.includes(id),active=l.outfit===id||l.transport===id,line:Line={kind:'product',id},inCart=items.some(x=>sameLine(x,line));
  return <article key={id} className="market-item" data-product={id}>
   <span className="market-item-art" style={tone?{background:tone}:undefined}><img src={productArt(id)} alt="" loading="lazy" decoding="async"/><InfoButton spec={specOf(line)}/></span><strong>{p.name}</strong>
   <span className="market-item-facts" title={p.effect}><span><Icon name={FACT[id][0]}/>{FACT[id][1]}</span></span>
   {has?(p.category==='electronics'||p.category==='bag'?<button disabled>Đã có</button>:<button disabled={active} onClick={()=>onEquip(id,p.category as 'clothing'|'transport')}>{active?'Đang dùng':p.category==='clothing'?'Mặc':'Dùng'}</button>):<button type="button" aria-pressed={inCart} onClick={()=>{if(!cart.toggle(line))onFull()}}>{inCart?'Trong giỏ':money(p.price)}</button>}
  </article>})}</>;
}

export interface Zone{id:string;name:string;icon:string;tone:string;count?:number}
/** Màn chọn mục: mỗi mục một ô lớn kèm số món. Dùng chung cho TTTM và điện thoại. */
export function ZoneGrid({zones,onOpen}:{zones:Zone[];onOpen:(id:string)=>void}){
 return <div className="market-stalls mall-zones">{zones.map(z=><button key={z.id} type="button" className="market-stall" onClick={()=>onOpen(z.id)}><span className="market-stall-art" style={{background:z.tone}}><Icon name={z.icon}/></span><strong>{z.name}</strong>{z.count!==undefined&&<small><Icon name="box"/>{z.count}</small>}</button>)}</div>;
}

/** Nút tròn góc trên: biểu tượng kèm số (Kho, Đơn hàng). */
export function BarChip({icon,count,label,onOpen}:{icon:string;count:number;label:string;onOpen:()=>void}){
 return <button type="button" className="cart-chip" aria-label={`${label} ${count}`} onClick={onOpen}><Icon name={icon}/>{count}</button>;
}
