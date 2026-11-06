# H7: nguồn dữ liệu Lô 3 (src/domain/talk/data/lo3.json). Sửa ở đây rồi chạy: python3 scripts/talk-lo3.py
# H7a: NPC ngẫu nhiên. Mảnh theo kiểu người (arch: tenant, student, shopper, diner, jogger, dog, chess),
# mảnh theo nhịp mạch chuyện (chủ đề a.<mạch>.<nhịp>, biến {doing} {now}) và mảnh nhớ lần gặp trước
# (chủ đề met, metsame, metnew, back; biến {when} {where} {then} {now}).
import json, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'domain', 'talk', 'data', 'lo3.json')
rows = []
LIST = ('after', 'answer', 'needs', 'emotion', 'when', 'channel', 'where', 'arch', 'tone')

def P(arch, slot, text, intent=None, topic=None, **kw):
    p = {'slot': slot, 'text': text}
    if arch: p['arch'] = arch.split()
    if intent: p['intent'] = intent.split() if isinstance(intent, str) else intent
    if topic: p['topic'] = topic.split() if isinstance(topic, str) else topic
    for k, v in kw.items():
        if k in LIST: v = v.split() if isinstance(v, str) else v
        p[k] = v
    for var in ('dish', 'event', 'weather', 'item', 'place', 'holiday', 'amount', 'doing', 'now', 'then', 'where'):
        if '{' + var + '}' in text and var not in p.get('needs', []):
            p.setdefault('needs', []).append(var)
    rows.append(p)

GOOD = 'happy excited'
BAD = 'neutral tired sad annoyed'
A = None
def arc(a, *beats): return ['a.%s.%s' % (a, b) for b in beats]

# ---------- Nhớ lần gặp trước (mọi NPC ngẫu nhiên)
P(A, 'body', '{when} {self} còn đang {then}, giờ thì {now} rồi', 'brag', 'metnew', tone='good plain')
P(A, 'body', '{when} {self} còn đang {then}, giờ lại {now}', 'complain', 'metnew', tone='bad')
P(A, 'body', '{when} {self} còn {then}, giờ {now} rồi', 'complain', 'metnew', tone='plain')
P(A, 'body', 'nhớ {self} không, {when} gặp {you} {where} đó', 'ask', 'met')
P(A, 'body', '{when} gặp {you} một lần {where} rồi phải không', 'ask', 'met')
P(A, 'body', '{self} vẫn đang {then}, chưa xong nữa', 'complain', 'metsame')
P(A, 'body', 'vẫn chuyện cũ thôi, {self} còn {then}', 'complain', 'metsame')
P(A, 'body', 'ủa, lâu quá mới gặp lại {you}', 'ask', 'back')
P(A, 'body', 'hình như mình từng gặp nhau {where} rồi thì phải', 'ask', 'back')

# ---------- Mạch chuyện: câu chung theo tông (đọc {doing}, {now} của nhịp đang diễn ra)
P(A, 'body', 'dạo này {self} đang {doing}', 'complain', 'self', tone='bad')
P(A, 'body', '{self} mới {now} đó', 'brag', 'self', tone='good', needs='doing')
P(A, 'body', 'nói {you} nghe, {self} {now} rồi', 'brag', 'self', tone='good plain', needs='doing')
# Mạch chuyện: câu riêng từng nhịp
P(A, 'body', 'nộp chỗ nào cũng hẹn rồi im luôn', 'complain', arc('lenpho', 'hoso'))
P(A, 'body', 'mới lên phố, chưa quen ai hết', 'complain', arc('lenpho', 'hoso'))
P(A, 'body', 'đi phỏng vấn hai chỗ rồi, giờ ngồi chờ', 'complain', arc('lenpho', 'phongvan'))
P(A, 'body', 'có chỗ nhận {self} rồi, mai đi làm', 'brag', arc('lenpho', 'coviec'))
P(A, 'body', 'chỗ đó không nhận, {self} tìm chỗ khác', 'complain', arc('lenpho', 'truot'))
P(A, 'body', 'lãnh lương tháng đầu, {self} gửi về cho má', 'brag', arc('lenpho', 'quenviec'))
P(A, 'body', 'tối nào cũng ôn tới khuya', 'complain', arc('onthi', 'on'))
P(A, 'body', 'thi xong rồi mà chưa dám coi điểm', 'complain', arc('onthi', 'chodiem'))
P(A, 'body', 'qua hết rồi, nhẹ cả người', 'brag', arc('onthi', 'dau'))
P(A, 'body', 'rớt một môn, hè này phải học lại', 'complain', arc('onthi', 'rot'))
P(A, 'body', 'tối nào cũng đi học tiếng Anh', 'brag', arc('hocanh', 'dangky'))
P(A, 'body', 'bài tập tiếng Anh nhiều quá trời', 'complain', arc('hocanh', 'baitap'))
P(A, 'body', 'có chứng chỉ rồi, tính kiếm chỗ lương cao hơn', 'brag', arc('hocanh', 'dat'))
P(A, 'body', 'để dành mấy năm, giờ tính mở cái quán nhỏ', 'brag', arc('moquan', 'gomtien'))
P(A, 'body', 'đi coi mặt bằng mấy chỗ, chỗ nào cũng đắt', 'complain', arc('moquan', 'matbang'))
P(A, 'body', 'cuối tuần quán {self} khai trương', 'brag', arc('moquan', 'khaitruong'))
P(A, 'body', 'quán mở mấy bữa mà khách còn lèo tèo', 'complain', arc('moquan', 'vang'))
P(A, 'body', 'quán mới có khách quen rồi', 'brag', arc('moquan', 'dong'))
P(A, 'body', 'đám cưới lo đủ thứ, rối hết cả lên', 'complain', arc('cuoi', 'locuoi'))
P(A, 'body', '{self} mới cưới xong, còn mệt', 'brag', arc('cuoi', 'cuoi'))
P(A, 'body', 'tháng sau {self} chạy giải mười cây', 'brag', arc('giaichay', 'dangky'))
P(A, 'body', 'chạy tới cây thứ bảy là chuột rút', 'complain', arc('giaichay', 'chan'))
P(A, 'body', 'con chó nhà {self} cắn nát đôi dép mới', 'complain', arc('nuoicho', 'phado'))
P(A, 'body', 'con chó bỏ ăn hai bữa rồi', 'complain', arc('nuoicho', 'om'))
P(A, 'body', 'con chó biết ngồi bắt tay rồi đó', 'brag', arc('nuoicho', 'ngoan'))
P(A, 'body', 'con gửi đứa cháu lên ở, nhà vui hẳn', 'brag', arc('trongchau', 'len'))
P(A, 'body', 'cháu về rồi, nhà vắng hoe', 'complain', arc('trongchau', 've'))
P(A, 'body', 'bác sĩ dặn kiêng mặn, ăn gì cũng nhạt', 'complain', arc('huyetap', 'cao'))
P(A, 'body', 'sâu ăn hết mấy luống cải của {self}', 'complain', arc('trongrau', 'sau'))
P(A, 'body', 'rau nhà trồng hái ăn ngọt lắm', 'brag', arc('trongrau', 'thu'))

