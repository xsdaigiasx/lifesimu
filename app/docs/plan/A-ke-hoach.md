# Phần A — Kế hoạch chạy bản cơ bản chơi được, đủ chức năng

**Đây là kế hoạch chạy chính.** Phần B bên dưới giữ thiết kế chi tiết (công thức, số liệu, cơ chế) mà các ticket tham chiếu. Mục tiêu: một bản **chơi trọn vẹn từ lúc lên phố đến lúc mở công ty**, dù nội dung còn ít.

## 1. Định nghĩa "bản cơ bản" (Basic 1.0)

**Hoàn thành khi:** một người chơi mới chơi liền một mạch có thể: đến phố → thuê trọ → xin việc và qua thử việc → đi làm hằng ngày → học kỹ năng → ăn và nấu ăn → mua đồ và sắp xếp phòng → gặp NPC có sự kiện khác nhau → vay hoặc gửi ngân hàng → làm dự án riêng → mở công ty → ra màn tổng kết. Save, reload và nhiều lượt chơi không làm hỏng dữ liệu.

| Làm trong Basic 1.0 | Hoãn sang sau |
| --- | --- |
| Đồng hồ, lịch, 4 chỉ số thể trạng | Thời tiết và hiệu ứng mùa |
| Bản đồ node, đi bộ, xe đạp, bus, xe máy | Ô tô, taxi, tuyến về quê (Chương 2 quê) |
| Nhà trọ, kho đồ, bố trí đồ, điểm dùng đồ | Nhiều cấp nhà, bố cục văn phòng đa dạng |
| 6 kỹ năng, việc làm tự chạy, học tối, lương tháng | Mini game hỗ trợ |
| NPC theo sự kiện, ký ức, Nhật ký | AI viết lại lời thoại |
| Nguyên liệu, công thức, nấu ăn, nấu bừa, chợ | Thực phẩm nâng cao (nhiều cách bảo quản) |
| TTTM, đơn hàng, giao hàng, bán lại đồ | Đơn chơi khăm, ưu đãi quan hệ phức tạp |
| Ngân hàng: tiết kiệm, vay, điểm tín dụng | Bảo hiểm, đầu tư |
| Dự án riêng, mở công ty, nhân sự, màn tổng kết | Nhiều công ty, mở rộng chi nhánh |
| Thành tựu cơ bản (khoảng 10) | Thành tựu bí mật, gợi ý |
| Bệnh do ăn uống và kiệt sức, khám cơ bản | Hệ thống bệnh đầy đủ |

## 2. Kiến trúc kỹ thuật bắt buộc

Các quy tắc này chặn đa số lỗi hay gặp khi giao Codex làm nhiều hệ thống:

1. **Tách ba lớp:** (a) *dữ liệu nội dung* là file JSON có schema kiểm tra; (b) *engine* là TypeScript thuần, không phụ thuộc giao diện, chạy được không cần trình duyệt; (c) *giao diện* React chỉ đọc trạng thái và gửi hành động.
2. **Một sổ cái duy nhất** cho tiền, XP, vật phẩm, thưởng. Mỗi giao dịch có `txId` ổn định; xử lý lại cùng `txId` không có tác dụng thứ hai. Đây là cách chống nhận thưởng trùng, trả lương hai lần, mua trùng khi reload.
3. **Hành động là lệnh:** giao diện gửi lệnh (ăn, đi, nhận việc, mua), engine kiểm tra hợp lệ rồi sinh ra các sự kiện; mọi sự kiện đều có thể ghi vào Nhật ký.
4. **Ngẫu nhiên theo seed:** mọi roll (lỗi, sự kiện, nấu bừa) dùng RNG có seed lưu trong save, nên có thể tái hiện lỗi và mô phỏng.
5. **Đồng hồ game là nguồn thời gian duy nhất.** Không dùng giờ thật cho tiến độ, hạn dùng hay lãi.
6. **Không hard-code số cân bằng:** đặt trong file số liệu, có tên và chú thích.
7. **Save có version + migration thuần,** kèm save mẫu để test (golden saves).

