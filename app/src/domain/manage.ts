import type {GameResult,GameState} from './types';
import {KNOW,staffOf,HIRE_SKILLS,type Employee,type HireSkill} from './hiring';
import {bondOf,knowGain,withKnow,workAt} from './staff';
import {book} from './finance';
import {spendTime} from './time';
import {recordJournal} from './journal';
import {removeEmployee} from './hr';
import {POL,policyOf,type PolicyState} from './policy';

/** T49 (Kế hoạch mục 37 và 38; chủ dự án duyệt 05/11): họp 1-1, đào tạo, cảnh cáo, sa thải, chính sách. Mọi thao tác là nguyên tử:
 *  tính xong trên bản sao rồi mới trả về, thiếu quỹ thì không đổi gì. Số liệu là đề xuất, chỉnh ở T50. */
export const MG={talkMinutes:20,talkGap:7,talkBond:3,talkMorale:2,trainCost:3_000_000,trainDays:5,trainGap:60,trainExp:3,trainLoyalty:5,trainBond:2,warnMorale:-8,warnBond:-6,warnLoyalty:-3,warnMax:3,warnFade:90,fireMonths:1,fireTeamMorale:-4,fireTeamBond:-2} as const;
export type MgAction={kind:'mgTalk';emp:string}|{kind:'mgTrain';emp:string;skill:HireSkill}|{kind:'mgWarn';emp:string}|{kind:'mgFire';emp:string}|{kind:'mgPolicy';key:'overtime'|'remote'|'perk'|'candor';value:boolean|'open'|'closed'|null};
const fail=(error:string):GameResult=>({ok:false,error});
const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
const r100=(v:number)=>Math.round(v/100_000)*100_000;
/** Số lần cảnh cáo còn hiệu lực (hết sau 90 ngày không bị cảnh cáo thêm). */
export const warnsOf=(e:Employee,day:number)=>e.warnDay!==undefined&&day-e.warnDay>MG.warnFade?0:e.warns??0;
export const severance=(e:Employee)=>r100(e.wage*MG.fireMonths);
export const canTalk=(e:Employee,day:number)=>e.talkDay===undefined||day-e.talkDay>=MG.talkGap;
export const canTrain=(e:Employee,day:number)=>!e.train&&(e.trainedDay===undefined||day-e.trainedDay>=MG.trainGap);

function patch(n:GameState,id:string,fn:(e:Employee)=>Employee){const c=n.company!;c.staff=(c.staff??[]).map(e=>e.id===id?fn(e):e)}
function bump(n:GameState,id:string,morale:number,bond:number,loyalty:number){patch(n,id,e=>{const w=workAt(e,n.day);return{...e,bond:clamp(bondOf(e)+bond,0,100),work:{...w,morale:clamp(w.morale+morale,0,100),loyalty:clamp(w.loyalty+loyalty,0,100),day:Math.max(w.day,n.day)}}})}

