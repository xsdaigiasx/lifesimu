import NpcFace from './NpcFace';
import {useState} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {INGREDIENTS,STALLS,isLate,marketPrice,shelfDays,type IngredientId,type LifeAction,type StallId} from '../domain/life';
import {castById,peopleHere,presentAt,relationTier} from '../domain/npc';
import {socialOf} from '../domain/social';
import {clockOf} from '../domain/time';
import {money} from '../domain/format';
import Icon from './Icon';
import PeopleHere,{PersonSheet} from './PeopleHere';

/** Ảnh nguyên liệu (Issue #60): 256×256, nền trong suốt. */
export const ingredientArt=(id:IngredientId)=>`/assets/ingredients/${id}.webp`;
export const ITEM_TONE:Record<IngredientId,string>={rice:'#f2e6c4',egg:'#f6e3b4',vegetable:'#d9ecc8',pork:'#f1d2cc',tofu:'#efe9dc',fish:'#d3e7e6'};

/** Chợ chia theo quầy (chốt 04/11): màn đầu chọn quầy, vào quầy thấy người bán và lưới hàng có ảnh. Ảnh món ăn tạm là ô màu kèm biểu tượng tới khi có art. */
export default function Market({state,stock,onAction,onTalk}:{state:GameState;stock:(id:IngredientId)=>number;onAction:(a:LifeAction)=>GameResult;onTalk?:(id:string,kind:'talk'|'meal')=>GameResult}){
 const [stallId,setStall]=useState<StallId|null>(null),[pick,setPick]=useState<IngredientId|null>(null),[qty,setQty]=useState(1),[note,setNote]=useState(''),[chat,setChat]=useState(false);
 const c=clockOf(state),rel=socialOf(state).relations,stall=STALLS.find(s=>s.id===stallId);
 if(!stall){const sellers:string[]=STALLS.map(s=>s.seller);return <div className="market">
  <div className="market-stalls">{STALLS.map(s=>{const seller=castById(s.seller)!,here=presentAt(seller,state.day,c.minute,'market');return <button key={s.id} className={`market-stall market-stall-${s.id}`} onClick={()=>{setStall(s.id);setNote('');setChat(false)}}><span className="market-stall-art"><Icon name={s.icon}/></span><strong>{s.name}</strong><small>{here?seller.name:'Người nhà trông quầy'}</small></button>})}</div>
  {onTalk&&<PeopleHereFiltered state={state} exclude={sellers} onTalk={onTalk}/>}
 </div>}
 const seller=castById(stall.seller)!,here=presentAt(seller,state.day,c.minute,'market');
 const buy=(id:IngredientId)=>{const r=onAction({kind:'ingredient',id,qty});setNote(r.ok?`Đã mua ${qty} phần ${INGREDIENTS[id].name.toLowerCase()}.`:r.error);setPick(null)};
 
 return <div className="market">
  <header className="market-seller"><button className="market-back" aria-label="Về các quầy" onClick={()=>{setStall(null);setNote('')}}><Icon name="chevron-left"/></button>
   <span className="market-avatar" style={{background:seller.tone}} aria-hidden="true"><NpcFace id={seller.id} label={seller.label}/></span>
   <span className="market-seller-copy"><strong>{here?seller.name:stall.name}</strong><small>{here?stall.name:`${seller.name} về rồi, người nhà trông quầy`}</small>{here&&<span className="market-tier">{relationTier(rel[seller.id]?.score??0)}</span>}</span>
   {here&&onTalk&&<button className="market-chat" aria-expanded={chat} onClick={()=>setChat(v=>!v)}>Hỏi chuyện</button>}
  </header>
  {chat&&onTalk&&<PersonSheet state={state} id={seller.id} onTalk={onTalk} onClose={()=>setChat(false)}/>}
  <div className="market-grid">{stall.items.map(id=>{const it=INGREDIENTS[id],late=isLate(state,id),price=marketPrice(state,id);return <article key={id} className="market-item">
   <span className="market-item-art" style={{background:ITEM_TONE[id]}}>{late&&<b className="late-badge" title="Hàng chiều: rẻ hơn, hạn ngắn hơn" aria-label="Hàng chiều"><Icon name="sunset"/></b>}<img src={ingredientArt(id)} alt="" loading="lazy" decoding="async"/></span>
   <strong>{it.name}</strong>
   <span className="market-item-facts"><span title="Hạn dùng" className={late?'late-tag':''}><Icon name="clock"/>{shelfDays(state,id)} ngày</span><span title="Trong kho"><Icon name="box"/>{stock(id)}</span></span>
   <button disabled={state.money<price} onClick={()=>{setQty(1);setPick(id)}}>{money(price)}</button>
  </article>})}</div>
  {pick&&(()=>{const it=INGREDIENTS[pick],unit=marketPrice(state,pick),max=Math.max(1,Math.min(10,Math.floor(state.money/unit)));return <div className="qty-backdrop" onClick={()=>setPick(null)}><div className="qty-sheet" role="dialog" aria-label={`Mua ${it.name}`} onClick={e=>e.stopPropagation()}>
   <span className="market-item-art" style={{background:ITEM_TONE[pick]}}><img src={ingredientArt(pick)} alt=""/></span><strong>{it.name}</strong>
   <div className="qty-stepper"><button aria-label="Bớt" disabled={qty<=1} onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button><b>{qty}</b><button aria-label="Thêm" disabled={qty>=max} onClick={()=>setQty(q=>Math.min(max,q+1))}>+</button></div>
   <p className="qty-total">{money(unit*qty)}</p>
   <div className="qty-actions"><button className="life-secondary" onClick={()=>setPick(null)}>Hủy</button><button className="primary" disabled={state.money<unit*qty} onClick={()=>buy(pick)}>Xác nhận mua</button></div>
  </div></div>})()}
  {note&&<p className="market-note" role="status">{note}</p>}
 </div>}

function PeopleHereFiltered({state,exclude,onTalk}:{state:GameState;exclude:string[];onTalk:(id:string,kind:'talk'|'meal')=>GameResult}){const others=peopleHere(state,'market').filter(n=>!exclude.includes(n.id));return others.length?<PeopleHere state={state} place="market" onTalk={onTalk} only={others.map(n=>n.id)}/>:null}
