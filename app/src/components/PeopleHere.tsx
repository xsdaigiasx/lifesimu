import {useState} from 'react';
import type {GameState,GameResult,PlaceId} from '../domain/types';
import {peopleHere,relationTier} from '../domain/npc';
import {socialOf} from '../domain/social';

/** T16: hàng "Ở đây lúc này" trên thẻ địa điểm; chạm vào người để chào hỏi hoặc trò chuyện. */
export default function PeopleHere({state,place,onTalk}:{state:GameState;place:PlaceId;onTalk:(id:string,minutes:5|15)=>GameResult}){
 const [open,setOpen]=useState<string|null>(null),[note,setNote]=useState('');const people=peopleHere(state,place),rel=socialOf(state).relations;
 if(!people.length)return null;const person=people.find(p=>p.id===open);
 const talk=(m:5|15)=>{if(!person)return;const r=onTalk(person.id,m);setNote(r.ok?(m===5?`Đã chào ${person.name}.`:`Đã trò chuyện với ${person.name}.`):r.error)};
 return <section className="people-here" aria-label="Ở đây lúc này">
  <div className="people-here-row"><small>Ở đây lúc này</small>{people.map(p=><button key={p.id} className="people-here-avatar" aria-pressed={p.id===open} aria-label={p.name} style={{background:p.tone}} onClick={()=>{setOpen(p.id===open?null:p.id);setNote('')}}>{p.label}</button>)}</div>
  {person&&<div className="people-here-card"><div><strong>{person.name}</strong><small>{person.role}</small><small>{relationTier(rel[person.id]?.score??0)}</small></div>
   <div className="people-here-actions"><button onClick={()=>talk(5)}>Chào hỏi <small>5 phút</small></button><button onClick={()=>talk(15)}>Trò chuyện <small>15 phút</small></button></div>
   {note&&<p role="status">{note}</p>}</div>}
 </section>}
