import NpcFace from './NpcFace';
import {useState} from 'react';
import type {GameState} from '../domain/types';
import {openEvent} from '../domain/director';
import {relationTier} from '../domain/npc';
import {socialOf} from '../domain/social';

/** Khung thoại câu chuyện NPC (mục 17.8): người nói, lời thoại, 2–4 lựa chọn không kèm hệ quả, lựa chọn thiếu điều kiện hiện mờ. */
export default function StoryDialog({state,onAnswer}:{state:GameState;onAnswer:(choice:number)=>{ok:boolean;error?:string;text?:string}}){
 const [done,setDone]=useState<{name:string;text:string}|null>(null),[error,setError]=useState('');const ev=openEvent(state);
 if(!ev&&!done)return null;
 return <div className="story-backdrop"><section className="story-dialog" role="dialog" aria-modal="true" aria-label={ev?.npc.name??done?.name}>
  {ev?<><header><span className="story-avatar" style={{background:ev.npc.tone}} aria-hidden="true"><NpcFace npc={ev.npc}/></span><span><strong>{ev.npc.name}</strong><small>{ev.npc.role}</small></span><span className="story-tier">{relationTier(socialOf(state).relations[ev.npc.id]?.score??0,ev.npc.id)}</span></header>
   <p className="story-line">{ev.line}</p>
   <div className="story-options">{ev.options.map((o,i)=><button key={i} disabled={o.locked} onClick={()=>{const r=onAnswer(i);if(r.ok){setDone({name:ev.npc.name,text:r.text??''});setError('')}else setError(r.error??'')}}><span>{o.label}</span>{o.locked&&<small>{o.need}</small>}</button>)}</div>
   {error&&<p className="story-error" role="alert">{error}</p>}</>
  :<><p className="story-line">{done!.text}</p><button className="primary wide" onClick={()=>setDone(null)}>Tiếp tục</button></>}
 </section></div>}
