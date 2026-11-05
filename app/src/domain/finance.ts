import type {GameState} from './types';
import type {CompanyState} from './company';
import {dateAt,money} from './format';
import {hash} from './shift';
import {wageMult} from './policy';
import {recordJournal} from './journal';
import {SIZES,officeOf} from './office';
import {staffOf,type Employee} from './hiring';
import {workAt,type WorkState} from './staff';

/** T47 (Kế hoạch mục 36; chủ dự án duyệt 05/11): dòng tiền dự án, lương ngày 1, nợ lương, runway.
 *  Khách ứng 30% khi nhận dự án, phần còn lại trả sau 30 ngày (1 trong 5 khách trả chậm thêm 7 đến 15 ngày).
 *  Quỹ không đủ lương: nợ lương, người chưa được trả mất tinh thần và gắn bó mỗi ngày, quá 7 ngày thì xin nghỉ.
 *  Chưa có: vay công ty (nên chi phí cố định chưa có lãi vay), chi tiêu quỹ ngoài văn phòng và tuyển dụng. */
export const FIN={advancePct:30,payDays:30,slowChance:20,slowMin:7,slowMax:15,repUnpaid:-3,quitDays:7,moraleHit:3,loyaltyHit:3,warnYellow:2,warnRed:1,maxRecv:40,maxDebts:100,logMax:12,catchUp:90} as const;

export interface Receivable{id:string;title:string;client:string;amount:number;due:number}
export interface WageDebt{emp:string;name:string;amount:number;since:number;/** Người đã nghỉ: vẫn phải trả khi quỹ có tiền. */left?:boolean}
export interface LedgerLine{day:number;label:string;amount:number}
export interface FinanceState{version:1;last:number;recv:Receivable[];debts:WageDebt[];/** Sổ cái riêng của công ty, mới nhất trước. */log:LedgerLine[]}

const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
const round1000=(v:number)=>Math.round(v/1000)*1000;
const empty=(last:number):FinanceState=>({version:1,last,recv:[],debts:[],log:[]});
export const financeOf=(s:GameState):FinanceState=>s.company?.finance??empty(s.day-1);

/** Khoản khách ứng khi nhận dự án. */
export const advanceOf=(reward:number)=>round1000(reward*FIN.advancePct/100);
/** Số ngày khách trả chậm thêm, theo seed của dự án. */
export const slowDays=(id:string)=>hash(`slow:${id}`)%100<FIN.slowChance?FIN.slowMin+hash(`slow2:${id}`)%(FIN.slowMax-FIN.slowMin+1):0;

/** Ghi một dòng vào sổ cái công ty (không đổi quỹ). */
export function book(co:CompanyState,day:number,label:string,amount:number){
 const f=co.finance??=empty(day-1);f.log=[{day,label,amount},...f.log].slice(0,FIN.logMax)}
/** Khoản khách còn nợ sau khi giao dự án. */
export function addReceivable(co:CompanyState,day:number,r:Receivable){
 const f=co.finance??=empty(day-1);f.recv=[...f.recv,r].slice(-FIN.maxRecv)}

/** Lương tháng ngày d: người mới thuê trả theo số ngày đã làm (tối đa 30). */
export const wageDue=(e:Employee,day:number)=>{const days=day-e.hiredDay;return days<=0?0:round1000(e.wage*Math.min(30,days)/30)};
/** Lương thực trả ngày d: lương theo ngày làm nhân hệ số chính sách (dùng chung cho trả lương và bảng lương). */
export const wageAmount=(e:Employee,day:number,co?:CompanyState)=>Math.round(wageDue(e,day)*wageMult(co)/1000)*1000;

