import Icon from './Icon';
import {TASKS,workOf} from '../domain/work';
import {parseProfile,PROFILE_KEY} from '../domain/profile';
import {useRef,useState,type PointerEvent} from 'react';
import type {GameState,GameResult} from '../domain/types';
import {officeOf,activeLease,SIZES} from '../domain/office';
import {canMove,footprint,FURNITURE_NAMES,getOfficeLayout,layoutScope,placementError,ROOM_GRIDS,type OfficeFurniture,type OfficeLayout} from '../domain/layout';
import {castById,coworkerId} from '../domain/npc';
interface Props{state:GameState;onSave:(layout:OfficeLayout)=>GameResult;onBack:()=>void}
function FurnitureArt({item,level}:{item:OfficeFurniture;level:number}){
 const {w,h}=footprint({...item,rotation:0});const transform=item.rotation===90?`translate(${h*30} 0) rotate(90)`:item.rotation===180?`translate(${w*30} ${h*30}) rotate(180)`:item.rotation===270?`translate(0 ${w*30}) rotate(270)`:undefined;return <g transform={transform}>
 {item.kind==='desk'?<><rect x="2" y="3" width={w*30-4} height="24" rx="4" fill="#c8a272" stroke="#805c43"/><rect x="15" y="5" width={level===3?30:24} height="12" rx="2" fill="#29464b"/><rect x="18" y="7" width={level===3?24:18} height="7" fill={level===1?'#88b2ac':'#9ad2d5'}/><path d="M21 21h20" stroke="#f5e8cd" strokeWidth="4"/></>:item.kind==='chair'?<><rect x="5" y="7" width="20" height="19" rx="7" fill="#668b80" stroke="#34574f"/><rect x="4" y="4" width="22" height="7" rx="3" fill="#8da494"/></>:item.kind==='plant'?<><circle cx="15" cy="17" r="9" fill="#ac7b55"/><path d="M15 21Q0 15 7 5Q16 2 15 18Q17 0 26 7Q29 18 15 21" fill="#5b8d5f"/></>:item.kind==='lamp'?<><ellipse cx="15" cy="24" rx="10" ry="3" fill="#696d5e"/><path d="M15 23V13L22 6" fill="none" stroke="#777a64" strokeWidth="3"/><path d="M10 4L22 3L27 12H12Z" fill="#e8c874"/></>:item.kind==='printer'?<><rect x="3" y="8" width="24" height="18" rx="3" fill="#697b7c"/><path d="M8 15V3H23V15" fill="#f1eedb"/><path d="M9 23H22" stroke="#d6dcca" strokeWidth="3"/></>:<><rect x="2" y="3" width="56" height="24" rx="3" fill="#b38c62"/><rect x="7" y="6" width="20" height="15" rx="2" fill="#485a5a"/><circle cx="17" cy="12" r="4" fill="#dbd9c4"/><path d="M35 11v9h10v-9M45 13h5v5h-5" fill="#f1e4c9" stroke="#786a54" strokeWidth="2"/></>}
 </g>;
}
export default function OfficeEditor({state,onSave,onBack}:Props){
 const [layout,setLayout]=useState<OfficeLayout>(()=>getOfficeLayout(state)),[selected,setSelected]=useState<string|null>(null),[message,setMessage]=useState(''),[confirm,setConfirm]=useState(false),[ghost,setGhost]=useState<{x:number;y:number}|null>(null);
 const svg=useRef<SVGSVGElement>(null),drag=useRef<{id:string;x:number;y:number;moved:boolean}|null>(null),scope=layoutScope(state),room=scope?layout[scope]:null,o=officeOf(state),editable=!!scope&&(scope!=='owner'||activeLease(state));
 if(!scope||!room)return <div className="work-office-editor"><p>Chưa có văn phòng.</p><button onClick={onBack}>Quay lại</button></div>;
 const grid=ROOM_GRIDS[room.size],item=room.items.find(i=>i.id===selected),movable=!!item&&editable&&canMove(item,scope),level=scope==='employee'?o.workComputer:o.computers,dirty=JSON.stringify(layout)!==JSON.stringify(getOfficeLayout(state));
 function update(id:string,patch:Partial<OfficeFurniture>){const current=layout[scope!];if(!current||!editable)return;const old=current.items.find(i=>i.id===id);if(!old||!canMove(old,scope!))return;const next={...current,items:current.items.map(i=>i.id===id?{...i,...patch}:i)};const error=placementError(next);if(error){setMessage(error);return}setLayout({...layout,[scope!]:next});setMessage('');setConfirm(false)}
 function point(e:PointerEvent<SVGSVGElement>){const matrix=svg.current?.getScreenCTM();if(!matrix)return null;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());return{x:Math.floor(p.x/30),y:Math.floor(p.y/30)}}
 function finish(e:PointerEvent<SVGSVGElement>){const pos=point(e),gesture=drag.current;drag.current=null;setGhost(null);if(!pos)return;if(gesture){if(gesture.moved)update(gesture.id,{...pos,placed:true})}else if(selected)update(selected,{...pos,placed:true})}
 function place(){if(!item)return;for(let y=0;y<grid.rows;y++)for(let x=0;x<grid.columns;x++){const candidate={...room!,items:room!.items.map(i=>i.id===item.id?{...i,x,y,placed:true}:i)};if(!placementError(candidate)){update(item.id,{x,y,placed:true});return}}setMessage('Không còn chỗ trống.')}
 return <div className="work-office-editor">
 <div className="wo-meta"><strong>{scope==='employee'?'Góc làm việc':'Bố trí văn phòng'}</strong><span>{SIZES[room.size].seats} chỗ</span></div>
 <div className="wo-board"><svg ref={svg} viewBox={`0 0 ${grid.columns*30} ${grid.rows*30}`} aria-label="Bố trí văn phòng. Chọn đồ rồi chạm ô trống để di chuyển." role="img"
 onPointerDown={e=>{if(e.button!==0)return;svg.current?.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const d=drag.current;if(d&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>6){d.moved=true;const p=point(e);if(p)setGhost(p)}}} onPointerUp={finish} onPointerCancel={()=>{drag.current=null;setGhost(null)}}>
 <defs><pattern id="wo-grid" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="#e5dcc3"/><path d="M30 0H0V30" fill="none" stroke="#d2c5a8" strokeWidth=".65"/></pattern></defs>
 <rect width={grid.columns*30} height={grid.rows*30} fill="url(#wo-grid)" stroke="#819686" strokeWidth="4"/>
 {[1,4,7].map(x=><rect key={x} x={x*30} y="0" width="58" height="5" fill="#88b8c0"/>)}
 <rect x={(Math.floor(grid.columns/2)-1)*30} y={(grid.rows-2)*30} width="60" height="60" fill="#f6eed5" stroke="#9aaf97" strokeDasharray="4 3"/><text x={grid.columns*15} y={grid.rows*30-9} textAnchor="middle" fontSize="10" fill="#627563">Cửa</text>
 {room.items.filter(i=>i.placed).map(i=>{const box=footprint(i),isSelected=i.id===selected;return <g key={i.id} transform={`translate(${i.x*30} ${i.y*30})`} opacity={!canMove(i,scope)?0.6:1} role="button" tabIndex={0} aria-label={`${FURNITURE_NAMES[i.kind]} ${i.id}${canMove(i,scope)?'':' cố định'}`} aria-pressed={isSelected} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(i.id)}if(isSelected&&canMove(i,scope)&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();update(i.id,{x:i.x+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0),y:i.y+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0)})}}} onPointerDown={e=>{if(e.button!==0)return;setSelected(i.id);setMessage('');drag.current={id:i.id,x:e.clientX,y:e.clientY,moved:false}}}>
 <rect width={box.w*30} height={box.h*30} fill={isSelected?'#fff3ad':'transparent'} stroke={isSelected?'#997140':'transparent'} strokeWidth="2"/><FurnitureArt item={i} level={scope==='employee'&&i.id!=='desk-0'?1:level}/></g>})}
 {ghost&&item&&<rect x={ghost.x*30} y={ghost.y*30} width={footprint(item).w*30} height={footprint(item).h*30} fill="#dcecb9" stroke="#426b51" strokeDasharray="3 2" opacity=".7" pointerEvents="none"/>}
 </svg></div>
 <div className="wo-selection"><strong>{item?FURNITURE_NAMES[item.kind]:'Chọn đồ'}</strong><span>{item&&!canMove(item,scope)?'Cố định':item?item.placed?'Đang đặt':'Trong kho':''}</span></div>
 <div className="wo-tools"><button disabled={!movable} onClick={()=>item&&update(item.id,{rotation:((item.rotation+90)%360) as OfficeFurniture['rotation']})}><Icon name="rotate"/>Xoay 90°</button><button disabled={!movable} onClick={()=>item&&(item.placed?update(item.id,{placed:false}):place())}><Icon name="box"/>{item?.placed?'Cất':'Đặt'}</button></div>
 {room.items.some(i=>!i.placed)&&<div className="wo-storage" aria-label="Đồ trong kho">{room.items.filter(i=>!i.placed).map(i=><button className={selected===i.id?'is-selected':''} key={i.id} onClick={()=>{setSelected(i.id);setMessage('')}}>{FURNITURE_NAMES[i.kind]}{i.id.startsWith('desk-')||i.id.startsWith('chair-')?' '+(Number(i.id.split('-')[1])+1):''}</button>)}</div>}
 {message&&<p className="wo-message" role="status">{message}</p>}
 {confirm?<div className="wo-confirm"><strong>Lưu bố trí 5 phút?</strong><div><button onClick={()=>setConfirm(false)}><Icon name="chevron-left"/>Quay lại</button><button onClick={()=>{const r=onSave(layout);if(r.ok)onBack();else{setMessage(r.error);setConfirm(false)}}}><Icon name="save"/>Xác nhận</button></div></div>:<footer className="wo-footer"><button onClick={onBack}><Icon name="close"/>Hủy</button><button disabled={!editable||!dirty} onClick={()=>setConfirm(true)}><Icon name="save"/>Lưu bố trí</button></footer>}
 </div>;
}


