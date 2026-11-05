# Bộ sinh hội thoại (đề xuất, chờ duyệt)

Đề xuất 05/11/2026. Chủ dự án duyệt các trục và điều kiện khống chế ở đây trước, sau đó mới chép vào Kế hoạch (Phần I) và code. Không dùng AI sinh câu khi chơi.

## I.1 Nguyên tắc

- Mỗi câu NPC nói là một tổ hợp của các trục bên dưới. Câu được ghép từ **khung** và **mảnh**, không viết sẵn cả câu.
- Mỗi trục có **điều kiện khống chế** riêng: giá trị nào không thỏa điều kiện thì bị loại trước khi ghép. Nhờ vậy câu luôn đúng ngữ cảnh và đúng sự thật trong game.
- Thêm một trục, hoặc thêm mảnh vào một trục, là số câu nhân lên. Điều kiện khống chế giữ cho phần nhân lên không sinh ra câu vô lý.
- Câu trả lời của người chơi dùng cùng hệ thống.

## I.2 Thứ tự chọn

1. Bối cảnh (trục 6) quyết định có được nói không và nói qua kênh nào.
2. Độ thân (trục 4) và Giọng (trục 5) lấy từ NPC, cố định trong lượt nói.
3. Cảm xúc (trục 3) lấy từ trạng thái NPC hôm nay.
4. Ý định (trục 1) chọn theo trọng số trong số ý định thỏa điều kiện.
5. Chủ đề (trục 2) chọn trong số chủ đề có dữ kiện thật và hợp với ý định.
6. Khung và mảnh: lọc theo cả 6 trục, bỏ mảnh vừa dùng, rồi ghép.

Bước nào không còn giá trị hợp lệ thì lùi lại bước trước chọn giá trị khác; hết cách thì NPC chỉ chào một câu.

## I.3 Sáu trục chính và điều kiện khống chế

### Trục 1. Ý định (8 giá trị)

| Ý định | Điều kiện khống chế | Hồi chiêu |
|---|---|---|
| Khoe | NPC có biến cố tích cực trong 7 ngày (lên lương, mua đồ, con đỗ...), cảm xúc không phải Buồn hoặc Bực | Cùng biến cố chỉ khoe 1 lần với mỗi người |
| Than | NPC có biến cố tiêu cực đang diễn ra, hoặc cảm xúc Mệt, Buồn, Bực | 2 ngày |
| Hỏi | Có chủ đề về người chơi mà NPC được phép biết (xem trục 2) | 1 ngày |
| Rủ | Độ thân từ Quen biết; cả hai rảnh trong khung giờ đề xuất; có nơi phù hợp đang mở; thời tiết cho phép | 3 ngày; bị từ chối thì 7 ngày |
| Nhờ | Độ thân từ Thân (việc nhỏ từ Quen biết); người chơi không đang nợ NPC đó; NPC có lý do thật (biến cố cần giúp) | 7 ngày |
| Kể tin | NPC biết một tin mà người chơi chưa nghe từ NPC này | Mỗi tin 1 lần với mỗi người |
| Trêu | Độ thân từ Thân; tính cách không thuộc nhóm nghiêm (Cầu toàn, Ngại); tâm trạng người chơi từ 40 | 2 ngày |
| Xin lỗi | NPC có ký ức "mình có lỗi" chưa giải quyết (lỡ hẹn, nói nặng, chưa trả tiền) | Đến khi giải quyết |

### Trục 2. Chủ đề (4 nhóm)

| Nhóm | Chủ đề con (ví dụ) | Nguồn dữ kiện | Điều kiện khống chế |
|---|---|---|---|
| Bản thân NPC | công việc, gia đình, sức khỏe, tiền, sở thích, người yêu | Biến cố đời NPC (I.5) | Chỉ biến cố đang diễn ra hoặc xong trong 14 ngày; chuyện riêng (tiền, sức khỏe, người yêu) cần độ thân từ Thân |
| Người chơi | ăn uống, nhà ở, việc làm, sức khỏe, tiền, công ty, người chơi hứa gì | Nhật ký, chỉ số, ký ức | NPC chỉ nhắc điều họ **có thể biết**: tận mắt thấy (cùng nơi, cùng giờ), người chơi kể, hoặc nghe từ NPC quen người chơi; chuyện nợ, ốm, thất nghiệp cần độ thân từ Thân |
| NPC khác | đồng nghiệp, hàng xóm, người cả hai cùng quen | Quan hệ giữa các NPC (T63) | Chỉ nhắc người mà cả NPC và người chơi đều quen; nói xấu chỉ khi độ thân từ Thân và tính cách cho phép |
| Ngoài đời | thời tiết, giá chợ, lễ, tin tức, giao thông, bóng đá | Thời tiết, lịch, bản tin sáng | Chỉ chuyện của hôm nay hoặc hôm qua; tin tức phải có trong bản tin |

