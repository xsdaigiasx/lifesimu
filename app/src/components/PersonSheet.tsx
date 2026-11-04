import {useState} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {castById,relationTier} from '../domain/npc';
import {socialOf} from '../domain/social';
import {canMeal,knownFacts} from '../domain/director';
import Icon from './Icon';

/** Cửa sổ riêng của một người (chốt 04/11): chạm vào người thì mở; chưa quen chỉ chào hỏi, đủ quen thì thấy thông tin và các việc khác. */
export default function PersonSheet({state,id,onTalk,onClose}:{state:GameState;id:string;onTalk:(id:string,kind:'talk'|'meal')=>GameResult;onClose:()=>void}){
 const [note,setNote]=useState('');const npc=castById(id);if(!npc)return null;
 const score=socialOf(state).relations[id]?.score??0,known=score>=10,facts=knownFacts(state,id),meal=canMeal(state,id);
 const act=(k:'talk'|'meal')=>{const r=onTalk(id,k);if(r.ok)onClose();else setNote(r.error)};
 return <div className="person-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}><section className="person-sheet" role="dialog" aria-modal="true" aria-label={npc.name}>
  <header><span className="person-avatar" style={{background:npc.tone}} aria-hidden="true">{npc.label}</span><span className="person-title"><strong>{npc.name}</strong><small>{npc.role}</small></span><span className="person-tier">{relationTier(score)}</span><button className="person-close" aria-label="Đóng" onClick={onClose}><Icon name="close"/></button></header>
  {facts.length>0?<dl className="person-facts">{facts.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>:<p className="person-unknown">Chưa quen</p>}
  <div className={`person-actions${known&&meal?' two':''}`}>{known?<><button onClick={()=>act('talk')}>Nói chuyện</button>{meal&&<button onClick={()=>act('meal')}>Rủ đi ăn</button>}</>:<button onClick={()=>act('talk')}>Chào hỏi</button>}</div>
  {note&&<p className="person-note" role="status">{note}</p>}
 </section></div>}
