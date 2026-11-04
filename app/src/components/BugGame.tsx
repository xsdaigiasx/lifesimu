import {useEffect,useRef,useState} from 'react';
import {WIRE_COLORS,WIRE_MISTAKES,SINGLE_CHOICE,type BugPuzzle} from '../domain/bug-game';
import {bugOf} from '../domain/work';
import type {GameState} from '../domain/types';
const HEX:Record<string,string>={red:'#e5604d',blue:'#4a8fe0',green:'#4fb06b',yellow:'#e8b93a',purple:'#9a6ad6'};
interface G{p:BugPuzzle;win:()=>void;miss:()=>void}
/** Nối dây cùng màu hoặc nối chữ (chia người, ghép lời): chạm một đầu trái rồi đầu phải tương ứng. */
function Match({p,win,miss}:G){
 const text=p.kind!=='wires',n=p.options.length,left=text?p.data!.slice(0,n):WIRE_COLORS.slice(0,n) as string[],target=text?p.data!.slice(n):left,right=p.options;
 const [sel,setSel]=useState<number|null>(null),[done,setDone]=useState<number[]>([]),[flash,setFlash]=useState<number|null>(null);
 const tapRight=(j:number)=>{if(sel===null)return;if(right[j]===target[sel]&&!done.includes(sel)){const d=[...done,sel];setDone(d);setSel(null);if(d.length===n)win()}else{setFlash(j);setTimeout(()=>setFlash(null),250);setSel(null);miss()}};
 if(!text){const y=(i:number)=>45+i*70,H=70*n+20;return <svg className="bug-wires" viewBox={`0 0 300 ${H}`} role="group" aria-label="Các đầu dây">
  {left.map((c,i)=>done.includes(i)?<line key={c} x1={50} y1={y(i)} x2={250} y2={y(right.indexOf(c))} stroke={HEX[c]} strokeWidth={8} strokeLinecap="round"/>:null)}
  {left.map((c,i)=><g key={'l'+c} onClick={()=>!done.includes(i)&&setSel(i)} role="button" aria-label={`Đầu trái ${i+1}`}><circle cx={50} cy={y(i)} r={sel===i?30:26} fill={HEX[c]} stroke={sel===i?'#fff':'#0004'} strokeWidth={sel===i?5:3} opacity={done.includes(i)?.55:1}/></g>)}
  {right.map((c,j)=><g key={'r'+j} onClick={()=>tapRight(j)} role="button" aria-label={`Đầu phải ${j+1}`}><circle cx={250} cy={y(j)} r={26} fill={HEX[c]} stroke={flash===j?'#fff':'#0004'} strokeWidth={flash===j?6:3} opacity={done.includes(left.indexOf(right[j]!))?.55:1}/></g>)}</svg>}
 return <div className="bug-pairs"><div>{left.map((t,i)=><button key={i} disabled={done.includes(i)} className={sel===i?'on':''} onClick={()=>setSel(i)}>{t}</button>)}</div><div>{right.map((t,j)=><button key={j} className={flash===j?'bad':''} disabled={done.includes(target.indexOf(t))} onClick={()=>tapRight(j)}>{t}</button>)}</div></div>}
/** Chạm theo thứ tự: số nhỏ đến lớn, hoặc việc gấp nhất trước (rank nhỏ trước). */
function Order({p,win,miss}:G){
 const ranks=(p.data??[]).map(Number),[done,setDone]=useState<number[]>([]);
 const tap=(i:number)=>{if(done.includes(i))return;const left=ranks.map((r,k)=>k).filter(k=>!done.includes(k)),min=Math.min(...left.map(k=>ranks[k]!));if(ranks[i]===min){const d=[...done,i];setDone(d);if(d.length===ranks.length)win()}else miss()};
 const numeric=p.title==='Xếp thứ tự số';
 return <div className={numeric?'bug-order nums':'bug-order'}>{p.options.map((o,i)=><button key={i} disabled={done.includes(i)} className={done.includes(i)?'dim':''} onClick={()=>tap(i)}>{done.includes(i)&&<em>{done.indexOf(i)+1}</em>}<span>{o}</span></button>)}</div>}
/** Chọn một đáp án: chuỗi số, khác biệt, mảnh thiếu, phối màu, tình huống. */
function Pick({p,win,miss}:G){
 const pick=(i:number)=>i===p.answer?win():miss(),sw=p.kind==='diff'||p.kind==='missing'||p.kind==='color';
 return <div className="bug-pick">
  {p.kind==='color'&&<div className="bug-target" style={{background:p.data![0]}} aria-label="Màu mẫu"/>}
  {p.kind==='missing'&&<div className="bug-grid g3">{p.data!.map((c,i)=><span key={i} style={{background:c||'#0000'}} className={c?'':'hole'}>{c?'':'?'}</span>)}</div>}
  <div className={p.kind==='diff'?'bug-grid g4':sw?'bug-swatches':'bug-options'}>{p.options.map((o,i)=>sw?<button key={i} aria-label={`Ô ${i+1}`} style={{background:o}} onClick={()=>pick(i)}/>:<button key={i} onClick={()=>pick(i)}><span>{o}</span></button>)}</div></div>}