Cấu trúc thư mục gợi ý: `data/` (JSON nội dung), `engine/` (thời gian, chỉ số, việc, kinh tế, sự kiện, bố trí), `store/` (save, migration, sổ cái), `ui/` (màn hình), `tests/` (đơn vị, mô phỏng, golden saves).

## 3. Danh sách việc theo thứ tự phụ thuộc

Cỡ việc: S nhỏ, M vừa, L lớn (nên chia nhỏ hơn nữa khi giao Codex). Mỗi ticket là **một nhánh riêng**.

### Pha 0 — Nền móng

| ID | Việc | Cỡ | Phụ thuộc | Nghiệm thu chính |
| --- | --- | --- | --- | --- |
| T01 | Cấu trúc dự án và schema nội dung, trình kiểm tra JSON | M | — | Dữ liệu sai schema bị từ chối lúc build |
| T02 | Đồng hồ, lịch (ca, ngày 1, lễ), RNG theo seed | M | T01 | Mô phỏng 365 ngày chạy ổn định, tái hiện được theo seed |
| T03 | Sổ cái giao dịch idempotent | M | T01 | Chạy lại cùng txId không đổi số dư |
| T04 | Save, migration, golden saves từ v0.19 | L | T01–T03 | Mở save cũ không mất dữ liệu, không bịa ngày giờ |
| T05 | Bộ mô phỏng không giao diện và khung test | M | T02, T03 | Chạy được một lượt N ngày bằng lệnh |

### Pha 1 — Lõi sống

| ID | Việc | Cỡ | Phụ thuộc | Nghiệm thu chính |
| --- | --- | --- | --- | --- |
| T06 | 5 chỉ số thể trạng (No, Năng lượng, Tinh thần, Căng thẳng, Sức khoẻ), hệ số m, cảnh báo sớm (Phần H mục 68 và 73) | M | T02 | Theo bảng mục 11; chăm đủ thì m = 1,0 |
| T07 | Hành động ăn, ngủ, nghỉ tốn giờ; chặn hành động không hợp lệ | M | T06 | Không ăn khi không có đồ; không ngủ khi đang làm ca |
| T08 | Bản đồ node, đi bộ/xe đạp/bus, chi phí và thời gian | L | T02, T03 | Ví dụ 6 km khớp bảng mục 15; đi muộn tính theo giờ đến thật |
| T09 | Tiền trọ và hoá đơn hằng tháng | S | T03 | Trừ một lần mỗi kỳ, không trùng khi reload |

### Pha 2 — Việc làm và kỹ năng

| ID | Việc | Cỡ | Phụ thuộc | Nghiệm thu chính |
| --- | --- | --- | --- | --- |
| T10 | 6 kỹ năng, đường cong XP | M | T03 | Bảng XP khớp mục 12.1 |
| T11 | Tìm việc, phỏng vấn (Giao tiếp), thử việc | M | T10 | Qua hoặc trượt thử việc có hệ quả rõ |
| T12 | Nhiệm vụ tự chạy, lỗi và sửa, hai ca | L | T06, T10 | Tiến độ không mất khi đóng bảng hoặc reload; lỗi không trừ lương cơ bản |
| T13 | Chấm công, lương tháng ngày 1, bậc nghề | M | T03, T12 | Lương trả đúng một lần |
| T14 | Học tối (khoá cơ bản, nâng cao) | M | T10, T08 | Chỉ thưởng XP khi hoàn thành |
| T15 | Bảng chọn việc buổi sáng và điểm rẽ giữa ca | M | T12 | Mỗi ngày có ít nhất một lựa chọn đáng cân nhắc |

### Pha 3 — NPC và Nhật ký

