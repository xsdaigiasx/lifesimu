# Bộ sinh hội thoại (đề xuất, chờ duyệt)

Đề xuất 05/11/2026. Chủ dự án duyệt các trục và điều kiện khống chế ở đây trước, sau đó mới chép vào Kế hoạch (Phần I) và code. Không dùng AI sinh câu khi chơi.

## I.1 Nguyên tắc

- Mỗi câu NPC nói là một tổ hợp của các trục bên dưới. Câu được ghép từ **khung** và **mảnh**, không viết sẵn cả câu.
- Mỗi trục có **điều kiện khống chế** riêng: giá trị nào không thỏa điều kiện thì bị loại trước khi ghép. Nhờ vậy câu luôn đúng ngữ cảnh và đúng sự thật trong game.
- Thêm một trục, hoặc thêm mảnh vào một trục, là số câu nhân lên. Điều kiện khống chế giữ cho phần nhân lên không sinh ra câu vô lý.
- Câu trả lời của người chơi dùng cùng hệ thống.

## I.1b Pool ngẫu nhiên có điều kiện (ưu tiên số 1)

Mọi thứ trong hội thoại và đời NPC đều rút từ **pool có điều kiện** bằng hạt giống (seed), không viết cứng: mảnh câu, khung, biến cố đời, thói quen, lịch sinh hoạt, tính cách và chuyện riêng của NPC mới. Mỗi phần tử trong pool có điều kiện xuất hiện và trọng số; seed theo đời chơi, ngày và NPC quyết định rút cái nào. Nhờ vậy:

- Mỗi đời chơi một seed khác nên cùng một NPC có thói quen, biến cố, chuyện khác nhau.
- Thêm phần tử vào pool là số tổ hợp nhân lên, không phải viết thêm cảnh.
- Điều kiện giữ cho tổ hợp luôn hợp lý (tuổi, nghề, nơi ở, mùa, độ thân).

## I.1c Dàn NPC: vai cố định, con người ngẫu nhiên

**12 vai cố định** gắn với địa điểm và chức năng game: chủ trọ, hàng xóm về hưu, bán rau, bán bánh mì, sinh viên giao hàng, bác sĩ, giao dịch viên ngân hàng, 5 đồng nghiệp (lập trình, thiết kế, kiểm thử, điều phối, trưởng nhóm). Vai cố định, **con người** thì rút từ pool theo seed mỗi đời chơi: tên, giới, tuổi, quê và giọng, tính cách, sở thích, hoàn cảnh gia đình, thói quen. Pool có điều kiện theo vai (chủ trọ từ 45 tuổi, sinh viên dưới 24, bác sĩ từ 30...).

- Mã NPC trong save giữ theo ô vai (`ba-tu` thành ô chủ trọ) nên save cũ không vỡ.
- Mạch chuyện viết tay hiện có chuyển thành **mạch chuyện mẫu** gắn theo vai và tính cách, không gắn theo tên (chuyện "chủ trọ lo con ở xa" rút cho bất kỳ chủ trọ nào có con).
- Người nối tiếp khi NPC mất (I.5c) điền lại đúng ô vai.

**Người thân:** Mẹ luôn có, cộng 1 em rút ngẫu nhiên (em gái hoặc em trai), mỗi người có pool mạch chuyện riêng (em thi đại học, em xin tiền học...). Bố và gia đình lớn hơn để dành phát triển sau. Người thân không tính vào giới hạn bên dưới.

**Chân dung** ghép từ mảnh (khuôn mặt, tóc, nét theo tuổi và giới), rút theo hồ sơ NPC; Codex vẽ bộ mảnh khi tới lô hội thoại, trước đó dùng chữ cái đầu.

## I.1d Số NPC cùng tồn tại

Đa dạng đến từ tổ hợp, không đến từ số người. Người chơi chỉ giữ được khoảng 5 người thân, 15 người quen, vài chục người biết mặt; mỗi ngày game có khoảng 3 đến 6 lần gặp. Với 30 đến 40 NPC, mỗi người được gặp lại sau khoảng 7 đến 10 ngày, kịp trước khi ký ức mờ (30 ngày).

