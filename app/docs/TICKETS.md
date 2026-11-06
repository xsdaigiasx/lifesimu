# Tiến độ ticket so với Kế hoạch

Bảng cập nhật lần cuối 05/11/2026 (app 0.75.3, Kế hoạch bản rev 65); app hiện 0.87.0, các việc H0 đến H7a làm sau mốc đó xem `HANDOVER.md`. Sửa bảng này mỗi khi gộp PR của một ticket.

Xong 52, một phần 9, còn lại chưa làm, bỏ hoặc hoãn. Cột Tệp chỉ tệp trong `docs/plan/` có bảng ticket đó.

## Thứ tự ưu tiên (đề xuất 05/11)

Nguyên tắc: làm nốt ticket đang dở trước, rồi tới phần còn thiếu của bản 1.0, sau đó 1.1, 1.2. Trong mỗi nhóm, ticket nào bị phụ thuộc thì làm trước. Mỗi ticket vẫn cần chủ dự án duyệt đề xuất trước khi code.

**Nhóm 1: làm nốt phần dở**
1. T55 Bếp và tủ lạnh nối hạn dùng (S): soát chỗ còn thiếu so với kế hoạch.
2. T59 Quán vỉa hè, nhà hàng: rủi ro bệnh ẩn.
3. T87 Hồi ức một tháng trước, ghi chú tuần (S).
4. T88 Cuối tuần có kế hoạch: phần chọn kế hoạch (gợi ý thứ Sáu đã có).
5. T61 Điện thoại mở rộng: báo, giải trí (phần cần chứng khoán để sau T57).
6. Giá chợ đổi theo ngày (mục 58, chưa có số ticket).
7. T53 Nhà ở: hợp đồng thuê, mua, thế chấp (L; mở đường cho T58, T84).
8. T52 Nhiều bản đồ, rồi T67 bản đồ sông (1.2, mở đường cho T68).
9. T62 Thêm mini game giải trí (1.2).
10. T36: mục tiêu tuần đã có; thành tựu cơ bản làm cùng T65; hướng dẫn đầu game hoãn tới khi xong game.

**Nhóm 2: hoàn tất bản 1.0**

