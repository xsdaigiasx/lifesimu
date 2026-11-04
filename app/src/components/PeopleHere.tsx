import {useState} from 'react';
import type {GameState,GameResult,PlaceId} from '../domain/types';
import {peopleHere} from '../domain/npc';
import PersonSheet from './PersonSheet';

/** Hàng "Ở đây lúc này": chỉ có vòng tròn tên; chạm vào người thì mở cửa sổ riêng của người đó. */
export default function PeopleHere({state,place,onTalk,only}:{state:GameState;place:PlaceId;onTalk:(id:string,kind:'talk'|'meal')=>GameResult;only?:string[]}){
 const [open,setOpen]=useState<string|null>(null);const people=peopleHere(state,place).filter(p=>!only||only.includes(p.id));
 if(!people.length)return null;
 return <section className="people-here" aria-label="Ở đây lúc này">
  <div className="people-here-row"><small>Ở đây lúc này</small>{people.map(p=><button key={p.id} className="people-here-avatar" aria-label={p.name} style={{background:p.tone}} onClick={()=>setOpen(p.id)}>{p.label}</button>)}</div>
  {open&&<PersonSheet state={state} id={open} onTalk={onTalk} onClose={()=>setOpen(null)}/>}
 </section>}
