# Phần B — Thiết kế chi tiết các hệ thống

Phần này là thiết kế chi tiết cho các ticket ở Phần A. Lưu ý: khi mở trang chơi thử, tôi chỉ đọc được tiêu đề và mô tả (trang chạy bằng JavaScript), nên chưa đánh giá được cảm giác chơi thực tế. Mục 20 có bộ câu hỏi chẩn đoán để bạn tự xác định thiếu sót nằm ở đâu. Mọi con số là **đề xuất**, bạn chốt thì mới đưa cho Codex.

## 10. Tầm nhìn và ba chương

> Một thanh niên từ quê lên thành phố với ít tiền và nhiều hy vọng. Mỗi tháng là một bài toán thời gian – tiền – sức khoẻ. Đích đến: tự mở công ty.

| Chương | Hoàn cảnh | Mục tiêu chuyển chương | Mở khoá |
| --- | --- | --- | --- |
| 1. Lên phố | Thuê trọ, xin việc, thử việc, học kỹ năng, học nấu ăn | Qua thử việc, thu ≥ chi 3 tháng liên tiếp, có quỹ dự phòng bằng 1 tháng chi | Chợ, TTTM, xe đạp/xe máy cũ, học tối |
| 2. Đứng vững | Lên bậc, nhà tốt hơn, có phương tiện, nhiều quan hệ | Kỹ năng chính ≥ Lv6, Quản lý ≥ Lv4, điểm tín dụng đạt mức vay vốn | Ngân hàng (tiết kiệm, vay), việc tay trái, tuyến về quê |
| 3. Lập nghiệp | Mở công ty, vay vốn, tuyển người, nhận dự án | Lợi nhuận ròng dương 3 tháng liên tiếp (đề xuất) | Văn phòng công ty, nhân sự, khách hàng |

**Vòng lặp:** Ngày (quyết định dùng giờ) → Tuần (nhịp học, hoá đơn nhỏ) → Tháng (lương, tiền trọ, đánh giá) → Mốc (thăng bậc, đổi chương).

**Ba áp lực nền:** thời gian, tiền, thể trạng. Mỗi lựa chọn lớn phải đổi chác ít nhất một thứ (ví dụ: nấu ăn tiết kiệm tiền nhưng tốn giờ; học tối tăng kỹ năng nhưng tốn năng lượng và học phí).

## 11. Chỉ số nhân vật

### 11.1 Bốn chỉ số thể trạng (thang 0–100)

| Chỉ số | Giảm khi | Hồi khi | Hệ quả khi thấp |
| --- | --- | --- | --- |
| Năng lượng | −5/giờ khi làm hoặc học; −2,5/giờ lúc khác | Ngủ +10/giờ; nghỉ ngồi +3/giờ; cà phê +10 tạm thời rồi tụt lại | Làm chậm, nhiều lỗi, ngủ gật |
| No | −5/giờ lúc thức; −2/giờ lúc ngủ | Ăn: +20 đến +55 tuỳ chất lượng món | Giảm hiệu suất, mất Sức khoẻ |
| Tinh thần | Làm quá giờ, ăn dở, nhà bừa, cô đơn | Gặp bạn, gọi về nhà, nhà gọn đẹp, sở thích | Dễ cáu, bỏ lỡ cơ hội xã giao |
| Sức khoẻ | Mỗi ngày có chỉ số dưới ngưỡng: −3; ăn đồ ôi, dầm mưa | +1/ngày khi 3 chỉ số kia > 40; nghỉ ngơi, bệnh viện | Ốm, nghỉ làm, tốn viện phí |

**Kiểm tra độ hợp lý (đã tính):**

- No: thức 16 giờ mất 80, ngủ 8 giờ mất 16, tổng khoảng 96 mỗi ngày. Ba bữa trung bình 35 là 105, vừa đủ. Bỏ một bữa là bắt đầu đói.
- Năng lượng: 10 giờ làm và học mất 50, 6 giờ còn lại mất 15, tổng 65 mỗi ngày. Ngủ 8 giờ hồi 80, nên **hoà vốn quanh 6,5 giờ ngủ**. Ngủ 5 giờ thì âm khoảng 15 mỗi ngày, vài ngày là thấy rõ.

### 11.2 Hệ số thể trạng m

Gọi x là giá trị thấp nhất trong Năng lượng, No, Tinh thần.

- x ≥ 60: m = 1,0 (không bị phạt khi chăm sóc cơ bản).
- 20 ≤ x < 60: m = 0,7 + 0,3 × (x − 20) / 40.
- x < 20: m = 0,5.
- Nhân thêm 0,8 nếu Sức khoẻ < 40 hoặc đang ốm.

m dùng chung cho tốc độ làm việc, tỷ lệ lỗi, XP học tối và kết quả nấu ăn. Nguyên tắc: người chơi chăm sóc đủ thì **không bị phạt**; phạt chỉ xuất hiện khi lơ là.

### 11.3 Nguyên tắc cân bằng chỉ số

