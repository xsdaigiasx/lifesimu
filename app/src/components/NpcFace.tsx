import {useState} from 'react';
/** Chân dung NPC (Codex #89 lô 3). Ảnh lỗi thì quay về chữ cái. */
export default function NpcFace({id,label}:{id:string;label:string}){const [bad,setBad]=useState(false);return bad?<>{label}</>:<img className="npc-face" src={`/assets/npc/${id}.webp`} alt="" loading="lazy" decoding="async" onError={()=>setBad(true)}/>}
export const mealArt=(id:string)=>`/assets/meals/${id}.webp`;
export const productArt=(id:string)=>id==='backpack'?'/icons/icon-192.png':`/assets/products/${id}.webp`;
