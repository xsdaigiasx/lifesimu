import {useState} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {staffOf,levelOf,HIRE_SKILLS,HIRE_SKILL_NAME} from '../domain/hiring';
import {bondOf,bondTier,knowOf,workAt} from '../domain/staff';
import {hrView,hrPreview,pendingFor,type HrAction} from '../domain/hr';
import {MG,canTalk,canTrain,severance,warnsOf,type MgAction} from '../domain/manage';
import {money} from '../domain/format';
import {DataRow,GameScreen} from './GameUI';

/** T48: một nhân viên. Có việc đang chờ thì hiện lời nhân viên và các cách xử lý; không thì hiện thẻ nhân viên. */
export default function HrScreen({state,emp,onAction,onBack}:{state:GameState;emp:string;onAction:(a:HrAction|MgAction)=>GameResult;onBack:()=>void}){
 const [result,setResult]=useState(''),[error,setError]=useState(''),[mode,setMode]=useState<''|'train'|'warn'|'fire'>('');
 const e=staffOf(state).find(x=>x.id===emp);
 if(!e)return <GameScreen title="Nhân viên" onBack={onBack}><p className="game-faint">Nhân viên này không còn ở công ty.</p></GameScreen>;
 const day=state.day,warns=warnsOf(e,day);
 const pend=pendingFor(state,emp),view=pend?hrView(state,pend.id):null,w=workAt(e,state.day),bond=bondOf(e);
 const card=<>
  <DataRow label="Cấp" value={levelOf(Math.max(...HIRE_SKILLS.map(k=>e.skills[k]))).name}/>
  <DataRow label="Lương" value={money(e.wage)}/>
  <DataRow label="Tinh thần" value={`${Math.round(w.morale)}`}/>
  <DataRow label="Gắn bó" value={`${Math.round(w.loyalty)}`}/>
  <DataRow label="Quan hệ" value={`${bondTier(bond)} ${bond}`}/><DataRow label="Độ biết" value={`${Math.round(knowOf(e))}/100`}/>{warns>0&&<DataRow label="Cảnh cáo" value={`${warns}/${MG.warnMax}`}/>}{e.train&&state.day<=e.train.until&&<DataRow label="Đang học" value={`${HIRE_SKILL_NAME[e.train.skill]}, đến ${e.train.until-state.day+1} ngày nữa`}/>}</>;
 const choose=(tag:string)=>{if(!pend)return;const text=hrPreview(state,pend.id,tag)??'';const r=onAction({kind:'hrChoose',id:pend.id,tag});if(r.ok){setResult(text);setError('')}else setError(r.error)};
 if(view)return <GameScreen title={e.name} onBack={onBack}>
  <p className="hr-line" role="status">{view.line}</p>
  <h4 className="finance-head">{view.name}</h4>
  <div className="game-answer-list">{view.options.map((o,i)=><button key={o.tag} disabled={o.locked} onClick={()=>choose(o.tag)}><b>{i+1}</b>{o.label}</button>)}</div>
  {error&&<p className="game-status" role="status">{error}</p>}</GameScreen>;
 const run=(a:MgAction,text:string)=>{const r=onAction(a);if(r.ok){setResult(text);setError('');setMode('')}else setError(r.error)};
 if(mode==='train')return <GameScreen title={`Đào tạo ${e.name}`} onBack={()=>setMode('')}><DataRow label="Học phí" value={money(MG.trainCost)}/><DataRow label="Thời gian" value={`${MG.trainDays} ngày, làm nửa giờ`}/><div className="game-answer-list">{HIRE_SKILLS.map(k=><button key={k} onClick={()=>run({kind:'mgTrain',emp:e.id,skill:k},`${e.name} đăng ký khoá ${HIRE_SKILL_NAME[k]}.`)}>{HIRE_SKILL_NAME[k]}</button>)}</div>{error&&<p className="game-status" role="status">{error}</p>}</GameScreen>;
 if(mode==='warn'||mode==='fire'){const fire=mode==='fire';return <GameScreen title={fire?`Sa thải ${e.name}`:`Cảnh cáo ${e.name}`} onBack={()=>setMode('')} footer={<div className="game-button-pair"><button className="game-secondary" onClick={()=>setMode('')}>Hủy</button><button className="primary" onClick={()=>run(fire?{kind:'mgFire',emp:e.id}:{kind:'mgWarn',emp:e.id},fire?`${e.name} đã rời công ty.`:`Đã cảnh cáo ${e.name}.`)}>Xác nhận</button></div>}>{fire?<DataRow label="Bồi thường" value={money(severance(e))}/>:<DataRow label="Cảnh cáo" value={`${warns+1}/${MG.warnMax}`}/>}{error&&<p className="game-status" role="status">{error}</p>}</GameScreen>}
 return <GameScreen title={e.name} onBack={onBack} footer={<div className="hr-actions"><button className="game-secondary" disabled={!canTalk(e,day)} onClick={()=>run({kind:'mgTalk',emp:e.id},`${e.name} cảm ơn vì được lắng nghe.`)}>Họp 1-1</button><button className="game-secondary" disabled={!canTrain(e,day)} onClick={()=>setMode('train')}>Đào tạo</button><button className="game-secondary" onClick={()=>setMode('warn')}>Cảnh cáo</button><button className="game-secondary" onClick={()=>setMode('fire')}>Sa thải</button></div>}>
  {error&&<p className="game-status" role="status">{error}</p>}{result&&<p className="hr-line" role="status">{result}</p>}
  {card}</GameScreen>}