/** Nhớ thứ tự: ô sáng lần lượt rồi chạm lại. */
function Memory({p,win,miss}:G){
 const seq=(p.data??[]).map(Number),[show,setShow]=useState(-1),[step,setStep]=useState(0),[lit,setLit]=useState<number|null>(null);
 useEffect(()=>{let i=0,alive=true;const ids:number[]=[];const run=()=>{if(!alive)return;if(i>=seq.length){setLit(null);setShow(seq.length);return}setLit(seq[i]!);ids.push(window.setTimeout(()=>{setLit(null);i++;ids.push(window.setTimeout(run,250))},600))};ids.push(window.setTimeout(run,500));return()=>{alive=false;ids.forEach(clearTimeout)}},[]);
 const ready=show>=seq.length,tap=(c:number)=>{if(!ready)return;setLit(c);setTimeout(()=>setLit(null),150);if(seq[step]===c){if(step+1===seq.length)win();else setStep(step+1)}else{setStep(0);miss()}};
 return <div className="bug-memory"><p>{ready?`Chạm lại: ${step}/${seq.length}`:'Xem kỹ...'}</p><div className="bug-grid g2">{p.options.map((o,i)=><button key={i} className={lit===i?'on':''} onClick={()=>tap(i)}>{o}</button>)}</div></div>}
/** Bấm đúng nhịp: vạch chạy qua lại, chạm khi nằm trong vùng xanh. */
function Rhythm({p,win,miss}:G){
 const [start,width,speed]=(p.data??['30','20','1600']).map(Number) as [number,number,number],t0=useRef(performance.now()),[,tick]=useState(0),[hits,setHits]=useState(0),pos=()=>{const ph=((performance.now()-t0.current)%speed)/speed;return (ph<.5?ph*2:2-ph*2)*100};
 useEffect(()=>{const id=setInterval(()=>tick(x=>x+1),30);return()=>clearInterval(id)},[]);
 const tap=()=>{const x=pos();if(x>=start&&x<=start+width){const h=hits+1;setHits(h);if(h>=3)win()}else miss()};
 return <div className="bug-rhythm"><div className="bug-bar"><i className="zone" style={{left:`${start}%`,width:`${width}%`}}/><i className="mark" style={{left:`${pos()}%`}}/></div><p>Trúng {hits}/3</p><button className="primary wide" onClick={tap}>Chạm</button></div>}
/** Mini game sự cố: hiện khi nhiệm vụ có sự cố, đồng hồ công việc dừng cho tới khi chơi xong. Mỗi nhóm kỹ năng có bộ trò riêng (domain/bug-game). */
export default function BugGame({state,onFix}:{state:GameState;onFix:(choice:number,ms:number)=>void}){
 const bug=bugOf(state),start=useRef(performance.now()),lock=useRef(false),[now,setNow]=useState(0),[miss,setMiss]=useState(0),key=bug?`${bug.seed}:${bug.attempt}`:'';
 useEffect(()=>{start.current=performance.now();lock.current=false;setNow(0);setMiss(0);const id=setInterval(()=>setNow(performance.now()-start.current),100);return()=>clearInterval(id)},[key]);
 if(!bug)return null;
 const p=bug.puzzle,limit=SINGLE_CHOICE.includes(p.kind)?1:WIRE_MISTAKES,left=Math.max(0,1-now/p.limitMs);
 const finish=(ok:boolean)=>{if(lock.current)return;lock.current=true;onFix(ok?p.answer:(p.answer+1)%p.options.length,performance.now()-start.current)};
 const onMiss=()=>{if(lock.current)return;const m=miss+1;setMiss(m);if(m>=limit)finish(false)},g:G={p,win:()=>finish(true),miss:onMiss};
 const game=p.kind==='wires'||p.kind==='assign'||p.kind==='match'?<Match key={key} {...g}/>:p.kind==='order'?<Order key={key} {...g}/>:p.kind==='memory'?<Memory key={key} {...g}/>:p.kind==='rhythm'?<Rhythm key={key} {...g}/>:<Pick key={key} {...g}/>;
 return <section className="bug-game" role="dialog" aria-modal="true" aria-label={`Mini game ${p.title}`}>
  <header><strong>{p.title} {bug.task.name}</strong><span>Lần {bug.attempt}/2</span></header>
  <h3>{p.title}</h3><p>{p.prompt}</p>
  <div className="bug-timer" aria-hidden="true"><i style={{width:`${left*100}%`}} className={left<.5?'slow':''}/></div>
  <small>{left>=.5?'Làm nhanh: sửa chỉ mất 25% thời gian chuẩn.':'Làm xong: mất 33%. Thua: mất 40%.'} {limit>1?`Nhầm ${miss}/${limit}`:'Chỉ một lần chọn'}</small>
  {game}
 </section>}
