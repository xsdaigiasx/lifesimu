import {useState} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {EAT_OUT,INGREDIENTS,RECIPES,MEAL_QUALITY,NO_CHILL,lifeOf,coldUsed,fridgeRoom,lotKey,bagItems,bagCap,fridgeDishes,type EatOutId,type LifeAction} from '../domain/life';
import {fridgeOf} from '../domain/home';
import {residenceOf} from '../domain/housing';
import {clockOf} from '../domain/time';
import Icon from './Icon';
import {mealArt} from './NpcFace';
import {improvArt} from './Improvise';
import {ingredientArt,ITEM_TONE} from './Market';

/** T55: Tủ bếp (mặc định, không giới hạn), Tủ lạnh (mua, sức chứa theo loại đồ) và Túi (món mang về đang mang theo). */
type Run=(a:LifeAction,message?:string)=>void;
const DISH_TONE:Record<EatOutId,string>={banhMi:'#f3e2c4',comTam:'#f6dccd',pho:'#e4ecd6',setLunch:'#efe3cf',hotpot:'#f6d9cf',steak:'#e9dccf'};
const left=(state:GameState,exp:number)=>exp-state.day;
const until=(n:number)=>n<=0?'Hết hạn':`${n} ngày`;

function Card({art,tone,name,tag,facts,soon,bad,children}:{art:string;tone?:string;name:string;tag?:string;facts:React.ReactNode;soon?:boolean;bad?:boolean;children?:React.ReactNode}){
 return <article className={`market-item food-card ${bad?'is-expired':soon?'is-soon':''}`}><span className="market-item-art" style={tone?{background:tone}:undefined}><img src={art} alt="" loading="lazy" decoding="async"/></span><strong>{name}</strong>{tag&&<small className="improv-tag">{tag}</small>}<span className="market-item-facts">{facts}</span>{children&&<div className="food-card-actions">{children}</div>}</article>;
}
const Exp=({n}:{n:number})=><span title="Hạn dùng" className={n<=0?'late':''}><Icon name="clock"/>{until(n)}</span>;

/** Tủ bếp: nguyên liệu để ngoài. */
export function Cabinet({state,run}:{state:GameState;run:Run}){
 const l=lifeOf(state),f=fridgeOf(state),lots=l.pantry.filter(p=>!p.cold);
 return <>{lots.length?<div className="market-grid pantry-grid">{lots.map(p=>{const n=left(state,p.expiresDay),dry=NO_CHILL.includes(p.ingredient);return <Card key={lotKey(p)} art={ingredientArt(p.ingredient)} tone={ITEM_TONE[p.ingredient]} name={INGREDIENTS[p.ingredient].name} soon={n===1} bad={n<=0} facts={<><span title="Số lượng"><Icon name="box"/>{p.qty}</span><Exp n={n}/></>}>
  {f&&dry&&n>0&&<span className="food-card-note">Đồ khô</span>}{f&&!dry&&n>0&&<button disabled={!fridgeRoom(state,'i:'+p.ingredient)} onClick={()=>run({kind:'fridge',target:'lot',id:lotKey(p),put:true},'Đã cất vào tủ lạnh.')}><Icon name="snow"/>Cất tủ lạnh</button>}</Card>})}</div>:<p className="pb-empty">Tủ bếp trống</p>}
  <Discard state={state} run={run}/></>;
}

/** Tủ lạnh: nguyên liệu, món đã nấu và món mang về đang cất. */
export function Fridge({state,run}:{state:GameState;run:Run}){
 const l=lifeOf(state),f=fridgeOf(state);
 if(!f)return <div className="fridge-empty"><Icon name="snow"/><strong>Chưa có tủ lạnh</strong><p>Mua ở Trung tâm thương mại, mục Nội thất.</p></div>;
 const used=coldUsed(l,state.day),lots=l.pantry.filter(p=>p.cold),meals=l.meals.filter(m=>m.cold),dishes=fridgeDishes(state);
 const take=(target:'lot'|'meal'|'bag',id:string)=><button className="ghost" onClick={()=>run({kind:'fridge',target,id,put:false},'Đã lấy ra.')}>Lấy ra</button>;
 return <><div className="fridge-cap"><span><Icon name="snow"/>Đã dùng</span><b>{used}/{f.cap} ô</b><progress max={f.cap} value={used} aria-label="Sức chứa tủ lạnh"/></div>
  {lots.length+meals.length+dishes.length?<div className="market-grid pantry-grid">
   {lots.map(p=>{const n=left(state,p.expiresDay);return <Card key={lotKey(p)} art={ingredientArt(p.ingredient)} tone={ITEM_TONE[p.ingredient]} name={INGREDIENTS[p.ingredient].name} soon={n===1} bad={n<=0} facts={<><span title="Số lượng"><Icon name="box"/>{p.qty}</span><Exp n={n}/></>}>{n>0&&take('lot',lotKey(p))}</Card>})}
   {meals.map(m=>{const n=left(state,m.expiresDay),q=MEAL_QUALITY[m.quality??'normal'];return <Card key={m.id} art={m.custom?improvArt(m.custom.group):mealArt(m.recipe)} name={m.custom?.name??RECIPES[m.recipe].name} tag="Đã nấu" soon={n===1} bad={n<=0} facts={<><span title={q.name}><Icon name="smile"/>{q.name}</span><Exp n={n}/></>}>{n>0&&<><button onClick={()=>run({kind:'eat',id:m.id},'Đã ăn xong.')}>Ăn</button>{take('meal',m.id)}</>}</Card>})}
   {dishes.map(b=>{const n=left(state,b.expiresDay),m=EAT_OUT[b.out];return <Card key={b.id} art={mealArt(b.out)} tone={DISH_TONE[b.out]} name={m.name} tag="Mang về" soon={n===1} facts={<><span title="Độ no"><Icon name="restaurant"/>+{m.fullness}</span><Exp n={n}/></>}><button onClick={()=>run({kind:'eatBag',id:b.id},'Đã ăn xong.')}>Ăn</button>{take('bag',b.id)}</Card>})}
  </div>:<p className="pb-empty">Tủ lạnh trống</p>}
  <Discard state={state} run={run}/></>;
}

