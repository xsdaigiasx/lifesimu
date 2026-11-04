import {useState} from 'react';
import type {GameState,GameResult,PlaceId} from '../domain/types';
import {peopleHere,relationTier} from '../domain/npc';
import {socialOf} from '../domain/social';

/** T16: hàng "Ở đây lúc này" trên thẻ địa điểm; chạm vào người để chào hỏi hoặc trò chuyện. */
export default function PeopleHere({state,place,onTalk,only}:{state:GameState;place:PlaceId;onTalk:(id:string,kind:'talk'|'meal')=>GameResult;only?:string[]}){
 const [open,setOpen]=useState<string|null>(null),[note,setNote]=useState('');const people=peopleHere(state,place).filter(p=>!only||only.includes(p.id)),rel=socialOf(state).relations;
 if(!people.length)return null;const person=people.find(p=>p.id===open);
 const talk=(k:'talk'|'meal')=>{if(!person)return;const r=onTalk(person.id,k);setNote(r.ok?'':r.error)};
 return <section className="people-here" aria-label="Ở đây lúc này">
  <div className="people-here-row"><small>Ở đây lúc này</small>{people.map(p=><button key={p.id} className="people-here-avatar" aria-pressed={p.id===open} aria-label={p.name} style={{background:p.tone}} onClick={()=>{setOpen(p.id===open?null:p.id);setNote('')}}>{p.label}</button>)}</div>
  {person&&<div className="people-here-card"><div><strong>{person.name}</strong><small>{person.role}</small><small>{relationTier(rel[person.id]?.score??0)}</small></div>
   <div className="people-here-actions"><button onClick={()=>talk('talk')}>Nói chuyện</button><button onClick={()=>talk('meal')}>Rủ đi ăn</button></div>
   {note&&<p role="status">{note}</p>}</div>}
 </section>}
