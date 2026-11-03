import WorkActivity from './WorkActivity';
import PackedOffice from './PackedOffice';
import {useState} from 'react';
import type {GameResult,GameState} from '../domain/types';
import {TASKS,dailyTask,canEnterOffice,isWorkday,shiftInfo,workOf,type WorkAction} from '../domain/work';
import {COWORKERS,socialOf} from '../domain/social';
import {clockOf} from '../domain/time';
import Icon from './Icon';

interface Props {
 state:GameState;
 onWork:(action:WorkAction)=>GameResult;
 onChat:(id:string,minutes:5|15)=>GameResult;
 onSkills:()=>void;
}
const colleagues=COWORKERS.filter(p=>p.id==='dev-an'||p.id==='dev-linh');

export default function OfficeWorkScene({state,onWork,onChat,onSkills}:Props){
 const [selected,setSelected]=useState<string|null>(null),[message,setMessage]=useState('');

 const work=workOf(state),active=work.active,task=work.task,assigned=dailyTask(state);
 const definition=TASKS.find(t=>t.id===task?.id)??assigned;
 const minute=clockOf(state).minute,noon=minute>=720&&minute<780;
 const npc=!active?colleagues.find(p=>p.id===selected):undefined;
 const score=npc?socialOf(state).relations[npc.id]?.score:undefined;
 const percent=active?Math.max(0,Math.min(100,Math.floor(active.minutes/(active.end-active.started)*100))):0;
 const finished=work.finished.includes(shiftInfo(state).key);
 const canStart=!active&&canEnterOffice(state)&&isWorkday(state.day)&&!finished&&!noon;
 const drawing=definition.skill==='graphics';
 const art=active?(drawing?'graphics':'coding'):'office';
 function act(action:WorkAction){const result=onWork(action);setMessage(result.ok?'':result.error);return result}
 function start(){if(!canStart)return;setSelected(null);act({kind:'start',taskId:assigned.id})}
 function meet(id:string){if(active||!colleagues.some(p=>p.id===id))return;setSelected(id);setMessage('')}
 function chat(minutes:5|15){if(active||!npc)return;const result=onChat(npc.id,minutes);setMessage(result.ok?'Đã trò chuyện.':result.error)}
 function closeChat(){setSelected(null);setMessage('')}

 return <section className={`office-work-scene${active?' is-working':''}`} aria-label={active?'Ca làm hiện tại':'Văn phòng'}>
  <div className="ows-room">
   {active?<WorkActivity state={state} drawing={drawing}/>:<PackedOffice state={state} onNpc={meet} focusPlayer/>}
   {active&&<div className="ows-progress-card">
    <strong>{definition.name}</strong><div className="ows-progress-caption"><span>{active.paused?'Tạm dừng':task?.attempt?'Đang sửa lỗi':'Đang làm'}</span><b>{percent}%</b></div>
    <div className="ows-progress" role="progressbar" aria-label="Tiến độ công việc" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{width:`${percent}%`}}/></div>
   </div>}
  </div>
  {active?<footer className="ows-footer"><button onClick={()=>act({kind:active.paused?'resume':'pause'})}><Icon name={active.paused?'play':'clock'}/>{active.paused?'Tiếp tục':'Tạm dừng'}</button><button onClick={()=>act({kind:'leave'})}><Icon name="close"/>Rời ca</button></footer>:<footer className="ows-footer">
   <div className="ows-assignment"><strong>{noon?'Đã hết ca sáng':minute>=1020||finished?'Đã hết ca làm':assigned.name}</strong><small>{noon?'Ca chiều 13:00':!isWorkday(state.day)?'Ngày nghỉ':minute<720?'Ca sáng 08:00–12:00':'Ca chiều 13:00–17:00'}</small></div>
   <div className="ows-idle-actions"><button className="ows-start" disabled={!canStart} onClick={start}><Icon name="briefcase"/>Bắt đầu ca</button><button className="ows-skills" onClick={onSkills} aria-label="Kỹ năng" title="Kỹ năng"><Icon name="chart"/></button></div>
  </footer>}
  {message&&!npc&&<p className="ows-message" role="status">{message}</p>}
  {npc&&<div className="ows-dialogue" role="dialog" aria-label={npc.name}>
   <header><strong>{npc.name}</strong><button onClick={closeChat} aria-label="Đóng"><Icon name="close"/></button></header>
   <p>{npc.line}</p>{score!==undefined&&<small>Thân thiết {score}</small>}
   <div className="ows-chat-options"><button onClick={()=>chat(5)}>Hỏi thăm <small>5 phút</small></button><button onClick={()=>chat(15)}>Trò chuyện <small>15 phút</small></button></div>
   {message&&<p className="ows-message" role="status">{message}</p>}
  </div>}
 </section>;
}
