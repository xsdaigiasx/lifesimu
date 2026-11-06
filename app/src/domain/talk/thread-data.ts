/** #364: câu trọn ý, nối bằng nhãn ngữ nghĩa. Không tự bịa nguyên nhân/sự kiện ngoài dữ kiện. */
import type {Intent} from './types';
export interface ThreadBeat {id:string;text:string;requires:string[];excludes?:string[];reveals:string[];respondsTo:string}
export interface ThreadQuestion {signal:string;label:string;attitude:'warm'|'blunt'|'joke';action:'ask'|'share'|'advise';reveal:string}
export interface ThreadTopic {id:string;intent:Intent;events:string[];roles?:string[];questions:ThreadQuestion[];beats:ThreadBeat[]}
/** Các nhánh là một pool: có thể hỏi theo thứ tự bất kỳ, chọn biến thể theo seed. */
const topic=(id:string,intent:Intent,events:string[],opening:string[],branches:[string,string,string[]][],roles?:string[]):ThreadTopic=>({
 id,intent,events,roles,
 questions:branches.map(([signal,label])=>({signal,label,attitude:'warm',action:'ask',reveal:`heard:${signal}`})),
 beats:[...opening.map((text,i)=>({id:`${id}:open:${i}`,text,requires:[`thread:${id}`],reveals:['introduced'],respondsTo:'open'})),
 ...branches.flatMap(([signal,,lines])=>lines.map((text,i)=>({id:`${id}:${signal}:${i}`,text,requires:[`thread:${id}`,'introduced'],excludes:[`heard:${signal}`],reveals:[`heard:${signal}`],respondsTo:signal})))],
});
export const THREAD_TOPICS:ThreadTopic[]=[
 topic('sales-slow','complain',['slow'],[
  'Mấy hôm nay bán chậm quá {you}, {self} cứ mong khách đông lại.',
  'Đợt này buôn bán ế, {self} cũng hơi sốt ruột.',
  'Bán chậm thế này, {self} phải tính chuyện hàng vào kỹ hơn.'
 ],[
  ['cause','Sao dạo này bán chậm vậy {call}?',['{Self} cũng chưa rõ vì sao, chưa dám đoán là do giá hay do khách ít đi.','{Self} chưa biết nguyên nhân đâu. Chỉ thấy bán chậm hơn thôi.','Muốn biết vì sao thì còn phải xem thêm, {self} chưa có câu trả lời.']],
  ['outlook','Giờ {call} tính thế nào?',['{Self} đang cân nhắc lấy hàng vừa sức bán, chứ chưa chốt gì.','Chắc {self} phải tính lại từng khoản, mong đợt này sớm qua.','{Self} muốn thận trọng hơn với hàng vào, cũng không muốn quyết vội.']]
 ],['veg','meat','grocery','banhmi']),
 topic('sales-brisk','brag',['brisk'],[
  'Đợt này buôn bán đắt hàng, {self} vui hẳn.',
  'Mấy hôm nay bán chạy, {self} thấy nhẹ lòng hơn nhiều.',
  'Khách mua được hàng, {self} bán được hàng, đợt này vui ghê.'
 ],[
  ['cause','Sao đợt này bán chạy vậy {call}?',['{Self} chưa rõ vì sao đâu, chưa dám nhận là mình giỏi hơn.','{Self} chưa biết chính xác vì sao bán chạy hơn, vẫn đang để ý thêm.','{Self} chưa rõ nguyên nhân, cũng muốn biết khách thích chỗ nào để giữ cho tốt.']],
  ['outlook','{Call} có định lấy thêm hàng không?',['{Self} còn cân nhắc, bán khá hơn cũng chưa muốn ôm nhiều hàng.','Có nghĩ tới, mà {self} muốn xem thêm vài bữa đã.','{Self} muốn giữ nhịp này trước, lấy thêm thì phải tính kỹ.']]
 ],['veg','meat','grocery','banhmi']),
 topic('unwell','complain',['cold','backache','flu','frail'],[
  'Dạo này {self} đang {event}, nên không được khoẻ lắm.',
  '{Self} đang {event}, nói chuyện cũng muốn chậm một chút.',
  'Đợt này {self} {event}, {self} chỉ mong người dễ chịu hơn.'
 ],[
  ['duration','Bị lâu chưa {call}?',['{Self} bị từ {since}, giờ vẫn còn đó.','Từ {since} rồi {you}, {self} vẫn chưa hết.','Đợt này bắt đầu từ {since}, chưa qua hẳn đâu.']],
  ['listen','{Call} muốn kể thêm không?',['Có {you} hỏi thăm là {self} thấy được quan tâm rồi.','{Self} chỉ muốn nói cho {you} biết thôi, không muốn {you} lo quá.','{Self} không có gì muốn kể thêm lúc này, cảm ơn {you} đã hỏi.']]
 ]),
 topic('overtime','complain',['overtime'],[
  'Đợt này {self} tăng ca liên miên, cứ thấy ngày trôi hết vào công việc.',
  'Tăng ca mãi cũng mệt, {self} đang mong có chút thời gian riêng.',
  '{Self} vẫn đang trong đợt tăng ca, hơi đuối rồi.'
 ],[
  ['duration','Tăng ca từ bao giờ vậy {call}?',['Đợt này từ {since}, {self} vẫn chưa ra khỏi nhịp đó.','Từ {since} rồi, nên {self} mới thấy mệt.','Bắt đầu từ {since}, đến giờ vẫn còn tăng ca.']],
  ['outlook','{Call} tính sắp xếp lại thế nào?',['{Self} muốn xem việc nào thật sự cần làm trước, chứ chưa có cách ổn hẳn.','{Self} đang nghĩ cách nói rõ giới hạn của mình, vẫn còn ngại.','Trước mắt {self} muốn tìm một nhịp dễ chịu hơn, chưa chốt được cách nào.']]
 ]),
 topic('boss','complain',['boss'],[
  '{Self} đang bất đồng với cấp trên, chưa biết nói sao cho dễ nghe.',
  'Có chuyện không thống nhất với cấp trên, {self} vẫn đang nghĩ cách trao đổi.',
  'Đợt này {self} vướng chuyện với cấp trên, hơi khó xử.'
 ],[
  ['detail','{Call} muốn kể rõ hơn không?',['{Self} chưa muốn kể chi tiết, sợ nói một phía rồi thành không công bằng.','Cho {self} giữ phần cụ thể lại nhé, lúc này chỉ muốn nói là mình đang khó xử.','{Self} muốn bình tĩnh thêm trước khi kể kỹ chuyện đó.']],
  ['outlook','{Call} định nói chuyện lại chứ?',['{Self} đang nghĩ tới việc đó, muốn chọn lúc cả hai bình tĩnh.','Có thể sẽ nói lại, nhưng {self} chưa muốn nói khi còn bực.','{Self} muốn làm rõ điều mình cần trước, rồi mới trao đổi tiếp.']]
 ]),
 topic('jobhunt','complain',['jobhunt'],[
  '{Self} đang tìm việc mới, vẫn còn nhiều điều phải cân nhắc.',
  'Chuyện tìm việc mới vẫn đang làm {self} bận tâm.',
  '{Self} đang trong lúc tìm việc, mong sớm có hướng rõ hơn.'
 ],[
  ['priority','{Call} đang cân nhắc điều gì?',['{Self} muốn xem cả công việc lẫn nhịp sống có hợp không.','{Self} còn cân nhắc điều mình làm được với điều mình muốn học thêm.','{Self} muốn hiểu kỹ chỗ làm trước khi quyết, không chỉ nhìn mỗi tên vị trí.']],
  ['outlook','Tìm việc tới đâu rồi {call}?',['{Self} vẫn đang tìm, chưa có việc mới để báo đâu.','Chưa chốt được việc mới, {self} còn đang xem.','Khi nào có kết quả chắc chắn {self} mới dám nói, giờ vẫn là tìm thôi.']]
 ]),
 topic('newjob','brag',['newjob'],[
  '{Self} vừa nhận việc mới, thấy vừa mừng vừa hồi hộp.',
  'Có việc mới rồi {you}, {self} đang làm quen với thay đổi này.',
  'Chuyện việc mới của {self} đã có kết quả, mừng ghê.'
 ],[
  ['feeling','Có việc mới thấy sao {call}?',['{Self} mừng, nhưng cũng muốn cho mình thời gian làm quen.','Vui chứ, mà {self} chưa muốn nói trước là mọi thứ sẽ dễ.','{Self} thấy có một khởi đầu để cố gắng, vậy là vui rồi.']],
  ['outlook','Giờ {call} muốn tập trung vào gì?',['{Self} muốn hiểu công việc trước, chưa vội đặt mục tiêu xa.','{Self} muốn tìm một nhịp làm việc ổn định trước đã.','Cứ học cho chắc việc mới, {self} đang nghĩ vậy.']]
 ]),
 topic('reward','brag',['promotion','bonus'],[
  '{Self} vừa {event}, muốn kể với {you} cho vui.',
  'Có chuyện vui nè: {self} {event} rồi.',
  'Đợt này {self} {event}, nghĩ tới vẫn thấy mừng.'
 ],[
  ['feeling','{Call} thấy sao khi nhận tin?',['{Self} vui vì công sức của mình có một kết quả để nhìn thấy.','Mừng chứ, nhưng {self} vẫn muốn giữ nhịp làm việc cho tốt.','Kể với {you} là để chia sẻ niềm vui đó thôi.']],
  ['outlook','Sau chuyện này {call} muốn làm gì?',['{Self} đang nghĩ thôi, chưa muốn hứa hay quyết gì vội.','{Self} muốn tận hưởng niềm vui một chút, rồi tính tiếp.','Trước mắt cứ làm tốt phần mình đã, {self} chưa có kế hoạch mới.']]
 ]),
 topic('purchase','brag',['buy'],[
  '{Self} mới mua được {item}, muốn khoe với {you} một chút.',
  'Có {item} rồi {you}, {self} đang thấy vui.',
  '{Self} vừa mua {item}, còn đang háo hức.'
 ],[
  ['feeling','Có đồ mới thấy vui hả {call}?',['Ừ, {self} đang vui vì món mới đó, nên mới muốn kể.','Có {you} nghe {self} khoe là vui thêm rồi.','Đúng rồi, {self} muốn chia sẻ chút niềm vui thôi.']],
  ['review','Dùng thấy thế nào rồi {call}?',['Còn mới quá, {self} chưa muốn nhận xét vội.','{Self} muốn dùng thêm rồi mới biết có hợp lâu dài không.','Lúc này {self} chỉ dám nói là đang vui, còn dùng tốt đến đâu phải xem thêm.']]
 ]),
 topic('child-exam','complain',['kidexam'],[
  'Con đang thi cử, {self} cũng thấy lo theo.',
  'Đợt này con thi, {self} cứ mong mọi chuyện ổn.',
  '{Self} đang bận tâm chuyện thi cử của con.'
 ],[
  ['result','Đã có kết quả chưa {call}?',['Chưa có kết quả để kể đâu {you}, vẫn đang chuyện thi cử thôi.','{Self} chưa có tin đậu hay trượt, nên cũng không muốn đoán.','Chuyện kết quả chưa rõ đâu, {self} vẫn đang chờ.']],
  ['outlook','{Call} muốn động viên con thế nào?',['{Self} muốn động viên mà không làm con thấy thêm áp lực.','{Self} đang nghĩ nên lắng nghe con nhiều hơn, không chỉ hỏi chuyện điểm.','{Self} chỉ mong nói sao để con biết có người bên cạnh.']]
 ]),
 topic('child-pass','brag',['kidpass'],[
  'Con {self} thi đậu rồi, mừng quá {you}.',
  'Chuyện thi cử của con có tin vui rồi, con đậu rồi.',
  '{Self} đang vui vì con thi đậu, muốn kể với {you}.'
 ],[
  ['feeling','Chắc {call} nhẹ lòng lắm?',['Ừ, {self} thấy nhẹ lòng hơn, vui cho con nữa.','Mừng thật, nhưng {self} vẫn muốn để con tự vui theo cách của mình.','Có tin đậu là {self} vui rồi, chưa cần tính xa ngay.']],
  ['outlook','Sau kỳ thi nhà mình tính sao {call}?',['{Self} chưa chốt gì, muốn nghe con nghĩ thế nào trước.','Chưa có kế hoạch cụ thể đâu, trước mắt cứ mừng chuyện thi đậu.','{Self} muốn để con nghỉ đầu óc một chút rồi tính tiếp.']]
 ]),
 topic('family-sick','complain',['relsick'],[
  'Người nhà {self} đang ốm, {self} hơi lo.',
  'Đợt này nhà có người ốm, {self} cứ bận tâm.',
  '{Self} đang lo chuyện người nhà bị ốm.'
 ],[
  ['duration','Người nhà ốm từ khi nào vậy {call}?',['Từ {since} rồi, {self} vẫn còn lo.','Chuyện này bắt đầu từ {since}, chưa qua hẳn đâu.','Từ {since}, nên {self} mới đang bận tâm như vậy.']],
  ['listen','{Call} có muốn kể thêm không?',['Chi tiết sức khoẻ người nhà thì {self} xin giữ riêng nhé.','{Self} chưa muốn kể kỹ, cảm ơn {you} đã quan tâm.','Có {you} hỏi han là tốt rồi, chuyện riêng của người nhà {self} không tiện nói thêm.']]
 ]),
 topic('family-visit','brag',['visit'],[
  'Người nhà lên chơi, {self} thấy vui hơn hẳn.',
  'Đợt này có người nhà lên chơi đó {you}.',
  '{Self} đang vui vì người nhà lên thăm.'
 ],[
  ['feeling','Có người nhà lên chắc vui lắm {call}?',['Ừ, được gặp nhau là {self} vui rồi.','Vui chứ, {self} thích cảm giác có người nhà ở gần.','Có dịp gặp là quý rồi, {self} không cần phải làm gì lớn.']],
  ['outlook','{Call} định làm gì cùng người nhà?',['{Self} chưa tính cụ thể, muốn xem mọi người thích gì trước.','Chưa có lịch gì chắc chắn đâu, cứ dành thời gian cho nhau đã.','{Self} muốn để mọi người thoải mái, không xếp lịch kín quá.']]
 ]),
 topic('exam','complain',['exam'],[
  '{Self} đang thi cuối kỳ, có chút áp lực.',
  'Đợt thi cuối kỳ đang làm {self} bận tâm.',
  '{Self} vẫn đang trong kỳ thi, mong qua đợt này ổn thoả.'
 ],[
  ['result','Đã biết kết quả chưa {call}?',['Chưa có kết quả qua môn đâu, {self} vẫn đang thi.','{Self} chưa biết kết quả, chưa muốn đoán trước.','Giờ còn đang kỳ thi, khi có kết quả mới biết được.']],
  ['outlook','{Call} định sắp xếp việc học thế nào?',['{Self} muốn chia nhỏ phần cần ôn cho dễ theo hơn.','{Self} đang nghĩ nên tập trung phần còn yếu trước.','{Self} muốn cân bằng ôn bài và nghỉ, chứ cứ lo mãi cũng không ổn.']]
 ]),
 topic('exam-pass','brag',['exampass'],[
  '{Self} qua môn rồi, nhẹ người quá {you}.',
  'Có kết quả qua môn rồi, {self} mừng ghê.',
  'Kỳ thi có tin vui rồi, {self} qua môn.'
 ],[
  ['feeling','Biết kết quả rồi thấy sao {call}?',['Nhẹ đầu hơn hẳn, {self} mừng vì qua được đợt này.','Vui chứ, {self} muốn tận hưởng cảm giác hết thấp thỏm một chút.','Có kết quả rồi thì đỡ đoán tới đoán lui, {self} mừng lắm.']],
  ['outlook','Giờ {call} tính gì tiếp?',['{Self} chưa có kế hoạch mới, muốn nghỉ đầu óc một chút trước.','{Self} muốn xem mình học được gì từ đợt này rồi mới tính tiếp.','Trước mắt cứ mừng đã, {self} chưa quyết gì xa.']]
 ]),
 topic('lost','complain',['lost'],[
  '{Self} vừa làm mất đồ, thấy bực mình ghê.',
  'Đợt này {self} bị mất đồ, cứ nghĩ tới là tiếc.',
  '{Self} đang bận tâm chuyện làm mất đồ.'
 ],[
  ['detail','{Call} muốn kể rõ hơn không?',['{Self} chưa muốn kể kỹ món gì, chỉ muốn than một chút thôi.','Cho {self} giữ phần chi tiết nhé, nói ra là để đỡ bực.','{Self} không muốn kể thêm lúc này, cảm ơn {you} đã hỏi.']],
  ['outlook','Giờ {call} tính sao?',['{Self} muốn bình tĩnh nhớ lại trước, chưa dám nói là tìm được.','{Self} còn đang tính cách xử lý, chưa có kết quả mới.','{Self} muốn nghĩ lại những chỗ có thể đã để quên, chưa biết có tìm được không.']]
 ]),
 topic('scam','complain',['scam'],[
  '{Self} vừa suýt bị lừa, nghĩ lại còn thấy khó chịu.',
  'Có chuyện suýt bị lừa đó {you}, {self} đang muốn cẩn thận hơn.',
  '{Self} thoáng chút nữa là bị lừa, giờ vẫn còn bực.'
 ],[
  ['detail','{Call} muốn kể lại chuyện đó không?',['{Self} chưa muốn kể chi tiết lúc này, chỉ muốn nói là mình đã suýt mắc bẫy.','Để {self} bình tĩnh thêm đã, giờ kể dễ thành bực quá lời.','{Self} không muốn đoán thêm về người ta, chỉ biết mình suýt bị lừa thôi.']],
  ['outlook','Sau chuyện đó {call} tính sao?',['{Self} muốn kiểm tra kỹ trước khi tin, nhất là khi bị giục quyết nhanh.','{Self} đang nghĩ nên hỏi thêm người tin cậy trước khi quyết chuyện quan trọng.','{Self} muốn chậm lại một chút, không để bị thúc là quyết ngay.']]
 ]),
 topic('lonely','complain',['lonely'],[
  'Dạo này {self} thấy hơi cô đơn, muốn nói chuyện với ai đó.',
  '{Self} đang thấy cô đơn hơn mọi khi.',
  'Có lúc {self} thấy trống trải, gặp {you} thì muốn nói vài câu.'
 ],[
  ['listen','{Call} muốn {me} nghe kể một chút không?',['Có người chịu nghe là {self} thấy dễ nói hơn rồi.','Ừ, {self} chỉ muốn có người nghe, không cần tìm cách giải quyết ngay đâu.','{Self} muốn nói chậm thôi, cũng chưa biết bắt đầu từ chuyện nào.']],
  ['outlook','Lúc này {call} muốn điều gì nhất?',['{Self} nghĩ mình muốn có thêm những lúc được nói chuyện thế này.','{Self} chưa rõ phải làm gì, nhưng được hỏi vậy cũng thấy ấm lòng.','{Self} muốn được lắng nghe mà không phải cố tỏ ra vui.']]
 ]),
];

/** Chi tiết là dữ kiện từ npc-life, không rút nguyên nhân mới trong lúc nói. */
for(const [id,signal] of [['sales-slow','cause'],['sales-brisk','cause'],['overtime','outlook'],['boss','detail'],['jobhunt','priority'],['exam','outlook']]){
 const t=THREAD_TOPICS.find(t=>t.id===id)!;
 const lines=signal==='outlook'?['Vì {detail}, {self} muốn chia lại việc theo từng phần nhỏ trước.','{Self} muốn tính lại thứ tự ưu tiên, vì {detail}.']:signal==='cause'?['{Self} thấy {detail}. Chắc phải quan sát thêm mới hiểu hết.','Đợt này {detail}, đó là điều {self} đang thấy.']:['Chuyện là {detail}, nên {self} còn phải cân nhắc.','{Self} đang vướng ở chỗ {detail}. Nói ra với {you} cũng thấy dễ nghĩ hơn.'];
 t.beats.push(...lines.map((text,i)=>({id:`${id}:${signal}:detail:${i}`,text,requires:[`thread:${id}`,'introduced'],excludes:[`heard:${signal}`],reveals:[`heard:${signal}`],respondsTo:signal})));
}
