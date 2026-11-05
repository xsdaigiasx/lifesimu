import {useState} from 'react';
import type {GameResult,GameState} from '../domain/types';
import {CRAFT_NAME,PROJ,forecast,loadOf,projectsOf,repOfCompany,type Offer,type ProjectAction} from '../domain/projects';
import {staffOf,levelOf} from '../domain/hiring';
import {FX,workAt} from '../domain/staff';
import {fundOf} from '../domain/company';
import {hash} from '../domain/shift';
import {money} from '../domain/format';
import {ActionRow,DataRow,GameScreen,Facts} from './GameUI';

type Page='list'|'offer'|'work';
const TRAIT:Record<string,string>={urgent:'Gấp',risky:'Rủi ro cao',routine:'Lặp lại',client:'Tiếp khách',team:'Làm nhóm',solo:'Làm một mình',reward:'Có thưởng thêm',long:'Dài hạn',easy:'Dễ',hard:'Khó',picky:'Khách khó tính'};
const PICKY=['Dễ tính','Hơi kỹ','Khó tính'];
const COLORS=['#b07f6b','#9a7d46','#8c6aa0','#6f8b5c','#5b7f8c','#b0875a'];
const Avatar=({id,name}:{id:string;name:string})=><span className="hire-avatar" style={{background:COLORS[hash(id)%COLORS.length]}}>{name.split(' ').pop()![0]}</span>;
const traitsOf=(o:Offer)=>o.traits.map(t=>TRAIT[t]).filter(Boolean).join(', ')||'Bình thường';

