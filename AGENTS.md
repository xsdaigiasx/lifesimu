# Hướng dẫn cho Codex (và các agent khác)

Dự án: **Một đời để sống**, game mô phỏng đời sống kết hợp trang trí nhà isometric, chạy trên điện thoại qua trình duyệt, đưa lên Cloudflare Workers.

## Vai trò

| Ai | Làm | Không làm |
|---|---|---|
| Chủ dự án | Chốt quyết định, chơi thử, duyệt, gộp PR | — |
| Claude | Thiết kế, **code lõi** (`core/`), logic game, review mọi PR | Không tạo ảnh |
| **Codex** | **Tạo asset** (`assets/`): sprite đồ đạc, vỏ phòng, cửa, icon, ảnh địa điểm; nối asset vào giao diện **khi Issue giao rõ** | Không sửa `core/`, save, sổ cái, số liệu cân bằng (`core/data/`) |

## Cách nhận và nộp việc

1. Chỉ làm việc có **Issue**. Đọc kỹ phần Phạm vi, Ngoài phạm vi, Nghiệm thu.
2. Tạo nhánh `codex/<số-issue>-<tên-ngắn>`, ví dụ `codex/3-asset-phong-tro`.
3. Mở **pull request** vào `main`, ghi `Closes #<số>`, điền đủ mẫu PR.
4. Claude review và bình luận theo mức **Chặn / Nên sửa / Gợi ý**. Sửa hết mức Chặn trên cùng nhánh.
5. Không tự gộp PR. Chủ dự án gộp.

## Quy cách asset isometric (bắt buộc)

- Ô sàn hình thoi **128×64 px**, camera trực giao 2:1. 1 đơn vị cao (z) = 32 px.
- **Điểm neo:** đỉnh dưới hình thoi chân đế, là điểm ảo của footprint nguồn (không nhất thiết nằm trên mép ảnh), cách mép trái **x × 64 px** (x là số ô chân đế nguồn theo trục x; renderer chuyển về tâm theo quy tắc #366 bên dưới). Chân đế vuông (x = y) thì ở giữa mép dưới; chữ nhật (ví dụ 2×1: x = 128 trên khung rộng 192) thì lệch giữa. Ghi điểm neo thực trong manifest.
- Khung ảnh: rộng = (x + y) × 64; cao = (x + y) × 32 + chiều cao px (x, y là số ô chân đế).
- Phong cách (chốt 04/11, #133): **bán hiện thực** như `assets/style-reference/room-reference.webp`: tô khối mềm, thấy chất liệu, viền mảnh cùng tông, ánh sáng cố định từ trên-trái, **không bóng đổ ra ngoài chân đế**, nền trong suốt. Bóng theo giờ do code vẽ. Món ăn giữ phong cách món hiện có.
- Hướng: `a` là mặt trước nhìn xuống-trái, `b` nhìn xuống-phải. Đồ đối xứng chỉ cần 1 ảnh.
- Tên file: `assets/<nhóm>/<id>_<hướng>_<biến-thể>.png`, ví dụ `assets/furniture/bed-basic_a_sage.png`.
- Mỗi ảnh dưới **150 KB** (PNG đã nén hoặc WebP). Không chữ, logo, thương hiệu hay nhân vật có bản quyền.
- Mỗi lô asset nộp kèm **ảnh ghép xem trước** đặt các món lên lưới phòng, và file `assets/<nhóm>/manifest.json` liệt kê id, chân đế, cao, hướng, biến thể.

## Quy tắc code (khi được giao phần giao diện)

- Giao diện chỉ đọc state và gửi lệnh; không tự đổi tiền, XP, chỉ số.
- Mọi thay đổi tiền đi qua sổ cái (`applySaveTx`) với `txId` ổn định.
- Không dùng `Math.random`; dùng `RngHub.stream(...)` của lõi.
- Không hard-code số cân bằng; không reset save của người chơi.
- Chạy `cd core && npm run check` trước khi mở PR nếu có đụng TypeScript.
- Phải chạy tốt ở chiều rộng điện thoại (khoảng 380 px).

## Nguyên tắc giao diện (chốt 04/11)

- Mỗi màn một việc; không nhồi nhiều việc vào một chỗ (ví dụ chợ: chọn quầy rồi mới vào quầy).
- Danh sách đồ dạng lưới thẻ có ảnh như siêu thị, không dạng dòng chữ.
- Thông tin phụ dùng biểu tượng kèm số (đồng hồ 3 ngày, hộp 2) thay cho câu chữ; không dùng dấu "•" hay "·".
- Nút cùng nhóm cùng kích thước, chữ thẳng hàng; không lặp tiêu đề, không dòng mô tả thừa.

## Đặt nội thất — chốt 07/11/2026 (#366)

- Phòng vẫn chia ô isometric 2:1. Vùng chiếm chỗ dùng ô nguyên, độc lập với khung PNG/WebP. Ghế 1×1 ô; giường đơn 1×2 ô, xoay thành 2×1.
- Phần chân/đáy tiếp xúc sàn phải nằm trọn và căn giữa vùng ô chiếm chỗ, có khoảng hở với mép. Lưng ghế, tủ, đầu giường được vươn lên theo chiều cao; không ép toàn bộ ảnh vào hình thoi.
- Đọc footprint nguồn `fw/fh` và neo `ax/ay` từ manifest. Đổi neo đỉnh dưới sang tâm chân đế rồi thu đồng đều theo cả hai trục footprint; không kéo méo ảnh hoặc lấy tâm khung ảnh làm tâm chân.
- Render phòng trọ, nhà, preview kéo dùng cùng phép căn. Va chạm, lối đi và vùng chọn vẫn theo footprint đầy đủ, không theo alpha ảnh hay kích thước đã thu nhỏ.
- Kéo thả bám ô nguyên. Xoay giữ góc gốc ô, đổi chiều footprint và kiểm tra biên/chồng đồ trước khi nhận. Không âm thầm đẩy đồ khác. Save nửa ô cũ vẫn đọc được; đồ đó bám lại ô nguyên khi kéo/xoay.
- Đồ treo tường dùng neo tường riêng; đồ trên bàn neo theo mặt bàn, không cộng thêm nửa ô như đồ sàn.
- Asset mới phải khai báo đúng chân đế cho từng hướng; kiểm tra đủ cấp đồ và bốn hướng. Renderer không thể sửa một ảnh vẽ sai phối cảnh. Bộ hiện tại giữ nguyên ảnh, thu chân đế 90%; ghế văn phòng 75%.