- Mọi cách hồi nhanh đều có giá: cà phê tăng năng lượng tạm nhưng tụt lại, ăn nhanh rẻ nhưng chất lượng thấp, bệnh viện tốn tiền và thời gian.
- Không có vật phẩm hồi hoàn toàn. Chỉ số hồi chậm hơn giảm một chút, buộc người chơi lên kế hoạch.
- Hiển thị cảnh báo sớm (màu, icon SVG) trước khi chạm ngưỡng phạt, để thất bại luôn là do lựa chọn.

## 12. Kỹ năng và công việc kiểu game dev simulator

Sáu kỹ năng, mỗi kỹ năng Lv1–Lv10: **Lập trình, Logic, Đồ hoạ, Quản lý, Giao tiếp** (kỹ năng nghề) và **Nấu ăn** (kỹ năng sống).

| Kỹ năng | Vai trò trong công việc |
| --- | --- |
| Lập trình | Tốc độ hoàn thành phần việc kỹ thuật |
| Logic | Giảm tỷ lệ lỗi, cần cho nhiệm vụ thiết kế hệ thống |
| Đồ hoạ | Phần việc giao diện, hình ảnh; yêu cầu của nhiều dự án |
| Quản lý | Điều phối nhóm, mở công ty, thăng chức |
| Giao tiếp | Phỏng vấn, thương lượng, quan hệ NPC, nhận dự án |

### 12.1 Đường cong XP

XP cần để lên từ Lv n sang Lv n+1: **80 × n^1,6** (làm tròn).

| Lv | 1→2 | 2→3 | 3→4 | 4→5 | 5→6 | 6→7 | 7→8 | 8→9 | 9→10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| XP | 80 | 243 | 464 | 735 | 1.050 | 1.406 | 1.800 | 2.229 | 2.688 |

Tổng đến Lv5 khoảng 1.520 XP, đến Lv10 khoảng 10.700 XP. Nếu một người chơi chăm kiếm khoảng 80 XP mỗi ngày cho kỹ năng chính, Lv5 đến sau gần 3 tuần và Lv10 sau khoảng 4–5 tháng. Chia XP cho nhiều kỹ năng thì chậm hơn tương ứng. Bạn chỉnh số 80 để điều tốc độ toàn game.

### 12.2 Mô hình một nhiệm vụ

Mỗi nhiệm vụ có: kỹ năng yêu cầu và Lv yêu cầu (Lvyc), giờ chuẩn H, độ khó, XP, và hậu quả lỗi.

- Chênh lệch d = Lv kỹ năng − Lvyc.
- Tốc độ kỹ năng: s = clamp(1 + 0,12 × d, 0,5; 1,6).
- Tiến độ mỗi giờ = (100 / H) × s × m (phần trăm).
- Tỷ lệ lỗi: p = clamp(0,20 − 0,05 × d + 0,3 × (1 − m), 0,03; 0,60). Ví dụ: d = 0 và m = 1 cho 20% lỗi; d = +2 còn 10%; m = 0,7 thêm khoảng 9%.
- Đạt 100% mới roll lỗi. Lỗi tốn thêm 25–40% giờ chuẩn để sửa, không trừ lương cơ bản.
- XP nhận = H × 8 × (1 + 0,25 × max(0, Lvyc − Lv)). Nhiệm vụ quá dễ (d ≥ 3) chỉ nhận 50% XP, để không farm việc dễ.

Một ngày 8 giờ cho khoảng 64 XP, khớp với mức 80 XP ở trên khi cộng thêm học tối.

### 12.3 Học tối

- Khoá cơ bản (tới Lv4), nâng cao (tới Lv7), chuyên sâu (tới Lv10, yêu cầu đã có kinh nghiệm làm việc).
- Mỗi buổi 2 giờ, tốn năng lượng và đi lại; XP khoảng 70 mỗi buổi nhân với m.
- Học phí đề xuất: cơ bản 1,2 triệu, nâng cao 2 triệu, chuyên sâu 3 triệu mỗi khoá. Tự học (sách, video) miễn phí nhưng XP khoảng 40 mỗi buổi và tối đa tới Lv3.
- Chỉ thưởng khi hoàn thành khoá; bỏ giữa chừng thì mất phí.

### 12.3b Hiệu quả của học tối

Mục 12.3 chỉ nói học tối cho XP; mục này nói rõ **học tối để làm gì**. Các số liệu là đề xuất và thay cho học phí và XP ở mục 12.3.

**Chuỗi hiệu quả:** học tối → XP kỹ năng → lên Lv → bốn lợi ích:

1. **Làm nhanh hơn, ít lỗi hơn:** tốc độ s = 1 + 0,12 × d, lỗi = 0,20 − 0,05 × d (mục 12.2).
2. **Mở việc khó hơn:** việc khó cho nhiều XP và tiền hơn, nhưng chỉ nhận được khi đủ Lv và bậc.
3. **Thăng bậc nghề và tăng lương:** mỗi bậc đòi Lv và chứng chỉ (mục 12.4).
4. **Mở cơ hội mới:** Giao tiếp cho phỏng vấn và thương lượng, Lập trình cho dự án tay trái, Quản lý từ Lv6 cho mở công ty.

**Học tối khác đi làm ở chỗ nào:**

