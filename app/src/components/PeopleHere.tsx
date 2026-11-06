import NpcFace from './NpcFace';
import {useState} from 'react';
import type {GameState,GameResult,PlaceId} from '../domain/types';
import {peopleHere,castById,relationTier} from '../domain/npc';
import {socialOf} from '../domain/social';
import {storyOf,mealOpen,topicsFor,type TalkKind} from '../domain/director';
import type {PlayerTopic} from '../domain/talk/types';
import {SELLERS} from '../domain/talk/npc-life';

type Talk=(id:string,kind:TalkKind)=>GameResult;
/** Nhãn nút chủ đề người chơi tự mở lời (H6). */
const TOPIC_LABEL:Record<PlayerTopic,string>={health:'Hỏi thăm',mine:'Kể chuyện',theirs:'Hỏi chuyện',favor:'Nhờ việc'};
/** Hàng "Ở đây lúc này": chỉ là các vòng tên; chạm vào mở cửa sổ người riêng. */
export default function PeopleHere({state,place,onTalk,only}:{state:GameState;place:PlaceId;onTalk:Talk;only?:string[]}){
 const [open,setOpen]=useState<string|null>(null);const people=peopleHere(state,place).filter(p=>!only||only.includes(p.id));
 if(!people.length)return null;
 return <section className="people-here" aria-label="Ở đây lúc này">
  <div className="people-here-row"><small>Ở đây lúc này</small>{people.map(p=><button key={p.id} className="people-here-avatar" aria-label={p.name} style={{background:p.tone}} onClick={()=>setOpen(p.id)}><NpcFace npc={p}/></button>)}</div>
  {open&&<PersonSheet state={state} id={open} onTalk={onTalk} onClose={()=>setOpen(null)}/>}
 </section>}

/** Cửa sổ một người (chốt 04/11): đủ quen thì hiện thông tin; chưa quen thì chỉ chào hỏi. */
export function PersonSheet({state,id,onTalk,onClose}:{state:GameState;id:string;onTalk:Talk;onClose:()=>void}){
 const [note,setNote]=useState('');const p=castById(state,id);if(!p)return null;const score=socialOf(state).relations[id]?.score??0,known=score>=10,close=score>=30,fearKnown=storyOf(state).memories.some(m=>m.npc===id&&m.topic==='chuyện riêng');
 const act=(k:TalkKind)=>{const r=onTalk(id,k);if(r.ok)onClose();else setNote(r.error)};
 const topics=topicsFor(state,id);
 const rows:[string,string][]=known?[['Quê',p.origin],['Tính cách',p.traits.join(', ')],['Điểm nhấn',p.quirk],...(close?[['Mong muốn',p.goal] as [string,string]]:[]),...(fearKnown?[['Đang lo',p.fear] as [string,string]]:[])]:[];
 return <div className="story-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}><section className="story-dialog person-sheet" role="dialog" aria-modal="true" aria-label={p.name}>
  <header><span className="story-avatar" style={{background:p.tone}} aria-hidden="true"><NpcFace npc={p}/></span><span><strong>{p.name}</strong><small>{p.role}</small></span><span className="story-tier">{relationTier(score,p.id)}</span><button className="person-close" aria-label="Đóng" onClick={onClose}>×</button></header>
  {known&&<dl className="person-facts">{rows.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
  <div className="person-actions">{known?<button onClick={()=>act('talk')}>Nói chuyện</button>:<button className={topics.length%2?'':'wide'} onClick={()=>act('talk')}>Chào hỏi</button>}
   {topics.map(t=><button key={t} onClick={()=>act(`topic:${t}`)}>{t==='favor'&&SELLERS.includes(id)?'Hỏi hàng':TOPIC_LABEL[t]}</button>)}
   {known&&<button disabled={!mealOpen(state,id)} onClick={()=>act('meal')}>Rủ đi ăn{!mealOpen(state,id)&&<small>Giờ ăn trưa, tối</small>}</button>}</div>
  {note&&<p className="story-error" role="status">{note}</p>}
 </section></div>}
