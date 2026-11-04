/** T15: bảng chọn việc buổi sáng và điểm rẽ giữa ca (chủ dự án chốt 04/11). */
import type {GameState} from './types';
import type {SkillId} from './skill-xp';
import type {TaskId} from './work';

export type CardKind='safe'|'stretch'|'urgent'|'help';
export const CARD_NAME:Record<CardKind,string>={safe:'Chắc ăn',stretch:'Thử sức',urgent:'Gấp',help:'Giúp đồng nghiệp'};
export interface TaskCard{kind:CardKind;taskId:TaskId;bonus?:number;npcId?:string}
export const HELP_CHANCE=35,URGENT_RATING=4,LATE_RATING=-3,RATING_START=50,HELP_RELATION=5;
export const urgentBonus=(level:number)=>Math.min(300000,150000+50000*(level-1));

/** Băm chuỗi thành số 32 bit, dùng cho mọi lựa chọn theo seed. */
export function hash(text:string){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}

export type Effect={progress?:number;rating?:number;mood?:number;stress?:number;energy?:number;money?:number;bonus?:number;relation?:[string,number];xp?:[SkillId,number]};
export interface TurnOption{label:string;need?:[SkillId,number];effect:Effect;result:string}
export interface TurnEvent{id:string;npc:string;line:string;options:TurnOption[]}

