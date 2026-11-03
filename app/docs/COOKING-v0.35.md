# Minigame nấu ăn v0.35

Trong nhà → Bếp → chọn món → Nấu. Có ba lượt canh nhịp: Cắt, Đảo, Tắt bếp. Chạm nút khi kim chạy tới vùng xanh; hỗ trợ bàn phím qua button chuẩn. Các biểu tượng thớt/chảo/lửa và mặt trăng là SVG trong hệ Icon hiện có, không cần tài nguyên ảnh mới.

Mỗi lượt tính điểm 0–100 theo khoảng cách tới tâm mục tiêu (30/65/50 trên thanh 0–100); công thức max(0,100−4×khoảng cách), làm tròn. Kim chạy qua lại, nhanh hơn theo bước. Không có thời hạn buộc bấm. Điểm trung bình từ 80: Thơm ngon (×1,25 năng lượng/tâm trạng); từ 40: Vừa ăn (×1); dưới 40: Hơi cháy (×0,5 năng lượng, không cộng sức khỏe/tâm trạng). Thời hạn món ăn không thay đổi. Món cũ không có quality mặc định Vừa ăn.

Khi bắt đầu nấu, domain trừ nguyên liệu, 4 năng lượng và thời gian công thức một lần; lưu life.cooking với recipe/id/day/hits. Món ăn chỉ được tạo sau bước thứ ba, xóa cooking trong cùng transaction. Mỗi thao tác cần đúng ID và chỉ số bước, vị trí nguyên 0–100 và đang ở nhà; lượt gửi lặp không cấp món thêm. Chỉ một món đang nấu. Đóng cửa sổ/tải lại giữ số bước và điểm, kim chạy lại từ đầu bước chưa chơi. Dừng nấu mất nguyên liệu đã dùng, không có món. Không ngủ khi còn món đang nấu; hoàn thành hoặc Dừng nấu trước.

Component: src/components/CookingGame.tsx. Domain: src/domain/life.ts, src/domain/time.ts. CSS: public/static-scenes.css. Parser chấp nhận cooking/quality tùy chọn để tương thích save v0.34.

Kiểm chứng: npm test (20 suite), TypeScript và production build. life.test.cjs kiểm tra trừ nguyên liệu/thời gian một lần, chưa cấp món khi đang chơi, lưu/parse, chống lặp bước và phần thưởng, điểm ba hạng, năng lượng ăn món ngon, hủy không hoàn nguyên liệu, chặn ngủ, sai địa điểm/dữ liệu. qa-life.cjs chơi ba nút theo kim, tải lại giữa lượt, xác nhận icon ngủ và giao diện 320/390/1280px. Ảnh QA trong .qa-artifacts/life không đưa vào ZIP.