|  | Đi làm | Học tối |
| --- | --- | --- |
| Luyện kỹ năng nào | Chỉ kỹ năng việc đang dùng (kỹ năng chính) | Bất kỳ kỹ năng nào, nhất là kỹ năng phụ (Quản lý, Giao tiếp, Đồ hoạ) |
| Trần | XP không vượt **trần của bậc nghề hiện tại** | Khoá học cho **chứng chỉ** để vượt trần |
| Chi phí | Có lương | Tốn học phí, giờ tối, năng lượng |

**Trần bậc nghề và chứng chỉ (điểm mấu chốt):** XP từ đi làm chỉ lên tới trần của bậc hiện tại: Thực tập Lv2, Junior Lv4, Middle Lv6, Senior Lv8, Chuyên gia Lv10. Muốn vượt trần phải có chứng chỉ khoá học tương ứng và qua đánh giá thăng bậc. Nhờ vậy học tối không thể bị thay bằng đi làm đơn thuần, và kỹ năng phụ chỉ lên được bằng học.

**Khoá học (đề xuất):**

| Khoá | Lv mục tiêu | Số buổi | XP mỗi buổi | Học phí | Chứng chỉ |
| --- | --- | --- | --- | --- | --- |
| Cơ bản | 1 → 4 | khoảng 12 | 70 | khoảng 0,85 triệu | Cơ bản |
| Nâng cao | 4 → 7 | khoảng 21 | 150 | khoảng 2,7 triệu | Nâng cao |
| Chuyên sâu | 7 → 10 | khoảng 22 | 300 | khoảng 4,8 triệu | Chuyên sâu (cần có kinh nghiệm làm việc) |

Tự học (sách, video) miễn phí, XP khoảng 40 mỗi buổi, tối đa tới Lv3, không cấp chứng chỉ. Học phí tính theo buổi; bỏ giữa chừng thì mất phí các buổi đã học nhưng giữ XP đã nhận.

**Đánh đổi mỗi buổi:** 2 giờ buổi tối (thay cho nấu ăn, gặp bạn, nghỉ, dự án riêng), khoảng −10 năng lượng, tăng nhẹ căng thẳng, học phí; XP nhân với hệ số thể trạng m (mục 11.2). Mỗi ngày tối đa một buổi, và từ buổi thứ 4 trong tuần XP chỉ còn 50% để không cày.

**Ví dụ:** một Junior Lập trình đã chạm trần Lv4 muốn lên Middle (lương 14 triệu thay vì 9 triệu). Cần học khoá Nâng cao đến Lv5 (khoảng 5 buổi, cần 735 XP ở 150 XP mỗi buổi) và nhận chứng chỉ, sau đó đủ điều kiện thời gian và đánh giá để thăng bậc (mục 12.4). Chi phí khoảng một tuần buổi tối và vài trăm nghìn học phí; lợi ích khoảng +5 triệu mỗi tháng và việc khó hơn. Chặng càng cao thì càng tốn công hơn.

### 12.4 Bậc nghề và lương (Chương 1–2)

| Bậc | Lương tháng | Điều kiện lên bậc (đề xuất) |
| --- | --- | --- |
| Thử việc | 85% của bậc Junior | Qua 2 tháng, không quá 2 lần đi muộn lớn |
| Junior | 9 triệu | Kỹ năng chính ≥ Lv3 |
| Middle | 14 triệu | Kỹ năng chính ≥ Lv5, ≥ 6 tháng, đánh giá tốt |
| Senior | 22 triệu | Kỹ năng chính ≥ Lv7, Giao tiếp ≥ Lv4 |
| Lead | 32 triệu | Kỹ năng chính ≥ Lv8, Quản lý ≥ Lv5 |

## 13. Kinh tế vi mô và dòng tiền

### 13.1 Bảng thu chi tháng đầu (đề xuất)

| Khoản | Ăn ngoài | Tự nấu 70% bữa |
| --- | --- | --- |
| Lương thử việc (85% của 9 triệu) | 7,65 triệu | 7,65 triệu |
| Tiền trọ | 2,5 | 2,5 |
| Ăn uống | 2,7 | khoảng 1,9 |
| Đi lại (bus) | 0,6 | 0,6 |
| Điện nước, mạng | 0,5 | 0,5 |
| Đồ dùng, linh tinh | 0,5 | 0,5 |
| Học tối | 0,8 | 0,8 |
| **Dư cuối tháng** | **khoảng 0** | **khoảng +0,85** |

Hai ý đồ thiết kế: (1) tháng thử việc đủ chặt để người chơi thấy áp lực nhưng không chết; (2) tự nấu tiết kiệm khoảng 0,8 triệu mỗi tháng nhưng tốn khoảng 1 giờ mỗi ngày, nên nấu ăn là một lựa chọn có giá trị thật.

Sau thử việc (9 triệu): dư khoảng 1,4 triệu nếu ăn ngoài và khoảng 2,2 triệu nếu tự nấu.

### 13.2 Giá tham chiếu và hoàn vốn

Quy tắc: **thiết bị nghề hoàn vốn trong 3–6 tháng** nhờ tăng XP hoặc lương; **đồ trang trí** chỉ tăng Tinh thần có trần.

