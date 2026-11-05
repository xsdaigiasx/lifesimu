import {useMemo} from 'react';
import type {GameState} from '../domain/types';
import {buildPlan} from '../domain/office-plan';
import {SIZES,officeOf} from '../domain/office';
import {staffOf} from '../domain/hiring';
import {hash} from '../domain/shift';
import IsoOffice,{type OfficePerson} from './IsoOffice';

const TONES=['#b07f6b','#9a7d46','#8c6aa0','#6f8b5c','#5b7f8c','#b0875a'];

/** Văn phòng của chủ công ty (isometric): chủ ngồi ghế đầu, nhân viên đã thuê ngồi các ghế sau theo thứ tự thuê. */
export default function OwnerFloor({state}:{state:GameState}){
 const o=officeOf(state),staff=staffOf(state);
 const plan=useMemo(()=>buildPlan(o.size,o.industry,SIZES[o.size].seats),[o.size,o.industry]);
 const people:OfficePerson[]=[{id:'owner',label:'Tôi',seat:0,tone:'#6f9a5b',player:true,name:'Bạn'},
  ...staff.slice(0,Math.max(0,plan.seats.length-1)).map((e,i)=>({id:e.id,label:e.name.split(' ').pop()!.slice(0,1),seat:i+1,tone:TONES[hash(e.id)%TONES.length]!,name:e.name}))];
 return <div className="game-floor-preview"><IsoOffice plan={plan} people={people}/></div>}
