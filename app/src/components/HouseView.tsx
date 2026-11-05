import {useEffect,useRef,useState} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {HOME_ITEMS,homeName,homeOf,type HomeId} from '../domain/home';
import {HOUSES,RELAX,housingOf,layoutOf,storageOf,itemSize,placeError,roomOfCell,roomAt,type Placed,type RoomUse,type HouseId,type FloorDef,type RoomDef,ROTATIONS} from '../domain/housing';
import {money} from '../domain/format';
import {spriteFor} from './furniture-art';
import FLOORS from '../domain/house-floors.json';
import Icon from './Icon';

const CW=24,CH=12,VW=360,VH=420;
const TONE:Partial<Record<HomeId,string>>={bed:'#c9b79c',wardrobe:'#a98b6c',desk:'#b8a07f'};
const FLOOR:Record<RoomUse,string>={living:'#efe4d0',kitchen:'#e3e8de',bedroom:'#eadcd0',study:'#e7dfcf',bath:'#dbe8ec',guest:'#ece0d4',fun:'#e2deee',garden:'#d4e6c3'};
/** Ảnh Codex #89: mặt bằng lô 4, nội thất lô 5 (ô 128×64 px, neo ở đỉnh dưới chân đế). */
const PX=CW/128;
/** Hành động của từng phòng (mỗi phòng một việc riêng) và đồ nào mở popup nào. */
type ActId='sleep'|'cook'|'study'|'fun'|'garden'|'tv'|'nap'|'gig'|'play';
const ACT:Record<ActId,{icon:string;label:string;title:string}>={sleep:{icon:'moon',label:'Ngủ',title:'Giường'},cook:{icon:'pan',label:'Nấu ăn',title:'Bếp'},study:{icon:'note',label:'Tự học',title:'Bàn học'},fun:{icon:'play',label:RELAX.fun.name,title:'Giải trí'},garden:{icon:'leaf',label:RELAX.garden.name,title:'Sân vườn'},tv:{icon:'play',label:'Xem TV',title:'TV'},nap:{icon:'moon',label:'Nghỉ 1 giờ',title:'Giường'},gig:{icon:'briefcase',label:'Làm thêm',title:'Bàn học'},play:{icon:'play',label:'Giải trí',title:'Bàn học'}};
/** Việc thêm cùng đồ: giường có Nghỉ 1 giờ; bàn có Làm thêm và Giải trí (như phòng trọ). */
const EXTRA:Partial<Record<ActId,ActId[]>>={sleep:['nap'],study:['gig','play']};
const ROOM_ACT:Partial<Record<RoomUse,ActId>>={bedroom:'sleep',guest:'sleep',kitchen:'cook',study:'study',fun:'fun',garden:'garden'};
const ITEM_ACT:Partial<Record<HomeId,ActId>>={bed:'sleep',desk:'study',fridge:'cook',table:'cook',tv:'tv'};
export interface HouseHandlers{arrange:(floor:1|2,items:Placed[])=>GameResult;relax:(kind:'fun'|'garden')=>GameResult;sleep:()=>void;cook:()=>void;study:()=>void;tv:()=>GameResult;use:(k:'nap'|'gig'|'play')=>GameResult}

const P=(x:number,y:number,z=0)=>({x:(x-y)*CW/2,y:(x+y)*CH/2-z});
const pts=(a:{x:number;y:number}[])=>a.map(p=>`${p.x},${p.y}`).join(' ');
const quad=(x:number,y:number,w:number,h:number,z=0)=>pts([P(x,y,z),P(x+w,y,z),P(x+w,y+h,z),P(x,y+h,z)]);
type View={k:number;tx:number;ty:number};
const focusOn=(r:{x:number;y:number;w:number;h:number}):View=>{const k=Math.min(2.4,Math.max(.5,300/((r.w+r.h)*CW/2))),c=P(r.x+r.w/2,r.y+r.h/2);return{k,tx:VW/2-c.x*k,ty:VH/2-c.y*k}};