| Nhóm | Số lượng | Quy tắc |
|---|---|---|
| Ban đầu | khoảng 20 | 12 vai cố định và khoảng 8 NPC ngẫu nhiên quanh khu trọ, chợ, công ty |
| Dải giữ ổn định | 30 đến 40 | Dưới 30 thì sinh bù người mất hoặc rời đi; trên 40 thì ngừng sinh |
| Sinh thêm mỗi năm | 4 đến 6 | Gắn với nơi mới người chơi mở ra (đổi việc, chuyển nhà, mở công ty) |
| Tốc độ | tối đa 2 người mỗi tuần game | Chỉ sinh ở nơi người chơi hay lui tới |
| Rời đi | NPC ngẫu nhiên không gặp lại trong 30 ngày và độ thân dưới Quen biết | Chuyển nhà, về quê; người đã thân thì ở lại; quay lại hiếm (khoảng 5%), nhớ mang máng nếu ký ức còn |
| Đếm riêng | Người thân, nhân viên công ty (theo số ghế), trẻ dưới 16 | Dùng chung hệ NPC nhưng không chiếm chỗ người ngoài đời |

Với khoảng 40 người, mỗi năm chừng 1 người mất và 1 đến 2 người được sinh ra: đủ cảm giác luân hồi mà không ồn ào.

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

### Trục 5. Giọng

Hai lớp: **vùng** (Tây, Quê, Bắc, Trung, Sài Gòn) rút theo quê của NPC, và **nét riêng** rút từ pool (kể dài, nói nhanh, ngắn gọn, lịch sự, hay than...).

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

- **Thái độ:** Ấm áp, Thẳng thắn, Đùa, Lạnh nhạt, Khó chịu, Né.
- **Hành động:** Giúp, Từ chối, Hỏi thêm, Khuyên, Nhận lời, Kể chuyện mình, Im lặng.

Mục tiêu: không có câu "đúng cho mọi người", người chơi không thể bấm mãi một kiểu (ví dụ suốt ngày Giúp).

| Cơ chế | Nội dung |
|---|---|
| Giúp đỡ có giá | Giúp tốn giờ, tiền hoặc năng lượng thật; giúp mãi thì NPC quen dựa dẫm, nhờ nhiều hơn; vài tính cách lợi dụng |
| Hợp tính cách | Người tự trọng không thích bị thương hại, người Nóng tính quý Thẳng thắn, người Hay khoe thích được trêu; độ hợp quyết định điểm quan hệ |
| Giảm dần khi lặp | Cùng thái độ với cùng NPC trong 7 ngày thì hiệu quả giảm dần (lần 2 còn 60%, lần 3 còn 30%) |
| Trạng thái người chơi | Mệt hoặc căng thẳng cao: Ấm áp tốn thêm năng lượng hoặc hiện mờ, Khó chịu dễ xuất hiện; tâm trạng tốt mở thêm Đùa |
| Lựa chọn tiêu cực có lợi | Từ chối tiết kiệm giờ và tiền; Thẳng thắn có thể làm NPC tôn trọng hơn; Lạnh nhạt cắt bớt người hay nhờ vả |
| Tính cách người chơi | Thái độ chọn nhiều lần tích thành thói quen (cơ chế thói quen tích luỹ đã duyệt); NPC nhận xét theo đó ("dạo này cậu cộc tính") |

Điều kiện khống chế:
- Hành động phải hợp ý định của NPC (NPC Rủ thì có Nhận lời và Từ chối; NPC Than thì có Giúp, Khuyên, Hỏi thêm).
- Lựa chọn cần kỹ năng, tiền hoặc lịch trống mà thiếu thì hiện mờ (quy tắc đã chốt); không lộ hậu quả trước (đã chốt).

