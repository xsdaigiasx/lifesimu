# Issue #89 — Lô 1: món ăn và nguyên liệu

Bản duyệt phong cách sách truyện cho **11 món ăn và 6 nguyên liệu**. Đây là lô 1/6 của #89 (phần bản đồ chuyển sang #97); cần chủ dự án duyệt phong cách trước khi thực hiện các lô sau. Claude nối ảnh món ăn vào giao diện theo issue.

## Tệp dùng trong game

| Thư mục | ID |
|---|---|
| `app/public/assets/meals/` | `eggRice`, `porkRice`, `tofuRice`, `fishRice`, `canhChua`, `banhMi`, `comTam`, `pho`, `setLunch`, `hotpot`, `steak` |
| `app/public/assets/ingredients/` | `rice`, `egg`, `vegetable`, `pork`, `tofu`, `fish` |

Tên tệp là `<id>.webp`, giữ nguyên chữ hoa/thường theo `RECIPES`, `EAT_OUT` và `INGREDIENTS` trong `app/src/domain/life.ts`. Sáu nguyên liệu thay bộ #60 tại đúng tên tệp đang dùng.

## Phong cách

Vẽ mới bằng mô tả chữ: nét mực nâu mảnh hơi run tay, hình khối tròn, bảng màu pastel ấm, lớp màu loang nhẹ bên trong vật, mặt trên sáng hơn và mặt phải tối nhẹ. Không bóng đổ ra ngoài vật, nền màu, chữ, logo hoặc thương hiệu. Góc nhìn hơi chếch từ trên; prompt yêu cầu phép chiếu trực giao isometric 2:1.

Bảng màu định hướng: nâu `#4a3b33`, kem `#fbf3e2`, gỗ mật ong `#d9a066`, xanh lá `#9cc28a`, xanh ngọc `#7fb8b0`, hồng `#f2b8c6`, vàng bơ `#f4d58d`, xanh dương `#a9c4e4`, đỏ gạch `#d98276`. Đây là màu định hướng cho tranh có loang; không phải palette index bắt buộc cho từng pixel.

## Quy cách và kiểm chứng

- 17 ảnh WebP RGBA, khung 256×256 px, cạnh dài vùng vật khoảng 220 px.
- Căn giữa theo vùng alpha nhìn thấy, tâm neo `[128,128]`; lề trong suốt ít nhất 18 px ở cả bốn cạnh.
- Mỗi sprite dưới **40.000 byte**; dung lượng, vùng alpha, tâm, kiểu nén và SHA-256 trong `manifest.json`.
- Kiểm tra bằng cách giải mã lại từng WebP sau nén; kiểm tra kích thước, 4 kênh, alpha, lề và độ lệch tâm không quá 2 px.
- Xem trực tiếp đủ bộ trên nền kem và nền xanh đậm, kiểm tra ảnh thu nhỏ 64 px trong khung rộng 380 px.

Các ảnh là sprite thẻ hàng, không có footprint ô sàn; không áp dụng anchor chân đế hoặc xoay a/b của nội thất. Chữ và nền trong ảnh ghép chỉ phục vụ duyệt, không nằm trong sprite.

## Xem trước

- `previews/lot-1.webp`: đủ 17 ảnh, tên, ID, dung lượng; ảnh lớn trên nền sáng và ảnh 40 px trên nền tối.
- `previews/mobile-380.webp`: khung rộng đúng 380 px, từng sprite ở 64 px trên cả nền sáng và tối.
- `../ingredients/previews/ingredients.webp`: bộ 6 nguyên liệu hiện hành; metadata và prompt ở thư mục đó cũng được cập nhật cùng ảnh.

## Nguồn và xuất ảnh

Tạo bằng công cụ tạo ảnh tích hợp OpenAI trong phiên Codex ngày 04/11/2026; mỗi sprite một lần tạo riêng. **Không dùng ảnh đầu vào hoặc ảnh mẫu của người khác.** `prompts.json` lưu nguyên văn prompt chung và prompt đầy đủ từng ảnh, không chứa ảnh mẫu hay đường dẫn ảnh bên ngoài.

Sharp chỉ dùng để căn vùng alpha, thu nhỏ và xuất WebP; không vẽ lại nội dung. Vùng alpha từ 128 trở lên xác định hình nhìn thấy, chừa thêm 2 pixel nguồn trước khi thu nhỏ. Khung đích mới có nền alpha 0. Ưu tiên WebP lossless; nếu vượt 40.000 byte thì dùng quality 95, giảm dần khi cần, alphaQuality 100. Kiểu nén thực tế được ghi riêng cho từng tệp.

Đây là tranh raster do AI tạo; không phải mô hình 3D chung hoặc bản vẽ hình học được chứng nhận chính xác mọi cạnh. Duyệt độ đồng bộ nét, màu và góc nhìn qua ảnh ghép trước khi dùng làm chuẩn cho các lô sau.

PR chỉ có ảnh và tài liệu asset. Không sửa TypeScript, logic, save, số cân bằng hoặc tự gộp PR. Không chạy engine/build vì không thay mã nguồn; việc tích hợp và chơi thử trong giao diện do Claude làm sau theo issue.
