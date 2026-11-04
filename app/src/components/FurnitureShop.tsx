import {HOME_ITEMS,type HomeId} from '../domain/home';
import {PRODUCTS,lifeOf,type ProductId,type LifeAction} from '../domain/life';
import {ORDER,cartTotal,ordersOf,type Line,type ShopAction} from '../domain/orders';
import type {GameState,GameResult} from '../domain/types';
import {money} from '../domain/format';
import {useState} from 'react';
import Icon from './Icon';
import {productArt} from './NpcFace';
import {FACT} from './MallShop';
import {HomeCards,CartPanel,LineArt} from './ShopCards';
import {cart,useCart} from './cart';
type Category='furniture'|'electronics'|'clothing'|'transport'|'cart'|'orders';
const FULL='Giỏ chỉ chứa tối đa 8 món.';
/** Mua sắm qua điện thoại: thêm món vào giỏ rồi đặt hàng. Giao sớm nhất ngày mai, trả tiền khi nhận, phí giao cố định mỗi đơn. */
export default function FurnitureShop({state,onShop,onLife}:{state:GameState;onShop:(a:ShopAction)=>GameResult;onLife:(a:LifeAction)=>GameResult}){
 const [notice,setNotice]=useState(''),[category,setCategory]=useState<Category>('furniture');const l=lifeOf(state),lines=useCart(),orders=ordersOf(state).list;
 const run=(r:GameResult,success:string)=>setNotice(r.ok?success:r.error);
 const place=()=>{const r=onShop({kind:'order',lines:cart.get()});if(r.ok){cart.clear();setCategory('orders');setNotice('Đã đặt hàng, giao sớm nhất ngày mai.')}else setNotice(r.error)};
 return <section className="furniture-shop" aria-label="Cửa hàng mua sắm"><header className="furniture-shop-balance"><span>Số dư<strong>{money(state.money)}</strong></span></header>
 <nav className="shop-categories">{([['furniture','Nội thất'],['electronics','Điện tử'],['clothing','Quần áo'],['transport','Xe']] as const).map(([id,name])=><button key={id} aria-pressed={category===id} onClick={()=>{setCategory(id);setNotice('')}}>{name}</button>)}<button aria-pressed={category==='cart'} aria-label={`Giỏ hàng ${lines.length} món`} onClick={()=>{setCategory('cart');setNotice('')}}><Icon name="bag"/>{lines.length}</button><button aria-pressed={category==='orders'} aria-label={`Đơn hàng ${orders.length}`} onClick={()=>{setCategory('orders');setNotice('')}}><Icon name="box"/>{orders.length}</button></nav>
 <p className="furniture-shop-status" role="status" hidden={!notice}>{notice}</p>
 {category==='cart'&&<CartPanel state={state} fee={ORDER.fee} go="Đặt hàng" onGo={place} note="Giao sớm nhất ngày mai, trả tiền khi nhận."/>}
 {category==='orders'&&(orders.length?<div className="cart-orders">{orders.map(o=>{const sum=cartTotal(state,o.lines),arrived=state.day>=o.due;return <article key={o.id} className="cart-order"><span className="cart-order-art">{o.lines.slice(0,4).map((x,i)=><span key={i}><LineArt line={x}/></span>)}</span><span className="cart-row"><span><Icon name={arrived?'box':'clock'}/>{arrived?'Đã giao tới':'Ngày mai'}</span><strong>{sum===null?'Cần huỷ':money(sum+ORDER.fee)}</strong></span><span className="cart-actions"><button disabled={!arrived||sum===null} onClick={()=>run(onShop({kind:'receive',id:o.id}),'Đã nhận hàng.')}>Nhận hàng</button><button className="life-secondary" onClick={()=>run(onShop({kind:'cancel',id:o.id}),'Đã huỷ đơn.')}>Huỷ</button></span></article>})}</div>:<p className="pb-empty">Chưa có đơn hàng</p>)}
 {category!=='cart'&&category!=='orders'&&<div className="furniture-products market-grid">
  {category==='furniture'&&<HomeCards state={state} ids={(Object.keys(HOME_ITEMS) as HomeId[]).filter(id=>id!=='lamp'&&id!=='fridge')} onFull={()=>setNotice(FULL)}/>}
  {category==='electronics'&&<HomeCards state={state} ids={['lamp','fridge']} onFull={()=>setNotice(FULL)}/>}
  {(Object.keys(PRODUCTS) as ProductId[]).filter(id=>PRODUCTS[id].category===category).map(id=>{const item=PRODUCTS[id],has=l.owned.includes(id),active=l.outfit===id||l.transport===id,line:Line={kind:'product',id},inCart=lines.some(x=>x.kind==='product'&&x.id===id);return <article key={id} className="market-item" data-product={id}><span className="market-item-art"><img src={productArt(id)} alt="" loading="lazy" decoding="async"/></span><strong>{item.name}</strong><span className="market-item-facts" title={item.effect}><span><Icon name={FACT[id][0]}/>{FACT[id][1]}</span></span>{has?(item.category==='electronics'?<button disabled>Đã có</button>:<button disabled={active} onClick={()=>run(onLife({kind:'equip',id,category:item.category as 'clothing'|'transport'}),'Đã chọn '+item.name.toLocaleLowerCase('vi')+'.')}>{active?'Đang dùng':item.category==='clothing'?'Mặc':'Dùng'}</button>):<button aria-pressed={inCart} onClick={()=>{if(!cart.toggle(line))setNotice(FULL);else setNotice('')}}>{inCart?'Trong giỏ':money(item.price)}</button>}</article>})}
 </div>}
 {category==='transport'&&<button className="life-secondary" disabled={!l.transport} onClick={()=>run(onLife({kind:'equip',id:null,category:'transport'}),'Đã chọn đi bộ.')}>Đi bộ</button>}
 </section>
}