Hậu quả: điểm quan hệ theo độ hợp, ghi ký ức nếu đủ trọng số, cộng vào thói quen của người chơi.

## I.4b NPC tương tác với nhau trước mặt người chơi

- **Thứ tự NPC tự mở lời với người chơi:** chuyện đang dở, sinh nhật hoặc dịp đặc biệt, biến cố của họ, chuyện thường ngày; giữ trần 3 lần mỗi ngày (đã chốt).
- **Cảnh nhóm:** khi có từ 2 NPC cùng chỗ, tối đa 1 cảnh mỗi ngày. Họ nói với nhau, nhắc đến nhau, bất đồng hoặc nhờ người chơi phân xử; người chơi chen vào hoặc chỉ đứng nghe. Nghe lỏm là một cách biết tin đồn.
- **Hệ quả:** đứng về phía ai thì người kia giảm thiện cảm một chút; quan hệ giữa các NPC (T63) đổi theo cảnh nhóm.

## I.5 Đời sống NPC (nguồn chủ đề "bản thân")

Mỗi NPC chạy biến cố riêng mỗi ngày, kể cả khi không gặp người chơi.

| Loại | Ví dụ | Điều kiện theo vai |
|---|---|---|
| Tích cực | lên lương, được khen, mua xe, con đỗ, trúng mánh hàng | Lên lương chỉ người đi làm; trúng hàng chỉ người buôn bán |
| Tiêu cực | ốm, mất khách, hỏng xe, cãi nhau, bị trừ lương, mất đồ | Ốm nặng tối đa 1 lần mỗi quý |
| Trung tính | về quê, chuyển chỗ, học thêm, chuẩn bị lễ | Theo lịch và mùa |
| Chuỗi dài | yêu và chia tay, con thi đại học, mở quán | Mỗi NPC tối đa 1 chuỗi dài cùng lúc |

Khoảng 30 loại biến cố cho bản đầu. Mỗi biến cố có tần suất, thời lượng, cảm xúc kéo theo và dữ kiện để điền vào câu (món, nơi, số tiền, ngày tương đối).

## I.5b Sinh hoạt hằng ngày của NPC

Ngoài biến cố, mỗi NPC có nhịp sống riêng, chạy theo giờ game. Sinh hoạt quyết định NPC đang ở đâu, đang làm gì, có rảnh để nói không, và là nguồn chuyện vặt mỗi ngày.

| Thành phần | Nội dung | Ảnh hưởng tới hội thoại |
|---|---|---|
| Lịch ngày | Ngủ, thức, ăn ba bữa, đi làm hoặc bán hàng, việc nhà, nghỉ, giờ rảnh; khác nhau ngày thường và cuối tuần (mở rộng lịch hiện diện `schedule` đang có) | Đang làm việc: câu ngắn, ít Rủ; giờ rảnh: dễ Rủ, dễ trò chuyện lâu; đang ngủ: không nhắn lại tới sáng |
| Hoạt động hiện tại | Đang bán hàng, đang nấu cơm, đang tập thể dục, đang chờ xe buýt... | Thành chủ đề "bản thân" nhỏ ("đang lặt rau nè con"), mở lời theo việc đang làm |
| Thói quen | Mỗi người 2 đến 4 thói quen: hàng xóm về hưu uống trà sáng ở công viên, sinh viên giao hàng chạy đơn tới khuya, người bán rau dậy 4 giờ lấy hàng | Người chơi gặp đúng giờ thì có câu riêng; lệch thói quen (ông hàng xóm không ra công viên) là dấu hiệu có biến cố |
| Mệt và đói của NPC | Thang đơn giản tăng theo giờ làm, giảm khi ăn, ngủ | Cảm xúc Mệt vào cuối ca; NPC đói thì dễ Rủ đi ăn |
| Lịch đặc biệt | Về quê, đi khám, giỗ, đi chơi cuối tuần (gắn với biến cố) | Vắng mặt có lý do, lần sau gặp kể lại |

