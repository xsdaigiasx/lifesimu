# Phần C — Hệ thống nội dung: pool, mô-típ, quan hệ và ký ức

Phần này **thay thế mục 17 (Phần B) khi hai bên mâu thuẫn**, và điều chỉnh các ticket T16–T18 ở Phần A. Mọi con số là **đề xuất**.

## 21. Nguyên tắc nội dung

- Nội dung là **dữ liệu cộng khuôn**, không viết kịch bản rời cho từng người. Số lượng NPC không quan trọng; quan trọng là pool thuộc tính, mô-típ và bộ nhớ.
- Ba yêu cầu cốt lõi: (1) NPC sinh từ pool theo điều kiện xuất thân, tuổi, nghề; (2) quan hệ càng thân thì mở sự kiện càng sâu; (3) NPC **nhớ nội dung** đã xảy ra và có thể viết tiếp ở lần gặp sau.
- "1000 sự kiện" được hiểu là **hơn 1000 thể hiện khác nhau về quyết định và hậu quả**, không phải 1000 kịch bản viết tay.

## 22. Pool thuộc tính

Mỗi mục trong pool có **tag**, và điều kiện của mô-típ chọn theo tag.

| Pool | Nội dung | Ràng buộc và ghi chú |
| --- | --- | --- |
| Tên | Họ, tên đệm, tên theo vùng và giới | Khoảng 300 tên ban đầu |
| Xuất thân và quê | Vùng, giọng, món ăn, phong tục, nghề thường gặp | Kéo theo từ vựng và chủ đề trò chuyện |
| Nhóm tuổi | 18–25, 26–35, 36–50, 51–65, 66 trở lên | Kéo theo nghề, gia cảnh, nhu cầu |
| Nghề và cấp bậc | Đồng nghiệp, chủ trọ, tiểu thương, khách hàng… | Tuổi phải hợp cấp bậc (ví dụ trưởng phòng từ khoảng 30 tuổi) |
| Hoàn cảnh | Nợ, con nhỏ, ở trọ, về hưu, nuôi bố mẹ, khởi nghiệp | Quyết định nhu cầu tiền, thời gian |
| Tính cách | 3–4 nét mỗi người | Có cặp xung khắc (keo kiệt và hào phóng không đi cùng nhau) |
| Điểm nhấn (quirk) | Thói quen hoặc chi tiết nhớ được | Khoảng 60 mục; mỗi người 1–2 mục |
| Mục tiêu và nỗi lo | Muốn gì, sợ gì | Nguồn của các sự kiện sâu |
| Ngoại hình | Lớp sprite | Dùng chung thân, đổi tóc, màu, áo |

## 23. Bộ sinh NPC và hồ sơ

**Hồ sơ NPC** (lưu trong save): id, tên, tuổi, quê, nghề, hoàn cảnh, tính cách, điểm nhấn, mục tiêu, nỗi lo, giọng, lịch hiện diện, điểm quan hệ và bậc, danh sách ký ức, các chuỗi đã mở, seed sinh.

**Quy tắc sinh:** rút từ pool bằng seed, kiểm ràng buộc (tuổi và nghề, xuất thân và giọng, tính cách không tự mâu thuẫn), rồi ghi cố định. Cùng seed cho cùng người.

**Hai tầng NPC:**

- **Dàn cố định (khoảng 12 người):** viết tay có chiều sâu, có chuỗi quan hệ riêng.
- **NPC từ pool:** đóng vai phụ (hàng xóm, khách, đồng nghiệp ít gặp). Được **nâng lên người quen** khi gặp từ khoảng 3 lần hoặc quan hệ đạt ngưỡng: có lịch cố định và được mở chuỗi quan hệ.
- Giới hạn số NPC từ pool đang hoạt động cùng lúc (khoảng 30) để không loãng và không nặng.

### 23.1 Dàn cố định 12 NPC (đề xuất 04/11, chờ duyệt)

