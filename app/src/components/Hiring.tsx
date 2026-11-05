import {useState} from 'react';
import type {GameResult,GameState} from '../domain/types';
import {HIRING,HIRE_SKILLS,HIRE_SKILL_NAME,candidatesOf,capacityOf,hiringOf,levelOf,postActive,staffOf,viewOf,type CandidateView,type HireSkill,type HiringAction,type InterviewKind} from '../domain/hiring';
import {fundOf} from '../domain/company';
import {hash} from '../domain/shift';
import {money} from '../domain/format';
import {ActionRow,DataRow,GameScreen,Facts} from './GameUI';

type Page='list'|'cand'|'hire'|'team';
const COLORS=['#ad7d69','#507e87','#b98460','#7a8f5d','#8a6f9e','#9a7f4a'];
const Avatar=({v}:{v:{id:string;name:string}})=><span className="hire-avatar" style={{background:COLORS[hash(v.id)%COLORS.length]}}>{v.name.split(' ').pop()![0]}</span>;
const WARN=['Thấp','Vừa','Cao'];
const warnText=(v:CandidateView)=>!v.warn?'Chưa rõ':v.warn.kind==='ref'?WARN[v.warn.level]!:v.warn.level?'Có dấu hiệu':'Chưa thấy dấu hiệu';

/** T44: tuyển dụng trong văn phòng công ty. Mỗi màn một việc: danh sách, hồ sơ, xác nhận thuê, nhân viên. */
export default function Hiring({state,onAction,onBack}:{state:GameState;onAction:(a:HiringAction)=>GameResult;onBack:()=>void}){
 const [page,setPage]=useState<Page>('list'),[id,setId]=useState(''),[error,setError]=useState(''),[pick,setPick]=useState<'tech'|'test'|null>(null);
 const run=(a:HiringAction,after?:()=>void)=>{const r=onAction(a);if(!r.ok){setError(r.error);return}setError('');after?.()};
 const list=candidatesOf(state),h=hiringOf(state),cand=list.find(c=>c.id===id),team=staffOf(state),cap=capacityOf(state);
 const status=error&&<p className="game-status" role="status">{error}</p>;
 const goList=()=>{setPage('list');setId('');setPick(null);setError('')};
 if(page==='team')return <GameScreen title="Nhân viên" onBack={goList}>{team.length?team.map(e=>{const main=Math.max(e.skills.programming,e.skills.logic,e.skills.graphics);return <DataRow key={e.id} label={`${e.name} ${levelOf(main).name}`} value={money(e.wage)}/>}):<p className="game-faint">Chưa có nhân viên.</p>}</GameScreen>;
 if(page!=='list'&&!cand){return <GameScreen title="Hồ sơ" onBack={goList}><p className="game-faint">Hồ sơ này không còn.</p></GameScreen>}
 if(page==='hire'&&cand){const v=viewOf(state,cand);return <GameScreen title="Thuê nhân viên" onBack={()=>setPage('cand')} footer={<div className="game-button-pair"><button className="game-secondary" onClick={()=>setPage('cand')}>Hủy</button><button className="primary" onClick={()=>run({kind:'hire',id:cand.id},goList)}>Xác nhận</button></div>}>
  <DataRow label="Nhân viên" value={v.name}/><DataRow label="Lương mỗi tháng" value={money(v.wage)}/><DataRow label="Phí tuyển" value={money(v.fee)}/><DataRow label="Quỹ công ty" value={money(fundOf(state))}/><DataRow label="Chỗ ngồi" value={`${team.length+1}/${cap}`}/>{status}</GameScreen>}
 if(page==='cand'&&cand){
  const v=viewOf(state,cand),full=team.length>=cap,ask=(what:InterviewKind,skill?:HireSkill)=>run({kind:'interview',id:cand.id,what,skill},()=>setPick(null));
  const T=HIRING.times,btn=(label:string,what:InterviewKind,done=false,off=false)=><button key={what} className="game-secondary" disabled={done||off} onClick={()=>what==='tech'||what==='test'?setPick(pick===what?null:what):ask(what)}>{label}<Facts items={[['clock',`${T[what]}`]]}/></button>;
  return <GameScreen title={v.name} onBack={goList} footer={<div className="game-button-pair"><button className="game-secondary" onClick={()=>run({kind:'decline',id:cand.id},goList)}>Từ chối</button><button className="primary" disabled={full} onClick={()=>setPage('hire')}>Thuê</button></div>}>
   <div className="hire-head"><Avatar v={v}/><div><strong>{v.level}</strong><small>{v.origin}, {v.age} tuổi</small></div><Facts items={[['coin',money(v.wage)],['calendar',`${v.years} năm`]]}/></div>
   {HIRE_SKILLS.map(k=>{const s=v.skills[k];return <DataRow key={k} label={HIRE_SKILL_NAME[k]} value={`Lv ${s.claim}${s.est?` ước ${s.est.lo}-${s.est.hi}`:''}${v.flags?.includes(k)?' khai cao':''}`}/>})}
   <DataRow label="Tính cách" value={v.personality??v.hint}/><DataRow label="Động lực" value={v.motive??'Chưa rõ'}/><DataRow label="Rủi ro" value={warnText(v)}/>
   <div className="hire-actions">{btn('Đọc CV','cv',v.done.cv)}{btn('Kỹ thuật','tech')}{btn('Bài test','test')}{btn('Tình huống','situation',v.done.sit)}{btn('Động lực','motive',v.done.mot)}{btn('Người giới thiệu','ref',v.done.ref,!v.hasRef)}</div>
   {pick&&<div className="hire-actions">{HIRE_SKILLS.map(k=><button key={k} className="game-secondary" disabled={pick==='test'&&!!hiringOf(state)?.progress[cand.id]?.test?.[k]} onClick={()=>ask(pick,k)}>{HIRE_SKILL_NAME[k]}</button>)}</div>}
   {full&&<p className="game-faint">Văn phòng hết chỗ ngồi.</p>}{status}</GameScreen>;
 }
 const posted=postActive(state),left=h?Math.max(0,h.postedDay+HIRING.postDays-state.day):0;
 return <GameScreen title="Tuyển dụng" onBack={onBack}>
  <div className="game-actions">{posted?<ActionRow icon="news" label="Tin tuyển dụng" facts={[['calendar',`${left} ngày`]]} onClick={()=>{}} disabled/>:<ActionRow icon="news" label="Đăng tin tuyển dụng" facts={[['coin',money(HIRING.postFee)]]} onClick={()=>run({kind:'post'})}/>}
   <ActionRow icon="people" label="Nhân viên" value={`${team.length}/${cap}`} onClick={()=>setPage('team')}/></div>
  {list.length?<div className="hire-grid">{list.map(c=>{const v=viewOf(state,c);return <button key={c.id} className="hire-card" onClick={()=>{setId(c.id);setPage('cand');setError('');setPick(null)}}><Avatar v={v}/><strong>{v.name}</strong><small>{v.level}</small><Facts items={[['coin',money(v.wage)],['calendar',`${v.years} năm`]]}/></button>})}</div>:<p className="game-faint">{posted?'Chưa có hồ sơ mới. Mỗi 7 ngày có thêm hồ sơ.':'Đăng tin để nhận hồ sơ.'}</p>}
  {status}</GameScreen>;
}
