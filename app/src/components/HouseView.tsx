import {useState} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {HOME_ITEMS,type HomeId} from '../domain/home';
import {HOUSES,RELAX,housingOf,layoutOf,storageOf,itemSize,placeError,type Placed,type RoomUse,type HouseId} from '../domain/housing';
import {money} from '../domain/format';
import Icon from './Icon';

const TONE:Partial<Record<HomeId,string>>={bed:'#c9b79c',wardrobe:'#a98b6c',desk:'#b8a07f'};
const FLOOR:Record<RoomUse,string>={living:'#efe4d0',kitchen:'#e6e9e1',bedroom:'#eadfd3',study:'#e7e0d2',bath:'#dfe9ec',guest:'#ece2d6',fun:'#e4e1ee',garden:'#d9e8c9'};
export interface HouseHandlers{arrange:(room:RoomUse,items:Placed[])=>GameResult;relax:(kind:'fun'|'garden')=>GameResult;sleep:()=>void;cook:()=>void;study:()=>void}

/** Lưới phòng isometric dựng tạm bằng khối (ảnh vẽ sẽ giao sau). Chạm món trong kho rồi chạm ô để đặt; chạm món đã đặt để xoay hoặc cất. */
function IsoRoom({w,h,use,items,selected,onCell,onItem}:{w:number;h:number;use:RoomUse;items:Placed[];selected:HomeId|null;onCell:(x:number,y:number)=>void;onItem:(id:HomeId)=>void}){
 const cw=600/(w+h),ch=cw/2,P=(x:number,y:number,z=0)=>`${(x-y)*cw/2},${(x+y)*ch/2-z}`,wall=cw*1.2;
 const minX=-h*cw/2-4,width=(w+h)*cw/2+8,height=(w+h)*ch/2+wall+8;
 const sorted=[...items].sort((a,b)=>(a.x+a.y)-(b.x+b.y));
 return <svg className="iso-room" viewBox={`${minX} ${-wall-4} ${width} ${height}`} role="img" aria-label="Sơ đồ phòng">
  <polygon points={[P(0,0),P(w,0),P(w,0,wall),P(0,0,wall)].join(' ')} fill="#f4efe6" stroke="#d8cfbf"/>
  <polygon points={[P(0,0),P(0,h),P(0,h,wall),P(0,0,wall)].join(' ')} fill="#ebe4d8" stroke="#d8cfbf"/>
  {Array.from({length:w*h},(_,i)=>{const x=i%w,y=Math.floor(i/w);return <polygon key={i} className="iso-cell" points={[P(x,y),P(x+1,y),P(x+1,y+1),P(x,y+1)].join(' ')} fill={FLOOR[use]} stroke="#0000001a" strokeWidth={.6} onClick={()=>onCell(x,y)}/>})}
  {sorted.map(p=>{const {w:iw,h:ih}=itemSize(p),z=cw*.55,tone=TONE[p.id]??'#b9c7b0',c=`${(p.x+iw/2-(p.y+ih/2))*cw/2}`,cy=(p.x+iw/2+p.y+ih/2)*ch/2-z;
   return <g key={p.id} className={`iso-item ${selected===p.id?'is-selected':''}`} onClick={e=>{e.stopPropagation();onItem(p.id)}}>
    <polygon points={[P(p.x+iw,p.y),P(p.x+iw,p.y+ih),P(p.x+iw,p.y+ih,z),P(p.x+iw,p.y,z)].join(' ')} fill={tone} filter="brightness(.85)" opacity=".9"/>
    <polygon points={[P(p.x,p.y+ih),P(p.x+iw,p.y+ih),P(p.x+iw,p.y+ih,z),P(p.x,p.y+ih,z)].join(' ')} fill={tone} opacity=".75"/>
    <polygon points={[P(p.x,p.y,z),P(p.x+iw,p.y,z),P(p.x+iw,p.y+ih,z),P(p.x,p.y+ih,z)].join(' ')} fill={tone} stroke={selected===p.id?'#2f6b4f':'#00000022'} strokeWidth={selected===p.id?2:1}/>
    <use href={`#i-${HOME_ITEMS[p.id].icon}`} x={Number(c)-cw*.35} y={cy-cw*.35} width={cw*.7} height={cw*.7} className="iso-icon"/>
   </g>})}
 </svg>}