| NPC | Tuổi, quê | Vai, nơi gặp | Tính cách | Điểm nhấn | Mục tiêu / nỗi lo | Giọng |
| --- | --- | --- | --- | --- | --- | --- |
| Bà Tư | 62, Bến Tre | Chủ trọ; khu trọ sáng sớm và tối | Kỹ tính, tốt bụng ngầm, hay càm ràm | Tưới cây lúc 6 giờ, nhớ ngày thu tiền từng phòng | Giữ khu trọ yên ổn / con trai ở xa ít về | Miền Tây, gọi "con" |
| Minh An | 26, Nam Định | Đồng nghiệp lập trình; văn phòng | Hay nói, nhiệt tình, hơi vội | Luôn có kẹo trong ngăn bàn | Lên Senior trong hai năm / sợ bị tụt lại | Miền Bắc, xưng "mình" |
| Thảo Linh | 24, Huế | Thiết kế giao diện; văn phòng, quán vỉa hè buổi trưa | Nhẹ nhàng, cầu toàn, ngại xung đột | Vẽ nguệch ngoạc khi nghe họp | Mở studio nhỏ / sợ làm người khác thất vọng | Huế nhẹ, "răng, rứa" khi vui |
| Gia Huy | 29, Sài Gòn | Kiểm thử; văn phòng, công viên chạy bộ tối | Thẳng thắn, hay đùa, dễ cáu khi bị đổ lỗi | Đếm lỗi như sưu tầm | Được ghi nhận / mẹ đang bệnh | Sài Gòn, "nha", "á" |
| Thu Trang | 33, Hà Nội | Trưởng nhóm điều phối; văn phòng | Nghiêm, công bằng, ít khen | Sổ tay giấy, không dùng ứng dụng | Đưa nhóm qua dự án lớn / con nhỏ hay ốm | Miền Bắc gọn, xưng "chị" |
| Cô Hạnh | 48, Quảng Ngãi | Bán rau ở chợ; chợ buổi sáng | Nhanh nhảu, rộng rãi, hay mặc cả | Cho thêm hành lá cho khách quen | Nuôi con học đại học / nợ vốn đầu mùa | Quảng Ngãi, "tui", "rứa" |
| Chú Sáu | 67, Cần Thơ | Hàng xóm về hưu; công viên sáng sớm, khu trọ | Chậm rãi, hoài cổ, tự trọng cao | Mang theo radio nhỏ | Được người khác cần đến / sợ cô đơn | Miền Tây, kể chuyện dài |
| Tuấn | 22, Thanh Hoá | Phòng bên cạnh, sinh viên chạy giao hàng; khu trọ, bến xe | Lạc quan, liều, hay quên | Xe máy cũ đặt tên "Chiến Mã" | Tốt nghiệp đúng hạn / nợ học phí | Thanh Hoá, nói nhanh |
| Chị Mai | 35, Quảng Nam | Bán bánh mì vỉa hè; quán vỉa hè sáng và trưa | Chịu khó, kiệm lời, giữ chữ tín | Nhớ khách thích ăn gì | Mở quán có mái che / một mình nuôi con | Quảng Nam, ngắn gọn |
| Bác sĩ Quân | 41, Hải Phòng | Bác sĩ; bệnh viện giờ hành chính | Điềm đạm, thực tế, hơi khô | Nhắc uống nước trong mọi câu chuyện | Giảm ca trực / bận đến mức xa gia đình | Miền Bắc chừng mực |
| Bảo Ngọc | 27, Đà Lạt | Giao dịch viên ngân hàng; ngân hàng giờ hành chính | Tham vọng, chu đáo, thích số liệu | Cắm hoa tươi ở quầy | Lên chuyên viên tín dụng / khách nợ xấu | Đà Lạt, lịch sự |
| Mẹ | 50, quê nhà | Chỉ gọi điện và nhắn tin | Lo xa, thương con, giấu chuyện khó | Gửi đồ quê qua xe khách | Con ổn định / ruộng mất mùa | Quê, gọi "Lâm ơi" |

### 23.2 Gặp NPC ở đâu và như thế nào (đề xuất 04/11)

