import {PRODUCTS,lifeOf,type LifeAction} from '../domain/life';
import {cartTotal,ordersOf,type ShopAction} from '../domain/orders';
import {deliveryFee} from '../domain/specs';
import type {GameState,GameResult} from '../domain/types';
import {money} from '../domain/format';
import {useState} from 'react';
import Icon from './Icon';
import {HomeCards,ProductCards,CartPanel,CartButton,BarChip,ZoneGrid,LineArt,FULL,HOME_IDS,ELEC_HOME_IDS,type Zone as ZoneTile} from './ShopCards';
import {cart,useCart} from './cart';

type View='furniture'|'electronics'|'clothing'|'transport'|'cart'|'orders';
const ZONES:{id:'furniture'|'electronics'|'clothing'|'transport';name:string;icon:string;tone:string}[]=[{id:'furniture',name:'Nội thất',icon:'home',tone:'#e9e1cf'},{id:'electronics',name:'Điện tử',icon:'play',tone:'#dfe8ef'},{id:'clothing',name:'Quần áo',icon:'people',tone:'#f3e2d6'},{id:'transport',name:'Xe',icon:'bus',tone:'#e4ecd6'}];
const TITLE:Record<View,string>={furniture:'Nội thất',electronics:'Điện tử',clothing:'Quần áo',transport:'Xe',cart:'Giỏ hàng',orders:'Đơn hàng'};

/** Mua sắm qua điện thoại: màn đầu là các ô mục sản phẩm, thanh trên chỉ có Đơn hàng và Giỏ hàng. Đặt hàng giao sớm nhất ngày mai, trả tiền khi nhận, phí giao theo cân nặng và kích thước. */
export default function FurnitureShop({state,onShop,onLife}:{state:GameState;onShop:(a:ShopAction)=>GameResult;onLife:(a:LifeAction)=>GameResult}){
 const [notice,setNotice]=useState(''),[view,setView]=useState<View|null>(null);const l=lifeOf(state),lines=useCart(),orders=ordersOf(state).list;
 const run=(r:GameResult,success:string)=>setNotice(r.ok?success:r.error);
 const go=(v:View|null)=>{setView(v);setNotice('')};
 const place=()=>{const r=onShop({kind:'order',lines:cart.get()});if(r.ok){cart.clear();setView('orders');setNotice('Đã đặt hàng, giao sớm nhất ngày mai.')}else setNotice(r.error)};
 const status=<p className="furniture-shop-status" role="status" hidden={!notice}>{notice}</p>;
 const balance=<header className="furniture-shop-balance"><span>Số dư<strong className="t-stat">{money(state.money)}</strong></span></header>;
 const chips=<><BarChip icon="box" label="Đơn hàng" count={orders.length} onOpen={()=>go('orders')}/><CartButton onOpen={()=>go('cart')}/></>;
 const count=(id:string)=>id==='furniture'?HOME_IDS.length*3:(Object.keys(PRODUCTS) as (keyof typeof PRODUCTS)[]).filter(p=>PRODUCTS[p].category===id).length+(id==='electronics'?ELEC_HOME_IDS.length*3:0);
 if(!view)return <section className="furniture-shop" aria-label="Cửa hàng mua sắm">{balance}<div className="mall-bar">{chips}</div><ZoneGrid zones={ZONES.map((z):ZoneTile=>({...z,count:count(z.id)}))} onOpen={id=>go(id as View)}/>{status}</section>;
 const tone=ZONES.find(z=>z.id===view)?.tone;
 return <section className="furniture-shop" aria-label="Cửa hàng mua sắm">{balance}
  <header className="market-seller"><button className="market-back" aria-label="Về các mục" onClick={()=>go(null)}><Icon name="chevron-left"/></button><span className="market-seller-copy"><strong className="t-title">{TITLE[view]}</strong></span>{view!=='orders'&&chips}</header>
  {status}
  {view==='cart'&&<CartPanel state={state} fee={deliveryFee(lines)} go="Đặt hàng" onGo={place} note="Giao sớm nhất ngày mai, trả tiền khi nhận."/>}
  {view==='orders'&&(orders.length?<div className="cart-orders">{orders.map(o=>{const sum=cartTotal(state,o.lines),arrived=state.day>=o.due;return <article key={o.id} className="cart-order"><span className="cart-order-art">{o.lines.slice(0,4).map((x,i)=><span key={i}><LineArt line={x}/></span>)}</span><span className="cart-row"><span><Icon name={arrived?'box':'clock'}/>{arrived?'Đã giao tới':'Ngày mai'}</span><strong>{sum===null?'Cần huỷ':money(sum+deliveryFee(o.lines))}</strong></span><span className="cart-actions"><button disabled={!arrived||sum===null} onClick={()=>run(onShop({kind:'receive',id:o.id}),'Đã nhận hàng.')}>Nhận hàng</button><button className="life-secondary" onClick={()=>run(onShop({kind:'cancel',id:o.id}),'Đã huỷ đơn.')}>Huỷ</button></span></article>})}</div>:<p className="pb-empty">Chưa có đơn hàng</p>)}
  {view==='furniture'&&<div className="furniture-products market-grid"><HomeCards state={state} ids={HOME_IDS} tone={tone} onFull={()=>setNotice(FULL)}/></div>}
  {(view==='electronics'||view==='clothing'||view==='transport')&&<div className="furniture-products market-grid"><ProductCards state={state} category={view} tone={tone} onFull={()=>setNotice(FULL)} onEquip={(id,category)=>run(onLife({kind:'equip',id,category}),'Đã chọn '+PRODUCTS[id].name.toLocaleLowerCase('vi')+'.')}/>{view==='electronics'&&<HomeCards state={state} ids={ELEC_HOME_IDS} tone={tone} onFull={()=>setNotice(FULL)}/>}</div>}
  {view==='transport'&&<button className="life-secondary" disabled={!l.transport} onClick={()=>run(onLife({kind:'equip',id:null,category:'transport'}),'Đã chọn đi bộ.')}>Đi bộ</button>}
 </section>;
}