type IsoPoint=[number,number,number?];
const iso=(x:number,y:number,z=0)=>`${(x-y)*.84},${(x+y)*.42-z}`;
const polygon=(points:IsoPoint[])=>points.map(([x,y,z])=>iso(x,y,z)).join(' ');
/** Code-native furniture is projected from the same grid coordinates as the editor. */
function IsoFurniture({item,level}:{item:OfficeFurniture;level:number}){
 const base=footprint({...item,rotation:0});
 const point=(x:number,y:number,z=0):IsoPoint=>{let a=x,b=y;if(item.rotation===90){a=base.h*30-y;b=x}else if(item.rotation===180){a=base.w*30-x;b=base.h*30-y}else if(item.rotation===270){a=y;b=base.w*30-x}return[item.x*30+a,item.y*30+b,z]};
 const poly=(points:IsoPoint[])=>polygon(points.map(([x,y,z])=>point(x,y,z)));
 const box=(x:number,y:number,w:number,d:number,z:number,h:number,color:string,side='#99744e',front='#b48a59')=><g><polygon points={poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]])} fill={front} stroke="#675442" strokeWidth=".65"/><polygon points={poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]])} fill={side} stroke="#675442" strokeWidth=".65"/><polygon points={poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]])} fill={color} stroke="#675442" strokeWidth=".7"/></g>;
 const p=(x:number,y:number,z:number)=>{const [a,b,c]=point(x,y,z);return iso(a,b,c)};
 return <g>
 <polygon points={poly([[3,5,0],[base.w*30+6,5,0],[base.w*30+8,base.h*30+6,0],[3,base.h*30+5,0]])} fill="#5d493a" opacity=".15"/>
 {item.kind==='desk'?<>
 {[3,51].flatMap(x=>[4,21].map(y=><g key={`${x}-${y}`}>{box(x,y,3,3,0,20,'#bc9865','#806247','#9e784e')}</g>))}
 {box(1,2,58,26,20,3,'#d6b07a','#a77d4f','#b98d57')}
 {box(21,10,16,8,23,1,'#66736d','#485453','#63706a')}
 <polygon points={poly([[14,9,24],[level===3?47:42,9,24],[level===3?47:42,9,43],[14,9,43]])} fill="#354440" stroke="#25362f" strokeWidth="1.2"/>
 <polygon points={poly([[17,9,27],[level===3?44:39,9,27],[level===3?44:39,9,40],[17,9,40]])} fill={level===1?'#769b98':'#8fb6a6'}/>
 {level>1&&<path d={`M${p(20,8.9,36)}L${p(34,8.9,36)}M${p(20,8.9,32)}L${p(29,8.9,32)}`} stroke="#d5e0be" strokeWidth="1"/>}
 {box(18,19,24,6,23,.7,'#e8dec2','#aeaa94','#c3b99f')}
 {box(47,18,5,7,23,1,'#e8dec2','#aeaa94','#c3b99f')}
 </>:item.kind==='chair'?<>
 <path d={`M${p(15,15,11)}L${p(15,15,2)}M${p(5,8,1)}L${p(25,23,1)}M${p(4,23,1)}L${p(25,7,1)}`} stroke="#59604f" strokeWidth="2.7"/>
 {box(4,4,22,21,11,5,'#9aa176','#637852','#7e8c60')}{box(4,22,22,4,16,15,'#9aa176','#637852','#7e8c60')}
 </>:item.kind==='printer'?<>{box(3,4,24,22,0,13,'#c6c8af','#66766c','#859489')}{box(7,6,16,15,13,3,'#e8e5d2','#b3b7a4','#d0d1bc')}<polygon points={poly([[9,8,17],[22,8,17],[22,8,29],[9,8,29]])} fill="#faf0d9" stroke="#a7a68c" strokeWidth=".7"/></>:item.kind==='coffee'?<>{box(2,3,56,24,0,23,'#d5ae76','#8c6748','#af8355')}{box(5,5,21,16,23,17,'#5c6556','#364b43','#495d50')}{box(8,6,15,12,40,2,'#999e84','#5e6d59','#7d8a71')}{box(36,12,9,8,23,7,'#eee1be','#c4b48f','#dfcfaa')}</>:item.kind==='plant'?<>
 {box(7,7,17,17,0,13,'#bc8857','#98613e','#af754b')}
 <path d={`M${p(15,15,12)}L${p(15,15,35)}`} stroke="#697346" strokeWidth="2"/>
 {[[-8,-6,25],[6,-2,31],[-4,6,38],[7,7,22],[-7,4,19]].map(([dx,dy,z],i)=>{const [cx,cy]=p(15+dx!,15+dy!,z!).split(',').map(Number);return <ellipse key={i} cx={cx} cy={cy} rx="7" ry="3.8" transform={`rotate(${i%2?35:-35} ${cx} ${cy})`} fill={i%2?'#7e9352':'#617d47'} stroke="#50673e" strokeWidth=".5"/>})}
 </>:<>
 {box(7,8,17,14,0,2,'#6d7560','#525c4c','#616a52')}
 <path d={`M${p(15,15,2)}L${p(15,15,27)}L${p(21,15,34)}`} stroke="#696e53" strokeWidth="2"/>
 <polygon points={poly([[12,8,34],[26,8,34],[29,23,25],[9,23,25]])} fill="#e5c774" stroke="#9e8b50" strokeWidth=".7"/>
 </>}
 </g>;
}

