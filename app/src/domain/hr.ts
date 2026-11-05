import type {GameResult,GameState} from './types';
import {staffOf,levelOf,HIRE_SKILLS,type Employee,type HireSkill} from './hiring';
import {FX,bondOf,fairWage,knowOf,quitRisk,wageRatio,withKnow,workAt} from './staff';
import {projectsOf,type Project} from './projects';
import {book} from './finance';
import {spendTime} from './time';
import {recordJournal} from './journal';
import {skillsOf} from './work';
import {agoText} from './npc';
import {hash} from './shift';
import {policyOf} from './policy';

/** T48 (Kế hoạch mục 34; chủ dự án duyệt 05/11): sự kiện nhân sự. Nhân viên tự báo việc (xin tăng lương, xung đột, bị chào mời…),
 *  chủ chọn cách xử lý. 15 mô-típ, mỗi mô-típ 2 biến thể, ký ức và móc tiếp nối như bộ điều phối NPC (director.ts).
 *  Điểm thân `Employee.bond` (0–100): Tri kỷ làm thêm giờ vì chủ, Bất hoà làm cầm chừng và dễ nghỉ. Các số là đề xuất, chỉnh ở T50. */
export type HrMotifId='raise'|'bonus'|'conflict'|'late'|'poach'|'quit'|'sick'|'leave'|'private'|'idea'|'overtime'|'overreach'|'hoard'|'training'|'moonlight'|'stuck'|'polish'|'demand'|'scope'|'clash';
export const HR={chance:14,dailyMax:2,expireDays:3,fadeDays:30,maxMem:60,maxLog:120,maxHooks:24,maxPending:12,ignoreMorale:-3,ignoreLoyalty:-2,ignoreBond:-2} as const;

export interface HrEvent{id:string;emp:string;motif:HrMotifId;variant:number;day:number;expires:number;/** Người thứ hai (xung đột). */other?:string;/** Dự án liên quan. */ref?:string;/** Ký ức làm nảy ra việc này. */memory?:string}
export interface HrMemory{id:string;day:number;emp:string;motif:HrMotifId|'ignored'|'work';topic:string;tag:string;weight:number}
export interface HrHook{emp:string;motif:HrMotifId;from:number;to:number;memory:string}
export interface HrLog{day:number;emp:string;motif:HrMotifId}
export interface HrState{version:1;last:number;seq:number;pending:HrEvent[];log:HrLog[];memories:HrMemory[];hooks:HrHook[]}

const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
const r100=(v:number)=>Math.round(v/100_000)*100_000;
const cap=(t:string)=>t.charAt(0).toUpperCase()+t.slice(1);
export const hrOf=(s:GameState):HrState=>s.company?.hr??{version:1,last:s.day-1,seq:0,pending:[],log:[],memories:[],hooks:[]};
export const pendingFor=(s:GameState,emp:string)=>hrOf(s).pending.find(p=>p.emp===emp);
export const pendingCount=(s:GameState)=>hrOf(s).pending.length;
export const alive=(m:HrMemory,day:number)=>m.weight>=4||day-m.day<=HR.fadeDays;
const mainKey=(e:Employee):HireSkill=>(['programming','logic','graphics'] as HireSkill[]).reduce((a,k)=>e.skills[k]>e.skills[a]?k:a,'programming' as HireSkill);
const mainLv=(e:Employee)=>e.skills[mainKey(e)];

type Eff={/** T51: đổi số giờ (%), thưởng dự án (%), hạn (ngày) và độ biết. */hoursPct?:number;rewardPct?:number;dueDays?:number;know?:number;fund?:number;wagePct?:number;morale?:number;loyalty?:number;bond?:number;fatigue?:number;minutes?:number;off?:number;progress?:number;errCut?:number;exp?:number;rep?:number;unassign?:boolean;leave?:boolean;other?:{morale?:number;bond?:number;loyalty?:number};roll?:{p:number;ok:Eff;no:Eff}};
interface Option{label:string;tag:string;need?:number;needFund?:number;eff:Eff;result:string;resultNo?:string;mem?:[string,number];hook?:[HrMotifId,[number,number]]}
interface Base{s:GameState;e:Employee;day:number;bond:number;comm:number;ps:ReturnType<typeof projectsOf>;proj?:Project;other?:Employee;mem?:HrMemory;variant:number}
interface Motif{id:HrMotifId;name:string;variants:number;gap:number;weight:(c:Base)=>number;line:(c:Base)=>string;options:(c:Base)=>Option[]}
const O=(label:string,tag:string,eff:Eff,result:string,x:Partial<Option>={}):Option=>({label,tag,eff,result,...x});
const withRecall=(c:Base,text:string)=>c.mem?`${cap(agoText(c.day-c.mem.day))} ${c.mem.topic}, em vẫn nhớ. ${text}`:text;
const title=(c:Base)=>c.proj?.title??'dự án';
const projectOf=(ps:Base['ps'],emp:string)=>ps.active.find(p=>p.team.includes(emp));
const tired=(c:Base)=>workAt(c.e,c.day).fatigue;

/** T51: sự kiện giữa việc chỉ xảy ra khi dự án đã chạy 25–90%. `helpHours`/`helpCost`: giờ và tiền của một đợt hỗ trợ thêm người. */
const MID_W=4;
const mid=(c:Base)=>!!c.proj&&c.proj.progress>=c.proj.hours*.25&&c.proj.progress<c.proj.hours*.9;
const helpHours=(c:Base)=>Math.max(2,Math.round((c.proj?.hours??20)*.05));
const helpCost=(c:Base)=>Math.max(1_000_000,r100(c.e.wage*.15));