Lịch dựng theo lớp: khoảng 15 **lịch mẫu** theo vai và tuổi (sinh viên, văn phòng, bán chợ, về hưu...), cộng độ lệch cá nhân và thói quen rút từ pool, khác ngày thường và cuối tuần; biến cố ghi đè lên lịch. Chỉ tính chi tiết cho NPC đang ở chỗ người chơi; biến cố và quan hệ giữa NPC tính gộp theo ngày hoặc tuần, nhẹ cho điện thoại.

Điều kiện khống chế: sinh hoạt tính từ hạt giống theo ngày và NPC (không lưu save); một NPC chỉ ở một nơi một lúc; thay đổi lịch chỉ do biến cố hoặc thời tiết (bão thì ở nhà).

## I.5c Tuổi, sinh nhật và vòng đời NPC

Mọi NPC (cố định và ngẫu nhiên) có **ngày sinh** và già đi đúng theo lịch game. Tuổi quyết định giai đoạn đời, sinh hoạt, biến cố và cách nói.

**Tuổi và giai đoạn**

| Giai đoạn | Tuổi | Ảnh hưởng |
|---|---|---|
| Đi học | dưới 22 | Lịch học, thi cử, xin tiền nhà |
| Đi làm | 22 đến 60 | Lịch làm, lên lương, lập gia đình, có con |
| Về hưu | trên 60 | Lịch thong thả, sức khỏe giảm dần, hay kể chuyện xưa |

- Chuyển giai đoạn đổi lịch sinh hoạt và pool biến cố (sinh viên ra trường thì đi làm).
- Ngày sinh lưu cho mỗi NPC (một số nguyên); tuổi tính từ ngày game, không lưu riêng.

**Sinh nhật**
- Người chơi biết sinh nhật của NPC khi độ thân từ Thân (NPC tự kể hoặc thấy trong hồ sơ); biết rồi thì hiện trong Lịch và bản tin sáng hôm trước.
- Đúng ngày: tặng quà (chọn từ đồ mua được), nhắn chúc, rủ đi ăn. Quà hợp sở thích (rút từ pool sở thích của NPC) được nhiều điểm, ghi ký ức trọng số 4 đến 6. Quên sinh nhật của người Tri kỷ thì giảm nhẹ quan hệ.
- NPC thân cũng nhớ sinh nhật người chơi: Mẹ luôn nhớ, người khác từ Thân mới chúc.

**Vòng đời và luân hồi**
- **Mất đi:** xác suất theo tuổi và sức khỏe, rất thấp trước 70, tăng dần sau đó; có dấu hiệu trước (ốm nhiều, ít ra ngoài, gặp người chơi kể chuyện cũ). Không ai mất đột ngột khi đang trong chuỗi chuyện dở.
- **Khi mất:** sự kiện báo tin nhẹ nhàng, đám tang hoặc giỗ đầu (người chơi có thể đến viếng), ký ức với người đó giữ ở Nhật ký. Không mô tả chi tiết gây nặng nề.
- **Nối tiếp:** nếu NPC có con cháu (rút khi sinh NPC, theo tuổi và hoàn cảnh) thì người nối tiếp có thể kế vai trò: con Bà Tư làm chủ trọ, cháu Cô Hạnh bán tiếp sạp rau. Người nối tiếp là NPC mới, tính cách rút từ pool nhưng mang vài nét của cha mẹ, nhớ mang máng người chơi qua lời kể ("mẹ con hay nhắc anh").
- **Không có người nối tiếp:** vai trò để trống một thời gian rồi NPC mới từ pool đến thay (chủ trọ mới, người bán khác).
- **Sinh ra và lớn lên:** NPC lập gia đình có thể có con; trẻ con lớn theo lịch, sau nhiều năm game có thể thành NPC ngẫu nhiên có câu chuyện riêng.
- Vòng đời áp dụng cho cả dàn cố định, trừ Mẹ chỉ được già đi và yếu dần, mạch chuyện riêng về Mẹ do chủ dự án duyệt sau.
- Giới hạn ở I.1c vẫn giữ: người mất hoặc rời đi thì giải phóng chỗ cho người mới.

