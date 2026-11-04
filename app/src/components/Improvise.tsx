import {useState} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {INGREDIENTS,stock,improvName,comboKey,matchRecipe,knowsRecipe,lifeOf,MEAL_QUALITY,IMPROV_MIN,IMPROV_MAX,IMPROV_MINUTES,RECIPES,type IngredientId,type ImprovGroup} from '../domain/life';
import {ingredientArt,ITEM_TONE} from './Market';
import Icon from './Icon';

/** Ảnh món tự chế theo 5 nhóm tên (không theo từng tổ hợp). */
export const improvArt=(g:ImprovGroup)=>`/assets/meals/improv-${g}.webp`;

/** T23: Nấu bừa. Chạm nguyên liệu để bỏ vào nồi (2–5 phần), chạm trong nồi để lấy ra. */
export default function Improvise({state,onBack,onCook}:{state:GameState;onBack:()=>void;onCook:(items:IngredientId[])=>GameResult|void}){
 const [pot,setPot]=useState<IngredientId[]>([]);const ids=(Object.keys(INGREDIENTS) as IngredientId[]).filter(id=>stock(state,id)>0);
 const left=(id:IngredientId)=>stock(state,id)-pot.filter(x=>x===id).length;
 const key=comboKey(pot),tried=(lifeOf(state).tried??[]).find(x=>x.key===key),match=pot.length>=IMPROV_MIN?matchRecipe(pot):undefined,known=match&&knowsRecipe(state,match);
 const preview=pot.length>=IMPROV_MIN?(known?RECIPES[match!].name:improvName(pot).name):'';
 return <div className="improv">
  <header className="market-seller"><button className="market-back" aria-label="Về sổ công thức" onClick={onBack}><Icon name="chevron-left"/></button><span className="market-seller-copy"><strong>Nấu bừa</strong></span></header>
  <div className="improv-pot" aria-label="Trong nồi">{Array.from({length:IMPROV_MAX},(_,i)=>{const id=pot[i];return <button key={i} className={id?'':'empty'} disabled={!id} aria-label={id?`Lấy ra ${INGREDIENTS[id].name}`:'Chỗ trống'} onClick={()=>setPot(p=>p.filter((_,k)=>k!==i))}>{id&&<img src={ingredientArt(id)} alt=""/>}</button>})}</div>
  <p className="improv-name">{preview||<span>Chọn {IMPROV_MIN}–{IMPROV_MAX} phần</span>}{tried&&<small className={`improv-result ${tried.quality}`}>Đã thử: {MEAL_QUALITY[tried.quality].name}</small>}</p>
  <div className="market-grid">{ids.length?ids.map(id=><button key={id} className="market-item improv-pick" disabled={left(id)<=0||pot.length>=IMPROV_MAX} onClick={()=>setPot(p=>[...p,id])}><span className="market-item-art" style={{background:ITEM_TONE[id]}}><img src={ingredientArt(id)} alt="" loading="lazy"/></span><strong>{INGREDIENTS[id].name}</strong><span className="market-item-facts"><span title="Còn"><Icon name="box"/>{left(id)}</span></span></button>):<p className="pb-empty">Kho trống</p>}</div>
  <button className="improv-cook" disabled={pot.length<IMPROV_MIN||state.energy<4} onClick={()=>{onCook(pot);setPot([])}}><Icon name="flame"/>Nấu thử<small><Icon name="clock"/>{IMPROV_MINUTES}'</small><small><Icon name="bolt"/>−4</small></button>
 </div>}
