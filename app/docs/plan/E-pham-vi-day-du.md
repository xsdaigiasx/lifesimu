# Phần E — Phạm vi game đầy đủ: 15 khu vực và hệ thống

Phần này gom danh sách tính năng bạn đưa ra, đối chiếu với kế hoạch hiện có, và **bổ sung hoặc thay đổi bảng làm và hoãn ở mục 1 (Phần A)** khi mâu thuẫn. Mọi con số là **đề xuất**.

## 42. Đối chiếu 15 mục với kế hoạch

| # | Nội dung bạn muốn | Tình trạng trong kế hoạch |
| --- | --- | --- |
| 1 | Bản đồ node | Có (T08); mở rộng sang nhiều bản đồ ở T52 |
| 2 | Nhà: trọ, nhà mặt đất, biệt thự (mua hoặc thuê); điện nước theo thiết bị; bếp, tủ lạnh | Một phần (trọ, bếp, tủ lạnh); **mới:** thuê hoặc mua nhiều cấp, điện nước theo thiết bị |
| 2b | Máy tính: làm việc online, học, chứng khoán | **Mới** (T56, T57) |
| 3 | Chợ dân sinh | Có (T24) |
| 4 | Ngân hàng | Có (T30) |
| 5 | Trung tâm thương mại, mini game | Có TTTM (T29); mini game **mới** (T62) |
| 6 | Trạm bus sang bản đồ khác: câu cá, về quê, nông trại | **Mới** (T52, T67, T68) |
| 7 | Quán vỉa hè (rẻ, dễ bệnh) | **Mới** (T59) |
| 8 | Nhà hàng (đắt, an toàn) | **Mới** (T59) |
| 9 | Điện thoại: tin nhắn, gọi, danh bạ, báo, giải trí | Một phần (T20); mở rộng ở T61 |
| 10 | Công viên rèn luyện | **Mới** (T60) |
| 11 | Khu văn phòng: tuyển dụng, đi làm, mở công ty | Có (T11, T33, T44) |
| 12 | Nâng cấp công ty (điều hoà, máy tính) | **Mới** (T66) |
| 13 | NPC liên kết nhau, đồng nghiệp và nhân viên lấy từ danh sách NPC | Một phần (quan hệ với người chơi); **mới:** quan hệ NPC với NPC (T63) |
| 14 | Cốt truyện đời NPC | **Mới** (T64) |
| 15 | Thành tựu | Có bản nhẹ (T36); mở rộng ở T65 |

Hai thứ **hoàn toàn mới và có rủi ro cân bằng cao** là thị trường tin tức, chứng khoán và bất động sản (mục 47), và đồ thị quan hệ NPC với NPC cùng cốt truyện đời (mục 50).

## 43. Phân giai đoạn phát hành

Nhiều khu vực cùng lúc là rủi ro lớn nhất của dự án. Mỗi giai đoạn dưới đây phải **chơi được trọn vẹn** trước khi sang giai đoạn sau.

| Giai đoạn | Nội dung | Ghi chú |
| --- | --- | --- |
| **Basic 1.0** | Bản đồ thành phố; phòng trọ với bếp, tủ lạnh, điện nước đơn giản; máy tính làm việc và học; chợ; ngân hàng; TTTM (điện tử, nội thất, quần áo); xe bus trong thành phố; quán vỉa hè; nhà hàng; điện thoại (tin nhắn, gọi, danh bạ); công viên; khu văn phòng; mở công ty bản gọn; NPC liên kết ở mức cơ bản; cốt truyện cho dàn cố định (mở đầu); 10 thành tựu | Là lộ trình ở Phần A cộng quán ăn, công viên, điện nước |
| **1.1 Nhà và đầu tư** | Nhà mặt đất và biệt thự (mua hoặc thuê); chứng khoán, bất động sản, đọc báo thị trường; nâng cấp công ty đầy đủ; thành tựu mở rộng | Cần cân bằng kinh tế cẩn thận |
| **1.2 Ngoài thành phố** | Bản đồ phụ (câu cá, quê), mini game, cốt truyện NPC đầy đủ, đồ thị quan hệ NPC phong phú | Mở nhiều nội dung mới |
| **1.3 Nông trại** | Quản lý nông trại ở quê | Hệ thống riêng, làm sau cùng |

## 44. Bản đồ và các khu vực

Thành phố là bản đồ node. Mỗi node có hoạt động, giờ mở cửa và NPC có mặt.