/** Ghế 1–4 là đồng nghiệp theo chỗ ngồi; tên và giới lấy từ dàn NPC theo seed. */
const SEAT_LOOK=[{desk:'dev',shirt:'#6d8c9e',hair:'#343c37'},{desk:'design',shirt:'#bb8c79',hair:'#4e3e32'},{desk:'qa',shirt:'#899568',hair:'#2c3433'},{desk:'pm',shirt:'#aa91ad',hair:'#453c35'}] as const;
const colleaguesOf=(state:GameState)=>SEAT_LOOK.map(l=>{const n=castById(state,coworkerId(state.office?.employerId,l.desk));return{...l,id:n?.id??l.desk,name:n?.name??'',female:n?.gender==='female'}});
function IsoPerson({chair,seated,shirt,hair,female,primary}:{chair:OfficeFurniture;seated:boolean;shirt:string;hair:string;female:boolean;primary:boolean}){
 const local=(x:number,y:number,z=0):IsoPoint=>{let a=x,b=y;if(chair.rotation===90){a=30-y;b=x}else if(chair.rotation===180){a=30-x;b=30-y}else if(chair.rotation===270){a=y;b=30-x}return[chair.x*30+a+(seated?0:32),chair.y*30+b,z]};
 const p=(x:number,y:number,z:number)=>{const[a,b,c]=local(x,y,z);return iso(a,b,c)},poly=(v:IsoPoint[])=>polygon(v.map(([x,y,z])=>local(x,y,z)));
 const hip=seated?16:22,shoulder=hip+16,head=shoulder+10,[hx,hy]=p(15,13,head).split(',').map(Number),facing=chair.rotation===0||chair.rotation===90?-1:1;
 return <g>
 {!seated&&<ellipse cx={Number(p(15,15,0).split(',')[0])} cy={Number(p(15,15,0).split(',')[1])+1} rx="12" ry="4" fill="#52483c" opacity=".18"/>}
 <path d={`M${p(10,13,hip)}L${p(9,seated?1:13,3)}M${p(21,13,hip)}L${p(22,seated?1:13,3)}`} stroke="#3f505b" strokeWidth="5" strokeLinecap="round"/>
 <path d={`M${p(7,seated?-1:11,1)}L${p(13,seated?-1:11,1)}M${p(20,seated?-1:11,1)}L${p(26,seated?-1:11,1)}`} stroke="#38413d" strokeWidth="3.5" strokeLinecap="round"/>
 {female&&<ellipse cx={hx} cy={hy+4} rx="7" ry="10" fill={hair}/>}
 <polygon points={poly([[8,9,hip],[23,9,hip],[24,11,shoulder],[8,11,shoulder]])} fill={shirt} stroke="#5b6251" strokeWidth=".5"/>
 <polygon points={poly([[23,9,hip],[23,21,hip],[24,19,shoulder],[24,11,shoulder]])} fill={shirt} stroke="#5b6251" strokeWidth=".7"/>
 <polygon points={poly([[8,11,shoulder],[24,11,shoulder],[24,19,shoulder],[8,19,shoulder]])} fill={shirt}/>
 <path d={`M${p(9,12,shoulder-2)}L${p(5,7,shoulder-9)}L${p(7,seated?-3:6,seated?23:hip+1)}M${p(23,13,shoulder-2)}L${p(26,7,shoulder-8)}L${p(24,seated?-3:7,seated?23:hip+1)}`} fill="none" stroke={shirt} strokeWidth="4.3" strokeLinecap="round"/>
 {[7,24].map((x,i)=>{const [cx,cy]=p(x,seated?-3:i?7:6,seated?23:hip+1).split(',').map(Number);return <ellipse key={x} cx={cx} cy={cy} rx="2.3" ry="2" fill="#d7ac85"/>})}
 <path d={`M${p(15,13,shoulder)}L${p(15,13,head-4)}`} stroke="#d7ac85" strokeWidth="4"/>
 <ellipse cx={hx} cy={hy} rx="5.8" ry="6.6" fill="#e0b58f" stroke="#9d7a60" strokeWidth=".5"/>
 <path d={`M${hx!-5.8} ${hy!+.3}Q${hx!-8} ${hy!-9} ${hx!} ${hy!-8}Q${hx!+8} ${hy!-8} ${hx!+5.5} ${hy!+1}L${hx!+2} ${hy!-4}Q${hx!-3} ${hy!-1} ${hx!-5.8} ${hy!+.3}`} fill={hair}/>
 <circle cx={hx!+facing*2.5} cy={hy!+1} r=".65" fill="#4a4237"/><path d={`M${hx!+facing*3} ${hy!+3.8}h1.4`} stroke="#ad795a" strokeWidth=".7"/>
 {seated&&<><polygon points={poly([[4,22,17],[26,22,17],[26,22,29],[4,22,29]])} fill="#7e8c60" stroke="#566b4b" strokeWidth=".8"/><polygon points={poly([[4,22,29],[26,22,29],[26,26,29],[4,26,29]])} fill="#9aa176"/></>}
 {primary&&<g transform={`translate(${p(15,15,head+15)})`}><path d="M-4-4H4L0 2Z" fill="#e5bd5e" stroke="#806744" strokeWidth=".8"/></g>}
 </g>;
}

