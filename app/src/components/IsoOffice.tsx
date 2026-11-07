import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {KIT,Z_PX,depth,iso,spriteBox,type KitId,type OfficePlan,type Piece,type Zone} from '../domain/office-plan';
import {pinchStart,pinchCamera,type Point} from '../map/gestures';

export interface OfficePerson{id:string;label:string;seat:number;tone:string;player?:boolean;name:string;/** Có việc cần chủ xử lý: hiện bong bóng "!". */alert?:boolean}
interface Props{plan:OfficePlan;people:OfficePerson[];bug?:boolean;afternoon?:boolean;onPerson?:(id:string)=>void}
type Sprite={file:string};
const ZONE_FILL:Record<Zone['kind'],string>={work:'#efe4cc',pantry:'#e6ead6',meeting:'#e3e7ea',boss:'#ece0d2',reception:'#eee8dc'};
const WALL=3*Z_PX,PAD=48,MIN=.2,MAX=1.1,START=.32;
const shade=(hex:string,f:number)=>{const n=parseInt(hex.slice(1),16),c=[n>>16,n>>8&255,n&255].map(v=>Math.round(v*f));return`rgb(${c.join(',')})`};
const pts=(list:{x:number;y:number}[])=>list.map(p=>`${p.x},${p.y}`).join(' ');

/** Một khối isometric thay cho ảnh khi chưa có asset. */
function Block({x,y,item}:{x:number;y:number;item:KitId}){const k=KIT[item],h=k.h*Z_PX,a=iso(x,y),b=iso(x+k.w,y),c=iso(x+k.w,y+k.d),d=iso(x,y+k.d),up=(p:{x:number;y:number})=>({x:p.x,y:p.y-h});
 return <g className="iso-block"><polygon points={pts([d,c,up(c),up(d)])} fill={shade(k.color,.82)}/><polygon points={pts([c,b,up(b),up(c)])} fill={shade(k.color,.68)}/><polygon points={pts([up(a),up(b),up(c),up(d)])} fill={k.color}/><title>{k.name}</title></g>}

