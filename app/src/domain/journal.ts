import type {GameState} from './types';
import {clockOf,START,END} from './time';

export interface JournalEntry {
 id:string;
 /** Stable occurrence key, e.g. `meet:mai-lan` or `shift:3`. */
 key:string;
 day:number;
 minute:number;
 title:string;
 detail:string;
 npcId?:string;
}
export type JournalInput=Pick<JournalEntry,'key'|'title'|'detail'|'npcId'>;
export const JOURNAL_LIMIT=300;
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length>0&&v.length<=max&&v.trim()===v;
const validInput=(v:JournalInput)=>text(v.key,120)&&text(v.title,100)&&text(v.detail,1000)&&(v.npcId===undefined||text(v.npcId,80));

/** Validate persisted entries without inventing records for older saves. */
export function validJournal(value:unknown,day:number):value is JournalEntry[]{
 if(!Array.isArray(value)||value.length>JOURNAL_LIMIT||!Number.isInteger(day)||day<0||day>100000)return false;
 const ids=new Set<string>(),keys=new Set<string>();
 return value.every((value:unknown)=>{
  if(!value||typeof value!=='object')return false;
  const e=value as JournalEntry;
  if(!validInput(e)||!text(e.id,200)||!Number.isInteger(e.day)||e.day<0||e.day>day||!Number.isInteger(e.minute)||e.minute<START||e.minute>END||ids.has(e.id)||keys.has(e.key))return false;
  ids.add(e.id);keys.add(e.key);return true;
 });
}

/** Read only; opening a journal must never create events or advance time. */
export function journalOf(state:GameState):readonly JournalEntry[]{return state.journal??[]}

/** Record a successful action using the resulting state's actual game clock. */
export function appendJournal(state:GameState,input:JournalInput):GameState{
 const minute=clockOf(state).minute,entries=journalOf(state);
 if(!validInput(input)||entries.some(e=>e.key===input.key)||!Number.isInteger(state.day)||state.day<0||state.day>100000||!Number.isInteger(minute)||minute<START||minute>END)return state;
 const entry:JournalEntry={id:`${state.day}:${minute}:${input.key}`,key:input.key,day:state.day,minute,title:input.title,detail:input.detail,...(input.npcId===undefined?{}:{npcId:input.npcId})};
 return {...state,journal:[entry,...entries].slice(0,JOURNAL_LIMIT)};
}

export function recordJournal(state:GameState,key:string,title:string,detail:string,npcId?:string):GameState{return appendJournal(state,{key,title,detail,npcId})}
