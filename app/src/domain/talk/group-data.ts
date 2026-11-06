/** H7c: câu cho cảnh nhóm và tin đồn. Biến: {aS} A tự xưng với B, {aY} A gọi B, {bN} tên B theo cách A gọi,
 * {bS} {bY} B tự xưng và gọi A, {c} người được nhắc tới (theo cách người nói gọi), {r} nội dung tin, {thing} món sắp lên giá,
 * {pY} người nói gọi người chơi, {pS} người nói tự xưng với người chơi. Câu đáp của người nhỏ tuổi hơn tự thêm "Dạ,". */

/** Nội dung tin đồn theo biến cố: `t` đúng, `big` thổi phồng (không có thì không thổi phồng được). */
export const RUMOR_TEXT:Record<string,{t:string;big?:string;private?:boolean}>={
 cold:{t:'đang bị cảm',big:'bệnh nặng nằm nhà cả tuần'},
 backache:{t:'bị đau lưng',big:'đau lưng tới đi không nổi'},
 flu:{t:'bị sốt mấy bữa nay',big:'sốt cao phải vô viện'},
 checkup:{t:'mới đi khám bệnh',big:'đi khám ra bệnh nặng lắm',private:true},
 promotion:{t:'mới được lên chức',big:'sắp lên làm sếp lớn'},
 bonus:{t:'mới được thưởng',big:'được thưởng cả trăm triệu'},
 overtime:{t:'tăng ca suốt',big:'tăng ca tới ngủ luôn ở công ty'},
 boss:{t:'đang không vui với sếp',big:'cãi nhau to với sếp',private:true},
 jobhunt:{t:'đang kiếm chỗ làm khác',big:'sắp nghỉ ngang tới nơi',private:true},
 newjob:{t:'mới nhận chỗ làm mới',big:'được chỗ mới trả lương gấp đôi'},
 slow:{t:'dạo này bán ế',big:'bán ế tới tính dẹp sạp'},
 brisk:{t:'dạo này bán đắt hàng',big:'bán đắt tới tính mua nhà'},
 short:{t:'đang kẹt tiền',big:'nợ nần tùm lum',private:true},
 debt:{t:'đang mắc nợ',big:'bị người ta tới đòi nợ',private:true},
 buy:{t:'mới mua {item}',big:'mới tậu {item} mấy chục triệu'},
 kidpass:{t:'có con thi đậu',big:'có con đậu thủ khoa'},
 visit:{t:'có người nhà lên chơi'},
 relsick:{t:'có người nhà đang ốm',big:'có người nhà nằm viện'},
 renovate:{t:'đang sửa nhà',big:'xây lại nguyên cái nhà'},
 trip:{t:'mới đi chơi xa về'},
 lost:{t:'mới làm mất đồ',big:'bị móc mất nguyên cái bóp'},
 scam:{t:'suýt bị lừa tiền',big:'bị lừa mất cả đống tiền',private:true},
 lonely:{t:'dạo này buồn lắm',private:true},
 frail:{t:'dạo này yếu lắm'},
 retire:{t:'sắp nghỉ rồi'},
};
/** Tin giá chợ: món theo người bán. */
export const PRICE_THING:Record<string,string>={veg:'rau',meat:'thịt cá'};