export const MOTIFS:Motif[]=[
 {id:'raise',name:'Xin tăng lương',variants:3,gap:45,
  weight:c=>{const w=workAt(c.e,c.day),r=wageRatio(c.e);return c.day-c.e.hiredDay<30||r>=1.35||w.ambition<40?0:(r<1?3:r<1.1?1:.3)+(c.e.personality==='Tham'?3:0)+(w.ambition>=65?1:0)},
  line:c=>withRecall(c,['Sếp ơi, em làm ở đây cũng được một thời gian rồi. Em xin phép hỏi chuyện tăng lương được không ạ?','Em có chuyện muốn nói với sếp, là về mức lương hiện tại của em.','Mấy dự án gần đây em đóng góp khá nhiều. Sếp xem xét lại lương cho em được không?'][c.variant]!),
  options:c=>[O('Tăng 10%','full',{wagePct:10,morale:8,loyalty:6,bond:4},`${c.e.name} mừng ra mặt, hứa sẽ làm tốt hơn.`,{mem:['sếp tăng lương cho em',3]}),
   O('Tăng 5%','half',{wagePct:5,morale:3,loyalty:2,bond:1},`${c.e.name} hơi tiếc nhưng vẫn cảm ơn.`),
   O('Thưởng một lần nửa tháng lương','bonus',{fund:-r100(c.e.wage/2),morale:3,bond:1},`Nhận thưởng, ${c.e.name} đồng ý chờ thêm.`,{needFund:r100(c.e.wage/2)}),
   O('Để sau','deny',{morale:-6,loyalty:-5,bond:-3},`${c.e.name} im lặng rồi quay lại làm việc.`,{mem:['sếp hẹn để sau chuyện lương',3],hook:['poach',[7,20]]})]},
 {id:'bonus',name:'Xin thưởng',variants:2,gap:30,
  weight:c=>{const w=workAt(c.e,c.day);return w.morale<40||!c.ps.done.some(r=>c.day-r.day<=7&&r.stars>=4)?0:2+(c.e.personality==='Tham'?2:0)},
  line:c=>withRecall(c,['Dự án vừa rồi khách khen nhiều. Sếp có định thưởng cho cả nhóm không ạ?','Em nghe nói dự án mình vừa làm lãi khá. Em xin sếp ít thưởng được không?'][c.variant]!),
  options:c=>{const cost=Math.max(1_000_000,r100(c.e.wage*.1));return[O('Thưởng','bonus',{fund:-cost,morale:6,bond:3},`${c.e.name} cười tươi, nói sẽ cố hơn nữa.`,{needFund:cost}),
   O('Khen ngợi','thanks',{morale:2,loyalty:1,bond:1},'Lời khen nhẹ nhàng, không khí vẫn vui.'),
   O('Chưa thưởng được','refuse',{morale:-4,bond:-2},`${c.e.name} gật đầu, nét mặt hơi chùng.`,{mem:['sếp từ chối thưởng sau dự án tốt',2]})]}},
 {id:'conflict',name:'Xung đột nhóm',variants:2,gap:21,
  weight:c=>!c.other?0:FX[c.e.personality].conflict*10+(workAt(c.e,c.day).morale<45?1:0),
  line:c=>withRecall(c,[`Sếp ơi, em với ${c.other?.name} đang có chút va chạm trong việc chung. Em nghĩ sếp nên biết.`,`Em xin nói thẳng, em và ${c.other?.name} làm việc với nhau không hợp.`][c.variant]!),
  options:c=>[O('Gặp riêng từng người để hoà giải','mediate',{minutes:30,morale:2,bond:2,other:{morale:2,bond:2}},'Cả hai nói ra hết, không khí dịu đi.',{need:3}),
   O('Tách hai người sang việc khác nhau','separate',{morale:1,other:{morale:1}},'Hai người làm riêng, đỡ va chạm.'),
   O(`Đứng về phía ${c.e.name}`,'side',{morale:4,bond:4,other:{morale:-4,bond:-4,loyalty:-2}},`${c.e.name} yên tâm, ${c.other?.name} thì không vui.`),
   O('Bảo tự giải quyết','ignore',{morale:-3,bond:-1,other:{morale:-3}},'Hai người im lặng, căng thẳng vẫn còn.')]},
 {id:'late',name:'Báo lỗi muộn',variants:2,gap:21,
  weight:c=>!c.proj?0:(FX[c.e.personality].reportDelay>=.6?3:FX[c.e.personality].reportDelay>=.3?1:0)*(policyOf(c.s.company).candor==='open'?.3:policyOf(c.s.company).candor==='closed'?1.5:1),
  line:c=>withRecall(c,[`Sếp ơi, dự án ${title(c)} em làm hơi lệch ý khách. Em định báo sớm mà ngại quá.`,`Em xin lỗi sếp, em thấy lỗi ở dự án ${title(c)} từ mấy hôm trước mà giờ mới dám nói.`][c.variant]!),
  options:c=>[O('Cùng xem và sửa','fix',{minutes:30,errCut:25,morale:2,bond:2},'Hai người sửa xong phần lỗi nặng nhất.'),
   O('Cảm ơn đã báo','thank',{errCut:10,morale:3,bond:2},`${c.e.name} nhẹ cả người, tự đi sửa phần còn lại.`),
   O('Trách vì báo muộn','scold',{errCut:10,morale:-6,loyalty:-3,bond:-4},`${c.e.name} cúi đầu xin lỗi, không nói thêm.`,{mem:['em bị mắng khi báo lỗi',3]})]},
 {id:'poach',name:'Bị chào mời',variants:2,gap:30,
  weight:c=>{const w=workAt(c.e,c.day);return c.day-c.e.hiredDay<30||w.loyalty>=70||mainLv(c.e)<5?0:(70-w.loyalty)/15+(w.ambition>=60?1:0)},
  line:c=>withRecall(c,['Sếp ơi, có công ty khác nhắn em sang làm với mức lương cao hơn. Em muốn nghe ý sếp trước.','Em vừa được một công ty bên ngoài mời. Em còn đắn đo vì quen làm ở đây.'][c.variant]!),
  options:c=>[O('Tăng lương 10% để giữ','match',{wagePct:10,loyalty:10,morale:4,bond:2},`${c.e.name} cảm ơn và từ chối lời mời kia.`,{mem:['sếp giữ em lại khi có nơi khác mời',3]}),
   O('Thưởng giữ chân một tháng lương','stay',{fund:-r100(c.e.wage),loyalty:12,morale:3,bond:3},`${c.e.name} xúc động, hứa ở lại lâu dài.`,{needFund:r100(c.e.wage),mem:['sếp giữ em lại khi có nơi khác mời',3]}),
   O('Nói chuyện chân thành','talk',{minutes:20,roll:{p:clamp(35+c.comm*8+c.bond*.4,5,90),ok:{loyalty:8,bond:5,morale:3},no:{leave:true}}},`${c.e.name} nghe xong và quyết định ở lại.`,{resultNo:`${c.e.name} cảm ơn nhưng vẫn chọn đi.`,mem:['sếp giữ em lại khi có nơi khác mời',3]}),
   O('Chúc em thành công','letgo',{leave:true},`${c.e.name} cảm ơn và chào mọi người ra về.`)]},
 {id:'quit',name:'Xin nghỉ việc',variants:2,gap:21,
  weight:c=>c.day-c.e.hiredDay<14||quitRisk(c.e,c.day)<.3?0:4,
  line:c=>withRecall(c,['Sếp ơi, em xin phép nghỉ việc. Em nghĩ mãi rồi.','Em có chuyện muốn nói. Em không còn thấy phù hợp ở đây nữa.'][c.variant]!),
  options:c=>[O('Tăng lương 15% và đề nghị ở lại','raise',{roll:{p:clamp(35+c.bond*.5,5,90),ok:{wagePct:15,loyalty:15,morale:8},no:{leave:true}}},`${c.e.name} suy nghĩ rồi đồng ý ở lại.`,{resultNo:`${c.e.name} cảm ơn nhưng quyết định đã rồi.`,mem:['em suýt nghỉ việc nhưng sếp giữ lại',4]}),
   O('Nói chuyện, hỏi nguyên nhân','talk',{minutes:30,roll:{p:clamp(25+c.comm*8+c.bond*.5,5,90),ok:{loyalty:12,morale:6,bond:4},no:{leave:true}}},`${c.e.name} nói ra điều khúc mắc và đổi ý.`,{resultNo:`${c.e.name} nghe hết nhưng vẫn xin đi.`,mem:['em suýt nghỉ việc nhưng sếp giữ lại',4]}),
   O('Chấp nhận, tiễn tử tế','accept',{leave:true},`${c.e.name} cảm ơn vì được ra đi êm đẹp.`)]},
 {id:'sick',name:'Nghỉ ốm',variants:2,gap:14,
  weight:c=>(workAt(c.e,c.day).off??0)>=c.day?0:tired(c)>=60?3:tired(c)>=30?2:.5,
  line:c=>withRecall(c,['Sếp ơi, em thấy trong người không khoẻ lắm, xin nghỉ vài hôm được không ạ?','Em bị sốt từ tối qua. Em xin nghỉ để đi khám.'][c.variant]!),
  options:c=>[O('Cho nghỉ 3 ngày','approve',{off:3,fatigue:-60,morale:3,bond:2},`${c.e.name} cảm ơn, về nhà nghỉ ngơi.`),
   O('Cho nghỉ và ghé thăm','visit',{minutes:20,fund:-300_000,off:3,fatigue:-60,morale:5,loyalty:3,bond:5},`${c.e.name} bất ngờ vì sếp ghé thăm.`,{needFund:300_000,mem:['sếp ghé thăm lúc em ốm',3]}),
   O('Bảo cố làm nốt dự án','push',{fatigue:10,morale:-5,loyalty:-3,bond:-2},`${c.e.name} gượng làm tiếp, sắc mặt nhợt nhạt.`,{mem:['sếp bắt em đi làm lúc ốm',3]})]},
 {id:'leave',name:'Xin nghỉ phép',variants:2,gap:60,
  weight:c=>c.day-c.e.hiredDay<45||(workAt(c.e,c.day).off??0)>=c.day?0:1+(tired(c)>=30?1:0),
  line:c=>withRecall(c,['Sếp ơi, em xin nghỉ phép vài ngày về quê, được không ạ?','Em có việc gia đình, xin phép nghỉ hai ngày.'][c.variant]!),
  options:c=>[O('Cho nghỉ 2 ngày','approve',{off:2,fatigue:-30,morale:4,bond:1},`${c.e.name} vui vẻ nhận phép.`),
   O('Đợi xong dự án rồi nghỉ','later',{morale:-2},`${c.e.name} đồng ý đợi.`,{hook:['leave',[5,10]]}),
   O('Giờ chưa được','deny',{morale:-6,loyalty:-3,bond:-2},`${c.e.name} thất vọng nhưng không nói gì.`)]},
 {id:'private',name:'Chuyện riêng',variants:2,gap:30,
  weight:c=>c.day-c.e.hiredDay<30||c.bond<30?0:2,
  line:c=>withRecall(c,['Dạo này em có chuyện riêng làm em hơi rối, em muốn nói với sếp một chút.','Sếp có rảnh không ạ, em muốn xin ý kiến về chuyện nhà em.'][c.variant]!),
  options:c=>[O('Ngồi nghe','listen',{minutes:30,bond:6,loyalty:4,morale:3},`${c.e.name} nói xong thấy nhẹ lòng.`,{mem:['sếp ngồi nghe chuyện riêng của em',4]}),
   O('Khuyên vài câu','advise',{minutes:20,bond:5,loyalty:3,morale:2},'Lời khuyên trúng chỗ, hai người thân hơn.',{need:3,mem:['sếp ngồi nghe chuyện riêng của em',4]}),
   O('Hỗ trợ nửa tháng lương','help',{fund:-r100(c.e.wage/2),bond:8,loyalty:8,morale:4},`${c.e.name} rưng rưng, nói sẽ nhớ ơn.`,{needFund:r100(c.e.wage/2),mem:['sếp giúp em lúc khó khăn',4]}),
   O('Để hôm khác','busy',{morale:-3,bond:-2},`${c.e.name} cười gượng, thôi không nói nữa.`)]},
 {id:'idea',name:'Đề xuất ý tưởng',variants:2,gap:21,
  weight:c=>workAt(c.e,c.day).morale<55||mainLv(c.e)<5?0:1.5,
  line:c=>withRecall(c,['Sếp ơi, em có ý tưởng cải tiến cách làm việc của nhóm. Em trình bày được không?','Em nghĩ ra cách làm nhanh hơn cho mấy dự án kiểu này, sếp nghe thử nhé.'][c.variant]!),
  options:c=>[O('Cho thử nghiệm','try',{fund:-1_000_000,roll:{p:40+mainLv(c.e)*5,ok:{rep:2,morale:6,bond:4,exp:2},no:{morale:2,bond:2}}},`Thử nghiệm hiệu quả, khách để ý hơn.`,{needFund:1_000_000,resultNo:'Thử nghiệm không như kỳ vọng, nhưng em vẫn vui vì được thử.',mem:['sếp cho em thử ý tưởng',2]}),
   O('Để sau','later',{morale:-1},`${c.e.name} ghi lại ý tưởng.`),
   O('Chưa phù hợp','reject',{morale:-4,bond:-2},`${c.e.name} gật đầu, hơi thất vọng.`)]},
 {id:'overtime',name:'Làm thêm giờ',variants:2,gap:21,
  weight:c=>!c.proj||c.bond<60?0:3,
  line:c=>withRecall(c,[`Sếp ơi, dự án ${title(c)} đang gấp. Em ở lại làm thêm vài tiếng cho kịp nhé.`,`Em biết dự án ${title(c)} đang trễ, em xin làm thêm tối nay.`][c.variant]!),
  options:c=>{const cost=r100(c.e.wage*.05);return[O('Nhận lời, cảm ơn','accept',{progress:4,fatigue:20,morale:-1,bond:3},`${c.e.name} ở lại làm tới khuya, dự án nhích lên đáng kể.`),
   O('Nhận và trả công làm thêm','pay',{fund:-cost,progress:4,fatigue:10,morale:3,bond:4},`${c.e.name} vui vì được ghi nhận.`,{needFund:cost}),
   O('Không cần, em nghỉ đi','rest',{fatigue:-10,morale:3,bond:2},`${c.e.name} cười, cảm ơn sếp.`)]}},
 {id:'overreach',name:'Nhận việc quá sức',variants:2,gap:21,
  weight:c=>!c.proj||c.e.personality!=='Hay khoe'?0:3,
  line:c=>withRecall(c,[`Sếp cứ giao thêm việc khó cho em, em nhận hết được. Dự án ${title(c)} để em lo nhé.`,`Em làm được hết, sếp đừng lo. Cho em thêm phần khó của ${title(c)} đi.`][c.variant]!),
  options:c=>[O('Cho nhận thêm','allow',{fatigue:25,morale:5,errCut:-15,exp:2,bond:1},`${c.e.name} hào hứng nhận việc, nhưng trông đã hơi mệt.`),
   O('Giao việc vừa sức','moderate',{exp:1,bond:1},`${c.e.name} hơi tiếc nhưng làm đúng phần được giao.`),
   O('Không, tập trung việc hiện tại','refuse',{morale:-3,bond:-1},`${c.e.name} nhún vai, quay lại bàn.`)]},
 {id:'hoard',name:'Ôm việc kiệt sức',variants:2,gap:21,
  weight:c=>c.e.personality!=='Hay giúp đỡ'||!c.proj||(c.ps.active.filter(p=>p.team.includes(c.e.id)).length<2&&tired(c)<35)?0:3,
  line:c=>withRecall(c,['Em đang ôm nhiều việc quá sếp ạ, nhưng em ngại nhờ người khác.','Em quen nhận việc giúp mọi người, giờ hơi quá sức.'][c.variant]!),
  options:c=>[O('Chia bớt việc cho người khác','share',{unassign:true,fatigue:-15,morale:4,bond:3},`${c.e.name} thở phào khi bớt một đầu việc.`),
   O('Bảo em nghỉ ngơi','rest',{off:1,fatigue:-40,morale:3,bond:2},`${c.e.name} nghỉ một ngày, tỉnh táo hơn hẳn.`),
   O('Khen và để em tiếp tục','praise',{fatigue:10,morale:2,bond:1},`${c.e.name} cười, nhưng quầng thâm vẫn còn.`)]},
 {id:'training',name:'Xin đi học thêm',variants:2,gap:60,
  weight:c=>c.day-c.e.hiredDay<30?0:c.e.motive==='Học hỏi'?3:workAt(c.e,c.day).ambition>=50?1:0,
  line:c=>withRecall(c,['Em muốn đăng ký một khoá học thêm, sếp hỗ trợ học phí được không ạ?','Em thấy mình cần học thêm để theo kịp dự án mới. Sếp xem giúp em.'][c.variant]!),
  options:c=>[O('Trả học phí khoá học','pay',{fund:-3_000_000,exp:3,morale:6,loyalty:8,bond:3},`${c.e.name} đăng ký ngay, mắt sáng lên.`,{needFund:3_000_000,mem:['sếp trả học phí cho em',3]}),
   O('Tự học ngoài giờ, công ty cho nghỉ buổi thi','self',{morale:1,exp:1},`${c.e.name} đồng ý tự học.`),
   O('Chưa có ngân sách','deny',{morale:-4,loyalty:-3},`${c.e.name} lặng lẽ gật đầu.`)]},
 {id:'moonlight',name:'Việc tay trái',variants:2,gap:45,
  weight:c=>c.e.personality!=='Tham'||c.day-c.e.hiredDay<30||workAt(c.e,c.day).loyalty>=75?0:2,
  line:c=>withRecall(c,['Sếp ơi, em nhận thêm vài việc ngoài giờ cho khách bên ngoài. Em báo trước để sếp biết.','Em có làm thêm một dự án nhỏ buổi tối, không ảnh hưởng việc ở đây ạ.'][c.variant]!),
  options:c=>[O('Cho phép nếu không ảnh hưởng việc','allow',{fatigue:15,morale:3,bond:1},`${c.e.name} cảm ơn vì được tin.`),
   O('Đề nghị chia một phần thu nhập','share',{roll:{p:clamp(45+c.bond*.4,5,90),ok:{fund:1_500_000,bond:1},no:{morale:-4,loyalty:-3}}},`${c.e.name} đồng ý đưa một phần vào quỹ.`,{resultNo:`${c.e.name} không vui, thấy như bị đòi tiền.`}),
   O('Cấm làm thêm','ban',{morale:-5,loyalty:-4,bond:-2},`${c.e.name} im lặng, vẻ mặt khó chịu.`)]},


 // T51 (Kế hoạch mục 35.3): sự kiện giữa việc theo tính cách. Chỉ khi nhân viên đang làm một dự án đã chạy 25–90%.
 // Chủ can thiệp bằng họp nhanh (30 phút), điểm kiểm tra (45 phút), thêm người (tốn quỹ), cắt phạm vi hoặc gia hạn; mỗi lựa chọn để lại ký ức.
 {id:'stuck',name:'Kẹt không dám hỏi',variants:2,gap:14,
  weight:c=>mid(c)&&c.e.personality==='Ngại'?MID_W:0,
  line:c=>withRecall(c,[`Sếp ơi, phần giữa của ${title(c)} em đang kẹt, mà em ngại hỏi nên cứ tự mò.`,`Em chưa dám nói sớm: ${title(c)} có chỗ em chưa chắc, em sợ làm phiền sếp.`][c.variant]!),
  options:c=>[O('Họp nhanh gỡ vướng','sync',{minutes:30,progress:helpHours(c),morale:4,bond:3,know:3},`${c.e.name} thở phào, hai người gỡ xong chỗ vướng.`,{mem:['sếp họp nhanh gỡ vướng cho em',2]}),
   O('Điểm kiểm tra','check',{minutes:45,errCut:25,morale:1,know:2},'Kiểm tra sớm, phần lỗi tiềm ẩn lộ ra và được sửa.'),
   O('Thêm người hỗ trợ','help',{fund:-helpCost(c),progress:helpHours(c)*2,morale:1},`${c.e.name} có người cùng làm, tiến độ nhanh hơn.`,{needFund:helpCost(c)}),
   O('Để em tự xoay xở','alone',{morale:-2,roll:{p:55,ok:{morale:3,know:1},no:{errCut:-25,morale:-3}}},`${c.e.name} tự gỡ được, vẻ mặt nhẹ hơn.`,{resultNo:`${c.e.name} loay hoay thêm mấy hôm, lỗi tích dần.`,mem:['sếp để em tự xoay xở khi bị kẹt',2],hook:['late',[3,10]]})]},
 {id:'polish',name:'Xin thêm thời gian',variants:2,gap:14,
  weight:c=>mid(c)&&c.e.personality==='Cầu toàn'?MID_W:0,
  line:c=>withRecall(c,[`Em chưa hài lòng với ${title(c)}. Sếp cho em thêm ít thời gian được không ạ?`,`Phần này em muốn làm kỹ hơn, nhưng hạn của ${title(c)} sát quá.`][c.variant]!),
  options:c=>[O('Gia hạn 2 ngày','extend',{dueDays:2,rep:-1,morale:5,errCut:20,know:2},`${c.e.name} làm chắc tay, lỗi giảm rõ nhưng khách phải chờ thêm.`,{mem:['sếp cho thêm thời gian để làm cho chắc',3]}),
   O('Cắt bớt phạm vi','cut',{hoursPct:-12,rewardPct:-8,morale:2,errCut:10},`${c.e.name} gật đầu, tập trung phần cốt lõi.`),
   O('Họp nhanh chốt tiêu chuẩn','sync',{minutes:30,know:3,roll:{p:50+c.comm*4,ok:{morale:3,errCut:10,bond:2},no:{morale:-3}}},`${c.e.name} đồng ý mức hoàn thiện vừa đủ.`,{resultNo:`${c.e.name} vẫn lấn cấn nhưng đành nghe theo.`}),
   O('Giữ nguyên hạn','hold',{morale:-6,bond:-2},`${c.e.name} lặng im, chấp nhận.`,{mem:['sếp không cho thêm thời gian khi em muốn làm cho kỹ',3]})]},
 {id:'demand',name:'Đòi thưởng giữa việc',variants:2,gap:21,
  weight:c=>mid(c)&&c.e.personality==='Tham'&&c.proj!.hours>=32?MID_W:0,
  line:c=>withRecall(c,[`Dự án ${title(c)} lớn thế này, nếu em làm xong thì sếp tính thưởng cho em thế nào ạ?`,`Việc ${title(c)} nặng ký đấy sếp. Em muốn nói chuyện thưởng trước khi làm tiếp.`][c.variant]!),
  options:c=>{const bonus=Math.max(1_000_000,r100(c.proj!.reward*.05));return[O('Thưởng trước một phần','bonus',{fund:-bonus,morale:6,loyalty:3,bond:2},`${c.e.name} cười tươi, hứa dồn sức cho ${title(c)}.`,{needFund:bonus,mem:['sếp thưởng trước khi em làm xong',2]}),
   O('Họp nhanh nhắc mục tiêu','sync',{minutes:30,know:3,roll:{p:50+c.comm*4,ok:{morale:2,loyalty:1},no:{morale:-4,loyalty:-2}}},`${c.e.name} nghe ra, quay lại làm.`,{resultNo:`${c.e.name} vẫn tỏ ra không vui.`}),
   O('Tăng ca có trả','overtime',{fund:-helpCost(c),progress:helpHours(c),fatigue:8,morale:3},`${c.e.name} nhận tăng ca, tiến độ nhích lên.`,{needFund:helpCost(c)}),
   O('Không thưởng trước','deny',{morale:-6,loyalty:-3,bond:-2},`${c.e.name} cau mày, im lặng.`,{mem:['sếp không thưởng dù em làm việc lớn',3],hook:['raise',[5,15]]})]}},
 {id:'scope',name:'Nhận thêm phần ngoài yêu cầu',variants:2,gap:14,
  weight:c=>mid(c)&&c.e.personality==='Hay khoe'?MID_W:0,
  line:c=>withRecall(c,[`Em tính làm thêm vài phần ngoài yêu cầu của ${title(c)} cho khách choáng luôn, sếp đồng ý nhé.`,`Khách mới nhắc thêm một tính năng ở ${title(c)}, em nhận luôn rồi, làm được hết mà.`][c.variant]!),
  options:c=>[O('Cho làm thêm','allow',{hoursPct:10,rewardPct:5,morale:4,errCut:-10},`${c.e.name} hào hứng, nhưng khối lượng đã dày thêm.`),
   O('Giữ đúng phạm vi','keep',{morale:-3,bond:-1,errCut:5},`${c.e.name} tiếc nhưng quay lại phần được giao.`,{mem:['sếp không cho em làm thêm phần ngoài yêu cầu',2]}),
   O('Điểm kiểm tra','check',{minutes:45,errCut:15,know:2},'Kiểm tra cho thấy phần thêm chưa cần thiết, hai bên cắt bớt.'),
   O('Thêm người hỗ trợ','help',{fund:-helpCost(c),hoursPct:10,rewardPct:5,progress:helpHours(c)*2,morale:3},`Có thêm người, ${c.e.name} vẫn giữ được phần mình nhận.`,{needFund:helpCost(c)})]},
 {id:'clash',name:'Va chạm với khách',variants:2,gap:21,
  weight:c=>mid(c)&&c.e.personality==='Nóng tính'?MID_W:0,
  line:c=>withRecall(c,[`Khách của ${title(c)} cứ đổi ý hoài, em lỡ to tiếng với họ rồi sếp ạ.`,`Em cãi nhau với bên khách về ${title(c)}. Họ đang khó chịu lắm.`][c.variant]!),
  options:c=>[O('Gọi xin lỗi khách','apologize',{minutes:30,bond:2,roll:{p:55+c.comm*4,ok:{morale:-1},no:{rep:-2,morale:-2}}},'Khách dịu lại sau cuộc gọi của bạn.',{resultNo:'Khách vẫn phàn nàn và để lại ấn tượng xấu.',mem:['sếp đứng ra xin lỗi khách giúp em',2]}),
   O('Họp nhanh với nhân viên','sync',{minutes:30,morale:2,bond:3,know:3},`${c.e.name} nguôi giận, hứa nhẹ lời hơn.`),
   O('Đổi người phụ trách','swap',{unassign:true,morale:-4,bond:-2},`${c.e.name} rời dự án, người khác tiếp nhận khách.`,{mem:['sếp đổi em khỏi dự án sau khi em cãi khách',3]}),
   O('Bỏ qua','ignore',{rep:-2,morale:1},'Chuyện lắng xuống nhưng khách để lại ấn tượng không tốt.',{mem:['sếp bỏ qua chuyện em cãi khách',2]})]},
];
export const motifOf=(id:HrMotifId)=>MOTIFS.find(m=>m.id===id)!;

