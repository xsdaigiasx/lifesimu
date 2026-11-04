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
- **Điểm neo:** đỉnh dưới hình thoi chân đế, nằm chính giữa mép dưới ảnh.
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
