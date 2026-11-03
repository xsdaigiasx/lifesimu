import {useEffect,useRef,useState} from 'react';
import {hiddenOptions} from '../domain/bug-game';
import {bugOf,skillsOf} from '../domain/work';
import {effectiveLevel} from '../domain/skill-xp';
import type {GameState} from '../domain/types';
/** Mini game "Săn lỗi": hiện khi nhiệm vụ có bug, đồng hồ công việc dừng cho tới khi sửa xong. */
export default function BugGame({state,onFix}:{state:GameState;onFix:(choice:number,ms:number)=>void}){
 const bug=bugOf(state),start=useRef(performance.now()),lock=useRef(false),[now,setNow]=useState(0),key=bug?`${bug.seed}:${bug.attempt}`:'';
 useEffect(()=>{start.current=performance.now();lock.current=false;setNow(0);const id=setInterval(()=>setNow(performance.now()-start.current),100);return()=>clearInterval(id)},[key]);
 if(!bug)return null;
 const p=bug.puzzle,hidden=hiddenOptions(p,Math.floor(effectiveLevel(skillsOf(state).logic.level)),bug.seed),left=Math.max(0,1-now/p.limitMs);
 const pick=(i:number)=>{if(lock.current||hidden.includes(i))return;lock.current=true;onFix(i,performance.now()-start.current)};
 return <section className="bug-game" role="dialog" aria-modal="true" aria-label="Mini game sửa bug">
  <header><strong>Phát hiện bug · {bug.task.name}</strong><span>Lần {bug.attempt}/2</span></header>
  <h3>{p.title}</h3><p>{p.prompt}</p>
  <div className="bug-timer" aria-hidden="true"><i style={{width:`${left*100}%`}} className={left<.5?'slow':''}/></div>
  <small>{left>=.5?'Trả lời nhanh: sửa chỉ mất 25% thời gian chuẩn.':'Trả lời đúng: mất 33%. Sai: mất 40%.'}</small>
  {p.kind==='layout'?<div className="bug-layout">{p.options.map((o,i)=><button key={i} onClick={()=>pick(i)} style={i===p.answer?{transform:'translate(7px,-6px) rotate(3deg)'}:undefined}>{o}</button>)}</div>
  :<div className={`bug-options ${p.kind}`}>{p.options.map((o,i)=><button key={i} disabled={hidden.includes(i)} className={hidden.includes(i)?'dim':''} onClick={()=>pick(i)}>{p.kind==='code'&&<em>{i+1}</em>}<span>{o}</span></button>)}</div>}
 </section>}