function baseFor(s:GameState,e:Employee,day:number,variant=0,ev?:HrEvent):Base{
 const h=hrOf(s),ps=projectsOf(s),proj=ev?.ref?ps.active.find(p=>p.id===ev.ref):projectOf(ps,e.id);
 const mem=ev?.memory?h.memories.find(m=>m.id===ev.memory):h.memories.filter(m=>m.emp===e.id&&m.motif===ev?.motif&&m.weight>=3&&alive(m,day)).sort((a,b)=>b.day-a.day)[0];
 return{s,e,day,bond:bondOf(e),comm:skillsOf(s).communication.level,ps,proj,other:ev?.other?staffOf(s).find(x=>x.id===ev.other):undefined,mem:mem&&alive(mem,day)?mem:undefined,variant}}
const recent=(h:HrState,emp:string,m:Motif,day:number)=>h.log.some(l=>l.emp===emp&&l.motif===m.id&&day-l.day<m.gap);

/** Chọn mô-típ cho một nhân viên: ưu tiên móc tiếp nối tới hạn, còn lại chọn có trọng số theo seed. */
function pick(s:GameState,e:Employee,day:number):{motif:Motif;variant:number;other?:string;memory?:string}|null{
 const h=hrOf(s),base=baseFor(s,e,day);
 const others=staffOf(s).filter(x=>x.id!==e.id),other=others.length?others[hash(`hr:o:${day}:${e.id}`)%others.length]:undefined;
 const c0={...base,other};
 const weights=MOTIFS.map(m=>({m,w:recent(h,e.id,m,day)?0:m.weight(c0)})).filter(x=>x.w>0);
 const hook=h.hooks.find(k=>k.emp===e.id&&day>=k.from&&day<=k.to&&weights.some(x=>x.m.id===k.motif));
 let chosen:Motif|undefined=hook?motifOf(hook.motif):undefined;
 if(!chosen&&weights.length){const total=weights.reduce((a,x)=>a+x.w,0);let r=hash(`hr:p:${day}:${e.id}`)%1000/1000*total;for(const x of weights){r-=x.w;if(r<0){chosen=x.m;break}}chosen??=weights[weights.length-1]!.m}
 if(!chosen)return null;
 if(chosen.id==='late'&&policyOf(s.company).candor==='open'&&hash(`hr:c:${day}:${e.id}`)%100<70)return null;
 const last=h.log.filter(l=>l.emp===e.id&&l.motif===chosen!.id).pop();let variant=hash(`hr:v:${day}:${e.id}`)%chosen.variants;
 if(last&&chosen.variants>1&&hrOf(s).log.some(l=>l.emp===e.id&&l.motif===chosen!.id)&&variant===(hash(`hr:v:${last.day}:${e.id}`)%chosen.variants))variant=(variant+1)%chosen.variants;
 return{motif:chosen,variant,other:chosen.id==='conflict'?other?.id:undefined,memory:hook?.motif===chosen.id?hook.memory:undefined}}

