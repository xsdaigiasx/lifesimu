import {useRef,useState} from 'react';
import type {GameResult,GameState} from '../domain/types';
import {officeOf,activeLease} from '../domain/office';
import {officeItemOwned,officeItemStarter,shopItems} from '../domain/office-items';
import {money} from '../domain/format';
import {GameScreen} from './GameUI';

interface Props {state:GameState;onBuy:(id:string)=>GameResult;onBack:()=>void}

export default function OfficeCatalog({state,onBuy,onBack}:Props){
 const [selected,setSelected]=useState<string|null>(null),[error,setError]=useState('');
 const purchased=useRef<string|null>(null);
 const office=officeOf(state),items=shopItems(office.size),item=items.find(i=>i.id===selected),leased=activeLease(state);
 if(office.role!=='owner')return null;
 function choose(id:string){if(!leased||officeItemOwned(state,id))return;purchased.current=null;setSelected(id);setError('')}
 function cancel(){setSelected(null);setError('')}
 function buy(){
  if(!item||!leased||officeItemOwned(state,item.id)||state.money<item.price||purchased.current===item.id)return;
  const result=onBuy(item.id);
  if(result.ok){purchased.current=item.id;setSelected(null);setError('')}else setError(result.error);
 }
 return <GameScreen title="Nội thất văn phòng" onBack={onBack} footer={item?<div className="office-catalog-confirm" role="dialog" aria-label="Xác nhận mua">
  <div className="office-catalog-total"><strong>{item.name}</strong><span>{money(item.price)}</span></div>
  {error&&<p className="game-status" role="status">{error}</p>}
  <div className="game-button-pair"><button className="game-secondary" onClick={cancel}>Hủy</button><button className="primary" onClick={buy} disabled={!leased||officeItemOwned(state,item.id)||state.money<item.price}>Xác nhận mua</button></div>
 </div>:undefined}>
  <div className="office-catalog-balance"><span>Số dư</span><strong>{money(state.money)}</strong></div>
  {!leased&&<p className="game-status">Hợp đồng hết hạn</p>}
  <div className="office-catalog-grid">{items.map(product=>{
   const owned=officeItemOwned(state,product.id);
   return <article className="office-catalog-item" key={product.id}>
    <div className="office-catalog-thumbnail"><img src={`/assets/offices/${office.size}/sprites/${product.filename}`} width={product.sprite_width} height={product.sprite_height} alt={product.name} loading="lazy" decoding="async"/></div>
    <strong>{product.name}</strong><span className="office-catalog-price">{money(product.price)}</span>
    {owned?<span className="game-tag">{officeItemStarter(product.id)?'Có sẵn':'Đã mua'}</span>:<button className="game-secondary" disabled={!leased||state.money<product.price} onClick={()=>choose(product.id)}>Mua</button>}
   </article>;
  })}</div>
 </GameScreen>;
}
