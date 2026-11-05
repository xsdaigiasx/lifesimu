# Quy tắc của chủ dự án — Next Day (slogan: Một đời để sống)

Đây là game, không phải website giới thiệu sản phẩm. Áp dụng các quy tắc này cho mọi giao diện mới và khi chỉnh giao diện cũ.

1. Ưu tiên màn hình điện thoại dọc. Mỗi màn là một tác vụ rõ ràng, dùng diện tích hiệu quả; không ghép nhiều đoạn nội dung thành trang web dài.
2. Màn địa điểm dùng mô tả ngắn, bỏ ảnh giới thiệu; nút vừa nội dung. Văn phòng nhân viên vào thẳng góc làm việc bằng ảnh cảnh tĩnh, không qua sảnh. Trong ca chỉ ảnh hoạt động và tiến độ, không hội thoại hay cửa hàng. Quy tắc mới do chủ dự án chốt ngày 30/10/2026, thay quy tắc ảnh tòa nhà cũ.
3. Dùng một khung cửa sổ game thống nhất về kích thước, header, vị trí đóng/quay lại, padding và chân hành động. Giữ thanh điều hướng mobile có thể nhìn thấy. Điện thoại trong game và mở đầu có giao diện riêng theo ngữ cảnh.
4. Chữ ngắn: tên, trạng thái, số liệu, thời gian, giá và động từ. Không dùng đoạn giải thích dài, dấu • để thuyết minh hoặc câu quảng cáo. Tờ tuyển dụng nhỏ, đủ nhiều tin trong một màn; CV và phỏng vấn mở màn riêng.
5. Không đưa ghi chú phát triển vào game. Không hiển thị “làm sau”, “mở sau”, “sẽ bổ sung”, “thử nghiệm”, mô tả kỹ thuật, lưu trữ hay kế hoạch ở giao diện. Chức năng chưa làm thì ẩn; điều kiện thật dùng nhãn gọn như “Cần chứng chỉ” hoặc “Khóa”. Kế hoạch và giới hạn ghi trong docs/HANDOVER.md.
6. Giữ nguyên ảnh nền đã được chủ dự án chốt, trừ khi có yêu cầu thay. Không đổi framework, xóa save hoặc đổi audience Site vì chỉnh UI.
7. Luồng tuyển dụng: bằng CNTT, chỉ ứng tuyển IT; CV hôm nay, phỏng vấn ngày kế tiếp, nhận việc từ ngày sau khi đậu. Đồng hồ, khoảng cách, tiền và dữ liệu lưu phải dùng domain hiện có.
8. Không tải ZIP hoặc tài liệu lên Drive nếu chưa được yêu cầu. Khi được yêu cầu, dùng thư mục game và bàn giao hiện có; cập nhật bàn giao hiện hành, giữ lịch sử có phiên bản, không gửi trùng nhiều gói.

9. Cỡ chữ theo thang 5 bậc (`public/type-scale.css`, chốt 05/11): số liệu lớn 22px đậm (`t-stat`, ví dụ "10 phút", số dư), tiêu đề 16px đậm (`t-title`), nội dung 13px (`t-body`), phụ 11px (`t-note`), tối thiểu 10px (`t-min`, chỉ chip và huy hiệu). Màn mới dùng biến `--fs-*` hoặc lớp `t-*`, không đặt px rời; không dùng chữ dưới 10px. Màn cũ đổi dần khi chạm tới.
10. Mua sắm (TTTM và điện thoại): màn đầu là các ô mục sản phẩm, không thanh tab; thanh trên chỉ có Giỏ hàng và Kho (điện thoại: Đơn hàng). Thẻ đồ có nút "i" mở bảng thông tin riêng theo loại (`domain/specs.ts`).

Nguồn: chỉ đạo trực tiếp của chủ dự án ngày 30/10/2026. Đọc docs/HANDOVER.md trước khi tiếp tục.