export function removeEmployee(n:GameState,emp:string){
 const c=n.company!;c.staff=(c.staff??[]).filter(x=>x.id!==emp);
 for(const p of c.projects?.active??[])p.team=p.team.filter(id=>id!==emp);
 for(const d of c.finance?.debts??[])if(d.emp===emp)d.left=true;
 if(c.hr){c.hr.pending=c.hr.pending.filter(p=>p.emp!==emp&&p.other!==emp);c.hr.hooks=c.hr.hooks.filter(k=>k.emp!==emp)}}

/** Áp một hiệu ứng lên save (đã sao chép). Trả tên người nghỉ nếu có. */
function apply(n:GameState,ev:HrEvent,ef:Eff,day:number,label:string):boolean{
 const c=n.company!;const idx=(c.staff??[]).findIndex(x=>x.id===ev.emp);if(idx<0)return false;
 if(ef.leave){removeEmployee(n,ev.emp);return true}
 const cur=c.staff![idx]!;let w=workAt(cur,day);
 const proj=ev.ref?c.projects?.active.find(p=>p.id===ev.ref):undefined;
 let wage=cur.wage;if(ef.wagePct)wage=Math.max(cur.wage,Math.min(r100(cur.wage*(1+ef.wagePct/100)),Math.max(cur.wage,r100(fairWage(cur)*1.5))));
 if(ef.fund){c.fund=Math.max(0,c.fund+ef.fund);book(c,day,label,ef.fund)}
 if(ef.rep)c.rep=clamp((c.rep??50)+ef.rep,0,100);
 if(proj){if(ef.progress)proj.progress=Math.min(proj.hours,Math.round((proj.progress+ef.progress)*10)/10);if(ef.errCut)proj.ew=Math.max(0,proj.ew*(1-ef.errCut/100));if(ef.hoursPct)proj.hours=clamp(Math.round(proj.hours*(1+ef.hoursPct/100)),Math.max(4,Math.ceil(proj.progress)),200);if(ef.rewardPct)proj.reward=Math.round(proj.reward*(1+ef.rewardPct/100)/1000)*1000;if(ef.dueDays)proj.due+=ef.dueDays;if(ef.unassign&&proj.team.length>1)proj.team=proj.team.filter(id=>id!==cur.id)}
 const exp=ef.exp?{...(w.exp??{}),[mainKey(cur)]:((w.exp??{})[mainKey(cur)]??0)+ef.exp}:w.exp;
 w={...w,morale:clamp(w.morale+(ef.morale??0),0,100),loyalty:clamp(w.loyalty+(ef.loyalty??0),0,100),fatigue:clamp(w.fatigue+(ef.fatigue??0),0,100),day:Math.max(w.day,day),...(exp?{exp}:{}),...(ef.off?{off:Math.max(w.off??0,day+ef.off)}:{})};
 c.staff![idx]={...(ef.know?withKnow(cur,ef.know):cur),wage,bond:clamp(bondOf(cur)+(ef.bond??0),0,100),work:w};
 const o=ev.other?(c.staff??[]).findIndex(x=>x.id===ev.other):-1;
 if(ef.other&&o>=0){const oc=c.staff![o]!,ow=workAt(oc,day);c.staff![o]={...oc,bond:clamp(bondOf(oc)+(ef.other.bond??0),0,100),work:{...ow,morale:clamp(ow.morale+(ef.other.morale??0),0,100),loyalty:clamp(ow.loyalty+(ef.other.loyalty??0),0,100),day:Math.max(ow.day,day)}}}
 return false}