**Lưu gì:** ngày sinh, cha mẹ hoặc người nối tiếp (mã NPC), trạng thái còn hay đã mất. Khoảng vài chục byte mỗi người.

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
| 1 | Bộ ghép, sinh dàn NPC theo vai, đời sống NPC; Mẹ, em, chủ trọ, 1 đồng nghiệp, bán rau, sinh viên giao hàng | khoảng 500 |
| 2 | Các vai còn lại, hội thoại nhiều lượt, tự mở lời theo chủ đề, cảnh nhóm | khoảng 600 |
| 3 | NPC ngẫu nhiên có chuyện riêng, nhóm chat, tin đồn | khoảng 400 |

Mỗi lô: chủ dự án duyệt 20 đến 30 câu mẫu trước, Claude viết hàng loạt, bộ kiểm tra chạy, in khoảng 200 câu để đọc lướt, rồi mới gộp.

## I.9 Chỉ tiêu đo bằng mô phỏng (30 ngày, 30 seed)

- Ít nhất 90% câu NPC không trùng nguyên văn.
- 0 câu nhắc dữ kiện sai (kiểm bằng điều kiện của từng mảnh).
- Mỗi NPC thường gặp xuất hiện ít nhất 6 trong 8 ý định mỗi tháng.
- Ít nhất 30% câu nhắc tới trạng thái người chơi hoặc biến cố thật (mục 30 kế hoạch).

## I.10 Đã chốt (05/11) và còn mở

Đã chốt: không dùng AI sinh câu; pool ngẫu nhiên có điều kiện là nguyên tắc chính; 12 vai cố định với con người ngẫu nhiên; người thân là Mẹ và 1 em (bố để sau); chân dung ghép từ mảnh; số NPC theo I.1d; tuổi, sinh nhật, vòng đời theo I.5c; chỉ lưu ký ức đáng nhớ, NPC biết quên (T.5).

Còn mở, duyệt khi review tài liệu này: giá trị và hồi chiêu ở bảng trục 1, 2, 6; mốc riêng tư theo độ thân; bộ thái độ và hành động của người chơi (I.4); tỷ lệ giảm dần khi lặp.

---

# Phần triển khai

## T.1 Mô-đun mới và chỗ nối với code hiện có

| Tệp | Việc | Nối với |
|---|---|---|
| `domain/talk/facts.ts` | Gom **dữ kiện** từ trạng thái game thành danh sách `Fact` (món vừa ăn, thời tiết, lên bậc, nợ, biến cố NPC...) kèm ai được biết | Nhật ký (`journal`), `life`, `office`, `weather`, `bank`, `npcLife` |
| `domain/talk/npc-life.ts` | Chạy biến cố đời NPC mỗi ngày, giữ cảm xúc ngày của NPC | `settleLifeDay` (cùng chỗ `settleStaff`, `settleBank`) |
| `domain/talk/axes.ts` | Sáu trục: hàm `allowed...()` trả về giá trị qua điều kiện khống chế, và trọng số | `social` (độ thân), `VOICE`, lịch hiện diện NPC |
| `domain/talk/compose.ts` | Chọn khung, lọc mảnh, ghép câu, điền biến, ghi vân tay | `story.heard` (đổi thành vân tay mảnh) |
| `domain/talk/replies.ts` | Sinh 3 đến 4 lựa chọn trả lời cho người chơi và tính hậu quả | `answerEvent`, `replyMessage` |
| `data/talk/*.json` | Kho khung và mảnh, mỗi tệp một nhóm (chung, theo vùng, theo NPC) | Đọc lúc build, kiểm bằng `npm run talk:check` |
| `scripts/talk-check.cjs`, `scripts/sim-talk.cjs` | Bộ kiểm tra dữ liệu và mô phỏng 30 ngày | Giống `pool:check`, `sim:npc` |