export default function HouseView({state,h}:{state:GameState;h:HouseHandlers}){
 const hs=housingOf(state),house=hs.house as Exclude<HouseId,'tro'>,def=HOUSES[house];
 const [room,setRoom]=useState<RoomUse>(def.rooms.find(r=>r.id==='bedroom')?.id??def.rooms[0]!.id),[pick,setPick]=useState<HomeId|null>(null),[sel,setSel]=useState<HomeId|null>(null),[note,setNote]=useState('');
 const r=def.rooms.find(x=>x.id===room)!,items=layoutOf(state,house,room),store=storageOf(state,house);
 const save=(next:Placed[])=>{const res=h.arrange(room,next);setNote(res.ok?'':res.error);return res.ok};
 const onCell=(x:number,y:number)=>{if(pick){const p:Placed={id:pick,x,y,rotation:0};const next=[...items,p];if(placeError(r,next)){setNote('Chỗ này không vừa.');return}if(save(next))setPick(null);return}setSel(null)};
 const rotate=()=>{if(!sel)return;const next=items.map(p=>p.id===sel?{...p,rotation:(p.rotation?0:90) as 0|90}:p);if(placeError(r,next)){setNote('Xoay không vừa chỗ.');return}save(next)};
 const stow=()=>{if(!sel)return;if(save(items.filter(p=>p.id!==sel)))setSel(null)};
 const act=(fn:()=>GameResult)=>{const res=fn();setNote(res.ok?'':res.error)};
 const used=new Set(hs.relax?Object.entries(hs.relax).filter(([,d])=>d===state.day).map(([k])=>k):[]);
 return <section className="house-view" aria-label={def.name}>
  <header className="house-head"><strong>{def.name}</strong><small>{hs.tenure==='own'?'Nhà của bạn':`${money(def.rent??0)}/tháng`}</small></header>
  <nav className="house-rooms">{def.rooms.map(x=><button key={x.id} aria-pressed={x.id===room} onClick={()=>{setRoom(x.id);setPick(null);setSel(null);setNote('')}}>{x.name}{x.floor?<small>T{x.floor}</small>:null}</button>)}</nav>
  <IsoRoom w={r.w} h={r.h} use={room} items={items} selected={sel} onCell={onCell} onItem={id=>{setPick(null);setSel(s=>s===id?null:id)}}/>
  <div className="house-actions">
   {room==='bedroom'&&<button onClick={h.sleep}><Icon name="moon"/>Đi ngủ</button>}
   {room==='kitchen'&&<button onClick={h.cook}><Icon name="pan"/>Nấu ăn</button>}
   {room==='study'&&<button onClick={h.study}><Icon name="note"/>Tự học</button>}
   {(room==='fun'||room==='garden')&&<button disabled={used.has(room)} onClick={()=>act(()=>h.relax(room))}><Icon name={room==='fun'?'play':'leaf'}/>{RELAX[room].name}<small><Icon name="clock"/>{RELAX[room].minutes}'</small></button>}
   {sel&&<><button onClick={rotate}><Icon name="rotate"/>Xoay</button><button onClick={stow}><Icon name="box"/>Cất</button></>}
  </div>
  {store.length>0&&<div className="house-store" aria-label="Đồ trong kho">{store.map(id=><button key={id} aria-pressed={pick===id} onClick={()=>{setSel(null);setPick(p=>p===id?null:id)}}><Icon name={HOME_ITEMS[id].icon}/><span>{HOME_ITEMS[id].name}</span></button>)}</div>}
  {note&&<p className="ps-note" role="status">{note}</p>}
 </section>}