| ID | Việc | Cỡ | Phụ thuộc | Nghiệm thu chính |
| --- | --- | --- | --- | --- |
| T16 | Pool thuộc tính, bộ sinh NPC, hồ sơ, dàn cố định, lịch hiện diện (Phần C mục 22–23) | M | T01, T08 | Gặp trực tiếp chỉ khi cùng nơi, cùng giờ |
| T17 | Bộ điều phối sự kiện, mô-típ và biến thể, dấu vân tay chống lặp, cooldown (Phần C mục 26) | L | T16, T03 | Không quá khoảng 3 sự kiện mỗi ngày; sự kiện một lần không lặp sau reload |
| T18 | Ghép lời thoại theo giọng, bậc quan hệ và dữ kiện ký ức, chống lặp câu (Phần C mục 27) | M | T17 | Gặp lần thứ ba không nghe lại cùng câu |
| T19 | Nhật ký: ghi, hiển thị, mở hồ sơ NPC | M | T17 | Đọc không tốn giờ; không trùng bản ghi; không lộ nội dung chưa kích hoạt |
| T20 | Tin nhắn và cuộc gọi từ xa (mẹ, đồng nghiệp) | S | T17 | Không cần NPC hiện diện trên bản đồ |

### Pha 4 — Ăn uống

| ID | Việc | Cỡ | Phụ thuộc | Nghiệm thu chính |
| --- | --- | --- | --- | --- |
| T21 | Nguyên liệu theo lô, hạn dùng, tủ lạnh | M | T03 | Hết hạn đúng ngày; tủ lạnh chỉ làm chậm |
| T22 | Công thức, sổ công thức, ba nguồn học | M | T17, T21 | Công thức nhận từ NPC ghi vào sổ và Nhật ký |
| T23 | Nấu ăn và nấu bừa | L | T22, T10 | Nấu bừa tối đa Q3; tổ hợp đã thử được ghi lại |
| T24 | Chợ và bệnh do ăn uống cơ bản | M | T21, T06 | Rủi ro theo độ tươi và độ chín, không theo giá |

### Pha 5 — Nhà ở và mua sắm

| ID | Việc | Cỡ | Phụ thuộc | Nghiệm thu chính |
| --- | --- | --- | --- | --- |
| T25 | Quy trình ảnh isometric: tách vỏ phòng, đồ gắn tường và đồ di chuyển; mỗi món render 2 hướng từ mô hình 3D cùng camera; bóng và lớp giờ trong ngày là lớp riêng | M | — | Vỏ phòng, 2 cửa và 8 món di chuyển được cùng lưới, ánh sáng, điểm neo; đặt và xoay không lệch ô |
| T26 | Kho, bản thể đồ (instanceId), lưới phòng | M | T03, T25 | Lưu và tải đúng vị trí, hướng |
| T27 | Chế độ Bố trí: kéo, thả, xoay, xác nhận, huỷ, kiểm tra lối đi (BFS) | L | T26 | Huỷ trả đúng vị trí cũ; không chồng đồ, không chặn cửa; điện thoại không nhầm kéo đồ với kéo cảnh |
| T28 | Điểm dùng của đồ nối hiệu ứng (giường, bàn, bếp, tủ lạnh) | M | T27, T06 | Đổi chỗ đồ vẫn dùng được; hiệu ứng có trần cộng dồn |
| T29 | TTTM, giỏ, đơn hàng, giao hàng, bán lại, xe máy | L | T03, T26 | Nhận đồ, trừ tiền, ghi đơn là một thao tác nguyên tử; không tự âm số dư |

### Pha 6 — Tài chính

| ID | Việc | Cỡ | Phụ thuộc | Nghiệm thu chính |
| --- | --- | --- | --- | --- |
| T30 | Ngân hàng: tiết kiệm, vay, điểm tín dụng, trả góp PMT | L | T03, T13 | Ví dụ 100 triệu, 12%, 12 tháng ra khoảng 8,88 triệu mỗi tháng; kỳ lãi chỉ xử lý một lần |
| T31 | Phục hồi mềm khi hết tiền | S | T13, T17 | Persona hoang phí không bế tắc |

