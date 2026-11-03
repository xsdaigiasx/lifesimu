import type {LifeAction} from '../domain/life';
import type {HomeTier} from '../domain/home';
import FurnitureShop from './FurnitureShop';
import {homeOf,type HomeId} from '../domain/home';
import {clockText,clockOf} from '../domain/time';
import {InstallCard,VersionCard} from './UpdateAndInstall';
import {resetLife,restoreBackup,backupInfo,BACKUP_DAYS} from '../domain/reset';
import {officeOf,STAFF} from '../domain/office';
import BauCua from './BauCua';
import type {Bets, RoundResult} from '../domain/bau-cua';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { DailyAction, GameResult, GameState, PhoneState, PlayerProfile } from '../domain/types';
import { phoneData as data } from '../domain/phone-data';

type Action = 'report' | 'day' | 'city' | 'room' | 'save' | 'replay';
type Page = 'baucua' | 'home' | 'health' | 'contacts' | 'shop' | 'calendar' | 'alarms' | 'clock' | 'news' | 'finance' | 'work' | 'notes' | 'save' | 'leisure' | 'calls' | 'messages' | 'settings' | 'weather' | 'map' | 'room';
export interface PhoneProps {
  bauCuaShaking: boolean;
  onPlayBauCua: (bets: Bets) => Promise<RoundResult>;
  state: GameState;
  profile: PlayerProfile;
  onAction: (action: Action, choice?: DailyAction) => void;
  onResetStart: (active: boolean) => void;
  onClose: () => void;
  onBuyFurniture:(id:HomeId,tier?:HomeTier)=>GameResult;
  onLifeAction:(a:LifeAction)=>GameResult;
}
const APPS: ReadonlyArray<{ page: Page; icon: string; label: string; tone: string }> = [
  { page: 'health', icon: 'heart', label: 'Sức khỏe', tone: 'health-app' },
  { page: 'contacts', icon: 'people', label: 'Danh bạ', tone: 'contacts-app' },
  { page: 'shop', icon: 'bag', label: 'Mua sắm', tone: 'shop-app' },
  { page: 'calendar', icon: 'calendar', label: 'Lịch', tone: 'calendar-app' },
  { page: 'alarms', icon: 'bell', label: 'Báo thức', tone: 'alarms-app' },
  { page: 'clock', icon: 'clock', label: 'Đồng hồ', tone: 'clock-app' },
  { page: 'news', icon: 'news', label: 'Đọc báo', tone: 'news-app' },
  { page: 'finance', icon: 'chart', label: 'Tài chính', tone: 'finance-app' },
  { page: 'work', icon: 'briefcase', label: 'Công việc', tone: 'work-app' },
  { page: 'notes', icon: 'note', label: 'Ghi chú', tone: 'notes-app' },
  { page: 'save', icon: 'save', label: 'Lưu game', tone: 'save-app' },
  { page: 'leisure', icon: 'play', label: 'Giải trí', tone: 'leisure-app' },
];
const DOCK: ReadonlyArray<{ page: Page; icon: string; label: string }> = [
  { page: 'calls', icon: 'call', label: 'Gọi điện' }, { page: 'messages', icon: 'message', label: 'Tin nhắn' },
  { page: 'finance', icon: 'chart', label: 'Tài chính' }, { page: 'settings', icon: 'settings', label: 'Cài đặt' },
];
const TITLES: Partial<Record<Page, string>> = { baucua: 'Bầu cua tôm cá', home: 'Điện thoại', weather: 'Thời tiết', settings: 'Cài đặt', messages: 'Tin nhắn', calls: 'Gọi điện', map: 'Bản đồ', room: 'Nhà của tôi' };
const dateAt = (day: number): Date => new Date(Date.UTC(2026, 10, 2 + day));
const dateText = (day: number): string => new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' }).format(dateAt(day));
const shortDate = (day: number): string => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(dateAt(day));
const money = (amount: number): string => `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
const uid = (): string => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const Icon = ({ id }: { id: string }) => <svg aria-hidden="true"><use href={`#i-${id}`} /></svg>;
const Intro = ({ title, description }: { title: string; description: string }) => <section className="phone-page-intro"><h2>{title}</h2></section>;
const Empty = ({ icon, title, children }: { icon: string; title: string; children: ReactNode }) => <div className="phone-empty"><span className="empty-glyph"><Icon id={icon} /></span><h3>{title}</h3><p>{children}</p></div>;
function Clock({minute=480}:{minute?:number}) {
  return <svg className="analog-dial" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="#fffdf4" />{Array.from({ length: 12 }, (_, index) => {
    const number = index + 1, angle = number * Math.PI / 6;
    return <text key={number} x={50 + 36 * Math.sin(angle)} y={54 - 36 * Math.cos(angle)}>{number}</text>;
  })}<path d="M50 50V27" transform={`rotate(${minute/2} 50 50)`} stroke="#20332c" strokeWidth="5" strokeLinecap="round" /><path d="M50 50V17" transform={`rotate(${minute%60*6} 50 50)`} stroke="#20332c" strokeWidth="3" strokeLinecap="round" /><circle cx="50" cy="50" r="3" fill="#d6a34d" /></svg>;
}

