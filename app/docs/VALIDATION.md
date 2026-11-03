# Kiểm tra v0.20

- npm run build: TypeScript và production build thành công.
- npm test: 14 bộ kiểm thử thành công. Bao gồm tuyển dụng cũ, khóa mở đầu/map, công việc theo thời gian, lưu giữa ca, lỗi/sửa không nhân XP, học tối, lương đủ tháng và chống trả trùng; bố cục 6/12/24, quyền sở hữu, xoay/chồng/cửa, lưu/hủy; Nhật ký và save cũ.
- npm run art:verify: 16 ô, nguồn 6144×4096, không resize khi cắt, 6.140.970 byte runtime. Nguồn đã upscale, không phải chi tiết native.
- Trình duyệt: đi qua CV, phỏng vấn, nhận việc, vào văn phòng. Thử cất ghế, xoay bàn, đặt lại ghế và lưu; đồng hồ tăng đúng 5 phút. Thử bắt đầu ca, tiến độ tự tăng, tạm dừng; tiền chưa trả ngay nhưng có lương tích lũy.
- Không kiểm thử trên thiết bị Android/iOS thật. Các kiểm thử hình học/pointer cũ của map được giữ, không thay bộ ảnh đã duyệt.

- Khung di động 390×780: Nhật ký và kỹ năng hiển thị đủ, thanh điều hướng còn thấy. Tải lại giữ ca tạm dừng tại 10:24 cùng XP đã nhận. Cloudflare Workers dry-run đọc đủ 89 tệp và thành công; chưa deploy thật.

## v0.21
14 suites và build PASS. Thêm kiểm tra 8 tick ×30 phút kết thúc đúng12h, ghi đủ240 phút. Trình duyệt xác nhận ca đang lưu tiếp tục đến12h và tự về văn phòng. Kiểm tra khung390×780: phòng isometric, toolbar SVG, nút đóng/quay lại. Chưa kiểm tra trên thiết bị thật.

V0.22: build/typecheck PASS; kiểm tra trình duyệt khung390×780, trọn phòng và toolbar ở đáy. Chỉnh bố cục, không đổi domain.

## v0.23
15 suites PASS, gồm social: ID, cooldown, score, save roundtrip, không tiến độ task khi nói, nhắc nhở, phút/clock và invalid state. Browser390×780: cảnh có4NPC và protagonist, chạm Linh mở sheet trong cảnh,5phút đổi12:00→12:05 và thân thiết2. Build/typecheck PASS. Chưa kiểm tra thiết bị thật.
