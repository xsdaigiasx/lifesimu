# Hội thoại theo tag — #364

Bộ mẫu 0.92.0 gồm 18 mạch, 174 câu trọn ý và các câu chia sẻ/chào kết dùng chung. Bao phủ bán ế/đắt hàng; cảm lạnh, đau lưng, sốt, yếu dần; tăng ca, bất đồng cấp trên, tìm/nhận việc, lên chức/thưởng; mua đồ; con thi/thi đậu, người nhà ốm/lên chơi; thi/qua môn; mất đồ, suýt bị lừa, cô đơn.

## Cách vận hành

`npc-life` là nguồn biến cố thật. Fact mang `event:<kind>`; sáu loại biến cố còn có chi tiết được sinh tất định theo world/người/ngày. Đổi seed hội thoại không thay nguyên nhân/chi tiết. Không tự bịa đường đang sửa, kết quả thi, bệnh đã khỏi, món hàng còn lại.

`thread-data.ts` chứa câu trọn ý và tag `requires`, `respondsTo`, `reveals`, `excludes`. Đầu vào tạo tag mạch + biến cố; câu mở tiết lộ `introduced`. Câu hỏi chỉ hiện khi có ít nhất một đáp án hợp tag. Đáp án đánh dấu hướng đã nghe, ngăn hỏi lặp nếu tiếp tục dùng state. Mỗi nhánh có nhiều cách nói; không cần đi theo một thứ tự cố định. Biến câu dùng xưng hô thật, tên biến cố/món đồ/chi tiết thật.

Gặp mặt/gọi điện giữ luồng tự diễn ngắn đã có: chọn một hướng hỏi/chia sẻ, NPC trả lời đúng hướng rồi chào. Không ép thêm nhiều lần bấm. Tin nhắn lưu tín hiệu của từng lựa chọn để hai câu hỏi cùng action `ask` vẫn có hai loại đáp án khác nhau. Tin cũ được nhắc rõ là trạng thái lúc nhắn.

Mạch mới ưu tiên trong nhánh dữ kiện thích hợp của bộ compose; giữ giới hạn kênh, riêng tư, ý định, tâm trạng và chống lặp mở lời 14 ngày. Không nối thêm đuôi khoe/cho hàng ngẫu nhiên vào câu trọn ý. Ngoài mạch mẫu, biến cố cụ thể dùng câu tóm tắt dữ kiện khi cần; không dùng câu cũ chỉ vì cùng nhãn rộng money/family/work. Các chủ đề không phải biến cố đời NPC tiếp tục dùng kho mảnh cũ.

## Thêm nội dung

1. Chọn biến cố có nguồn thật; nếu cần chi tiết mới, tạo chi tiết trong đời NPC, không tạo khi ghép câu.
2. Thêm topic với danh sách biến cố, ý định, giới hạn vai nếu cần.
3. Viết ít nhất hai cách mở, các nhánh hỏi và ít nhất hai đáp án mỗi nhánh. Các biến thể phải giữ nguyên sự thật; câu tương lai thể hiện dự định, không tự tạo kết quả.
4. Khai tag đã biết/cần biết/loại trừ. Nếu thiếu dữ kiện thì không dùng câu chứa biến đó.
5. Chạy `npm test`, `npm run talk:check -- --samples 0`, `npm run build`; đọc mẫu bằng `node scripts/talk-thread-samples.cjs`.

## Lưu và giới hạn

Thread trong câu đang chờ/tin nhắn chỉ giữ mã mạch, tag, ID câu đã nghe và bốn biến ngắn; validator kiểm tra trước khi đọc. Save cũ thiếu thread vẫn hợp lệ. Câu hỏi không mua hàng, không tạo giao dịch/hẹn/hoạt động. Chạy bộ, ăn chung chỉ qua luồng nhận lời rủ. Đoạn kể chung ở công viên/quán không tạo ký ức hoạt động chưa nhận lời.

Đây là lô mẫu, chưa chuyển toàn bộ 1.612 mảnh cũ. Không cam kết hết mọi lỗi ngữ nghĩa ở các chủ đề cũ. Trạng thái tiết lộ hiện dùng trong cuộc trao đổi; chưa có cốt truyện dài qua nhiều ngày hoặc chuỗi nhân quả mới. Các hậu quả quan hệ và ký ức vẫn dùng hệ hiện tại. Thêm mạch mới cần kiểm tra nội dung, không chỉ dựa vào validator hình thức.

## Kiểm thử

`talk-threads.test.cjs`: 1.000 seed bán ế; mọi biến cố được bao phủ; đúng người/quyền biết/kênh/riêng tư; 1.000 đoạn hỏi bệnh không phát sinh chạy bộ/ăn; chi tiết ổn định; nhánh không lặp; câu hỏi có đáp; engine save/parse và mọi lựa chọn; tin nhắn lưu đúng signal; fallback cần dữ kiện.

Xem [30 mẫu sinh từ code](HOI-THOAI-TAGS-SAMPLES.md).