export default function Phone({ state, profile, onAction, onResetStart, onPlayBauCua, bauCuaShaking, onBuyFurniture,onLifeAction }: PhoneProps) {
  const [phone, setPhone] = useState<PhoneState>(() => { try { return data.parse(localStorage.getItem(data.KEY)) ?? data.initial(); } catch { return data.initial(); } });
  const [page, setPage] = useState<Page>('home');
  const [dial, setDial] = useState('');
  const [notice, setNotice] = useState('');
  const [resetStep, setResetStep] = useState<'idle' | 'confirm' | 'restore'>('idle');
  const [resetText, setResetText] = useState('');
  const [notesDraft, setNotesDraft] = useState(phone.notes);
  const contentRef = useRef<HTMLDivElement>(null);
  const gameISO = dateAt(state.day).toISOString().slice(0, 10);
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(gameISO);
  const [alarmTime, setAlarmTime] = useState('07:00');
  const [alarmLabel, setAlarmLabel] = useState('');
  useEffect(() => { contentRef.current?.scrollTo(0, 0); contentRef.current?.focus(); }, [page]);
  const commit = (next: PhoneState, success = ''): boolean => {
    if (!data.valid(next)) { setNotice('Dữ liệu điện thoại chưa hợp lệ.'); return false; }
    setPhone(next);
    try { localStorage.setItem(data.KEY, JSON.stringify(next)); setNotice(success); return true; }
    catch { setNotice('Chưa lưu được điện thoại. Dữ liệu hiện chỉ giữ trong phiên này.'); return false; }
  };
  const navigate = (next: Page): void => {
    setPage(next); setNotice('');
    if (next === 'messages' && state.lastReport && phone.readReport < state.lastReport.day) commit({ ...phone, readReport: state.lastReport.day });
  };
  const saveNotes = (event: FormEvent<HTMLFormElement>): void => { event.preventDefault(); commit({ ...phone, notes: notesDraft.slice(0, 4000) }, 'Đã lưu ghi chú.'); };
  const addAppointment = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault(); const title = appointmentTitle.trim().slice(0, 80), next = { ...phone, appointments: [...phone.appointments, { id: uid(), title, date: appointmentDate }] };
    if (!title || appointmentDate < gameISO || !data.valid(next)) { setNotice(phone.appointments.length >= 30 ? 'Tối đa 30 lịch hẹn.' : 'Hãy nhập tên và ngày hẹn hợp lệ.'); return; }
    commit(next, 'Đã lưu lịch hẹn.'); setAppointmentTitle('');
  };
  const addAlarm = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault(); const next = { ...phone, alarms: [...phone.alarms, { id: uid(), time: alarmTime, label: alarmLabel.trim().slice(0, 40), enabled: true }] };
    if (!data.valid(next)) { setNotice(phone.alarms.length >= 8 ? 'Tối đa 8 báo thức.' : 'Giờ báo thức chưa hợp lệ.'); return; }
    commit(next, 'Đã lưu giờ báo thức.'); setAlarmLabel('');
  };
  const manualSave = (): void => {
    try { localStorage.setItem('life-simulator-vi-v1', JSON.stringify(state)); onAction('save'); commit({ ...phone, lastSaved: new Date().toISOString() }, 'Đã lưu tiến độ.'); }
    catch { setNotice('Thiết bị đang chặn lưu tiến độ.'); }
  };
  const intro = (title: string, description: string) => <Intro title={title} description={description} />;
  const actionRow = (icon: string, title: string, description: string, action: () => void) => <button onClick={action}><Icon id={icon} /><span><strong>{title}</strong><small>{description}</small></span>↗</button>;
  let body: ReactNode = null;
  switch (page) {
    case 'home': body = <><div className="phone-widgets"><button className="clock-widget" onClick={() => navigate('clock')} aria-label="Mở đồng hồ"><Clock minute={clockOf(state).minute}/><span>Đồng hồ</span></button><button className="weather-widget" onClick={() => navigate('weather')}><small>AN NHIÊN ↗</small><strong>26°</strong><Icon id="sun" /><b>Trời trong</b><span>Ngày {state.day + 1} · Nhịp sống mới</span></button></div><div className="phone-home-date">{dateText(state.day)} · {dateAt(state.day).getUTCFullYear()}</div><div className="phone-apps">{APPS.map(app => {
      const count = app.page === 'calendar' ? phone.appointments.filter(entry => entry.date === gameISO).length : 0;
      return <button className="phone-app" key={app.page} onClick={() => navigate(app.page)}><span className={`app-glyph ${app.tone}`}>{app.page === 'calendar' ? <span className="calendar-icon"><small>THÁNG {dateAt(state.day).getUTCMonth() + 1}</small><b>{dateAt(state.day).getUTCDate()}</b></span> : <Icon id={app.icon} />}{count > 0 && <span className="app-badge">{count}</span>}</span><strong>{app.label}</strong></button>;
    })}</div><div className="phone-page-dots" aria-hidden="true"><i /></div></>; break;
    case 'health': body = <>{intro('Sức khỏe của bạn', 'Lắng nghe bản thân, từng ngày.')}<div className="phone-person"><span>{profile.gender === 'female' ? '👩🏻‍💻' : '🧑🏻‍💻'}</span><div><strong>{profile.name}</strong><small>Lập trình viên mới</small></div><b>LV {1 + Math.floor(state.xp / 100)}</b></div><div className="phone-stat-list">{([
      ['energy', 'Năng lượng', 'Sức làm việc và khả năng tiếp thu.', 'gold'], ['mood', 'Tâm trạng', 'Cảm nhận về cuộc sống hiện tại.', 'green'], ['health', 'Sức khỏe', 'Nền tảng để duy trì công việc.', 'teal'], ['stress', 'Stress', 'Càng thấp, nhịp sống càng dễ chịu.', 'purple'],
    ] as const).map(([key, label, description, tone]) => <div key={key}><header><strong>{label}</strong><b>{state[key]}<small>/100</small></b></header><div className={`phone-meter ${tone}`}><i style={{ width: `${state[key]}%` }} /></div><p>{description}</p></div>)}</div><div className="phone-info-card"><small>KINH NGHIỆM</small><h3>{state.xp} XP tích lũy</h3><p>Còn {100 - state.xp % 100} XP để lên cấp tiếp theo.</p></div></>; break;
    case 'finance': {
      const date = dateAt(state.day), transactions = state.ledger.filter(entry => { const d = dateAt(entry.day); return d.getUTCMonth() === date.getUTCMonth() && d.getUTCFullYear() === date.getUTCFullYear(); });
      const income = transactions.filter(entry => entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0), expense = -transactions.filter(entry => entry.amount < 0).reduce((sum, entry) => sum + entry.amount, 0);
      body = <>{intro(`Ví của ${profile.name}`, 'Từng khoản chi, một lựa chọn sống.')}<div className="phone-finance-balance"><small>SỐ DƯ HIỆN TẠI</small><h2>{money(state.money)}</h2><span>Tài khoản cá nhân · Trong game</span></div><div className="phone-finance-totals"><div><small>↙ Thu trong tháng</small><strong className="positive">{money(income)}</strong></div><div><small>↗ Chi trong tháng</small><strong className="negative">{money(expense)}</strong></div></div><div className="phone-section-heading"><h3>Giao dịch gần đây</h3><button onClick={() => onAction('report')}>Xem tất cả ↗</button></div><div className="phone-ledger">{state.ledger.length ? state.ledger.slice(0, 5).map((entry, index) => <div key={`${entry.day}-${index}`}><span className={`transaction-dot ${entry.amount > 0 ? 'in' : 'out'}`}>{entry.amount > 0 ? '↙' : '↗'}</span><span className="phone-transaction-name"><strong>{entry.name}</strong><small>{shortDate(entry.day)}</small></span><b className={entry.amount > 0 ? 'positive' : 'negative'}>{entry.amount > 0 ? '+' : ''}{money(entry.amount)}</b></div>) : <p>Chưa có giao dịch. Vốn khởi đầu: 5.200.000đ.</p>}</div></>; break;
    }
    case 'calendar': {
      const date = dateAt(state.day), year = date.getUTCFullYear(), month = date.getUTCMonth(), start = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7, count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      body = <>{intro('Lịch của bạn', 'Một chỗ cho những điều cần nhớ.')}<div className="calendar-month"><header><strong>Tháng {month + 1} / {year}</strong><small>Lịch trong game</small></header><div className="calendar-week">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(label => <b key={label}>{label}</b>)}{Array.from({ length: start }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: count }, (_, index) => {
        const day = index + 1, iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return <span key={day} className={day === date.getUTCDate() ? 'today' : ''}>{day}{phone.appointments.some(entry => entry.date === iso) && <i />}</span>;
      })}</div></div><h3 className="phone-small-title">Lịch hẹn đã lưu</h3>{phone.appointments.length ? [...phone.appointments].sort((a, b) => a.date.localeCompare(b.date)).map(entry => <div className="appointment-row" key={entry.id}><div><strong>{entry.title}</strong><small>{entry.date.split('-').reverse().join('/')}{entry.date === gameISO ? ' · Hôm nay' : entry.date < gameISO ? ' · Đã qua' : ''}</small></div><button onClick={() => commit({ ...phone, appointments: phone.appointments.filter(value => value.id !== entry.id) })} aria-label={`Xóa lịch hẹn ${entry.title}`}>×</button></div>) : null}<form className="phone-form" onSubmit={addAppointment}><label htmlFor="appointmentTitle">Việc cần nhớ</label><input id="appointmentTitle" value={appointmentTitle} onChange={event => setAppointmentTitle(event.target.value)} maxLength={80} required placeholder="Ví dụ: học thêm JavaScript" /><label htmlFor="appointmentDate">Ngày trong game</label><input id="appointmentDate" type="date" min={gameISO} value={appointmentDate} onChange={event => setAppointmentDate(event.target.value)} required /><button className="primary wide" type="submit">Thêm lịch hẹn</button></form></>; break;
    }
    case 'alarms': body = <>{intro('Báo thức', 'Chuẩn bị một nhịp sống của riêng bạn.')}{phone.alarms.length ? phone.alarms.map(entry => <div className="alarm-row" key={entry.id}><button className={`alarm-toggle ${entry.enabled ? 'on' : ''}`} onClick={() => commit({ ...phone, alarms: phone.alarms.map(alarm => alarm.id === entry.id ? { ...alarm, enabled: !alarm.enabled } : alarm) })} aria-label={`${entry.enabled ? 'Tắt' : 'Bật'} báo thức ${entry.time}`} aria-pressed={entry.enabled}><i /></button><div><strong>{entry.time}</strong><small>{entry.label || 'Báo thức'}</small></div><button onClick={() => commit({ ...phone, alarms: phone.alarms.filter(alarm => alarm.id !== entry.id) })} aria-label={`Xóa báo thức ${entry.time}`}>×</button></div>) : <Empty icon="bell" title="Chưa đặt báo thức">Đặt giờ dậy hoặc giờ nghỉ bạn mong muốn.</Empty>}<form className="phone-form" onSubmit={addAlarm}><label htmlFor="alarmTime">Giờ báo thức</label><input id="alarmTime" type="time" value={alarmTime} onChange={event => setAlarmTime(event.target.value)} required /><label htmlFor="alarmLabel">Tên báo thức</label><input id="alarmLabel" value={alarmLabel} onChange={event => setAlarmLabel(event.target.value)} maxLength={40} placeholder="Dậy sớm, bắt đầu ngày mới" /><button type="submit" className="primary wide">Lưu báo thức</button></form></>; break;
    case 'messages': body = <>{intro('Tin nhắn', 'Những lời nhắn trên hành trình.')}<article className="system-message"><span className="message-avatar"><Icon id={state.lastReport ? 'message' : 'home'} /></span><div><small>TRỢ LÝ · {state.lastReport ? shortDate(state.lastReport.day) : 'CHÀO MỪNG'}</small><h3>{state.lastReport ? 'Tổng kết ngày của bạn' : 'Một khởi đầu ở An Nhiên'}</h3><p>{state.lastReport ? `Thu ${money(state.lastReport.earn)}, sinh hoạt ${money(state.lastReport.cost)}. Bạn tích lũy thêm ${state.lastReport.xp} XP.` : 'Phòng 03 đang chờ bạn. Hãy ghé về nhà, chọn vài món đồ và bắt đầu một ngày mới.'}</p></div></article></>; break;
    case 'calls': body = <>{intro('Gọi điện', 'Kết nối với những người bạn quen.')}<div className="dial-display">{dial || 'Chưa có số'}</div><div className="dial-pad">{['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(key => <button key={key} onClick={() => setDial(value => (value + key).slice(0, 16))}>{key}</button>)}</div><div className="dial-actions"><button onClick={() => setDial(value => value.slice(0, -1))} aria-label="Xóa số vừa nhập">⌫</button><button className="dial-call" disabled aria-label="Chưa thể gọi: chưa có liên hệ NPC"><Icon id="call" /></button><button onClick={() => navigate('contacts')} aria-label="Mở danh bạ"><Icon id="people" /></button></div></>; break;
    case 'news': body = <><div className="news-masthead"><small>BẢN TIN TRONG GAME</small><h2>An Nhiên hôm nay</h2><p>{shortDate(state.day)} · Đời sống & nhịp phố</p></div><article className="news-feature"><span className="news-skyline"><Icon id="city" /></span><small>CHUYỆN KHU PHỐ</small><h3>Hẻm Nắng có một người hàng xóm mới</h3><p>{profile.name} bắt đầu cuộc sống ở phòng 03. Một chiếc bàn làm việc, một ô cửa sổ và những dự định đang đợi phía trước.</p></article><article className="phone-news-item"><small>GÓC SỐNG</small><h3>{homeOf(state).items.length} món đồ, những thay đổi nhỏ</h3><p>{homeOf(state).items.length ? `Góc phòng của ${profile.name} đã có thêm dấu ấn riêng. Đồ đã mua có thể cất và đặt lại.` : 'Một góc xanh hay ngọn đèn ấm có thể là món đầu tiên cho căn phòng mới.'}</p></article><article className="phone-news-item"><small>NHỊP SỐNG</small><h3>Chừa một khoảng cho nghỉ ngơi</h3><p>Năng lượng và stress ảnh hưởng hiệu suất công việc. Một ngày nghỉ có thể giúp bạn lấy lại cân bằng.</p></article></>; break;
    case 'work': body = <>{intro(`Công việc của ${profile.name}`, 'Từng nhiệm vụ, thêm một chút kinh nghiệm.')}<div className="phone-info-card"><small>NGHỀ HIỆN TẠI</small><h3>Lập trình viên mới</h3><p>{state.xp} XP tích lũy · Cấp {1 + Math.floor(state.xp / 100)}</p></div><div className="phone-action-list">{actionRow('briefcase', 'Đến thành phố', 'Chọn địa điểm', () => onAction('city'))}{actionRow('calendar', 'Việc cần nhớ', `${phone.appointments.length} lịch hẹn đã lưu`, () => navigate('calendar'))}{actionRow('chart', 'Thù lao & chi tiêu', 'Xem giao dịch thực tế', () => navigate('finance'))}</div></>; break;
    case 'save': {
      let backup: ReturnType<typeof backupInfo> = null;
      try { backup = backupInfo(localStorage, Date.now()); } catch { backup = null; }
      const run = (action: () => boolean, failMessage: string) => { onResetStart(true); try { if (action()) { location.reload(); return; } setNotice(failMessage); } catch { setNotice(failMessage); } onResetStart(false); };
      body = <>{intro('Giữ lại hành trình', 'Căn phòng, công việc và những ngày đã qua.')}<div className="phone-info-card"><small>BẢN LƯU HIỆN TẠI</small><h3>{profile.name} · Ngày {state.day + 1}</h3><p>{shortDate(state.day)} · {money(state.money)}<br />{homeOf(state).items.length} món nội thất · {state.xp} XP</p></div><button className="primary wide" onClick={manualSave}><Icon id="save" /> Lưu game ngay</button>
        <h3 className="phone-small-title">Đời mới</h3>
        {resetStep === 'confirm' ? <div className="phone-info-card"><small>XOÁ NHÂN VẬT</small><h3>{profile.name} · Ngày {state.day + 1}</h3><p>Nhân vật, căn phòng và {money(state.money)} sẽ bị xoá khỏi máy. Bản sao lưu được giữ {BACKUP_DAYS} ngày để bạn khôi phục.</p><div className="phone-form"><label htmlFor="resetName">Gõ đúng tên nhân vật để xác nhận</label><input id="resetName" value={resetText} onChange={e => setResetText(e.target.value)} autoComplete="off" /></div><button className="primary wide" disabled={resetText.trim() !== profile.name} onClick={() => run(() => resetLife(localStorage, Date.now()), 'Chưa sao lưu được nên chưa xoá gì cả.')}>Xoá và bắt đầu đời mới</button><button className="phone-secondary" onClick={() => { setResetStep('idle'); setResetText(''); }}>Huỷ</button></div> : <button className="phone-secondary phone-danger" onClick={() => setResetStep('confirm')}>Bắt đầu đời mới</button>}
        {backup && <div className="phone-info-card"><small>BẢN SAO LƯU · CÒN {backup.daysLeft} NGÀY</small><h3>{backup.name || 'Nhân vật cũ'} · Ngày {backup.day + 1}</h3><p>Số dư {money(backup.money)}. Khôi phục sẽ đổi chỗ với đời hiện tại, nên không bên nào bị mất.</p>{resetStep === 'restore' ? <><button className="primary wide" onClick={() => run(() => restoreBackup(localStorage, Date.now()), 'Chưa khôi phục được.')}>Đúng, khôi phục đời này</button><button className="phone-secondary" onClick={() => setResetStep('idle')}>Huỷ</button></> : <button className="phone-secondary" onClick={() => setResetStep('restore')}>Khôi phục</button>}</div>}</>; break; }
    case 'baucua': body = <BauCua shaking={bauCuaShaking} state={state} onPlay={onPlayBauCua}/>; break;
    case 'leisure': body = <>{intro('Thời gian cho bản thân', 'Sau những giờ làm việc, hãy thở một chút.')}<button className="phone-leisure-card bc-launch" onClick={()=>navigate('baucua')}><span className="leisure-art">🦀</span><span><small>TRÒ CHƠI DÂN GIAN</small><h3>Bầu cua tôm cá</h3><p>Ba xúc xắc</p><b>Vào bàn chơi ↗</b></span></button><button className="phone-leisure-card" onClick={() => onAction('day', 'rest')}><span className="leisure-art">☕</span><span><small>CÓ THỂ CHỌN</small><h3>Nghỉ ngơi trong ngày</h3><p>Nghỉ 1 giờ · Năng lượng +15 · Stress −10</p><b>Nghỉ 1 giờ ↗</b></span></button></>; break;
    case 'contacts': body = <>{intro('Danh bạ', 'Những người cùng bạn đi qua cuộc sống.')}{officeOf(state).met.length?<><div className="office-people">{STAFF.filter(p=>officeOf(state).met.includes(p.id)).map(p=><div className="phone-contact" key={p.id}><span className="office-avatar" style={{background:p.color}}>{p.initial}</span><span><strong>{p.name}</strong><small>{p.role}</small></span></div>)}</div></>:<Empty icon="people" title="Chưa có liên hệ">Ghé sảnh khu văn phòng và chào hỏi để thêm người quen vào danh bạ.</Empty>}<div className="phone-feature-row"><span>Đồng nghiệp</span><span>Bạn bè</span><span>Gia đình</span></div><div className="phone-action-list">{actionRow('message', 'Tin nhắn', 'Đọc lời nhắn từ trợ lý', () => navigate('messages'))}{actionRow('call', 'Bàn phím gọi', 'Giao diện gọi trong game', () => navigate('calls'))}</div></>; break;
    case 'notes': body = <>{intro('Ghi chú', 'Dành một chỗ cho những dự định.')}<form className="phone-form" onSubmit={saveNotes}><label htmlFor="phoneNotes">Ghi chú cá nhân</label><textarea id="phoneNotes" value={notesDraft} onChange={event => setNotesDraft(event.target.value)} maxLength={4000} rows={12} placeholder="Mục tiêu mua nhà, món đồ muốn mua, điều cần học…" /><button type="submit" className="primary wide">Lưu ghi chú</button></form></>; break;
    case 'shop': body = <FurnitureShop state={state} onBuy={onBuyFurniture} onLife={onLifeAction}/>; break;
    case 'clock': body = <>{intro('Đồng hồ trong game', 'Buổi sáng, một khởi đầu mới.')}<div className="clock-page"><Clock minute={clockOf(state).minute}/><h2>{clockText(state)}</h2><p>{dateText(state.day)}</p></div><button className="primary wide" onClick={() => navigate('alarms')}>Mở báo thức</button></>; break;
    case 'weather': body = <>{intro('Thời tiết An Nhiên', 'Một khoảng trời bên ô cửa.')}<div className="weather-page"><Icon id="sun" /><h2>26°</h2><h3>Trời trong</h3><p>Khung cảnh hiện tại của thành phố.</p></div></>; break;
    case 'map': body = <>{intro('Khám phá An Nhiên', 'Những con đường, những cơ hội.')}<button className="primary wide" onClick={() => onAction('city')}>Mở bản đồ thành phố</button></>; break;
    case 'room': body = <>{intro('Nhà trọ Hẻm Nắng', `Phòng 03 · Chốn về của ${profile.name}.`)}<div className="phone-map-preview"><img src="assets/room-master.webp" alt="Ảnh mẫu phòng đủ nội thất" /></div><button className="primary wide" onClick={() => onAction('room')}>Về nhà</button></>; break;
    case 'settings': body = <><button className="primary wide" onClick={() => onAction('replay')}>Xem lại mở đầu</button>{intro('Cài đặt điện thoại', 'Một nơi cho các tiện ích của bạn.')}<div className="phone-action-list">{actionRow('save', 'Lưu game', 'Kiểm tra và lưu tiến độ', () => navigate('save'))}{actionRow('note', 'Ghi chú', 'Lưu mục tiêu và ý tưởng', () => navigate('notes'))}{actionRow('bell', 'Báo thức', 'Chuẩn bị lịch theo giờ', () => navigate('alarms'))}</div><h3 className="phone-small-title">Ứng dụng</h3><InstallCard /><VersionCard /></>; break;
  }
  const title = APPS.find(app => app.page === page)?.label ?? TITLES[page] ?? 'Điện thoại';
  return <div className={`phone-shell ${page === 'home' ? 'is-home' : ''} ${page === 'baucua' ? 'is-baucua' : ''}`}><div className="phone-status"><span>{clockText(state)}</span><span className="phone-island" /><span>▮▮▮ <svg aria-hidden="true" viewBox="0 0 24 12"><rect x="1" y="1" width="19" height="10" rx="2" /><path d="M23 4v4M4 4h13v4H4z" /></svg></span></div><div className="phone-toolbar">{page === 'home' ? <span className="phone-owner">{profile.name} </span> : <><button className="phone-back" onClick={() => navigate(page === 'baucua' ? 'leisure' : 'home')} aria-label={page === 'baucua' ? 'Về mục Giải trí' : 'Về màn hình điện thoại'}>‹</button><strong>{title}</strong></>}</div><div className="phone-content" ref={contentRef} tabIndex={-1} role="region" aria-label="Nội dung điện thoại">{notice && <p className="phone-footnote" role="status">{notice}</p>}{body}</div><nav className="phone-dock" aria-label="Ứng dụng thường dùng">{DOCK.map(app => <button key={app.page} onClick={() => navigate(app.page)} className={`dock-app ${app.page}-app ${page === app.page ? 'selected' : ''}`} aria-label={app.label} aria-pressed={page === app.page}><Icon id={app.icon} /></button>)}</nav><button className="phone-homebar" onClick={() => navigate('home')} aria-label="Về màn hình chính điện thoại"><span /></button></div>;
}