| Node | Hoạt động chính | Giờ gợi ý |
| --- | --- | --- |
| Nhà | Ngủ, nấu ăn, máy tính, bố trí đồ | Cả ngày |
| Chợ dân sinh | Mua nguyên liệu, gặp tiểu thương | 5h–11h |
| Ngân hàng | Gửi tiết kiệm, vay | 8h–16h |
| TTTM | Mua điện tử, nội thất, quần áo; mini game (1.2) | 9h–22h |
| Quán vỉa hè | Ăn rẻ, có rủi ro bệnh | 6h–23h |
| Nhà hàng | Ăn đắt, an toàn, chất lượng cao | 10h–22h |
| Công viên | Chạy bộ, tập, thư giãn, gặp người | Cả ngày |
| Khu văn phòng | Đi làm, phỏng vấn, tuyển dụng, mở công ty | Giờ hành chính |
| Trạm bus | Sang bản đồ khác (từ 1.2) | Theo giờ chuyến |
| Bệnh viện | Khám và điều trị | 7h–17h |

**Bản đồ phụ (từ 1.2):** đi qua trạm bus, tốn nhiều giờ (ví dụ 2–4 giờ mỗi chiều), nên mỗi chuyến là một quyết định (câu cá thư giãn, về quê thăm gia đình). Mỗi bản đồ phụ có node và NPC riêng, dùng chung hệ sự kiện và ký ức.

## 45. Nhà ở và tiện ích

### 45.1 Ba cấp nhà, mua hoặc thuê

| Cấp | Thuê (tháng) | Mua | Không gian | Ghi chú |
| --- | --- | --- | --- | --- |
| Phòng trọ | khoảng 2,5 triệu | Không bán | 8×8 ô, có phòng tắm | Điện nước theo giá chủ trọ (cao hơn) |
| Nhà mặt đất | khoảng 8 triệu | khoảng 1,5 tỷ | Nhiều phòng, có sân | Mua bằng vay thế chấp |
| Biệt thự | khoảng 25 triệu | khoảng 8 tỷ | Nhiều phòng, sân vườn | Chi phí vận hành cao |

Thuê có hợp đồng và tiền cọc; mua qua ngân hàng (tiền gốc cộng lãi theo mục 18.1), có thể bán lại theo giá thị trường (mục 47). Các số tiền là đề xuất để thử, cần cân bằng với lương theo từng chương.

### 45.2 Điện nước theo thiết bị

Mỗi thiết bị có công suất và giờ dùng; hoá đơn tháng = tổng điện năng × giá điện, cộng nước theo số lần dùng.

| Thiết bị | Công suất trung bình | Giờ mỗi ngày | Điện mỗi tháng (khoảng) |
| --- | --- | --- | --- |
| Tủ lạnh | 60 W | 24 | 43 kWh |
| Quạt | 50 W | 8 | 12 kWh |
| Máy tính | 100 W | 8 | 24 kWh |
| Điều hoà | 900 W | 6 | 162 kWh |

- Giá điện đề xuất: nhà riêng theo bậc thang (khoảng 2.000 đến 3.500 đồng mỗi kWh); phòng trọ thường **cao hơn** (khoảng 3.500 đồng) để tạo áp lực thật.
- Điều hoà tăng tinh thần và giấc ngủ nhưng tốn điện (ví dụ khoảng 400 nghìn mỗi tháng), người chơi tự cân nhắc.
- Thiết bị đặt trong nhà và có trạng thái bật hoặc tắt; hoá đơn chỉ tính thiết bị đang dùng, nên bố trí đồ và thói quen có hệ quả.

### 45.3 Bếp và tủ lạnh

Bếp là điểm dùng để nấu ăn. Tủ lạnh có sức chứa và **làm chậm hỏng** nguyên liệu và món đã nấu theo hệ số (ví dụ hạn dùng ×2 đến ×3), không làm tươi lại. Tủ lớn hoặc tốt hơn tốn nhiều điện hơn.

## 46. Máy tính đa dụng

Máy tính trong nhà (và văn phòng) có các ứng dụng:

| Ứng dụng | Tác dụng |
| --- | --- |
| Làm việc online | Nhận việc tay trái và dự án riêng (T32) |
| Học | Khoá online, XP theo mục 12.3 (tối đa theo cấu hình) |
| Chứng khoán | Mua bán cổ phiếu (mục 47), từ giai đoạn 1.1 |
| Giải trí | Mini game, tăng tinh thần có trần |

Cấu hình máy (cũ, tầm trung, mạnh) quyết định tốc độ làm việc tại nhà (ví dụ ×0,9, ×1,0, ×1,15) và loại ứng dụng chạy được. Máy tính cũ đồng nghĩa nhiều điện nhưng ít hiệu quả hơn; nâng cấp có ROI 3 đến 6 tháng (mục 13.2).

## 47. Tin tức và thị trường (chứng khoán, bất động sản)