const addMemory=(h:HrState,day:number,ev:HrEvent,topic:string,tag:string,weight:number)=>{h.memories=[{id:`m${h.seq++}`,day,emp:ev.emp,motif:ev.motif,topic,tag,weight},...h.memories].slice(0,HR.maxMem)};

/** Kết quả một lựa chọn (xác định theo seed của việc) để hiển thị trước khi lưu. */
function outcome(ev:HrEvent,o:Option):{eff:Eff;text:string}{
 const r=o.eff.roll;if(!r)return{eff:o.eff,text:o.result};
 const hit=hash(`${ev.id}:${o.tag}`)%100<Math.round(r.p);const{roll:_,...rest}=o.eff;
 return{eff:{...rest,...(hit?r.ok:r.no)},text:hit?o.result:(o.resultNo??o.result)}}

export type HrAction={kind:'hrChoose';id:string;tag:string};
const fail=(error:string):GameResult=>({ok:false,error});
function find(s:GameState,id:string){const ev=hrOf(s).pending.find(p=>p.id===id),e=ev?staffOf(s).find(x=>x.id===ev.emp):undefined;return ev&&e?{ev,e,m:motifOf(ev.motif)}:null}
/** Lời thoại, lựa chọn (kèm điều kiện) của một việc đang chờ, để vẽ hộp thoại. */
export function hrView(s:GameState,id:string){
 const f=find(s,id);if(!f)return null;const c=baseFor(s,f.e,s.day,f.ev.variant,f.ev);
 return{ev:f.ev,emp:f.e,name:f.m.name,line:f.m.line(c),options:f.m.options(c).map(o=>({label:o.label,tag:o.tag,locked:(o.need!==undefined&&c.comm<o.need)||(o.needFund!==undefined&&(s.company?.fund??0)<o.needFund)}))}}
