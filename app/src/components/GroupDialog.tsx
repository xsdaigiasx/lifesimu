import NpcFace from './NpcFace';
import {useState} from 'react';
import type {GameState} from '../domain/types';
import {castById} from '../domain/npc';
import {gossipOf,groupChoices,type GroupChoice,type SceneLine} from '../domain/talk/gossip';

/** H7c: cảnh nhóm. Hai người nói với nhau, người chơi đứng nghe hoặc chen vào; sau lựa chọn hiện câu đáp rồi Tiếp tục. */
export default function GroupDialog({state,onAnswer}:{state:GameState;onAnswer:(c:GroupChoice)=>{ok:boolean;error?:string;lines?:SceneLine[]}}){
 const [done,setDone]=useState<SceneLine[]|null>(null),[error,setError]=useState('');const sc=gossipOf(state).pending;
 if(!sc&&!done)return null;
 const lines=(list:SceneLine[])=><div className="group-lines">{list.map((l,i)=>{const n=castById(state,l.who);return <p key={i}><span className="story-avatar" style={{background:n?.tone}} aria-hidden="true">{n&&<NpcFace npc={n}/>}</span><span><strong>{n?.name}</strong>{l.text}</span></p>})}</div>;
 return <div className="story-backdrop"><section className="story-dialog group-dialog" role="dialog" aria-modal="true" aria-label="Chuyện quanh đây">
  {sc?<>{lines(sc.lines)}
   <div className="story-options">{groupChoices(state,sc).map(c=><button key={c.id} onClick={()=>{const r=onAnswer(c.id);if(r.ok){setError('');if(r.lines?.length)setDone(r.lines)}else setError(r.error??'')}}><span>{c.label}</span></button>)}</div>
   {error&&<p className="story-error" role="alert">{error}</p>}</>
  :<>{lines(done!)}<button className="primary wide" onClick={()=>setDone(null)}>Tiếp tục</button></>}
 </section></div>}