> Bộ sinh hội thoại (`docs/design/HOI-THOAI.md`, ticket H0 đến H8) đã duyệt, đứng đầu nhóm này và thay T63, T64 (mục I.11). H0 dàn NPC theo seed: đã gộp (#307, 0.77.0). H1 khung và bộ ghép câu: đã gộp (#309, 0.78.0). H2 dữ kiện và ai được biết: đã gộp (#311, 0.79.0). H3 đời sống NPC và ký ức biết quên: đã gộp (#314, 0.80.0). H4 lựa chọn trả lời: đã gộp (#316, 0.81.0). Quà tặng thật: đã gộp (#320, 0.82.0). H5 Lô 1 (665 mảnh, nối trò chuyện và tin nhắn Mẹ, em) cùng H8 `sim:talk` cho Lô 1: đã gộp (#321, 0.83.0). Chân dung NPC ghép từ mảnh (#305): đã gộp (#322, 0.84.0). H6 Lô 2 (7 vai, 690 mảnh), hội thoại 3 lượt, tự mở lời theo chủ đề, gọi Mẹ và em ghép câu (#323): đã gộp (#324, 0.85.0). H7b tuổi, sinh nhật, vòng đời và người nối tiếp: đã gộp (#327, 0.86.0). H7 chia ba phần (chủ dự án duyệt 06/11): H7a NPC ngẫu nhiên PR chờ gộp (0.87.0), chờ duyệt 30 câu mẫu; tiếp theo H7c cảnh nhóm, quan hệ NPC với NPC, tin đồn; H7d nhóm chat.
11. T63 Quan hệ NPC với NPC, tin đồn (bản nhẹ).
12. T64 Cốt truyện đời NPC (phần mở đầu).
13. T86 Cộng đồng khu trọ (bản nhẹ).
14. T37 Cân bằng toàn game bằng mô phỏng 3 persona.
15. T38 Hiệu năng điện thoại.
16. T39 Hồi quy toàn bộ, đóng gói Basic 1.0.

**Nhóm 3: bản 1.1**
17. T76 Sự kiện mùa và lễ.
18. T65 Thành tựu (gồm thành tựu cơ bản của T36).
19. T57 Tin tức và chứng khoán, rồi T58 Bất động sản.
20. T66 Nâng cấp công ty.
21. T84 Thú cưng, T85 Sở thích trong nhà.
22. T89 Mạng xã hội trong game (sau T63).
23. T69 Hồ sơ đời (đang hoãn), rồi T71 Khe lưu nhẹ và T83 Bối cảnh năm.

**Nhóm 4: bản 1.2 trở đi**
24. T73 Ca phục vụ, T74 Ngành ẩm thực.
25. T68 Quê và nông trại (1.3).
26. Online: T77 tài khoản và cloud save, T78 thăm nhà, T79–T81 Arcade, so điểm, xếp hạng, T82 đối đầu (1.3).
27. T70 Chuyển đời và di sản (sau 1.2, có điều kiện).

## Bảng trạng thái


> Rà xung đột, gộp ticket 06/11 (Claude, chờ chủ dự án xem): T37 vào T39; T63 vào H7c; T64 thay bằng H3, H7a, H7b; T86 chia vào H7c, H7d; T87 vào T88; T62 với T79; mini game chia hai loại trên khung T79: T80 offline (chơi một mình, kỷ lục cá nhân), T82 online (đối đầu 2 người); T81 là bảng xếp hạng tài sản; T57, T58 và phần báo T61 làm chung; T73 với T74. Đợt sửa giao diện 7 việc trong HANDOVER làm trước H7c.

| ID | Việc | Trạng thái | Tệp |
|---|---|---|---|
| T01 | Cấu trúc dự án và schema nội dung, trình kiểm tra JSON | Xong | A-ke-hoach |
| T02 | Đồng hồ, lịch (ca, ngày 1, lễ), RNG theo seed | Xong | A-ke-hoach |
| T03 | Sổ cái giao dịch idempotent | Xong | A-ke-hoach |
| T04 | Save, migration, golden saves từ v0.19 | Xong | A-ke-hoach |
| T05 | Bộ mô phỏng không giao diện và khung test | Xong | A-ke-hoach |
| T06 | 5 chỉ số thể trạng (No, Năng lượng, Tinh thần, Căng thẳng, Sức khoẻ), hệ số m, cảnh báo sớm (Phần H mục 68 và 73) | Xong | A-ke-hoach |
| T07 | Hành động ăn, ngủ, nghỉ tốn giờ; chặn hành động không hợp lệ | Xong | A-ke-hoach |
| T08 | Bản đồ node, đi bộ/xe đạp/bus, chi phí và thời gian | Xong | A-ke-hoach |
| T09 | Tiền trọ và hoá đơn hằng tháng | Xong | A-ke-hoach |
| T10 | 6 kỹ năng, đường cong XP | Xong | A-ke-hoach |
| T11 | Tìm việc, phỏng vấn (Giao tiếp), thử việc | Xong | A-ke-hoach |
| T12 | Nhiệm vụ tự chạy, lỗi và sửa, hai ca | Xong | A-ke-hoach |
| T13 | Chấm công, lương tháng ngày 1, bậc nghề | Xong | A-ke-hoach |
| T14 | Học tối (khoá cơ bản, nâng cao) | Xong | A-ke-hoach |
| T15 | Bảng chọn việc buổi sáng và điểm rẽ giữa ca | Xong | A-ke-hoach |
| T16 | Pool thuộc tính, bộ sinh NPC, hồ sơ, dàn cố định, lịch hiện diện (Phần C mục 22–23) | Xong | A-ke-hoach |
| T17 | Bộ điều phối sự kiện, mô-típ và biến thể, dấu vân tay chống lặp, cooldown (Phần C mục 26) | Xong | A-ke-hoach |
| T18 | Ghép lời thoại theo giọng, bậc quan hệ và dữ kiện ký ức, chống lặp câu (Phần C mục 27) | Xong | A-ke-hoach |
| T19 | Nhật ký: ghi, hiển thị, mở hồ sơ NPC | Xong | A-ke-hoach |
| T20 | Tin nhắn và cuộc gọi từ xa (mẹ, đồng nghiệp) | Xong | A-ke-hoach |
| T21 | Nguyên liệu theo lô, hạn dùng, tủ lạnh | Xong | A-ke-hoach |
| T22 | Công thức, sổ công thức, ba nguồn học | Xong | A-ke-hoach |
| T23 | Nấu ăn và nấu bừa | Xong | A-ke-hoach |
| T24 | Chợ và bệnh do ăn uống cơ bản | Xong | A-ke-hoach |
| T25 | Quy trình ảnh isometric: tách vỏ phòng, đồ gắn tường và đồ di chuyển; mỗi món render 2 hướng từ mô hình 3D cùng camera; bóng và lớp giờ trong ngày là lớp riêng | Bỏ, gộp vào issue #124 | A-ke-hoach |
| T26 | Kho, bản thể đồ (instanceId), lưới phòng | Xong | A-ke-hoach |
| T27 | Chế độ Bố trí: kéo, thả, xoay, xác nhận, huỷ, kiểm tra lối đi (BFS) | Xong | A-ke-hoach |
| T28 | Điểm dùng của đồ nối hiệu ứng (giường, bàn, bếp, tủ lạnh) | Xong | A-ke-hoach |
| T29 | TTTM, giỏ, đơn hàng, giao hàng, bán lại, xe máy | Xong | A-ke-hoach |
| T30 | Ngân hàng: tiết kiệm, vay, điểm tín dụng, trả góp PMT | Xong | A-ke-hoach |
| T31 | Phục hồi mềm khi hết tiền | Xong | A-ke-hoach |
| T32 | Dự án riêng buổi tối và khách tay trái | Xong | A-ke-hoach |
| T33 | Điều kiện, vốn và văn phòng khi mở công ty | Xong | A-ke-hoach |
| T34 | Công ty: dự án, nhân sự, dòng tiền (tách thành T44–T50, Phần D mục 32–41) | Thay bằng T44–T51 | A-ke-hoach |
| T35 | Màn kết và tổng kết từ Nhật ký | Xong | A-ke-hoach |
| T36 | Hướng dẫn 10 phút đầu, mục tiêu tuần, thành tựu cơ bản | Một phần: mục tiêu tuần (T75); hướng dẫn đầu game hoãn tới khi xong game | A-ke-hoach |
| T37 | Cân bằng bằng mô phỏng 3 persona và chỉnh số | Gộp vào T39 (mô phỏng sim:company, sim:npc, sim:talk, sim:life, sim:town đã có; T39 chạy lại tất cả và chỉnh số) | A-ke-hoach |
| T38 | Hiệu năng điện thoại, giảm hiệu ứng, cuộn trong khung | Chưa làm | A-ke-hoach |
| T39 | Hồi quy toàn bộ và đóng gói Basic 1.0 | Chưa làm; gồm T37 (cân bằng 3 persona bằng các sim có sẵn) | A-ke-hoach |
| T40 | Quan hệ theo bậc, trần mỗi ngày, hao mòn có sàn, mở khoá theo điều kiện chuyện | Xong | C-noi-dung-npc |
| T41 | Ký ức có cấu trúc, hook tiếp nối, quy tắc nhắc lại | Xong | C-noi-dung-npc |
| T42 | Công cụ nhập dữ liệu pool và mô-típ từ file, kèm bộ kiểm tra | Xong | C-noi-dung-npc |
| T43 | Mô phỏng 12 tháng đo độ lặp và phân bố quan hệ | Xong | C-noi-dung-npc |
| T44 | Ứng viên sinh từ pool, trình độ kinh nghiệm (Thực tập đến Chuyên gia) và giá thuê, CV so với thật, hành động phỏng vấn, công thức sai số (Phần D mục 33.3) | Xong | D-cong-ty |
| T45 | Nhân viên NPC: chỉ số công việc, hành vi theo tính cách, morale và gắn bó | Xong | D-cong-ty |
| T46 | Dự án và giao việc: chỉ số NPC ảnh hưởng tốc độ và lỗi, phối hợp nhóm, điểm kiểm tra (Phần D mục 35.1) | Xong | D-cong-ty |
| T47 | Tài chính công ty: dòng tiền, lương ngày 1, runway, uy tín | Xong | D-cong-ty |
| T48 | Mô-típ sự kiện nhân sự (xin tăng lương, xung đột, bị chào mời…) | Xong | D-cong-ty |
| T49 | Đào tạo, cảnh cáo, sa thải, chính sách công ty | Xong | D-cong-ty |
| T50 | Mô phỏng cân bằng công ty (tuyển cẩn thận, tuyển ẩu) | Xong | D-cong-ty |
| T51 | Độ biết, dự đoán theo khoảng, sự kiện giữa việc (#226) | Xong | D-cong-ty |
| T52 | Nhiều bản đồ: bản đồ phụ, trạm bus, thời gian chuyến | Một phần: có trạm bus và hồ, chưa nhiều bản đồ | E-pham-vi-day-du |
| T53 | Nhà ở nhiều cấp: thuê, mua, hợp đồng, thế chấp | Một phần: nhà phố, biệt thự thuê/mua; chưa hợp đồng, thế chấp | E-pham-vi-day-du |
| T54 | Điện nước theo thiết bị, hoá đơn, giá theo loại nhà | Xong | E-pham-vi-day-du |
| T55 | Bếp và tủ lạnh nối với hạn dùng và nấu ăn | Xong (#294, 0.76.0) | E-pham-vi-day-du |
| T56 | Máy tính đa dụng: làm việc, học, giải trí, cấu hình | Xong | E-pham-vi-day-du |
| T57 | Tin tức và thị trường chứng khoán, chống khai thác | Chưa làm; làm cùng T58 và phần báo của T61 (tin tức nuôi giá chứng khoán, bất động sản) | E-pham-vi-day-du |
| T58 | Bất động sản: giá theo khu vực, thuê hoặc mua đầu tư | Chưa làm; làm cùng T57 | E-pham-vi-day-du |
| T59 | Quán vỉa hè và nhà hàng, rủi ro bệnh ẩn | Một phần: quán vỉa hè, nhà hàng, mang về | E-pham-vi-day-du |
| T60 | Công viên rèn luyện và chỉ số Thể lực | Xong | E-pham-vi-day-du |
| T61 | Điện thoại mở rộng: báo, tin tức, giải trí | Một phần: tin tức, bản tin sáng; phần báo làm cùng T57, T58; phần giải trí theo T79 | E-pham-vi-day-du |
| T62 | Mini game giải trí | Một phần: bầu cua; gộp với T79 (mini game dùng chung khung Arcade, lưu riêng) | E-pham-vi-day-du |
| T63 | Đồ thị quan hệ NPC với NPC, tin đồn | Gộp vào H7c (cảnh nhóm, quan hệ NPC với NPC, tin đồn) | E-pham-vi-day-du |
| T64 | Cốt truyện đời NPC: dàn cố định và đường đời mẫu | Thay bằng H3 đời sống NPC, H7a mạch chuyện NPC ngẫu nhiên, H7b vòng đời | E-pham-vi-day-du |
| T65 | Thành tựu mở rộng | Chưa làm | E-pham-vi-day-du |
| T66 | Nâng cấp công ty | Chưa làm | E-pham-vi-day-du |
| T67 | Câu cá và bản đồ sông | Một phần: hồ câu, chưa bản đồ sông | E-pham-vi-day-du |
| T68 | Quê và nông trại | Chưa làm | E-pham-vi-day-du |
| T69 | Hồ sơ đời (dữ liệu) và khởi tạo đời; một hồ sơ ban đầu, `playthroughId` trong save | Hoãn (chủ dự án, chờ thông báo) | F-doi-nghe-online |
| T70 | Chuyển đời: di sản, điểm gia tộc, gia phả, tổng kết | Chưa làm | F-doi-nghe-online |
| T71 | Khe lưu nhẹ: nhiều nhân vật độc lập, quay lại được, không kế thừa | Chưa làm | F-doi-nghe-online |
| T72 | Khung nghề dạng dữ liệu và loại vòng lặp | Xong | F-doi-nghe-online |
| T73 | Ca phục vụ (vòng lặp cho ẩm thực, bán hàng) | Chưa làm; làm cùng T74 (vòng lặp ca phục vụ cho ngành ẩm thực, khung nghề T72 đã có) | F-doi-nghe-online |
| T74 | Ngành ẩm thực: thực đơn, khách, uy tín, vệ sinh | Chưa làm; làm cùng T73 | F-doi-nghe-online |
| T75 | Bản tin sáng, mục tiêu tuần, báo cáo tháng, tiến độ khi vắng mặt | Xong | F-doi-nghe-online |
| T76 | Sự kiện mùa và lễ | Chưa làm (PR #277 dùng nhầm số T76 cho nhà lớn); dùng thời tiết T90 cho sự kiện mưa bão; lễ là chủ đề của hệ hội thoại | F-doi-nghe-online |
| T77 | Tài khoản, bạn bè, cloud save | Chưa làm | F-doi-nghe-online |
| T78 | Bản chụp nhà và thăm nhà | Chưa làm | F-doi-nghe-online |
| T79 | Khung Arcade tách biệt (lưu riêng, không chạm sổ cái) | Chưa làm; khung chung cho mọi mini game (lưu riêng, không chạm sổ cái), mỗi trò khai loại offline hoặc online; gồm phần còn lại của T62 | F-doi-nghe-online |
| T80 | Mini game offline: chơi một mình trên điện thoại hoặc máy tính trong game (bầu cua, nối dây, xếp hình...), kỷ lục cá nhân, không so điểm với người khác | Chưa làm; dùng khung T79 (đổi phạm vi 06/11: bỏ so điểm cùng seed và ghost) | F-doi-nghe-online |
| T81 | Bảng xếp hạng tuần và xác minh phía máy chủ | Chưa làm; theo quyết định là bảng xếp hạng tài sản (không xếp hạng điểm mini game) | F-doi-nghe-online |
| T82 | Mini game online: đối đầu 2 người, vào bằng mã phòng hoặc ghép trận, không ảnh hưởng tiến trình đời chơi | Chưa làm; dùng khung T79 và tài khoản T77 | F-doi-nghe-online |
| T83 | Bối cảnh năm (biến động thế giới), làm cho một đời trước | Chưa làm | F-doi-nghe-online |
| T84 | Thú cưng: chỉ số, chăm sóc, sự kiện, quy định nhà ở | Chưa làm; cần quy định nuôi thú theo loại nhà (T53) | G-y-tuong-giu-chan |
| T85 | Sở thích trong nhà: đồ có điểm dùng, XP sở thích, bộ sưu tập | Một phần: điểm dùng đồ đã có (T28); còn XP sở thích, bộ sưu tập | G-y-tuong-giu-chan |
| T86 | Cộng đồng khu trọ: hàng xóm, chủ trọ, điểm hoà thuận, sự kiện nhóm | Gộp: hàng xóm, sự kiện nhóm vào H7c, nhóm chat Khu trọ vào H7d; còn lại điểm hoà thuận khu trọ làm sau H7d | G-y-tuong-giu-chan |
| T87 | Hồi ức một tháng và một năm trước, ghi chú tuần tuỳ chọn | Một phần: hôm nay năm ngoái (T75); phần còn lại nhỏ, gộp vào T88 | G-y-tuong-giu-chan |
| T88 | Cuối tuần có kế hoạch và gợi ý trong bản tin sáng | Một phần: gợi ý thứ Sáu (T75); gồm phần còn lại T87; NPC rủ cuối tuần dùng ý định Rủ của hệ hội thoại | G-y-tuong-giu-chan |
| T89 | Mạng xã hội trong game: bảng tin, bình luận câu mẫu, tin đồn lan | Làm sau H7d: dùng chung tin đồn (H7c) và khung tin nhắn nhóm (H7d) | G-y-tuong-giu-chan |
| T90 | Thời tiết nhẹ theo mùa: biểu tượng trên đầu màn hình, đi bộ tốn thêm khi nóng/mưa, xe chậm khi mưa, công viên kém hiệu quả khi mưa | Xong | G-y-tuong-giu-chan |
