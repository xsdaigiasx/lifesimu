export interface Point {x:number;y:number}
export const MIN_ZOOM=.6, MAX_ZOOM=2;
export const clampZoom=(zoom:number)=>Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,zoom));
export const midpoint=(a:Point,b:Point):Point=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export function pinchStart(a:Point,b:Point,zoom:number,left:number,top:number){const mid=midpoint(a,b);return{distance:Math.max(1,distance(a,b)),zoom,world:{x:(left+mid.x)/zoom,y:(top+mid.y)/zoom}};}
export function pinchCamera(start:ReturnType<typeof pinchStart>,a:Point,b:Point,minZoom=MIN_ZOOM,maxZoom=MAX_ZOOM){const mid=midpoint(a,b),zoom=Math.min(maxZoom,Math.max(minZoom,clampZoom(start.zoom*distance(a,b)/start.distance)));return{zoom,left:start.world.x*zoom-mid.x,top:start.world.y*zoom-mid.y};}
export function paintedCoverage(ids:readonly string[],painted:ReadonlySet<string>,hasContext:boolean,width:number,height:number){const total=ids.length,loaded=ids.filter(id=>painted.has(id)).length;return{loaded,total,ready:hasContext&&width>0&&height>0&&total>0&&loaded===total};}