- **Lịch hiện diện:** mỗi NPC có lịch theo thứ và giờ tại các địa điểm đã có (văn phòng, khu trọ, chợ, công viên, quán vỉa hè, nhà hàng, bến xe, bệnh viện, ngân hàng, trung tâm thương mại, Hồ Sen). Có lệch nhỏ theo seed để không máy móc. Chỉ gặp trực tiếp khi cùng nơi, cùng giờ.
- **Đến một địa điểm:** thẻ địa điểm hiện hàng "Ở đây lúc này" gồm vòng tròn tên những người đang có mặt. Chạm vào người nào thì mở bảng hành động (Chào hỏi, Trò chuyện, Rủ đi ăn, Nhờ giúp, Tặng quà) và khung thoại mục 17.8.
- **NPC chủ động:** khi đến nơi hoặc sau một hành động (mua rau, nộp tiền, khám bệnh), bộ điều phối có thể chọn một mô-típ; NPC bắt chuyện bằng khung thoại. Tối đa khoảng 3 sự kiện mỗi ngày.
- **Gắn với dịch vụ sẵn có:** mua ở chợ thì gặp Cô Hạnh, gửi tiền ở ngân hàng gặp Bảo Ngọc, khám bệnh gặp Bác sĩ Quân, về trọ gặp Bà Tư hoặc Tuấn. Gặp người không tốn thêm thao tác.
- **Văn phòng:** điểm chạm trên ảnh tĩnh như hiện tại; người không có trong ảnh hiện ở hàng "Ở đây lúc này".
- **Từ xa:** Mẹ và người đã thân nhắn tin, gọi điện qua điện thoại (T20).

* **Chợ chia quầy (chốt 04/11):** Quầy rau (Cô Hạnh: rau củ, đậu phụ), Quầy thịt cá (Chú Lực: thịt heo, cá), Tạp hoá (Bà Năm: gạo, trứng). Chú Lực và Bà Năm là vai phụ. Vào quầy thì nói chuyện với người bán ở đầu màn, mua hàng ở lưới bên dưới. Ngân hàng, bệnh viện làm theo cách tương tự, chi tiết chốt sau.

### 23.3 Quy mô bản chơi thử (chốt 04/11)

Làm nhỏ trước để chơi sớm: viết đủ hồ sơ 12 người, nhưng chỉ 6 người có chuỗi sự kiện (Bà Tư, Minh An, Thu Trang, Cô Hạnh, Chú Sáu, Mẹ); pool khoảng 40 tên và 10 điểm nhấn; 8 mô-típ (Hỏi thăm, Nhờ giúp, Gặp lại và trả ơn, Rủ ăn, Chuyện riêng, Mượn tiền, Dạy công thức, Tin nhắn của Mẹ) cộng 8 điểm rẽ giữa ca của T15. Mở rộng theo mục "Để dành phát triển sau" ở cuối tài liệu.

## 24. Quan hệ và bậc thân thiết

Điểm quan hệ từ −100 đến +100 theo từng NPC.

| Bậc | Điểm | Loại sự kiện mở ra |
| --- | --- | --- |
| Xa lạ | dưới 10 | Chào hỏi, nhờ việc nhỏ, hỏi đường |
| Quen biết | 10–29 | Rủ ăn, xin giúp vừa, kể chuyện thường ngày |
| Thân | 30–59 | Chuyện riêng, nhờ vả lớn, dạy công thức, giới thiệu việc |
| Tri kỷ | 60–100 | Chuyện thầm kín, hy sinh, ảnh hưởng dài hạn (cho vay, đồng hành lập nghiệp) |
| Bất hoà | dưới −30 | Track riêng: cãi vã, hoà giải hoặc cắt đứt |

- Điểm tăng theo hành động và lựa chọn, có **trần mỗi ngày** (ví dụ +5 mỗi NPC) để không cày.
- Không gặp lâu thì hao nhẹ (ví dụ −1 mỗi 7 ngày), có **sàn theo bậc đã đạt** để không tụt đột ngột.
- **Mở khoá không chỉ theo điểm.** Sự kiện sâu còn cần điều kiện chuyện: đã xảy ra sự kiện nào, đã có ký ức nào, cờ nào. Quan hệ cao nhưng chưa từng cùng trải qua chuyện thì chưa mở được chuyện thầm kín.
- **Ưu đãi theo thân thiết với người bán (chốt 04/11, làm ở T40):** Quen biết thỉnh thoảng được thêm hành, thêm rau; Thân giảm 5%; Tri kỷ giảm 10% và đôi khi được để dành hàng tươi. Áp cho người bán ở chợ, quán vỉa hè; ngân hàng và bệnh viện cân nhắc sau cho hợp (ví dụ lãi suất, khám ưu tiên).

## 25. Ký ức và chuỗi tiếp nối

### 25.1 Bản ghi ký ức