Ý định và chủ đề phải hợp nhau theo bảng tương thích (ví dụ Xin lỗi chỉ đi với "người chơi"; Kể tin không đi với "bản thân").

### Trục 3. Cảm xúc (6 giá trị)

Vui, Hào hứng, Bình thường, Mệt, Buồn, Bực.

- Nguồn: tâm trạng NPC trong ngày, tính từ biến cố đời đang diễn ra, thời tiết, giờ trong ngày và tính cách.
- Điều kiện khống chế: phải khớp ý định (Khoe không đi với Buồn; Trêu không đi với Bực); Bực chỉ xuất hiện khi có lý do (biến cố tiêu cực, bị người chơi lỡ hẹn); cảm xúc giữ trong ngày, không nhảy giữa hai câu liên tiếp.

### Trục 4. Độ thân (5 giá trị)

Bất hòa, Lạ, Quen biết (từ 10), Thân (từ 30), Tri kỷ (từ 60), theo mốc đã chốt.

- Quyết định cách xưng hô, độ dài câu và mức riêng tư.
- Điều kiện khống chế: mỗi mảnh có **mức riêng tư** 0 đến 3; chỉ dùng mảnh khi độ thân đủ (Lạ dùng 0, Quen biết tới 1, Thân tới 2, Tri kỷ tới 3); Bất hòa chỉ dùng các mảnh lạnh nhạt, không Rủ, không Nhờ, không Trêu.

### Trục 5. Giọng (12 NPC và Mẹ)

Hai lớp: **vùng** (Tây, Quê, Bắc, Trung, Sài Gòn, theo `VOICE` hiện có) và **nét riêng** (Chú Sáu kể dài, Tuấn nói nhanh, Chị Mai ngắn gọn, Bảo Ngọc lịch sự...).

- Điều kiện khống chế: mảnh có nhãn vùng chỉ dùng cho đúng vùng; mảnh trung tính dùng chung; mỗi NPC có ít nhất 40% mảnh mang giọng riêng để không ai nói giống ai; từ xưng hô lấy từ hồ sơ NPC (con, mình, tui, chị...).

### Trục 6. Bối cảnh (thời điểm, nơi, kênh)

| Thành phần | Giá trị | Điều kiện khống chế |
|---|---|---|
| Thời điểm | Sáng, trưa, chiều, tối, khuya | Khuya (sau 22:00) chỉ nhắn tin, chỉ từ Thân; người lớn tuổi không nhắn khuya |
| Nơi | Chợ, công ty, khu trọ, quán ăn, công viên, ngân hàng, bệnh viện | Mở lời theo nơi (chợ ồn, công ty nói nhỏ); nơi có NPC theo lịch hiện diện; bão không gặp ngoài trời (đã có) |
| Kênh | Gặp mặt, tin nhắn, cuộc gọi | Gọi điện từ Thân (Mẹ luôn được); tin nhắn ngắn hơn gặp mặt; NPC tự mở lời tối đa 3 lần mỗi ngày (đã chốt) |

### Trục mở rộng (sau, mỗi trục nhân thêm)

Tâm trạng người chơi, chuỗi chuyện đang dở, mùa và lễ, quan hệ giữa hai NPC đang có mặt, lần gặp thứ mấy trong ngày.

## I.4 Câu trả lời của người chơi

Mỗi lượt có 3 đến 4 lựa chọn, ghép từ hai trục:

- **Ý định đáp:** Đồng cảm, Hỏi thêm, Khuyên, Đùa, Né, Từ chối, Nhận lời, Kể lại chuyện mình.
- **Giọng người chơi:** Ấm áp, Ngắn gọn, Đùa, Thật lòng.

Điều kiện khống chế:
- Ý định đáp phải hợp với ý định của NPC (NPC Rủ thì có Nhận lời và Từ chối; NPC Than thì có Đồng cảm và Khuyên).
- Lựa chọn cần kỹ năng thì hiện mờ khi thiếu (quy tắc đã chốt). Ví dụ Khuyên về sức khỏe cần Giao tiếp Lv 3; Nhận lời cho mượn cần đủ tiền; Nhận lời rủ cần lịch trống.
- Không lộ hậu quả trước (quy tắc đã chốt).

