import type {GameResult,GameState} from './types';
import {activeLease,COMPANIES,officeOf,SIZES,type OfficeSize,type DecorId} from './office';
import {clockOf,spendTime} from './time';
export type LayoutScope='employee'|'owner';
export type FurnitureKind='desk'|'chair'|'printer'|DecorId;
export interface OfficeFurniture {id:string;kind:FurnitureKind;x:number;y:number;rotation:0|90|180|270;placed:boolean}
export interface OfficeRoomLayout {size:OfficeSize;companyId:string|null;items:OfficeFurniture[]}
export interface OfficeLayout {version:1;employee:OfficeRoomLayout|null;owner:OfficeRoomLayout|null}
export const ROOM_GRIDS={small:{columns:12,rows:12},medium:{columns:16,rows:14},large:{columns:20,rows:16}} as const;
export const FURNITURE_NAMES:Record<FurnitureKind,string>={desk:'Bàn máy tính',chair:'Ghế',printer:'Máy in',plant:'Chậu cây',lamp:'Đèn bàn',coffee:'Góc cà phê'};
export const layoutScope=(s:GameState):LayoutScope|null=>officeOf(s).role==='visitor'?null:officeOf(s).role as LayoutScope;
export function footprint(item:OfficeFurniture){const w=item.kind==='desk'||item.kind==='coffee'?2:1;return item.rotation%180?{w:1,h:w}:{w,h:1}}
export function canMove(item:OfficeFurniture,scope:LayoutScope){return scope==='owner'||item.id==='desk-0'||item.id==='chair-0'||['plant','lamp'].includes(item.kind)}
function inventory(s:GameState,scope:LayoutScope,size:OfficeSize):OfficeFurniture[]{
 const o=officeOf(s),columns=size==='small'?3:size==='medium'?4:6,items:OfficeFurniture[]=[];
 for(let i=0;i<SIZES[size].seats;i++){const x=1+(i%columns)*3,y=1+Math.floor(i/columns)*3;items.push({id:`desk-${i}`,kind:'desk',x,y,rotation:0,placed:true},{id:`chair-${i}`,kind:'chair',x,y:y+1,rotation:0,placed:true})}
 if(scope==='owner'&&o.printer>0)items.push({id:'printer',kind:'printer',x:0,y:0,rotation:0,placed:false});
 for(const id of ['plant','lamp','coffee'] as const)if(Object.hasOwn(scope==='employee'?o.employeeDecor:o.ownerDecor,id))items.push({id,kind:id,x:0,y:0,rotation:0,placed:false});
 return items;
}
function context(s:GameState,scope:LayoutScope){const o=officeOf(s),company=COMPANIES.find(c=>c.id===o.employerId);return{size:scope==='employee'?company?.size??'small':o.size,companyId:scope==='employee'?o.employerId:null}}
export function getOfficeLayout(s:GameState):OfficeLayout{
 const saved=s.officeLayout,scope=layoutScope(s),result:OfficeLayout=saved?structuredClone(saved):{version:1,employee:null,owner:null};if(!scope)return result;
 const c=context(s,scope),old=result[scope],same=old?.size===c.size&&old.companyId===c.companyId;
 result[scope]={...c,items:inventory(s,scope,c.size).map(item=>{
  if(same)return old.items.find(i=>i.id===item.id&&i.kind===item.kind)??item;
  const grid=ROOM_GRIDS[c.size];if(item.kind==='printer')return{...item,x:grid.columns-2,y:grid.rows-3,placed:true};
  if(['plant','lamp','coffee'].includes(item.kind)){const decor=scope==='employee'?officeOf(s).employeeDecor:officeOf(s).ownerDecor,slot=decor[item.kind as DecorId];if(typeof slot==='number')return{...item,x:slot*3,y:grid.rows-4,placed:true}}
  return item;
 })};return result;
}
function keys(value:object,allowed:string[]){return Object.keys(value).every(k=>allowed.includes(k))}
/** Returns the first blocked placement, including the two-cell doorway apron. */
export function placementError(room:OfficeRoomLayout):string|null{
 const {columns,rows}=ROOM_GRIDS[room.size],occupied=new Set<string>(),door=Math.floor(columns/2)-1;
 for(const item of room.items){if(!item.placed)continue;const {w,h}=footprint(item);if(item.x<0||item.y<0||item.x+w>columns||item.y+h>rows)return 'Đồ nằm ngoài phòng.';
  for(let x=item.x;x<item.x+w;x++)for(let y=item.y;y<item.y+h;y++){if(x>=door&&x<=door+1&&y>=rows-2)return 'Cần chừa lối cửa.';const key=`${x},${y}`;if(occupied.has(key))return 'Vị trí đang có đồ.';occupied.add(key)}
 }return null;
}
function validRoom(v:unknown):v is OfficeRoomLayout{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const room=v as OfficeRoomLayout;if(!keys(room,['size','companyId','items'])||!Object.hasOwn(ROOM_GRIDS,room.size)||(room.companyId!==null&&!COMPANIES.some(c=>c.id===room.companyId&&c.size===room.size))||!Array.isArray(room.items)||room.items.length>52)return false;
 const ids=new Set<string>();for(const item of room.items){if(!item||typeof item!=='object'||!keys(item,['id','kind','x','y','rotation','placed'])||typeof item.id!=='string'||ids.has(item.id)||!Object.hasOwn(FURNITURE_NAMES,item.kind)||!Number.isInteger(item.x)||!Number.isInteger(item.y)||item.x<0||item.y<0||item.x>=ROOM_GRIDS[room.size].columns||item.y>=ROOM_GRIDS[room.size].rows||![0,90,180,270].includes(item.rotation)||typeof item.placed!=='boolean')return false;ids.add(item.id);
 const index=Number(item.id.split('-')[1]);if(item.kind==='desk'||item.kind==='chair'){if(!Number.isInteger(index)||index<0||index>=SIZES[room.size].seats||item.id!==`${item.kind}-${index}`)return false}else if(item.id!==item.kind)return false;
 }return placementError(room)===null;
}
export function validateLayout(value:unknown,state?:GameState):value is OfficeLayout{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;const l=value as OfficeLayout;if(!keys(l,['version','employee','owner'])||l.version!==1||!['employee','owner'].every(scope=>Object.hasOwn(l,scope)))return false;
 for(const scope of ['employee','owner'] as const){const room=l[scope];if(room===null)continue;if(!validRoom(room)||scope==='owner'&&room.companyId!==null||scope==='employee'&&room.companyId===null)return false;
 if(state){const expected=inventory(state,scope,room.size);for(const item of room.items){const owned=expected.find(i=>i.id===item.id&&i.kind===item.kind);if(!owned||!canMove(item,scope)&&JSON.stringify(item)!==JSON.stringify(owned))return false}}
 }return true;
}
export function saveOfficeLayout(state:GameState,layout:OfficeLayout):GameResult{
 if(officeOf(state).role==='employee')return{ok:false,error:'Không thay đổi bố trí văn phòng công ty.'};
 const scope=layoutScope(state);if(!scope)return{ok:false,error:'Bạn chưa có văn phòng.'};if(scope==='owner'&&!activeLease(state))return{ok:false,error:'Hãy gia hạn hợp đồng.'};if(clockOf(state).location!=='office'||state.fishing?.atLake)return{ok:false,error:'Hãy đến văn phòng.'};
 if(!validateLayout(layout,state))return{ok:false,error:'Bố trí không hợp lệ.'};const before=getOfficeLayout(state),other=scope==='owner'?'employee':'owner';if(JSON.stringify(layout[other])!==JSON.stringify(before[other]))return{ok:false,error:'Không thể sửa phòng của vai trò khác.'};
 const next=layout[scope],base=before[scope]!;if(!next||next.size!==base.size||next.companyId!==base.companyId||next.items.length!==base.items.length||!base.items.every(i=>next.items.some(n=>n.id===i.id&&n.kind===i.kind)))return{ok:false,error:'Danh sách đồ không hợp lệ.'};
 const signature=(room:OfficeRoomLayout)=>JSON.stringify([...room.items].sort((a,b)=>a.id.localeCompare(b.id)));if(signature(next)===signature(base))return{ok:true,state};
 const time=spendTime(state,5);if(!time.ok)return time;return{ok:true,state:{...time.state,officeLayout:structuredClone(layout)}};
}
