import Icon from './Icon';
import type {GameState} from '../domain/types';
import {morningOf} from '../domain/morning';
import {WEATHER_LABEL,WEATHER_ICON} from '../domain/weather';

/** T75: nội dung Bản tin sáng, dùng cho hộp thoại và app Tin tức. */
export function MorningBody({state}:{state:GameState}){
 const m=morningOf(state);
 return <div className="morning">
  <section className="morning-sec"><small>KHU PHỐ</small>
   <div className="morning-weather"><span><Icon name={WEATHER_ICON[m.weather.today]}/>{WEATHER_LABEL[m.weather.today]}</span><span className="morning-next">Mai <Icon name={WEATHER_ICON[m.weather.tomorrow]}/>{WEATHER_LABEL[m.weather.tomorrow]}</span></div>
   <p>{m.hood}</p></section>
  {m.recap.length>0&&<section className="morning-sec"><small>TỔNG KẾT</small>{m.recap.map((a,i)=><p key={i}><Icon name={a.icon}/>{a.text}</p>)}</section>}
  <section className="morning-sec"><small>TIN NHẮN</small>
   {m.unread.count?<p><Icon name="message"/><b>{m.unread.count}</b> chưa đọc từ {m.unread.names.join(', ')}</p>:<p className="morning-empty">Không có tin nhắn mới.</p>}</section>
  <section className="morning-sec"><small>HÔM NAY</small>
   {m.agenda.length?m.agenda.map((a,i)=><p key={i}><Icon name={a.icon}/>{a.text}</p>):<p className="morning-empty">Một ngày trống, tự do sắp xếp.</p>}</section>
  {m.weekend.length>0&&<section className="morning-sec"><small>CUỐI TUẦN</small>{m.weekend.map((a,i)=><p key={i}><Icon name={a.icon}/>{a.text}</p>)}</section>}
  {m.ago.length>0&&<section className="morning-sec"><small>NĂM NGOÁI</small>{m.ago.map((a,i)=><p key={i}><Icon name={a.icon}/>{a.text}</p>)}</section>}
  {m.night.length>0&&<section className="morning-sec"><small>QUA ĐÊM Ở CÔNG TY</small>{m.night.map((a,i)=><p key={i}><Icon name={a.icon}/>{a.text}</p>)}</section>}
  <section className="morning-sec"><small>MỤC TIÊU TUẦN</small>{m.goals.map(g=><p key={g.id} className={g.count>=g.target?'morning-done':''}><Icon name={g.count>=g.target?'heart':'clock'}/>{g.text}<b>{g.count}/{g.target}</b></p>)}</section>
 </div>}

export default function Morning({state,onClose}:{state:GameState;onClose:()=>void}){
 return <div className="morning-dialog"><MorningBody state={state}/><button className="primary" onClick={onClose}>Bắt đầu ngày mới</button></div>}
