import NpcFace from './NpcFace';
import WorkActivity from './WorkActivity';
import PackedOffice from './PackedOffice';
import {useState} from 'react';
import type {GameResult,GameState} from '../domain/types';
import {TASKS,dailyTask,canEnterOffice,isWorkday,shiftInfo,workOf,taskBoard,cardInfo,needsChoice,openTurn,type WorkAction} from '../domain/work';
import type {CardKind} from '../domain/shift';
import {money} from '../domain/format';
import {DESK_LINE,socialOf} from '../domain/social';
import {coworkersOf} from '../domain/npc';
import {clockOf} from '../domain/time';
import Icon from './Icon';

interface Props {
 state:GameState;
 onWork:(action:WorkAction)=>GameResult;
 onChat:(id:string,minutes:5|15)=>GameResult;
 onSkills:()=>void;
 onContract?:()=>void;
 onPayslip?:()=>void;
}

export default function OfficeWorkScene({state,onWork,onChat,onSkills,onContract,onPayslip}:Props){
 const [menu,setMenu]=useState(false);
 const colleagues=coworkersOf(state).filter(p=>p.desk==='dev'||p.desk==='design').map(p=>({...p,line:DESK_LINE[p.desk!]}));
 const [selected,setSelected]=useState<string|null>(null),[message,setMessage]=useState(''),[pick,setPick]=useState<CardKind|null>(null);

 const work=workOf(state),active=work.active,task=work.task,assigned=dailyTask(state);
 const definition=TASKS.find(t=>t.id===task?.id)??assigned;
 const minute=clockOf(state).minute,noon=minute>=720&&minute<780;
 const npc=!active?colleagues.find(p=>p.id===selected):undefined;
 const score=npc?socialOf(state).relations[npc.id]?.score:undefined;
 const percent=active?Math.max(0,Math.min(100,Math.floor(active.minutes/(active.end-active.started)*100))):0;
 const finished=work.finished.includes(shiftInfo(state).key);
 const slotNow=active?{start:active.started,end:active.end,slot:active.slot}:minute<720?{start:480,end:720,slot:'am'}:{start:780,end:1020,slot:'pm'},shiftLabel=!isWorkday(state.day)?'Hôm nay nghỉ':slotNow.slot==='ot'?'Tăng ca 17:00 đến 19:00':slotNow.slot==='am'?'Ca sáng 08:00 đến 12:00':'Ca chiều 13:00 đến 17:00',shiftPct=Math.max(0,Math.min(100,Math.round((minute-(slotNow.slot==='am'?480:slotNow.slot==='ot'?1020:780))/((slotNow.slot==='ot'?120:240))*100)));
 const canStart=!active&&canEnterOffice(state)&&isWorkday(state.day)&&!finished&&!noon;
 const drawing=definition.skill==='graphics';
 function act(action:WorkAction){const result=onWork(action);setMessage(result.ok?'':result.error);return result}
 const choosing=canStart&&needsChoice(state),board=choosing?taskBoard(state):[],chosen=board.find(c=>c.kind===pick)??board[0],turn=active?openTurn(state):null;
 function start(){if(!canStart)return;setSelected(null);if(choosing){if(!chosen)return;const r=act({kind:'start',taskId:chosen.taskId,card:chosen.kind});if(r.ok)setPick(null)}else act({kind:'start',taskId:assigned.id})}
 function answer(i:number){const r=onWork({kind:'turn',choice:i});setMessage(r.ok?workOf(r.state).lastResult:r.error)}
 function meet(id:string){if(active||!colleagues.some(p=>p.id===id))return;setSelected(id);setMessage('')}
 function chat(minutes:5|15){if(active||!npc)return;const result=onChat(npc.id,minutes);setMessage(result.ok?'Đã trò chuyện.':result.error)}
 function closeChat(){setSelected(null);setMessage('')}

 return <section className={`office-work-scene${active?' is-working':''}`} aria-label={active?'Ca làm hiện tại':'Văn phòng'}>
  <header className="ows-shiftbar"><div><strong>{shiftLabel}</strong><div className="ows-shift-track" role="progressbar" aria-label="Tiến độ ca" aria-valuemin={0} aria-valuemax={100} aria-valuenow={shiftPct}><span style={{width:`${shiftPct}%`}}/></div></div><button className="ows-more" aria-label="Mục khác" aria-expanded={menu} onClick={()=>setMenu(m=>!m)}>⋯</button>{menu&&<div className="ows-menu" role="menu"><button role="menuitem" onClick={()=>{setMenu(false);onSkills()}}>Kỹ năng</button>{onPayslip&&<button role="menuitem" onClick={()=>{setMenu(false);onPayslip()}}>Bảng lương</button>}{onContract&&<button role="menuitem" onClick={()=>{setMenu(false);onContract()}}>Hợp đồng</button>}</div>}</header>
  <div className="ows-room">
   {active?<WorkActivity state={state} drawing={drawing}/>:<PackedOffice state={state} onNpc={meet} afternoon={minute>=780}/>}
   {active&&minute>=780&&<div className="static-afternoon-tint" aria-hidden="true"/>}
   {active&&<div className="ows-progress-card">
    <strong>{definition.name}</strong><div className="ows-progress-caption"><span>{active.paused?'Tạm dừng':task?.attempt?'Đang sửa lỗi':'Đang làm'}</span><b>{percent}%</b></div>
    <div className="ows-progress" role="progressbar" aria-label="Tiến độ công việc" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{width:`${percent}%`}}/></div>
   </div>}
  </div>
  {active?<footer className="ows-footer"><button onClick={()=>act({kind:active.paused?'resume':'pause'})}><Icon name={active.paused?'play':'clock'}/>{active.paused?'Tiếp tục':'Tạm dừng'}</button><button onClick={()=>act({kind:'leave'})}><Icon name="close"/>Rời ca</button></footer>:<footer className="ows-footer">
   {choosing&&board.length>0&&<div className="ows-board" role="radiogroup" aria-label="Việc hôm nay">{board.map(c=>{const i=cardInfo(state,c);return <button key={c.kind} role="radio" aria-checked={c.kind===chosen?.kind} className={`ows-card ows-card-${c.kind}`} onClick={()=>setPick(c.kind)}><span className="ows-card-head"><strong>{i.title}</strong><span className="ows-card-tag">{i.kind}</span></span><span className="ows-card-facts"><small>{i.skill}</small><small>{i.hours}</small><small>{i.risk}</small><small>{i.xp}</small></span>{c.kind==='urgent'&&<small>Xong trong ca, thưởng {money(i.bonus??0)}</small>}{c.kind==='help'&&<small>Hỗ trợ {i.npc}</small>}</button>})}</div>}
   <div className="ows-assignment"><strong>{noon?'Đã hết ca sáng':minute>=1020||finished?'Đã hết ca làm':choosing?'Việc hôm nay':assigned.name}</strong></div>
   <div className="ows-idle-actions"><button className="ows-start" disabled={!canStart} onClick={start}><Icon name="briefcase"/>{choosing?'Nhận việc':work.task&&work.trackingDay===state.day&&work.task.elapsed>0?'Làm tiếp':'Bắt đầu ca'}</button></div>
  </footer>}
  {message&&!npc&&!turn&&<p className="ows-message" role="status">{message}</p>}
  {turn&&<div className="ows-dialogue ows-turn" role="dialog" aria-label={turn.npc.name}>
   <header><span className="ows-turn-avatar" aria-hidden="true"><NpcFace npc={turn.npc}/></span><span><strong>{turn.npc.name}</strong><small>{turn.npc.role}</small></span></header>
   <p>{turn.event.line}</p>
   <div className="ows-turn-options">{turn.options.map((o,i)=><button key={i} disabled={o.locked} onClick={()=>answer(i)}>{o.label}{o.locked&&<small>{o.need}</small>}</button>)}</div>
  </div>}
  {npc&&<div className="ows-dialogue" role="dialog" aria-label={npc.name}>
   <header><strong>{npc.name}</strong><button onClick={closeChat} aria-label="Đóng"><Icon name="close"/></button></header>
   <p>{npc.line}</p>{score!==undefined&&<small>Thân thiết {score}</small>}
   <div className="ows-chat-options"><button onClick={()=>chat(5)}>Hỏi thăm <small>5 phút</small></button><button onClick={()=>chat(15)}>Trò chuyện <small>15 phút</small></button></div>
   {message&&<p className="ows-message" role="status">{message}</p>}
  </div>}
 </section>;
}