| Món | Giá | Tác dụng (đề xuất) |
| --- | --- | --- |
| Laptop cũ | 6 triệu | Làm việc tại nhà, học tự túc |
| Laptop tầm trung | 15 triệu | XP học tối +10%, mở nhận việc tay trái |
| Bàn + ghế làm việc | 2,1 triệu | Năng lượng hao khi học −10% |
| Xe đạp | 1,5 triệu | Quãng ngắn nhanh hơn đi bộ, không tốn nhiên liệu |
| Xe máy cũ | 14 triệu | Rút ngắn đi lại, tốn xăng và gửi xe |
| Tủ lạnh mini | 3,5 triệu | Giữ nguyên liệu và đồ nấu lâu hơn |

### 13.3 Ba persona kiểm thử

- **Tiết kiệm:** dư ≥ 30% thu nhập từ tháng thứ 3.
- **Bình thường:** dư 10–15% từ tháng thứ 4.
- **Hoang phí:** âm ở tháng thứ 2, nhưng game **không bế tắc**: kích hoạt phục hồi mềm (mẹ gửi ít tiền kèm điều kiện, việc làm thêm cuối tuần). Thiếu tiền không tự vay hay tự âm số dư.

## 14. Nấu ăn: công thức học được, mua được, hoặc nấu bừa

### 14.1 Dữ liệu

- **Nguyên liệu:** id, các tag (đạm, rau, tinh bột, gia vị, béo, chua, ngọt, cay…), giá, độ no cơ bản, hạn tươi (ngày), cách bảo quản. Mua theo **lô**, mỗi lô có ngày mua và độ tươi riêng.
- **Công thức:** yêu cầu nguyên liệu hoặc tag, Lv Nấu ăn tối thiểu, thời gian, số khẩu phần, chất lượng tối đa. Người chơi có **sổ công thức** ghi những gì đã biết.
- **Món đã nấu:** có chất lượng, khẩu phần và hạn dùng riêng; không "tươi lại" khi cho vào tủ lạnh, tủ lạnh chỉ làm hỏng chậm hơn.

### 14.2 Ba cách có công thức

1. **Nói chuyện (sự kiện NPC):** mẹ gọi dạy món quê, bà chủ trọ chỉ cách kho cá, đồng nghiệp rủ ăn rồi chia sẻ. Cần quan hệ đủ ngưỡng; nhận xong ghi vào Nhật ký và sổ.
2. **Mua:** sách và khoá nấu ăn ở TTTM (khoảng 200–400 nghìn mỗi cuốn), mở nhóm công thức theo chủ đề.
3. **Nấu bừa:** chọn 2–5 nguyên liệu và thử, xem bên dưới.

### 14.3 Cơ chế nấu bừa

- Nếu tập nguyên liệu khớp một công thức chưa biết và Lv Nấu ăn đủ, người chơi **khám phá** ra công thức đó, ghi vào sổ, chất lượng theo công thức.
- Nếu không khớp, hệ thống chấm điểm cân bằng B: có đạm, có rau, có tinh bột, vị hợp nhau. Mỗi cặp xung khắc (danh sách cố định, ví dụ ngọt với mắm sống) trừ điểm.
- Chất lượng món tự chế: Q = clamp(round(1 + B + 0,25 × Lv Nấu ăn) − số cặp xung khắc, 1, 3). **Món nấu bừa tối đa Q3**, muốn Q4–Q5 phải biết công thức.
- Rủi ro: đạm nấu chưa chín hoặc nguyên liệu quá hạn gây ngộ độc. Xác suất cơ bản 15% cho đạm sống, giảm theo Lv Nấu ăn và theo độ tươi.
- Chống lạm dụng: nguyên liệu bị tiêu hao thật; tổ hợp đã thất bại hiện cảnh báo "đã thử" trong sổ; mỗi lần nấu tốn thời gian và năng lượng.

### 14.4 Hiệu ứng theo chất lượng (đề xuất)

| Chất lượng | No | Tinh thần | Ghi chú |
| --- | --- | --- | --- |
| Q1 | +20 | −5 | Dở, rủi ro bệnh cao hơn |
| Q2 | +30 | 0 | Ăn được |
| Q3 | +40 | +2 | Tạm ổn |
| Q4 | +50 | +5 | Cần công thức |
| Q5 | +55 | +8 | Cần công thức và Lv Nấu ăn cao |

Nấu cho người khác (rủ ăn, mời bạn) thưởng quan hệ nhưng có cooldown và trần.

### 14.5 Bệnh do ăn uống

Rủi ro phụ thuộc **độ tươi, chín, bảo quản**, không phụ thuộc giá. Món rẻ không mặc định mất vệ sinh. Bệnh có mức nặng, thời gian phát tác (vài giờ), tác động tới công việc, và quá trình hồi phục; bệnh viện khám và điều trị chứ không trả tiền là khỏi ngay.

## 15. Bản đồ dạng node và phương tiện

### 15.1 Cấu trúc

- **Node:** nhà trọ, chợ, TTTM, văn phòng, bến bus, ngân hàng, bệnh viện, quán ăn, sau này là quê và văn phòng công ty.
- **Cạnh:** khoảng cách km, loại đường (đi bộ được, đường lớn, tuyến bus). Một cạnh có thể cho phép nhiều phương tiện.
- **Thời gian đi (phút)** = quãng đường / vận tốc × 60 × hệ số kẹt/thời tiết + thời gian chờ (với bus).

