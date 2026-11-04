import {useState} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {PRODUCTS,lifeOf,type ProductId,type LifeAction} from '../domain/life';
import {money} from '../domain/format';
import Icon from './Icon';

const FACT:Record<ProductId,[string,string]>={casual:['smile','+2'],officeWear:['smile','+2'],coat:['smile','+2'],headphones:['bell','Nghe nhạc'],tv:['play','Xem TV'],bicycle:['clock','×0,6'],motorbike:['clock','×0,35'],scooter:['clock','×0,3']};
type Zone='clothing'|'electronics'|'transport';
const ZONES:{id:Zone;name:string;icon:string;tone:string}[]=[{id:'clothing',name:'Thời trang',icon:'people',tone:'#f3e2d6'},{id:'electronics',name:'Điện tử',icon:'play',tone:'#dfe8ef'},{id:'transport',name:'Xe',icon:'bus',tone:'#e4ecd6'}];

/** Trung tâm thương mại (04/11): chọn khu rồi mới vào khu, mỗi khu một lưới thẻ. Đồ đã mua dùng ngay ở đây hoặc trong điện thoại. */
export default function MallShop({state,onAction}:{state:GameState;onAction:(a:LifeAction)=>GameResult}){
 const [zone,setZone]=useState<Zone|null>(null),[note,setNote]=useState('');const l=lifeOf(state);
 const run=(a:LifeAction)=>{const r=onAction(a);setNote(r.ok?'':r.error)};
 if(!zone)return <div className="market-stalls mall-zones">{ZONES.map(z=><button key={z.id} className="market-stall" onClick={()=>{setZone(z.id);setNote('')}}><span className="market-stall-art" style={{background:z.tone}}><Icon name={z.icon}/></span><strong>{z.name}</strong><small><Icon name="box"/>{(Object.keys(PRODUCTS) as ProductId[]).filter(id=>PRODUCTS[id].category===z.id).length}</small></button>)}</div>;
 const z=ZONES.find(x=>x.id===zone)!;
 return <div className="market-stall-view"><header className="market-seller"><button className="market-back" aria-label="Về các khu" onClick={()=>{setZone(null);setNote('')}}><Icon name="chevron-left"/></button><span className="market-seller-copy"><strong>{z.name}</strong></span></header>
  <div className="market-grid">{(Object.keys(PRODUCTS) as ProductId[]).filter(id=>PRODUCTS[id].category===zone).map(id=>{const p=PRODUCTS[id],has=l.owned.includes(id),active=l.outfit===id||l.transport===id;return <article key={id} className="market-item">
   <span className="market-item-art" style={{background:z.tone}}><Icon name={p.icon}/></span><strong>{p.name}</strong><span className="market-item-facts" title={p.effect}><span><Icon name={FACT[id][0]}/>{FACT[id][1]}</span></span>
   {has?(p.category==='electronics'?<button disabled>Đã có</button>:<button disabled={active} onClick={()=>run({kind:'equip',id,category:p.category as 'clothing'|'transport'})}>{active?'Đang dùng':p.category==='clothing'?'Mặc':'Dùng'}</button>):<button disabled={state.money<p.price} onClick={()=>run({kind:'product',id})}>{money(p.price)}</button>}
  </article>})}</div>{note&&<p className="market-note" role="status">{note}</p>}</div>}
