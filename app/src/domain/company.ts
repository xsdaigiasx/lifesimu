import type {GameResult,GameState} from './types';
import {officeAction,officeOf,INDUSTRIES,type Industry} from './office';
import {skillsOf,workOf} from './work';
import {bankOf,owedOf} from './bank';
import {repOf} from './side';
import {post} from './money';
import {validHiring,validStaff,type HiringState,type Employee} from './hiring';
import {validProjects,type ProjectsState} from './projects';
import {validFinance,type FinanceState} from './finance';
import {SIZES} from './office';

/** Điều kiện và vốn mở công ty (chủ dự án duyệt 05/11, bản giảm để dễ test). */
export const COMPANY={mgmt:4,main:5,months:3,rep:60,fund:50_000_000,ownMin:20_000_000} as const;
export interface CompanyState{version:1;founded:number;/** Quỹ công ty, tách khỏi tiền cá nhân. */fund:number;/** T44: tin tuyển dụng đang đăng và tiến độ phỏng vấn. */hiring?:HiringState;/** T44: nhân viên đã thuê (hợp đồng; chưa làm việc, chưa trả lương: T45, T47). */staff?:Employee[];/** T46: dự án mời, đang làm và kết quả gần đây. */projects?:ProjectsState;/** T46: uy tín công ty 0–100 (mặc định 50), đổi theo sao dự án. */rep?:number;/** T47: khách còn nợ, nợ lương và sổ cái riêng của công ty. */finance?:FinanceState}
export const companyOf=(s:GameState):CompanyState|null=>s.company??null;
export const fundOf=(s:GameState)=>s.company?.fund??0;
export interface Check{id:'management'|'main'|'months'|'rep'|'cash'|'own';label:string;have:number;need:number;ok:boolean}
/** Số tháng có chấm công (bất kỳ công ty nào). */
export const monthsWorked=(s:GameState)=>new Set(workOf(s).periods.filter(p=>p.minutes>0).map(p=>p.month)).size;
export const mainLevel=(s:GameState)=>{const k=skillsOf(s);return Math.max(k.programming.level,k.logic.level,k.graphics.level)};
/** Tự có = tiền mặt trừ dư nợ vay. */
export const ownCash=(s:GameState)=>s.money-owedOf(bankOf(s));
export function checksOf(s:GameState):Check[]{
 const k=skillsOf(s),mk=(id:Check['id'],label:string,have:number,need:number):Check=>({id,label,have,need,ok:have>=need});
 return[mk('management','Quản lý',k.management.level,COMPANY.mgmt),mk('main','Kỹ năng chính',mainLevel(s),COMPANY.main),mk('months','Tháng làm việc',monthsWorked(s),COMPANY.months),mk('rep','Uy tín tay trái',repOf(s),COMPANY.rep),mk('cash','Tiền mặt',s.money,COMPANY.fund),mk('own','Tiền tự có',ownCash(s),COMPANY.ownMin)];
}
export const canFound=(s:GameState)=>!s.company&&officeOf(s).role!=='owner'&&checksOf(s).every(c=>c.ok);
export type CompanyAction={kind:'found';name:string;industry:Industry};
export function foundCompany(s:GameState,a:CompanyAction):GameResult{
 const fail=(error:string):GameResult=>({ok:false,error});
 if(s.company||officeOf(s).role==='owner')return fail('Bạn đã có công ty.');
 if(!Object.hasOwn(INDUSTRIES,a.industry)||typeof a.name!=='string'||!a.name.trim()||a.name.trim().length>32)return fail('Hãy chọn ngành và đặt tên công ty tối đa 32 ký tự.');
 const bad=checksOf(s).find(c=>!c.ok);if(bad)return fail(bad.id==='cash'||bad.id==='own'?'Chưa đủ vốn để lập công ty.':`Chưa đủ điều kiện: ${bad.label}.`);
 let n=structuredClone(s);
 if(officeOf(n).role==='employee'){const r=officeAction(n,{kind:'leave'});if(!r.ok)return r;n=r.state}
 if(post(n,{id:`company:${s.day}`,name:'Vốn lập công ty',amount:-COMPANY.fund})!=='ok')return fail('Chưa đủ vốn để lập công ty.');
 n.company={version:1,founded:s.day,fund:COMPANY.fund};
 return officeAction(n,{kind:'rent',size:'small',industry:a.industry,name:a.name,term:'month'});
}
export function validCompany(v:unknown,day:number):v is CompanyState{
 if(!v||typeof v!=='object')return false;const c=v as CompanyState;
 return c.version===1&&Number.isInteger(c.founded)&&c.founded>=0&&c.founded<=day&&Number.isInteger(c.fund)&&c.fund>=0&&c.fund<=1e9&&(c.hiring===undefined||validHiring(c.hiring,day))&&(c.staff===undefined||validStaff(c.staff,day,SIZES.large.seats))&&(c.projects===undefined||validProjects(c.projects,day))&&(c.rep===undefined||Number.isInteger(c.rep)&&c.rep>=0&&c.rep<=100)&&(c.finance===undefined||validFinance(c.finance,day));
}
