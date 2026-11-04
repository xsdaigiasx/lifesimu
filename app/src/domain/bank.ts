import type {GameState,GameResult} from './types';
import {post} from './money';
import {clockOf,spendTime} from './time';
import {officeOf} from './office';
import {salaryFor} from './work';

/** T30: vay trả góp đều (PMT), điểm tín dụng, tiết kiệm kỳ hạn. Số liệu chủ dự án duyệt 05/11. */
export const BANK={
 rateYear:.14,months:[6,12,24] as const,monthDays:30,creditStart:600,creditMin:300,creditMax:850,
 loanMin:500000,loanMax:100000000,loanStep:100000,maxLoans:2,limitMonths:3,
 lateFee:.02,lateCredit:20,onTimeCredit:5,payoffCredit:10,loanMinutes:15
} as const;
/** Lãi tiết kiệm theo kỳ hạn (ngày): điểm cơ bản mỗi năm. */
export const SAVE_RATE:Record<number,number>={90:400,180:500,360:600};

export type Months=typeof BANK.months[number];
export interface Loan{id:string;principal:number;months:Months;startDay:number;/** Dư nợ gốc. */balance:number;/** Số kỳ đã trả. */paid:number;/** Hạn trả kỳ tới. */nextDue:number;/** Phí trễ hạn chưa trả. */fee:number;/** Hạn kỳ đã bị tính phí trễ. */lateDue?:number}
export interface BankState{version:1;credit:number;seq:number;loans:Loan[]}
export type BankAction={kind:'loan';amount:number;months:Months}|{kind:'payLoan';id:string}|{kind:'payoff';id:string};

const bad=(error:string):GameResult=>({ok:false,error});
const int=(v:unknown,min:number,max:number):v is number=>Number.isSafeInteger(v)&&Number(v)>=min&&Number(v)<=max;

export const bankOf=(s:GameState):BankState=>s.bank??{version:1,credit:BANK.creditStart,seq:0,loans:[]};
/** Tiền trả đều mỗi kỳ: PMT = P × r / (1 − (1 + r)^−n), r là lãi mỗi tháng. */
export function pmt(principal:number,months:number,rateYear:number=BANK.rateYear):number{const r=rateYear/12;return Math.round(principal*r/(1-Math.pow(1+r,-months)))}
export const interestOf=(balance:number)=>Math.round(balance*BANK.rateYear/12);
/** Hệ số tín dụng: 0,5 ở điểm 300 đến 1,2 ở điểm 850. */
export const creditFactor=(credit:number)=>Math.round((0.5+(credit-BANK.creditMin)/(BANK.creditMax-BANK.creditMin)*0.7)*100)/100;
/** Lương tháng đang nhận (0 nếu chưa đi làm). */
export function monthlyIncome(s:GameState):number{const o=officeOf(s);return o.role==='employee'&&o.employerId?salaryFor(o.employerId,!!o.probation,o.tier):0}
export const owedOf=(b:BankState)=>b.loans.reduce((t,l)=>t+l.balance,0);
/** Hạn mức còn vay được: 3 × lương tháng × hệ số tín dụng, trừ dư nợ, làm tròn trăm nghìn. */
export function loanRoom(s:GameState):number{const b=bankOf(s),cap=Math.floor(BANK.limitMonths*monthlyIncome(s)*creditFactor(b.credit)/BANK.loanStep)*BANK.loanStep;return Math.max(0,Math.min(BANK.loanMax,cap-owedOf(b)))}
/** Số tiền phải trả kỳ này của một khoản vay: lãi cộng phần gốc đều, kỳ cuối trả hết, cộng phí trễ hạn. */
export function dueOf(l:Loan):number{const interest=interestOf(l.balance),left=l.months-l.paid;if(left<=1)return l.balance+interest+l.fee;return Math.min(l.balance,pmt(l.principal,l.months)-interest)+interest+l.fee}
/** Báo giá trước khi vay. */
export function quote(amount:number,months:Months){const payment=pmt(amount,months);return{payment,total:payment*months,interest:payment*months-amount}}

const clampCredit=(v:number)=>Math.max(BANK.creditMin,Math.min(BANK.creditMax,v));
const withBank=(s:GameState,f:(b:BankState)=>void):GameState=>{const n=structuredClone(s),b=structuredClone(bankOf(s));f(b);n.bank=b;return n};

