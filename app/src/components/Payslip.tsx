import {useState} from 'react';
import type {GameState} from '../domain/types';
import {payslipsOf,nextPayroll,lastPayroll,type Payroll} from '../domain/payslip';
import {shortDate,money} from '../domain/format';
import {DataRow,GameScreen} from './GameUI';
import Icon from './Icon';

const hours=(m:number)=>String(Math.round(m/60));
const VN=(n:number)=>String(n).replace('.',',');

/** #223: bảng lương cuối tháng của người chơi. Chỉ xem, lùi về các tháng trước. */
export function Payslip({state,onBack}:{state:GameState;onBack:()=>void}){
 const slips=payslipsOf(state),[i,setI]=useState(0),p=slips[i];
 return <GameScreen title="Bảng lương" onBack={onBack}>
  {!p?<p className="game-faint">Chưa có kỳ lương nào.</p>:<>
   <div className="payslip-nav"><button aria-label="Tháng trước" disabled={i>=slips.length-1} onClick={()=>setI(i+1)}><Icon name="chevron-left"/></button><strong className="t-title">Tháng {p.label}</strong><button aria-label="Tháng sau" disabled={i<=0} onClick={()=>setI(i-1)}><Icon name="chevron-right"/></button></div>
   <div className="payslip-grid">
    <div className="payslip-card"><Icon name="calendar"/><strong className="t-stat">{p.days}/{p.stdDays}</strong><small>Ngày làm</small></div>
    <div className="payslip-card"><Icon name="clock"/><strong className="t-stat">{hours(p.minutes)}/{hours(p.stdMinutes)}</strong><small>Giờ làm so với chuẩn</small></div>
    <div className="payslip-card"><Icon name="bolt"/><strong className="t-title">{money(p.bonus)}</strong><small>Thưởng</small></div>
    <div className="payslip-card" data-total><Icon name="coin"/><strong className="t-title">{money(p.total)}</strong><small>Tổng nhận</small></div>
   </div>
   <DataRow label="Lương cơ bản" value={money(p.base)}/>
   <p className="payslip-state" data-paid={p.paid}>{p.paid?`Đã trả ${shortDate(p.payDay)}`:'Chờ trả ngày 1'}</p></>}
 </GameScreen>}

function Block({title,pay,mult}:{title:string;pay:Payroll;mult:number}){
 return <><h4 className="finance-head">{title} {shortDate(pay.day)}</h4>
  {pay.rows.map(r=><div className="payroll-row" key={r.id}><span>{r.name}</span><small>{r.wage>0&&r.wage!==r.amount?money(r.wage):''}</small><strong>{money(r.amount)}</strong></div>)}
  {mult!==1&&pay.rows[0]?.wage!==0&&<DataRow label="Hệ số chính sách" value={`×${VN(mult)}`}/>}
  <DataRow label="Tổng quỹ lương" value={money(pay.total)}/></>}

/** #223: bảng lương nhân viên công ty: kỳ ngày 1 tới (dự kiến) và kỳ vừa trả (đọc từ sổ cái). */
export function Payroll({state,onBack}:{state:GameState;onBack:()=>void}){
 const next=nextPayroll(state),last=lastPayroll(state);
 return <GameScreen title="Bảng lương" onBack={onBack}>
  {next.rows.length>0&&<Block title="Dự kiến ngày" pay={next} mult={next.mult}/>}
  {last&&<Block title="Đã trả ngày" pay={last} mult={1}/>}
  {!next.rows.length&&!last&&<p className="game-faint">Chưa có nhân viên nào.</p>}
 </GameScreen>}