Mỗi lần một sự kiện xảy ra, hệ thống ghi **dữ kiện có cấu trúc**, không lưu câu văn:

```
Memory {
  id, npcId, instanceId, motifId,
  facts: { chuDe, mucGiup, noi, ngay, ketQua, ... },
  camXuc, trongLuong (1-5), hanNho (ngay), daNhacLai, hooks[]
}
```

Lời thoại về sau được **sinh lại từ dữ kiện**, nên không mâu thuẫn và đổi giọng theo từng NPC.

### 25.2 Mầm tiếp nối (hooks)

Khi kết thúc, sự kiện ghi các hook: mô-típ tiếp theo, khoảng ngày (ví dụ 3–15), điều kiện (gặp lại NPC, bậc quan hệ, kết quả trước), xác suất.

### 25.3 Ví dụ ông già

1. **Sự kiện đầu:** mô-típ Nhờ giúp, người nhờ là NPC từ pool, nhóm tuổi 66 trở lên, việc là xách đồ lên cầu thang. Người chơi chọn giúp hết, giúp một phần, từ chối, hoặc né.
2. **Ghi ký ức:** chủ đề giúp xách đồ, mức giúp, nơi, ngày, trọng lượng.
3. **Gặp lại sau vài ngày (hook):** ông chào và nhắc lại đúng việc đã xảy ra, câu nói ghép từ dữ kiện. Nếu người chơi đã từ chối, ông nhớ và thái độ khác.
4. **Khi đã Quen biết:** ông mời trà, kể chuyện quê, mở chuỗi riêng.
5. **Khi đã Thân:** nhờ việc lớn hơn, tặng món, hoặc giới thiệu một người có việc cho bạn. Kết quả trả ơn ảnh hưởng thật tới game.

### 25.4 Quy tắc nhắc lại

- Mỗi lần gặp tối đa **một** lần nhắc ký ức; chọn ký ức có trọng lượng cao nhất và chưa nhắc gần đây.
- Ký ức nhẹ mờ dần theo hạn nhớ; ký ức nặng (từ 4 trở lên) không quên.
- NPC **chỉ nhắc điều có trong sổ ký ức**; không biết điều người chơi làm khi họ không có mặt, trừ khi có kênh truyền tin hoặc tin đồn được ghi rõ.
- Ký ức mà người chơi đã chứng kiến có thể hiển thị trong Nhật ký; không lộ nội dung chưa kích hoạt.

## 26. Mô-típ: cấu trúc

```
Motif {
  id, ten, loai (doiThuong | quanHe | tinhHuong | moc),
  vai: [{ ten, yeuCau: { tuoi, tag, nhuCau, bacQuanHe, nghe }, uuTien }],
  dieuKien: { gio, noi, trangThaiNguoiChoi, chuong, kyUcCan, co },
  bienThe: [{ truc, giaTri[], tacDong }],
  buoc: [{ y_dinh_loi, lua_chon: [{ tagThaiDo, dieuKien, hauQua }] }],
  hauQua: { quanHe, tien, thoiGian, theTrang, kyUc, hooks },
  cooldown, motLan, toiDaMoiNgay, bacQuanHeToiThieu
}
```

**Quy tắc biến thể:** mỗi mô-típ có ít nhất 3 trục biến thể, trong đó ít nhất 2 trục **đổi quyết định hoặc hậu quả** (cái giá, rủi ro, mức quan hệ, thời gian). Biến thể chỉ đổi tên hoặc câu chào không tính.

**Dấu vân tay chống lặp:** băm (mô-típ, vai chính, giá trị biến thể) và chặn lặp trong N ngày; thêm độ gần đây theo loại mô-típ.

## 27. Ghép lời thoại

- Thư viện câu theo (ý định × giọng × bậc quan hệ × slot).
- Giọng lấy từ tính cách, xuất thân và tuổi.
- Không lặp câu trong 10 lần gần nhất; ưu tiên câu khớp xuất thân.
- **Câu nhắc lại (callback)** là một nhóm riêng, dùng dữ kiện từ ký ức.
- AI chỉ soạn nháp câu trong giai đoạn sản xuất; game dùng thư viện đã được duyệt.

## 28. Bốn mô-típ mẫu