### 15.2 Bảng phương tiện (đề xuất)

| Phương tiện | Tốc độ | Chi phí | Ghi chú |
| --- | --- | --- | --- |
| Đi bộ | 5 km/h | 0 | Không bị kẹt, tốn nhiều năng lượng nếu xa |
| Xe đạp | 12 km/h | 0 | Mưa ×0,7 |
| Bus | 20 km/h + chờ trung bình nửa giãn cách (khoảng 10 phút) | Vé khoảng 7 nghìn | Theo tuyến, có giờ |
| Xe máy | 28 km/h | Xăng khoảng 1,5 nghìn/km, gửi xe 5 nghìn | Cao điểm ×0,7; mưa ×0,8 và trừ Tinh thần |
| Taxi | 25 km/h | Khoảng 15 nghìn/km | Nhanh, tốn tiền |
| Ô tô | 22 km/h | Xăng khoảng 3 nghìn/km, gửi xe 20 nghìn | Cao điểm ×0,6; không luôn nhanh nhất mọi tuyến |

Giờ cao điểm: 7–9h và 17–19h, ảnh hưởng xe máy, ô tô, taxi, bus; không ảnh hưởng đi bộ và xe đạp.

**Ví dụ kiểm tra:** nhà trọ tới văn phòng 6 km. Đi bộ 72 phút; xe đạp 30 phút; bus khoảng 28 phút; xe máy 13 phút (khoảng 18 phút giờ cao điểm). Hai chiều mỗi ngày, xe máy tiết kiệm khoảng 20–30 phút so với bus, tức 10–15 giờ mỗi tháng, đổi lại 14 triệu tiền xe cộng xăng và bảo dưỡng. Đủ để người chơi cân nhắc thật.

### 15.3 Hao mòn và sự cố

- Phương tiện có độ bền tụt theo km; bảo dưỡng định kỳ (ví dụ mỗi 1.500 km) tốn tiền nhưng giảm xác suất hỏng.
- Sự cố gắn vào chuyến đi và lưu kết quả; đi muộn tính theo giờ đến thật. Hỏng xe không làm mất quyền sở hữu.
- Tuyến về quê (xe khách khoảng 180 km, khoảng 4 giờ, vé khoảng 160 nghìn) mở ở Chương 2. **Cần chốt** quy tắc khi chuyến về qua 22h; không được âm thầm bỏ phút chậm.

## 16. Nhà ở và sắp xếp đồ đạc

### 16.1 Phong cách isometric và quy ước

- Ô lưới tỷ lệ 2:1 (ví dụ 128×64 px), camera cố định, một hướng sáng chung, nền trong suốt.
- Logic game chạy trên lưới 2D (x, y); lớp vẽ chỉ đổi toạ độ sang màn hình. Điểm neo của mỗi sprite ở giữa đáy ô đầu tiên.
- Bản chơi thử hiện tại là **một ảnh liền**. Ảnh đó chỉ làm tham chiếu phong cách; phải dựng lại thành các lớp tách rời.

### 16.2 Món cố định và món di chuyển được

| Nhóm | Gồm | Cách làm |
| --- | --- | --- |
| Vỏ phòng (cố định, một ảnh) | Sàn, hai tường sau, vách và thiết bị phòng tắm, quầy bếp và bồn rửa | Render một lần, không kéo được |
| Đồ gắn tường | Cửa chính, cửa phòng tắm, cửa sổ, tranh | Món riêng gắn vào ô tường; cửa có trạng thái đóng và mở |
| Đồ di chuyển được (khoảng 8 món) | Giường, bàn làm việc, ghế làm việc, bàn ăn, ghế đẩu, đèn bàn, thảm, cây | Sprite riêng, có kích thước ô, điểm neo, số hướng |

Laptop là phụ kiện gắn vào bàn làm việc, di chuyển cùng bàn. Coi bếp và phòng tắm là cố định để giảm khối lượng ảnh; có thể mở khoá di chuyển sau.

### 16.3 Số hướng, lớp vẽ và cách tạo ảnh

- Đồ dựa tường: 1–2 ảnh. Đồ đối xứng: 2 ảnh, lật ngang cho hướng còn lại. Đồ có mặt trước đặt giữa phòng: 2 hướng, nút xoay đổi qua lại giữa hai hướng.
- Lớp từ dưới lên: sàn, tường sau, cửa và cửa sổ, đồ, bóng đổ, lớp giờ trong ngày (cửa sổ tối, đèn sáng, màu ấm lúc tối).
- Thứ tự che nhau theo toạ độ lưới (x + y, rồi độ cao); đồ nhiều ô sắp theo ô xa nhất.
- Chọn đồ bằng ô lưới trước, rồi theo vùng không trong suốt của sprite. Dùng canvas hoặc PixiJS cho vùng bố trí để kéo thả mượt trên điện thoại.
- Tạo ảnh bằng render 3D đơn giản (camera trực giao, một hướng sáng); AI chỉ dùng để phủ chất liệu và giữ phong cách.

### 16.4 Dữ liệu