/** Tám điểm rẽ ban đầu. Dạng dữ liệu để T17 chuyển thành mô-típ. Hệ quả không hiện cho người chơi trước khi chọn. */
export const TURNS:TurnEvent[]=[
 {id:'hotfix',npc:'dev-trang',line:'Khách vừa báo trang thanh toán lỗi. Em bỏ việc đang làm qua xem giúp chị được không?',options:[
  {label:'Để em xem ngay',effect:{progress:-30,rating:3,stress:5},result:'Bạn sửa kịp lỗi cho khách. Việc của mình chậm lại một chút.'},
  {label:'Em làm xong phần này rồi qua',effect:{rating:-1},result:'Chị Trang gật đầu nhưng có vẻ hơi sốt ruột.'},
  {label:'Gọi Gia Huy kiểm thử cùng',need:['communication',3],effect:{progress:-15,rating:3,relation:['dev-huy',3]},result:'Hai người chia nhau, lỗi được xử lý nhanh gọn.'}]},
 {id:'help-an',npc:'dev-an',line:'Đoạn này mình bí quá. Bạn xem giúp mình khoảng 20 phút được không?',options:[
  {label:'Ngồi xem cùng',effect:{progress:-20,relation:['dev-an',5],xp:['logic',10]},result:'Hai người tìm ra chỗ sai. Minh An cảm ơn rối rít.'},
  {label:'Chỉ tài liệu cho An tự đọc',need:['logic',3],effect:{progress:-5,relation:['dev-an',3]},result:'Tài liệu đúng chỗ cần, An tự xử lý được.'},
  {label:'Để chiều nhé',effect:{relation:['dev-an',-2]},result:'An quay về bàn, trông hơi hụt hẫng.'}]},
 {id:'coffee',npc:'dev-linh',line:'Xuống uống cà phê không, hôm nay mình mời!',options:[
  {label:'Đi luôn',effect:{progress:-15,mood:6,stress:-6,relation:['dev-linh',3]},result:'Mười lăm phút nói chuyện làm đầu óc nhẹ hẳn.'},
  {label:'Mua giúp mình một ly',effect:{money:-25000,energy:8},result:'Ly cà phê đến tận bàn, tỉnh cả người.'},
  {label:'Đang dở tay, để lần sau',effect:{relation:['dev-linh',-1]},result:'Linh đi một mình.'}]},
 {id:'standup',npc:'dev-trang',line:'Mười phút nữa họp nhanh, em trình bày phần việc của mình nhé.',options:[
  {label:'Chuẩn bị thật kỹ',effect:{progress:-20,rating:3},result:'Phần trình bày rõ ràng, cả nhóm nắm được tiến độ.'},
  {label:'Nói ngắn gọn ý chính',need:['communication',3],effect:{rating:4},result:'Ngắn mà đủ ý, chị Trang khen trước cả nhóm.'},
  {label:'Xin vắng để làm cho kịp',effect:{rating:-2},result:'Bạn ở lại bàn làm tiếp, cuộc họp thiếu phần của bạn.'}]},
 {id:'blame',npc:'dev-huy',line:'Lỗi hôm qua hình như bắt nguồn từ phần bạn làm.',options:[
  {label:'Nhận và sửa ngay',effect:{progress:-20,rating:2,stress:4},result:'Lỗi được vá trong buổi. Bạn hơi mệt nhưng yên tâm.'},
  {label:'Kiểm tra log trước đã',need:['logic',4],effect:{rating:3,relation:['dev-huy',2]},result:'Log cho thấy lỗi nằm ở chỗ khác. Huy xin lỗi và cảm ơn.'},
  {label:'Không phải phần mình đâu',effect:{relation:['dev-huy',-3],stress:-2},result:'Huy im lặng quay đi.'}]},
 {id:'deploy',npc:'dev-trang',line:'Tối nay nhóm cần người ở lại hỗ trợ triển khai. Em giúp được không?',options:[
  {label:'Được ạ, em ở lại',effect:{bonus:150000,energy:-15,rating:3},result:'Triển khai suôn sẻ. Khoản hỗ trợ sẽ vào lương ngày 1.'},
  {label:'Em ở lại một tiếng thôi',effect:{bonus:60000,energy:-6,rating:1},result:'Bạn phụ được phần đầu rồi về.'},
  {label:'Tối nay em bận rồi',effect:{rating:-1},result:'Chị Trang tìm người khác.'}]},
 {id:'music',npc:'dev-an',line:'Mình bật nhạc hơi to, có làm phiền bạn không?',options:[
  {label:'Không sao đâu',effect:{stress:3,relation:['dev-an',2]},result:'An vui vẻ, còn bạn cố tập trung giữa tiếng nhạc.'},
  {label:'Rủ An đeo tai nghe',need:['communication',2],effect:{relation:['dev-an',1]},result:'An cười, lấy tai nghe ra ngay.'},
  {label:'Hơi phiền thật',effect:{relation:['dev-an',-2],stress:-2},result:'An tắt nhạc, không khí hơi ngượng.'}]},
 {id:'call',npc:'dev-trang',line:'Khách gọi phàn nàn mà chị đang bận. Em nghe máy giúp chị nhé?',options:[
  {label:'Để em nghe',effect:{progress:-15,xp:['communication',20],stress:5,rating:2},result:'Khách bình tĩnh lại sau khi được nghe giải thích.'},
  {label:'Ghi lại rồi chuyển chị',need:['management',2],effect:{progress:-5,rating:2},result:'Bạn ghi đủ ý, chị Trang xử lý nhanh.'},
  {label:'Em chưa quen việc này',effect:{rating:-1},result:'Chị Trang tự nghe máy.'}]},
];

/** Chọn điểm rẽ của ngày, tránh lặp với điểm rẽ trước đó. */
export function pickTurn(day:number,companyId:string,previous?:string){const list=TURNS.filter(t=>t.id!==previous);return list[hash(`turn:${day}:${companyId}`)%list.length]!}
export const turnOf=(id:string)=>TURNS.find(t=>t.id===id);
export const ratingOf=(s:GameState)=>s.work?.rating??RATING_START;
/** Đánh giá trên 50 rút ngắn thời gian tối thiểu lên Middle, 2 ngày cho mỗi điểm, không dưới 120 ngày. */
export const middleDays=(rating:number|undefined)=>Math.max(120,180-2*Math.max(0,(rating??RATING_START)-RATING_START));