Hậu quả: điểm quan hệ theo độ hợp giữa giọng người chơi và tính cách NPC (Nóng tính thích Ngắn gọn, Hay giúp đỡ thích Ấm áp...); ghi ký ức để lần sau NPC nhắc lại.

## I.5 Đời sống NPC (nguồn chủ đề "bản thân")

Mỗi NPC chạy biến cố riêng mỗi ngày, kể cả khi không gặp người chơi.

| Loại | Ví dụ | Điều kiện theo vai |
|---|---|---|
| Tích cực | lên lương, được khen, mua xe, con đỗ, trúng mánh hàng | Lên lương chỉ người đi làm; trúng hàng chỉ người buôn bán |
| Tiêu cực | ốm, mất khách, hỏng xe, cãi nhau, bị trừ lương, mất đồ | Ốm nặng tối đa 1 lần mỗi quý |
| Trung tính | về quê, chuyển chỗ, học thêm, chuẩn bị lễ | Theo lịch và mùa |
| Chuỗi dài | yêu và chia tay, con thi đại học, mở quán | Mỗi NPC tối đa 1 chuỗi dài cùng lúc |

Khoảng 30 loại biến cố cho bản đầu. Mỗi biến cố có tần suất, thời lượng, cảm xúc kéo theo và dữ kiện để điền vào câu (món, nơi, số tiền, ngày tương đối).

## I.6 Khung và mảnh

- **Khung** theo ý định, ví dụ Than: `[mở lời][chuyện][cảm xúc][đuôi]`; Rủ: `[mở lời][lời rủ có nơi và giờ][lý do][đuôi]`.
- **Nhãn mỗi mảnh:** ô trong khung, ý định, chủ đề, tập cảm xúc, mức riêng tư, vùng giọng hoặc NPC riêng, dữ kiện cần có, trọng số.
- **Biến điền:** `{món}`, `{nơi}`, `{giờ}`, `{khi nào}` (hôm qua, tuần trước; không ghi ngày chính xác, đã chốt), `{tên}`, `{số tiền}`.
- Bộ kiểm tra tự động: mảnh nào cũng có ít nhất một khung dùng được; biến điền nào cũng có nguồn dữ kiện; không ghép hai mảnh cùng chức năng.

## I.7 Chống lặp

- Cùng mảnh với cùng NPC: không lặp trong 14 ngày.
- Cùng khung: 3 ngày. Cùng ý định và chủ đề: 2 ngày.
- Cùng bộ lựa chọn trả lời với cùng NPC: 7 ngày.

## I.8 Khối lượng và lô

| Lô | Nội dung | Mảnh |
|---|---|---|
| 1 | Bộ ghép, đời sống NPC; Mẹ, Bà Tư, Minh An, Cô Hạnh, Tuấn | khoảng 500 |
| 2 | 7 NPC còn lại, hội thoại nhiều lượt, tự mở lời theo chủ đề | khoảng 600 |
| 3 | NPC ngẫu nhiên có chuyện riêng, nhóm chat, tin đồn | khoảng 400 |

Mỗi lô: chủ dự án duyệt 20 đến 30 câu mẫu trước, Claude viết hàng loạt, bộ kiểm tra chạy, in khoảng 200 câu để đọc lướt, rồi mới gộp.

## I.9 Chỉ tiêu đo bằng mô phỏng (30 ngày, 30 seed)

- Ít nhất 90% câu NPC không trùng nguyên văn.
- 0 câu nhắc dữ kiện sai (kiểm bằng điều kiện của từng mảnh).
- Mỗi NPC thường gặp xuất hiện ít nhất 6 trong 8 ý định mỗi tháng.
- Ít nhất 30% câu nhắc tới trạng thái người chơi hoặc biến cố thật (mục 30 kế hoạch).

## I.10 Cần chủ dự án chốt

1. Sáu trục và các giá trị của từng trục.
2. Điều kiện khống chế và hồi chiêu ở bảng trục 1, 2, 6.
3. Mốc riêng tư theo độ thân (trục 4).
4. Ý định đáp và giọng của người chơi (I.4).
5. Thứ tự lô và 4 NPC đầu tiên của Lô 1.