Code cũ: `director.ts` giữ vai **điều phối** (ai nói, khi nào, mô-típ có lựa chọn và hậu quả lớn như cho mượn tiền). Câu chữ trong mô-típ và mọi câu trò chuyện thường chuyển sang `compose.ts`. `lines.ts` và mẫu tin trong `inbox.ts` được chuyển dần thành mảnh trong `data/talk/`.

## T.2 Kiểu dữ liệu

```ts
type Intent='brag'|'complain'|'ask'|'invite'|'request'|'news'|'tease'|'apologize';
type TopicGroup='self'|'player'|'other'|'world';
type Emotion='happy'|'excited'|'neutral'|'tired'|'sad'|'annoyed';
type Tier='hostile'|'stranger'|'acquaint'|'close'|'bestie';   // Bất hoà ... Tri kỷ
type Channel='face'|'text'|'call';

interface Fact{ id:string; topic:TopicGroup; sub:string;        // 'food','rain','promotion','debt','sick'...
  about:string;                // 'player' | id NPC | 'world'
  day:number; tone:'good'|'bad'|'plain'; private:0|1|2|3;
  knownBy:'all'|'present'|string[];  // ai được biết: mọi người, người có mặt hôm đó, hoặc danh sách NPC
  vars:Record<string,string|number> } // {món:'cơm tấm', nơi:'chợ', tiền:200000}

interface Frame{ id:string; intent:Intent; slots:Slot[]; channel?:Channel[] }   // ví dụ ['open','body','feel','tail']
interface Piece{ id:string; slot:Slot; text:string;               // "Trời {thời tiết} vầy {tôi} lười ra chợ quá"
  intent?:Intent[]; topic?:string[]; emotion?:Emotion[];
  minTier?:Tier; privacy?:0|1|2|3; voice?:Voice; npc?:string;     // npc: mảnh riêng của một người
  needs?:string[];             // biến phải có trong Fact, thiếu thì loại
  where?:PlaceId[]; when?:('morning'|'noon'|'evening'|'late')[]; weight?:number }

interface NpcDay{ mood:Emotion; events:NpcEvent[] }               // trạng thái NPC trong ngày
interface NpcEvent{ id:string; kind:string; start:number; end:number; tone:'good'|'bad'|'plain'; vars:Record<string,string|number> }
```

## T.3 Thuật toán ghép một câu

```
say(state, npc, channel):
  ctx   = bối cảnh(giờ, nơi, kênh)                      // trục 6, loại nếu không được nói
  tier  = độ thân(npc); voice = giọng(npc)               // trục 4, 5
  mood  = npcDay(npc).mood                               // trục 3
  facts = facts(state).filter(f => npc được biết f && f.private <= riêngTư(tier))
  intents = INTENTS.filter(i => điềuKiện[i](npc, facts, tier, mood, hồiChiêu))   // trục 1
  for intent in xếpTheoTrọngSố(intents, seed):
    fact = chọn(facts hợp intent và bảng tương thích)    // trục 2
    frame = chọn(FRAMES[intent] hợp channel, chưa dùng 3 ngày)
    text = []
    for slot in frame.slots:
      p = chọn(PIECES[slot] lọc: intent, topic=fact.sub, emotion∋mood, tier>=minTier,
               voice∈{npc, vùng, chung}, needs ⊆ fact.vars, where, when, chưa dùng 14 ngày với npc)
      if !p and slot bắt buộc: thử frame khác
      text.push(điền(p.text, fact.vars, xưng hô(npc, tier)))
    ghi vân tay(npc, frame, các mảnh, intent+topic); return {text, intent, fact}
  return câu chào ngắn theo giọng
```

Ghép có hạt giống (seed) theo ngày và NPC nên tải lại save không đổi câu (giống `chooseLine` hiện tại).

## T.4 Ví dụ dữ liệu (thật, sẽ dùng ở Lô 1)

**Mẹ (giọng quê), ý định Hỏi, chủ đề người chơi, sub `food`:**