# ---------- Theo kiểu người
P('tenant', 'open', 'Ủa, {you} ở phòng kế bên hả')
P('tenant', 'open', '{You} mới đi làm về hả', when='evening late')
P('tenant', 'body', 'phòng {self} nóng như lò, quạt không ăn thua', 'complain')
P('tenant', 'body', 'cầu dao phòng {self} lại nhảy', 'request')
P('tenant', 'ask', '{you} coi giùm {self} chút được không', 'request')
P('student', 'open', '{You} ơi, cho {self} hỏi chút', 'ask request')
P('student', 'body', 'tháng này {self} hết tiền sớm quá', 'complain')
P('student', 'body', 'mai {self} nộp bài mà máy treo hoài', 'request')
P('student', 'ask', '{you} xem giùm {self} cái máy được không', 'request')
P('shopper', 'open', 'Ủa, lại gặp {you} ở chợ')
P('shopper', 'open', '{You} đi chợ sớm vậy', when='morning')
P('shopper', 'body', 'rau hôm nay lên giá nữa rồi', 'complain')
P('shopper', 'body', '{self} mua hơi nhiều, xách không nổi', 'request')
P('shopper', 'ask', '{you} xách phụ {self} ra xe được không', 'request')
P('diner', 'open', '{You} cũng hay ăn ở đây hả')
P('diner', 'body', 'quán đông quá, chờ muốn xỉu', 'complain')
P('diner', 'body', '{you} ăn ở đây hoài, chắc ghiền rồi', 'tease')
P('diner', 'ask', 'mai ăn sáng chung với {self} không', 'invite')
P('jogger', 'open', '{You} cũng chạy hả')
P('jogger', 'body', 'sáng nay {self} chạy được năm cây', 'brag')
P('jogger', 'ask', 'mai chạy chung với {self} không', 'invite')
P('dog', 'open', 'Nó không cắn đâu, {you} đừng sợ')
P('dog', 'body', 'con chó nhà {self} khôn lắm, kêu tên là chạy lại', 'brag')
P('dog', 'body', '{self} chạy vô mua chai nước', 'request')
P('dog', 'ask', '{you} giữ con chó giùm {self} chút được không', 'request')
P('chess', 'open', 'Lại đây ngồi chơi {you}')
P('chess', 'body', 'hôm qua {self} thắng ông kia ba ván liền', 'brag')
P('chess', 'body', 'thanh niên giờ ít ai biết đánh cờ', 'tease')
P('chess', 'ask', '{you} ngồi xuống đánh với {self} một ván không', 'invite')

# ---------- Gán mã
out = [{'id': 'l3-%03d' % i, **p} for i, p in enumerate(rows, 1)]
json.dump(out, open(OUT, 'w'), ensure_ascii=False, indent=0)
print(len(out), 'mảnh trong lo3.json')
