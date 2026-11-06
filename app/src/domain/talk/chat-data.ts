/** H7d: câu nhóm chat. Biến: {self} người nói tự xưng (như với người chơi), {you} người nói gọi người chơi, {y} người đáp gọi người vừa nhắn (người nhỏ hơn đáp thì thêm "Dạ,"), {c} người được nhắc tới, {r} chuyện của người nói hoặc tin đồn,
 * {thing} món sắp lên giá, {when} lúc hẹn ("tối nay"), {Place} chỗ hẹn. Câu viết thường đầu dòng, khi ghép tự viết hoa. */
export type GroupId='block'|'work'|'family';
export const GROUP_NAME:Record<GroupId,string>={block:'Khu trọ',work:'Đồng nghiệp',family:'Gia đình'};
export interface ChatLine{id:string;text:string;/** chỉ nhóm này */g?:GroupId[];/** chỉ vai này nói */who?:string[];/** chỉ khi chuyện của người nói vui hay buồn */tone?:'good'|'bad'}
/** Chuyện thường ngày gửi cả nhóm. */
export const CHAT_DAY:ChatLine[]=[
 {id:'cd-1',text:'mọi người ăn tối chưa',g:['block','work']},
 {id:'cd-2',text:'tối nay ai ở nhà không, {self} nấu dư nồi canh',g:['block']},
 {id:'cd-3',text:'sáng nay kẹt xe quá trời',g:['block','work']},
 {id:'cd-4',text:'chiều nay ai đi chợ mua giùm {self} bó rau với',g:['block']},
 {id:'cd-5',text:'trưa nay mọi người ăn gì',g:['work']},
 {id:'cd-6',text:'cà phê chiều không mọi người',g:['work']},
 {id:'cd-7',text:'hai đứa ăn uống đàng hoàng nha',g:['family'],who:['me']},
 {id:'cd-8',text:'trời trở lạnh rồi, nhớ mặc ấm nha',g:['family'],who:['me']},
 {id:'cd-9',text:'mẹ ơi con nhớ cơm mẹ nấu ghê',g:['family'],who:['em']},
 {id:'cd-10',text:'ở quê mới mưa to, mẹ với em vẫn khỏe',g:['family'],who:['me']},
 {id:'cd-11',text:'mẹ mới muối hũ dưa, bữa nào về lấy nha',g:['family'],who:['me']},
 {id:'cd-12',text:'cuối tuần nhớ gọi về cho mẹ nha',g:['family'],who:['me']},
 {id:'cd-13',text:'{you} ơi khi nào về quê',g:['family'],who:['em']},
 {id:'cd-14',text:'mẹ nhắc {you} hoài kìa',g:['family'],who:['em']},
 {id:'cd-15',text:'hôm nay em được điểm cao nè',g:['family'],who:['em']},
];
/** Theo thời tiết hôm nay. */
export const CHAT_WEATHER:Record<'rain'|'storm'|'sunny',ChatLine[]>={
 rain:[{id:'cw-1',text:'trời mưa quá, ai đi đâu nhớ mang áo mưa nha'},{id:'cw-2',text:'mưa vầy chắc ở nhà luôn quá'}],
 storm:[{id:'cw-3',text:'bão tới rồi, mọi người đóng cửa sổ cẩn thận nha'}],
 sunny:[{id:'cw-4',text:'nóng quá mọi người ơi'},{id:'cw-5',text:'nắng vầy phơi đồ khô liền'}],
};
/** Người nói kể chuyện của mình ({r} theo RUMOR_TEXT, đúng sự thật). */
export const CHAT_SELF:ChatLine[]=[
 {id:'cs-1',text:'{self} {r} nè mọi người',tone:'good'},
 {id:'cs-2',text:'khoe chút, {self} {r}',tone:'good'},
 {id:'cs-3',text:'mấy bữa nay {self} {r}, mệt ghê',tone:'bad'},
 {id:'cs-4',text:'dạo này {self} {r}, buồn ghê',tone:'bad'},
];
/** Người khác trong nhóm đáp lại. */
export const CHAT_REPLY:Record<'good'|'bad'|'plain',ChatLine[]>={
 good:[{id:'cr-1',text:'chúc mừng {y} nha'},{id:'cr-2',text:'hay quá ta'},{id:'cr-3',text:'vậy là {y} phải khao rồi đó'}],
 bad:[{id:'cr-4',text:'{y} mau khỏe nha'},{id:'cr-5',text:'có gì cần cứ nói nha {y}'},{id:'cr-6',text:'{y} ráng lên nha'}],
 plain:[{id:'cr-7',text:'đúng rồi'},{id:'cr-8',text:'{self} cũng vậy nè'}],
};
/** Tin đồn trong nhóm (người được nhắc không có trong nhóm). */
export const CHAT_RUMOR:ChatLine[]=[
 {id:'ch-1',text:'mọi người nghe gì chưa, {c} {r}'},
 {id:'ch-2',text:'nghe đâu {c} {r} đó'},
 {id:'ch-3',text:'hôm qua {self} nghe kể {c} {r}'},
];
export const CHAT_PRICE:ChatLine[]=[
 {id:'cp-1',text:'nghe nói mấy bữa tới {thing} lên giá đó mọi người'},
 {id:'cp-2',text:'ai cần mua {thing} thì mua sớm nha, sắp lên giá rồi'},
];
/** Thông báo việc có thật trong game. */
export const CHAT_NEWS={
 rent:[{id:'cn-1',text:'nhắc mọi người mùng 1 đóng tiền trọ nha'},{id:'cn-2',text:'sắp tới mùng 1 rồi, ai đóng trọ rồi thì nhắn {self} nha'}],
 parcel:[{id:'cn-3',text:'mẹ gửi đồ lên bến xe rồi đó, nhớ ra lấy nha'}],
 bday:[{id:'cn-4',text:'mai sinh nhật {c} đó mọi người'}],
 monthEnd:[{id:'cn-5',text:'cuối tháng chốt việc rồi, mọi người ráng nha'}],
 monday:[{id:'cn-6',text:'mai đầu tuần, họp lúc 9 giờ nha mọi người'}],
} as const satisfies Record<string,readonly ChatLine[]>;
/** Rủ cả nhóm (hẹn giờ, chỗ). */
export const CHAT_INVITE:ChatLine[]=[
 {id:'ci-1',text:'{when} ra {Place} ăn chung không mọi người'},
 {id:'ci-2',text:'{when} ai rảnh đi {Place} với {self} không'},
];
export const INVITE_PLACE:Record<GroupId,{place:'streetfood'|'restaurant'|'park';name:string;minute:number;days:'today'|'weekend'}[]>={
 block:[{place:'streetfood',name:'quán ven đường',minute:1140,days:'today'},{place:'park',name:'công viên đi bộ',minute:420,days:'weekend'}],
 work:[{place:'restaurant',name:'nhà hàng',minute:1110,days:'today'},{place:'streetfood',name:'quán ven đường',minute:1110,days:'today'}],
 family:[],
};
/** Người chơi trả lời (1 lần mỗi nhóm mỗi ngày). `rel` cộng nhẹ cho người vừa nhắn. */
export interface PlayerReply{id:string;text:string;rel:number;go?:boolean}
export const PLAYER_REPLY:Record<'chat'|'good'|'bad'|'rumor'|'news'|'invite'|'family',PlayerReply[]>={
 chat:[{id:'pc-1',text:'Hay đó',rel:1},{id:'pc-2',text:'Ok',rel:0}],
 good:[{id:'pg-1',text:'Chúc mừng nha',rel:2},{id:'pg-2',text:'Khao đi',rel:1}],
 bad:[{id:'pb-1',text:'Mau khỏe nha',rel:2},{id:'pb-2',text:'Cần gì cứ nhắn nha',rel:2}],
 rumor:[{id:'pr-1',text:'Thiệt hả',rel:0},{id:'pr-2',text:'Chuyện người ta mà',rel:0}],
 news:[{id:'pn-1',text:'Dạ biết rồi',rel:1},{id:'pn-2',text:'Ok',rel:0}],
 invite:[{id:'pi-1',text:'Đi luôn',rel:1,go:true},{id:'pi-2',text:'Bữa nay bận rồi',rel:0}],
 family:[{id:'pf-1',text:'Dạ con biết rồi',rel:1},{id:'pf-2',text:'Nhớ nhà ghê',rel:2}],
};