| Mô-típ | Vai và điều kiện | Biến thể | Lựa chọn chính | Hậu quả và hook |
| --- | --- | --- | --- | --- |
| Nhờ giúp | Người nhờ thiếu tiền, thời gian hoặc kiến thức; bậc từ Xa lạ | Thứ nhờ (mượn tiền, đổi ca, nấu hộ, xách đồ), mức độ, giờ, xuất thân | Giúp hết, giúp một phần, từ chối nhẹ, né | Quan hệ, tiền, thời gian, ký ức; hook trả ơn sau 3–15 ngày |
| Gặp lại, trả ơn | Có ký ức Nhờ giúp, gặp lại tại nơi quen | Lời cảm ơn, quà, lời mời, giận dỗi nếu từng từ chối | Nhận, khiêm tốn, từ chối quà | Tăng bậc, mở chuỗi riêng hoặc đóng chuỗi |
| Chuyện riêng | Bậc Thân, đã có ký ức chung | Nỗi lo (tiền, gia đình, công việc), mức nghiêm trọng | Lắng nghe, khuyên, đùa, đổi chủ đề | Mở chuỗi sâu, ghi nỗi lo vào hồ sơ |
| Mượn tiền | Bậc Quen biết trở lên, người nhờ đang thiếu tiền | Số tiền, lý do, hạn trả, tính cách người vay | Cho đủ, cho một phần, từ chối, cho kèm điều kiện | Có thể trả hoặc không; ghi ký ức; hook đòi hoặc trả nợ |

## 29. Khối lượng và sản xuất theo lô

| Giai đoạn | Mô-típ | Pool | Dàn cố định | Thể hiện khác nhau |
| --- | --- | --- | --- | --- |
| Basic 1.0 | 25–30 | khoảng 150 tên, 30 điểm nhấn | 12 (nhẹ) | 150–200 |
| Bản đầy đủ | 80–100 | khoảng 300 tên, 60 điểm nhấn | 12 (sâu) | 600 trở lên |
| Mở rộng | Thêm theo dữ liệu chơi thật | Mở rộng | Thêm theo cốt truyện | 1000 trở lên |

**Quy trình mỗi lô:** đặc tả lô (mô-típ, pool cần thêm) → AI soạn nháp kèm hồ sơ giọng và quy tắc → bộ kiểm tra tự động → người duyệt → mô phỏng in ra khoảng 200 thể hiện để đọc lướt → đo độ lặp → sửa.

## 30. Kiểm tra ràng buộc và chống nhàm

**Bộ kiểm tra tự động:** tuổi và nghề hợp lý, tính cách không xung khắc, điều kiện có thể xảy ra, hậu quả không vượt trần, mọi hook có đích, ký ức tham chiếu có thật, không tiết lộ nội dung chưa mở khoá, độ dài câu hợp lý.

**Chỉ tiêu qua mô phỏng 12 tháng** (đề xuất):

- Cùng mô-típ cùng NPC không lặp trong vòng 14 ngày.
- Ít nhất khoảng 30% sự kiện phản ứng với trạng thái người chơi (tiền, thể trạng, quan hệ, ký ức).
- Có callback ít nhất mỗi 5 ngày chơi.
- Phân bố bậc quan hệ hợp lý, không dồn hết vào Xa lạ.
- Không NPC nào xuất hiện quá nhiều so với phần còn lại.

## 31. Tác động lên kế hoạch

Đã chỉnh T16–T18 ở Phần A; thêm các ticket sau (làm sau T17):

| ID | Việc | Cỡ | Phụ thuộc | Nghiệm thu chính |
| --- | --- | --- | --- | --- |
| T40 | Quan hệ theo bậc, trần mỗi ngày, hao mòn có sàn, mở khoá theo điều kiện chuyện | M | T17 | Bậc mở đúng loại sự kiện; không cày điểm |
| T41 | Ký ức có cấu trúc, hook tiếp nối, quy tắc nhắc lại | L | T17, T18 | Ví dụ ông già chạy đủ 5 bước; mỗi lần gặp tối đa một callback |
| T42 | Công cụ nhập dữ liệu pool và mô-típ từ file, kèm bộ kiểm tra | M | T01 | Dữ liệu sai bị chặn; in 200 thể hiện mẫu |
| T43 | Mô phỏng 12 tháng đo độ lặp và phân bố quan hệ | M | T40, T41, T05 | Đạt các chỉ tiêu mục 30 |

