import type {GameState} from '../domain/types';
import {fundOf} from '../domain/company';
import {FIN,financeOf,incomingOf,monthlyCost,owedWages,runwayOf,runwayText} from '../domain/finance';
import {shortDate,money} from '../domain/format';
import {DataRow,GameScreen} from './GameUI';

const NOTE={ok:'',warn:`Quỹ dưới ${FIN.warnYellow} tháng chi phí. Nên nhận thêm dự án hoặc giảm chi phí.`,danger:`Quỹ dưới ${FIN.warnRed} tháng chi phí hoặc đang nợ lương.`};

/** T47: tài chính công ty. Chỉ xem: runway, chi phí cố định, khách sắp trả, nợ lương và sổ cái gần đây. */
export default function Finance({state,onBack}:{state:GameState;onBack:()=>void}){
 const run=runwayOf(state),f=financeOf(state),incoming=incomingOf(state),owed=owedWages(state),cost=monthlyCost(state);
 return <GameScreen title="Tài chính" onBack={onBack}>
  <div className="finance-runway" data-level={run.level}><small>Còn chi trả được</small><strong>{runwayText(run.months)}</strong>{NOTE[run.level]&&<p role="status">{NOTE[run.level]}</p>}</div>
  <DataRow label="Quỹ công ty" value={money(fundOf(state))}/>
  <DataRow label="Chi phí mỗi tháng" value={money(cost)}/>
  {owed>0&&<DataRow label="Nợ lương" value={money(owed)}/>}
  {incoming.length>0&&<><h4 className="finance-head">Khách sắp trả</h4>{incoming.map(r=><DataRow key={r.id} label={`${r.client}, ${shortDate(r.due)}`} value={money(r.amount)}/>)}</>}
  {f.log.length>0&&<><h4 className="finance-head">Gần đây</h4>{f.log.map((l,i)=><DataRow key={i} label={`${shortDate(l.day)} ${l.label}`} value={`${l.amount>0?'+':'−'}${money(Math.abs(l.amount))}`}/>)}</>}
  {!incoming.length&&!f.log.length&&owed<=0&&<p className="game-faint">Chưa có khoản thu chi nào.</p>}
 </GameScreen>}