/** Mặt bằng một tầng, các phòng liền nhau; kéo để di chuyển, chụm hai ngón hoặc cuộn để phóng to. Khối dựng tạm, ảnh vẽ giao sau. */
function FloorPlan({floor,art,tiers,picking,items,selected,view,setView,onCell,onItem}:{floor:FloorDef;art?:{f:string;w:number;h:number;ox:number;oy:number};tiers:Partial<Record<HomeId,string>>;picking:boolean;items:Placed[];selected:HomeId|null;view:View;setView:(v:View)=>void;onCell:(x:number,y:number)=>void;onItem:(id:HomeId)=>void}){
 const ref=useRef<SVGSVGElement>(null),ptr=useRef(new Map<number,{x:number;y:number}>()),drag=useRef<{moved:number;pinch?:number;start:View}|null>(null),viewRef=useRef(view);viewRef.current=view;
 const scale=()=>{const r=ref.current?.getBoundingClientRect();return r?VW/r.width:1};
 const down=(e:React.PointerEvent)=>{ptr.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const ps=[...ptr.current.values()];drag.current={moved:drag.current?.moved??0,start:viewRef.current,...(ps.length===2?{pinch:Math.hypot(ps[0]!.x-ps[1]!.x,ps[0]!.y-ps[1]!.y)}:{})}};
 const move=(e:React.PointerEvent)=>{const old=ptr.current.get(e.pointerId);if(!old||!drag.current)return;const f=scale();ptr.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const ps=[...ptr.current.values()],v=viewRef.current;
  if(ps.length===2&&drag.current.pinch){const d=Math.hypot(ps[0]!.x-ps[1]!.x,ps[0]!.y-ps[1]!.y),k=Math.min(3,Math.max(.35,drag.current.start.k*d/drag.current.pinch)),cx=VW/2,cy=VH/2;setView({k,tx:cx-(cx-v.tx)*k/v.k,ty:cy-(cy-v.ty)*k/v.k});drag.current.moved+=10;return}
  const dx=(e.clientX-old.x)*f,dy=(e.clientY-old.y)*f;drag.current.moved+=Math.abs(dx)+Math.abs(dy);setView({...v,tx:v.tx+dx,ty:v.ty+dy})};
 const up=(e:React.PointerEvent)=>{ptr.current.delete(e.pointerId);if(!ptr.current.size)setTimeout(()=>{drag.current=null},0)};
 const tap=(fn:()=>void)=>()=>{if((drag.current?.moved??0)>8)return;fn()};
 useEffect(()=>{const el=ref.current;if(!el)return;const wheel=(e:WheelEvent)=>{e.preventDefault();const v=viewRef.current,k=Math.min(3,Math.max(.35,v.k*(e.deltaY<0?1.12:.89))),cx=VW/2,cy=VH/2;setView({k,tx:cx-(cx-v.tx)*k/v.k,ty:cy-(cy-v.ty)*k/v.k})};el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel)},[setView]);
 const wall=CW*1.1,{w,h}=floor,sorted=[...items].sort((a,b)=>(a.x+a.y)-(b.x+b.y));
 return <svg ref={ref} className="iso-room" viewBox={`0 0 ${VW} ${VH}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} role="img" aria-label="Mặt bằng tầng">
  <g transform={`translate(${view.tx} ${view.ty}) scale(${view.k})`}>
   {art?<image href={art.f} x={-art.ox*PX} y={-art.oy*PX} width={art.w*PX} height={art.h*PX} pointerEvents="none"/>:<>
   <polygon points={pts([P(0,0),P(w,0),P(w,0,wall),P(0,0,wall)])} fill="#f4efe6" stroke="#d8cfbf"/>
   <polygon points={pts([P(0,0),P(0,h),P(0,h,wall),P(0,0,wall)])} fill="#ebe4d8" stroke="#d8cfbf"/></>}
   {Array.from({length:w*h},(_,i)=>{const x=i%w,y=Math.floor(i/w),r=roomOfCell(floor,x,y);return <polygon key={i} className="iso-cell" points={quad(x,y,1,1)} fill={art?(picking&&r?'#ffffff33':'transparent'):r?FLOOR[r.id]:'#f1efe9'} stroke={art?(picking&&r?'#2f6b4f55':'none'):'#0000001a'} strokeWidth={.5} onClick={tap(()=>onCell(x,y))}/>})}
   {!art&&floor.stairs&&<g className="iso-stairs" pointerEvents="none">{Array.from({length:floor.stairs.h},(_,i)=><polygon key={i} points={quad(floor.stairs!.x,floor.stairs!.y+i,floor.stairs!.w,1,(floor.stairs!.h-i)*3)} fill="#d9d0c1" stroke="#b9ad99" strokeWidth={.6}/>)}</g>}
   {!art&&floor.rooms.map(r=><g key={r.id} pointerEvents="none"><polygon points={quad(r.x,r.y,r.w,r.h)} fill="none" stroke="#8d8270" strokeWidth={1.4}/><text x={P(r.x+r.w/2,r.y+r.h/2).x} y={P(r.x+r.w/2,r.y+r.h/2).y} className="iso-label">{r.name}</text></g>)}
   {sorted.map(p=>{const {w:iw,h:ih}=itemSize(p),sp=spriteFor(p.id,tiers[p.id],p.rotation),on=selected===p.id;
    if(sp){const b=P(p.x+iw,p.y+ih);return <g key={p.id} className={`iso-item ${on?'is-selected':''}`} onClick={tap(()=>onItem(p.id))}>{on&&<polygon points={quad(p.x,p.y,iw,ih)} fill="#2f6b4f33" stroke="#2f6b4f" strokeWidth={1.2}/>}<image href={sp.f} x={b.x-sp.ax*PX} y={b.y-sp.ay*PX} width={sp.w*PX} height={sp.h*PX}/></g>}
    const z=CW*.55,tone=TONE[p.id]??'#b9c7b0',c=P(p.x+iw/2,p.y+ih/2,z);
    return <g key={p.id} className={`iso-item ${on?'is-selected':''}`} onClick={tap(()=>onItem(p.id))}>
     <polygon points={pts([P(p.x+iw,p.y),P(p.x+iw,p.y+ih),P(p.x+iw,p.y+ih,z),P(p.x+iw,p.y,z)])} fill={tone} opacity=".9"/>
     <polygon points={pts([P(p.x,p.y+ih),P(p.x+iw,p.y+ih),P(p.x+iw,p.y+ih,z),P(p.x,p.y+ih,z)])} fill={tone} opacity=".7"/>
     <polygon points={quad(p.x,p.y,iw,ih,z)} fill={tone} stroke={on?'#2f6b4f':'#00000022'} strokeWidth={on?2:1}/>
     <use href={`#i-${HOME_ITEMS[p.id].icon}`} x={c.x-CW*.35} y={c.y-CW*.35} width={CW*.7} height={CW*.7} className="iso-icon"/>
    </g>})}
  </g>
 </svg>}

