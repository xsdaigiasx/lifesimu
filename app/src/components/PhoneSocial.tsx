import NpcFace from './NpcFace';
import {useState,type ReactNode} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {castById,relationTier} from '../domain/npc';
import {socialOf} from '../domain/social';
import {inboxOf,unreadCount,contactsOf,canCall} from '../domain/inbox';
import {dayLabel,clockLabel} from '../domain/journal-view';
import Icon from './Icon';

export interface SocialHandlers{reply:(id:string,msgId:string,choice:number)=>GameResult;send:(id:string,kind:'hello'|'invite')=>GameResult;call:(id:string)=>GameResult;read:(id:string)=>void}
const tierName=(score:number,id:string)=>relationTier(score,id);
const Avatar=({id}:{id:string})=>{const n=castById(id);return n?<span className="ps-avatar" style={{background:n.tone}} aria-hidden="true"><NpcFace id={n.id} label={n.label}/></span>:null};

/** T20: Tin nhắn dạng khung chat. Trả lời nhanh không ghi trước hệ quả; nhắn tin không tốn giờ. */
export function Messages({state,h,openId,top}:{state:GameState;h:SocialHandlers;openId?:string;top?:ReactNode}){
 const [open,setOpen]=useState<string|null>(openId??null),[note,setNote]=useState('');const ib=inboxOf(state);
 if(open){const n=castById(open)!,t=ib.threads[open]??[],score=socialOf(state).relations[open]?.score??0;
  return <div className="ps-chat"><header className="ps-chat-head"><button className="ps-back" aria-label="Quay lại" onClick={()=>{setOpen(null);setNote('')}}><Icon name="chevron-left"/></button><Avatar id={open}/><span><strong>{n.name}</strong><small>{tierName(score,open)}</small></span></header>
   <div className="ps-bubbles">{t.length?t.map((m,i)=>{const showDay=i===0||t[i-1]!.day!==m.day;return <div key={m.id}>{showDay&&<p className="ps-day">{dayLabel(m.day,state.day)}</p>}<div className={`ps-bubble ${m.from==='me'?'me':'them'}`}><p>{m.text}</p><small>{clockLabel(m.minute)}</small></div>
    {m.from==='npc'&&m.replies&&m.answered===undefined&&<div className="ps-replies">{m.replies.map((r,k)=><button key={k} onClick={()=>{const res=h.reply(open,m.id,k);setNote(res.ok?'':res.error)}}>{r}</button>)}</div>}</div>}):<p className="ps-empty">Chưa có tin nhắn</p>}</div>
   <div className="ps-compose"><button onClick={()=>{const r=h.send(open,'hello');setNote(r.ok?'':r.error)}}>Hỏi thăm</button>{open!=='me'&&<button onClick={()=>{const r=h.send(open,'invite');setNote(r.ok?'':r.error)}}>Rủ đi ăn</button>}</div>
   {note&&<p className="ps-note" role="status">{note}</p>}</div>}
 const ids=[...new Set([...Object.keys(ib.threads),...contactsOf(state).map(n=>n.id)])].filter(id=>castById(id));
 const last=(id:string)=>{const t=ib.threads[id];return t?.[t.length-1]};
 ids.sort((a,b)=>{const x=last(a),y=last(b);return (y?y.day*2000+y.minute:-1)-(x?x.day*2000+x.minute:-1)});
 return <>{top}<div className="ps-list">{ids.length?ids.map(id=>{const n=castById(id)!,m=last(id),u=unreadCount(state,id);return <button key={id} className="ps-row" onClick={()=>{setOpen(id);h.read(id)}}><Avatar id={id}/><span className="ps-row-copy"><strong>{n.name}</strong><small>{m?m.text:'Chưa có tin nhắn'}</small></span><span className="ps-row-side">{m&&<small>{dayLabel(m.day,state.day)}</small>}{u>0&&<b className="ps-badge">{u}</b>}</span></button>}):<p className="ps-empty">Chưa có ai trong danh bạ</p>}</div></>}

/** T20: Gọi điện cho Mẹ và người từ bậc Thân; mỗi cuộc 15 phút, mỗi người mỗi ngày một lần. */
export function Calls({state,h}:{state:GameState;h:SocialHandlers}){const [note,setNote]=useState('');const list=contactsOf(state),called=inboxOf(state).called;
 return <div className="ps-list">{list.map(n=>{const ok=canCall(state,n.id),done=called[n.id]===state.day;return <div key={n.id} className="ps-row"><Avatar id={n.id}/><span className="ps-row-copy"><strong>{n.name}</strong><small>{tierName(socialOf(state).relations[n.id]?.score??0,n.id)}</small></span><button className="ps-call" disabled={!ok||done} onClick={()=>{const r=h.call(n.id);setNote(r.ok?`Đã gọi cho ${n.name}.`:r.error)}}><Icon name="call"/><span>{done?'Đã gọi':ok?'15 phút':'Cần Thân'}</span></button></div>})}
  {!list.length&&<p className="ps-empty">Chưa có ai trong danh bạ</p>}{note&&<p className="ps-note" role="status">{note}</p>}</div>}

/** T20: Danh bạ: Mẹ và người từ Quen biết. */
export function Contacts({state,onMessage}:{state:GameState;onMessage:(id:string)=>void}){const list=contactsOf(state);
 return <div className="ps-grid">{list.length?list.map(n=><button key={n.id} className="ps-card" onClick={()=>onMessage(n.id)}><Avatar id={n.id}/><strong>{n.name}</strong><small>{n.role}</small></button>):<p className="ps-empty">Quen biết ai thì người đó cho số</p>}</div>}