### Pha 7 — Công ty

| ID | Việc | Cỡ | Phụ thuộc | Nghiệm thu chính |
| --- | --- | --- | --- | --- |
| T32 | Dự án riêng buổi tối và khách tay trái | M | T12, T10 | Có thu nhập phụ, có rủi ro trễ hạn |
| T33 | Điều kiện, vốn và văn phòng khi mở công ty | M | T30, T32 | Điều kiện kiểm đúng; vốn gồm tiền tự có và vay |
| T34 | Công ty: dự án, nhân sự, dòng tiền (tách thành T44–T50, Phần D mục 32–41) | L | T17, T33 | Khách trả chậm, trễ hạn mất uy tín, nhân viên quá tải xin nghỉ |
| T35 | Màn kết và tổng kết từ Nhật ký | S | T19, T34 | Tổng kết chỉ dùng dữ kiện có thật |

### Pha 8 — Hoàn thiện

| ID | Việc | Cỡ | Phụ thuộc | Nghiệm thu chính |
| --- | --- | --- | --- | --- |
| T36 | Hướng dẫn 10 phút đầu, mục tiêu tuần, thành tựu cơ bản | M | các pha trước | Người mới biết mục tiêu tiếp theo sau 5 phút |
| T37 | Cân bằng bằng mô phỏng 3 persona và chỉnh số | M | T05 | Đạt các chỉ tiêu mục 6 |
| T38 | Hiệu năng điện thoại, giảm hiệu ứng, cuộn trong khung | M | — | Mượt trên máy trung bình, giữ thanh điều hướng |
| T39 | Hồi quy toàn bộ và đóng gói Basic 1.0 | M | tất cả | Qua bộ smoke test mục 6 |

## 4. Ngân sách nội dung tối thiểu

| Loại | Số lượng đề xuất |
| --- | --- |
| Node bản đồ | 8 |
| Phương tiện | 4 (đi bộ, xe đạp, bus, xe máy) |
| Nhiệm vụ làm việc | khoảng 25 (5 mỗi kỹ năng nghề, nhiều mức yêu cầu) |
| Khoá học tối | 6 |
| Nguyên liệu | khoảng 20 |
| Công thức | 12 (trong đó 4 từ NPC, 4 từ sách, 4 khám phá khi nấu bừa) |
| NPC | 12 (từ NPC System v0.2) |
| Mẫu sự kiện | khoảng 40 |
| Món đồ nội thất và thiết bị | khoảng 30 |
| Dự án khách hàng | khoảng 12 |
| Thành tựu | 10 |

Chỉ cần đủ để một lượt chơi 12 tháng ít gặp lặp lại; thêm nội dung là việc sau, không cần đổi code.

## 5. Quy trình giao Codex và review

**Mẫu ticket cho Codex:**

```
Ticket: <ID và tên>
Bối cảnh: <1–2 câu, nêu ticket phụ thuộc đã xong>
Phạm vi: chỉ làm các mục sau: <danh sách>. Không đổi hệ thống khác.
Quy tắc: engine thuần, mọi thay đổi tiền/XP/vật phẩm qua sổ cái có txId;
số cân bằng nằm trong file dữ liệu; RNG theo seed; không reset save;
không cập nhật website hoặc Drive.
Nghiệm thu: <danh sách kiểm được>
Test cần có: <đơn vị, mô phỏng, migration nếu đụng save>
Cuối cùng: liệt kê file đã đổi và những điều chưa chắc.
```

**Định nghĩa hoàn thành mỗi ticket:** code, test qua; migration nếu đụng save; ghi Nhật ký nếu có sự kiện người chơi; không hard-code số; không lộ nội dung chưa kích hoạt; Claude review không còn lỗi mức **Chặn**.

