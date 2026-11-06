import {useState} from 'react';
import type {NpcProfile} from '../domain/npc';
import type {CSSProperties} from 'react';
import {faceOf,faceLayers,layerAdjust,FRAME} from '../domain/portrait';
const fit=(src:string):CSSProperties|undefined=>{const a=layerAdjust(src);return a?({'--dx':`${a.dx/FRAME*100}%`,'--dy':`${a.dy/FRAME*100}%`,'--s':a.scale} as CSSProperties):undefined};
/** Chân dung NPC ghép từ mảnh (Codex #305): chồng nền, áo, tóc, phụ kiện theo hồ sơ người. Ảnh lỗi thì quay về chữ cái. */
export default function NpcFace({npc}:{npc:Pick<NpcProfile,'id'|'label'|'gender'|'age'|'quirk'|'fullName'|'desk'>}){const [bad,setBad]=useState(false);
 if(bad)return<>{npc.label}</>;const layers=faceLayers(faceOf(npc));
 return<span className="npc-face">{layers.map((src,i)=><img key={src} src={src} alt="" style={fit(src)} loading="lazy" decoding="async" onError={i===0?()=>setBad(true):e=>{e.currentTarget.style.display='none'}}/>)}</span>}
export const mealArt=(id:string)=>`/assets/meals/${id}.webp`;
export const productArt=(id:string)=>`/assets/products/${id}.webp`;
