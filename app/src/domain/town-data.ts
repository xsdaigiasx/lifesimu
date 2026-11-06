/** H7a: dữ liệu NPC ngẫu nhiên (HOI-THOAI I.1d, Lô 3): kiểu người theo nơi gặp và mạch chuyện riêng nhiều nhịp.
 * Chủ dự án duyệt 06/11: gặp ở khu trọ, chợ và quán, công viên; bắt đầu 6 người, tối đa 12 cùng lúc,
 * sinh thêm tối đa 2 người mỗi tuần ở nơi hay lui tới, rời đi khi 30 ngày không gặp và chưa tới Quen biết, quay lại 5%.
 * Chỉ chứa dữ liệu (không đọc save) để npc.ts dùng được mà không vòng import. */
import type {PlaceId} from './types';

type Slot={days:number[];from:number;to:number;place:PlaceId};
const WEEK=[0,1,2,3,4,5,6],WORK=[1,2,3,4,5],END=[0,6],h=(t:string)=>{const [a,b]=t.split(':').map(Number);return a!*60+b!};
const at=(days:number[],from:string,to:string,place:PlaceId):Slot=>({days,from:h(from),to:h(to),place});

/** 12 ô cho NPC ngẫu nhiên; ô từ a tới f có người ngay từ đầu đời chơi. */
export const TOWN_IDS=['a','b','c','d','e','f','g','h','i','j','k','l'].map(x=>`town-${x}`);
export const TOWN_START=TOWN_IDS.slice(0,6);
export const isTown=(id:string)=>TOWN_IDS.includes(id.split('.')[0]!);
/** Nơi có thể gặp NPC ngẫu nhiên. */
export const TOWN_PLACES:readonly PlaceId[]=['home','market','streetfood','park'];

/** Kiểu người: nhãn vai, nơi gặp, tuổi, các phương án lịch (rút một theo người), cách nói nơi gặp trong câu. */
export interface Arch{id:string;role:string;place:PlaceId;age:[number,number];where:string;sched:Slot[][]}
export const ARCHES:Arch[]=[
 {id:'tenant',role:'Người thuê phòng bên cạnh',place:'home',age:[21,34],where:'ở dãy trọ',sched:[[at(WORK,'07:00','07:50','home'),at(WORK,'18:30','21:30','home'),at(END,'09:00','11:00','home')],[at(WORK,'19:00','22:30','home'),at(END,'15:00','18:00','home')]]},
 {id:'student',role:'Sinh viên ở trọ',place:'home',age:[18,23],where:'ở dãy trọ',sched:[[at(WEEK,'21:00','23:30','home'),at(END,'09:00','11:30','home')],[at(WORK,'11:30','13:00','home'),at(WEEK,'20:00','22:30','home')]]},
 {id:'shopper',role:'Khách quen ở chợ',place:'market',age:[32,68],where:'ở chợ',sched:[[at(WEEK,'07:00','09:00','market')],[at(WEEK,'08:00','10:00','market')]]},
 {id:'diner',role:'Khách quen quán vỉa hè',place:'streetfood',age:[22,45],where:'ở quán',sched:[[at(WORK,'07:10','08:00','streetfood')],[at(WORK,'12:00','13:00','streetfood'),at(END,'19:00','20:30','streetfood')],[at(WEEK,'18:30','20:00','streetfood')]]},
 {id:'jogger',role:'Người chạy bộ ở công viên',place:'park',age:[24,45],where:'ngoài công viên',sched:[[at([1,3,5],'17:30','19:00','park'),at(END,'07:00','08:30','park')],[at(WEEK,'18:00','19:30','park')]]},
 {id:'dog',role:'Người dắt chó đi dạo',place:'park',age:[28,62],where:'ngoài công viên',sched:[[at(WEEK,'07:00','08:00','park'),at(WEEK,'18:00','19:00','park')]]},
 {id:'chess',role:'Người chơi cờ ở công viên',place:'park',age:[62,80],where:'ngoài công viên',sched:[[at(WEEK,'15:00','17:30','park')],[at(WEEK,'07:00','08:30','park'),at([1,3,5],'15:30','17:30','park')]]},
];
export const archOf=(id:string|undefined)=>ARCHES.find(a=>a.id===id);
/** Kiểu người của ô ở đời đầu: hai người khu trọ, một ở chợ, một ở quán, hai ở công viên; ô sau rút tự do. */
export const START_PLACE:Record<string,PlaceId>={'town-a':'home','town-b':'home','town-c':'market','town-d':'streetfood','town-e':'park','town-f':'park'};

