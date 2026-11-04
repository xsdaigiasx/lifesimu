import {useState} from 'react';
import type {GameState} from '../domain/types';
import {lifeOf,depositBp,savingBp,type LifeAction} from '../domain/life';
import {BANK,SAVE_RATE,bankOf,loanRoom,monthlyIncome,quote,dueOf,interestOf,creditFactor,type Months} from '../domain/bank';
import {money,shortDate} from '../domain/format';
import {DataRow} from './GameUI';

const TERMS=[90,180,360] as const;
const termText=(term:number)=>term>=90?`${term/30} tháng`:`${term} ngày`;

/** Quầy ngân hàng: tiết kiệm kỳ hạn 3, 6, 12 tháng; vay trả góp đều (PMT) theo hạn mức và điểm tín dụng. */
export default function BankDesk({state,run}:{state:GameState;run:(a:LifeAction,message?:string)=>void}){
 const [page,setPage]=useState<'savings'|'loan'>('savings'),[amount,setAmount]=useState(1000000),[term,setTerm]=useState<90|180|360>(90),[loan,setLoan]=useState(1000000),[months,setMonths]=useState<Months>(12),[repayment,setRepayment]=useState(100000);
 const l=lifeOf(state),b=bankOf(state),room=loanRoom(state),income=monthlyIncome(state),q=quote(Math.max(loan,BANK.loanMin),months);
 const canLoan=income>0&&b.loans.length<BANK.maxLoans&&loan>=BANK.loanMin&&loan<=room&&loan%BANK.loanStep===0;
 return <>
  <nav className="life-tabs">{([['savings','Tiết kiệm'],['loan','Vay và trả nợ']] as const).map(([id,label])=><button key={id} aria-pressed={page===id} onClick={()=>setPage(id)}>{label}</button>)}</nav>
  {page==='savings'?<>
   <label className="life-field">Số tiền gửi<input type="number" min={100000} max={100000000} step={100000} value={amount} onChange={e=>setAmount(Number(e.target.value))}/></label>
   <label className="life-field">Kỳ hạn<select value={term} onChange={e=>setTerm(Number(e.target.value) as 90|180|360)}>{TERMS.map(t=><option key={t} value={t}>{termText(t)}, lãi {SAVE_RATE[t]/100}%/năm</option>)}</select></label>
   <DataRow label="Lãi khi đến hạn" value={money(Math.max(0,Math.floor(amount*depositBp(term)/10000)))}/>
   <small>Rút trước hạn: nhận lại gốc, không có lãi.</small>
   <button className="primary wide" disabled={amount<100000||state.money<amount||l.savings.length>=3} onClick={()=>run({kind:'deposit',amount,term},'Đã mở sổ tiết kiệm.')}>Gửi tiết kiệm</button>
   <div className="life-list">{l.savings.map(d=><article key={d.id}><div><strong>{money(d.principal)}</strong><small>{termText(d.term)}, đáo hạn {shortDate(d.openedDay+d.term)}, lãi {savingBp(d)/100}%/kỳ</small></div><button onClick={()=>run({kind:'withdraw',id:d.id},'Đã tất toán sổ.')}>{state.day>=d.openedDay+d.term?'Tất toán':'Rút sớm'}</button></article>)}</div>
  </>:<>
   <DataRow label="Điểm tín dụng" value={`${b.credit} (hệ số ${creditFactor(b.credit).toLocaleString('vi-VN')})`}/>
   <DataRow label="Hạn mức còn vay" value={income>0?money(room):'Cần có việc làm'}/>
   {l.loan&&<><DataRow label="Khoản vay cũ, dư nợ" value={money(l.loan.balance)}/><DataRow label="Hạn trả" value={shortDate(l.loan.dueDay)}/>
    <label className="life-field">Số tiền trả<input type="number" min={1} max={l.loan.balance} value={repayment} onChange={e=>setRepayment(Number(e.target.value))}/></label>
    <button className="primary wide" disabled={repayment<=0||repayment>l.loan.balance||state.money<repayment} onClick={()=>run({kind:'repay',amount:repayment},'Đã trả một phần khoản vay.')}>Trả nợ</button>
    <button className="life-secondary" disabled={state.money<l.loan.balance} onClick={()=>run({kind:'repay',amount:l.loan!.balance},'Đã trả hết nợ.')}>Trả toàn bộ</button></>}
   {b.loans.length>0&&<div className="life-list">{b.loans.map(x=>{const late=state.day>x.nextDue,due=dueOf(x),payoff=x.balance+interestOf(x.balance)+x.fee;return <article key={x.id}><div><strong>{money(x.balance)}</strong><small>Kỳ {x.paid+1}/{x.months}, {late?'trễ hạn từ':'hạn'} {shortDate(x.nextDue)}{x.fee>0?`, phí trễ ${money(x.fee)}`:''}</small></div><span className="cart-actions"><button disabled={state.money<due} onClick={()=>run({kind:'payLoan',id:x.id},'Đã trả kỳ này.')}>Trả {money(due)}</button><button className="life-secondary" disabled={state.money<payoff} onClick={()=>run({kind:'payoff',id:x.id},'Đã tất toán khoản vay.')}>Tất toán</button></span></article>})}</div>}
   <label className="life-field">Số tiền vay<input type="number" min={BANK.loanMin} max={Math.max(BANK.loanMin,room)} step={BANK.loanStep} value={loan} onChange={e=>setLoan(Number(e.target.value))}/></label>
   <label className="life-field">Kỳ hạn<select value={months} onChange={e=>setMonths(Number(e.target.value) as Months)}>{BANK.months.map(m=><option key={m} value={m}>{m} tháng</option>)}</select></label>
   <DataRow label="Lãi" value="14%/năm"/>
   <DataRow label="Trả mỗi tháng" value={money(q.payment)}/>
   <DataRow label="Tổng tiền lãi" value={money(q.interest)}/>
   <small>Trễ hạn: phí 2% kỳ trả và hạ điểm tín dụng.</small>
   <button className="primary wide" disabled={!canLoan} onClick={()=>run({kind:'loan',amount:loan,months},'Đã nhận khoản vay.')}>Vay</button>
  </>}
 </>;
}
