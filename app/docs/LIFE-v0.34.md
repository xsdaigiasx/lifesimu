# Sinh hoạt và mua sắm v0.34

Ngày 01/11/2026. Các mức giá, lãi và bệnh dưới đây là cơ chế cân bằng game.

## Mua sắm

Điện thoại → Mua sắm có bốn danh mục: Nội thất, Đồ điện tử, Quần áo, Phương tiện. Nội thất có ba hạng Cơ bản/Tiện nghi/Cao cấp, giá nhân 1/1,6/2,5. Nâng cấp trả phần chênh lệch, giữ vị trí, không mua thêm bản sao. Đồ đã đặt hạng Tiện nghi/Cao cấp giảm thêm 1/2 stress mỗi đêm; giường còn tăng 4/8 năng lượng khi ngủ. Các hạng dùng chung hình ảnh hiện tại.

Tai nghe mở nghe nhạc ở công viên; TV mở thư giãn ở nhà. Quần áo mua rồi chọn Mặc, hiện tên trang phục ở hồ sơ, lần thay đầu ngày +2 tâm trạng. Chưa thay hình nhân vật theo trang phục. Xe mua rồi chọn Sử dụng: xe đạp ×0,6 thời gian đi đường, xe máy ×0,35, xe tay ga ×0,3. Hai xe máy tốn 1.200đ/km, làm tròn; có thể chọn lại Đi bộ. TV/xe chưa có sprite đặt trong phòng/bản đồ.

## Đặt đồ trong nhà

Đèn ngủ dùng ảnh mới thân ngắn, có thể đặt sàn hoặc lên bàn. Trong Sắp xếp, chọn Đèn ngủ/Chậu cây rồi chọn Trên bàn laptop hoặc Trên bàn ăn nhỏ. Mỗi bàn có hai điểm đỡ cố định cho cây và đèn; đồ đi theo bàn. Cất bàn cũng cất đồ trên bàn; chọn Đặt sàn đưa đồ về kho để kéo xuống sàn. Bàn phải đang được đặt trong phòng. Chưa có kéo thả tự do trên mọi bề mặt hoặc thay đổi độ cao liên tục.

Mua Tranh treo tường, chọn tranh trong kho rồi Tường trái/Tường sau; thanh Vị trí di chuyển trong đoạn tường trống, tránh cửa sổ và khu vệ sinh. Tranh là SVG viết bằng mã, không chiếm ô sàn. Nút Đi ngủ tách khỏi khung alpha sprite, neo vào tâm giường. Hàng tùy chọn mobile giữ chiều cao cố định để không đổi tọa độ phòng giữa lúc kéo; đã kiểm tra vuốt kho và kéo dọc bằng cảm ứng CDP.

Ảnh đèn mới: `public/assets/static-scenes/bedside-lamp.png`, sinh bằng built-in imagegen từ ảnh đèn cũ. Các đồ có hướng vẫn là ảnh 2D hai góc; không dựng mô hình 3D. Prompt đã dùng:

> Use case precise-object-edit. Transform this tall standing lamp into one SHORT BEDSIDE TABLE LAMP, total real-world height35centimeters, for a cozy isometric game. Keep cream conical fabric shade, dark warm wood ROUND base, brass detail, painterly clean game style. Replace the very long pole by a short neck just15percent of total height. Shade occupies60percent of total height, base occupies15percent, compact silhouette ratio height:width about1.3:1. Same elevated orthographic camera, single object centered, full base visible. Genuine clean alpha transparency, no floor, no shadow or halo, no comparison pair or text.

## Chợ và bếp

Chợ bán gạo, trứng, rau, thịt, đậu phụ, cá theo số lượng 1/5/10; mua mất 5 phút. Nguyên liệu có hạn sử dụng 30/5/2/1/2/1 ngày tương ứng, hết hạn không dùng nấu được. Có nút bỏ đồ hết hạn.

Trong nhà bấm Bếp hoặc icon ngay khu bếp. Bốn món: cơm trứng (20 phút), cơm thịt rau (35), cơm đậu rau (25), cơm cá kho (40). Nấu mất 4 năng lượng, tiêu thụ lô còn tươi sắp hết hạn trước. Kho tối đa 20 món, món ăn dùng trong ngày nấu. Ăn mất 10 phút, cách bữa trước ít nhất 3 giờ, hồi năng lượng/sức khỏe/tâm trạng theo món. Xem TV 30 phút, một lần/ngày. Bữa trưa công ty vẫn dùng luồng cũ.

## Ngân hàng

Gửi từ 100.000đ đến 100 triệu/sổ, tối đa ba sổ. Kỳ hạn 7/30/90 ngày nhận lãi 0,1%/0,5%/1,8% **cho cả kỳ**, tất toán một lần khi rút. Rút sớm chỉ hoàn gốc. Không tự tái tục.

Vay 500.000–5 triệu, tối đa một khoản, hạn 30 ngày, phí cố định 1,5% cộng ngay vào dư nợ. Trả một phần hoặc toàn bộ; quá hạn cộng 0,1% dư nợ/ngày, dư nợ tối đa 100 triệu. Màn vay hiển thị nghĩa vụ trước khi bấm. Không gắn với ngân hàng thật.

## Sức khỏe và công viên

Năm trạng thái bệnh: cảm lạnh, đau dạ dày, đau lưng, kiệt sức, rối loạn tiêu hóa. Ngày mới phát sinh theo năng lượng/sức khỏe/stress/công việc và seed ngày ổn định; không ngẫu nhiên lại khi reload. Năng lượng dưới 20 khi kết ngày gây kiệt sức; các bệnh khác có điều kiện chỉ số và xác suất seed. Bệnh đang mắc trừ năng lượng/sức khỏe mỗi ngày.

Tại bệnh viện: khám 30 phút/60.000đ, tối đa một lần/ngày; khám mới hiện tên bệnh. Điều trị từng bệnh 45 phút, phí tương ứng 120k/250k/300k/180k/220k, hết bệnh đó và phục hồi chỉ số. Chăm sóc sức khỏe 60 phút/200k một lần/ngày. Không có hướng dẫn dùng thuốc thực tế.

Công viên có đi dạo, tập thể dục, nghỉ ghế đá, nghe nhạc (cần tai nghe); mỗi hoạt động một lần/ngày, thay đổi thời gian và chỉ số. Tập thể dục cần đủ năng lượng và sức khỏe từ 30.

## Save và kiểm chứng

GameState.life là trường tùy chọn; save cũ tự có kho thực phẩm/tài khoản/bệnh rỗng, không reset tiền hay đồ. Metadata tier/mount/parentId/wall của đồ cũng tùy chọn. Parser kiểm tra kiểu, ID, giới hạn, trùng lặp. Chuyển ngày xử lý nợ/bệnh/tiện nghi một lần; commit dùng state mới nhất, chống thao tác lặp với dữ liệu cũ.

`npm test`: 20 suite, có life.test.cjs cho mua/nấu/ăn, hết hạn, tiết kiệm/rút, vay/trả/quá hạn, khám/chữa, bệnh qua ngày, công viên, trang phục, xe, save, nâng cấp và đồ gắn bàn/tường. `scripts/qa-life.cjs` chạy luồng giao diện 390×780 từ mua sắm tới chợ/bếp/ngân hàng/bệnh viện/công viên và reload. `qa-home-shelf.cjs` kiểm tra vuốt ngang, kéo dọc, tâm xoay và lưu lại bằng cảm ứng thực. Ảnh QA không đóng gói vào source.
