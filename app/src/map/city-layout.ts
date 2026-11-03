import type {PlaceId} from '../domain/types';
import {visibleTiles,type Rect,type Tile} from './geometry';
import manifest from './manifest.json';
/** Destination anchors measured on the owner's full, continuous city illustration. */
export const LOTS=[
 {id:'home',x:470.6,y:215.6},{id:'office',x:1115.6,y:168.8},
 {id:'market',x:671.3,y:438.8},{id:'mall',x:204.4,y:390},
 {id:'bank',x:775.3,y:197.8},{id:'hospital',x:183.8,y:144.4},
 {id:'bus',x:190.3,y:649.7},{id:'park',x:1032.2,y:468.8},
 {id:'streetfood',x:506.3,y:785.6},{id:'restaurant',x:964.7,y:780.9},
 {id:'apartments',x:1143.8,y:300},{id:'villa',x:1260,y:686.3}
];
export const pinPosition=(id:PlaceId)=>{const lot=LOTS.find(l=>l.id===id);return lot?{x:lot.x/1440*100,y:lot.y/960*100}:{x:0,y:0}};
export const cityAssets:Tile[]=manifest.tiles;
export const visibleCityAssets=(rect:Rect)=>visibleTiles(cityAssets,rect);
export function criticalCityAssets(rect:Rect):Tile[]{const tiles=visibleCityAssets(rect);return tiles.length?tiles:cityAssets.filter(t=>t.row===0&&t.column===1)}
