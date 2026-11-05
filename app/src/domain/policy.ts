import type {CompanyState} from './company';
import type {Employee} from './hiring';

/** T49 (Kế hoạch mục 38; chủ dự án duyệt 05/11): chính sách công ty. Bật/tắt, có hiệu lực từ hôm sau; số liệu là đề xuất, chỉnh ở T50.
 *  Chưa có: giảm tiền thuê văn phòng cho làm từ xa (tiền thuê trả trước theo tháng/năm), để dành. */
export interface PolicyState{overtime?:boolean;remote?:boolean;perk?:boolean;candor?:'open'|'closed';/** Ngày đã tính hiệu ứng hằng ngày tới. */last?:number}
export const POL={overtimeSpeed:1.08,remoteSpeed:.95,trainSpeed:.5,perkWage:1.05,overtimeFatigue:3,overtimeLoyalty:-.5,perkLoyalty:.5,perkMorale:.3,remoteFatigue:-1,remoteMorale:.3,catchUp:30} as const;
export const policyOf=(co?:CompanyState):PolicyState=>co?.policy??{};
export const training=(e:Employee,day:number)=>!!e.train&&day<=e.train.until;
/** Hệ số giờ làm: làm thêm giờ tăng, làm từ xa giảm nhẹ, đang học thì còn nửa. */
export const hourMult=(co:CompanyState|undefined,e:Employee,day:number)=>{const p=policyOf(co);return(p.overtime?POL.overtimeSpeed:1)*(p.remote?POL.remoteSpeed:1)*(training(e,day)?POL.trainSpeed:1)};
export const wageMult=(co?:CompanyState)=>policyOf(co).perk?POL.perkWage:1;
export function validPolicy(v:unknown,day:number):v is PolicyState{
 if(!v||typeof v!=='object')return false;const p=v as PolicyState;
 return[p.overtime,p.remote,p.perk].every(x=>x===undefined||typeof x==='boolean')&&(p.candor===undefined||p.candor==='open'||p.candor==='closed')&&(p.last===undefined||Number.isInteger(p.last)&&p.last>=-1&&p.last<=day)}