**Phạm vi:** từ giai đoạn 1.1. Dùng công ty và khu vực hư cấu, không dùng thương hiệu thật.

- **Mô hình giá:** mỗi cổ phiếu hoặc khu vực bất động sản có giá nền, xu hướng dài hạn, độ biến động và nhạy cảm với ngành. Giá mỗi ngày = xu hướng + nhiễu có seed + tác động của tin có độ trễ.
- **Tin tức:** đọc báo trên điện thoại hoặc máy tính. Mỗi tin có nguồn, **độ tin cậy** và mức tác động; có tin đúng, tin giật gân, tin sai. Tin chạy trước giá một khoảng ngắn nên đọc báo có lợi thế thật nhưng không chắc chắn.
- **Kỹ năng:** thêm kỹ năng sống **Đầu tư** (Lv1–10) giúp phân biệt tin cậy, giảm phí hoặc cho thêm thông tin; có thể dùng chung đường cong XP (mục 12.1).
- **Chống khai thác kinh tế:** giá có xu hướng về trung bình; phí giao dịch (ví dụ 0,3%); hạn mức giao dịch theo vốn và Lv Đầu tư; lợi nhuận kỳ vọng của người chơi không có thông tin xấp xỉ 0 sau phí. **Seed thị trường lưu trong save**, nên tải lại không đổi kết quả.
- **Bất động sản:** giá chậm hơn chứng khoán, gắn với tin khu vực; mua để ở hoặc đầu tư cho thuê (thu nhập thụ động nhỏ, có rủi ro trống phòng và sửa chữa).
- **Rủi ro cân bằng cao:** cần mô phỏng riêng (T50-bis trong mục 53) trước khi mở cho người chơi.

## 48. Ăn uống: quán vỉa hè và nhà hàng

| Loại | Giá một bữa | Chất lượng | Rủi ro bệnh | Ghi chú |
| --- | --- | --- | --- | --- |
| Quán vỉa hè | khoảng 30 nghìn | Q2 đến Q3 | khoảng 8% mỗi bữa, **mỗi quán có độ sạch ẩn khác nhau** | Quen quán thì biết độ sạch qua ký ức và sự kiện |
| Nhà hàng | khoảng 120 nghìn | Q4 đến Q5 | khoảng 1% | Có cơ hội gặp NPC, ăn cùng người quen |
| Tự nấu | nguyên liệu | theo công thức | theo độ tươi | Mục 14 |

Bệnh nhẹ tốn tiền khám và giờ nghỉ, giảm năng suất vài ngày. Người chơi đang eo hẹp có lý do ăn vỉa hè, nhưng phải chịu rủi ro; cách giảm rủi ro là chọn quán tốt, ăn món chín kỹ.

## 49. Công viên và rèn luyện

- Hoạt động: chạy bộ, tập giãn cơ, ngồi thư giãn, gặp NPC.
- Thêm chỉ số dài hạn **Thể lực** (0–100): tăng khi rèn luyện đều, giảm khi bỏ lâu. Thể lực cao giảm hao năng lượng và giúp hồi phục nhanh hơn (ví dụ giảm tối đa 20% mức hao).
- Mỗi buổi tốn năng lượng và giờ; giới hạn tăng Thể lực mỗi ngày để không cày; tăng tinh thần nhẹ.
- Công viên cũng là nơi sự kiện NPC xuất hiện nhiều (hàng xóm, người tập chung giờ).

## 50. NPC liên kết nhau và cốt truyện đời

### 50.1 Một danh sách NPC duy nhất

- Mọi người trong game (đồng nghiệp, nhân viên, chủ trọ, tiểu thương, khách hàng) là **bản ghi NPC** trong cùng một danh sách. **Vai** (đồng nghiệp, nhân viên, khách) là trạng thái thay đổi theo thời gian, không phải loại NPC khác.
- Một đồng nghiệp cũ có thể trở thành ứng viên hoặc nhân viên của bạn sau này; nhân viên bị sa thải vẫn còn trong thế giới và nhớ chuyện cũ.

### 50.2 Đồ thị quan hệ NPC với NPC

- Cạnh giữa hai NPC có loại (họ hàng, bạn, đồng nghiệp, cạnh tranh, người yêu) và độ mạnh.
- Tác động: **tin đồn lan** theo cạnh (có độ trễ và méo), NPC giới thiệu việc hoặc người cho nhau, xung đột giữa hai NPC buộc người chơi chọn phe, quan hệ với người này ảnh hưởng thái độ của người kia.
- Giới hạn số NPC hoạt động và chiều sâu đồ thị để không nặng; NPC xa thường chỉ được mô phỏng khi liên quan người chơi.

### 50.3 Cốt truyện đời NPC

