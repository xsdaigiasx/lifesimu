/** T19: cách hiển thị Nhật ký và hồ sơ NPC (chốt 04/11). Nhật ký tách khỏi Sổ thu chi. Thời gian ghi áng chừng. */
import type {GameState} from './types';
import type {JournalEntry} from './journal';
import {castById,agoText,type NpcProfile} from './npc';
import {storyOf,alive,type Memory} from './director';
import {socialOf} from './social';
import {places} from './places';
import {dateAt} from './format';

export type JournalTab='story'|'work'|'life';
export const JOURNAL_TABS:[JournalTab,string][]=[['story','Câu chuyện'],['work','Công việc'],['life','Đời sống']];
const STORY=['story:','chat:','turn:','loan-','probation:','tier:'],WORK=['task:','shift-','bug:','salary:','study:','office-item:'];
/** Tab của một dòng Nhật ký theo khoá. Mốc đời người (thăng bậc, qua thử việc) xếp vào Câu chuyện. */
export function journalTab(e:JournalEntry):JournalTab{if(e.npcId||STORY.some(p=>e.key.startsWith(p)))return'story';if(WORK.some(p=>e.key.startsWith(p)))return'work';return'life'}
const WEEKDAY=['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
/** Nhãn nhóm theo ngày: Hôm nay, Hôm qua, thứ trong tuần (trong 6 ngày), rồi áng chừng. */
export function dayLabel(day:number,today:number){const d=today-day;if(d<=0)return'Hôm nay';if(d===1)return'Hôm qua';if(d<=6)return WEEKDAY[dateAt(day).getUTCDay()]!;const a=agoText(d);return a.charAt(0).toUpperCase()+a.slice(1)}
export const clockLabel=(minute:number)=>`${String(Math.floor(minute/60)%24).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
/** Gom các dòng theo nhãn ngày, mới nhất lên đầu. */
export function groupByDay(entries:JournalEntry[],today:number){const out:{label:string;items:JournalEntry[]}[]=[];for(const e of [...entries].sort((a,b)=>b.day-a.day||b.minute-a.minute)){const label=dayLabel(e.day,today),g=out[out.length-1];if(g&&g.label===label)g.items.push(e);else out.push({label,items:[e]})}return out}

const TIERS=[0,10,30,60,101];
/** Tiến độ tới bậc kế: phần trăm trong bậc hiện tại và tên bậc kế. */
export function tierProgress(score:number){const i=TIERS.findIndex((t,k)=>score>=t&&score<TIERS[k+1]!),lo=TIERS[i]!,hi=TIERS[i+1]!;return{pct:hi>100?100:Math.round((score-lo)/(hi-lo)*100),next:['Quen biết','Thân','Tri kỷ',''][i]??''}}
const PLACE_NAME=(id:string)=>places.find(p=>p.id===id)?.name??id;
const part=(m:number)=>m<660?'buổi sáng':m<840?'buổi trưa':m<1080?'buổi chiều':'buổi tối';
/** Nơi hay gặp, mô tả gọn: "Chợ dân sinh buổi sáng". Không trùng. */
export function usualPlaces(n:NpcProfile){const by=new Map<string,string[]>();for(const s of n.schedule){const name=PLACE_NAME(s.place),p=part(s.from).replace('buổi ',''),l=by.get(name)??[];if(!l.includes(p))l.push(p);by.set(name,l)}return[...by].map(([name,ps])=>`${name} buổi ${ps.join(' và ')}`)}
/** Viết lại ký ức bằng lời cho người chơi. */
export function memoryText(m:Memory,name:string){const helped=m.tag==='help'||m.tag==='partial',refused=m.tag==='refuse'||m.tag==='dodge';const topic=m.topic;
 if(['xách đồ','trông quầy','sửa điện thoại'].includes(topic))return helped?`Giúp ${name} ${topic}`:refused?`Không giúp ${name} ${topic}`:`${name} nhờ ${topic}`;
 if(topic==='đi ăn chung')return`Đi ăn cùng ${name}`;if(topic==='chuyện riêng')return`Nghe ${name} kể chuyện riêng`;if(topic==='mượn tiền')return helped||m.tag==='full'||m.tag==='half'?`Cho ${name} mượn tiền`:`${name} hỏi mượn tiền`;
 if(topic==='dạy nấu ăn')return`${name} chỉ cách nấu ăn`;if(topic==='bị đòi nợ')return`Đòi ${name} trả nợ`;if(topic==='được xoá nợ')return`Xoá nợ cho ${name}`;if(topic==='chưa trả tiền mượn')return`${name} chưa trả tiền mượn`;if(topic==='chưa trả lời mẹ')return'Chưa trả lời tin nhắn của Mẹ';if(topic==='gặp lại')return`Gặp lại ${name}`;return topic.charAt(0).toUpperCase()+topic.slice(1)}
/** Hồ sơ đầy đủ cho màn Quan hệ: chỉ những gì người chơi đã biết. */
export function profileOf(s:GameState,id:string){const n=castById(id);if(!n)return null;const family=id==='me',score=socialOf(s).relations[id]?.score??0,known=family||score>=10,st=storyOf(s);
 const facts:[string,string][]=known?[['Quê',n.origin],['Tính cách',n.traits.join(', ')],['Điểm nhấn',n.quirk]]:[];if(family||score>=30)facts.push(['Mong muốn',n.goal]);if(st.memories.some(m=>m.npc===id&&m.topic==='chuyện riêng'))facts.push(['Đang lo',n.fear]);
 const shared=st.memories.filter(m=>m.npc===id&&alive(m,s.day)).sort((a,b)=>b.day-a.day).slice(0,12).map(m=>({id:m.id,text:memoryText(m,n.name),when:agoText(s.day-m.day)}));
 const loans=st.loans.filter(l=>l.npc===id&&(!l.settled||l.settled==='unpaid')).map(l=>({amount:l.amount,late:s.day>l.due,days:Math.max(0,l.due-s.day)}));
 return{npc:n,score,known,facts,shared,loans,places:known&&!n.remote?usualPlaces(n):[],progress:family?{pct:100,next:''}:tierProgress(score)}}