/** Một nhịp của mạch chuyện. `doing` đặt sau "đang" ("đang rải hồ sơ xin việc"); `now` đặt trong "giờ thì {self} ... rồi".
 * `alt`: nhịp thay thế với xác suất phần trăm (kết quả xấu hoặc khác). */
export interface Beat{id:string;tone:'good'|'bad'|'plain';dur:[number,number];doing:string;now:string;private?:0|1;alt?:[number,Omit<Beat,'alt'>]}
export interface Arc{id:string;name:string;arch:string[];age?:[number,number];beats:Beat[]}
const B=(id:string,tone:Beat['tone'],dur:[number,number],doing:string,now:string,alt?:[number,Omit<Beat,'alt'>]):Beat=>({id,tone,dur,doing,now,...(alt?{alt}:{})});
export const ARCS:Arc[]=[
 {id:'lenpho',name:'mới lên phố tìm việc',arch:['tenant','diner'],age:[19,28],beats:[
  B('hoso','bad',[6,10],'rải hồ sơ xin việc','nộp hồ sơ khắp nơi'),
  B('phongvan','plain',[4,7],'chờ kết quả phỏng vấn','đi phỏng vấn được hai chỗ'),
  B('coviec','good',[6,10],'tập làm việc mới','có việc làm',[30,B('truot','bad',[6,10],'tìm chỗ làm khác','trượt chỗ đó, đi tìm chỗ khác')]),
  B('quenviec','good',[6,10],'quen dần chỗ làm','gửi được tháng lương đầu về quê')]},
 {id:'onthi',name:'ôn thi',arch:['student'],beats:[
  B('on','bad',[6,10],'ôn thi','vô mùa thi'),
  B('chodiem','plain',[4,7],'chờ điểm thi','thi xong'),
  B('dau','good',[5,8],'nghỉ xả hơi','qua hết các môn',[30,B('rot','bad',[6,9],'học lại môn bị rớt','rớt một môn')])]},
 {id:'hocanh',name:'học tiếng Anh buổi tối',arch:['tenant','diner','student'],age:[19,35],beats:[
  B('dangky','plain',[5,8],'học tiếng Anh buổi tối','đăng ký lớp tiếng Anh buổi tối'),
  B('baitap','bad',[6,10],'bù đầu với bài tập tiếng Anh','học được nửa khoá'),
  B('thi','plain',[4,6],'chờ điểm thi tiếng Anh','thi chứng chỉ tiếng Anh'),
  B('dat','good',[6,10],'tính xin chỗ làm lương cao hơn','lấy được chứng chỉ tiếng Anh',[30,B('thieu','bad',[6,9],'ôn lại để thi lần nữa','thiếu chút điểm')])]},
 {id:'moquan',name:'tính mở quán',arch:['diner','shopper'],age:[28,55],beats:[
  B('gomtien','plain',[6,10],'gom tiền mở quán','gom gần đủ tiền mở quán',undefined),
  B('matbang','plain',[5,8],'đi xem mặt bằng','đặt cọc được mặt bằng'),
  B('khaitruong','good',[3,5],'lo khai trương quán','khai trương quán'),
  B('dong','good',[8,12],'bán ở quán mới','có khách quen ở quán',[40,B('vang','bad',[8,12],'gồng cái quán vắng khách','mở quán mà khách còn thưa')])]},
 {id:'cuoi',name:'chuẩn bị cưới',arch:['tenant','diner','jogger'],age:[24,35],beats:[
  B('damhoi','good',[5,8],'chuẩn bị đám hỏi','làm đám hỏi xong'),
  B('locuoi','bad',[8,12],'lo đám cưới','in thiệp cưới'),
  B('cuoi','good',[4,6],'nghỉ phép sau đám cưới','làm đám cưới'),
  B('donnha','plain',[6,10],'sắp xếp nhà cửa sau đám cưới','dọn về ở chung')]},
 {id:'giaichay',name:'tập cho giải chạy',arch:['jogger'],beats:[
  B('dangky','plain',[6,9],'tập cho giải chạy','đăng ký giải chạy mười cây số'),
  B('tangcu','good',[6,10],'tập tăng cự ly','chạy được tám cây'),
  B('xong','good',[4,6],'nghỉ ngơi sau giải chạy','chạy hết giải',[30,B('chan','bad',[5,8],'dưỡng cái chân bị đau','bị chuột rút giữa đường chạy')])]},
 {id:'nuoicho',name:'nuôi chó',arch:['dog'],beats:[
  B('moinhan','good',[5,8],'tập cho con chó con quen nhà','nhận nuôi một con chó con'),
  B('phado','bad',[5,8],'dọn đồ con chó cắn nát','bị con chó cắn nát đôi dép'),
  B('om','bad',[4,7],'chăm con chó bị ốm','đưa con chó đi thú y'),
  B('ngoan','good',[6,10],'dạy con chó ngồi bắt tay','dạy được con chó ngồi bắt tay')]},
 {id:'trongchau',name:'trông cháu',arch:['chess','shopper','dog'],age:[52,80],beats:[
  B('len','good',[6,9],'trông đứa cháu con gửi lên','được con gửi đứa cháu lên ở'),
  B('duadon','plain',[8,12],'đưa đón cháu đi học','quen việc đưa đón cháu'),
  B('thi','plain',[4,6],'lo cháu thi học kỳ','thấy cháu thi xong'),
  B('ve','bad',[5,8],'nhớ đứa cháu mới về lại nhà','tiễn đứa cháu về lại nhà')]},
 {id:'huyetap',name:'giữ huyết áp',arch:['chess','shopper'],age:[55,80],beats:[
  B('cao','bad',[6,9],'kiêng mặn vì huyết áp cao','bị bác sĩ dặn kiêng mặn'),
  B('tap','plain',[8,12],'tập đi bộ mỗi sáng','đi bộ đều mỗi sáng'),
  B('on','good',[6,9],'giữ huyết áp cho ổn','đo lại huyết áp thấy ổn')]},
 {id:'trongrau',name:'trồng rau sân thượng',arch:['shopper','chess','dog'],age:[40,80],beats:[
  B('trong','plain',[6,9],'chăm mấy luống rau trên sân thượng','trồng mấy luống rau trên sân thượng'),
  B('sau','bad',[4,7],'bắt sâu cho mấy luống rau','bị sâu ăn gần hết mấy luống cải'),
  B('thu','good',[5,8],'hái rau nhà trồng','hái được mớ rau đầu tiên')]},
];
/** Chủ đề con của dữ kiện mạch chuyện: `a.<mạch>.<nhịp>`. */
export const arcSub=(arc:string,beat:string)=>`a.${arc}.${beat}`;
export const ARC_SUBS:readonly string[]=ARCS.flatMap(a=>a.beats.flatMap(b=>[arcSub(a.id,b.id),...(b.alt?[arcSub(a.id,b.alt[1].id)]:[])]));
/** Dữ kiện về lần gặp trước: chỉ nhớ đã gặp, gặp lại khi nhịp chuyện vẫn vậy, gặp lại khi chuyện đã sang nhịp mới, người quay lại sau khi chuyển đi. */
export const MET_SUBS=['met','metsame','metnew','back'] as const;
