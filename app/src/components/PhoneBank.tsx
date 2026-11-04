import {useState} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {lifeOf,DEPOSIT_TERMS,type LifeAction} from '../domain/life';
import {money} from '../domain/format';
import Icon from './Icon';

/** App Ngân hàng (04/11): xem sổ tiết kiệm và khoản vay, trả nợ không tốn giờ. Gửi, rút, vay vẫn ra quầy. Tách khỏi Sổ thu chi. */
export default function PhoneBank({state,onLifeAction}:{state:GameState;onLifeAction:(a:LifeAction)=>GameResult}){
 const l=lifeOf(state),[note,setNote]=useState('');const loan=l.loan;
 const left=(day:number)=>day-state.day;
 const pay=(amount:number)=>{const r=onLifeAction({kind:'repayApp',amount});setNote(r.ok?'':r.error)};
 return <div className="pb">
  <section className="pb-cash"><small>Tiền mặt</small><strong>{money(state.money)}</strong></section>
  <h3 className="pb-head"><Icon name="bank"/>Tiết kiệm</h3>
  {l.savings.length?<div className="pb-list">{l.savings.map(d=>{const due=d.openedDay+d.term,n=left(due),interest=Math.floor(d.principal*DEPOSIT_TERMS[d.term]/10000);return <article key={d.id} className="pb-card">
   <strong>{money(d.principal)}</strong>
   <span className="pb-facts"><span title="Kỳ hạn"><Icon name="calendar"/>{d.term} ngày</span><span title="Lãi khi đến hạn"><Icon name="coin"/>+{money(interest)}</span><span title="Còn lại" className={n<=0?'ok':''}><Icon name="clock"/>{n<=0?'Đến hạn':`${n} ngày`}</span></span>
  </article>})}</div>:<p className="pb-empty">Chưa có sổ</p>}
  <h3 className="pb-head"><Icon name="coin"/>Khoản vay</h3>
  {loan?<article className="pb-card">
   <strong>{money(loan.balance)}</strong>
   <span className="pb-facts"><span title="Gốc vay"><Icon name="box"/>{money(loan.principal)}</span><span title="Hạn trả" className={left(loan.dueDay)<0?'late':''}><Icon name="clock"/>{left(loan.dueDay)<0?'Quá hạn':`${left(loan.dueDay)} ngày`}</span></span>
   <div className="pb-pay">{[100000,500000].filter(a=>a<loan.balance).map(a=><button key={a} disabled={state.money<a} onClick={()=>pay(a)}>{money(a)}</button>)}<button disabled={state.money<loan.balance} onClick={()=>pay(loan.balance)}>Trả hết</button></div>
  </article>:<p className="pb-empty">Không có khoản vay</p>}
  {note&&<p className="ps-note" role="status">{note}</p>}
 </div>}