/** Câu kết quả của một lựa chọn trước khi chọn (cùng seed nên khớp lúc áp dụng). */
export function hrPreview(s:GameState,id:string,tag:string):string|null{
 const f=find(s,id);if(!f)return null;const o=f.m.options(baseFor(s,f.e,s.day,f.ev.variant,f.ev)).find(x=>x.tag===tag);return o?outcome(f.ev,o).text:null}

export function hrAction(s:GameState,a:HrAction):GameResult{
 const f=find(s,a.id);if(!f||!s.company)return fail('Việc này không còn.');
 const c=baseFor(s,f.e,s.day,f.ev.variant,f.ev),o=f.m.options(c).find(x=>x.tag===a.tag);if(!o)return fail('Lựa chọn không hợp lệ.');
 if(o.need!==undefined&&c.comm<o.need)return fail(`Cần Giao tiếp Lv ${o.need}.`);
 if(o.needFund!==undefined&&s.company.fund<o.needFund)return fail('Quỹ công ty chưa đủ.');
 let n=structuredClone(s);const out=outcome(f.ev,o);
 if(out.eff.minutes){const t=spendTime(n,out.eff.minutes);if(!t.ok)return t;n=t.state}
 const left=apply(n,f.ev,out.eff,n.day,`${f.e.name}: ${f.m.name.toLowerCase()}`);
 const h=n.company!.hr!;h.pending=h.pending.filter(p=>p.id!==f.ev.id);
 if(!left){if(o.mem)addMemory(h,n.day,f.ev,o.mem[0],o.tag,o.mem[1]);
  if(o.hook&&h.hooks.length<HR.maxHooks){const mem=h.memories[0];h.hooks.push({emp:f.ev.emp,motif:o.hook[0],from:n.day+o.hook[1][0],to:n.day+o.hook[1][1],memory:o.mem&&mem?mem.id:''})}}
 h.hooks=h.hooks.filter(k=>!(k.emp===f.ev.emp&&k.motif===f.ev.motif));
 return{ok:true,state:recordJournal(n,`hr:${f.ev.id}`,`${f.e.name}: ${f.m.name}`,out.text)}}