- **Món đồ (loại):** id, nhóm, kích thước ô (rộng × cao), điểm neo, các hướng xoay được, ảnh theo hướng, danh sách **điểm dùng** (slot) và hiệu ứng.
- **Món đã sở hữu (bản thể):** instanceId, phòng, ô lưới, hướng, trạng thái (trong kho hoặc đã đặt), độ bền, thuộc cá nhân hay công ty.
- Bàn 2×1 xoay thành 1×2. Mỗi hướng dùng đúng ảnh của hướng đó.

### 16.5 Điểm dùng và hiệu ứng

| Món | Điểm dùng | Hiệu ứng (có trần) |
| --- | --- | --- |
| Giường | Ngủ | Hồi năng lượng ×1,0 đến ×1,3 theo chất lượng nệm |
| Bàn + ghế + máy tính | Làm việc, học tại nhà | XP học ×1,0 đến ×1,15; hao năng lượng giảm |
| Bếp | Nấu | Mở món cần bếp, tăng độ an toàn nấu |
| Tủ lạnh | Cất nguyên liệu và đồ nấu | Hạn dùng kéo dài, sức chứa theo cỡ |
| Kệ sách, cây, tranh | Trang trí | Cộng Tinh thần nhỏ, **tổng trang trí tối đa +10** |

### 16.6 Quy tắc hợp lệ

- Không chồng đồ, không xuyên tường, không chặn cửa. Kiểm tra bằng tìm đường (BFS) trên lưới: từ cửa phải tới được **mọi** điểm dùng.
- Chế độ Bố trí có Xác nhận và Hủy; bản đang chỉnh không ghi đè bố cục đã lưu, Hủy trả đúng vị trí và hướng cũ.
- Dữ liệu tương tác đi theo món đồ, không gắn với toạ độ cũ. Trên điện thoại phải phân biệt kéo đồ với kéo cảnh.
- Nhà là nơi tiêu tiền: phòng trọ nhỏ, căn hộ nhỏ, căn hộ lớn (số ô tăng dần), kèm tiền thuê tăng. Văn phòng công ty có bố cục và quyền riêng.

## 17. NPC nói chuyện theo sự kiện, không theo kịch bản

Ý tưởng cốt lõi: không viết cây hội thoại cố định cho từng NPC. Thay vào đó, **một bộ điều phối sự kiện** quyết định chuyện gì xảy ra, còn lời thoại được ghép từ các mảnh theo bối cảnh.

### 17.1 Trạng thái mỗi NPC

- **Tính cách:** 3–4 nét (hay nói, ngại, nghiêm túc, tốt bụng, tham…).
- **Nhu cầu:** tiền, đói, cô đơn, công việc, gia đình, mỗi cái là một con số thay đổi theo thời gian.
- **Tâm trạng** (thay đổi theo sự kiện) và **lịch** (ở đâu, giờ nào).
- **Quan hệ với người chơi** (−100 đến +100) cùng nhãn (đồng nghiệp, hàng xóm…).
- **Ký ức:** danh sách sự thật ngắn có trọng lượng và hạn nhớ, ví dụ: người chơi đã giúp, đi muộn, từ chối cho mượn tiền.

### 17.2 Mẫu sự kiện (event template)

Mỗi mẫu có: điều kiện kích hoạt (địa điểm, giờ, quan hệ, nhu cầu, trạng thái người chơi), các **vai** (người khởi xướng, người nhận), điểm ưu tiên, cooldown hoặc cờ một lần, các lựa chọn của người chơi (gắn tag thái độ: chân thành, từ chối, hài hước, né tránh) và hệ quả (quan hệ, ký ức, tiền, thời gian, mở công thức…).

Ví dụ mẫu: xin giúp việc, rủ ăn trưa, than phiền, chia sẻ công thức, mượn tiền, nhắc nhở đi muộn, khoe món mới, hỏi thăm từ quê, tin đồn nơi làm.

### 17.3 Bộ điều phối (director)

Mỗi 30 phút game, với mỗi NPC đang có mặt gần người chơi (hoặc kênh tin nhắn/cuộc gọi từ xa):

1. Lấy các mẫu có điều kiện thoả.
2. Điểm = ưu tiên × độ khớp nhu cầu × độ khớp tâm trạng × độ khớp quan hệ × (1 − độ gần đây của mẫu) × số ngẫu nhiên theo seed.
3. Chọn mẫu điểm cao nhất nếu vượt ngưỡng; giới hạn khoảng 3 sự kiện mỗi ngày và cách nhau tối thiểu 2 giờ để không dồn dập.
4. Gặp trực tiếp chỉ khi cùng có mặt đúng nơi và giờ (cùng toà nhà chưa đủ).

### 17.4 Ghép lời thoại

Lời nói = **ý định** (hỏi, nhờ, khoe, than, cảm ơn) × **chủ đề** (món vừa ăn, thời tiết, dự án, quê) × **giọng** (theo tính cách) × **xưng hô** (theo quan hệ). Thư viện câu theo cặp (ý định, giọng) có biến điền như {món}, {dự án}. Có bộ nhớ lời để không lặp lại cùng một câu trong thời gian ngắn.

### 17.5 Phản hồi và ký ức

