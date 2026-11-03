import {useLayoutEffect,useRef,useState,type PointerEvent} from 'react';
import type {Place,PlaceId} from '../domain/types';
import {cityCache,cityAssets} from '../map/cache';
import {criticalCityAssets} from '../map/city-layout';
import {adjacentTiles,cameraForPoint,mapBearing,WORLD} from '../map/geometry';
import {pinchStart,pinchCamera,type Point} from '../map/gestures';
import Icon from './Icon';
interface Props {places:Place[];currentLocation:PlaceId;playerName:string;gender:'male'|'female';selected:PlaceId;onSelect:(id:PlaceId)=>void;centerToken:number;retryToken:number;onInitialReady:()=>void;onInitialPending:()=>void;onProgress:(loaded:number,total:number)=>void;onInitialError:(message:string)=>void}
export default function CityMap(props:Props){
 const {places,currentLocation,playerName,gender,selected,onSelect,centerToken,retryToken}=props;
 const viewport=useRef<HTMLDivElement>(null),world=useRef<HTMLDivElement>(null);
 const frame=useRef(0),zoom=useRef(1),[scale,setScale]=useState(1),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[,rerender]=useState(0),[surfaceRevision,setSurfaceRevision]=useState(0);
 const painted=useRef(new Set<string>()),surfaceErrors=useRef(new Set<string>()),callbacks=useRef(props),requestRefresh=useRef(()=>{});callbacks.current=props;
 const model=useRef<HTMLDivElement>(null),pinchFrame=useRef(0),pinchNext=useRef<{zoom:number;left:number;top:number}|null>(null),pointers=useRef(new Map<number,Point>()),drag=useRef<{point:Point;left:number;top:number}|null>(null),pinch=useRef<ReturnType<typeof pinchStart>|null>(null),suppressClick=useRef(0);
 const rect=()=>{const v=viewport.current!;return{left:v.scrollLeft/zoom.current,top:v.scrollTop/zoom.current,width:v.clientWidth/zoom.current,height:v.clientHeight/zoom.current}};
 const center=(id:PlaceId)=>{const v=viewport.current,p=places.find(p=>p.id===id);if(!v||!p)return;const pos=cameraForPoint(p.x*WORLD.width/100,p.y*WORLD.height/100+48,v.clientWidth/zoom.current,v.clientHeight/zoom.current);v.scrollTo({left:pos.left*zoom.current,top:pos.top*zoom.current});requestRefresh.current()};
 const markPainted=(image:HTMLImageElement,id:string)=>{image.decode().then(()=>{if(!image.isConnected)return;painted.current.add(id);surfaceErrors.current.delete(id);requestRefresh.current()}).catch(()=>{surfaceErrors.current.add(id);requestRefresh.current()})};
 useLayoutEffect(()=>{const v=viewport.current;if(!v)return;let stopped=false,scheduled=false,lastReady:boolean|undefined,lastProgress='';center(currentLocation);
 const refresh=()=>{scheduled=false;if(stopped)return;rerender(n=>n+1);
 const critical=criticalCityAssets(rect()),hasSize=v.clientWidth>0&&v.clientHeight>0;
 if(hasSize)cityCache.ensure(critical,100).catch(()=>{});
 const failed=critical.find(a=>cityCache.status(a.id)==='error'||surfaceErrors.current.has(a.id));
 const message=failed?(cityCache.error(failed.id)?.message??'Chưa hiển thị được khu vực bản đồ. Hãy thử tải lại.'):null;
 const loaded=critical.filter(a=>painted.current.has(a.id)&&cityCache.status(a.id)==='ready').length;
 const ready=hasSize&&critical.length>0&&loaded===critical.length&&!failed;
 setLoading(!ready);setError(message);const progress=`${loaded}/${critical.length}`;
 if(progress!==lastProgress){lastProgress=progress;callbacks.current.onProgress(loaded,critical.length)}
 if(message)callbacks.current.onInitialError(message);
 if(ready)cityCache.ensure(adjacentTiles(cityAssets,critical),1).catch(()=>{});
 if(ready!==lastReady){lastReady=ready;if(ready)callbacks.current.onInitialReady();else callbacks.current.onInitialPending()}
 };
 const schedule=()=>{if(!scheduled&&!stopped){scheduled=true;frame.current=requestAnimationFrame(refresh)}};requestRefresh.current=schedule;
 let wasSized=v.clientWidth>0&&v.clientHeight>0;const unsubscribe=cityCache.subscribe(schedule),observer=new ResizeObserver(()=>{const sized=v.clientWidth>0&&v.clientHeight>0;if(sized&&!wasSized)center(callbacks.current.currentLocation);wasSized=sized;schedule()});observer.observe(v);v.addEventListener('scroll',schedule,{passive:true});refresh();
 return()=>{stopped=true;cancelAnimationFrame(frame.current);cancelAnimationFrame(pinchFrame.current);observer.disconnect();unsubscribe();v.removeEventListener('scroll',schedule);requestRefresh.current=()=>{}};
 },[]);
 useLayoutEffect(()=>{center(currentLocation)},[centerToken,currentLocation]);
 useLayoutEffect(()=>{if(retryToken){surfaceErrors.current.clear();painted.current.clear();cityCache.retry(criticalCityAssets(rect())).catch(()=>{});requestRefresh.current()}},[retryToken]);
 const point=(e:PointerEvent<HTMLDivElement>):Point=>{const box=e.currentTarget.getBoundingClientRect();return{x:e.clientX-box.left,y:e.clientY-box.top}};
 const applyPinch=()=>{pinchFrame.current=0;const n=pinchNext.current,v=viewport.current;if(!n||!v)return;pinchNext.current=null;zoom.current=n.zoom;if(world.current){world.current.style.width=`${WORLD.width*n.zoom}px`;world.current.style.height=`${WORLD.height*n.zoom}px`}if(model.current)model.current.style.transform=`scale(${n.zoom})`;v.scrollLeft=n.left;v.scrollTop=n.top;setScale(n.zoom)};
 const rebase=()=>{const v=viewport.current!,values=[...pointers.current.values()];pinch.current=values.length>=2?pinchStart(values[0]!,values[1]!,zoom.current,v.scrollLeft,v.scrollTop):null;drag.current=values.length===1?{point:values[0]!,left:v.scrollLeft,top:v.scrollTop}:null;};
 const finish=(e:PointerEvent<HTMLDivElement>)=>{pointers.current.delete(e.pointerId);if(pinchFrame.current){cancelAnimationFrame(pinchFrame.current);applyPinch()}rebase();};
 const location=places.find(p=>p.id===currentLocation),v=viewport.current;
 const projected=location&&v&&v.clientWidth>0&&v.clientHeight>0?{x:location.x*WORLD.width/100*scale-v.scrollLeft,y:location.y*WORLD.height/100*scale-v.scrollTop+48}:null;
 const inset={left:48,right:Math.max(48,(v?.clientWidth??0)-48),top:118,bottom:Math.max(118,(v?.clientHeight??0)-110)};
 const player=projected?{x:Math.max(inset.left,Math.min(inset.right,projected.x)),y:Math.max(inset.top,Math.min(inset.bottom,projected.y)),edge:projected.x<inset.left||projected.x>inset.right||projected.y<inset.top||projected.y>inset.bottom}:null;
 const destination=places.find(p=>p.id===selected);
 const bearing=player&&projected&&player.edge?mapBearing(projected.x-player.x,projected.y-player.y):location&&destination&&selected!==currentLocation?mapBearing((destination.x-location.x)*WORLD.width,(destination.y-location.y)*WORLD.height):180;
 return <><div className="map-viewport" id="mapViewport" ref={viewport}
 onPointerDown={e=>{if(e.pointerType==='mouse'&&e.button!==0)return;pointers.current.set(e.pointerId,point(e));rebase();if(!(e.target as Element).closest('button'))e.currentTarget.setPointerCapture(e.pointerId);}}
 onPointerMove={e=>{if(!pointers.current.has(e.pointerId))return;const p=point(e);pointers.current.set(e.pointerId,p);const values=[...pointers.current.values()],v=e.currentTarget;
 if(values.length>=2&&pinch.current){const next=pinchCamera(pinch.current,values[0]!,values[1]!,Math.min(1.15,Math.max(.6,v.clientWidth/WORLD.width,v.clientHeight/WORLD.height)),1.15);pinchNext.current={zoom:next.zoom,left:next.left,top:next.top};if(!pinchFrame.current)pinchFrame.current=requestAnimationFrame(applyPinch);suppressClick.current=Date.now()+350;e.currentTarget.setPointerCapture(e.pointerId);}
 else if(drag.current){const dx=p.x-drag.current.point.x,dy=p.y-drag.current.point.y;if(Math.hypot(dx,dy)>6){suppressClick.current=Date.now()+350;e.currentTarget.setPointerCapture(e.pointerId);}v.scrollLeft=drag.current.left-dx;v.scrollTop=drag.current.top-dy;}requestRefresh.current();}}
 onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish} onClickCapture={e=>{if(Date.now()<suppressClick.current){e.preventDefault();e.stopPropagation();}}}>
 <div ref={world} className="city-world city-rebuilt" id="cityWorld" style={{width:WORLD.width*scale,height:WORLD.height*scale}}><div ref={model} className="city-model" style={{width:WORLD.width,height:WORLD.height,transform:`scale(${scale})`}}>{cityAssets.map(asset=>cityCache.status(asset.id)==='ready'?<img key={`${asset.id}-${retryToken}-${surfaceRevision}`} className="city-map-tile" src={asset.url} alt="" draggable={false} decoding="async" style={{left:asset.column*360,top:asset.row*240,width:360,height:240}} onLoad={e=>markPainted(e.currentTarget,asset.id)} onError={()=>{surfaceErrors.current.add(asset.id);requestRefresh.current()}}/>:null)}{places.map(p=><button key={p.id} type="button" className={`map-pin ${p.id==='home'?'home-pin':''} ${selected===p.id?'selected':''}`} data-place={p.id} data-name={p.name} aria-label={`Chọn ${p.name}`} aria-pressed={selected===p.id} style={{left:`${p.x}%`,top:`${p.y}%`}} onClick={()=>onSelect(p.id)}><span><Icon name={p.icon}/></span><span className="pin-pointer" aria-hidden="true"/></button>)}</div></div></div>
 {player&&<button type="button" className={`map-player ${player.edge?'is-at-edge':''}`} data-current-location={currentLocation} data-bearing={bearing} aria-label={`${playerName} đang ở ${location?.name??''}${player.edge?'. Về vị trí nhân vật':''}`} style={{left:player.x,top:player.y}} onClick={()=>center(currentLocation)}>
 <img className="standing-player-icon" src="/assets/player-bust.svg" alt="" draggable={false}/>
 <span className="map-player-direction" aria-hidden="true" style={{transform:`rotate(${bearing}deg)`}}/>
 </button>}
 {loading&&<div className="map-loading" role="status">{error?<><span>{error}</span><button onClick={()=>{surfaceErrors.current.clear();painted.current.clear();setSurfaceRevision(n=>n+1);cityCache.retry(criticalCityAssets(rect())).catch(()=>{});requestRefresh.current()}}>Thử lại</button></>:<><span className="loading-dot"/>Đang chuẩn bị khu phố…</>}</div>}</>;
}