export default function HouseView({state,h}:{state:GameState;h:HouseHandlers}){
 const hs=housingOf(state),house=hs.house as Exclude<HouseId,'tro'>,def=HOUSES[house];
 const start=def.floors.find(f=>f.rooms.some(r=>r.id==='bedroom'))??def.floors[0]!;
 const [fid,setFid]=useState<1|2>(start.id),floor=def.floors.find(f=>f.id===fid)!;
 const [active,setActive]=useState<RoomDef>(floor.rooms.find(r=>r.id==='bedroom')??floor.rooms[0]!),[view,setView]=useState<View>(()=>focusOn(active));
 const [editing,setEditing]=useState(false),[use,setUse]=useState<string|null>(null),[pick,setPick]=useState<HomeId|null>(null),[sel,setSel]=useState<HomeId|null>(null),[note,setNote]=useState('');
 const items=layoutOf(state,house,fid),store=storageOf(state,house);
 const go=(r:RoomDef)=>{setUse(null);setActive(r);setView(focusOn(r));setNote('')};
 const switchFloor=(id:1|2)=>{const f=def.floors.find(x=>x.id===id)!;setFid(id);setPick(null);setSel(null);go(f.rooms[0]!)};
 const save=(next:Placed[])=>{const res=h.arrange(fid,next);setNote(res.ok?'':res.error);return res.ok};
 const onCell=(x:number,y:number)=>{const r=roomOfCell(floor,x,y);if(r&&r.id!==active.id)setActive(r);if(pick&&editing){const next=[...items,{id:pick,x,y,rotation:0 as const}];if(placeError(floor,next)){setNote('Chỗ này không vừa.');return}if(save(next))setPick(null);return}setSel(null)};
 const rotate=()=>{if(!sel)return;const next=items.map(p=>p.id===sel?{...p,rotation:ROTATIONS[(ROTATIONS.indexOf(p.rotation)+1)%4]!}:p);if(placeError(floor,next)){setNote('Xoay không vừa chỗ.');return}save(next)};
 const stow=()=>{if(!sel)return;if(save(items.filter(p=>p.id!==sel)))setSel(null)};
 const act=(fn:()=>GameResult)=>{const res=fn();setNote(res.ok?'':res.error)};
 const used=new Set(hs.relax?Object.entries(hs.relax).filter(([,d])=>d===state.day).map(([k])=>k):[]);const room=active.id,tvDone=state.life?.daily?.tv===state.day;
 return <section className="house-view" aria-label={def.name}>
  <header className="house-head"><strong>{def.name}</strong><small>{hs.tenure==='own'?'Nhà của bạn':`${money(def.rent??0)}/tháng`}</small></header>
  <div className="house-nav">{def.floors.length>1&&<div className="house-floors">{def.floors.map(f=><button key={f.id} aria-pressed={f.id===fid} onClick={()=>switchFloor(f.id)}>T{f.id}</button>)}</div>}
   <nav className="house-rooms">{floor.rooms.map(x=><button key={x.id} aria-pressed={x.id===active.id} onClick={()=>go(x)}>{x.name}</button>)}</nav></div>
  <FloorPlan floor={floor} art={(FLOORS as Record<string,{f:string;w:number;h:number;ox:number;oy:number}>)[`${house}-${fid}`]} tiers={Object.fromEntries(homeOf(state).items.map(i=>[i.id,i.tier??'basic']))} picking={!!pick} items={items} selected={sel} view={view} setView={setView} onCell={onCell} onItem={id=>{const p0=items.find(i=>i.id===id),r0=p0&&roomAt(floor,p0);if(!editing){const k=ITEM_ACT[id];if(k&&r0){setActive(r0);setUse(k)}return}setPick(null);setSel(s=>s===id?null:id);const p=items.find(i=>i.id===id);const r=p&&roomAt(floor,p);if(r)setActive(r)}}/>
  <div className="house-tools">
   <button onClick={()=>{setEditing(e=>!e);setPick(null);setSel(null);setUse(null);setNote('')}}><Icon name={editing?'close':'move'}/>{editing?'Xong':'Sắp xếp'}</button>
   {!editing&&ROOM_ACT[room]&&<button className="house-use-icon" aria-label={ACT[ROOM_ACT[room]!].title} title={ACT[ROOM_ACT[room]!].title} onClick={()=>setUse(ROOM_ACT[room]!)}><Icon name={ACT[ROOM_ACT[room]!].icon}/></button>}
   {editing&&sel&&<><button onClick={rotate}><Icon name="rotate"/>Xoay</button><button onClick={stow}><Icon name="box"/>Cất</button></>}
  </div>
  {editing&&store.length>0&&<div className="house-store" aria-label="Đồ trong kho">{store.map(id=><button key={id} aria-pressed={pick===id} onClick={()=>{setSel(null);setPick(p=>p===id?null:id)}}>{(()=>{const tier=homeOf(state).items.find(i=>i.id===id)?.tier,sp=spriteFor(id,tier);return sp?<img src={sp.f} alt=""/>:<Icon name={HOME_ITEMS[id].icon}/>})()}<span>{homeName(id,homeOf(state).items.find(i=>i.id===id)?.tier)}</span></button>)}</div>}
  {use&&!editing&&(()=>{const k=use as ActId,a=ACT[k],ex=EXTRA[k]??[],lf=state.life?.daily,fire=(x:ActId)=>{setUse(null);if(x==='sleep')h.sleep();else if(x==='cook')h.cook();else if(x==='study')h.study();else if(x==='tv')act(()=>h.tv());else if(x==='nap'||x==='gig'||x==='play')act(()=>h.use(x));else act(()=>h.relax(x as 'fun'|'garden'))},isDone=(x:ActId)=>(x==='fun'||x==='garden')?used.has(x):x==='tv'?tvDone:x==='nap'||x==='gig'||x==='play'?lf?.[x]===state.day:false;return <div className="home-object-actions home-use" role="toolbar" aria-label={a.title}>{[k,...ex].map(x=>{const b=ACT[x];return <button key={x} disabled={isDone(x)} onClick={()=>fire(x)}><Icon name={b.icon}/>{b.label}{(x==='fun'||x==='garden')&&<small><Icon name="clock"/>{RELAX[x].minutes}'</small>}{x==='tv'&&<small><Icon name="clock"/>30'</small>}</button>})}<button aria-label="Đóng" onClick={()=>setUse(null)}><Icon name="close"/></button></div>})()}
  {note&&<p className="ps-note" role="status">{note}</p>}
 </section>}
