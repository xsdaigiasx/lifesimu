/** H4: lát cắt save của bộ sinh hội thoại: nhật ký trả lời (30 ngày) và vân tay chống lặp theo NPC (14 ngày, tối đa 40 mã). */
import type {GameState} from '../types';
import {isNpcId} from '../npc';
import {PRINT_CAP,notePrints,type Print} from './compose';
import {validReplyLog,noteReply,type ReplyLog} from './replies';

export interface TalkState{version:1;log:ReplyLog[];prints:Record<string,Print[]>}
export const talkOf=(s:GameState):TalkState=>s.talk??{version:1,log:[],prints:{}};
export const printsOf=(s:GameState,npc:string)=>talkOf(s).prints[npc]??[];
/** Ghi vân tay câu vừa nói (và bộ lựa chọn) cho một NPC. */
export function notePrintsFor(s:GameState,npc:string,keys:readonly string[]):GameState{const t=talkOf(s);return{...s,talk:{...t,prints:{...t.prints,[npc]:notePrints(t.prints[npc]??[],keys,s.day)}}}}
/** Ghi một lựa chọn trả lời. */
export function noteReplyFor(s:GameState,r:ReplyLog):GameState{const t=talkOf(s);return{...s,talk:{...t,log:noteReply(t.log,r)}}}
export function validTalk(v:unknown,day:number):v is TalkState{if(!v||typeof v!=='object')return false;const t=v as TalkState;
 return t.version===1&&validReplyLog(t.log,day)&&!!t.prints&&typeof t.prints==='object'&&!Array.isArray(t.prints)&&Object.entries(t.prints).every(([id,l])=>isNpcId(id)&&Array.isArray(l)&&l.length<=PRINT_CAP&&l.every(p=>p&&typeof p.k==='string'&&p.k.length<200&&Number.isInteger(p.d)&&p.d>=0&&p.d<=day))}