- **Dàn cố định (khoảng 12):** mỗi người có 4–6 chương đời viết tay, tiến theo tháng game độc lập với người chơi (đổi việc, cưới, ốm, chuyển nhà, khởi nghiệp). Người chơi có thể can thiệp để đổi hướng.
- **NPC từ pool:** có **đường đời mẫu** gồm 3–4 mốc sinh từ thuộc tính (nghề, hoàn cảnh, mục tiêu), nên nhìn như có đời riêng nhưng chi phí thấp.
- Mốc đời ghi vào ký ức và Nhật ký của người chơi nếu họ chứng kiến hoặc được kể lại.

## 51. Thành tựu

- Nhóm: sự nghiệp, tài chính, quan hệ, nấu ăn, sức khoẻ, khám phá, công ty.
- Số lượng đề xuất: 10 trong Basic 1.0, tăng lên 30 đến 50 ở các bản sau, một phần là thành tựu ẩn.
- Thưởng nhỏ hoặc vật phẩm trang trí; **không thưởng tiền lớn** để không phá cân bằng.
- Kích hoạt một lần, ghi qua sổ cái để không nhận trùng; hiển thị trong Nhật ký.

## 52. Nâng cấp công ty

Nâng cấp văn phòng làm tăng lợi ích công việc và có chi phí vận hành:

| Nâng cấp | Tác dụng (đề xuất) | Chi phí vận hành |
| --- | --- | --- |
| Điều hoà | Tinh thần nhân viên tăng, mệt hao chậm hơn | Tiền điện tăng |
| Máy tính mạnh hơn | Tốc độ làm việc ×1,05 đến ×1,2 theo cấp | Điện và khấu hao |
| Ghế và bàn tốt | Giảm hao năng lượng khi làm | Một lần |
| Phòng họp | Tăng hệ số phối hợp nhóm | Thuê thêm diện tích |
| Khu nghỉ, phúc lợi | Tăng gắn bó | Chi phí hằng tháng |

Mỗi nâng cấp phải hoàn vốn trong khoảng 3 đến 6 tháng nếu dùng đúng, để quyết định mua luôn có đánh đổi.

## 53. Ticket bổ sung

| ID | Việc | Cỡ | Phụ thuộc | Giai đoạn |
| --- | --- | --- | --- | --- |
| T52 | Nhiều bản đồ: bản đồ phụ, trạm bus, thời gian chuyến | M | T08 | 1.2 |
| T53 | Nhà ở nhiều cấp: thuê, mua, hợp đồng, thế chấp | L | T30, T26 | 1.1 |
| T54 | Điện nước theo thiết bị, hoá đơn, giá theo loại nhà | M | T28, T09 | 1.0 |
| T55 | Bếp và tủ lạnh nối với hạn dùng và nấu ăn | S | T21, T28 | 1.0 |
| T56 | Máy tính đa dụng: làm việc, học, giải trí, cấu hình | M | T12, T14 | 1.0 |
| T57 | Tin tức và thị trường chứng khoán, chống khai thác | L | T03, T17 | 1.1 |
| T58 | Bất động sản: giá theo khu vực, thuê hoặc mua đầu tư | M | T57, T53 | 1.1 |
| T59 | Quán vỉa hè và nhà hàng, rủi ro bệnh ẩn | M | T24 | 1.0 |
| T60 | Công viên rèn luyện và chỉ số Thể lực | M | T06 | 1.0 |
| T61 | Điện thoại mở rộng: báo, tin tức, giải trí | M | T20, T57 | 1.0 và 1.1 |
| T62 | Mini game giải trí | L | T61 | 1.2 |
| T63 | Đồ thị quan hệ NPC với NPC, tin đồn | L | T17, T40 | 1.0 (nhẹ), 1.2 (đầy đủ) |
| T64 | Cốt truyện đời NPC: dàn cố định và đường đời mẫu | L | T63, T41 | 1.0 (mở đầu), 1.2 |
| T65 | Thành tựu mở rộng | M | T19 | 1.1 |
| T66 | Nâng cấp công ty | M | T46, T47, T54 | 1.1 |
| T67 | Câu cá và bản đồ sông | M | T52 | 1.2 |
| T68 | Quê và nông trại | L | T52 | 1.3 |
| T50-bis | Mô phỏng cân bằng thị trường và tiền tệ | M | T57, T58, T05 | 1.1 |

**Việc cần bạn chốt:** (1) ranh giới giữa Basic 1.0 và 1.1 như mục 43 có hợp lý không; (2) có thêm kỹ năng Đầu tư không; (3) mức giá nhà (mục 45.1) và mức rủi ro bệnh (mục 48) bạn muốn thử.

