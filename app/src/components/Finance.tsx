import {useState} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {fundOf,INVEST_AMOUNTS,type CompanyAction} from '../domain/company';
import {FIN,financeOf,incomingOf,monthlyCost,owedWages,runwayOf,runwayText} from '../domain/finance';
import {shortDate,money} from '../domain/format';
import {ActionRow,DataRow,GameScreen} from './GameUI';

const NOTE={ok:'',warn:`Quỹ dưới ${FIN.warnYellow} tháng chi phí. Nên nhận thêm dự án hoặc giảm chi phí.`,danger:`Quỹ dưới ${FIN.warnRed} tháng chi phí hoặc đang nợ lương.`};

/** T47: tài chính công ty. Chỉ xem: runway, chi phí cố định, khách sắp trả, nợ lương và sổ cái gần đây. */
export default function Finance({state,onAction,onBack,onPayroll}:{state:GameState;onAction:(a:CompanyAction)=>GameResult;onBack:()=>void;onPayroll:()=>void}){
 const [error,setError]=useState('');
 const run=runwayOf(state),f=financeOf(state),incoming=incomingOf(state),owed=owedWages(state),cost=monthlyCost(state);
 return <GameScreen title="Tài chính" onBack={onBack}>
  <div className="finance-runway" data-level={run.level}><small>Còn chi trả được</small><strong>{runwayText(run.months)}</strong>{NOTE[run.level]&&<p role="status">{NOTE[run.level]}</p>}</div>
  <DataRow label="Quỹ công ty" value={money(fundOf(state))}/>
  <DataRow label="Chi phí mỗi tháng" value={money(cost)}/>
  <ActionRow icon="coin" label="Bảng lương" onClick={onPayroll}/>
  {owed>0&&<DataRow label="Nợ lương" value={money(owed)}/>}
  {incoming.length>0&&<><h4 className="finance-head">Khách sắp trả</h4>{incoming.map(r=><DataRow key={r.id} label={`${r.client}, ${shortDate(r.due)}`} value={money(r.amount)}/>)}</>}
  {f.log.length>0&&<><h4 className="finance-head">Gần đây</h4>{f.log.map((l,i)=><DataRow key={i} label={`${shortDate(l.day)} ${l.label}`} value={`${l.amount>0?'+':'−'}${money(Math.abs(l.amount))}`}/>)}</>}
  <h4 className="finance-head">Góp vốn từ tiền cá nhân</h4>
  <div className="game-button-pair">{INVEST_AMOUNTS.map(a=><button key={a} className="game-secondary" disabled={state.money<a} onClick={()=>{const r=onAction({kind:'invest',amount:a});setError(r.ok?'':r.error)}}>{money(a)}</button>)}</div>
  {error&&<p className="game-status" role="status">{error}</p>}
  {!incoming.length&&!f.log.length&&owed<=0&&<p className="game-faint">Chưa có khoản thu chi nào.</p>}
 </GameScreen>}