/** T46: dự án và giao việc trong văn phòng công ty. Mỗi màn một việc: danh sách, dự án mời, giao việc và theo dõi. */
export default function Projects({state,onAction,onBack}:{state:GameState;onAction:(a:ProjectAction)=>GameResult;onBack:()=>void}){
 const [page,setPage]=useState<Page>('list'),[id,setId]=useState(''),[error,setError]=useState('');
 const run=(a:ProjectAction,after?:()=>void)=>{const r=onAction(a);if(!r.ok){setError(r.error);return}setError('');after?.()};
 const ps=projectsOf(state),team=staffOf(state),offer=ps.offers.find(o=>o.id===id),proj=ps.active.find(p=>p.id===id);
 const status=error&&<p className="game-status" role="status">{error}</p>;
 const goList=()=>{setPage('list');setId('');setError('')};
 const open=(p:Page,to:string)=>{setId(to);setPage(p);setError('')};
 if(page==='offer'){
  if(!offer)return <GameScreen title="Dự án" onBack={goList}><p className="game-faint">Dự án này không còn.</p></GameScreen>;
  return <GameScreen title={offer.title} onBack={goList} footer={<div className="game-button-pair"><button className="game-secondary" onClick={()=>run({kind:'projDecline',id:offer.id},goList)}>Từ chối</button><button className="primary" disabled={!team.length||ps.active.length>=PROJ.maxActive} onClick={()=>run({kind:'projAccept',id:offer.id},()=>open('work',offer.id))}>Nhận dự án</button></div>}>
   <DataRow label="Khách" value={offer.client}/><DataRow label="Yêu cầu" value={`${CRAFT_NAME[offer.skill]} Lv ${offer.lv}`}/><DataRow label="Giờ chuẩn" value={`${offer.hours} giờ`}/><DataRow label="Hạn" value={`${offer.days} ngày`}/><DataRow label="Thưởng" value={money(offer.reward)}/><DataRow label="Độ khó" value={`${offer.difficulty}/5`}/><DataRow label="Khách" value={PICKY[offer.picky]}/><DataRow label="Tính chất" value={traitsOf(offer)}/>
   {!team.length&&<p className="game-faint">Cần có nhân viên để nhận dự án.</p>}{status}</GameScreen>}
 if(page==='work'){
  if(!proj)return <GameScreen title="Dự án" onBack={goList}><p className="game-faint">Dự án này không còn.</p></GameScreen>;
  const f=forecast(state,proj),pct=Math.min(100,Math.round(proj.progress/proj.hours*100)),left=proj.due-state.day,checks=PROJ.maxChecks-proj.checks;
  return <GameScreen title={proj.title} onBack={goList} footer={<button className="primary wide" disabled={proj.checks>=PROJ.maxChecks||!proj.team.length} onClick={()=>run({kind:'projCheck',id:proj.id})}>Kiểm tra tiến độ <Facts items={[['clock',`${PROJ.checkMinutes} phút`]]}/></button>}>
   <div className="profile-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${pct}%`}}/></div>
   <DataRow label="Tiến độ" value={`${pct}%`}/><DataRow label="Hạn" value={left>=0?`Còn ${left} ngày`:`Trễ ${-left} ngày`}/><DataRow label="Yêu cầu" value={`${CRAFT_NAME[proj.skill]} Lv ${proj.lv}`}/><DataRow label="Thưởng" value={money(proj.reward)}/>
   {f.rate<=0?<DataRow label="Dự kiến" value="Chưa có người làm"/>:<><DataRow label="Dự kiến xong" value={f.range.days?`${f.range.days.lo}–${f.range.days.hi} ngày`:'Chưa rõ'}/><DataRow label="Kịp hạn?" value={!f.range.days?'Chưa rõ':f.range.days.hi<=left?'Có vẻ kịp':f.range.days.lo>left?'Có vẻ trễ':'Có thể trễ'}/><DataRow label="Lỗi ước tính" value={`${Math.round(f.range.err.lo*100)}–${Math.round(f.range.err.hi*100)}%`}/><DataRow label="Độ biết nhóm" value={`${f.know}/100`}/></>}
   <p className="game-faint">Giao việc ({proj.team.length}/{PROJ.maxTeam}). Còn {checks} lần kiểm tra.</p>
   {team.length?<div className="hire-grid">{team.map(e=>{const on=proj.team.includes(e.id),w=workAt(e,state.day),load=loadOf(ps,e.id),main=Math.max(e.skills.programming,e.skills.logic,e.skills.graphics);
    return <button key={e.id} className="hire-card" aria-pressed={on} style={on?{borderColor:'#6f9a5b',background:'#eef5e3'}:undefined} onClick={()=>run({kind:on?'projUnassign':'projAssign',id:proj.id,emp:e.id})}>
     <Avatar id={e.id} name={e.name}/><strong>{e.name}</strong><small>{levelOf(main).name}, {e.personality}</small>
     <Facts items={[['smile',String(Math.round(w.morale))],['moon',String(Math.round(w.fatigue))],['box',`${load}/${FX[e.personality].loadCap}`]]}/><small>{on?'Đang giao':'Chạm để giao'}</small></button>})}</div>:<p className="game-faint">Chưa có nhân viên.</p>}
   {status}</GameScreen>}
 return <GameScreen title="Dự án" onBack={onBack}>
  <DataRow label="Uy tín công ty" value={String(repOfCompany(state))}/><DataRow label="Quỹ công ty" value={money(fundOf(state))}/>
  {status}
  {ps.active.length>0&&<><p className="game-faint">Đang làm ({ps.active.length}/{PROJ.maxActive})</p><div className="game-actions">{ps.active.map(p=><ActionRow key={p.id} icon="briefcase" label={p.title} facts={[['bolt',`${Math.min(100,Math.round(p.progress/p.hours*100))}%`],['clock',p.due>=state.day?`${p.due-state.day} ngày`:`Trễ ${state.day-p.due}`],['coin',money(p.reward)]]} onClick={()=>open('work',p.id)}/>)}</div></>}
  <p className="game-faint">Dự án mời</p>
  {ps.offers.length?<div className="game-actions">{ps.offers.map(o=><ActionRow key={o.id} icon="news" label={o.title} facts={[['calendar',`${CRAFT_NAME[o.skill]} Lv ${o.lv}`],['clock',`${o.days} ngày`],['coin',money(o.reward)]]} onClick={()=>open('offer',o.id)}/>)}</div>:<p className="game-faint">Chưa có dự án mới.</p>}
  {ps.done.length>0&&<><p className="game-faint">Kết quả gần đây</p>{ps.done.slice(0,5).map(r=><DataRow key={r.id} label={r.title} value={r.canceled?'Khách huỷ':`${r.stars} sao, ${money(r.pay)}`}/>)}</>}
 </GameScreen>}
