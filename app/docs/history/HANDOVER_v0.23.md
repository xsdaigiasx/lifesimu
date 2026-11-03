# Bàn giao v0.23 · 30/10/2026

## Đã triển khai

- Giữ luồng CV ngày 0 → phỏng vấn ngày 1 → nhận việc ngày 2. Bảng tuyển dụng IT hiển thị lương tháng.
- Hai ca 08–12 và 13–17. Bắt đầu sớm chờ đến giờ; đến muộn chỉ ghi nhận thời gian còn lại. 12–13 tự do dùng các hoạt động hiện có. Ngày mới bắt đầu 07:00 để có thời gian di chuyển; giờ hiện tại của save cũ được giữ.
- Chọn 7 loại đầu việc, tự chạy 0–100%, không bắt chơi mini game. Tốc độ và tỷ lệ lỗi phụ thuộc kỹ năng, thiết bị, stress và năng lượng. Lỗi tự chạy lượt sửa, tối đa hai lượt; không nhân XP khi sửa. Kết quả ngẫu nhiên được lưu cùng tiến độ, tải lại không đổi kết quả.
- Tạm dừng/tiếp tục/rời ca; khóa di chuyển, học và qua ngày trong ca. Đóng màn công việc vẫn chạy khi trang đang hiển thị; tab ẩn tạm dừng, không cộng thời gian ngoại tuyến. Một giây thực = 30 phút game, ca đủ giờ khoảng 8 giây thực. Hết ca tự trở về không gian văn phòng.
- Lập trình, Logic, Đồ họa, Quản lý, Giao tiếp có Lv/XP riêng, tối đa Lv50. Đầu việc tăng kỹ năng chính/phụ; không gộp với thanh XP nhân vật cũ. Học tối 18–22h, 1/2 giờ, một lần/ngày, 40.000đ và 30XP mỗi giờ; năng lượng thấp giảm XP một nửa. Đây là học tại chỗ, chưa có trung tâm học riêng.
- Sen Code 10 triệu, An Nhiên Tech 12 triệu/tháng: mức cân bằng ban đầu. Tích lũy theo phút làm thực / tổng phút làm tiêu chuẩn thứ Hai–Sáu trong tháng. Lương tháng trước trả đúng một lần vào ngày 1 dương lịch; ngày nghỉ lễ trong tuần hưởng lương. Save cũ không truy lĩnh thời gian chưa được ghi nhận và không nhận lại tiền ca cũ.
- Lịch nghỉ Việt Nam đầy đủ cho năm 2026 trong calendar-2026.json, dành cho lịch doanh nghiệp thứ Hai–Sáu. Các năm sau chỉ có lễ cố định dương lịch; cần bổ sung dữ liệu Tết và Giỗ Tổ hằng năm. Không áp dụng lịch hoán đổi ngày làm của cơ quan nhà nước.
- Văn phòng nhìn chéo 2.5D bằng SVG, ba cỡ 6/12/24 chỗ. Kéo hoặc chọn đồ rồi chạm ô trống, xoay 90°, cất/đặt đồ; Lưu có xác nhận và tốn 5 phút, Hủy bỏ thay đổi. Kiểm tra biên, vật chồng nhau và khoảng trống hai ô trước cửa. Chưa kiểm tra đường đi liên thông toàn phòng.
- Nhân viên chỉnh bàn/ghế của mình và đồ cá nhân; chủ công ty chỉnh cả phòng khi hợp đồng còn hạn. Mua đồ và trình sắp xếp dùng chung bố cục; đồ mới vào kho khi đã có bố cục lưu. Đây là đồ họa SVG chức năng, chưa thay bộ ảnh nội thất bằng raster cuối cùng.
- Nhật ký thay Mua sắm trên thanh chính. Ghi việc đã xảy ra: tuyển dụng, gặp người, mua/nâng cấp, lưu bố cục, công việc, học, lương. Lưu tối đa 300 dòng; danh sách người chỉ gồm NPC đã gặp. Không dựng lịch sử giả cho save cũ. Mua sắm vẫn trong điện thoại và khu vực hiện có.

## Mã và save

Domain: src/domain/work.ts, calendar-2026.json, layout.ts, journal.ts. UI: WorkPanel.tsx, OfficeEditor.tsx, Journal.tsx, Office.tsx. App kết nối timer và commit save; finishDay gọi chốt lương tập trung. Khóa save và version1 giữ nguyên; các trường mới là optional và được kiểm tra khi tải. Không đưa save thử vào gói.

## Chưa triển khai giai đoạn này

NPC/sự kiện mở rộng, quan hệ động, lời nói trên đầu, đi muộn ngẫu nhiên, mini game tùy chọn, nấu ăn/hạn thực phẩm, COD, bệnh viện, ngân hàng, phương tiện, mùa/thời tiết động và kinh doanh tự động nằm trong lộ trình. Không coi bốn NPC hiện có là dữ liệu NPC mở rộng đã hoàn chỉnh. Bố trí nhà ở vẫn là hệ thống cũ, chưa chuyển sang editor văn phòng.

## Tài nguyên và triển khai

Ảnh/âm thanh kế thừa v0.19, không đổi byte. Bản đồ hiện tại là master 6144×4096 đã upscale từ nguồn cũ, 16 tile; không tuyên bố có chi tiết native 6K/8K. Nguồn/giấy phép kế thừa xem docs/SOURCES.md; không phát sinh ảnh hoặc âm thanh mới. Lịch nghỉ có nguồn trong JSON. SVG mới được viết cho dự án.

Gói có source và dist, không có node_modules/token/save người chơi. Chưa triển khai lên Site cũ vì kết nối trả project_not_found; danh tính hosting được giữ. Không tự tải ZIP lên Google Drive.

Editor giữ lưới nhìn từ trên để đặt đồ chính xác; màn chơi dùng isometric 2.5D cùng dữ liệu. Đây là hình vector có chiều sâu, chưa phải bộ ảnh pixel vẽ riêng. Toolbar chức năng dùng SVG và nhãn ngắn.

V0.22: màn văn phòng mở sát mép vùng chơi trên mobile, tiêu đề/toolbar gọn, cảnh chiếm chiều cao còn lại và dùng SVG contain để không cắt sàn. Không đổi save hay cơ chế.

## v0.23: văn phòng kết hợp góc làm việc
Chạm bàn cá nhân chọn đầu việc, tiến độ bubble trong cảnh, pause/resume/rời ca tại cảnh. Nhân vật đứng ngoài ca, ngồi theo ghế trong ca. Bốn đồng nghiệp dev-an/dev-linh/dev-huy/dev-trang, trò chuyện5/15phút, quan hệ0–100, cooldown60phút game, lưu ID riêng trong social.relations, hiện ở Mối quan hệ/Nhật ký. Mở hội thoại pause, đóng chỉ resume nếu ca vốn chạy. Trong giờ làm: tổng trò chuyện>10phút/ngày bị nhắc và+3stress. Thời gian nói tính có mặt trong ca nhưng không tiến độ/XP đầu việc. Ngoài ca tiêu tốn thời gian bình thường. Chưa có đường đi/animation bước chân; chuyển trạng thái đứng/ngồi. Bong bóng hiện một câu tĩnh. Đây là SVG chức năng, chưa có sprite pixel tách lớp đạt chất lượng concept. Lưới mét, hóa đơn chưa triển khai. Dữ liệu social optional tương thích save cũ.
