import {useState} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {PRODUCTS,lifeOf,type ProductId,type LifeAction} from '../domain/life';
import {HOME_ITEMS,homeOf,homeName,uidOf,type HomeId} from '../domain/home';
import {saleOf,type Line,type Sale,type ShopAction} from '../domain/orders';
import {money} from '../domain/format';
import Icon from './Icon';
import {productArt} from './NpcFace';
import {HomeCards,CartPanel,CartButton,LineArt} from './ShopCards';
import {cart,useCart} from './cart';

/** Hiệu quả ghi rõ đơn vị: tinh thần mỗi ngày, đi nhanh hơn bao nhiêu. */
export const FACT:Record<ProductId,[string,string]>={casual:['smile','+2/ngày'],officeWear:['smile','+2/ngày'],coat:['smile','+2/ngày'],headphones:['bell','Nghe nhạc'],tv:['play','Xem TV'],bicycle:['bus','Nhanh 40%'],motorbike:['bus','Nhanh 65%'],scooter:['bus','Nhanh 70%'],backpack:['bag','Túi 8 món']};
type Zone='clothing'|'electronics'|'transport'|'bag'|'furniture'|'sell'|'cart';
const ZONES:{id:Exclude<Zone,'cart'>;name:string;icon:string;tone:string}[]=[{id:'clothing',name:'Thời trang',icon:'people',tone:'#f3e2d6'},{id:'electronics',name:'Điện tử',icon:'play',tone:'#dfe8ef'},{id:'transport',name:'Xe',icon:'bus',tone:'#e4ecd6'},{id:'bag',name:'Ba lô',icon:'bag',tone:'#ead9c4'},{id:'furniture',name:'Nội thất',icon:'home',tone:'#e9e1cf'},{id:'sell',name:'Bán lại',icon:'coin',tone:'#efe7c9'}];
const FURNITURE=(Object.keys(HOME_ITEMS) as HomeId[]).filter(id=>id!=='lamp'&&id!=='fridge');
const HOME_EXTRA:HomeId[]=['lamp','fridge'];
const FULL='Giỏ chỉ chứa tối đa 8 món.';

/** Trung tâm thương mại: chọn khu rồi mới vào khu, mỗi khu một lưới thẻ. Thêm món vào giỏ, thanh toán một lần, không phí giao. Đồ không dùng nữa bán lại 55% ở khu Bán lại. */
export default function MallShop({state,onAction,onShop}:{state:GameState;onAction:(a:LifeAction)=>GameResult;onShop:(a:ShopAction)=>GameResult}){
 const [zone,setZone]=useState<Zone|null>(null),[note,setNote]=useState('');const l=lifeOf(state);useCart();
 const run=(a:LifeAction)=>{const r=onAction(a);setNote(r.ok?'':r.error)};
 const open=(z:Zone|null)=>{setZone(z);setNote('')};
 const pay=()=>{const r=onShop({kind:'checkout',lines:cart.get()});if(r.ok){cart.clear();open('cart');setNote('Đã mua xong.')}else setNote(r.error)};
 const sell=(item:Sale)=>{const r=onShop({kind:'sell',item});setNote(r.ok?'Đã bán lại.':r.error)};
 if(!zone)return <div className="mall-menu"><div className="mall-bar"><CartButton onOpen={()=>open('cart')}/></div><div className="market-stalls mall-zones">{ZONES.map(z=><button key={z.id} className="market-stall" onClick={()=>open(z.id)}><span className="market-stall-art" style={{background:z.tone}}><Icon name={z.icon}/></span><strong>{z.name}</strong>{z.id!=='sell'&&<small><Icon name="box"/>{z.id==='furniture'?FURNITURE.length*3:(Object.keys(PRODUCTS) as ProductId[]).filter(id=>PRODUCTS[id].category===z.id).length}</small>}</button>)}</div></div>;
 const z=zone==='cart'?{id:'cart' as const,name:'Giỏ hàng',tone:'#f1ead6'}:ZONES.find(x=>x.id===zone)!;
 const back=<header className="market-seller"><button className="market-back" aria-label="Về các khu" onClick={()=>open(null)}><Icon name="chevron-left"/></button><span className="market-seller-copy"><strong>{z.name}</strong></span>{zone!=='cart'&&<CartButton onOpen={()=>open('cart')}/>}</header>;
 const status=note&&<p className="market-note" role="status">{note}</p>;
 if(zone==='cart')return <div className="market-stall-view">{back}<CartPanel state={state} go="Thanh toán" onGo={pay}/>{status}</div>;
 if(zone==='sell'){
  const mine:{key:string;line:Line;sale:Sale;name:string}[]=[...l.owned.map(id=>({key:'p:'+id,line:{kind:'product',id} as Line,sale:{kind:'product',id} as Sale,name:PRODUCTS[id].name})),...homeOf(state).items.map(i=>({key:'h:'+uidOf(i),line:{kind:'home',id:i.id,tier:i.tier??'basic'} as Line,sale:{kind:'home',uid:uidOf(i)} as Sale,name:homeName(i.id,i.tier??'basic')}))];
  return <div className="market-stall-view">{back}{mine.length?<div className="market-grid">{mine.map(m=>{const q=saleOf(state,m.sale),label=q.ok?money(q.value):q.error.startsWith('Đang dùng')?'Đang dùng':q.error.startsWith('Hãy cất')?'Đang đặt':'Giữ lại';return <article key={m.key} className="market-item"><span className="market-item-art" style={{background:z.tone}}><LineArt line={m.line}/></span><strong>{q.ok?q.name:m.name}</strong><button disabled={!q.ok} onClick={()=>sell(m.sale)}>{label}</button></article>})}</div>:<p className="pb-empty">Chưa có đồ để bán</p>}{status}</div>;
 }
 if(zone==='furniture')return <div className="market-stall-view">{back}<div className="market-grid"><HomeCards state={state} ids={[...FURNITURE,...HOME_EXTRA]} tone={z.tone} onFull={()=>setNote(FULL)}/></div>{status}</div>;
 return <div className="market-stall-view">{back}
  <div className="market-grid">{(Object.keys(PRODUCTS) as ProductId[]).filter(id=>PRODUCTS[id].category===zone).map(id=>{const p=PRODUCTS[id],has=l.owned.includes(id),active=l.outfit===id||l.transport===id,line:Line={kind:'product',id},inCart=cart.has(line);return <article key={id} className="market-item">
   <span className="market-item-art" style={{background:z.tone}}><img src={productArt(id)} alt="" loading="lazy" decoding="async"/></span><strong>{p.name}</strong><span className="market-item-facts" title={p.effect}><span><Icon name={FACT[id][0]}/>{FACT[id][1]}</span></span>
   {has?(p.category==='electronics'||p.category==='bag'?<button disabled>Đã có</button>:<button disabled={active} onClick={()=>run({kind:'equip',id,category:p.category as 'clothing'|'transport'})}>{active?'Đang dùng':p.category==='clothing'?'Mặc':'Dùng'}</button>):<button aria-pressed={inCart} onClick={()=>{if(!cart.toggle(line))setNote(FULL);else setNote('')}}>{inCart?'Trong giỏ':money(p.price)}</button>}
  </article>})}</div>{status}</div>}