/** Cutaway room follows saved layout; editor retains its precise placement grid. */
export function OfficePreview({state,onDesk,onNpc}:{state:GameState;onDesk?:()=>void;onNpc?:(id:string)=>void}){
 const [highlight,setHighlight]=useState<string|null>(null),[profile]=useState(()=>{try{return parseProfile(localStorage.getItem(PROFILE_KEY))}catch{return null}}),scope=layoutScope(state),layout=getOfficeLayout(state),room=scope?layout[scope]:null;
 if(!room||!scope)return null;
 const COLLEAGUES=colleaguesOf(state);
 const grid=ROOM_GRIDS[room.size],o=officeOf(state),level=scope==='employee'?o.workComputer:o.computers,W=grid.columns*30,D=grid.rows*30,H=76,originX=D*.84+22,originY=H+15,vw=(W+D)*.84+44,vh=(W+D)*.42+H+38;
 const items=room.items.filter(i=>i.placed).sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.y-b.y),work=workOf(state),task=work.task,taskInfo=TASKS.find(t=>t.id===task?.id),desk=items.find(i=>i.id==='desk-0'),talkChair=items.find(i=>i.id==='chair-2');
 const activate=(i:OfficeFurniture)=>{if(i.id==='desk-0'||i.id==='chair-0'){onDesk?.();return}const n=i.kind==='chair'?COLLEAGUES[Number(i.id.split('-')[1])-1]:undefined;if(n){onNpc?.(n.id);return}setHighlight(highlight===i.id?null:i.id)};
 return <div className="office-plan work-office-preview"><svg viewBox={`0 0 ${vw} ${vh}`} role="group" aria-label={`Văn phòng ${SIZES[room.size].seats} chỗ, nhìn chéo từ trên xuống`}>
 <defs><linearGradient id="wo-wall-warm" x2="0" y2="1"><stop stopColor="#ecd5a9"/><stop offset="1" stopColor="#d1b48a"/></linearGradient><linearGradient id="wo-wall-shade" x2="0" y2="1"><stop stopColor="#d4c3a0"/><stop offset="1" stopColor="#b9a887"/></linearGradient></defs>
 <g transform={`translate(${originX} ${originY})`}>
 <polygon points={polygon([[0,0,-9],[W,0,-9],[W,D,-9],[0,D,-9]])} fill="#766953" stroke="#4f5c50" strokeWidth="3"/>
 <polygon points={polygon([[0,0],[W,0],[W,D],[0,D]])} fill="#bd955e"/>
 {Array.from({length:grid.rows},(_,y)=><g key={y}><polygon points={polygon([[0,y*30],[W,y*30],[W,(y+1)*30],[0,(y+1)*30]])} fill={y%2?'#cda16b':'#c19862'} stroke="#aa8253" strokeWidth=".55"/>{Array.from({length:Math.ceil(grid.columns/3)},(_,x)=>{const a=(x*3+(y%2?1.5:0))*30;return a<W?<path key={x} d={`M${iso(a,y*30)}L${iso(a,(y+1)*30)}`} stroke="#ab8154" strokeWidth=".55"/>:null})}</g>)}
 <polygon points={polygon([[0,0],[W,0],[W,0,H],[0,0,H]])} fill="url(#wo-wall-shade)" stroke="#746b55" strokeWidth="1.5"/>
 <polygon points={polygon([[0,0],[0,D],[0,D,H],[0,0,H]])} fill="url(#wo-wall-warm)" stroke="#746b55" strokeWidth="1.5"/>
 <path d={`M${iso(0,D,H)}L${iso(0,0,H)}L${iso(W,0,H)}`} fill="none" stroke="#53645b" strokeWidth="5"/>
 <path d={`M${iso(0,D,3)}L${iso(0,0,3)}L${iso(W,0,3)}`} fill="none" stroke="#9b7c54" strokeWidth="5"/>
 {Array.from({length:Math.max(2,Math.floor(grid.rows/4))},(_,n)=>{const y=25+n*95;return y+65<D?<g key={n}><polygon points={polygon([[0,y,26],[0,y+65,26],[0,y+65,63],[0,y,63]])} fill="#9fbcb0" stroke="#826749" strokeWidth="4"/><polygon points={polygon([[0,y+3,29],[0,y+30,29],[0,y+30,60],[0,y+3,60]])} fill="#c6d7be"/><path d={`M${iso(0,y+33,26)}L${iso(0,y+33,63)}`} stroke="#ede1bd" strokeWidth="2"/><polygon points={polygon([[0,y,0],[0,y+65,0],[90,y+110,0],[90,y+45,0]])} fill="#f4d991" opacity=".15"/></g>:null})}
 <polygon points={polygon([[W/2-30,D-45],[W/2+30,D-45],[W/2+30,D],[W/2-30,D]])} fill="#879473" opacity=".7"/>
 {items.map(i=>{const box=footprint(i),colleague=i.kind==='chair'?COLLEAGUES[Number(i.id.split('-')[1])-1]:undefined,primary=i.id==='chair-0',label=colleague?'Trò chuyện với '+colleague.name:primary||i.id==='desk-0'?'Bàn làm việc của bạn':FURNITURE_NAMES[i.kind];return <g key={i.id} role="button" tabIndex={0} aria-label={label} aria-pressed={highlight===i.id} onClick={()=>activate(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate(i)}}}>
 <title>{FURNITURE_NAMES[i.kind]}{scope==='employee'&&i.id==='desk-0'?' của bạn':''}</title>
 {highlight===i.id&&<polygon points={polygon([[i.x*30,i.y*30],[i.x*30+box.w*30,i.y*30],[i.x*30+box.w*30,i.y*30+box.h*30],[i.x*30,i.y*30+box.h*30]])} fill="#f7e99e" stroke="#f1d77f" strokeWidth="2"/>}
 <IsoFurniture item={i} level={scope==='employee'&&i.id!=='desk-0'?1:level}/>{(primary||colleague)&&<IsoPerson chair={i} seated={!primary||!!work.active} shirt={primary?'#597c91':colleague!.shirt} hair={primary?'#3d3930':colleague!.hair} female={primary?profile?.gender==='female':colleague!.female} primary={primary}/>}</g>})}
 <path d={`M${iso(0,D)}L${iso(W,D)}L${iso(W,0)}`} fill="none" stroke="#716749" strokeWidth="3"/>
 {talkChair&&<g transform={`translate(${iso(talkChair.x*30+20,talkChair.y*30+15,79)})`} pointerEvents="none"><path d="M-5 0H103Q108 0 108 5V21Q108 26 103 26H13L5 33L7 26H-5Q-10 26-10 21V5Q-10 0-5 0Z" fill="#fff8df" stroke="#b8a784" strokeWidth=".8"/><text x="49" y="16.5" textAnchor="middle" fill="#665d48" fontSize="9.5" fontFamily="system-ui,sans-serif">Trưa ăn gì nhỉ?</text></g>}
 {desk&&task&&taskInfo&&<g transform={`translate(${Math.max(-originX+8,Math.min(vw-originX-180,(desk.x*30-desk.y*30)*.84+25))} ${Math.max(-originY+8,(desk.x*30+desk.y*30)*.42-95)})`} role="button" tabIndex={0} aria-label={`Công việc: ${taskInfo.name}, ${Math.floor(task.elapsed/task.required*100)} phần trăm`} onClick={onDesk} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onDesk?.()}}}>
 <rect x="1" y="3" width="176" height="55" rx="7" fill="#524d3e" opacity=".15"/><rect width="176" height="55" rx="7" fill="#fff6dd" stroke="#b7a27c" strokeWidth=".8"/><circle cx="11" cy="12" r="3" fill={work.active?.paused?'#bf9a54':'#73975e'}/><text x="20" y="15" fontSize="9" fill="#697559" fontFamily="system-ui,sans-serif">{work.active?.paused?'Tạm nghỉ':work.active?'Đang làm việc':'Công việc đang dở'}</text><text x="9" y="29" fontSize="9.8" fill="#4b5547" fontFamily="system-ui,sans-serif">{taskInfo.name}</text><rect x="9" y="37" width="124" height="6" rx="3" fill="#e4ddc5"/><rect x="9" y="37" width={124*Math.min(1,task.elapsed/task.required)} height="6" rx="3" fill="#819b6a"/><text x="167" y="43" textAnchor="end" fontSize="8.5" fill="#70785c" fontFamily="system-ui,sans-serif">{Math.floor(task.elapsed/task.required*100)}%</text>
 </g>}

 </g></svg>{highlight&&<span className="wo-preview-label">{FURNITURE_NAMES[room.items.find(i=>i.id===highlight)?.kind??'desk']}</span>}</div>;
}