| Ô | Mảnh (một số) | Điều kiện |
|---|---|---|
| open | "Con ơi" / "Mẹ hỏi chút nghe" / "Ăn chưa con" | chung |
| body | "trưa nay con ăn {món} hả" / "dạo này toàn ăn ngoài phải không" | `needs:['món']` / cần Fact 3 ngày ăn ngoài |
| feel | "mẹ thấy lo lo" / "nghe cũng yên bụng" | emotion `sad` / `happy` |
| tail | "nhớ ăn rau nghe con" / "rảnh nấu cơm mà ăn cho đỡ tốn" | chung / cần Fact tiền thấp |

Câu ghép ra ví dụ: "Con ơi, trưa nay con ăn cơm tấm hả, nhớ ăn rau nghe con." hay "Mẹ hỏi chút nghe, dạo này toàn ăn ngoài phải không, mẹ thấy lo lo, rảnh nấu cơm mà ăn cho đỡ tốn."

**Chủ trọ (ví dụ đời này rút ra một bà cụ giọng Tây), ý định Than, chủ đề bản thân, biến cố `sick` (đau lưng):**
- open: "Ui da" / "Con nè" ; body: "cái lưng bà nó hành từ {khi nào}" / "trời {thời tiết} vầy là bà nhức mình mẩy" (`needs:['thời tiết']`, chỉ khi mưa hoặc lạnh) ; tail: "già rồi con ơi" / "con có rảnh xách giùm bà bao gạo hông" (chỉ khi được Nhờ, độ thân từ Quen biết).

**Lựa chọn của người chơi khi Bà Tư Than:** Đồng cảm Ấm áp ("Bà nghỉ ngơi đi, để con phụ"), Khuyên Thật lòng ("Bà đi khám ở bệnh viện thử", cần Giao tiếp Lv 2), Hỏi thêm Ngắn gọn ("Đau lâu chưa bà?"), Né ("Con đang vội, chút con ghé"). Bà Tư tính Hay giúp đỡ nên Ấm áp được điểm cao nhất; Né trừ nhẹ và ghi ký ức "bận không hỏi han".

## T.5 Lưu gì và NPC quên ra sao

Nguyên tắc: **chỉ lưu chuyện đáng nhớ**, phần còn lại tính lại hoặc để NPC quên.

| Thứ | Lưu? | Cách giữ |
|---|---|---|
| Câu đã nói, khung, mảnh | Không lưu nguyên văn | Chỉ lưu **vân tay ngắn** (mã băm) của 14 ngày gần nhất để chống lặp, tối đa khoảng 40 mã mỗi NPC; quá hạn thì xoá |
| Dữ kiện (`Fact`) | Không | Tính lại từ trạng thái game mỗi lần cần |
| Sinh hoạt NPC | Không | Tính từ hạt giống theo ngày |
| Biến cố đời NPC | Chỉ biến cố đang diễn ra và chuỗi dài | Xong thì chuyển thành ký ức nếu đủ nặng, không thì bỏ |
| Ký ức | Chỉ ký ức có **trọng số cao** | Xem quy tắc quên bên dưới |

**Trọng số ký ức** (1 đến 10, dùng `Memory.weight` đang có): chào hỏi, trò chuyện thường 1 đến 2 (không lưu); hỏi han khi NPC ốm, đi ăn cùng 3 đến 4; giúp đỡ, cho mượn tiền, lỡ hẹn quan trọng 5 đến 7; cứu giúp lúc khó, phản bội, quỵt tiền 8 đến 10.

**NPC quên:**
- Chỉ lưu ký ức từ trọng số 3.
- Mỗi ký ức mờ dần: sau mỗi 30 ngày không ai nhắc lại thì trọng số giảm 1; về dưới 3 thì xoá.
- Mỗi lần NPC nhắc lại hoặc người chơi làm việc liên quan thì trọng số tăng 1 (tối đa 10), nên chuyện hay được nhắc thì nhớ lâu.
- Từ 8 trở lên giảm chậm gấp đôi (chuyện lớn nhớ rất lâu).
- Tính cách ảnh hưởng: người Hay giúp đỡ quên lỗi nhanh hơn, người Nóng tính nhớ lỗi lâu hơn.
- Mỗi NPC giữ tối đa 12 ký ức; đầy thì bỏ ký ức nhẹ nhất.