/** Qua ngày: việc quá hạn tính là bỏ qua, rồi sinh việc mới (tối đa 2 mỗi ngày, mỗi nhân viên 1 việc chờ). */
export function settleHr(next:GameState):GameState{
 const co=next.company;if(!co||!(co.staff??[]).length)return next;
 if(co.hr&&co.hr.last>=next.day)return next;
 const n=structuredClone(next),c=n.company!,h=c.hr??={version:1,last:next.day-1,seq:0,pending:[],log:[],memories:[],hooks:[]},day=next.day;
 const notes:[string,string,string][]=[];
 h.hooks=h.hooks.filter(k=>day<=k.to);
 for(const ev of [...h.pending]){if(day<=ev.expires)continue;const e=(c.staff??[]).find(x=>x.id===ev.emp);h.pending=h.pending.filter(p=>p.id!==ev.id);if(!e)continue;
  const m=motifOf(ev.motif);
  if(ev.motif==='quit'||ev.motif==='poach'){apply(n,ev,{leave:true},day,'');notes.push([`hr:${ev.id}`,`${e.name} nghỉ việc`,`${e.name} chờ không được trả lời nên đã xin đi.`])}
  else{apply(n,ev,{morale:HR.ignoreMorale,loyalty:HR.ignoreLoyalty,bond:HR.ignoreBond},day,'');addMemory(h,day,ev,'sếp không trả lời khi em báo việc','ignored',3);notes.push([`hr:${ev.id}`,`${e.name}: ${m.name}`,'Việc này quá hạn không được xử lý.'])}}
 const order=[...(c.staff??[])].sort((a,b)=>hash(`hr:o:${day}:${a.id}`)-hash(`hr:o:${day}:${b.id}`));
 let made=h.log.filter(l=>l.day===day).length;
 for(const e of order){if(made>=HR.dailyMax||h.pending.length>=HR.maxPending)break;
  if(h.pending.some(p=>p.emp===e.id)||hash(`hr:r:${day}:${e.id}`)%100>=HR.chance)continue;
  const p=pick(n,e,day);if(!p)continue;
  const ps=projectsOf(n),proj=projectOf(ps,e.id);
  h.pending.push({id:`h${h.seq++}`,emp:e.id,motif:p.motif.id,variant:p.variant,day,expires:day+HR.expireDays,...(p.other?{other:p.other}:{}),...(proj&&['late','overtime','overreach','hoard','stuck','polish','demand','scope','clash'].includes(p.motif.id)?{ref:proj.id}:{}),...(p.memory?{memory:p.memory}:{})});
  h.log=[...h.log,{day,emp:e.id,motif:p.motif.id}].slice(-HR.maxLog);made++;
  h.hooks=h.hooks.filter(k=>!(k.emp===e.id&&k.motif===p.motif.id))}
 h.last=day;
 let out=n;for(const[key,title,detail]of notes)out=recordJournal(out,key,title,detail);
 return out}

