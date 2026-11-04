import {useState} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {HOUSES,housingOf,type HouseId} from '../domain/housing';
import {money} from '../domain/format';
import Icon from './Icon';

/** Xem nhà ở Khu nhà phố hoặc Biệt thự: phòng, giá; thuê, mua hoặc chuyển về ở. */
export default function HouseVisit({state,house,onMove,onEnter}:{state:GameState;house:Exclude<HouseId,'tro'>;onMove:(house:HouseId,tenure:'rent'|'own')=>GameResult;onEnter:()=>void}){
 const def=HOUSES[house],hs=housingOf(state),living=hs.house===house,owns=hs.owned.includes(house),[note,setNote]=useState('');
 const run=(t:'rent'|'own')=>{const r=onMove(house,t);setNote(r.ok?'':r.error)};
 return <div className="house-visit">
  <div className="house-room-grid">{def.rooms.map(r=><span key={r.id}><strong>{r.name}</strong><small><Icon name="grid"/>{r.w}×{r.h}</small></span>)}</div>
  <div className="house-perks"><span title="Ngủ hồi thêm"><Icon name="moon"/>+{def.sleep.energy}</span><span title="Bếp nấu nhanh hơn"><Icon name="pan"/>−20%</span><span title="Tự học thêm XP"><Icon name="note"/>+25%</span></div>
  <div className="house-buy">
   {living?<><button className="primary" onClick={onEnter}>Vào nhà</button>{hs.tenure==='rent'&&def.price&&<button disabled={state.money<def.price} onClick={()=>run('own')}><small>Mua</small>{money(def.price)}</button>}</>:owns?<button className="primary" onClick={()=>run('own')}>Chuyển về đây</button>:<>
    {def.rent&&<button disabled={state.money<def.rent} onClick={()=>run('rent')}><small>Thuê</small>{money(def.rent)}<small>/tháng</small></button>}
    {def.price&&<button disabled={state.money<def.price} onClick={()=>run('own')}><small>Mua</small>{money(def.price)}</button>}
   </>}
  </div>
  {note&&<p className="ps-note" role="status">{note}</p>}
 </div>}
