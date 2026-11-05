# Phần F — Đời, nghề mô-đun, giữ chân hằng ngày và online

Phần này **thay ý kết thúc cứng ở mục 39** (Phần D). **Basic 1.0 và 1.1 chỉ có một đời:** khi đạt đích có tổng kết rồi **chơi tiếp**, không có tường chặn. Nhiều đời và kế thừa chỉ làm từ sau giai đoạn 1.2 khi đạt điều kiện ở mục 55. Mọi con số là **đề xuất**.

## 54. Mỗi đời có hồ sơ riêng

Tên game là Một đời để sống, nên đơn vị chơi là **một đời**. Mỗi đời có một **hồ sơ đời**:

| Thành phần | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| Xuất thân | Vốn, nợ gia đình, kỹ năng khởi đầu, quê | Sinh viên từ quê, nợ học phí |
| Nghề khởi đầu | Quyết định công việc hằng ngày | Lập trình viên, đầu bếp, tài xế giao hàng |
| Mục tiêu đời | Đích của đời đó | Mở công ty, cứu quán của mẹ, trả hết nợ rồi mua nhà |
| Bối cảnh năm | Suy thoái, bùng nổ bất động sản, lạm phát; đổi giá, nhu cầu việc, sự kiện | Năm khó khăn giá nguyên liệu tăng |
| Dàn NPC và cốt truyện | Sinh từ pool (Phần C) cộng vài NPC cố định theo xuất thân | Mỗi đời một nhóm người khác |

**Ví dụ ba đời (cho giai đoạn sau):** (1) cậu sinh viên lập trình từ quê, nợ học phí, đích mở công ty; (2) cô gái thừa kế quán cơm của mẹ, nhiều quan hệ nhưng quán đang lỗ, đích cứu quán; (3) anh tài xế giao hàng nuôi em, vốn ít, đích trả nợ và mua nhà.

Ở Basic 1.0 và 1.1 chỉ có **một hồ sơ đời** (ví dụ lập trình viên từ quê, đích mở công ty). Hồ sơ đời vẫn là **dữ liệu** để thêm hồ sơ sau mà không sửa engine. Khi đạt mục tiêu có màn **tổng kết từ Nhật ký** rồi tiếp tục chơi; một đời không có hạn cứng (có thể chốt khoảng 12 tháng game cho mốc tổng kết đầu tiên).

## 55. Chuyển đời, kế thừa, không mất gia sản

**Phạm vi và thời điểm:** mục này **chưa làm ở Basic 1.0 và 1.1**. Chỉ chuẩn bị nền: hồ sơ đời là dữ liệu, `playthroughId` trong save, và chỗ giữ gia phả và di sản trong schema. Chỉ bắt đầu làm cơ chế chuyển đời khi đủ cả ba điều kiện:

1. Đã có ít nhất 2 nghề chơi được.
2. Pool NPC đủ để đời thứ hai thật sự khác đời thứ nhất.
3. Dữ liệu chơi thử cho thấy người chơi dừng vì hết thứ mới, chứ không phải vì chán ngay từ đầu.

Nếu cần sớm hơn, chỉ làm **khe lưu** (nhiều nhân vật độc lập, không kế thừa), vì gần như không tốn thiết kế.

**Nguyên tắc:** không xoá, mà **chuyển giao**; tạo **sức kéo** để chuyển đời thay vì sức đẩy.

- **Di sản bền** (mang sang đời sau): công thức đã học, mối quan hệ NPC thân thiết, nhà gia tộc, bộ sưu tập, một quỹ khởi nghiệp nhỏ (ví dụ không quá 25% tài sản ròng và có trần theo đời). Phần lớn tiền không chuyển, để đời mới vẫn có thử thách.
- **Điểm gia tộc:** đời cũ tích điểm theo thành tựu; dùng để mua lợi thế khởi đầu cho đời sau (cộng một kỹ năng, một người quen, ít vốn, một công thức). Có trần mỗi đời để không phá cân bằng.
- **Gia phả:** mỗi đời lưu một thẻ (nghề, mục tiêu, thành tựu, tổng kết). Người chơi không mất đời cũ.
- **Nhiều nhân vật song song:** mỗi nhân vật là một đời, có thể quay lại; nhờ vậy người chơi không sợ mất khi thử đời khác.
- **Sức kéo:** đời mới mở nội dung chưa có (nghề, cốt truyện, NPC mới) và một số mở khoá chỉ có ở đời mới.
- **Lý do kết thúc một đời:** đạt mục tiêu, nghỉ hưu hoặc chuyển giao cho con, hoặc chọn làm lại khi bế tắc (giữ di sản giảm bớt).

## 56. Nghề là mô-đun

Nếu chỉ đổi cốt truyện mà công việc giống hệt, người chơi sẽ thấy nhàm từ đời thứ hai. Vì vậy mỗi **nghề** có vòng lặp công việc khác nhau:

