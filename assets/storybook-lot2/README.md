# Issue #89 — Lô 2: sản phẩm trung tâm thương mại

Tám sprite thẻ hàng, tiếp nối phong cách sách truyện của lô 1. Claude nối vào khu trung tâm thương mại sau khi bộ ảnh được duyệt theo phân công trong issue.

## Tệp dùng trong game

Tất cả nằm tại `app/public/assets/products/<id>.webp`, giữ chính xác ID trong `PRODUCTS` của `app/src/domain/life.ts`.

| ID | Sản phẩm | Khu |
|---|---|---|
| `casual` | Bộ đồ thường ngày | Thời trang |
| `officeWear` | Bộ đồ công sở | Thời trang |
| `coat` | Áo khoác cao cấp | Thời trang |
| `headphones` | Tai nghe | Điện tử |
| `tv` | TV phòng trọ | Điện tử |
| `bicycle` | Xe đạp | Xe |
| `motorbike` | Xe máy | Xe |
| `scooter` | Xe tay ga | Xe |

## Phong cách và nguồn

Nét mực nâu mảnh hơi run tay, hình khối tròn, bảng màu pastel ấm, mảng màu loang nhẹ; mặt trên sáng và mặt phải tối hơn. Mô tả phong cách bằng chữ giống lô 1, yêu cầu góc nhìn trực giao isometric 2:1, nhìn hơi chếch từ trên. Không chữ, logo, thương hiệu, biển số, bóng đổ ra ngoài vật hoặc nền màu trong sprite.

Quần áo được bày thành bộ, không có người hoặc mannequin. Xe đạp, xe máy và xe tay ga có hình dáng khác nhau: xe máy lộ động cơ và có gác chân; xe tay ga có thân kín và sàn để chân. Mô tả xe yêu cầu thiết kế hư cấu, không dùng tên hoặc ảnh mẫu xe của hãng nào.

Tạo bằng công cụ tạo ảnh tích hợp OpenAI ngày 04/11/2026. Tám ảnh được tạo riêng từ mô tả chữ; xe tay ga được chỉnh một lượt trên chính ảnh vừa tạo để bỏ vùng loang ngoài vật, đổi đèn, tay nắm sau và bỏ các thanh trang trí thân xe. Không dùng ảnh mẫu bên ngoài hoặc ảnh của người khác. `prompts.json` lưu nguyên văn prompt chung, từng món và lượt chỉnh xe tay ga.

Sharp chỉ dùng để căn khung theo alpha, thu nhỏ và xuất WebP; không vẽ nội dung. Ưu tiên nén lossless; nếu vượt 40.000 byte thì dùng quality 95 và giảm khi cần, giữ alphaQuality 100. Mức nén thực tế và SHA-256 từng ảnh nằm trong `manifest.json`.

## Quy cách và kiểm tra

- Mỗi ảnh WebP RGBA 256×256 px; cạnh dài vùng vật khoảng 220 px, neo tâm `[128,128]`.
- Lề trong suốt ít nhất 18 px ở cả bốn cạnh, mỗi sprite dưới **40.000 byte**.
- Căn giữa theo vùng alpha nhìn thấy, lệch tâm không quá 2 px; giữ alpha sinh ra từ công cụ.
- Giải mã lại cả 8 tệp sau nén và kiểm tra khung, kênh alpha, lề, tâm và dung lượng.
- Đối chiếu đủ tám ID với `PRODUCTS`; xem trực tiếp ảnh lớn và ảnh 64 px trên nền sáng/tối trong khung rộng 380 px.

Đây là sprite thẻ hàng, không có footprint đặt đồ trên lưới phòng, không áp dụng anchor chân đế hoặc hướng a/b của nội thất. Tranh raster là hình minh họa, không phải bản dựng 3D có mọi cạnh được kiểm chứng hình học tuyệt đối.

## Xem trước

- `previews/lot-2.webp`: đủ 8 sản phẩm, tên và ID, dung lượng; ảnh lớn trên nền sáng, ảnh 40 px trên nền tối.
- `previews/mobile-380.webp`: khung rộng đúng 380 px, từng sprite ở 64 px trên hai nền.

Chữ và nền trong ảnh ghép chỉ dùng để review, không nằm trong sprite. PR chỉ thêm ảnh và tài liệu; không sửa TypeScript, logic, save hoặc số cân bằng. Không chạy engine/build vì không thay mã nguồn; chưa tích hợp ảnh vào giao diện trung tâm thương mại.