**Báo cáo review của Claude:** danh sách lỗi theo mức Chặn / Nên sửa / Gợi ý, kèm đoạn code liên quan và cách sửa. Chỉ gộp nhánh khi hết lỗi Chặn. Không bắt đầu ticket phụ thuộc khi ticket nền còn lỗi Chặn.

## 6. Kiểm thử, cân bằng và smoke test

**Mô phỏng tự động:** 3 persona (tiết kiệm, bình thường, hoang phí) × 12 tháng × nhiều seed. Chỉ tiêu: 0% bế tắc; không có chuỗi hành động lặp kiếm tiền hoặc XP vô hạn; Lv5 kỹ năng chính khoảng 3–5 tuần; người chơi bình thường mua được laptop tầm trung trước tháng thứ 6; không giao dịch nào xử lý hai lần.

**Smoke test thủ công (12 bước):**

1. Tạo lượt chơi mới, nhận phòng trọ.
2. Xin việc, phỏng vấn, vào thử việc.
3. Chơi trọn một ngày làm: chọn việc sáng, gặp điểm rẽ, hết ca.
4. Đóng game giữa ca, mở lại: tiến độ còn nguyên.
5. Ăn ngoài, rồi mua nguyên liệu và nấu một món.
6. Nấu bừa một tổ hợp, kiểm tra sổ công thức.
7. Gặp một NPC, chọn phản hồi, xem bản ghi trong Nhật ký.
8. Mua một món đồ, nhận hàng, đặt vào phòng, xoay, xác nhận; thử huỷ.
9. Học một buổi tối.
10. Qua ngày 1 của tháng: nhận lương một lần, trả tiền trọ một lần.
11. Vay ngân hàng và trả một kỳ.
12. Làm dự án riêng, mở công ty, nhận một dự án, xem màn tổng kết.

## 7. Chống nhàm ngay trong bản cơ bản

- **Mỗi sáng có chọn lựa:** 3–4 nhiệm vụ khác nhau về độ khó, thưởng, rủi ro.
- **Điểm rẽ giữa ca:** sự kiện nhỏ buộc chọn giữa tiền, thời gian và quan hệ.
- **Mục tiêu tuần:** nhìn thấy tiến lên đều đặn.
- **Buổi tối có việc riêng:** học, dự án riêng, nấu ăn, gặp bạn; dự án riêng là mầm của công ty.
- **Khoảnh khắc đáng nhớ:** lần đầu lên bậc, món mẹ dạy, chiếc xe đầu tiên, gắn vào Nhật ký.
- **10 phút đầu:** đến phố, nhận phòng, xin việc, ngày làm đầu tiên, nhận công thức từ bà chủ trọ hoặc mẹ qua điện thoại.

## 8. Quyết định cần chốt trước khi bắt đầu Pha 0

1. Giờ thức dậy (07:00 hay giữ 08:00 như v0.19).
2. Lương khởi điểm, tiền trọ, giá bữa ăn (xem bảng mục 13).
3. Hệ số 80 của đường cong XP (tốc độ lên cấp toàn game).
4. Quy tắc khi chuyến đi kéo dài qua 22h.
5. Có giữ Chương 2 về quê trong Basic 1.0 không (đề xuất: hoãn).
6. Đơn vị tiền và cách hiển thị (đồng, triệu).
7. Số lượt chơi song song trong một save (đề xuất: một).
8. Phong cách ảnh đồ: isometric ô 2:1 như bản chơi thử hiện tại (đã chốt).
9. Điều kiện chính xác để mở công ty (mục 18.2).
10. Tài nguyên ảnh: ai làm, dùng công cụ gì (liên quan T25).

## 9. Việc tiếp theo

1. Bạn chốt mục 8 (hoặc nói "dùng đề xuất").
2. Claude soạn schema TypeScript và prompt Codex cho T01–T05.
3. Bạn đưa prompt cho Codex, gửi diff về, Claude review; lặp lại theo từng ticket.

