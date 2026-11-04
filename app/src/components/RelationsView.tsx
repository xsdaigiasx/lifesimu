import {useState} from 'react';
import type {GameState} from '../domain/types';
import {NPCS,relationTier} from '../domain/npc';
import {socialOf} from '../domain/social';
import {profileOf} from '../domain/journal-view';
import {money} from '../domain/format';
import {GameScreen} from './GameUI';
import Icon from './Icon';

/** T19: Quan hệ dạng lưới thẻ người quen (thân nhất lên đầu) và hồ sơ từng người, chỉ hiện điều đã biết. */
export default function RelationsView({state,initialId,extra}:{state:GameState;initialId?:string;extra?:React.ReactNode}){
 const rel=socialOf(state).relations,[selected,setSelected]=useState<string|undefined>(initialId&&rel[initialId]?initialId:undefined);
 const known=NPCS.filter(n=>rel[n.id]).sort((a,b)=>(rel[b.id]!.score-rel[a.id]!.score)||a.name.localeCompare(b.name,'vi'));
 const p=selected?profileOf(state,selected):null;
 if(p)return <GameScreen title={p.npc.name} onBack={()=>setSelected(undefined)}>
  <header className="profile-head"><span className="profile-avatar" style={{background:p.npc.tone}} aria-hidden="true">{p.npc.label}</span><span className="profile-title"><strong>{p.npc.role}</strong><span className="profile-tier">{relationTier(p.score)}</span></span></header>
  <div className="profile-progress" role="progressbar" aria-label="Độ thân thiết" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.progress.pct}><span style={{width:`${p.progress.pct}%`}}/></div>
  {p.progress.next&&<small className="profile-next">Tới {p.progress.next}</small>}
  {p.facts.length>0&&<dl className="person-facts">{p.facts.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
  {p.places.length>0&&<section className="profile-block"><h4>Hay gặp ở</h4><div className="profile-chips">{p.places.map(x=><span key={x}><Icon name="map"/>{x}</span>)}</div></section>}
  {p.loans.length>0&&<section className="profile-block"><h4>Đang mượn tiền</h4>{p.loans.map((l,i)=><div key={i} className="profile-loan"><strong>{money(l.amount)}</strong><span className={l.late?'late':''}><Icon name="clock"/>{l.late?'Quá hẹn':`Còn ${l.days} ngày`}</span></div>)}</section>}
  <section className="profile-block"><h4>Chuyện đã cùng trải qua</h4>{p.shared.length?<ul className="profile-shared">{p.shared.map(m=><li key={m.id}><span>{m.text}</span><small>{m.when}</small></li>)}</ul>:<p className="profile-empty">Chưa có</p>}</section>
 </GameScreen>;
 return <div className="game-relations relations">
  {known.length?<div className="relations-grid">{known.map(n=><button key={n.id} className="relations-card" onClick={()=>setSelected(n.id)}><span className="relations-avatar" style={{background:n.tone}} aria-hidden="true">{n.label}</span><strong>{n.name}</strong><small>{relationTier(rel[n.id]!.score)}</small></button>)}</div>
  :<div className="game-empty"><Icon name="people"/><h3>Chưa có người quen</h3></div>}
  {extra}
 </div>}