/** Qua ngày: khách trả tiền, trả nợ lương, trả lương ngày 1, phạt nợ lương. Tối đa 90 ngày bù, idempotent theo `last`. */
export function settleFinance(next:GameState):GameState{
 if(!next.company)return next;
 const last=next.company.finance?.last??next.day-1;if(last>=next.day)return next;
 const n=structuredClone(next);const c=n.company!;const f=c.finance??=empty(last);
 let staff=c.staff??[];const works=new Map<string,WorkState>();
 const touch=(e:Employee)=>{let w=works.get(e.id);if(!w){w=e.work??workAt(e,next.day);works.set(e.id,w)}return w};
 const notes:[string,string,string][]=[];
 for(let d=Math.max(last+1,next.day-FIN.catchUp+1);d<=next.day;d++){
  const due=f.recv.filter(r=>r.due<=d);
  if(due.length){f.recv=f.recv.filter(r=>r.due>d);for(const r of due){c.fund+=r.amount;book(c,d,`${r.client}: ${r.title}`,r.amount);notes.push([`recv:${r.id}`,'Khách thanh toán',`${r.client} trả ${money(r.amount)} cho ${r.title}.`])}}
  f.debts=f.debts.filter(x=>{if(x.amount>c.fund)return true;c.fund-=x.amount;book(c,d,`Trả nợ lương ${x.name}`,-x.amount);return false});
  if(dateAt(d).getUTCDate()===1){
   let missed=0,paidN=0,paidSum=0;
   for(const e of staff){const amt=wageAmount(e,d,c);if(amt<=0)continue;
    if(amt<=c.fund){c.fund-=amt;paidN++;paidSum+=amt;book(c,d,`Lương ${e.name}`,-amt)}else{f.debts.push({emp:e.id,name:e.name,amount:amt,since:d});missed++}}
   if(paidN){const t=dateAt(d);notes.push([`paid:${d}`,'Đã trả lương',`Tháng ${t.getUTCMonth()===0?12:t.getUTCMonth()}/${t.getUTCMonth()===0?t.getUTCFullYear()-1:t.getUTCFullYear()}: ${money(paidSum)} cho ${paidN} người.`])}
   if(missed){c.rep=clamp((c.rep??50)+FIN.repUnpaid,0,100);notes.push([`payday:${d}`,'Chưa đủ tiền trả lương',`Quỹ không đủ trả lương cho ${missed} người, uy tín công ty giảm.`])}}
  for(const e of [...staff]){
   const owed=f.debts.filter(x=>x.emp===e.id&&!x.left);if(!owed.length)continue;
   const w=touch(e);works.set(e.id,{...w,morale:clamp(w.morale-FIN.moraleHit,0,100),loyalty:clamp(w.loyalty-FIN.loyaltyHit,0,100)});
   if(d-Math.min(...owed.map(x=>x.since))>=FIN.quitDays){
    staff=staff.filter(x=>x.id!==e.id);works.delete(e.id);for(const x of f.debts)if(x.emp===e.id)x.left=true;
    for(const p of c.projects?.active??[])p.team=p.team.filter(id=>id!==e.id);
    notes.push([`quit:${e.id}:${d}`,`${e.name} xin nghỉ`,`${e.name} nghỉ vì bị nợ lương.`])}}
 }
 f.last=next.day;f.debts=f.debts.slice(-FIN.maxDebts);
 if(c.staff)c.staff=staff.map(e=>{const w=works.get(e.id);return w?{...e,work:{...w,day:Math.max(w.day,next.day)}}:e});
 let out=n;for(const[key,title,detail]of notes)out=recordJournal(out,key,title,detail);
 return out}

/** Chi phí cố định mỗi tháng: lương và thuê văn phòng (chưa có vay công ty nên chưa có lãi vay). */
export const monthlyCost=(s:GameState)=>Math.round(staffOf(s).reduce((a,e)=>a+e.wage,0)*wageMult(s.company))+(officeOf(s).role==='owner'?SIZES[officeOf(s).size].rent:0);
export const owedWages=(s:GameState)=>financeOf(s).debts.reduce((a,x)=>a+x.amount,0);
export const incomingOf=(s:GameState)=>[...financeOf(s).recv].sort((a,b)=>a.due-b.due);
export type RunwayLevel='ok'|'warn'|'danger';
/** Runway: số tháng quỹ (trừ nợ lương) còn chi trả được chi phí cố định; khoản khách sắp trả không tính. */
export function runwayOf(s:GameState):{months:number|null;level:RunwayLevel}{
 const cost=monthlyCost(s),owed=owedWages(s);
 if(cost<=0)return{months:null,level:owed>0?'danger':'ok'};
 const months=Math.round(Math.max(0,(s.company?.fund??0)-owed)/cost*10)/10;
 return{months,level:owed>0||months<FIN.warnRed?'danger':months<FIN.warnYellow?'warn':'ok'}}
export const runwayText=(months:number|null)=>months===null?'Chưa có chi phí':`${String(months).replace('.',',')} tháng`;

export function validFinance(v:unknown,day:number):v is FinanceState{
 if(!v||typeof v!=='object')return false;const f=v as FinanceState;
 return f.version===1&&Number.isInteger(f.last)&&f.last>=-1&&f.last<=day
  &&Array.isArray(f.recv)&&f.recv.length<=FIN.maxRecv&&f.recv.every(r=>!!r&&typeof r.id==='string'&&r.id.length<12&&typeof r.title==='string'&&r.title.length<80&&typeof r.client==='string'&&r.client.length<60&&Number.isInteger(r.amount)&&r.amount>=0&&r.amount<=1e9&&Number.isInteger(r.due)&&r.due>=0&&r.due<=day+400)
  &&Array.isArray(f.debts)&&f.debts.length<=FIN.maxDebts&&f.debts.every(x=>!!x&&typeof x.emp==='string'&&x.emp.length<40&&typeof x.name==='string'&&x.name.length<60&&Number.isInteger(x.amount)&&x.amount>=0&&x.amount<=1e9&&Number.isInteger(x.since)&&x.since>=0&&x.since<=day&&(x.left===undefined||typeof x.left==='boolean'))
  &&Array.isArray(f.log)&&f.log.length<=FIN.logMax&&f.log.every(l=>!!l&&Number.isInteger(l.day)&&l.day>=0&&l.day<=day&&typeof l.label==='string'&&l.label.length<100&&Number.isFinite(l.amount)&&Math.abs(l.amount)<=2e9)}