Người chơi chọn 2–4 phản hồi. Kết quả = f(tag thái độ, tính cách NPC, quan hệ, tâm trạng). Sau đó cập nhật quan hệ, nhu cầu và ghi ký ức. Sự kiện sau có thể nhắc lại ký ức (ví dụ: "hôm trước bạn giúp mình") với xác suất, tạo cảm giác NPC nhớ người chơi. Không công khai nguyên nhân hay thủ phạm khi nhân vật chưa có bằng chứng.

### 17.6 Tuỳ chọn dùng AI viết lời (để sau)

Có thể dùng mô hình ngôn ngữ chỉ để **diễn đạt lại** câu cho tự nhiên. Quyết định, số liệu và hậu quả vẫn do engine. Cần cache, giới hạn chi phí và câu dự phòng khi lỗi. Khuyến nghị làm sau khi hệ thống mẫu ổn.

### 17.7 Dữ liệu khởi điểm

Chuyển 12 sự kiện và 24 mẫu hoạt động của NPC System v0.2 sang cấu trúc mẫu ở trên (thêm vai, điều kiện, cooldown). Mục tiêu Chương 1: khoảng 40 mẫu, đủ để một tháng chơi ít gặp lặp lại.

### 17.8 Giao diện hội thoại (chốt 04/11)

- **Bố cục:** khung thoại ở nửa dưới màn hình, cảnh phòng hoặc văn phòng vẫn hiện phía trên. Đầu khung có tên, nghề, nhãn quan hệ kèm điểm và thanh tiến độ tới bậc kế; một dòng ký ức nhắc chuyện cũ liên quan; lời thoại ghép từ mô-típ; 2–4 lựa chọn. Mỗi cuộc 1–3 lượt chọn, chọn xong hiện kết quả một dòng rồi đóng.
- **Cách vào:** chạm vào NPC mở bảng hành động (Chào hỏi, Trò chuyện, Rủ đi ăn, Nhờ giúp, Tặng quà), thay cho hai nút 5 và 15 phút hiện tại; NPC chủ động bắt chuyện khi bộ điều phối chọn mô-típ; tin nhắn điện thoại dùng cùng dữ liệu, hiện dạng khung chat.
- **Ảnh NPC:** tạm dùng vòng tròn chữ cái. Khi hệ thống NPC xong mới vẽ chân dung một lượt.
- **Hệ quả:** không ghi trước cái giá hay kết quả của lựa chọn.
- **Lựa chọn cần kỹ năng chưa đủ:** vẫn hiện nhưng mờ, ghi điều kiện (ví dụ Giao tiếp Lv3), không bấm được.

## 18. Ngân hàng và mở công ty

### 18.1 Ngân hàng

- **Tiết kiệm:** kỳ hạn 3, 6, 12 tháng; lãi đề xuất 4–6% mỗi năm; rút trước hạn mất lãi.
- **Vay tiêu dùng:** hạn mức khoảng 3 × lương tháng × hệ số tín dụng (0,5–1,2).
- **Vay vốn kinh doanh:** tối đa khoảng 50% vốn tự có cộng giá trị tài sản bảo đảm; lãi đề xuất 11–13% mỗi năm.
- **Điểm tín dụng** (300–850): tăng khi trả đúng hạn và thu nhập ổn định, giảm khi trễ.
- **Trả góp đều:** PMT = P × r / (1 − (1 + r)^−n), với r là lãi mỗi tháng và n là số kỳ. Ví dụ vay 100 triệu, lãi 12% năm, 12 tháng: r = 1% mỗi tháng, trả khoảng **8,88 triệu mỗi tháng**.
- Trễ hạn: phạt, hạ điểm tín dụng, nhưng không âm số dư hay tự xiết ngay; có đường phục hồi mềm. Điều khoản lưu lúc ký, kỳ lãi chỉ xử lý một lần.

### 18.2 Mở công ty (Chương 3)

- **Điều kiện mở (đề xuất):** Quản lý ≥ Lv6, kỹ năng chính ≥ Lv7, ≥ 12 tháng làm việc, vốn tối thiểu khoảng 150 triệu (vốn tự có cộng vay).
- **Dự án:** khách hàng, yêu cầu theo điểm Lập trình / Logic / Đồ hoạ / Quản lý, thời hạn, tiền thưởng, phạt trễ.
- **Nhân sự:** mỗi người có kỹ năng, lương, tinh thần; người chơi phân việc như kiểu game dev simulator.
- **Dòng tiền:** doanh thu dự án (khách trả chậm khoảng 30 ngày) trừ lương, thuê văn phòng, lãi vay.
- **Rủi ro:** trễ hạn mất uy tín, mất khách; nhân viên nghỉ nếu quá tải.
- Tài sản công ty tách khỏi tài sản cá nhân; quyền nhân viên khác quyền chủ.

### 18.3 Không gian văn phòng (chốt 04/11)