export function bankAction(s:GameState,a:BankAction):GameResult{
 const b=bankOf(s);
 if(a.kind==='loan'){
  if(clockOf(s).location!=='bank')return bad('Hãy đến đúng địa điểm.');
  if(!(BANK.months as readonly number[]).includes(a.months)||!int(a.amount,BANK.loanMin,BANK.loanMax)||a.amount%BANK.loanStep!==0)return bad('Khoản vay chưa hợp lệ.');
  if(b.loans.length>=BANK.maxLoans)return bad(`Tối đa ${BANK.maxLoans} khoản vay.`);
  if(b.loans.some(l=>l.lateDue!==undefined&&s.day>l.nextDue))return bad('Hãy trả khoản đang trễ hạn trước.');
  const room=loanRoom(s);if(monthlyIncome(s)<=0)return bad('Cần có việc làm để vay.');
  if(a.amount>room)return bad('Vượt hạn mức vay.');
  const t=spendTime(s,BANK.loanMinutes);if(!t.ok)return t;
  const n=withBank(t.state,bk=>{bk.seq+=1;bk.loans.push({id:'l'+bk.seq,principal:a.amount,months:a.months,startDay:s.day,balance:a.amount,paid:0,nextDue:s.day+BANK.monthDays,fee:0})});
  const id='l'+(b.seq+1);if(post(n,{id:`loan:${id}`,name:'Nhận tiền vay ngân hàng',amount:a.amount})!=='ok')return bad('Không nhận được tiền vay lúc này.');
  return{ok:true,state:n};
 }
 const loan=b.loans.find(l=>l.id===a.id);if(!loan)return bad('Khoản vay không còn.');
 const late=s.day>loan.nextDue,pay=a.kind==='payoff'?loan.balance+interestOf(loan.balance)+loan.fee:dueOf(loan);
 if(s.money<pay)return bad('Chưa đủ tiền.');
 const n=withBank(s,bk=>{
  const l=bk.loans.find(x=>x.id===loan.id)!,interest=interestOf(l.balance);
  if(a.kind==='payoff'||l.months-l.paid<=1){bk.loans=bk.loans.filter(x=>x.id!==l.id);bk.credit=clampCredit(bk.credit+(late?0:BANK.payoffCredit))}
  else{l.balance-=Math.min(l.balance,pmt(l.principal,l.months)-interest);l.paid+=1;l.nextDue+=BANK.monthDays;l.fee=0;delete l.lateDue;bk.credit=clampCredit(bk.credit+(late?2:BANK.onTimeCredit))}
 });
 if(post(n,{id:`pay:${loan.id}:${loan.paid}:${a.kind}`,name:a.kind==='payoff'?'Tất toán khoản vay':'Trả góp ngân hàng',amount:-pay})!=='ok')return bad('Chưa đủ tiền.');
 return{ok:true,state:n};
}

/** Qua ngày: khoản nào quá hạn thì tính phí trễ một lần cho kỳ đó, hạ điểm tín dụng, thêm căng thẳng; không âm số dư, không tự xiết. */
export function settleBank(s:GameState):GameState{
 const b=s.bank;if(!b||!b.loans.some(l=>s.day>l.nextDue&&l.lateDue!==l.nextDue))return s;
 const n=withBank(s,bk=>{for(const l of bk.loans){if(s.day>l.nextDue&&l.lateDue!==l.nextDue){l.lateDue=l.nextDue;l.fee+=Math.ceil(pmt(l.principal,l.months)*BANK.lateFee);bk.credit=clampCredit(bk.credit-BANK.lateCredit)}}});
 n.stress=Math.min(100,n.stress+2);return n;
}

export function validBank(v:unknown,day:number):v is BankState{
 const b=v as BankState;
 if(!b||typeof b!=='object'||b.version!==1||!int(b.credit,BANK.creditMin,BANK.creditMax)||!int(b.seq,0,1e6)||!Array.isArray(b.loans)||b.loans.length>BANK.maxLoans)return false;
 const ids=new Set<string>();
 for(const l of b.loans){
  if(!l||typeof l.id!=='string'||!/^l\d{1,7}$/.test(l.id)||ids.has(l.id))return false;ids.add(l.id);
  if(!(BANK.months as readonly number[]).includes(l.months)||!int(l.principal,BANK.loanMin,BANK.loanMax)||!int(l.startDay,0,day)||!int(l.balance,1,BANK.loanMax)||!int(l.paid,0,l.months-1)||!int(l.nextDue,0,day+BANK.monthDays*BANK.months[2]*2)||!int(l.fee,0,BANK.loanMax))return false;
  if(l.lateDue!==undefined&&!int(l.lateDue,0,l.nextDue))return false;
 }
 return true;
}
