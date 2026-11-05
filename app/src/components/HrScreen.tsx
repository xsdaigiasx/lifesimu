import {useState} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {staffOf,levelOf,HIRE_SKILLS} from '../domain/hiring';
import {bondOf,bondTier,workAt} from '../domain/staff';
import {hrView,hrPreview,pendingFor,type HrAction} from '../domain/hr';
import {money} from '../domain/format';
import {DataRow,GameScreen} from './GameUI';

/** T48: một nhân viên. Có việc đang chờ thì hiện lời nhân viên và các cách xử lý; không thì hiện thẻ nhân viên. */
export default function HrScreen({state,emp,onAction,onBack}:{state:GameState;emp:string;onAction:(a:HrAction)=>GameResult;onBack:()=>void}){
 const [result,setResult]=useState(''),[error,setError]=useState('');
 const e=staffOf(state).find(x=>x.id===emp);
 if(!e)return <GameScreen title="Nhân viên" onBack={onBack}><p className="game-faint">Nhân viên này không còn ở công ty.</p></GameScreen>;
 const pend=pendingFor(state,emp),view=pend?hrView(state,pend.id):null,w=workAt(e,state.day),bond=bondOf(e);
 const card=<>
  <DataRow label="Cấp" value={levelOf(Math.max(...HIRE_SKILLS.map(k=>e.skills[k]))).name}/>
  <DataRow label="Lương" value={money(e.wage)}/>
  <DataRow label="Tinh thần" value={`${Math.round(w.morale)}`}/>
  <DataRow label="Gắn bó" value={`${Math.round(w.loyalty)}`}/>
  <DataRow label="Quan hệ" value={`${bondTier(bond)} ${bond}`}/></>;
 const choose=(tag:string)=>{if(!pend)return;const text=hrPreview(state,pend.id,tag)??'';const r=onAction({kind:'hrChoose',id:pend.id,tag});if(r.ok){setResult(text);setError('')}else setError(r.error)};
 if(view)return <GameScreen title={e.name} onBack={onBack}>
  <p className="hr-line" role="status">{view.line}</p>
  <h4 className="finance-head">{view.name}</h4>
  <div className="game-answer-list">{view.options.map((o,i)=><button key={o.tag} disabled={o.locked} onClick={()=>choose(o.tag)}><b>{i+1}</b>{o.label}</button>)}</div>
  {error&&<p className="game-status" role="status">{error}</p>}</GameScreen>;
 return <GameScreen title={e.name} onBack={onBack}>
  {result&&<p className="hr-line" role="status">{result}</p>}
  {card}</GameScreen>}