| Nghề | Vòng lặp hằng ngày | Đích kinh doanh |
| --- | --- | --- |
| Lập trình viên (hiện có) | Nhiệm vụ theo ca, sửa lỗi | Công ty phần mềm |
| Đầu bếp | Chuẩn bị, bán theo ca, thực đơn | Quán ăn, nhà hàng |
| Tiểu thương, bán hàng | Nhập hàng, chọn vị trí, định giá | Cửa hàng |
| Giao hàng, tài xế | Chuyến và tuyến, xăng, giờ cao điểm | Đội xe |
| Nông dân | Vụ mùa, thời tiết, bán nông sản | Nông trại, chuỗi cung ứng |
| Thợ xây, sửa chữa | Công trình, vật liệu, đội thợ | Công ty xây dựng |

**Các nghề dùng chung vài loại vòng lặp, mỗi loại viết code một lần:** nhiệm vụ theo ca (công nghệ, thiết kế), ca phục vụ (đầu bếp, bán hàng), chuyến (giao hàng), vụ mùa (nông dân), dự án (xây dựng, công ty).

**Gói dữ liệu của một nghề:** kỹ năng và nhiệm vụ (hoặc ca, chuyến), bậc nghề và lương (cùng thang mục 12.4), sự kiện và mô-típ, NPC pool, ảnh, đích kinh doanh. Thêm nghề mới chủ yếu là thêm dữ liệu, không sửa engine.

**Thứ tự mở nghề (đề xuất):** công nghệ ở Basic 1.0, ẩm thực ở 1.2, rồi giao hàng hoặc bán hàng, nông trại sau cùng. Mỗi nghề nên có ít nhất một cơ chế riêng để cảm giác chơi khác hẳn.

## 57. Ngành kinh doanh: khung công ty tổng quát

Công ty ở Phần D được làm theo **ngành**: dữ liệu quy định sản phẩm hoặc dịch vụ, nguồn thu, tài nguyên, vai nhân sự và kỹ năng chính. Công nghệ dùng **dự án**; ẩm thực dùng **ca bán**. Nhân viên NPC, tuyển dụng, trình độ, giá thuê, uy tín, vay ngân hàng, điện nước dùng chung.

### 57.1 Ngành ẩm thực

- **Vòng lặp:** chuẩn bị nguyên liệu, bán theo ca, dọn dẹp, kiểm kê.
- **Thực đơn** gồm các công thức người chơi đã biết (nối với việc học nấu ăn).
- **Khách mỗi giờ** = nhu cầu nền (vị trí × giờ) × độ hấp dẫn (chất lượng món, giá, uy tín, độ sạch). Có sự kiện giữa ca: hết nguyên liệu, khách phàn nàn, đông bất ngờ.
- **Lợi nhuận** = doanh thu − nguyên liệu − lương − thuê mặt bằng − điện nước − lãi vay.
- **Ví dụ minh hoạ quán cơm:** khoảng 60 khách mỗi ngày × 45 nghìn ≈ 81 triệu mỗi tháng; giá vốn khoảng 40% (32 triệu), thuê 10 triệu, lương 2 người 18 triệu, điện nước 2 triệu, còn lãi khoảng 19 triệu. Dưới 40 khách thì gần như hoà vốn.
- **Đường vào mượt:** xe đẩy hoặc gian hàng ở chợ như nguồn thu phụ, rồi quán, rồi nhà hàng.
- **Dùng lại:** nguyên liệu theo lô, hạn dùng, tủ lạnh, nhân viên NPC (đầu bếp, phụ bếp, phục vụ), rủi ro vệ sinh gắn uy tín.

## 58. Giữ chân hằng ngày (không ép buộc)

| Nhịp | Nội dung |
| --- | --- |
| Mỗi ngày | **Bản tin sáng** 3 mục (tin tức, tin nhắn NPC, lịch hôm nay); việc đang chạy có kết quả khi quay lại; giá chợ và thị trường đổi mỗi ngày game; lịch trên điện thoại hiện sự kiện sắp tới |
| Mỗi tuần | Mục tiêu tuần (ví dụ 3 nhiệm vụ, 2 buổi học, nấu một món mới) |
| Mỗi tháng | Báo cáo thu chi, kỹ năng, quan hệ; lương; lễ Tết và mùa |
| Dài hạn | Nhiều đích song song (nghề, ẩm thực, đầu tư, quan hệ, sưu tầm, cốt truyện NPC dài) |
| Theo bản cập nhật | Thêm mô-típ, pool và sự kiện mùa |

**Không dùng:** phạt khi không đăng nhập, chuỗi ngày liên tục, đồng hồ đếm ngược ép chơi. **Thay bằng:** khi vắng mặt, game chạy tiến độ có giới hạn (tối đa khoảng 1 ngày game) và hiện tóm tắt **chào mừng trở lại**.

## 59. Online

**Nguyên tắc:** bất đồng bộ trước; tính năng online **không chạm cân bằng** của game chính; không chat tự do (dùng biểu tượng và câu mẫu).

