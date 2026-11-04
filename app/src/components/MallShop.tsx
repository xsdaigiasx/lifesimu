import {useState} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {PRODUCTS,lifeOf,type LifeAction} from '../domain/life';
import {homeOf,homeName,uidOf} from '../domain/home';
import {saleOf,type Line,type Sale,type ShopAction} from '../domain/orders';
import {money} from '../domain/format';
import Icon from './Icon';
import {HomeCards,ProductCards,CartPanel,CartButton,BarChip,ZoneGrid,LineArt,FULL,HOME_IDS,type Zone as ZoneTile} from './ShopCards';
import {cart,useCart} from './cart';

type Zone='clothing'|'electronics'|'transport'|'bag'|'furniture'|'sell'|'cart';
const KHO={name:'Kho',tone:'#efe7c9'};
const ZONES:{id:Exclude<Zone,'cart'|'sell'>;name:string;icon:string;tone:string}[]=[{id:'clothing',name:'Thời trang',icon:'people',tone:'#f3e2d6'},{id:'electronics',name:'Điện tử',icon:'play',tone:'#dfe8ef'},{id:'transport',name:'Xe',icon:'bus',tone:'#e4ecd6'},{id:'bag',name:'Ba lô',icon:'bag',tone:'#ead9c4'},{id:'furniture',name:'Nội thất',icon:'home',tone:'#e9e1cf'}];

/** Trung tâm thương mại: màn đầu là các ô mục sản phẩm, thanh trên chỉ có Kho và Giỏ hàng. Vào mục xem lưới thẻ, bấm giá để thêm vào giỏ, thanh toán một lần, không phí giao. Kho là nơi bán lại đồ không dùng nữa (55% giá gốc). */
export default function MallShop({state,onAction,onShop}:{state:GameState;onAction:(a:LifeAction)=>GameResult;onShop:(a:ShopAction)=>GameResult}){
 const [zone,setZone]=useState<Zone|null>(null),[note,setNote]=useState('');const l=lifeOf(state);useCart();
 const run=(a:LifeAction)=>{const r=onAction(a);setNote(r.ok?'':r.error)};
 const open=(z:Zone|null)=>{setZone(z);setNote('')};
 const pay=()=>{const r=onShop({kind:'checkout',lines:cart.get()});if(r.ok){cart.clear();open('cart');setNote('Đã mua xong.')}else setNote(r.error)};
 const sell=(item:Sale)=>{const r=onShop({kind:'sell',item});setNote(r.ok?'Đã bán lại.':r.error)};
 const mine:{key:string;line:Line;sale:Sale;name:string}[]=[...l.owned.map(id=>({key:'p:'+id,line:{kind:'product',id} as Line,sale:{kind:'product',id} as Sale,name:PRODUCTS[id].name})),...homeOf(state).items.map(i=>({key:'h:'+uidOf(i),line:{kind:'home',id:i.id,tier:i.tier??'basic'} as Line,sale:{kind:'home',uid:uidOf(i)} as Sale,name:homeName(i.id,i.tier??'basic')}))];
 const count=(id:string)=>id==='furniture'?HOME_IDS.length*3:(Object.keys(PRODUCTS) as (keyof typeof PRODUCTS)[]).filter(p=>PRODUCTS[p].category===id).length;
 if(!zone)return <div className="mall-menu"><div className="mall-bar"><BarChip icon="box" label="Kho" count={mine.length} onOpen={()=>open('sell')}/><CartButton onOpen={()=>open('cart')}/></div><ZoneGrid zones={ZONES.map((z):ZoneTile=>({...z,count:count(z.id)}))} onOpen={id=>open(id as Zone)}/></div>;
 const z=zone==='cart'?{name:'Giỏ hàng',tone:'#f1ead6'}:zone==='sell'?KHO:ZONES.find(x=>x.id===zone)!;
 const back=<header className="market-seller"><button className="market-back" aria-label="Về các mục" onClick={()=>open(null)}><Icon name="chevron-left"/></button><span className="market-seller-copy"><strong className="t-title">{z.name}</strong></span>{zone!=='cart'&&<CartButton onOpen={()=>open('cart')}/>}</header>;
 const status=note&&<p className="market-note" role="status">{note}</p>;
 if(zone==='cart')return <div className="market-stall-view">{back}<CartPanel state={state} go="Thanh toán" onGo={pay}/>{status}</div>;
 if(zone==='sell')return <div className="market-stall-view">{back}{mine.length?<div className="market-grid">{mine.map(m=>{const q=saleOf(state,m.sale),label=q.ok?money(q.value):q.error.startsWith('Đang dùng')?'Đang dùng':q.error.startsWith('Hãy cất')?'Đang đặt':'Giữ lại';return <article key={m.key} className="market-item"><span className="market-item-art" style={{background:z.tone}}><LineArt line={m.line}/></span><strong>{q.ok?q.name:m.name}</strong><button disabled={!q.ok} onClick={()=>sell(m.sale)}>{label}</button></article>})}</div>:<p className="pb-empty">Kho trống</p>}{status}</div>;
 if(zone==='furniture')return <div className="market-stall-view">{back}<div className="market-grid"><HomeCards state={state} ids={HOME_IDS} tone={z.tone} onFull={()=>setNote(FULL)}/></div>{status}</div>;
 return <div className="market-stall-view">{back}<div className="market-grid"><ProductCards state={state} category={zone} tone={z.tone} onFull={()=>setNote(FULL)} onEquip={(id,category)=>run({kind:'equip',id,category})}/></div>{status}</div>;
}
