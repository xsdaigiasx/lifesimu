import NpcFace from './NpcFace';
import {useEffect,useState} from 'react';
import type {SceneLine} from '../domain/talk/interlude';
import type {GameState} from '../domain/types';
import {openEvent} from '../domain/director';
import {relationTier} from '../domain/npc';
import {socialOf} from '../domain/social';

/** Khung thoại câu chuyện NPC (mục 17.8): người nói, lời thoại, 2–4 lựa chọn không kèm hệ quả, lựa chọn thiếu điều kiện hiện mờ. */
export default function StoryDialog({state,onAnswer}:{state:GameState;onAnswer:(choice:number)=>{ok:boolean;error?:string;text?:string;scene?:SceneLine[]}}){
 const [done,setDone]=useState<{name:string;text:string;scene?:SceneLine[]}|null>(null),[error,setError]=useState(''),[shown,setShown]=useState(0);const ev=openEvent(state);
 /* #354: đoạn tự diễn hiện dần từng dòng khoảng 1 giây, chạm để hiện hết */
 const total=done?.scene?.length??0;useEffect(()=>{if(shown>=total)return;const t=setTimeout(()=>setShown(x=>x+1),1000);return()=>clearTimeout(t)},[shown,total]);
 if(!ev&&!done)return null;
 return <div className="story-backdrop"><section className="story-dialog" role="dialog" aria-modal="true" aria-label={ev?.npc.name??done?.name}>
  {ev?<><header><span className="story-avatar" style={{background:ev.npc.tone}} aria-hidden="true"><NpcFace npc={ev.npc}/></span><span><strong>{ev.npc.name}</strong><small>{ev.npc.role}</small></span><span className="story-tier">{relationTier(socialOf(state).relations[ev.npc.id]?.score??0,ev.npc.id)}</span></header>
   {ev.said&&<p className="story-said">{ev.said}</p>}<p className="story-line">{ev.line}</p>
   <div className="story-options">{ev.options.map((o,i)=><button key={i} disabled={o.locked} onClick={()=>{const r=onAnswer(i);if(r.ok){setDone({name:ev.npc.name,text:r.text??'',...(r.scene?{scene:r.scene}:{})});setShown(1);setError('')}else setError(r.error??'')}}><span>{o.label}</span>{o.locked&&<small>{o.need}</small>}</button>)}</div>
   {error&&<p className="story-error" role="alert">{error}</p>}</>
  :done!.scene?<div className="story-scene" onClick={()=>setShown(total)}>{done!.scene.slice(0,shown).map((l,i)=><p key={i} className={`scene-${l.who}`}>{l.who==='narr'?l.text:<><b>{l.who==='me'?'Bạn':done!.name}</b> {l.text}</>}</p>)}{shown>=total&&<button className="primary wide" onClick={e=>{e.stopPropagation();setDone(null)}}>Tiếp tục</button>}</div>
  :<><p className="story-line">{done!.text}</p><button className="primary wide" onClick={()=>setDone(null)}>Tiếp tục</button></>}
 </section></div>}