const MOTIF_IDS:string[]=MOTIFS.map(m=>m.id);
export function validHr(v:unknown,day:number):v is HrState{
 if(!v||typeof v!=='object')return false;const h=v as HrState;
 const str=(x:unknown,n:number)=>typeof x==='string'&&x.length<n;
 return h.version===1&&Number.isInteger(h.last)&&h.last>=-1&&h.last<=day&&Number.isInteger(h.seq)&&h.seq>=0
  &&Array.isArray(h.pending)&&h.pending.length<=HR.maxPending&&h.pending.every(p=>!!p&&str(p.id,12)&&str(p.emp,40)&&MOTIF_IDS.includes(p.motif)&&Number.isInteger(p.variant)&&p.variant>=0&&p.variant<=3&&Number.isInteger(p.day)&&p.day>=0&&p.day<=day&&Number.isInteger(p.expires)&&p.expires>=p.day&&p.expires<=p.day+30&&(p.other===undefined||str(p.other,40))&&(p.ref===undefined||str(p.ref,12))&&(p.memory===undefined||str(p.memory,12)))
  &&Array.isArray(h.log)&&h.log.length<=HR.maxLog&&h.log.every(l=>!!l&&Number.isInteger(l.day)&&l.day>=0&&l.day<=day&&str(l.emp,40)&&MOTIF_IDS.includes(l.motif))
  &&Array.isArray(h.memories)&&h.memories.length<=HR.maxMem&&h.memories.every(m=>!!m&&str(m.id,12)&&Number.isInteger(m.day)&&m.day>=0&&m.day<=day&&str(m.emp,40)&&(MOTIF_IDS.includes(m.motif)||m.motif==='ignored'||m.motif==='work')&&str(m.topic,100)&&str(m.tag,20)&&Number.isInteger(m.weight)&&m.weight>=0&&m.weight<=9)
  &&Array.isArray(h.hooks)&&h.hooks.length<=HR.maxHooks&&h.hooks.every(k=>!!k&&str(k.emp,40)&&MOTIF_IDS.includes(k.motif)&&Number.isInteger(k.from)&&Number.isInteger(k.to)&&k.to>=k.from&&str(k.memory,12))}

/** Dùng ở test: các mô-típ và khoá kỹ năng chính. */
export const _internal={HIRE_SKILLS,levelOf};
