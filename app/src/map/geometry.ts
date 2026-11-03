export interface Tile {id:string;row:number;column:number;url:string;width:number;height:number;box:number[];sha256:string}
export interface Rect {left:number;top:number;width:number;height:number}
export const WORLD={width:1440,height:960};
export function visibleTiles(tiles:readonly Tile[],rect:Rect):Tile[]{return tiles.filter(t=>{const x=t.column*360,y=t.row*240;return x<rect.left+rect.width&&x+360>rect.left&&y<rect.top+rect.height&&y+240>rect.top;});}
export function adjacentTiles(tiles:readonly Tile[],visible:readonly Tile[]):Tile[]{return tiles.filter(t=>visible.some(v=>Math.abs(v.row-t.row)<=1&&Math.abs(v.column-t.column)<=1)&&!visible.some(v=>v.id===t.id));}
export function cameraForPoint(x:number,y:number,width:number,height:number):{left:number;top:number}{const safeTop=96,safeBottom=Math.max(176,height-112);return{left:Math.max(0,Math.min(WORLD.width-width,x-width/2)),top:Math.max(0,Math.min(WORLD.height-height+70,y-(safeTop+safeBottom)/2))};}

// CSS rotation of a north-pointing triangle toward a map-space vector.
export function mapBearing(dx:number,dy:number){return dx===0&&dy===0?180:((Math.atan2(dy,dx)*180/Math.PI+90)%360+360)%360}
