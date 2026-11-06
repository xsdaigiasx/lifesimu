import NpcFace from './NpcFace';
import {useState} from 'react';
import type {GameState} from '../domain/types';
import {journalOf} from '../domain/journal';
import {JOURNAL_TABS,journalTab,groupByDay,clockLabel,type JournalTab} from '../domain/journal-view';
import {personById as castById} from '../domain/npc';
import {GameScreen} from './GameUI';
import Icon from './Icon';
import {SummaryTab} from './YearSummary';

/** T19: Nhật ký chia tab Câu chuyện, Công việc, Đời sống; nhóm theo ngày áng chừng. Đọc Nhật ký không tốn giờ. Sổ thu chi là mục riêng. */
export default function Journal({state,onNpc}:{state:GameState;onNpc:(id:string)=>void}){
 const [tab,setTab]=useState<JournalTab|'sum'>('story'),[selected,setSelected]=useState<string|null>(null);
 const all=journalOf(state),entry=all.find(e=>e.id===selected),groups=groupByDay(all.filter(e=>journalTab(e)===tab),state.day);
 if(entry){const npc=entry.npcId?castById(state,entry.npcId):undefined;return <GameScreen title={entry.title} onBack={()=>setSelected(null)}>
  <p className="journal-when">{groupByDay([entry],state.day)[0]!.label} {clockLabel(entry.minute)}</p>
  <p className="journal-detail">{entry.detail}</p>
  {npc&&<button className="journal-person" onClick={()=>onNpc(npc.id)}><span className="journal-avatar" style={{background:npc.tone}} aria-hidden="true"><NpcFace npc={npc}/></span><span><strong>{npc.name}</strong><small>{npc.role}</small></span><Icon name="chevron-right"/></button>}
 </GameScreen>}
 return <div className="game-journal journal">
  <nav className="journal-tabs" role="tablist">{[...JOURNAL_TABS,['sum','Tổng kết'] as const].map(([id,label])=><button key={id} role="tab" aria-selected={id===tab} onClick={()=>setTab(id)}>{label}</button>)}</nav>
  {tab==='sum'?<SummaryTab state={state}/>:<>
  {groups.length?groups.map(g=><section key={g.label} className="journal-group"><h4>{g.label}</h4>{g.items.map(e=>{const npc=e.npcId?castById(state,e.npcId):undefined;return <button key={e.id} className="journal-row" onClick={()=>setSelected(e.id)}>
   {npc?<span className="journal-avatar" style={{background:npc.tone}} aria-hidden="true"><NpcFace npc={npc}/></span>:<span className="journal-icon" aria-hidden="true"><Icon name={tab==='work'?'briefcase':tab==='life'?'home':'note'}/></span>}
   <span className="journal-copy"><strong>{e.title}</strong><small>{e.detail}</small></span><span className="journal-time">{clockLabel(e.minute)}</span></button>})}</section>)
  :<div className="game-empty"><Icon name="note"/><h3>Chưa có gì</h3></div>}</>}
 </div>}