Như vậy save chỉ thêm khoảng vài KB cho 12 NPC. Lát cắt mới tuỳ chọn, có validator nối vào `engine.ts`; save cũ không có thì tạo mặc định (theo quy tắc bảo vệ save 0.75.3).

## T.6 Chia ticket

| Ticket | Nội dung | Phụ thuộc | Nghiệm thu |
|---|---|---|---|
| H0 | Sinh dàn NPC theo vai từ pool (12 vai, người thân, chân dung chữ cái tạm), chuyển mạch chuyện cũ thành mạch mẫu theo vai | | Hai seed khác nhau ra hai dàn khác nhau; save cũ vẫn mở được |
| H1 | Kiểu dữ liệu, `compose.ts`, `talk:check`, 3 khung mỗi ý định | | Bộ kiểm tra chặn mảnh lỗi; ghép được câu từ dữ liệu mẫu |
| H2 | `facts.ts`: 25 loại dữ kiện từ Nhật ký và chỉ số, quy tắc ai được biết | H1 | Test: NPC không nhắc điều không thấy |
| H3 | `npc-life.ts`: sinh hoạt hằng ngày (lịch, hoạt động, thói quen, mệt và đói), 30 loại biến cố, cảm xúc ngày, ký ức có trọng số và quên | H1 | Mô phỏng: mỗi NPC 2 đến 5 biến cố mỗi tháng; save thêm không quá 5 KB sau 1 năm |
| H4 | `replies.ts`: lựa chọn của người chơi, hậu quả theo tính cách, ghi ký ức | H1 | Mỗi lượt 3 đến 4 lựa chọn, không lặp bộ trong 7 ngày |
| H5 | Lô 1 dữ liệu: Mẹ, Bà Tư, Minh An, Cô Hạnh, Tuấn (khoảng 500 mảnh); nối tin nhắn Mẹ và trò chuyện | H1 đến H4 | Bạn duyệt 30 câu mẫu trước; `sim:talk` đạt chỉ tiêu I.9 cho 5 người này |
| H6 | Lô 2: 7 NPC còn lại, hội thoại 2 đến 4 lượt, người chơi tự mở lời theo chủ đề | H5 | Như H5 cho cả 12 người |
| H7b | Tuổi, sinh nhật, vòng đời và người nối tiếp (I.5c) | H3 | Mô phỏng 20 năm: vai trò không bị trống quá 30 ngày; tuổi và lịch đúng |
| H7 | Lô 3: NPC ngẫu nhiên có chuyện riêng (giới hạn I.1c), nhóm chat, tin đồn (gộp T63) | H6 | Người lạ gặp lại nhớ lần trước; không quá 12 NPC ngẫu nhiên cùng lúc |
| H8 | `sim-talk.cjs` và chỉ tiêu trong CI ngắn | H1 | Chạy được 30 ngày x 30 seed |

Thứ tự: H0, H1, H2, H3, H4 (khung chạy được, chưa nhiều chữ), rồi H5 (đổ dữ liệu), H8 đi kèm H5. Mỗi ticket một PR, tăng phiên bản.

## T.7 Rủi ro

- **Câu ghép gượng:** khung giới hạn mảnh theo chức năng, mảnh có nhãn đứng đầu hoặc cần chủ ngữ; đọc 200 câu mẫu mỗi lô.
- **Hiệu năng trên điện thoại:** kho mảnh được lập chỉ mục theo (ý định, ô) lúc build; mỗi câu chỉ duyệt vài chục mảnh.
- **Dung lượng:** khoảng 1.500 mảnh nặng chừng 150 đến 250 KB JSON, tách theo lô và tải khi cần.
