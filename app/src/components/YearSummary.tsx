import {useState} from 'react';
import type {GameState} from '../domain/types';
import {summaryOf,titleOf,jobText,skillText,type Summary} from '../domain/summary';
import {castById,relationTier} from '../domain/npc';
import {shortDate,money} from '../domain/format';
import {GameScreen} from './GameUI';
import NpcFace from './NpcFace';
import Icon from './Icon';

/** T35: nội dung một bản tổng kết. Chỉ hiện những gì đã ghi trong save và Nhật ký. */
export function SummaryBody({m,state}:{m:Summary;state:GameState}){
 const c=m.company;
 return <div className="sum-body">
  <div className="sum-grid">
   <div className="sum-card"><Icon name="coin"/><strong className="t-title">{money(m.money)}</strong><small>Tiền mặt</small></div>
   <div className="sum-card"><Icon name="chart"/><strong className="t-title">{skillText(m)}</strong><small>Kỹ năng cao nhất</small></div>
   <div className="sum-card sum-wide"><Icon name="briefcase"/><strong className="t-title">{jobText(m)}</strong><small>Công việc</small></div>
   {c&&<>
    <div className="sum-card"><Icon name="building"/><strong className="t-title">{money(c.fund)}</strong><small>Quỹ công ty</small></div>
    <div className="sum-card"><Icon name="heart"/><strong className="t-title">{c.rep}/100</strong><small>Uy tín</small></div>
    <div className="sum-card"><Icon name="people"/><strong className="t-title">{c.staff}</strong><small>Nhân viên</small></div>
    <div className="sum-card"><Icon name="box"/><strong className="t-title">{c.done}</strong><small>Dự án xong</small></div></>}
  </div>
  {m.people.length>0&&<section className="sum-section"><h4>Người đồng hành</h4>
   {m.people.map(p=>{const n=castById(state,p.id);return n?<div className="sum-person" key={p.id}><span className="journal-avatar" style={{background:n.tone}} aria-hidden="true"><NpcFace id={n.id} label={n.label}/></span><span className="sum-person-copy"><strong>{n.name}</strong><small>{relationTier(p.score,n.id)}</small>{p.memory&&<em>“{p.memory}”</em>}</span></div>:null})}</section>}
  {m.marks.length>0&&<section className="sum-section"><h4>Mốc nổi bật</h4>
   {m.marks.map((k,i)=><div className="sum-mark" key={i}><small>{shortDate(k.day)}</small><strong>{k.title}</strong></div>)}</section>}
 </div>}

/** Hộp thoại tự mở khi có bản tổng kết mới. */
export function SummaryPopup({m,state,onClose}:{m:Summary;state:GameState;onClose:()=>void}){
 return <div className="sum-popup"><SummaryBody m={m} state={state}/><button className="sum-close" onClick={onClose}>Tiếp tục chơi</button></div>}

/** Tab Tổng kết trong Nhật ký: các bản đã lưu, mới nhất trước. */
export function SummaryTab({state}:{state:GameState}){
 const list=[...summaryOf(state).list].reverse(),[open,setOpen]=useState<string|null>(null),m=list.find(x=>x.id===open);
 if(m)return <GameScreen title={titleOf(m)} onBack={()=>setOpen(null)}><SummaryBody m={m} state={state}/></GameScreen>;
 return list.length?<div className="journal-group">{list.map(x=><button key={x.id} className="journal-row" onClick={()=>setOpen(x.id)}>
  <span className="journal-icon" aria-hidden="true"><Icon name="chart"/></span><span className="journal-copy"><strong>{titleOf(x)}</strong></span><span className="journal-time">{shortDate(x.day)}</span></button>)}</div>
 :<div className="game-empty"><Icon name="chart"/><h3>Chưa có tổng kết</h3></div>}
