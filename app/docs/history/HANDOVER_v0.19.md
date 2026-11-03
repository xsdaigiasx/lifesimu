# MỘT ĐỜI ĐỂ SỐNG — BÀN GIAO HIỆN HÀNH v0.19

Cập nhật ngày 30/10/2026. Đây là bản hiện hành thay cho mô tả v0.10/v0.11 trên Drive. Những file có phiên bản cũ là lịch sử.

## Quyết định giao diện phải giữ

Chủ dự án xác định đây là game, không phải website. Giao diện phải là các màn tương tác gọn, không là trang nội dung dài. Quy tắc đã ghi trong AGENTS.md để các lần phát triển sau tiếp tục áp dụng.

Màn tòa nhà có một đoạn ảnh ở trên, các hàng lựa chọn ở dưới. Tại khu văn phòng: Bảng tuyển dụng, Thông báo, Vào công ty nếu người chơi đã có việc hoặc là chủ, Sảnh chờ và Thuê văn phòng/Hợp đồng. Chọn hàng mở màn riêng. Không lặp danh sách thành tab ngang.

Mọi popup game dùng chung khung, header, nút đóng, kích thước, padding, chân hành động và khoảng trống cho thanh điều hướng mobile. Điện thoại trong game và mở đầu là hai trải nghiệm riêng. Bảng danh sách được cuộn khi cần; nội dung chính của từng tác vụ và nút hành động phải ở trong khung.

Tờ tuyển dụng phải nhỏ để hiện nhiều tin cùng lúc. Nộp CV, lịch phỏng vấn, câu hỏi, kết quả và thư nhận việc đều là màn riêng. Chỉ hiện tên, điều kiện, giá/thời gian và trạng thái cần thiết. Không nhồi lời giải thích, lời quảng cáo hoặc dấu • vào các đoạn thuyết minh.

Không ghi “mở sau”, “làm sau”, “sẽ bổ sung”, “thử nghiệm”, kế hoạch phát triển hay mô tả kỹ thuật lên giao diện. Phần chưa làm thì ẩn. Nếu bị khóa do điều kiện thật, chỉ dùng nhãn ngắn, ví dụ “Cần chứng chỉ”. Toàn bộ kế hoạch, giới hạn, lý do kỹ thuật phải ở tài liệu bàn giao, không được sao chép vào lời thoại hoặc ghi chú trong game.

## Trạng thái hiện tại

React 19 và TypeScript strict, dựng static bằng Vite. Nguồn chính ở src/, tài nguyên ở public/, build ở dist/. Không sửa JS sinh trong dist/. Tiền khởi đầu 5.200.000đ, sinh hoạt 90.000đ khi kết thúc ngày. Lịch game bắt đầu 02/11/2026.

Site hiện hành: https://life-simulator-vietnamese-quan.genialshrew64.chatgpt.site . Giữ project_id appgprj_6ae2d647f71081919b84bf78efb812dc và audience chủ sở hữu. Không tạo Site khác chỉ để sửa phiên bản.

## Bản đồ và địa điểm

Chủ dự án đã chốt ảnh thành phố liền mạch, gửi bản upscale 6144×4096. Không được gọi là ảnh vẽ gốc 6K. Nguồn art/map-source/city-upscaled-6144.png được cắt không resize thành 16 WebP 1536×1024, tổng khoảng 6.14 MB. Khung logic 1440×960, zoom tối đa 1.15. Tải tối đa 3 ảnh đồng thời, ưu tiên vùng nhìn rồi vùng kề; chờ cache decode và ảnh DOM trước khi vào game. Có retry/lỗi/timeout.

12 điểm bấm đã căn theo ảnh trong src/map/city-layout.ts. Khu chung cư đã đổi thành Khu nhà phố, giữ ảnh. Đến địa điểm có thời gian theo khoảng cách; đóng/mở UI không tự đổi vị trí hoặc giờ. Nhà trọ vào phòng, xe buýt tới Hồ Sen. Các địa điểm chưa có hoạt động chỉ hiện thông tin và thông báo phù hợp, không quảng cáo tính năng chưa làm.

## Thời gian và tuyển dụng

Đồng hồ 08:00–22:00, tiến theo hành động. Khoảng cách là quy đổi game theo tọa độ trên hai trục đường chéo của ảnh, không phải GPS hay đường đi đã dò chính xác. Nhà trọ–văn phòng 875m, khoảng 15 phút đi bộ. Địa điểm khác dùng cùng quy tắc, có khoảng cách và thời lượng riêng. Một nửa ngày làm việc được quy ước là 4 giờ.

Nhân vật có bằng CNTT. Hai công ty IT nhận CV, các tin ngành thiết kế/thương mại/kế toán bị khóa bởi điều kiện chứng chỉ. Nộp CV mất 15 phút, hẹn đúng ngày kế tiếp. Phỏng vấn mất 4 giờ một lần và có 3 câu hỏi từ kho 5 câu; phải đúng cả 3 mới đậu. Ngày tiếp theo mới nhận việc. Lỡ hẹn có thể hủy/nộp lại, trượt nộp lại từ hôm sau. Đang phỏng vấn không làm việc khác hoặc ngủ; lưu tiến độ từng câu.