/** Cảnh văn phòng isometric: sàn liền chia khu, kéo và phóng như bản đồ thành phố. */
export default function IsoOffice({plan,people,bug,afternoon,onPerson}:Props){
 const view=useRef<HTMLDivElement>(null),[zoom,setZoom]=useState(START),[sprites,setSprites]=useState<Record<string,Sprite>>({});
 const box=useMemo(()=>{let left=iso(0,plan.d).x-PAD,right=iso(plan.w,0).x+PAD,top=-WALL-PAD,bottom=iso(plan.w,plan.d).y+PAD;const s=plan.shell;if(s){left=Math.min(left,-s.ox);right=Math.max(right,s.w-s.ox);top=Math.min(top,-s.oy);bottom=Math.max(bottom,s.h-s.oy)}return{left,top,width:right-left,height:bottom-top}},[plan]);
 const player=people.find(p=>p.player),seatOf=(i:number)=>plan.seats[i];
 const centerOn=(wx:number,wy:number,z=zoom,smooth=false)=>{const v=view.current;if(!v)return;const p={x:(wx-box.left)*z,y:(wy-box.top)*z};v.scrollTo({left:p.x-v.clientWidth/2,top:p.y-v.clientHeight/2,behavior:smooth?'smooth':'auto'})};
 useEffect(()=>{let live=true;fetch('/assets/office-kit/manifest.json').then(r=>r.ok?r.json():null).then((m:unknown)=>{if(!live||!m||!Array.isArray((m as {items?:unknown}).items))return;const out:Record<string,Sprite>={};for(const it of (m as {items:{id?:unknown;files?:{a?:unknown}}[]}).items){if(typeof it.id==='string'&&it.id in KIT&&typeof it.files?.a==='string'&&/^[\w.-]+$/.test(it.files.a))out[it.id]={file:'/assets/office-kit/'+it.files.a}}setSprites(out)}).catch(()=>{});return()=>{live=false}},[]);
 useLayoutEffect(()=>{const s=player?seatOf(player.seat):undefined,c=s?iso(s.x+.5,s.y+.5):iso(plan.w/2,plan.d/2);centerOn(c.x,c.y-40,START)},[plan]);// eslint-disable-line react-hooks/exhaustive-deps

 // Kéo bằng chuột và phóng bằng hai ngón; vuốt một ngón dùng cuộn sẵn của trình duyệt.
 const pointers=useRef(new Map<number,Point>()),pinch=useRef<ReturnType<typeof pinchStart>|null>(null),drag=useRef<{x:number;y:number;left:number;top:number;moved:boolean}|null>(null);
 const zoomTo=(z:number,anchor?:Point)=>{const v=view.current;if(!v)return;const nz=Math.max(MIN,Math.min(MAX,z)),a=anchor??{x:v.clientWidth/2,y:v.clientHeight/2},wx=(v.scrollLeft+a.x)/zoom,wy=(v.scrollTop+a.y)/zoom;setZoom(nz);requestAnimationFrame(()=>{v.scrollLeft=wx*nz-a.x;v.scrollTop=wy*nz-a.y})};
 const local=(e:React.PointerEvent)=>{const r=view.current!.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
 const down=(e:React.PointerEvent)=>{pointers.current.set(e.pointerId,local(e));const v=view.current!;if(pointers.current.size===2){const [a,b]=[...pointers.current.values()];pinch.current=pinchStart(a!,b!,zoom,v.scrollLeft,v.scrollTop);drag.current=null}else if(e.pointerType==='mouse')drag.current={x:e.clientX,y:e.clientY,left:v.scrollLeft,top:v.scrollTop,moved:false}};
 const move=(e:React.PointerEvent)=>{if(!pointers.current.has(e.pointerId))return;pointers.current.set(e.pointerId,local(e));const v=view.current!;if(pinch.current&&pointers.current.size===2){const [a,b]=[...pointers.current.values()];const c=pinchCamera(pinch.current,a!,b!,MIN,MAX);setZoom(c.zoom);v.scrollLeft=c.left;v.scrollTop=c.top}else if(drag.current){const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;if(Math.abs(dx)+Math.abs(dy)>5)drag.current.moved=true;v.scrollLeft=drag.current.left-dx;v.scrollTop=drag.current.top-dy}};
 const up=(e:React.PointerEvent)=>{pointers.current.delete(e.pointerId);if(pointers.current.size<2)pinch.current=null};
 const tap=(id:string)=>{if(drag.current?.moved)return;onPerson?.(id)};

 const items=[...plan.pieces.map(p=>({kind:'piece' as const,p,d:depth(p)})),...people.flatMap(person=>{const s=seatOf(person.seat);return s?[{kind:'person' as const,person,s,d:s.x+s.y+1.01}]:[]})].sort((a,b)=>a.d-b.d);
 const playerDesk=player?plan.pieces.find(p=>p.key===seatOf(player.seat)?.desk):undefined;
 const wall=(a:{x:number;y:number},b:{x:number;y:number})=><polygon className="iso-wall" points={pts([a,b,{x:b.x,y:b.y-WALL},{x:a.x,y:a.y-WALL}])}/>;
 const zoneJump=(z:Zone)=>{const c=iso(z.x+z.w/2,z.y+z.d/2);centerOn(c.x,c.y,zoom,true)};
 return <div className="iso-office">
  <div className="iso-office-view" ref={view} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onWheel={e=>{if(e.ctrlKey){e.preventDefault();zoomTo(zoom*(e.deltaY<0?1.1:.9),local(e as unknown as React.PointerEvent))}}}>
   <svg className="iso-office-svg" style={{width:box.width*zoom,height:box.height*zoom}} viewBox={`${box.left} ${box.top} ${box.width} ${box.height}`} role="img" aria-label="Văn phòng">
    {plan.shell?<image className="iso-shell" href={plan.shell.src} x={-plan.shell.ox} y={-plan.shell.oy} width={plan.shell.w} height={plan.shell.h} preserveAspectRatio="none"/>:<>
    {plan.zones.filter(z=>z.y===0).map(z=><g key={'wr'+z.id}>{wall(iso(z.x,0),iso(z.x+z.w,0))}</g>)}
    {plan.zones.filter(z=>z.x===0).map(z=><g key={'wl'+z.id}>{wall(iso(0,z.y),iso(0,z.y+z.d))}</g>)}
    {plan.zones.map(z=><g key={z.id}><polygon className="iso-floor" points={pts([iso(z.x,z.y),iso(z.x+z.w,z.y),iso(z.x+z.w,z.y+z.d),iso(z.x,z.y+z.d)])} fill={ZONE_FILL[z.kind]}/>
     <g className="iso-grid">{Array.from({length:z.w-1},(_,i)=><line key={'gx'+i} {...line(iso(z.x+i+1,z.y),iso(z.x+i+1,z.y+z.d))}/>)}{Array.from({length:z.d-1},(_,i)=><line key={'gy'+i} {...line(iso(z.x,z.y+i+1),iso(z.x+z.w,z.y+i+1))}/>)}</g></g>)}</>}
    {plan.zones.map(z=><g key={'p'+z.id} className="iso-partition">{z.x>0&&<Edge from={{x:z.x,y:z.y}} to={{x:z.x,y:z.y+z.d}} doors={plan.doors.filter(d=>d.axis==='y'&&d.x===z.x)}/>}{z.y>0&&<Edge from={{x:z.x,y:z.y}} to={{x:z.x+z.w,y:z.y}} doors={plan.doors.filter(d=>d.axis==='x'&&d.y===z.y)}/>}</g>)}
    {playerDesk&&<polygon className="iso-mine" points={pts([iso(playerDesk.x-.2,playerDesk.y-.2),iso(playerDesk.x+KIT[playerDesk.item].w+.2,playerDesk.y-.2),iso(playerDesk.x+KIT[playerDesk.item].w+.2,playerDesk.y+2.2),iso(playerDesk.x-.2,playerDesk.y+2.2)])}/>}
    {items.map(it=>it.kind==='piece'?<Thing key={it.p.key} p={it.p} sprite={sprites[it.p.item]}/>:<Person key={it.person.id} person={it.person} at={iso(it.s.x+.5,it.s.y+.5)} onTap={onPerson?()=>tap(it.person.id):undefined}/>)}
    {bug&&playerDesk&&(()=>{const c=iso(playerDesk.x+1,playerDesk.y+.5);return <g className="iso-bug"><rect x={c.x-34} y={c.y-KIT['desk-pc'].h*Z_PX-58} width={68} height={30} rx={10}/><text x={c.x} y={c.y-KIT['desk-pc'].h*Z_PX-37} textAnchor="middle">bug</text></g>})()}
    {plan.zones.length>1&&plan.zones.map(z=>{const c=iso(z.x+.6,z.y+.6);return <text key={'n'+z.id} className="iso-zone-name" x={c.x} y={c.y+18} textAnchor="middle">{z.name}</text>})}
    {afternoon&&<rect className="iso-afternoon" x={box.left} y={box.top} width={box.width} height={box.height}/>}
   </svg>
  </div>
  <div className="iso-office-tools">{plan.zones.length>1&&<div className="iso-zone-chips">{plan.zones.map(z=><button key={z.id} onClick={()=>zoneJump(z)}>{z.name}</button>)}</div>}<div className="iso-zoom"><button aria-label="Thu nhỏ" onClick={()=>zoomTo(zoom/1.25)}>−</button><button aria-label="Phóng to" onClick={()=>zoomTo(zoom*1.25)}>+</button>{player&&<button aria-label="Về bàn của bạn" onClick={()=>{const s=seatOf(player.seat);if(s){const c=iso(s.x+.5,s.y+.5);centerOn(c.x,c.y-40,zoom,true)}}}>⌖</button>}</div></div>
 </div>;
 function line(a:{x:number;y:number},b:{x:number;y:number}){return{x1:a.x,y1:a.y,x2:b.x,y2:b.y}}
}

function Edge({from,to,doors}:{from:{x:number;y:number};to:{x:number;y:number};doors:{x:number;y:number;axis:'x'|'y'}[]}){const horizontal=from.y===to.y,len=horizontal?to.x-from.x:to.y-from.y,cuts=doors.map(d=>horizontal?d.x-from.x:d.y-from.y).filter(o=>o>=0&&o<len).sort((a,b)=>a-b);const segs:[number,number][]=[];let s=0;for(const c of cuts){if(c>s)segs.push([s,c]);s=c+2}if(s<len)segs.push([s,len]);
 return <>{segs.map(([a,b],i)=>{const p=horizontal?iso(from.x+a,from.y):iso(from.x,from.y+a),q=horizontal?iso(from.x+b,from.y):iso(from.x,from.y+b);return <polygon key={i} points={pts([p,q,{x:q.x,y:q.y-18},{x:p.x,y:p.y-18}])}/>})}</>}

function Thing({p,sprite}:{p:Piece;sprite?:Sprite}){if(sprite){const b=spriteBox(p,p.item);return <image href={sprite.file} x={b.left} y={b.top} width={b.width} height={b.height}><title>{KIT[p.item].name}</title></image>}const k=KIT[p.item],c=iso(p.x+k.w/2,p.y+k.d/2),s=p.item==='chair'?.75:.9;return <g transform={`translate(${c.x} ${c.y}) scale(${s}) translate(${-c.x} ${-c.y})`}><Block x={p.x} y={p.y} item={p.item}/></g>}

function Person({person,at,onTap}:{person:OfficePerson;at:{x:number;y:number};onTap?:()=>void}){const lift=58;
 return <g className={`iso-person${person.player?' is-player':''}`} role={onTap?'button':undefined} tabIndex={onTap?0:undefined} aria-label={person.name} onClick={onTap} onKeyDown={e=>{if(onTap&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onTap()}}}>
  <ellipse cx={at.x} cy={at.y} rx={26} ry={13} className="iso-person-shadow"/>
  <line x1={at.x} y1={at.y} x2={at.x} y2={at.y-lift+24} className="iso-person-stem"/>
  <circle cx={at.x} cy={at.y-lift} r={26} fill={person.tone}/>
  <text x={at.x} y={at.y-lift+8} textAnchor="middle">{person.label}</text>
  {person.alert&&<g className="iso-alert"><circle cx={at.x+24} cy={at.y-lift-26} r={15}/><text x={at.x+24} y={at.y-lift-19} textAnchor="middle">!</text></g>}
 </g>}