### 59.1 Nền cần có

- Máy chủ và cơ sở dữ liệu (ví dụ Cloudflare Workers với D1 hoặc KV; cần kiểm tra giới hạn gói miễn phí hiện hành).
- Tài khoản (ID ẩn danh gắn thiết bị, liên kết sau) và **cloud save**.
- Engine tất định: seed trong save và nhật ký hành động, để máy chủ có thể chạy lại kiểm kết quả. Đây chính là T01–T05.
- Save ổn định có migration; quyền riêng tư (chỉ bạn bè xem được nhà); kiểm tra quy định bảo vệ dữ liệu cá nhân hiện hành (không phải tư vấn pháp lý).

### 59.2 Thăm nhà

- Kết bạn bằng mã mời; xem nhà bạn ở chế độ chỉ xem.
- Nhà lưu thành **bản chụp dữ liệu** (món đồ, ô lưới, hướng xoay), rất nhẹ vì ảnh nằm sẵn trong game.
- Để lại lời nhắn hoặc biểu tượng; chủ nhà chọn ai được xem.

### 59.3 Arcade: mini game tách biệt hoàn toàn

- Mini game chỉ để **so điểm hoặc đối đầu**, **không liên quan game chính**: không chạm ví, XP, kỹ năng hay sổ cái. Lưu ở không gian dữ liệu riêng.
- **Điểm riêng** của arcade; phần thưởng chỉ là huy hiệu hoặc khung hiển thị, không ảnh hưởng cân bằng. Không quy đổi điểm thành tiền, không bán điểm.
- Ba chế độ: **so điểm cùng seed** (câu cá, nấu ăn), **ghost** (chơi lại bản ghi của bạn), **đối đầu 1–1**.
- **Bảng xếp hạng tuần:** máy chủ chạy lại seed và nhật ký thao tác để xác minh (với trò đơn giản); trò khó xác minh chỉ hiển thị với độ tin cậy thấp.
- **Đối đầu thời gian thực:** phòng trên máy chủ (Cloudflare Durable Objects và WebSocket), tung ngẫu nhiên phía máy chủ, xử lý rớt mạng và quay lại. Làm sau cùng, tuỳ chọn. Bầu cua dùng điểm của arcade, không nối với ví game.
- Về sau có thể cân nhắc người chơi khác xuất hiện như NPC; thị trường chung hoặc trao đổi đồ có rủi ro gian lận cao nên để sau cùng.

## 60. Ticket bổ sung

| ID | Việc | Cỡ | Phụ thuộc | Giai đoạn |
| --- | --- | --- | --- | --- |
| T69 | Hồ sơ đời (dữ liệu) và khởi tạo đời; một hồ sơ ban đầu, `playthroughId` trong save | M | T04, T16 | 1.0 |
| T70 | Chuyển đời: di sản, điểm gia tộc, gia phả, tổng kết | L | T69, T19 | Sau 1.2, có điều kiện (mục 55) |
| T71 | Khe lưu nhẹ: nhiều nhân vật độc lập, quay lại được, không kế thừa | S | T04, T69 | 1.1 |
| T72 | Khung nghề dạng dữ liệu và loại vòng lặp | L | T12 | 1.0 (nền), 1.2 (thêm nghề) |
| T73 | Ca phục vụ (vòng lặp cho ẩm thực, bán hàng) | L | T72, T23 | 1.2 |
| T74 | Ngành ẩm thực: thực đơn, khách, uy tín, vệ sinh | L | T73, T46, T47 | 1.2 |
| T75 | Bản tin sáng, mục tiêu tuần, báo cáo tháng, tiến độ khi vắng mặt | M | T19, T61 | 1.0 |
| T76 | Sự kiện mùa và lễ | M | T17 | 1.1 |
| T77 | Tài khoản, bạn bè, cloud save | L | T04, T05 | 1.2 |
| T78 | Bản chụp nhà và thăm nhà | M | T27, T77 | 1.2 |
| T79 | Khung Arcade tách biệt (lưu riêng, không chạm sổ cái) | M | T77 | 1.2 |
| T80 | Mini game so điểm cùng seed và ghost | M | T79 | 1.2 |
| T81 | Bảng xếp hạng tuần và xác minh phía máy chủ | M | T80 | 1.2 |
| T82 | Phòng đối đầu thời gian thực (tuỳ chọn) | L | T79 | 1.3 |
| T83 | Bối cảnh năm (biến động thế giới), làm cho một đời trước | M | T57, T69 | 1.1 |

**Việc cần bạn chốt:** (1) nghề thứ hai và thứ ba cho giai đoạn 1.2; (2) đích của đời đầu (cố định hay chọn một trong vài đích); (3) mốc tổng kết đầu tiên (đề xuất 12 tháng game) và việc chơi tiếp sau đó; (4) mức online ban đầu (đề xuất: thăm nhà và so điểm); (5) điều kiện mở kế thừa ở mục 55 có đủ rõ chưa.

