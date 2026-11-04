# Issue #89 — Lô 3: 18 chân dung NPC

Chân dung từ vai trở lên cho 12 nhân vật trong `CAST` và 6 nhân vật trong `EXTRAS`, theo `app/src/domain/npc.ts`. Claude thay avatar chữ cái ở giao diện sau theo phân công trong issue.

## Tệp dùng trong game

`app/public/assets/npc/<id>.webp`, giữ nguyên ID:

| ID | Nhân vật | Tuổi |
|---|---|---|
| `ba-tu` | Bà Tư | 62 |
| `dev-an` | Minh An | 26 |
| `dev-linh` | Thảo Linh | 24 |
| `dev-huy` | Gia Huy | 29 |
| `dev-trang` | Thu Trang | 33 |
| `co-hanh` | Cô Hạnh | 48 |
| `chu-sau` | Chú Sáu | 67 |
| `tuan` | Tuấn | 22 |
| `chi-mai` | Chị Mai | 35 |
| `bs-quan` | Bác sĩ Quân | 41 |
| `bao-ngoc` | Bảo Ngọc | 27 |
| `me` | Mẹ | 50 |
| `chu-luc` | Chú Lực | 52 |
| `ba-nam` | Bà Năm | 70 |
| `lan` | Mai Lan | 28 |
| `minh` | Đức Minh | 45 |
| `ha` | Ngọc Hà | 31 |
| `bao` | Quốc Bảo | 34 |

## Thiết kế và nguồn

Phong cách sách truyện đồng bộ với lô 1–2: nét nâu mảnh, pastel ấm, màu loang nhẹ, nét mặt mềm và rõ khi thu nhỏ. Chân dung nhìn thẳng hoặc hơi nghiêng, biểu cảm bám tính cách; tuổi và màu áo định hướng lấy từ hồ sơ game. Kiểu tóc, hình dáng mặt, kính và râu được thiết kế riêng để dễ phân biệt. Không thay đổi hồ sơ hoặc tính cách trong mã nguồn.

Mỗi người là nhân vật Việt Nam hư cấu, được vẽ mới bằng mô tả chữ, không dùng ảnh người thật, ảnh mẫu bên ngoài hoặc người nổi tiếng làm tham chiếu. Không có chữ, logo, huy hiệu, cảnh nền, khung tròn hoặc bóng đổ ngoài người trong sprite. Màu áo dùng gần trường `tone` của từng NPC; đây là màu định hướng cho tranh có loang, không phải palette index bắt buộc cho mọi pixel.

Nguồn: công cụ tạo ảnh tích hợp OpenAI trong phiên Codex ngày 04/11/2026, mỗi chân dung một lần tạo riêng. `prompts.json` lưu prompt chung, prompt đầy đủ từng ảnh, thiết kế ngoại hình và hồ sơ dùng để đối chiếu. Sharp chỉ căn khung, thu nhỏ, xuất WebP và ghép bản kiểm tra.

## Khung và vùng cắt tròn

- Mỗi ảnh WebP RGBA 256×256 px, dưới **40.000 byte**.
- Neo tâm `[128,128]`, nền alpha thật, lề ít nhất 18 px.
- **Toàn bộ vùng alpha của người nằm trong vòng tròn tâm `[128,128]`, đường kính 220 px**, bao gồm tóc, cằm và vai. Đạt bằng thu đồng đều, không cắt phần người hoặc gắn mặt nạ tròn vào tệp gốc.
- `manifest.json` ghi vùng alpha, tâm, lề, bán kính alpha lớn nhất, số pixel alpha nằm ngoài vòng tròn, mức nén, dung lượng và SHA-256 từng tệp.
- Ưu tiên nén WebP lossless; khi vượt giới hạn dung lượng thì dùng quality 95 và giảm dần nếu cần, giữ alphaQuality 100.

Chân dung là ảnh nhìn ngang tầm mắt theo yêu cầu riêng của lô 3; không áp dụng phép chiếu sàn isometric, footprint ô hoặc hướng a/b của đồ nội thất.

## Kiểm tra và xem trước

- Giải mã lại đủ 18 tệp sau nén; kiểm tra khung, kênh alpha, lề, tâm, dung lượng và không có pixel alpha ngoài vòng tròn Ø220.
- Đối chiếu đúng 18 ID, tên, tuổi, vai trò và màu áo định hướng với `CAST`/`EXTRAS` hiện tại.
- `previews/lot-3.webp`: đủ 18 người, tên/tuổi/ID và vòng mảnh biểu thị vùng cắt tròn an toàn, kèm thumbnail 40 px trên nền tối.
- `previews/mobile-380.webp`: khung rộng đúng 380 px; mỗi chân dung ở 64 px, hàng trên là ảnh gốc trên nền sáng, hàng dưới là phép cắt tròn Ø220 trên nền màu `tone`, bao quanh bằng nền tối để kiểm tra mép alpha.

Chữ, vòng tròn và nền trong ảnh ghép chỉ phục vụ review, không nằm trong sprite. Phép cắt tròn chỉ áp dụng lên bản sao xem trước; tệp dùng trong game vẫn RGBA trong suốt không cắt tròn.

PR chỉ thêm ảnh và tài liệu asset, không sửa TypeScript, logic, save hoặc dữ liệu cân bằng. Không chạy engine/build vì không thay mã nguồn; phần thay avatar và kiểm tra trong UI do Claude thực hiện sau. Nét mặt và độ đồng bộ phong cách cần review bằng mắt qua ảnh ghép.
