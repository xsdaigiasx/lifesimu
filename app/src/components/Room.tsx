import {useRef,useState,type PointerEvent,type KeyboardEvent} from 'react';
import {HOME_ITEMS,HOME_GRID,homeOf,homeError,rotateHomeObject,type HomeObject,type HomeId} from '../domain/home';
import {floorPoint,floorCell,floorPolygon,homeSize,blockedHomeCell,HOME_FLOOR,homeSafeEdgePath,homeAnchor,HOME_OUTER_FLOOR,homeArtFit} from '../domain/home-geometry';
import type {GameState,GameResult} from '../domain/types';
import Icon from './Icon';
import {HOME_ART,HOME_GROUND} from '../domain/home-art';
import HomeArt from './HomeArt';
// The rug is planar: map its raster texture to the actual four floor corners.
function rugView(item:HomeObject){
 const {w,h}=homeSize(item),corners=[floorPoint(item.x,item.y),floorPoint(item.x+w,item.y),floorPoint(item.x+w,item.y+h),floorPoint(item.x,item.y+h)];
 const left=Math.min(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y)),width=Math.max(...corners.map(p=>p.x))-left,height=Math.max(...corners.map(p=>p.y))-top;
 const origin=corners[item.rotation?1:0],u=corners[item.rotation?2:1],v=corners[item.rotation?0:3];
 const sx=556,sy=104,ux=884,uy=549,vx=-467,vy=286,det=ux*vy-uy*vx;
 const ax=u.x-origin.x,ay=u.y-origin.y,bx=v.x-origin.x,by=v.y-origin.y;
 const a=(ax*vy-bx*uy)/det,b=(ay*vy-by*uy)/det,cc=(bx*ux-ax*vx)/det,d=(by*ux-ay*vx)/det;
 return {left,top,width,height,matrix:[a,b,cc,d,origin.x-left-a*sx-cc*sy,origin.y-top-b*sx-d*sy].join(' ')};
}
function RugArt({item}:{item:HomeObject}){const r=rugView(item);return <svg className="home-rug-art" viewBox={`0 0 ${r.width} ${r.height}`} aria-hidden="true"><defs><clipPath id="rug-texture-clip"><polygon points="556,104 1440,653 973,939 89,390"/></clipPath></defs><g transform={`matrix(${r.matrix})`}><image href={HOME_ART.rug[0].src} width="1536" height="1024" clipPath="url(#rug-texture-clip)"/></g></svg>}
type Drag={pointer:number;id:HomeId;offsetX:number;offsetY:number;startX:number;startY:number;moved:boolean;panAxis:'x'|'y'|null;candidate:HomeObject};
export default function Room({state,onSave,onSleep,onSkills,onServices}:{state:GameState;onServices:()=>void;onSkills:()=>void;onSleep:()=>void;onSave:(items:HomeObject[])=>GameResult}){
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState<HomeObject[]>([]),[selected,setSelected]=useState<HomeId>('bed'),[message,setMessage]=useState(''),[preview,setPreview]=useState<HomeObject|null>(null);
 const scene=useRef<HTMLDivElement>(null),drag=useRef<Drag|null>(null),blockShelfClick=useRef(0);
 const items=editing?draft:homeOf(state).items,current=items.find(i=>i.id===selected);
 const previewItems=preview?draft.map(i=>i.id===preview.id?preview:i):draft;
 const previewError=preview?homeError(previewItems):null;
 function update(id:HomeId,p:Partial<HomeObject>){const next=draft.map(i=>i.id===id?{...i,...p}:p.placed===false&&i.parentId===id?{...i,placed:false}:i);const error=homeError(next);if(error){setMessage(error);return}setDraft(next);setMessage('')}
 function point(clientX:number,clientY:number){const r=scene.current!.getBoundingClientRect();return floorCell((clientX-r.left)/r.width*100,(clientY-r.top)/r.height*100)}
 function begin(e:PointerEvent<HTMLButtonElement>,item:HomeObject,fromShelf=false){
  if(!editing||!e.isPrimary||e.button!==0||drag.current)return;if(!fromShelf&&(item.mount==='wall'||item.mount==='surface')){setSelected(item.id);return;}if(fromShelf)blockShelfClick.current=0;
  const pending=fromShelf&&e.pointerType==='touch',p=point(e.clientX,e.clientY),{w,h}=homeSize(item);
  drag.current={pointer:e.pointerId,id:item.id,offsetX:item.placed&&!fromShelf?p.x-item.x:w/2,offsetY:item.placed&&!fromShelf?p.y-item.y:h/2,startX:e.clientX,startY:e.clientY,moved:false,panAxis:pending?(getComputedStyle(e.currentTarget.parentElement!).display==='flex'?'x':'y'):null,candidate:item.mount==='surface'?{...item,mount:'floor',parentId:undefined}:item};
  if(!pending){e.preventDefault();setSelected(item.id);setMessage('');e.currentTarget.setPointerCapture(e.pointerId)}
 }
 function move(e:PointerEvent<HTMLButtonElement>){
  const d=drag.current;if(!d||d.pointer!==e.pointerId)return;
  const dx=e.clientX-d.startX,dy=e.clientY-d.startY;
  if(d.panAxis){if(Math.hypot(dx,dy)<10)return;const pan=d.panAxis==='x'?Math.abs(dx):Math.abs(dy),cross=d.panAxis==='x'?Math.abs(dy):Math.abs(dx);if(pan>=cross){drag.current=null;blockShelfClick.current=Date.now()+450;return}d.panAxis=null;setSelected(d.id);setMessage('');e.currentTarget.setPointerCapture(e.pointerId)}
  if(!d.moved&&Math.hypot(dx,dy)<4)return;d.moved=true;const p=point(e.clientX,e.clientY);if(d.candidate.id==='painting'){d.candidate={...d.candidate,x:0,y:Math.max(7,Math.min(8,Math.round(p.y*2)/2)),mount:'wall',wall:'left',placed:true};setPreview(d.candidate);return}d.candidate={...d.candidate,x:Math.round((p.x-d.offsetX)*2)/2,y:Math.round((p.y-d.offsetY)*2)/2,placed:true};setPreview(d.candidate);
 }
 function finish(e:PointerEvent<HTMLButtonElement>,cancel=false){const d=drag.current;if(!d||d.pointer!==e.pointerId)return;if(!cancel&&d.moved){const r=scene.current!.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)setMessage('Thả đồ trên sàn phòng.');else update(d.id,d.candidate)}drag.current=null;setPreview(null);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}
 function keys(e:KeyboardEvent<HTMLButtonElement>,item:HomeObject){const delta:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!editing||!delta[e.key])return;e.preventDefault();setSelected(item.id);const [x,y]=delta[e.key];update(item.id,{x:item.x+x,y:item.y+y})}
 const handlers=(item:HomeObject,fromShelf=false)=>({onPointerDown:(e:PointerEvent<HTMLButtonElement>)=>begin(e,item,fromShelf),onPointerMove:move,onPointerUp:(e:PointerEvent<HTMLButtonElement>)=>finish(e),onPointerCancel:(e:PointerEvent<HTMLButtonElement>)=>finish(e,true),onLostPointerCapture:(e:PointerEvent<HTMLButtonElement>)=>{if(e.target===e.currentTarget&&drag.current?.pointer===e.pointerId&&!e.currentTarget.hasPointerCapture(e.pointerId)){drag.current=null;setPreview(null)}}});
 function rotate(){if(!current)return;const next=rotateHomeObject(current);if(homeError(draft.map(i=>i.id===current.id?next:i))){setMessage('Không đủ chỗ để xoay.');return}update(current.id,next)}
 function save(){const v=onSave(draft);setMessage(v.ok?'Đã lưu bố cục.':v.error);if(v.ok)setEditing(false)}
 function closeEditor(){drag.current=null;setPreview(null);setEditing(false);setMessage('')}
 return <div className="home-interior">
  <header className="home-tools"><strong>Nhà trọ</strong><button onClick={()=>{if(editing)closeEditor();else{setDraft(structuredClone(homeOf(state).items));setEditing(true);setMessage('')}}}><Icon name="grid"/>{editing?'Hủy':'Sắp xếp'}</button><button className="home-skills" aria-label="Bếp" title="Bếp và sinh hoạt" onClick={onServices}><Icon name="food"/></button><button className="home-skills" aria-label="Kỹ năng" title="Kỹ năng" onClick={onSkills}><Icon name="chart"/></button></header>
  <>
   <div className={`home-layout${editing?' editing':''}`}>{editing&&<aside className="home-inventory"><p className="home-hint">Kéo đồ để sắp xếp</p><div className="home-picker" aria-label="Nội thất đã sở hữu">{draft.map(i=><button key={i.id} aria-pressed={selected===i.id} {...handlers(i,true)} onClick={()=>{if(Date.now()>=blockShelfClick.current)setSelected(i.id)}}><HomeArt id={i.id} rotation={i.rotation}/><span>{HOME_ITEMS[i.id].name}{!i.placed?' Kho':''}</span></button>)}</div>{current&&!current.placed&&<div className="home-inventory-actions"><button aria-label="Lưu" title="Lưu bố cục" onClick={save}><Icon name="save"/></button></div>}{current&&<div className="home-mount-tools">{['lamp','plant'].includes(current.id)&&<><button onClick={()=>update(current.id,{mount:'floor',parentId:undefined,placed:false})}>Đặt sàn</button>{draft.filter(i=>i.placed&&['desk','table'].includes(i.id)).map(parent=><button key={parent.id} onClick={()=>update(current.id,{mount:'surface',parentId:parent.id,placed:true})}>Trên {HOME_ITEMS[parent.id].name.toLocaleLowerCase('vi')}</button>)}</>}{current.id==='painting'&&<><button onClick={()=>update(current.id,{mount:'wall',wall:'left',x:0,y:8,placed:true})}>Tường trái</button><button onClick={()=>update(current.id,{mount:'wall',wall:'right',x:1,y:0,placed:true})}>Tường sau</button><label>Vị trí<input aria-label="Vị trí tranh" type="range" min={current.wall==='right'?0:7} max={current.wall==='right'?2:8} step={.5} value={current.wall==='right'?current.x:current.y} onChange={e=>update(current.id,current.wall==='right'?{x:Number(e.target.value)}:{y:Number(e.target.value)})}/></label></>}</div>}</aside>}
   <div className="room-viewport"><div ref={scene} className={`room-world home-scene${editing?' is-editing':''}`}>
    <img draggable={false} src="/assets/static-scenes/rental-diamond.png" alt="Nhà trọ của bạn"/>
    {editing&&<svg className="home-floor" viewBox="0 0 100 100" aria-label="Sàn phòng"><path className="home-safe-edge" d={homeSafeEdgePath()} fillRule="evenodd"/><polygon className="home-safe-outline" points={floorPolygon(0,0,HOME_GRID,HOME_GRID)}/><g>{Array.from({length:HOME_GRID*HOME_GRID},(_,n)=>{const x=n%HOME_GRID,y=Math.floor(n/HOME_GRID);return <polygon key={n} points={floorPolygon(x,y)} className={blockedHomeCell(x,y)?'blocked':''} onClick={()=>{if(current&&!current.placed)update(current.id,{x,y,placed:true})}}/>})}</g>{(preview??(current?.placed?current:null))&&(()=>{const target=preview??current!;return <polygon points={floorPolygon(target.x,target.y,homeSize(target).w,homeSize(target).h)} className={previewError?'placement invalid':'placement'}/>})()}</svg>}
    {[...(editing?previewItems:items)].filter(i=>i.placed).map(i=>{const {w,h}=homeSize(i),p=homeAnchor(i,editing?previewItems:items),ground=HOME_GROUND[i.id][i.rotation?1:0];return <button type="button" key={i.id} {...(editing?handlers(i):{})} onKeyDown={e=>keys(e,i)} onClick={()=>{if(editing)setSelected(i.id);else if(i.id==='bed')onSleep()}} aria-label={editing?`Di chuyển ${HOME_ITEMS[i.id].name}`:HOME_ITEMS[i.id].name} aria-pressed={editing?selected===i.id:undefined} className={`home-object${editing&&selected===i.id?' selected':''}${preview?.id===i.id?' dragging':''}`} style={i.mount==='wall'?{left:p.x+'%',top:p.y+'%',width:(2*HOME_OUTER_FLOOR.stepX)+'%',transform:'translate(-50%,-100%)',zIndex:2}:i.id==='rug'?{left:rugView(i).left+'%',top:rugView(i).top+'%',width:rugView(i).width+'%',height:rugView(i).height+'%',transform:'none',zIndex:2}:{left:p.x+'%',top:p.y+'%',width:(((w+h)*HOME_FLOOR.stepX)*ground.scale*homeArtFit(i.id,w,h))+'%',transform:`translate(${-ground.x}%,${-ground.y}%)`,zIndex:i.mount==='surface'?(()=>{const parent=items.find(o=>o.id===i.parentId);if(!parent)return 200;const size=homeSize(parent);return Math.round((parent.x+size.w+parent.y+size.h)*10)+4})():Math.round((i.x+w+i.y+h)*10)+3}}>{i.id==='rug'?<RugArt item={i}/>:<HomeArt id={i.id} rotation={i.rotation} wall={i.wall} projected/>}{editing&&selected===i.id&&<span className="home-label">{!editing&&i.id==='bed'?'Đi ngủ':HOME_ITEMS[i.id].name}</span>}</button>})}
    {!editing&&items.some(i=>i.id==='bed'&&i.placed)&&(()=>{const bed=items.find(i=>i.id==='bed')!,p=homeAnchor(bed,items);return <button className="home-sleep-action" style={{left:p.x+'%',top:(p.y-2)+'%'}} aria-label="Đi ngủ" title="Đi ngủ" onClick={onSleep}><Icon name="moon"/></button>})()}
    <button className="home-kitchen-hotspot" aria-label="Bếp nấu" title="Bếp nấu" onClick={onServices}><Icon name="food"/></button>
    <div className="home-walls" aria-hidden="true"><div className="home-wall home-wall-bath"/></div>
    {editing&&current&&current.placed&&!preview&&(()=>{const {w,h}=homeSize(current),p=floorPoint(current.x+w/2,current.y+h/2);return <div className="home-object-actions" role="toolbar" aria-label={'Thao tác '+HOME_ITEMS[current.id].name} style={{left:Math.max(19,Math.min(81,p.x))+'%',top:Math.min(85,p.y+8)+'%'}}><button disabled={current.mount==='wall'||current.mount==='surface'||['lamp','plant'].includes(current.id)} aria-label="Xoay 90°" title="Xoay 90°" onClick={rotate}><Icon name="rotate"/></button><button disabled={selected==='bed'} aria-label="Cất vào kho" title="Cất vào kho" onClick={()=>update(selected,{placed:false})}><Icon name="box"/></button><button className="home-confirm" aria-label="Lưu" title="Lưu bố cục" onClick={save}><Icon name="save"/></button></div>})()}
   </div></div></div>
  </>
  <p className="home-message" role="status" hidden={!(previewError??message)}>{previewError??message}</p>
 </div>
}








