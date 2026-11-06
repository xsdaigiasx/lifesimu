/** #364: chọn câu trọn ý bằng tag, không dựng nguyên nhân/sự kiện từ seed. */
import {hash} from '../shift';
import type {NpcProfile} from '../npc';
import type {Fact,Intent} from './types';
import {THREAD_TOPICS,type ThreadBeat,type ThreadTopic} from './thread-data';
export {THREAD_TOPICS} from './thread-data';
export interface ThreadState {topic:string;tags:string[];heard:string[];vars:Record<string,string>}
export interface ThreadChoice {signal:string;label:string;attitude:'warm'|'blunt'|'joke'|'dodge';action:'ask'|'share'|'advise'|'silent'}
const cap=(s:string)=>s.charAt(0).toUpperCase()+s.slice(1);
export const eventOf=(f:Fact)=>f.tags?.find(t=>t.startsWith('event:'))?.slice(6);
const pick=<T extends {id:string}>(xs:readonly T[],seed:string)=>[...xs].sort((a,b)=>hash(`${seed}:${a.id}`)-hash(`${seed}:${b.id}`)||a.id.localeCompare(b.id))[0];
const since=(d:number)=>d<=0?'hôm nay':d===1?'hôm qua':d<7?`${d} ngày trước`:d<14?'tuần trước':`${d} ngày trước`;
export const topicFor=(s:ThreadState)=>THREAD_TOPICS.find(t=>t.id===s.topic);
export function beatFits(b:ThreadBeat,s:ThreadState,signal:string){return b.respondsTo===signal&&b.requires.every(t=>s.tags.includes(t))&&!(b.excludes??[]).some(t=>s.tags.includes(t))&&!s.heard.includes(b.id)}
const varsFor=(n:NpcProfile,s:ThreadState):Record<string,string>=>({...s.vars,self:n.self,you:n.you,Self:cap(n.self),You:cap(n.you)});
const fill=(t:string,v:Record<string,string>)=>t.replace(/\{(\w+)\}/g,(_,k:string)=>v[k]??'');
const advance=(s:ThreadState,b:ThreadBeat):ThreadState=>({...s,tags:[...new Set([...s.tags,...b.reveals])],heard:[...s.heard,b.id]});
export function startThread(f:Fact,intent:Intent,n:NpcProfile,day:number,seed:string,recent:readonly string[]=[]){
 const event=eventOf(f),t=THREAD_TOPICS.find(t=>t.intent===intent&&t.events.includes(event??'')&&(!t.roles||t.roles.includes(n.id)));
 if(!t||f.topic!=='self'||f.about!==n.id)return null;
 const s:ThreadState={topic:t.id,tags:[`thread:${t.id}`,`event:${event}`],heard:[],vars:{event:t.id==='unwell'?(event==='frail'?'yếu dần':`bị ${f.vars.event}`):String(f.vars.event??''),item:String(f.vars.item??''),detail:String(f.vars.detail??''),since:since(Math.max(0,day-f.day))}};
 const cand=t.beats.filter(b=>beatFits(b,s,'open')&&[...b.text.matchAll(/\{(\w+)\}/g)].every(m=>!!varsFor(n,s)[m[1]!])&&!recent.includes(`p:thread:${b.id}`));
 const b=pick(cand,seed);return b?{text:fill(b.text,varsFor(n,s)),thread:advance(s,b),prints:[`p:thread:${b.id}`,`t:${intent}:${f.sub}`]}:null;
}
/** Chỉ đưa câu hỏi ra khi có câu trả lời hợp tag. Câu đã hỏi không lặp lại. */
export function threadChoices(s:ThreadState,n:NpcProfile,seed:string):ThreadChoice[]{const t=topicFor(s);if(!t)return[];
 const call=n.self==='mình'?'bạn':n.self==='tôi'?(n.role==='Bác sĩ'?'bác sĩ':'anh'):n.self,me=n.you==='bạn'?'mình':n.you;
 const v={call,Call:cap(call),me,Me:cap(me)},questions=t.questions.filter(q=>t.beats.some(b=>beatFits(b,s,q.signal)));
 const sorted=[...questions].sort((a,b)=>hash(`${seed}:${a.signal}`)-hash(`${seed}:${b.signal}`));
 return [...sorted.slice(0,2).map(q=>({signal:q.signal,label:fill(q.label,v),attitude:q.attitude,action:q.action})),
 {signal:'support',label:fill(t.intent==='brag'?'{Me} cũng mừng cho {call}.':'{Me} nghe đây, {call} cứ nói nếu muốn.',v),attitude:'warm',action:'share'},
 {signal:'leave',label:fill('{Me} phải đi rồi, mình nói chuyện sau nhé {call}.',v),attitude:'dodge',action:'silent'}];
}
/** Nối đúng hành vi vừa chọn; không suy diễn nhãn hiển thị bằng regex. */
export function respondThread(s:ThreadState,n:NpcProfile,signal:string,seed:string){const t=topicFor(s);if(!t)return null;
 if(signal==='leave'||signal==='support'){const texts=signal==='leave'?['Ừ, {you} đi nhé.','Vậy mình nói chuyện sau nhé {you}.']:t.intent==='brag'?['Có {you} chia vui là {self} vui thêm rồi.','Cảm ơn {you}, {self} chỉ muốn chia sẻ niềm vui đó thôi.']:['Cảm ơn {you} đã nghe, {self} chưa cần lời khuyên ngay đâu.','Có {you} chịu nghe là {self} thấy dễ nói hơn rồi.'];
  const i=hash(seed)%texts.length;return{text:fill(texts[i]!,varsFor(n,s)),thread:s,prints:[`p:thread:${t.id}:${signal}:${i}`]};}
 const candidates=t.beats.filter(b=>beatFits(b,s,signal)&&[...b.text.matchAll(/\{(\w+)\}/g)].every(m=>!!varsFor(n,s)[m[1]!]));
 const detailed=candidates.filter(b=>b.text.includes('{detail}'));const b=pick(detailed.length?detailed:candidates,seed);return b?{text:fill(b.text,varsFor(n,s)),thread:advance(s,b),prints:[`p:thread:${b.id}`]}:null;
}
/** Save cũ không có thread vẫn đọc như trước; save mới chỉ giữ mã/tag/biến nhỏ, không giữ cây hội thoại. */
export function validThread(v:unknown):v is ThreadState{if(!v||typeof v!=='object')return false;const s=v as ThreadState,t=THREAD_TOPICS.find(t=>t.id===s.topic);if(!t)return false;
 const allowed=new Set([`thread:${t.id}`,...t.events.map(e=>`event:${e}`),...t.beats.flatMap(b=>b.reveals)]);
 return Array.isArray(s.tags)&&s.tags.length<=12&&new Set(s.tags).size===s.tags.length&&s.tags.includes(`thread:${t.id}`)&&s.tags.includes('introduced')&&s.tags.filter(x=>t.events.some(e=>x===`event:${e}`)).length===1&&s.tags.every(x=>allowed.has(x))&&Array.isArray(s.heard)&&s.heard.length>=1&&s.heard.length<=8&&new Set(s.heard).size===s.heard.length&&s.heard.every(id=>t.beats.some(b=>b.id===id))&&!!s.vars&&typeof s.vars==='object'&&!Array.isArray(s.vars)&&Object.keys(s.vars).length===4&&['event','item','detail','since'].every(k=>typeof s.vars[k]==='string'&&s.vars[k]!.length<160)&&t.beats.filter(b=>s.heard.includes(b.id)).every(b=>b.reveals.every(tag=>s.tags.includes(tag)));
}
export function threadProblems(topics:readonly ThreadTopic[]=THREAD_TOPICS){const out:string[]=[],ids=new Set<string>(),events=new Set<string>();for(const t of topics){if(ids.has(t.id))out.push(`trùng mạch ${t.id}`);ids.add(t.id);
 for(const e of t.events){if(events.has(e))out.push(`trùng biến cố ${e}`);events.add(e)}
 const beats=new Set<string>(),tags=new Set([`thread:${t.id}`,...t.events.map(e=>`event:${e}`),...t.beats.flatMap(b=>b.reveals)]);
 for(const b of t.beats){if(beats.has(b.id))out.push(`trùng câu ${b.id}`);beats.add(b.id);if(!b.text||b.text.length>240)out.push(`độ dài ${b.id}`);if([...b.text.matchAll(/\{(\w+)\}/g)].some(m=>!['self','Self','you','You','event','item','detail','since'].includes(m[1]!)))out.push(`biến lạ ${b.id}`);if([...b.requires,...b.excludes??[]].some(tag=>!tags.has(tag)))out.push(`tag không nguồn ${b.id}`);if(b.respondsTo!=='open'&&!t.questions.some(q=>q.signal===b.respondsTo))out.push(`nhánh không có câu hỏi ${b.id}`)}
 if(t.beats.filter(b=>b.respondsTo==='open').length<2)out.push(`thiếu mở lời ${t.id}`);
 for(const q of t.questions){const s:ThreadState={topic:t.id,tags:[`thread:${t.id}`,'introduced'],heard:[],vars:{}};if(!t.beats.some(b=>beatFits(b,s,q.signal)))out.push(`câu hỏi không có đáp án ${t.id}:${q.signal}`)}}return out}
