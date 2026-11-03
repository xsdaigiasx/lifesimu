import {COWORKERS,socialOf} from '../domain/social';
import {useState} from 'react';
import type {GameState} from '../domain/types';
import {journalOf,type JournalEntry} from '../domain/journal';
import {STAFF} from '../domain/office';
import {shortDate} from '../domain/format';
import {ActionRow,DataRow,GameScreen} from './GameUI';
import Icon from './Icon';

const timeText=(minute:number)=>`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
const stamp=(entry:JournalEntry)=>`${shortDate(entry.day)}, ${timeText(entry.minute)}`;

export default function Journal({state,onNpc}:{state:GameState;onNpc:(id:string)=>void}){
 const [selected,setSelected]=useState<string|null>(null),[people,setPeople]=useState(false);
 const entries=journalOf(state),entry=entries.find(e=>e.id===selected);
 const met=state.office?.met??[],known=[...STAFF.filter(p=>met.includes(p.id)),...COWORKERS.filter(p=>socialOf(state).relations[p.id])];
 const person=entry?.npcId?known.find(p=>p.id===entry.npcId):undefined;
 if(entry)return <GameScreen title={entry.title} onBack={()=>setSelected(null)}>
  <DataRow label="Ngày" value={shortDate(entry.day)}/><DataRow label="Giờ" value={timeText(entry.minute)}/>
  <p className="game-status">{entry.detail}</p>
  {person&&<ActionRow icon="people" label={person.name} value={person.role} onClick={()=>onNpc(person.id)}/>}
 </GameScreen>;
 if(people)return <GameScreen title="Người quen" onBack={()=>setPeople(false)}>
  {known.length?<div className="game-actions">{known.map(p=><ActionRow key={p.id} icon="people" label={p.name} value={p.role} onClick={()=>onNpc(p.id)}/>)}</div>:<div className="game-empty"><Icon name="people"/><h3>Chưa có người quen</h3></div>}
 </GameScreen>;
 return <div className="game-journal">
  <div className="game-actions"><ActionRow icon="people" label="Người quen" value={`${known.length} người`} onClick={()=>setPeople(true)}/></div>
  <DataRow label="Nhật ký" value={`${entries.length} sự kiện`}/>
  {entries.length?<div className="game-actions">{entries.map(e=><ActionRow key={e.id} icon="note" label={e.title} value={stamp(e)} onClick={()=>setSelected(e.id)}/>)}</div>:<div className="game-empty"><Icon name="note"/><h3>Chưa có sự kiện</h3></div>}
 </div>;
}
