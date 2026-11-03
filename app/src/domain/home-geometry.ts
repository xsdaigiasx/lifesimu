import {HOME_ITEMS,HOME_GRID,LEGACY_SIZE,homeBlocked, type HomeObject} from './home';

// Percent coordinates on the approved square room image. Shared by art, grid and input.
const GRID_RATIO=10/HOME_GRID;
export const HOME_OUTER_FLOOR={originX:50,originY:30.25,stepX:4.25*GRID_RATIO,stepY:2.875*GRID_RATIO};
export const HOME_SAFE_MARGIN=0.4;
const innerScale=(HOME_GRID-2*HOME_SAFE_MARGIN)/HOME_GRID;
export const HOME_FLOOR={...HOME_OUTER_FLOOR,originY:HOME_OUTER_FLOOR.originY+2*HOME_SAFE_MARGIN*HOME_OUTER_FLOOR.stepY,stepX:HOME_OUTER_FLOOR.stepX*innerScale,stepY:HOME_OUTER_FLOOR.stepY*innerScale};
export function outerFloorPoint(x:number,y:number){const f=HOME_OUTER_FLOOR;return {x:f.originX+f.stepX*(x-y),y:f.originY+f.stepY*(x+y)}}
export function homeSafeEdgePath(){const path=(points:{x:number;y:number}[])=>'M'+points.map(p=>p.x+','+p.y).join('L')+'Z';return path([[0,0],[HOME_GRID,0],[HOME_GRID,HOME_GRID],[0,HOME_GRID]].map(([x,y])=>outerFloorPoint(x,y)))+path([[0,0],[HOME_GRID,0],[HOME_GRID,HOME_GRID],[0,HOME_GRID]].map(([x,y])=>floorPoint(x,y)))}
export function floorPoint(x:number,y:number){const f=HOME_FLOOR;return {x:f.originX+f.stepX*(x-y),y:f.originY+f.stepY*(x+y)}}
export function floorCell(x:number,y:number){const f=HOME_FLOOR,dx=(x-f.originX)/f.stepX,dy=(y-f.originY)/f.stepY;return {x:(dx+dy)/2,y:(dy-dx)/2}}
export function homeSize(item:HomeObject){const t=HOME_ITEMS[item.id];return {w:item.rotation?t.h:t.w,h:item.rotation?t.w:t.h}}
export function floorPolygon(x:number,y:number,w=1,h=1){return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([a,b])=>{const p=floorPoint(a,b);return `${p.x},${p.y}`}).join(' ')}
export const blockedHomeCell=homeBlocked;

// Match each raster camera to the room axes, preserving upright vertical edges.
export function alignHomeAxes(rightSlope:number,leftSlope:number){
 const scaleY=(2*HOME_FLOOR.stepY/HOME_FLOOR.stepX)/(rightSlope+leftSlope);
 return {shearY:HOME_FLOOR.stepY/HOME_FLOOR.stepX-scaleY*rightSlope,scaleY};
}

export function homeAnchor(item:HomeObject,items:HomeObject[]){const {w,h}=homeSize(item);if(item.mount==='wall'){const p=item.wall==='right'?outerFloorPoint(item.x+1,0):outerFloorPoint(0,item.y+1);return {...p,y:p.y-12}}
 if(item.mount==='surface'){const parent=items.find(i=>i.id===item.parentId);if(parent){const size=homeSize(parent),p=floorPoint(parent.x+size.w*(item.id==='lamp'?.27:.73),parent.y+size.h*.5);return {...p,y:p.y-7}}}return floorPoint(item.x+w/2,item.y+h/2)}

// Ảnh đồ vật vẽ cho ô lưới 10×10 cũ: giữ nguyên kích thước hiển thị khi ô to ra thành 1/8 sàn.
export function homeArtFit(id:keyof typeof HOME_ITEMS,w:number,h:number){const base=LEGACY_SIZE[id]??HOME_ITEMS[id];return (base.w+base.h)/((w+h)*GRID_RATIO)}
