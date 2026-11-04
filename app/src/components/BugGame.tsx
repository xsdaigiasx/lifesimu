import {useEffect,useRef,useState} from 'react';
import {WIRE_COLORS,WIRE_MISTAKES} from '../domain/bug-game';
import {bugOf} from '../domain/work';
import type {GameState} from '../domain/types';
const HEX:Record<string,string>={red:'#e5604d',blue:'#4a8fe0',green:'#4fb06b',yellow:'#e8b93a',purple:'#9a6ad6'};
/** Mini game "Nối dây": hiện khi nhiệm vụ có sự cố, đồng hồ công việc dừng cho tới khi nối xong. Chạm một đầu bên trái rồi đầu cùng màu bên phải. */
export default function BugGame({state,onFix}:{state:GameState;onFix:(choice:number,ms:number)=>void}){
 const bug=bugOf(state),start=useRef(performance.now()),lock=useRef(false),[now,setNow]=useState(0),[sel,setSel]=useState<number|null>(null),[done,setDone]=useState<string[]>([]),[miss,setMiss]=useState(0),[flash,setFlash]=useState<number|null>(null),key=bug?`${bug.seed}:${bug.attempt}`:'';
 useEffect(()=>{start.current=performance.now();lock.current=false;setNow(0);setSel(null);setDone([]);setMiss(0);const id=setInterval(()=>setNow(performance.now()-start.current),100);return()=>clearInterval(id)},[key]);
 if(!bug)return null;
 const p=bug.puzzle,left=WIRE_COLORS.slice(0,p.options.length) as string[],right=p.options,left0=Math.max(0,1-now/p.limitMs),H=70*left.length+20;
 const finish=(ok:boolean)=>{if(lock.current)return;lock.current=true;onFix(ok?p.answer:(p.answer+1)%p.options.length,performance.now()-start.current)};
 const tapRight=(j:number)=>{if(sel===null||lock.current)return;const c=left[sel]!;if(right[j]===c&&!done.includes(c)){const next=[...done,c];setDone(next);setSel(null);if(next.length===left.length)finish(true)}else{const m=miss+1;setMiss(m);setFlash(j);setTimeout(()=>setFlash(null),250);setSel(null);if(m>=WIRE_MISTAKES)finish(false)}};
 const y=(i:number)=>45+i*70;
 return <section className="bug-game" role="dialog" aria-modal="true" aria-label="Mini game nối dây">
  <header><strong>Nối dây {bug.task.name}</strong><span>Lần {bug.attempt}/2</span></header>
  <h3>{p.title}</h3><p>{p.prompt}</p>
  <div className="bug-timer" aria-hidden="true"><i style={{width:`${left0*100}%`}} className={left0<.5?'slow':''}/></div>
  <small>{left0>=.5?'Nối nhanh: sửa chỉ mất 25% thời gian chuẩn.':'Nối xong: mất 33%. Nối nhầm 3 lần: mất 40%.'} Nhầm {miss}/{WIRE_MISTAKES}</small>
  <svg className="bug-wires" viewBox={`0 0 300 ${H}`} role="group" aria-label="Các đầu dây">
   {left.map((c,i)=>{const j=right.indexOf(c);return done.includes(c)?<line key={c} x1={50} y1={y(i)} x2={250} y2={y(j)} stroke={HEX[c]} strokeWidth={8} strokeLinecap="round"/>:null})}
   {left.map((c,i)=><g key={'l'+c} onClick={()=>!done.includes(c)&&setSel(i)} role="button" aria-label={`Đầu trái ${i+1}`}><circle cx={50} cy={y(i)} r={sel===i?30:26} fill={HEX[c]} stroke={sel===i?'#fff':'#0004'} strokeWidth={sel===i?5:3} opacity={done.includes(c)?.55:1}/></g>)}
   {right.map((c,j)=><g key={'r'+j} onClick={()=>tapRight(j)} role="button" aria-label={`Đầu phải ${j+1}`}><circle cx={250} cy={y(j)} r={26} fill={HEX[c]} stroke={flash===j?'#fff':'#0004'} strokeWidth={flash===j?6:3} opacity={done.includes(c)?.55:1}/></g>)}
  </svg>
 </section>}