Ca làm 4 giờ, tối đa một ca/ngày; Sen Code trả 450.000đ, An Nhiên Tech trả 550.000đ. Kiểm số dư, năng lượng, thời gian và chống lặp. Học 2 giờ, nghỉ 1 giờ, mỗi loại một lần/ngày. Ngủ trừ 90.000đ, hồi phục và sang 08:00 sáng mai tại nhà. Các nhân viên từ save cũ giữ chỗ làm, có thể rời công ty để ứng tuyển lại.

## Văn phòng và người quen

6 công ty thuộc 4 ngành, 3 quy mô 6/12/24 chỗ. Bố cục khác theo quy mô; ngành có màu và hạng mục riêng. Nhân viên chỉnh máy tính và đồ cá nhân; chủ thuê 40/85/160m² với giá 1.2/2.4/4.2 triệu cho 7 ngày, không tự gia hạn. Hết hạn chỉ xem, gia hạn giữ thiết bị. Trả mặt bằng không hoàn tiền, đồ giữ kho.

Chủ nâng dàn máy theo số chỗ, mua/nâng máy in, bố trí cây/đèn/góc cà phê ở ba vị trí chống trùng. Nhân viên không sửa máy in chung. Giao dịch có xác nhận và vào sổ thu chi. Đồ cá nhân và công ty tách riêng.

4 NPC hỗ trợ ở sảnh: Mai Lan, Đức Minh, Ngọc Hà, Quốc Bảo. Lời thoại cố định ngắn theo vai trò. Chào hỏi thêm vào Quan hệ và danh bạ. Chưa có mô phỏng lịch trình, hội thoại sinh động, độ thân thiết, hợp đồng lao động đầy đủ, dự án/doanh thu công ty hay hiệu suất gameplay từ thiết bị. Các giới hạn này chỉ ở tài liệu này, không thành ghi chú trong game.

## Các hệ thống đã có

Mở đầu 12 nhịp/93 giây và tài nguyên ảnh/âm thanh giữ nguyên. Phòng 03 có mua/cất/đặt cây, đèn, thảm. Điện thoại có sức khỏe, tài chính, ghi chú, lịch hẹn, cấu hình báo thức, tin trong game và tiện ích. Cấu hình báo thức chưa phát chuông và cuộc gọi chưa gọi ra ngoài; không thêm ghi chú lộ kỹ thuật trong game.

Bầu cua có cược sáu cửa, ba xúc xắc, tiền/giờ chỉ đổi sau khi xóc xong. Không được trả tiền ngay khi bấm. Phiên xóc thuộc App, không bị kết toán sớm khi đóng điện thoại, không cho chơi lặp khi đang xóc.

Hồ Sen là địa điểm riêng đi bằng tuyến xe 07, vé khứ hồi 40.000đ. Đi xe 45 phút, có 6 loài cá, mồi, giỏ, bán cá và sưu tập. Cá vào giỏ, chỉ có tiền khi bán. Câu cá mất 10 phút và chừa 45 phút để về; lượt về không thu thêm tiền.

## Save và kiến trúc

Giữ key life-simulator-vi-v1, life-simulator-phone-v1, life-simulator-profile-v1; version 1. fishing, office, clock, application là trường bổ sung tùy chọn, validate khi đọc. Không reset save người chơi khi cập nhật. Lịch sử giao dịch tối đa 100 dòng. Save thuộc thiết bị/origin; ZIP không chứa save kiểm thử hoặc cloud save.

Domain: src/domain/time.ts, office.ts, fishing.ts, bau-cua.ts, bau-cua-session.ts, engine.ts. UI: App, Modal, GameUI, Office, Recruitment, LocationVisit, OfficeFloor, Phone, FishingLake. game-ui.css là lớp quy chuẩn hiện hành, ghi đè định dạng cũ; không phục hồi tab/card trang web khi bổ sung chức năng.

## Chạy và kiểm tra

npm ci
npm run typecheck
npm test
npm run art:verify
npm run build

Phục vụ dist/ qua HTTP/HTTPS, không mở file://. Không đóng gói node_modules, lịch sử Git, cache công cụ, credential hoặc dữ liệu người chơi.

Các kiểm tra domain bao gồm kinh tế, save, khoảng cách/đồng hồ, CV/ngày hẹn/ngày nhận việc, khóa ngành, phỏng vấn lưu từng câu, lương chống lặp, vai trò/hợp đồng/trang trí, bầu cua và câu cá. Kiểm UI bằng trình duyệt desktop và khung điện thoại, gồm màn tòa nhà, tuyển dụng, CV, phỏng vấn, công ty và khung thống nhất. Đây không phải nghiệm thu trên điện thoại vật lý của chủ dự án.

## Bàn giao Drive

Gói game hiện hành được lưu vào thư mục game đã có. Tài liệu này cập nhật file bàn giao hiện hành trong thư mục bàn giao, giữ lịch sử có phiên bản v0.11. Sau lần được yêu cầu này, không tự tải các bản ZIP sau lên Drive nếu chủ dự án chưa bảo.