/** Món đã nấu để ngoài. */
export function Meals({state,run}:{state:GameState;run:Run}){
 const l=lifeOf(state),f=fridgeOf(state),meals=l.meals.filter(m=>!m.cold);
 return <>{meals.length?<div className="market-grid meal-grid">{meals.map(m=>{const q=MEAL_QUALITY[m.quality??'normal'],n=left(state,m.expiresDay),key='m:'+m.recipe+(m.custom?':c':'');return <Card key={m.id} art={m.custom?improvArt(m.custom.group):mealArt(m.recipe)} name={m.custom?.name??RECIPES[m.recipe].name} tag={m.raw?'Chưa chín':m.custom?'Tự chế':undefined} soon={n===1} bad={n<=0} facts={<><span title={q.name}><Icon name="smile"/>{q.name}</span><span title="Năng lượng"><Icon name="bolt"/>+{Math.round((m.custom??RECIPES[m.recipe]).energy*q.factor)}</span><Exp n={n}/></>}>
  {n>0&&<><button onClick={()=>run({kind:'eat',id:m.id},'Đã ăn xong.')}>Ăn</button>{f&&<button className="ghost" disabled={!fridgeRoom(state,key)} onClick={()=>run({kind:'fridge',target:'meal',id:m.id,put:true},'Đã cất vào tủ lạnh.')}><Icon name="snow"/>Cất tủ</button>}</>}</Card>})}</div>:<p className="pb-empty">Chưa có món đã nấu</p>}
  <Discard state={state} run={run}/></>;
}

function Discard({state,run}:{state:GameState;run:Run}){
 const l=lifeOf(state),any=l.pantry.some(p=>p.expiresDay<=state.day)||l.meals.some(m=>m.expiresDay<=state.day);
 return any?<button className="life-secondary" onClick={()=>run({kind:'discardFood'},'Đã bỏ đồ hết hạn.')}>Bỏ đồ hết hạn</button>:null;
}

/** Túi: món mang về đang mang theo, mở từ thanh điều hướng dưới. */
export function Bag({state,onAction}:{state:GameState;onAction:(a:LifeAction)=>GameResult}){
 const items=bagItems(state),cap=bagCap(state),home=clockOf(state).location===residenceOf(state),f=fridgeOf(state);
 const [msg,setMsg]=useState(''),run=(a:LifeAction)=>{const r=onAction(a);setMsg(r.ok?'':r.error)};
 return <div className="bag-panel"><div className="bag-slots" aria-label={`Túi ${items.length}/${cap}`}>{Array.from({length:cap},(_,i)=><span key={i} className={i<items.length?'on':''}/>)}<b>{items.length}/{cap}</b></div>
  {items.length?<div className="market-grid meal-grid">{items.map(b=>{const n=left(state,b.expiresDay),m=EAT_OUT[b.out];return <Card key={b.id} art={mealArt(b.out)} tone={DISH_TONE[b.out]} name={m.name} soon={n===1} facts={<><span title="Độ no"><Icon name="restaurant"/>+{m.fullness}</span><Exp n={n}/></>}>
   <button onClick={()=>run({kind:'eatBag',id:b.id})}>Ăn</button>{home&&f&&<button className="ghost" disabled={!fridgeRoom(state,'b:'+b.out)} onClick={()=>run({kind:'fridge',target:'bag',id:b.id,put:true})}><Icon name="snow"/>Cất tủ</button>}</Card>})}</div>
  :<div className="fridge-empty"><Icon name="bag"/><strong>Túi trống</strong><p>Chọn Mang về ở quán ăn để bỏ món vào túi.</p></div>}{msg&&<p className="game-status" role="alert">{msg}</p>}</div>;
}
