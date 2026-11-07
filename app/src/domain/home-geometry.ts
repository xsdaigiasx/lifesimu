import {HOME_ITEMS,HOME_GRID,LEGACY_SIZE,homeBlocked,wallAt,wallError,wallSlots,onWall, type HomeObject,type WallSlot} from './home';

// Toạ độ phần trăm trên ảnh phòng trọ lô 6 (#89): room-master-storybook.webp 1448×1086, góc 2:1, ô 128×64 px, gốc sàn (724, 350).
// Cùng hình chiếu với nội thất lô 5 nên đặt sprite thẳng theo điểm neo, không cần nắn ảnh.
const GRID_RATIO=10/HOME_GRID;
export const ROOM_IMAGE={src:'/assets/room-master-storybook.webp',w:1448,h:1086};
export const HOME_OUTER_FLOOR={originX:724/ROOM_IMAGE.w*100,originY:350/ROOM_IMAGE.h*100,stepX:64/ROOM_IMAGE.w*100,stepY:32/ROOM_IMAGE.h*100};
export const HOME_SAFE_MARGIN=0;
const innerScale=(HOME_GRID-2*HOME_SAFE_MARGIN)/HOME_GRID;
export const HOME_FLOOR={...HOME_OUTER_FLOOR,originY:HOME_OUTER_FLOOR.originY+2*HOME_SAFE_MARGIN*HOME_OUTER_FLOOR.stepY,stepX:HOME_OUTER_FLOOR.stepX*innerScale,stepY:HOME_OUTER_FLOOR.stepY*innerScale};
export function outerFloorPoint(x:number,y:number){const f=HOME_OUTER_FLOOR;return {x:f.originX+f.stepX*(x-y),y:f.originY+f.stepY*(x+y)}}
export function homeSafeEdgePath(){const path=(points:{x:number;y:number}[])=>'M'+points.map(p=>p.x+','+p.y).join('L')+'Z';return path([[0,0],[HOME_GRID,0],[HOME_GRID,HOME_GRID],[0,HOME_GRID]].map(([x,y])=>outerFloorPoint(x,y)))+path([[0,0],[HOME_GRID,0],[HOME_GRID,HOME_GRID],[0,HOME_GRID]].map(([x,y])=>floorPoint(x,y)))}
export function floorPoint(x:number,y:number){const f=HOME_FLOOR;return {x:f.originX+f.stepX*(x-y),y:f.originY+f.stepY*(x+y)}}
export function floorCell(x:number,y:number){const f=HOME_FLOOR,dx=(x-f.originX)/f.stepX,dy=(y-f.originY)/f.stepY;return {x:(dx+dy)/2,y:(dy-dx)/2}}
export function homeSize(item:HomeObject){const t=HOME_ITEMS[item.id];return {w:item.rotation%180?t.h:t.w,h:item.rotation%180?t.w:t.h}}
export function floorPolygon(x:number,y:number,w=1,h=1){return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([a,b])=>{const p=floorPoint(a,b);return `${p.x},${p.y}`}).join(' ')}
export const blockedHomeCell=homeBlocked;

// Match each raster camera to the room axes, preserving upright vertical edges.
export function alignHomeAxes(rightSlope:number,leftSlope:number){
 const scaleY=(2*HOME_FLOOR.stepY/HOME_FLOOR.stepX)/(rightSlope+leftSlope);
 return {shearY:HOME_FLOOR.stepY/HOME_FLOOR.stepX-scaleY*rightSlope,scaleY};
}

export function homeAnchor(item:HomeObject,items:HomeObject[]){const {w,h}=homeSize(item);if(item.mount==='wall')return wallPoint(item.wall??'left',wallAt(item),HOME_ITEMS[item.id].w);
 if(item.mount==='surface'){const parent=items.find(i=>(i.uid??i.id)===item.parentId);if(parent){const size=homeSize(parent),p=floorPoint(parent.x+size.w*(item.id==='lamp'?.27:.73),parent.y+size.h*.5);return {...p,y:p.y-7}}}return floorPoint(item.x+w/2,item.y+h/2)}

// Ảnh đồ vật vẽ cho ô lưới 10×10 cũ: giữ nguyên kích thước hiển thị khi ô to ra thành 1/8 sàn.
export function homeArtFit(id:keyof typeof HOME_ITEMS,w:number,h:number){const base=LEGACY_SIZE[id]??HOME_ITEMS[id];return (base.w+base.h)/((w+h)*GRID_RATIO)}
/** Việc 5: ô đặt đồ khi kéo = ô dưới ngón tay trừ độ lệch lúc bắt đầu kéo (không lấy mép ảnh), làm tròn về ô nguyên. */
export const dragCell=(pointer:{x:number;y:number},offset:{x:number;y:number})=>({x:Math.round(pointer.x-offset.x),y:Math.round(pointer.y-offset.y)});

/** Việc 7: độ cao treo cố định (chủ dự án chốt 06/11): tâm khung cách sàn WALL_HANG px trên ảnh phòng, ngang tâm cửa sổ. */
export const WALL_HANG=118;
const lift=(px:number)=>px/ROOM_IMAGE.h*100;
const wallFloor=(wall:'left'|'right',t:number)=>wall==='right'?outerFloorPoint(t,0):outerFloorPoint(0,t);
/** Tâm đồ treo trên ảnh phòng (phần trăm). */
export function wallPoint(wall:'left'|'right',at:number,len=2){const p=wallFloor(wall,at+len/2);return {x:p.x,y:p.y-lift(WALL_HANG)}}
/** Khung sáng trên tường cho ô đang kéo tới (cao 128 px quanh tâm). */
export function wallPolygon(wall:'left'|'right',at:number,len=2){const a=wallFloor(wall,at),b=wallFloor(wall,at+len),lo=lift(WALL_HANG-64),hi=lift(WALL_HANG+64);return [[a.x,a.y-lo],[b.x,b.y-lo],[b.x,b.y-hi],[a.x,a.y-hi]].map(p=>p.join(',')).join(' ')}
/** Ô tường trống gần điểm chạm nhất (toạ độ phần trăm trên ảnh phòng); không còn ô trống thì null. */
export function nearestWallSlot(item:HomeObject,items:HomeObject[],pt:{x:number;y:number}):WallSlot|null{
 const len=HOME_ITEMS[item.id].w;let best:WallSlot|null=null,bestD=Infinity;
 for(const s of wallSlots(item.id)){if(wallError(onWall(item,s),items))continue;const c=wallPoint(s.wall,s.at,len),d=((c.x-pt.x)*ROOM_IMAGE.w)**2+((c.y-pt.y)*ROOM_IMAGE.h)**2;if(d<bestD){bestD=d;best=s}}
 return best}