- **Phạm vi (chốt 04/11, sau):** đi làm thuê dùng ảnh tĩnh văn phòng, các công ty tạm dùng chung một ảnh, điểm chạm đồng nghiệp đặt trên ảnh. Văn phòng isometric dưới đây chỉ dùng khi người chơi mở công ty; code mặt bằng đã có sẵn, art giao Codex khi tới giai đoạn đó.
- **Tỷ lệ:** cùng tỷ lệ phòng trọ, 1 ô sàn khoảng 0,5 m, ô 128×64 px theo quy cách asset.
- **Cỡ văn phòng:** Nhỏ 40 m², 6 chỗ, 1 khu; Vừa 85 m², 12 chỗ, 2 khu; Lớn 160 m², 24 chỗ, 5 khu (lễ tân, hai khu làm việc, phòng họp có pantry, phòng trưởng nhóm); Cả tầng 300 m², 40 chỗ, 6 khu (cỡ mới, cho công ty người chơi giai đoạn sau).
- **Khu:** mỗi khu khoảng 12×12 ô, ngăn bằng tường và cửa. Loại khu: khu làm việc (mọi cỡ), pantry, phòng họp (từ Vừa), phòng sếp hoặc trưởng nhóm (từ Lớn), lễ tân (từ Lớn), khu riêng theo ngành (phòng server, phòng chụp mẫu, kho hàng mẫu, phòng lưu hồ sơ).
- **Xem trên điện thoại:** cả văn phòng là một sàn liền, kéo và phóng to như bản đồ thành phố. Camera mở ở bàn người chơi; có nút nhảy nhanh tới từng khu.
- **Nội dung ghép từ khuôn:** vỏ khu dùng chung, bộ đồ chung mọi ngành cộng bộ đồ riêng từng ngành (Công nghệ, Thiết kế, Thương mại, Kế toán). Sáu công ty và văn phòng người chơi mở đều dùng lại vỏ và bộ đồ này.
- **Giao diện màn văn phòng:** thanh trên có ca và tiến độ ca, nút gom các mục phụ; cảnh ở giữa (ảnh tĩnh khi làm thuê, isometric khi là chủ), chạm đồng nghiệp để nói chuyện; tấm bảng dưới đổi theo tình huống (chọn việc, đang làm, điểm rẽ, bug, hết ca).
- **Art (khi mở công ty):** tạm dựng bằng khối theo đúng chân đế và chiều cao; Codex vẽ theo lô, món nào có ảnh thì thay khối. Lô đầu: bàn có máy tính, ghế, kệ, chậu cây (Issue #55, đang hoãn).

## 19. Trung tâm thương mại và các nguồn tiêu tiền

- Bốn khu: điện tử, phương tiện, quần áo/nội thất, đồ ăn; chợ riêng cho nguyên liệu.
- Mỗi mặt hàng có hạng **Bình dân, Chuẩn, Cao cấp**, hiệu ứng tăng nhưng **giảm dần** (cao cấp không đắt gấp đôi mà tốt gấp đôi).
- Giảm giá theo lịch mùa; ưu đãi theo quan hệ có giới hạn.
- Đồ đã mua có ID riêng; bán lại khoảng 50–60% giá để chống mua-bán vòng kiếm tiền vô hạn.
- Mua trực tiếp hoặc đặt qua điện thoại (giao sớm nhất hôm sau, thanh toán khi nhận); nhận đồ, trừ tiền và ghi đơn là một thao tác nguyên tử, không nhận trùng.
- **Nguồn tiêu tiền chính theo chương:** Chương 1: trọ, ăn, học, đồ thiết yếu; Chương 2: nhà, phương tiện, thiết bị nghề, quần áo cho giao tiếp; Chương 3: vốn công ty, lương nhân viên.

## 20. Tìm "thiếu sót" và kiểm thử cân bằng

### 20.1 Câu hỏi chẩn đoán cho bản chơi thử

Hãy tự chơi 30 phút rồi trả lời, hoặc gửi tôi ảnh chụp màn hình và ghi chú:

1. Người chơi biết **mục tiêu tiếp theo** là gì sau 5 phút đầu không?
2. Trong một ngày, có ít nhất **một lựa chọn đáng cân nhắc** (giữa tiền, giờ, sức khoẻ) không, hay chỉ bấm theo thứ tự?
3. Tiền và chỉ số có **áp lực vừa đủ** không (không quá dễ, không bế tắc)?
4. NPC có **nói điều khác nhau** khi gặp lần thứ ba, và có nhớ người chơi không?
5. Có thứ gì **mua xong rồi không dùng tới** không?
6. Sau 3 giờ chơi, có lý do để chơi tiếp không (mục tiêu, mở khoá, cốt truyện)?
7. Điện thoại: thao tác kéo, cuộn, chạm có bị khó chịu không?

Cho tôi biết 2–3 điểm bạn thấy thiếu nhất, tôi sẽ đào sâu đúng phần đó.

### 20.2 Công cụ cân bằng

- Bảng tính thu chi theo tháng cho ba persona ở mục 13.3.
- **Mô phỏng tự động không giao diện:** chạy 12 tháng game cho từng persona, ghi tiền, chỉ số, Lv kỹ năng theo ngày.
- **Chỉ tiêu cần đạt:** 0% lượt chơi rơi vào bế tắc; Lv5 kỹ năng chính khoảng 3–5 tuần; người chơi bình thường mua được laptop tầm trung trước tháng thứ 6 (có thể chỉnh); không có chiến lược lặp một hành động để kiếm tiền hay XP vô hạn.
- Ghi log tiền và chỉ số theo ngày ngay trong bản chơi thử để xem số liệu thật thay vì cảm tính.

