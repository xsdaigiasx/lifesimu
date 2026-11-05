/** Chênh lệch chỉ số sau một hành động, để báo ngắn kiểu biểu tượng kèm số (04/11). */
import type {GameState} from './types';
import {fullnessOf} from './vitals';
import {socialOf} from './social';
import {castById} from './npc';
import {clockOf} from './time';
export interface StatDelta{key:string;icon:string;label:string;value:number;good:boolean}
const KEYS=[['fullness','restaurant','No'],['energy','bolt','Năng lượng'],['mood','smile','Tinh thần'],['health','heart','Sức khỏe'],['stress','wave','Căng thẳng']] as const;
/** Bỏ qua thay đổi nhỏ do thời gian trôi; ngủ hay qua ngày đã có tổng kết riêng. */
export function statDeltas(prev:GameState,next:GameState):StatDelta[]{if(next.day!==prev.day)return[];const out:StatDelta[]=[];
 const passed=clockOf(next).minute-clockOf(prev).minute,min=passed>60?4:2;
 for(const [key,icon,label] of KEYS){const a=key==='fullness'?fullnessOf(prev):prev[key],b=key==='fullness'?fullnessOf(next):next[key],d=Math.round(b-a);if(Math.abs(d)>=min)out.push({key,icon,label,value:d,good:key==='stress'?d<0:d>0})}
 const r0=socialOf(prev).relations,r1=socialOf(next).relations;for(const id of Object.keys(r1)){const d=(r1[id]?.score??0)-(r0[id]?.score??0);if(d){const n=castById(next,id);if(n)out.push({key:'rel:'+id,icon:'heart',label:n.name,value:d,good:d>0})}}
 return out}
