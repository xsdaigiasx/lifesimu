import type {GameState} from './types';
import {standardMinutes,workOf} from './work';
import {dateAt} from './format';
import {financeOf,wageAmount} from './finance';
import {wageMult} from './policy';
import {staffOf} from './hiring';

/** T-#223: bảng lương cuối tháng. Chỉ đọc dữ liệu có sẵn (`WagePeriod`, `settleFinance`), không đổi công thức lương. */
const DAY=86400000,DAY_MINUTES=480;
/** Số ngày game của mùng 1 tháng `m0` (0 = tháng 1) năm `y`. */
export const firstDayOf=(y:number,m0:number)=>Math.round((Date.UTC(y,m0,1)-Date.UTC(2026,10,2))/DAY);
/** Ngày trả lương của kỳ `month` ("2026-10"): mùng 1 tháng sau. */
export const payDayOf=(month:string)=>{const[y,m]=month.split('-').map(Number);return firstDayOf(y!,m!)};
export const monthLabel=(month:string)=>{const[y,m]=month.split('-');return `${Number(m)}/${y}`};

export interface Payslip{key:string;month:string;label:string;days:number;stdDays:number;minutes:number;stdMinutes:number;base:number;bonus:number;total:number;paid:boolean;payDay:number}
/** Các kỳ lương của người chơi, tháng mới nhất trước. Số ngày làm suy ra từ phút (`WagePeriod` không lưu ngày). */
export function payslipsOf(s:GameState):Payslip[]{
 return workOf(s).periods.map(p=>{
  const std=standardMinutes(p.month),base=Math.round(p.salary*p.minutes/std),bonus=p.bonus??0;
  return{key:p.key,month:p.month,label:monthLabel(p.month),days:Math.round(p.minutes/DAY_MINUTES),stdDays:Math.round(std/DAY_MINUTES),minutes:p.minutes,stdMinutes:std,base,bonus,total:p.paid?p.amount:base+bonus,paid:p.paid,payDay:payDayOf(p.month)}
 }).sort((a,b)=>b.month.localeCompare(a.month)||a.key.localeCompare(b.key))}

export interface PayrollRow{id:string;name:string;wage:number;amount:number}
export interface Payroll{/** Ngày trả của kỳ này. */day:number;rows:PayrollRow[];total:number;mult:number}
const sum=(rows:PayrollRow[])=>rows.reduce((a,r)=>a+r.amount,0);
/** Dự kiến kỳ lương ngày 1 tới của công ty: từng người (lương cơ bản, số tiền sau hệ số chính sách) và tổng quỹ lương. */
export function nextPayroll(s:GameState):Payroll{
 const d=dateAt(s.day),day=firstDayOf(d.getUTCFullYear(),d.getUTCMonth()+1),mult=wageMult(s.company);
 const rows=staffOf(s).map(e=>({id:e.id,name:e.name,wage:e.wage,amount:wageAmount(e,day,s.company)})).filter(r=>r.amount>0);
 return{day,rows,total:sum(rows),mult}}
/** Kỳ vừa trả: đọc các dòng "Lương ..." của sổ cái vào mùng 1 gần nhất (sổ cái chỉ giữ dòng gần đây nên có thể thiếu người). */
export function lastPayroll(s:GameState):Payroll|null{
 const log=financeOf(s).log.filter(l=>l.label.startsWith('Lương ')&&l.amount<0);
 if(!log.length)return null;const day=Math.max(...log.map(l=>l.day));
 const rows=log.filter(l=>l.day===day).reverse().map((l,i)=>({id:String(i),name:l.label.slice(6),wage:0,amount:-l.amount}));
 return{day,rows,total:sum(rows),mult:wageMult(s.company)}}
