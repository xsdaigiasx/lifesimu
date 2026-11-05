/** T75: Bản tin sáng. Hộp thoại tự mở một lần mỗi ngày game sau khi dậy; xem lại ở app Tin tức. */
import type {GameState} from './types';
import {weatherOf,forecastOf,WEATHER_LABEL,type Weather} from './weather';
import {inboxOf,unreadCount} from './inbox';
import {castById} from './npc';
import {places} from './places';
import {isWorkday,holidayName} from './work';
import {officeOf} from './office';
import {rentOf} from './rent';
import {projectsOf} from './projects';
import {dateAt} from './format';

export interface MorningState{seen:number}
export interface Morning{
 weather:{today:Weather;tomorrow:Weather};
 hood:string;
 unread:{count:number;names:string[]};
 agenda:{icon:string;text:string}[];
}
const HOOD=[
 'Quán cà phê đầu hẻm mở sớm, mùi cà phê thơm cả ngõ.',
 'Chợ dân sinh hôm nay đông người đi sớm.',
 'Có người hàng xóm vừa chuyển đồ vào dãy trọ cuối hẻm.',
 'Công viên sáng nay nhiều người tập thể dục.',
 'Xe buýt đầu ngày chạy đúng giờ, hành khách thưa thớt.',
 'Bà bán xôi đầu ngõ nói hôm nay hết hàng sớm.',
 'Tiếng rao hàng vang khắp khu phố từ sáu giờ.'
];
const WEATHER_NEWS:Record<Weather,string>={sunny:'Trời nắng đẹp, phố đông từ sớm.',mild:'Trời râm mát, đi bộ rất dễ chịu.',rain:'Trời mưa, nhớ mang ô khi ra ngoài.',storm:'Có bão, công viên đóng cửa, hạn chế ra đường.'};

export const morningDue=(s:GameState)=>s.day>=1&&(s.morning?.seen??0)<s.day;
export const markMorningSeen=(s:GameState):GameState=>s.morning?.seen===s.day?s:{...s,morning:{seen:s.day}};
export function validMorning(v:unknown,day:number):v is MorningState{return !!v&&typeof v==='object'&&Number.isInteger((v as MorningState).seen)&&(v as MorningState).seen>=0&&(v as MorningState).seen<=day}

export function morningOf(s:GameState):Morning{
 const today=weatherOf(s.day),tomorrow=forecastOf(s.day);
 const hood=today==='storm'||today==='rain'?WEATHER_NEWS[today]:HOOD[s.day%HOOD.length];
 const ib=inboxOf(s),names=Object.entries(ib.threads).filter(([,m])=>m.some(x=>x.from==='npc'&&!x.read)).map(([id])=>castById(id)?.name??id);
 const agenda:Morning['agenda']=[],hol=holidayName(s.day),dow=dateAt(s.day).getUTCDay();
 const o=officeOf(s);
 if(hol)agenda.push({icon:'calendar',text:`Nghỉ lễ: ${hol}`});
 else if(dow===0||dow===6)agenda.push({icon:'calendar',text:'Cuối tuần, công ty nghỉ'});
 if(o.role==='employee'&&isWorkday(s.day))agenda.push({icon:'briefcase',text:'Hôm nay đi làm'});
 const a=o.application;
 if(a?.status==='interview'||(a?.status==='pending'&&a.interviewDay===s.day))agenda.push({icon:'briefcase',text:'Hôm nay có buổi phỏng vấn'});
 if(a?.status==='passed'&&a.startDay===s.day)agenda.push({icon:'briefcase',text:'Hôm nay nhận việc'});
 for(const p of ib.appts.filter(x=>x.status==='set'&&x.day===s.day).sort((x,y)=>x.minute-y.minute)){
  const h=String(Math.floor(p.minute/60)).padStart(2,'0'),m=String(p.minute%60).padStart(2,'0');
  agenda.push({icon:'people',text:`${h}:${m} Hẹn ${castById(p.npc)?.name??p.npc} tại ${places.find(x=>x.id===p.place)?.name??p.place}`})}
 const r=rentOf(s);
 if(r.dueDay!==null&&r.dueDay!==undefined&&r.owed>0&&r.dueDay-s.day<=1)agenda.push({icon:'home',text:r.dueDay<=s.day?'Tiền trọ đang đến hạn':'Mai đến hạn tiền trọ'});
 for(const p of projectsOf(s).active.filter(x=>x.due-s.day<=1))agenda.push({icon:'note',text:`${p.title} ${p.due<=s.day?'hết hạn hôm nay':'hết hạn ngày mai'}`});
 return{weather:{today,tomorrow},hood,unread:{count:unreadCount(s),names},agenda};
}
export {WEATHER_LABEL};