export interface GroupLine{id:string;text:string;/** câu đáp ấm hay lạnh (khi người chơi kể tin) */mood?:'warm'|'cold';/** chỉ hợp tin vui hoặc tin buồn */tone?:'good'|'bad';/** chỉ dùng cho các biến cố này */need?:string[];/** không thêm "Dạ," (câu mở bằng tiếng than) */noDa?:boolean}
/** Mở chuyện tin đồn (A nói với B về người thứ ba). */
export const GOSSIP_OPEN:GroupLine[]=[
 {id:'go-1',text:'{bN} nghe gì chưa, {c} {r} đó.'},
 {id:'go-2',text:'Nói nhỏ {aY} nghe nè, {c} {r}.'},
 {id:'go-3',text:'Hôm qua {aS} nghe người ta kể {c} {r}.'},
 {id:'go-4',text:'{aY} biết không, nghe đâu {c} {r}.'},
 {id:'go-5',text:'Chuyện này {aS} cũng nghe người ta nói thôi, {c} {r}.'},
 {id:'go-7',text:'Ủa {aY} nghe chưa, {c} {r}.'},
 {id:'go-8',text:'Mới sáng nay {aS} nghe kể {c} {r}.'},
 {id:'go-6',text:'Hèn chi mấy bữa nay vắng, {c} {r} đó {aY}.',need:['cold','backache','flu','checkup','overtime','relsick','visit','trip','frail','renovate']},
];
/** B đáp tin đồn: tin, ngờ, thương. */
export const GOSSIP_REPLY:GroupLine[]=[
 {id:'gr-1',text:'Thiệt hả {bY}? Vậy mà {bS} không hay.'},
 {id:'gr-2',text:'Ai nói vậy {bY}? {bS} chưa tin đâu.'},
 {id:'gr-3',text:'Thôi {bY}, chưa chắc thì đừng nói.'},
 {id:'gr-4',text:'Trời, vậy hả. Tội ghê.',tone:'bad',noDa:true},
 {id:'gr-5',text:'Bữa nào gặp {bS} hỏi thử coi.'},
 {id:'gr-9',text:'Vậy hả {bY}, {bS} mới nghe lần đầu.'},
 {id:'gr-10',text:'Thôi, chuyện người ta mà {bY}.'},
 {id:'gr-6',text:'Vậy hả, hay quá ta.',tone:'good'},
 {id:'gr-7',text:'Mừng cho {c} ghê.',tone:'good'},
 {id:'gr-8',text:'Lo cho {c} ghê.',tone:'bad'},
];
/** Tin giá chợ (người bán, người đi chợ). */
export const PRICE_OPEN:GroupLine[]=[
 {id:'po-1',text:'{bN} ơi, nghe nói mấy bữa tới {thing} lên giá đó.'},
 {id:'po-2',text:'Mối hàng báo {thing} sắp lên giá rồi {aY}.'},
 {id:'po-3',text:'Nghe nói sắp tới {thing} mắc lắm đó {aY}.'},
];
export const PRICE_REPLY:GroupLine[]=[
 {id:'pr-1',text:'Vậy mai {bS} mua trước ít.'},
 {id:'pr-2',text:'Năm nào cũng đồn vậy, {bS} chưa tin.'},
 {id:'pr-3',text:'Vậy ráng mua trước vài bữa.'},
];
/** Chuyện thường giữa hai người đang hợp nhau. `{r}` là biến cố thật của B (`tone` theo biến cố đó). */
export const CHAT:{open:string;reply:string[];tone?:'good'|'bad'}[]=[
 {open:'Nghe nói {aY} {r}, giờ sao rồi?',reply:['Cũng đỡ rồi {bY}.','Vẫn vậy {bY} ơi.'],tone:'bad'},
 {open:'Nghe nói {aY} {r}, mừng nha.',reply:['Cảm ơn {bY} nha.','Có gì đâu {bY}.'],tone:'good'},
 {open:'{bN} ăn gì chưa?',reply:['Chưa, tính lát ra quán đây.','Ăn rồi {bY}.']},
 {open:'Bữa nay trời nóng ghê {aY}.',reply:['Nóng muốn xỉu luôn.']},
 {open:'Sáng nay {aY} đi đâu sớm vậy?',reply:['Đi chợ chút {bY}.','Có chút việc thôi {bY}.']},
 {open:'Dạo này {aY} khỏe không?',reply:['Cũng khỏe {bY}.','Cũng tàm tạm {bY}.']},
 {open:'Lâu quá mới gặp {aY} nha.',reply:['Dạo này {bS} bận quá {bY}.']},
];
/** Bất đồng theo nơi: A trách, B cãi. */
export const SPAT:{at:import('./ties').TieKind;open:string;reply:string;/** A phải là người bán, hoặc cả hai */need?:'sellerA'|'sellers'}[]=[
 {at:'block',open:'{bN} phơi đồ lấn qua chỗ {aS} nữa rồi.',reply:'Có chút xíu mà {bY} cũng nói.'},
 {at:'block',open:'Tối qua {aY} mở nhạc lớn quá, {aS} không ngủ được.',reply:'Mới chín giờ mà {bY}.'},
 {at:'block',open:'Rác ai bỏ trước cửa vậy {aY}?',reply:'Đâu phải của {bS}.'},
 {at:'block',open:'Xe {aY} dựng chắn lối đi rồi kìa.',reply:'Có ai đi đâu mà {bY}.'},
 {at:'market',open:'Hàng của {aY} để lấn qua sạp {aS} rồi.',reply:'Có chút xíu mà {bY}.',need:'sellers'},
 {at:'market',open:'{bN} bán rẻ vậy là giành khách của {aS} rồi.',reply:'Ai bán giá nấy chứ {bY}.',need:'sellers'},
 {at:'market',open:'Xe của {aY} chắn lối vô sạp {aS} kìa.',reply:'Để chút xíu thôi mà.',need:'sellerA'},
 {at:'eat',open:'Bữa nay ổ bánh mì nhỏ hơn bữa trước đó {aY}.',reply:'Giá vẫn vậy mà {bY}.'},
 {at:'eat',open:'{bN} ngồi lâu quá, khách đứng chờ kìa.',reply:'{bS} ăn chưa xong mà.'},
 {at:'eat',open:'Ớt hết rồi mà {aY} không châm thêm.',reply:'Đông khách quá mà {bY}.'},
 {at:'park',open:'{bN} mở nhạc nhỏ lại giùm, ồn quá.',reply:'Tập thể dục phải có nhạc chứ {bY}.'},
 {at:'park',open:'Chó của {aY} chạy lung tung, suýt làm {aS} té.',reply:'Nó hiền lắm mà {bY}.'},
 {at:'park',open:'Chỗ này sáng nào {aS} cũng tập mà {aY}.',reply:'Công viên đâu của riêng ai.'},
 {at:'work',open:'Phần đó {aY} hứa xong từ hôm qua mà.',reply:'Thì {bS} bị dồn việc mà {bY}.'},
 {at:'work',open:'Họp mà {aY} tới trễ hoài vậy.',reply:'Kẹt xe mà {bY}.'},
 {at:'work',open:'Lỗi đó đâu phải do {aS}, {aY} đừng đổ.',reply:'{bS} có nói ai đâu.'},
];
/** A quay sang nhờ người chơi phân xử. */
export const JUDGE:GroupLine[]=[
 {id:'ju-1',text:'{pY} thấy vậy có đúng không?'},
 {id:'ju-2',text:'{pY} nói giùm một câu coi.'},
 {id:'ju-3',text:'{pY} đứng đó nãy giờ, thấy ai đúng?'},
];
/** Sau lựa chọn của người chơi: người bị bênh, người bị phản, được hoà giải, không chịu hoà giải. */
export const AFTER={
 won:[{id:'aw-1',text:'Đó, {pS} nói có sai đâu.'},{id:'aw-2',text:'Thấy chưa, ai cũng thấy vậy.'},{id:'aw-3',text:'Có người hiểu {pS} rồi.'}],
 lost:[{id:'al-1',text:'Rồi, hùa nhau hết. {pS} không nói nữa.'},{id:'al-2',text:'Thôi được, {pS} biết rồi.'},{id:'al-3',text:'Ờ, {pY} bênh người ta thì thôi.'}],
 calm:[{id:'ac-1',text:'Thôi, bỏ qua đi.'},{id:'ac-2',text:'Ừ, {pS} cũng hơi nóng.'},{id:'ac-3',text:'Ừ, nể {pY} đó.'}],
 snub:[{id:'as-1',text:'Chuyện của tụi {pS}, {pY} đừng xen vô.'},{id:'as-2',text:'Thôi {pY}, để tụi {pS} nói.'}],
 brush:[{id:'ab-1',text:'Ờ, {pY} nói phải.'},{id:'ab-2',text:'Thì {pS} nghe sao kể vậy thôi.'},{id:'ab-3',text:'Thì kể chơi thôi mà.'}],
} as const satisfies Record<string,readonly GroupLine[]>;
/** Người nghe đáp khi người chơi kể tin: ấm cho tin bình thường, lạnh cho chuyện riêng hoặc tin chưa chắc. */
export const TELL_REPLY:GroupLine[]=[
 {id:'tr-1',text:'Thiệt hả {pY}? {pS} không hay luôn.',mood:'warm'},
 {id:'tr-2',text:'Vậy hả, để bữa nào {pS} hỏi thăm.',mood:'warm'},
 {id:'tr-3',text:'Ờ, {pS} biết rồi.'},
 {id:'tr-4',text:'Chuyện người ta mà {pY}.',mood:'cold'},
 {id:'tr-5',text:'Chưa chắc đâu {pY}, đừng kể lung tung.',mood:'cold'},
];