export function manageAction(s:GameState,a:MgAction):GameResult{
 if(!s.company)return fail('Bạn chưa có công ty.');
 if(a.kind==='mgPolicy'){
  const n=structuredClone(s),p:PolicyState=n.company!.policy??={};
  if(a.key==='candor'){if(a.value==='open'||a.value==='closed')p.candor=a.value;else if(a.value===null||a.value===false)delete p.candor;else return fail('Giá trị không hợp lệ.')}
  else if(typeof a.value==='boolean'){if(a.value)p[a.key]=true;else delete p[a.key]}else return fail('Giá trị không hợp lệ.');
  p.last=n.day;return{ok:true,state:n}}
 const e=staffOf(s).find(x=>x.id===a.emp);if(!e)return fail('Nhân viên này không còn.');
 let n=structuredClone(s);const c=n.company!,day=n.day;
 if(a.kind==='mgTalk'){
  if(!canTalk(e,day))return fail(`Mới họp 1-1 gần đây, ${MG.talkGap} ngày mới họp lại được.`);
  const t=spendTime(n,MG.talkMinutes);if(!t.ok)return t;n=t.state;
  patch(n,e.id,x=>({...withKnow(x,knowGain(x,KNOW.talk)),talkDay:day}));bump(n,e.id,MG.talkMorale,MG.talkBond,0);
  return{ok:true,state:recordJournal(n,`mg:talk:${e.id}:${day}`,`Họp 1-1 với ${e.name}`,'Hai bên nói chuyện thẳng thắn.')}}
 if(a.kind==='mgTrain'){
  if(!HIRE_SKILLS.includes(a.skill))return fail('Kỹ năng không hợp lệ.');
  if(e.train)return fail(`${e.name} đang học.`);if(!canTrain(e,day))return fail(`Mỗi người một khoá mỗi ${MG.trainGap} ngày.`);
  if(c.fund<MG.trainCost)return fail('Quỹ công ty chưa đủ.');
  c.fund-=MG.trainCost;book(c,day,`Đào tạo ${e.name}`,-MG.trainCost);
  patch(n,e.id,x=>({...x,train:{skill:a.skill,until:day+MG.trainDays},trainedDay:day}));
  return{ok:true,state:recordJournal(n,`mg:train:${e.id}:${day}`,`${e.name} đi học`,`Khoá ${MG.trainDays} ngày, trong lúc học chỉ làm nửa giờ.`)}}
 if(a.kind==='mgWarn'){
  const w=warnsOf(e,day)+1;
  if(w>=MG.warnMax){removeEmployee(n,e.id);return{ok:true,state:recordJournal(n,`mg:warn:${e.id}:${day}`,`${e.name} nghỉ việc`,'Bị cảnh cáo lần thứ ba, em xin nghỉ.')}}
  patch(n,e.id,x=>({...x,warns:w,warnDay:day}));bump(n,e.id,MG.warnMorale,MG.warnBond,MG.warnLoyalty);
  return{ok:true,state:recordJournal(n,`mg:warn:${e.id}:${day}`,`Cảnh cáo ${e.name}`,`Lần ${w}/${MG.warnMax}, ${e.name} im lặng nhận lỗi.`)}}
 // sa thải
 const pay=severance(e);if(c.fund<pay)return fail('Quỹ công ty chưa đủ bồi thường.');
 c.fund-=pay;book(c,day,`Bồi thường ${e.name}`,-pay);
 removeEmployee(n,e.id);for(const o of staffOf(n))bump(n,o.id,MG.fireTeamMorale,MG.fireTeamBond,0);
 return{ok:true,state:recordJournal(n,`mg:fire:${e.id}:${day}`,`Sa thải ${e.name}`,'Cả nhóm lặng đi vài hôm.')}}

/** Qua ngày: khoá học xong thì cộng kinh nghiệm, chính sách đổi tinh thần/mệt mỏi mỗi ngày (idempotent theo `policy.last`). */
export function settleManage(next:GameState):GameState{
 const co=next.company;if(!co||!(co.staff??[]).length)return next;
 const p=policyOf(co),last=p.last??next.day-1;
 const done=(co.staff??[]).filter(e=>e.train&&next.day>e.train.until);
 const days=clamp(next.day-last,0,POL.catchUp),act=p.overtime||p.remote||p.perk;
 if(!done.length&&!(act&&days>0))return co.policy&&co.policy.last!==next.day?{...next,company:{...co,policy:{...co.policy,last:next.day}}}:next;
 const n=structuredClone(next),c=n.company!;let out=n;
 c.staff=(c.staff??[]).map(e=>{let w=workAt(e,n.day),x=e;
  if(days>0){const q=policyOf(c);w={...w,
   fatigue:clamp(w.fatigue+days*((q.overtime?POL.overtimeFatigue:0)+(q.remote?POL.remoteFatigue:0)),0,100),
   loyalty:clamp(w.loyalty+days*((q.overtime?POL.overtimeLoyalty:0)+(q.perk?POL.perkLoyalty:0)),0,100),
   morale:clamp(w.morale+days*((q.perk?POL.perkMorale:0)+(q.remote?POL.remoteMorale:0)),0,100),day:Math.max(w.day,n.day)};x={...x,work:w}}
  if(x.train&&n.day>x.train.until){const k=x.train.skill,ww=x.work??w,exp={...(ww.exp??{}),[k]:((ww.exp??{})[k]??0)+MG.trainExp};
   x={...x,train:undefined,bond:clamp(bondOf(x)+MG.trainBond,0,100),work:{...ww,exp,loyalty:clamp(ww.loyalty+MG.trainLoyalty,0,100),day:Math.max(ww.day,n.day)}};delete x.train}
  return x});
 if(c.policy)c.policy={...c.policy,last:n.day};
 for(const e of done)out=recordJournal(out,`mg:trained:${e.id}:${e.train!.until}`,`${e.name} học xong`,'Khoá học kết thúc, em thấy vững hơn.');
 return out}
